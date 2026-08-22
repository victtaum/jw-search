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
    
    prov = (provider or "gemini").lower()
    
    # 1. Custom Theocratic RAG for DeepSeek
    if prov == "deepseek":
        active_key = x_deepseek_api_key or x_api_key or api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not active_key:
            raise HTTPException(
                status_code=401,
                detail="Chave da API do DeepSeek não informada. Adicione sua chave nas configurações para pesquisar com DeepSeek."
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
            raise HTTPException(status_code=500, detail=str(e))

    # 2. Custom Theocratic RAG for Hy3 / Tencent / OpenAI-compatible
    elif prov in ["hy3", "tencent", "hunyuan", "openai"]:
        active_key = x_hy3_api_key or x_api_key or api_key or os.environ.get("HY3_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not active_key:
            raise HTTPException(
                status_code=401,
                detail=f"Chave da API ({prov.upper()}) não informada. Adicione sua chave nas configurações para pesquisar."
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
            raise HTTPException(status_code=500, detail=str(e))

    # 3. Default: Google Gemini with Grounding (with auto-fallback when quota runs out)
    else:
        client_key = x_gemini_api_key or x_api_key or api_key
        try:
            return perform_ai_grounded_search(q.strip(), include_external=external, lang=lang, custom_api_key=client_key)
        except ApiKeyRequiredException as e:
            raise HTTPException(status_code=401, detail=str(e))
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                # Check if DeepSeek or Hy3 keys are available for automatic fallback
                deepseek_key = x_deepseek_api_key or os.environ.get("DEEPSEEK_API_KEY")
                if deepseek_key:
                    print("Gemini quota exhausted. Automatically falling back to DeepSeek RAG engine...")
                    return perform_custom_rag_search(
                        query=q.strip(),
                        provider="deepseek",
                        api_key=deepseek_key,
                        include_external=external,
                        lang=lang
                    )
                raise HTTPException(
                    status_code=429,
                    detail="Cota da API do Gemini esgotada no momento. Alterne para o DeepSeek ou Hy3 nas configurações de IA."
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

