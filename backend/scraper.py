from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types
import os
import urllib.request
import urllib.parse
import re
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor


# Initialize Google GenAI client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    # Try reading from .env in root or backend folder
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), ".env"),
        ".env"
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line_s = line.strip()
                        if line_s.startswith("GEMINI_API_KEY="):
                            GEMINI_API_KEY = line_s.split("=", 1)[1].strip().strip('"').strip("'")
                            os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                            break
            except Exception:
                pass
        if GEMINI_API_KEY:
            break

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("New Google GenAI client initialized successfully.")
else:
    client = None
    print("WARNING: GEMINI_API_KEY not found in environment or .env file. AI search grounding is disabled.")

def set_api_key(new_key: str):
    global client, GEMINI_API_KEY
    if not new_key or not new_key.strip():
        return False, "Chave vazia ou inválida"
    key = new_key.strip()
    try:
        new_client = genai.Client(api_key=key)
        client = new_client
        GEMINI_API_KEY = key
        os.environ["GEMINI_API_KEY"] = key
        
        # Save to .env files
        for p in [os.path.join(os.path.dirname(__file__), "..", ".env"), os.path.join(os.path.dirname(__file__), ".env"), ".env"]:
            try:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(f"GEMINI_API_KEY={key}\n")
            except Exception:
                pass
        return True, "Chave configurada com sucesso!"
    except Exception as e:
        return False, f"Erro ao configurar chave: {e}"

def get_api_status():
    has_gemini = bool(client and GEMINI_API_KEY)
    has_deepseek = bool(os.environ.get("DEEPSEEK_API_KEY"))
    has_hy3 = bool(os.environ.get("HY3_API_KEY") or os.environ.get("OPENAI_API_KEY"))
    
    default_prov = "gemini"
    if has_hy3 and not has_gemini:
        default_prov = "hy3"
    elif has_deepseek and not has_gemini:
        default_prov = "deepseek"
        
    return {
        "has_key": has_gemini or has_deepseek or has_hy3,
        "has_gemini": has_gemini,
        "has_deepseek": has_deepseek,
        "has_hy3": has_hy3,
        "default_provider": default_prov,
        "key_preview": f"{GEMINI_API_KEY[:4]}...{GEMINI_API_KEY[-4:]}" if GEMINI_API_KEY and len(GEMINI_API_KEY) > 8 else None
    }



_session = requests.Session()
_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
})

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

def fetch_url(url):
    try:
        r = _session.get(url, timeout=4.0)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        pass
    return None

def resolve_redirect_url(url):
    if not url or "grounding-api-redirect" not in url:
        return url
    try:
        r = _session.head(url, allow_redirects=True, timeout=2.0)
        return r.url
    except Exception:
        try:
            r = _session.get(url, allow_redirects=True, timeout=2.0)
            return r.url
        except Exception:
            return url

def infer_publication_info(title, url):
    url_lower = (url or "").lower()
    title_lower = (title or "").lower()
    
    if "wp" in url_lower or "/sentinela-fevereiro" in url_lower or "/sentinela-janeiro" in url_lower or "/sentinela-março" in url_lower:
        return "A Sentinela (Público)"
    elif "ws" in url_lower or "sentinela-estudo" in url_lower:
        return "A Sentinela (Edição de Estudo)"
    elif any(k in url_lower for k in ["/w20", "/w19", "/w18", "/w17", "/w16", "/w15", "/w14", "/w13", "/w12", "/w11", "/w10", "/w0", "/w9", "/w8", "/w7", "/w6"]) or "sentinela" in url_lower or "watchtower" in url_lower:
        return "A Sentinela"
    elif any(k in url_lower or k in title_lower for k in ["/g20", "/g19", "/g18", "/g17", "/g16", "/g15", "/g14", "/g13", "/g12", "/g0", "/g9", "/g8", "/g7", "despertai", "awake"]):
        return "Despertai!"
    elif any(k in url_lower or k in title_lower for k in ["it-1", "it-2", "perspicaz", "insight", "estudo-perspicaz"]):
        return "Estudo Perspicaz das Escrituras"
    elif any(k in url_lower or k in title_lower for k in ["nwt", "bi12", "biblia", "bible", "/bc/", "/b/"]):
        return "Bíblia Sagrada (Tradução do Novo Mundo)"
    elif any(k in url_lower or k in title_lower for k in ["ijwbq", "perguntas-biblicas", "perguntas"]):
        return "Perguntas Bíblicas Respondidas"
    elif any(k in url_lower or k in title_lower for k in ["ijwyp", "jovens-perguntam"]):
        return "Os Jovens Perguntam"
    elif any(k in url_lower for k in ["/lfb/", "/my/", "historias-biblia", "aprenda-historias"]):
        return "Histórias da Bíblia"
    elif any(k in url_lower for k in ["/mwb", "vida-e-ministerio"]):
        return "Apostila Vida e Ministério"
    elif any(k in url_lower for k in ["/lff", "seja-feliz-para-sempre"]):
        return "Livro Seja Feliz para Sempre!"
    elif "wol.jw.org" in url_lower:
        return "Biblioteca Online (WOL)"
    elif "jw.org" in url_lower:
        return "JW.ORG (Site Oficial)"
    else:
        return urllib.parse.urlparse(url).netloc or "Fonte da Internet"

