import uvicorn
from typing import Optional, List, Literal
from fastapi import FastAPI, Query, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from pydantic import BaseModel, Field, model_validator
from scraper import get_clean_document, get_api_status
from bible import fetch_verse_content
from rag_engine import search_wol_direct
from safety import provider_endpoint, deadline, SearchDeadline, UnsafeURL
from research import run_research
from middleware import RequestBoundary
from study_tools import ToolOptions
import time
import threading
from urllib.parse import quote

_search_slots = threading.BoundedSemaphore(4)


class KeyConfigRequest(BaseModel):
    api_key: str


app = FastAPI(
    title="JW Search API",
    description="Backend de consulta de informações do jw.org e wol.jw.org com suporte a Inteligência Artificial",
    version="2.19.0",
)

# Configure CORS so both local web frontend and Android app can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestBoundary)

import re
from io import BytesIO
import docx
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fastapi.responses import Response


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=25000)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=40)
    provider: Literal[
        "hy3", "gemini", "deepseek", "openai", "openrouter", "tencent", "hunyuan"
    ] = "hy3"
    model: Optional[str] = Field(default=None, max_length=150)
    base_url: Optional[str] = Field(default=None, max_length=300)
    include_external: bool = False
    lang: Literal["pt", "en", "es"] = "pt"
    mode: Literal["quick", "deep"] = "quick"
    tool: Optional[ToolOptions] = None

    @model_validator(mode="after")
    def limit_context(self):
        if sum(len(m.content) for m in self.history) > 100000:
            raise ValueError("Histórico maior que o limite; inicie um novo estudo.")
        if self.tool and any(len(r) > 120 for r in self.tool.selected_references):
            raise ValueError("Referência selecionada muito longa.")
        return self


class ExportDocxRequest(BaseModel):
    title: str = Field(default="Estudo Teocrático - JW Search", max_length=200)
    content: str = Field(max_length=200000)


def create_theocratic_docx(title: str, markdown_content: str) -> BytesIO:
    doc = docx.Document()

    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Document Header
    header = doc.add_heading(title, level=0)
    header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if header.runs:
        header.runs[0].font.color.rgb = RGBColor(30, 41, 59)
        header.runs[0].font.name = "Calibri"

    p_sub = doc.add_paragraph(
        "Documento de Estudo Bíblico gerado via JW Search (Fontes: wol.jw.org e jw.org)"
    )
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if p_sub.runs:
        p_sub.runs[0].font.italic = True
        p_sub.runs[0].font.size = Pt(9.5)
        p_sub.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()  # Spacer

    # Simple Markdown parser for Docx
    lines = markdown_content.split("\n")
    in_table = False
    table_rows = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_table and table_rows:
                # Render table
                _render_docx_table(doc, table_rows)
                in_table = False
                table_rows = []
            continue

        # Check Table row
        if stripped.startswith("|") and stripped.endswith("|"):
            if "---" in stripped:
                continue  # Header divider line
            in_table = True
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            table_rows.append(cells)
            continue
        elif in_table and table_rows:
            _render_docx_table(doc, table_rows)
            in_table = False
            table_rows = []

        # Headings
        if stripped.startswith("### "):
            h = doc.add_heading(stripped[4:], level=2)
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(30, 58, 138)
        elif stripped.startswith("## "):
            h = doc.add_heading(stripped[3:], level=1)
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(15, 23, 42)
        elif stripped.startswith("# "):
            h = doc.add_heading(stripped[2:], level=0)
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(15, 23, 42)
        elif stripped.startswith("- ") or stripped.startswith("* "):
            p = doc.add_paragraph(style="List Bullet")
            _add_markdown_runs(p, stripped[2:])
        elif re.match(r"^\d+\.\s", stripped):
            p = doc.add_paragraph(style="List Number")
            _add_markdown_runs(p, re.sub(r"^\d+\.\s", "", stripped))
        elif stripped.startswith(">"):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            _add_markdown_runs(p, stripped.lstrip("> "))
            if p.runs:
                p.runs[0].font.italic = True
                p.runs[0].font.color.rgb = RGBColor(71, 85, 105)
        else:
            p = doc.add_paragraph()
            _add_markdown_runs(p, stripped)

    if in_table and table_rows:
        _render_docx_table(doc, table_rows)

    doc_io = BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    return doc_io


def _add_markdown_runs(paragraph, text):
    parts = re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith("*") and part.endswith("*"):
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        elif part.startswith("[") and "](" in part and part.endswith(")"):
            m = re.match(r"\[([^\]]+)\]\(([^)]+)\)", part)
            if m:
                label, url = m.groups()
                run = paragraph.add_run(f"{label} ({url})")
                run.font.color.rgb = RGBColor(37, 99, 235)
                run.underline = True
            else:
                paragraph.add_run(part)
        else:
            paragraph.add_run(part)


