import uvicorn
from typing import Optional
from fastapi import FastAPI, Query, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from pydantic import BaseModel
from scraper import perform_ai_grounded_search, get_clean_document, set_api_key, get_api_status, ApiKeyRequiredException
from rag_engine import perform_custom_rag_search

class KeyConfigRequest(BaseModel):
    api_key: str

app = FastAPI(
    title="JW Search API",
    description="Backend de consulta de informações do jw.org e wol.jw.org com suporte a Inteligência Artificial",
    version="1.4.0"
)

# Configure CORS so both local web frontend and Android app can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/search")
def api_search(
    q: str = Query(..., description="Termo de pesquisa"),
    external: bool = Query(False, description="Incluir fontes externas da internet"),
    lang: str = Query("pt", description="Código de idioma (ex: pt, en, es)"),
    provider: str = Query("gemini", description="Provedor de IA: gemini, deepseek, hy3, openai"),
    model: Optional[str] = Query(None, description="Modelo específico (ex: deepseek-chat, hy3, gpt-4o-mini)"),
    base_url: Optional[str] = Query(None, description="Endpoint base customizado da API"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_deepseek_api_key: Optional[str] = Header(None, alias="X-Deepseek-Api-Key"),
    x_hy3_api_key: Optional[str] = Header(None, alias="X-Hy3-Api-Key"),
    x_api_key: Optional[str] = Header(None, alias="X-Api-Key"),
    api_key: Optional[str] = Query(None, description="Chave API opcional do cliente")
):
    if not q.strip():
        return {"ai_response": "", "results": []}
    
    prov = (provider or "hy3").lower()
    
    # 1. Custom Theocratic RAG for DeepSeek
    if prov == "deepseek":
        active_key = x_deepseek_api_key or x_api_key or api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not active_key:
            # Fallback to Hy3 or Gemini if available
            hy3_key = x_hy3_api_key or os.environ.get("HY3_API_KEY") or os.environ.get("OPENAI_API_KEY")
            if hy3_key:
                print("DeepSeek key not found. Falling back to Hy3...")
                return perform_custom_rag_search(query=q.strip(), provider="hy3", api_key=hy3_key, include_external=external, lang=lang)
            raise HTTPException(
                status_code=401,
                detail="Chave da API do DeepSeek não informada. Adicione sua chave nas configurações para pesquisar."
            )
        try:
            return perform_custom_rag_search(
                query=q.strip(),
                provider="deepseek",
                api_key=active_key,
                base_url=base_url,
                model=model,
                include_external=external,
                lang=lang
            )
        except Exception as e:
            # Fallback to Gemini on error
            try:
                gemini_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
                return perform_ai_grounded_search(q.strip(), include_external=external, lang=lang, custom_api_key=gemini_key)
            except Exception:
                raise HTTPException(status_code=500, detail=str(e))

    # 2. Primary Default: Hy3 / Tencent / OpenRouter (with automatic fallback to Gemini)
    elif prov in ["hy3", "tencent", "hunyuan", "openai"]:
        active_key = x_hy3_api_key or x_api_key or api_key or os.environ.get("HY3_API_KEY") or os.environ.get("OPENAI_API_KEY")
        gemini_key = x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
        has_gemini = bool(gemini_key)
        
        if not active_key:
            # If Hy3 has no key, try Gemini fallback immediately if available
            if has_gemini:
                print("Hy3 key not found. Falling back to Google Gemini Grounding...")
                try:
                    return perform_ai_grounded_search(q.strip(), include_external=external, lang=lang, custom_api_key=gemini_key)
                except Exception as g_err:
                    raise HTTPException(
                        status_code=401,
                        detail="Nenhuma chave ativa encontrada (Hy3 ou Gemini). Configure sua chave gratuita nas configurações para pesquisar."
                    )
            raise HTTPException(
                status_code=401,
                detail="Chave da API (Hy3/OpenRouter) não informada. Adicione sua chave nas configurações para pesquisar."
            )
        try:
            return perform_custom_rag_search(
                query=q.strip(),
                provider=prov,
                api_key=active_key,
                base_url=base_url,
                model=model,
                include_external=external,
                lang=lang
            )
        except Exception as e:
            if has_gemini:
                print(f"Hy3 failed ({e}). Attempting automatic fallback to Google Gemini...")
                try:
                    return perform_ai_grounded_search(q.strip(), include_external=external, lang=lang, custom_api_key=gemini_key)
                except Exception as g_err:
                    pass
            raise HTTPException(
                status_code=429 if "429" in str(e) else 500,
                detail="As cotas padrão do Hy3 e do Gemini falharam. Adicione sua própria chave gratuita no painel de configurações para continuar pesquisando sem limites."
            )

    # 3. Google Gemini with Grounding (with auto-fallback to Hy3)
    else:
        client_key = x_gemini_api_key or x_api_key or api_key
        hy3_key = x_hy3_api_key or os.environ.get("HY3_API_KEY") or os.environ.get("OPENAI_API_KEY")
        try:
            return perform_ai_grounded_search(q.strip(), include_external=external, lang=lang, custom_api_key=client_key)
        except ApiKeyRequiredException:
            if hy3_key:
                print("Gemini key required. Falling back to Hy3 RAG...")
                return perform_custom_rag_search(query=q.strip(), provider="hy3", api_key=hy3_key, include_external=external, lang=lang)
            raise HTTPException(status_code=401, detail="Chave do Google Gemini não informada. Adicione sua chave nas configurações.")
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower() or "500" in err_str:
                if hy3_key:
                    print("Gemini failed/quota exhausted. Automatically falling back to Hy3 RAG engine...")
                    return perform_custom_rag_search(
                        query=q.strip(),
                        provider="hy3",
                        api_key=hy3_key,
                        include_external=external,
                        lang=lang
                    )
                raise HTTPException(
                    status_code=429,
                    detail="Cota da API do Gemini esgotada. Configure sua chave gratuita do Hy3 ou DeepSeek nas configurações."
                )
            raise HTTPException(status_code=500, detail=err_str)



@app.get("/api/read")
def api_read(
    url: str = Query(..., description="URL absoluta do documento wol.jw.org")
):
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL inválida")
    try:
        content = get_clean_document(url.strip())
        if not content:
            raise HTTPException(status_code=404, detail="Documento não encontrado ou erro ao acessar")
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config")
def api_get_config():
    return get_api_status()

@app.post("/api/config")
def api_set_config(data: KeyConfigRequest):
    success, msg = set_api_key(data.api_key)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg, "has_key": True}

# Locate and mount static files to serve the web frontend
web_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "web")),
    os.path.abspath("web")
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
            "api_read": "/api/read?url=https://wol.jw.org/pt/wol/d/r5/lp-t/1200002781"
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

