import re
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from scraper import infer_publication_info, fetch_url
from safety import SearchDeadline


def extract_theocratic_keywords(query: str) -> str:
    """
    Cleans natural language questions and conversational phrases into theocratic search keywords for WOL.
    """
    clean_q = re.sub(r"[^\w\s]", " ", query, flags=re.UNICODE)
    stop_words = {
        "o",
        "a",
        "os",
        "as",
        "um",
        "uma",
        "uns",
        "umas",
        "de",
        "do",
        "da",
        "dos",
        "das",
        "em",
        "no",
        "na",
        "nos",
        "nas",
        "por",
        "para",
        "com",
        "sem",
        "sob",
        "sobre",
        "que",
        "qual",
        "quais",
        "quem",
        "como",
        "onde",
        "quando",
        "porque",
        "por que",
        "foi",
        "era",
        "ser",
        "sendo",
        "sao",
        "são",
        "é",
        "esta",
        "está",
        "estava",
        "ter",
        "tinha",
        "cara",
        "pessoa",
        "legal",
        "bom",
        "ruim",
        "qualidades",
        "fazer",
        "dizer",
        "explicar",
        "the",
        "a",
        "an",
        "in",
        "on",
        "at",
        "by",
        "for",
        "with",
        "about",
        "what",
        "how",
        "who",
        "why",
        "is",
        "was",
    }
    stop_words.update(
        {
            "principios",
            "princípios",
            "princios",
            "exemplos",
            "bíblicos",
            "biblicos",
            "temos",
            "quero",
            "saber",
            "aprofunde",
            "situação",
            "situacao",
            "segundo",
            "lidar",
            "sair",
            "faça",
            "faca",
            "tabela",
            "comparativa",
            "resumo",
            "esboço",
            "estruturado",
            "pontos",
            "principais",
            "entendimento",
            "organize",
            "crie",
            "consulta",
            "anterior",
            "anteriores",
            "melhor",
            "explique",
            "continue",
            "mais",
            "detalhes",
        }
    )
    words = [w for w in clean_q.split() if w.lower() not in stop_words and len(w) > 2]
    return " ".join(dict.fromkeys(words))[:240] if words else ""


def _query_wol_html(
    search_term: str, config: dict, headers: dict, max_results: int = 6
) -> list:
    search_url = f"{config['url']}?q={urllib.parse.quote(search_term)}"
    try:
        html = fetch_url(search_url)
        if not html:
            return []
        soup = BeautifulSoup(html, "html.parser")
        results, seen = [], set()
        region = config["url"].split("/wol/s/")[-1]
        lang_prefix = config["url"].split("/wol/s/")[0]
        # WOL result cards expose the document ID as server-provided metadata.
        # Their first anchors are often verse cross-references, not the article.
        for card in soup.select(".searchResult"):
            doc_id = next(
                (c[6:] for c in card.get("class", []) if re.fullmatch(r"docId-\d+", c)),
                None,
            )
            if not doc_id or doc_id in seen:
                continue
            title_el = card.select_one("h1, h2, h3, p")
            if title_el is None:
                continue
            url = f"{lang_prefix}/wol/d/{region}/{doc_id}"
            title = title_el.get_text(" ", strip=True)
            seen.add(doc_id)
            results.append(
                {
                    "title": title,
                    "link": url,
                    "snippet": card.get_text(" ", strip=True)[:500],
                    "publication": infer_publication_info(title, url),
                    "is_external": False,
                    "source_site": "wol.jw.org",
                }
            )
            if len(results) >= max_results:
                break
        return results
    except SearchDeadline:
        raise
    except Exception:
        return []


def search_wol_direct(query: str, lang: str = "pt", max_results: int = 6):
    """
    Directly queries the Watchtower Online Library (wol.jw.org) search engine with keyword fallback.
    """
    lang_configs = {
        "pt": {
            "url": "https://wol.jw.org/pt/wol/s/r5/lp-t",
            "host": "https://wol.jw.org",
        },
        "en": {
            "url": "https://wol.jw.org/en/wol/s/r1/lp-e",
            "host": "https://wol.jw.org",
        },
        "es": {
            "url": "https://wol.jw.org/es/wol/s/r4/lp-s",
            "host": "https://wol.jw.org",
        },
    }
    config = lang_configs.get(lang, lang_configs["pt"])
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    # 1. Search with raw query
    results = _query_wol_html(query, config, headers, max_results=max_results)

    # 2. If 0 results, search with extracted theocratic keywords
    if not results:
        keywords = extract_theocratic_keywords(query)
        if keywords and keywords.lower() != query.lower():
            results = _query_wol_html(
                keywords, config, headers, max_results=max_results
            )

    return results