def _render_docx_table(doc, rows):
    if not rows:
        return
    col_count = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=col_count)
    table.style = (
        "Light Shading Accent 1"
        if "Light Shading Accent 1" in [s.name for s in doc.styles]
        else "Table Grid"
    )
    for r_idx, row in enumerate(rows):
        for c_idx, cell_text in enumerate(row):
            if c_idx < col_count:
                cell = table.cell(r_idx, c_idx)
                cell.text = cell_text
                if r_idx == 0:
                    for run in cell.paragraphs[0].runs:
                        run.bold = True
    doc.add_paragraph()  # Spacing after table


@app.post("/api/chat")
def api_chat(
    req: ChatRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_deepseek_api_key: Optional[str] = Header(None, alias="X-Deepseek-Api-Key"),
    x_hy3_api_key: Optional[str] = Header(None, alias="X-Hy3-Api-Key"),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
):
    return handle_theocratic_search(
        q=req.query,
        mode=req.mode,
        tool=req.tool,
        external=req.include_external,
        lang=req.lang,
        provider=req.provider,
        model=req.model,
        base_url=req.base_url,
        history=[{"role": m.role, "content": m.content} for m in req.history],
        x_gemini_api_key=x_gemini_api_key,
        x_deepseek_api_key=x_deepseek_api_key,
        x_hy3_api_key=x_hy3_api_key,
        x_api_key=x_api_key,
    )