def clean_result_title(title, url):
    raw_title = urllib.parse.unquote((title or "").strip())
    url_lower = (url or "").lower()

    # If title is generic or just a code
    if not raw_title or raw_title.lower() in ["jw.org", "wol", "wol - biblioteca", "link de referência", "artigo de referência", "início", "pesquisar"]:
        path = urllib.parse.urlparse(url).path.strip("/")
        parts = [p for p in path.split("/") if p and p not in ["pt", "en", "es", "wol", "d", "r5", "lp-t", "biblioteca", "revistas", "livros"]]
        if parts:
            slug = urllib.parse.unquote(parts[-1]).replace("-", " ").replace("_", " ")
            raw_title = slug

    # If title looks like wp20130201 or g20040408
    if re.match(r'^(wp|ws|w|g)\d{6,8}$', raw_title, re.I):
        pub_type = "A Sentinela" if raw_title.lower().startswith("w") else "Despertai!"
        year = raw_title[2:6] if raw_title.lower().startswith("wp") or raw_title.lower().startswith("ws") else raw_title[1:5]
        return f"{pub_type} ({year})"

    # Capitalize and clean slug formatting
    clean = re.sub(r'\s+', ' ', raw_title.replace("-", " ").replace("_", " ")).strip()
    words = clean.split()
    capitalized = []
    lower_words = {"de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "por", "para", "com", "e", "o", "a", "os", "as", "um", "uma"}
    for i, w in enumerate(words):
        if i == 0 or w.lower() not in lower_words:
            capitalized.append(w.capitalize())
        else:
            capitalized.append(w.lower())
    
    formatted = " ".join(capitalized)
    
    # Specific known biblical themes polish
    if "moises" in formatted.lower():
        formatted = formatted.replace("Moises", "Moisés").replace("moises", "Moisés")
    if "fe" in formatted.lower():
        formatted = formatted.replace("Fe", "Fé").replace(" fe ", " fé ")
    if "biblia" in formatted.lower():
        formatted = formatted.replace("Biblia", "Bíblia")
    if "jeova" in formatted.lower():
        formatted = formatted.replace("Jeova", "Jeová")

    return formatted or "Publicação Oficial"



class ApiKeyRequiredException(Exception):
    """Raised when no API key is provided on client or server."""
    pass

def perform_ai_grounded_search(query, include_external=False, lang='pt', custom_api_key=None, history=None):
    active_client = None
    if custom_api_key and str(custom_api_key).strip():
        try:
            active_client = genai.Client(api_key=str(custom_api_key).strip())
        except Exception as e:
            raise Exception(f"Chave de API do Gemini inválida: {e}")
    elif client:
        active_client = client
        
    if not active_client:
        raise ApiKeyRequiredException("Chave da API do Gemini não configurada. Por favor, insira sua chave gratuita para realizar a pesquisa.")
        
    # Language instruction
    lang_map = {
        'pt': 'Português (Brasil)',
        'en': 'English',
        'es': 'Español'
    }
    target_lang = lang_map.get(lang, 'Português (Brasil)')


    if include_external:
        source_directive = """Você tem permissão para pesquisar na Internet em geral para contextualizar fatos históricos, arqueológicos ou científicos.
No entanto, PRIORIZE E DESTAQUE SEMPRE o entendimento oficial publicado em wol.jw.org e jw.org.
SEPARAÇÃO OBRIGATÓRIA: Qualquer informação ou fonte externa que não venha de jw.org/wol.jw.org DEVE ser categorizada exclusivamente no final sob a seção '### 🌐 Fontes Externas (Internet)'."""
    else:
        source_directive = """ATENÇÃO: Sua pesquisa DEVE SER RESTRITA EXCLUSIVAMENTE aos sites oficiais das Testemunhas de Jeová: wol.jw.org e jw.org (incluindo todos os subdomínios).
- NÃO utilize nenhuma fonte de terceiros, blogs, enciclopédias seculares ou opiniões não-oficiais.
- Toda explicação doutrinária, moral ou histórica deve estar fundamentada nas publicações oficiais (A Sentinela, Despertai!, Estudo Perspicaz das Escrituras, Livros da Torre de Vigia, etc.).
- Se um determinado aspecto não for abordado nas fontes oficiais, declare isso com humildade e fidelidade ao registro teocrático."""

    conversation_context = ""
    if history:
        conversation_context = "\nHISTÓRICO ANTERIOR DA CONVERSA:\n"
        for msg in history:
            role_label = "Usuário" if msg.get("role") == "user" else "Assistente Teocrático"
            conversation_context += f"{role_label}: {msg.get('content')}\n\n"

    prompt = f"""Você é um assistente de pesquisa teocrática avançado e objetivo (no estilo de um motor de busca analítico como Perplexity AI / RAG Especializado), focado no acervo da Biblioteca Online da Torre de Vigia (wol.jw.org) e do site oficial (jw.org).

IDIOMA DA RESPOSTA: Responda obrigatoriamente em {target_lang}.

DIRETRIZES DE ESCOPO E FONTES:
{source_directive}
- OBJETIVIDADE: Seja claro, direto, fiel e profundo. Evite prolixidade.
- CAPACIDADE DE FORMATAÇÃO: Você tem capacidade de gerar TABELAS COMPARATIVAS COMPLETAS em Markdown (| Coluna 1 | Coluna 2 |), listas, roteiros de estudo, resumos e documentos detalhados sempre que solicitado.

ESTRUTURA DA RESPOSTA (Adapte livremente se o usuário solicitar tabelas, listas ou formatos específicos):

### 📌 Resposta Direta & Síntese
(Apresente um resumo claro, objetivo e bíblico que responde diretamente à dúvida do usuário).

### 📖 Análise Teocrática Detalhada
(Desenvolva os pontos fundamentais com clareza e fidelidade teocrática):
- Explique o contexto e o raciocínio das publicações das Testemunhas de Jeová.
- Mencione nominalmente as publicações relevantes e insira links Markdown clicáveis (ex: `[Título do Artigo](https://wol.jw.org/pt/...)`).

### 📜 Textos Bíblicos Principais
(Destaque os textos bíblicos principais e sua aplicação).

### 📚 Publicações e Fontes Oficiais
(Liste em tópicos os artigos do wol.jw.org e jw.org para aprofundamento com seus links Markdown).

{"### 🌐 Fontes Externas (Internet)" if include_external else ""}

{conversation_context}
PERGUNTA OU SOLICITAÇÃO DO USUÁRIO: "{query}"
"""

    # Run search grounding with multi-model resilience and retry
    models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    response = None
    last_err = None

    for m in models_to_try:
        try:
            response = active_client.models.generate_content(
                model=m,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[{"google_search": {}}],
                    temperature=0.3,
                    max_output_tokens=2500
                )
            )
            if response and response.text and len(response.text.strip()) > 20:
                break
        except Exception as err:
            last_err = err
            import time
            time.sleep(0.4)

    # Fallback without search tool if grounding had a temporary 503 spike
    if not response or not response.text or len(response.text.strip()) < 20:
        for m in ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']:
            try:
                response = active_client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=2500
                    )
                )
                if response and response.text and len(response.text.strip()) > 20:
                    break
            except Exception as err:
                last_err = err

    if not response or not response.text or len(response.text.strip()) < 10:
        raise Exception(f"Erro ao gerar ponderações da IA: {last_err or 'Modelo indisponível no momento'}")

    try:
        ai_response = response.text or ""
        results = []
        raw_chunks = []
        
        candidate = response.candidates[0] if response.candidates else None
        metadata = candidate.grounding_metadata if candidate else None
        
        if metadata and metadata.grounding_chunks:
            for chunk in metadata.grounding_chunks:
                web = chunk.web
                if web and web.uri and web.uri not in [rc['uri'] for rc in raw_chunks]:
                    raw_chunks.append({
                        "uri": web.uri,
                        "title": web.title
                    })

        # Parse links from the generated markdown text
        extracted_chunks = []
        md_links = re.findall(r'\[([^\]]+)\]\((https?://[a-zA-Z0-9\.\-\/\?&\=\#\%\+]+)\)', ai_response)
        for title, uri in md_links:
            if uri not in [rc['uri'] for rc in raw_chunks] and uri not in [ec['uri'] for ec in extracted_chunks]:
                extracted_chunks.append({
                    "uri": uri,
                    "title": title
                })
        
        raw_uris = re.findall(r'(?<!\()(https?://[a-zA-Z0-9\.\-\/\?&\=\#\%\+]+)', ai_response)
        for uri in raw_uris:
            while uri and uri[-1] in ['.', ',', ';', ')', ']']:
                uri = uri[:-1]
            if uri not in [rc['uri'] for rc in raw_chunks] and uri not in [ec['uri'] for ec in extracted_chunks]:
                title = "WOL - Biblioteca" if "wol.jw.org" in uri else ("JW.ORG" if "jw.org" in uri else "Link de Referência")
                extracted_chunks.append({
                    "uri": uri,
                    "title": title
                })
                
        raw_chunks = raw_chunks[:12]
        
        # Resolve redirect URLs in parallel to get direct jw.org or wol.jw.org links
        with ThreadPoolExecutor(max_workers=12) as executor:
            resolved_uris = list(executor.map(lambda c: resolve_redirect_url(c['uri']), raw_chunks))
            
        seen_uris = set()
        for idx, chunk in enumerate(raw_chunks):
            final_uri = resolved_uris[idx]
            
            clean_uri = final_uri.split('?')[0].split('#')[0]
            if clean_uri in seen_uris:
                continue
            seen_uris.add(clean_uri)
            
            is_external_link = not ("jw.org" in final_uri or "wol.jw.org" in final_uri)
            
            # Skip external if not include_external was checked (fail-safe filtering)
            if not include_external and is_external_link:
                continue
                
            pub = infer_publication_info(chunk.get('title', ''), final_uri)
            title = clean_result_title(chunk.get('title', ''), final_uri)
                
            results.append({
                "title": title,
                "snippet": f"Publicação oficial citada nas ponderações da pesquisa teocrática. Clique para ler no leitor integrado ou acessar a fonte original.",
                "link": final_uri,
                "publication": pub,
                "is_external": is_external_link,
                "source_site": urllib.parse.urlparse(final_uri).netloc
            })
            
        return {"ai_response": ai_response, "results": results}
    except Exception as e:
        print(f"Error performing grounded search: {e}")
        return {
            "ai_response": f"Erro ao gerar ponderações da IA: {e}",
            "results": []
        }

def get_clean_document(url):
    html = fetch_url(url)
    if not html:
        return None
        
    soup = BeautifulSoup(html, 'html.parser')
    
    doc_div = soup.find("div", class_="document") or soup.find("div", id="docContent") or soup.find("article")
    if not doc_div:
        doc_div = soup.find("body")
        
    if not doc_div:
        return None
        
    doc_copy = BeautifulSoup(str(doc_div), 'html.parser')
    
    for tag in doc_copy.find_all(["script", "style", "nav", "footer", "button"]):
        tag.decompose()
        
    for tag in doc_copy.find_all(class_=lambda x: x and ("pageNum" in x or "lnk" in x or "audioButton" in x)):
        tag.decompose()
        
    for a in doc_copy.find_all("a"):
        href = a.get("href", "")
        if href.startswith('/'):
            a['href'] = f"https://wol.jw.org{href}"
            
    return str(doc_copy)
