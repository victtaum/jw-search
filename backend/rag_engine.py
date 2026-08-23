from typing import Optional, List, Dict, Any
import re
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from openai import OpenAI
from scraper import get_clean_document, infer_publication_info, clean_result_title

def search_wol_direct(query: str, lang: str = "pt", max_results: int = 8):
    """
    Directly queries the Watchtower Online Library (wol.jw.org) search engine.
    """
    lang_configs = {
        "pt": {"url": "https://wol.jw.org/pt/wol/s/r5/lp-t", "host": "https://wol.jw.org"},
        "en": {"url": "https://wol.jw.org/en/wol/s/r1/lp-e", "host": "https://wol.jw.org"},
        "es": {"url": "https://wol.jw.org/es/wol/s/r4/lp-s", "host": "https://wol.jw.org"},
    }
    config = lang_configs.get(lang, lang_configs["pt"])
    encoded_q = urllib.parse.quote(query)
    search_url = f"{config['url']}?q={encoded_q}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    results = []
    seen_urls = set()
    
    try:
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(html, 'html.parser')
            
            items = soup.select('.results .resultItem, .resultItem, .results li')
            for item in items:
                link_el = item.select_one('h3 a, a.title, .caption a, a')
                if not link_el or not link_el.has_attr('href'):
                    continue
                
                href = link_el['href']
                if href.startswith('/'):
                    href = f"{config['host']}{href}"
                
                clean_href = href.split('?')[0].split('#')[0]
                if clean_href in seen_urls:
                    continue
                seen_urls.add(clean_href)
                
                raw_title = link_el.get_text(strip=True)
                snippet_el = item.select_one('.snippet, .body, p')
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""
                
                pub = infer_publication_info(raw_title, clean_href)
                title = clean_result_title(raw_title, clean_href)
                
                results.append({
                    "title": title,
                    "link": clean_href,
                    "snippet": snippet,
                    "publication": pub,
                    "is_external": False,
                    "source_site": "wol.jw.org"
                })
                if len(results) >= max_results:
                    break
    except Exception as e:
        print(f"Direct WOL search notice: {e}")
        
    return results

def fetch_rag_context(articles: list, max_articles: int = 4, max_chars_per_article: int = 3500):
    """
    Fetches the full clean text of the top WOL articles to build the theocratic RAG context.
    """
    context_chunks = []
    
    for idx, art in enumerate(articles[:max_articles]):
        url = art["link"]
        try:
            html_content = get_clean_document(url)
            if html_content:
                soup = BeautifulSoup(html_content, 'html.parser')
                text = soup.get_text(separator=' ', strip=True)
                clean_t = re.sub(r'\s+', ' ', text)
                if len(clean_t) > max_chars_per_article:
                    clean_t = clean_t[:max_chars_per_article] + "..."
                
                context_chunks.append(
                    f"--- DOCUMENTO #{idx+1} ---\n"
                    f"TÍTULO: {art['title']}\n"
                    f"PUBLICAÇÃO: {art['publication']}\n"
                    f"LINK OFICIAL: {url}\n"
                    f"CONTEÚDO:\n{clean_t}\n"
                )
        except Exception as e:
            print(f"Error fetching article content for {url}: {e}")
            
    return "\n\n".join(context_chunks)