@app.post("/api/export/docx")
def api_export_docx(data: ExportDocxRequest):
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo vazio para exportação.")
    try:
        docx_io = create_theocratic_docx(data.title, data.content)
        return Response(
            content=docx_io.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=estudo.docx; filename*=UTF-8''"
                + quote(re.sub(r"[\x00-\x1f/\\]", "_", data.title[:80]) + ".docx")
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar DOCX: {e}")


@app.get("/api/verse")
def api_get_verse(
    ref: str = Query(
        ..., max_length=120, description="Bible reference, e.g. 'Hebreus 11:24-25'"
    ),
    lang: str = "pt",
):
    if not ref or not ref.strip():
        raise HTTPException(status_code=400, detail="Referência bíblica vazia.")
    verse_data = fetch_verse_content(ref.strip(), lang=lang)
    if not verse_data:
        raise HTTPException(
            status_code=404, detail="Texto bíblico não encontrado no acervo."
        )
    return verse_data


def handle_theocratic_search(
    q,
    external=False,
    lang="pt",
    provider="hy3",
    model=None,
    base_url=None,
    history=None,
    x_gemini_api_key=None,
    x_deepseek_api_key=None,
    x_hy3_api_key=None,
    x_api_key=None,
    api_key=None,
    mode="quick",
    tool=None,
):
    if not q.strip() or len(q) > 4000:
        raise HTTPException(422, "A pergunta deve conter entre 1 e 4.000 caracteres.")
    if api_key:
        raise HTTPException(
            400, "Envie a chave no cabeçalho da requisição, nunca na URL."
        )
    try:
        prov, endpoint = provider_endpoint(provider, base_url)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    keys = {
        "gemini": x_gemini_api_key or os.environ.get("GEMINI_API_KEY"),
        "deepseek": x_deepseek_api_key or os.environ.get("DEEPSEEK_API_KEY"),
        "hy3": x_hy3_api_key or os.environ.get("HY3_API_KEY"),
    }
    key = x_api_key or keys[prov]
    if not key:
        raise HTTPException(
            401,
            f"Chave do {prov.title()} não configurada. Selecione um provedor com chave nas configurações.",
        )
    if not _search_slots.acquire(blocking=False):
        raise HTTPException(
            429,
            "Há pesquisas em andamento. Aguarde antes de tentar novamente.",
            headers={"Retry-After": "10"},
        )
    token = deadline.set(time.monotonic() + (150 if mode == "deep" else 75))
    try:
        return run_research(
            q.strip(),
            history or [],
            prov,
            key,
            endpoint,
            model,
            mode,
            lang,
            external,
            tool,
        )
    except (SearchDeadline, TimeoutError) as exc:
        raise HTTPException(
            504,
            "A pesquisa atingiu seu limite de tempo. Tente reduzir o assunto ou usar o modo amplo.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
        if status in (408, 504):
            raise HTTPException(
                504, "O provedor não respondeu dentro do prazo."
            ) from exc
        if status in (401, 403):
            raise HTTPException(
                401, "O provedor recusou a credencial. Confira a chave configurada."
            ) from exc
        if status == 429:
            raise HTTPException(
                429,
                "O provedor atingiu o limite de uso. Aguarde ou selecione outro provedor.",
            ) from exc
        if status == 404:
            raise HTTPException(
                400, "O modelo selecionado não está disponível neste provedor."
            ) from exc
        if "timeout" in type(exc).__name__.lower():
            raise HTTPException(
                504, "O provedor não respondeu dentro do prazo."
            ) from exc
        raise HTTPException(
            503,
            "Não foi possível concluir a pesquisa no provedor selecionado. Tente novamente mais tarde.",
        ) from exc
    finally:
        deadline.reset(token)
        _search_slots.release()


@app.get("/api/search")
def api_search(
    q: str = Query(..., min_length=1, max_length=4000, description="Termo de pesquisa"),
    external: bool = Query(False, description="Incluir fontes externas da internet"),
    lang: Literal["pt", "en", "es"] = Query(
        "pt", description="Código de idioma (ex: pt, en, es)"
    ),
    provider: str = Query(
        "hy3", description="Provedor de IA: hy3, gemini, deepseek, openai"
    ),
    model: Optional[str] = Query(None, description="Modelo específico"),
    base_url: Optional[str] = Query(
        None, description="Endpoint base customizado da API"
    ),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_deepseek_api_key: Optional[str] = Header(None, alias="X-Deepseek-Api-Key"),
    x_hy3_api_key: Optional[str] = Header(None, alias="X-Hy3-Api-Key"),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
    api_key: Optional[str] = Query(None, description="Chave API opcional do cliente"),
):
    return handle_theocratic_search(
        q=q,
        external=external,
        lang=lang,
        provider=provider,
        model=model,
        base_url=base_url,
        history=None,
        x_gemini_api_key=x_gemini_api_key,
        x_deepseek_api_key=x_deepseek_api_key,
        x_hy3_api_key=x_hy3_api_key,
        x_api_key=x_api_key,
        api_key=api_key,
    )


@app.get("/api/read")
def api_read(
    url: str = Query(
        ..., max_length=2048, description="URL absoluta do documento wol.jw.org"
    ),
    title: Optional[str] = Query(
        None, description="Título do artigo clicado para validação"
    ),
):
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL inválida")
    try:
        content = get_clean_document(url.strip(), requested_title=title)
        if not content:
            raise HTTPException(
                status_code=404, detail="Documento não encontrado ou erro ao acessar"
            )
        return {"content": content}
    except HTTPException:
        raise
    except UnsafeURL as e:
        raise HTTPException(400, str(e))
    except Exception:
        raise HTTPException(502, "Não foi possível ler esta fonte.")


@app.get("/healthz")
def healthz():
    return {"status": "ok", "version": "2.19.0"}


@app.get("/api/config")
def api_get_config():
    return get_api_status()


@app.get("/api/diagnostics")
def api_diagnostics():
    import time

    report = {
        "status": "online",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "providers": {},
    }

    # 1. Test WOL scraper speed
    t0 = time.time()
    try:
        wol_res = search_wol_direct("amor leal", lang="pt", max_results=3)
        wol_time = round((time.time() - t0) * 1000, 1)
        report["providers"]["wol_library"] = {
            "status": "ok" if wol_res else "empty",
            "latency_ms": wol_time,
            "sample_results": len(wol_res),
        }
    except Exception as e:
        report["providers"]["wol_library"] = {"status": "error", "error": str(e)}

    # 2. Check Gemini config
    gemini_key = os.environ.get("GEMINI_API_KEY")
    report["providers"]["gemini"] = {
        "configured": bool(gemini_key),
        "status": "ready" if gemini_key else "not_configured",
    }

    # 3. Check Hy3 config
    hy3_key = os.environ.get("HY3_API_KEY")
    report["providers"]["hy3_openrouter"] = {
        "configured": bool(hy3_key),
        "status": "ready" if hy3_key else "not_configured",
    }

    # 4. Check DeepSeek config
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
    report["providers"]["deepseek"] = {
        "configured": bool(deepseek_key),
        "status": "ready" if deepseek_key else "not_configured",
    }

    return report


@app.post("/api/config")
def api_set_config(data: KeyConfigRequest):
    raise HTTPException(
        405,
        "A configuração global não pode ser alterada pela API pública. Use chaves por requisição ou variáveis no servidor.",
    )


# Locate and mount static files to serve the web frontend
web_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "web")),
    os.path.abspath("web"),
]
web_dir = next((p for p in web_candidates if os.path.exists(p)), None)

if web_dir:
    app.mount("/", StaticFiles(directory=web_dir, html=True), name="web")
else:

    @app.get("/")
    def read_root():
        return {
            "message": "JW Search API está rodando. O diretório do frontend web '/web' não foi encontrado para ser servido na raiz.",
            "api_search": "/api/search?q=termo&external=false",
            "api_read": "/api/read?url=https://wol.jw.org/pt/wol/d/r5/lp-t/1200002781",
        }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