def perform_custom_rag_search(
    query: str,
    provider: str = "hy3",
    api_key: str = None,
    base_url: str = None,
    model: str = None,
    include_external: bool = False,
    lang: str = "pt",
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Autonomous Theocratic RAG Flow with Multi-Turn Conversation History:
    1. Direct search on wol.jw.org.
    2. Deep scraping of the top theocratic articles.
    3. Augments prompt with context and accumulated conversation history.
    4. Generates synthesized response with DeepSeek, Hy3, or OpenAI-compatible model.
    """
    # 1. Retrieval
    retrieved_results = search_wol_direct(query, lang=lang, max_results=8)
    
    # 2. Context Scraping
    theocratic_context = fetch_rag_context(retrieved_results, max_articles=4)
    
    if not theocratic_context:
        theocratic_context = "Nenhum documento específico foi baixado. Use seu conhecimento das publicações oficiais das Testemunhas de Jeová (jw.org e wol.jw.org) para responder com fidelidade bíblica."

    # 3. Prompt Construction
    lang_map = {'pt': 'Português (Brasil)', 'en': 'English', 'es': 'Español'}
    target_lang = lang_map.get(lang, 'Português (Brasil)')
    
    system_prompt = f"""Você é um assistente de pesquisa teocrática avançado (estilo Perplexity AI / RAG Teocrático Especializado), focado no acervo da Biblioteca Online da Torre de Vigia (wol.jw.org) e do site oficial (jw.org).

IDIOMA DA RESPOSTA: Responda obrigatoriamente em {target_lang}.

DIRETRIZES DE FONTES & CAPACIDADES:
- Baseie sua resposta PRINCIPALMENTE nos DOCUMENTOS TEOCRÁTICOS OFICIAIS fornecidos no contexto abaixo e no histórico da conversa.
- Cite nominalmente as publicações (ex: A Sentinela, Despertai!, Estudo Perspicaz das Escrituras, Livros de Estudo).
- Sempre que citar uma informação, inclua o link clicável em formato Markdown exatamente como fornecido nos documentos oficiais (ex: [Título do Artigo](https://wol.jw.org/pt/...)).
- CAPACIDADE DE ESTRUTURAÇÃO: Você pode criar TABELAS COMPARATIVAS COMPLETAS em Markdown (| Coluna 1 | Coluna 2 | Coluna 3 |), listas ordenadas/não-ordenadas, resumos para estudo em família, esboços teocráticos e documentos detalhados de pesquisa sempre que solicitado.
- Mantenha tom respeitoso, teocrático, bíblico e instrutivo.

ESTRUTURA DA RESPOSTA (Adapte livremente se o usuário solicitar tabelas, listas ou formatos específicos):
### 📌 Resposta Direta & Síntese
(Apresente um resumo claro e bíblico que responde diretamente à dúvida ou solicitação).

### 📖 Análise Teocrática Detalhada
(Explique detalhadamente os pontos teocráticos com base nos documentos fornecidos e tabelas se solicitado, inserindo links Markdown).

### 📜 Textos Bíblicos Principais
(Destaque os textos bíblicos e como eles se aplicam ao assunto).

### 📚 Publicações e Fontes Oficiais
(Liste em tópicos os artigos consultados com seus respectivos links em Markdown).

---
DOCUMENTOS E FONTES DA BIBLIOTECA ONLINE (WOL) COLETADOS:
{theocratic_context}
"""

    user_prompt = f"Pergunta ou solicitação do usuário: \"{query}\""

    # 4. Configure LLM Client with Smart Auto-Detection
    clean_key = str(api_key).strip() if api_key else ""
    
    if provider == "deepseek":
        active_base_url = base_url or "https://api.deepseek.com"
        active_model = model or "deepseek-chat"
    elif provider in ["hy3", "tencent", "hunyuan", "openrouter", "openai"]:
        # Auto-detect OpenRouter keys (sk-or-v1-...) or OpenRouter base_url
        if clean_key.startswith("sk-or-") or (base_url and "openrouter.ai" in base_url) or not base_url:
            active_base_url = base_url or "https://openrouter.ai/api/v1"
            # Map model aliases to OpenRouter's exact model ID
            m_lower = (model or "").lower().strip()
            if not m_lower or m_lower in ["hy3", "hunyuan", "tencent", "tencent/hunyuan-standard", "tencent/hy3", "tencent/hy3-preview"]:
                active_model = "tencent/hy3"
            elif m_lower == "auto":
                active_model = "openrouter/auto"
            else:
                active_model = model
        else:
            active_base_url = base_url
            active_model = model or "tencent/hy3"
    else: # Generic openai-compatible
        active_base_url = base_url or "https://api.openai.com/v1"
        active_model = model or "gpt-4o-mini"

    # Initialize client with OpenRouter identification headers
    client = OpenAI(
        api_key=clean_key,
        base_url=active_base_url,
        default_headers={
            "HTTP-Referer": "https://jw-search.org",
            "X-Title": "JW Search Theocratic RAG"
        }
    )

    # Build conversation messages payload
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant", "system"] and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = client.chat.completions.create(
            model=active_model,
            messages=messages,
            temperature=0.3
        )
        ai_text = response.choices[0].message.content
    except Exception as e:
        raise Exception(f"Erro na API {provider.upper()} ({active_model} @ {active_base_url}): {e}")

    return {
        "ai_response": ai_text,
        "results": retrieved_results,
        "provider": provider,
        "model": active_model
    }
