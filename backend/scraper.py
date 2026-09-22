import os
import urllib.request
import urllib.parse
import re
from safety import fetch_public_html, sanitize_article, SearchDeadline, UnsafeURL
from bs4 import BeautifulSoup


# Initialize Google GenAI client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY and os.environ.get("JW_DISABLE_DOTENV") != "1":
    # Try reading from .env in root or backend folder
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), ".env"),
        ".env",
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line_s = line.strip()
                        if line_s.startswith("GEMINI_API_KEY="):
                            GEMINI_API_KEY = (
                                line_s.split("=", 1)[1].strip().strip('"').strip("'")
                            )
                            os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                            break
            except Exception:
                pass
        if GEMINI_API_KEY:
            break


def get_api_status():
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    has_deepseek = bool(os.environ.get("DEEPSEEK_API_KEY"))
    has_hy3 = bool(os.environ.get("HY3_API_KEY"))

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
        "key_preview": None,
    }


def clean_text(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }


def fetch_url(url):
    try:
        return fetch_public_html(url)
    except (UnsafeURL, SearchDeadline):
        raise
    except Exception:
        return None


def infer_publication_info(title, url):
    url_lower = (url or "").lower()
    title_lower = (title or "").lower()

    if (
        "wp" in url_lower
        or "/sentinela-fevereiro" in url_lower
        or "/sentinela-janeiro" in url_lower
        or "/sentinela-março" in url_lower
    ):
        return "A Sentinela (Público)"
    elif "ws" in url_lower or "sentinela-estudo" in url_lower:
        return "A Sentinela (Edição de Estudo)"
    elif (
        any(
            k in url_lower
            for k in [
                "/w20",
                "/w19",
                "/w18",
                "/w17",
                "/w16",
                "/w15",
                "/w14",
                "/w13",
                "/w12",
                "/w11",
                "/w10",
                "/w0",
                "/w9",
                "/w8",
                "/w7",
                "/w6",
            ]
        )
        or "sentinela" in url_lower
        or "watchtower" in url_lower
    ):
        return "A Sentinela"
    elif any(
        k in url_lower or k in title_lower
        for k in [
            "/g20",
            "/g19",
            "/g18",
            "/g17",
            "/g16",
            "/g15",
            "/g14",
            "/g13",
            "/g12",
            "/g0",
            "/g9",
            "/g8",
            "/g7",
            "despertai",
            "awake",
        ]
    ):
        return "Despertai!"
    elif any(
        k in url_lower or k in title_lower
        for k in ["it-1", "it-2", "perspicaz", "insight", "estudo-perspicaz", "/1200"]
    ):
        return "Estudo Perspicaz das Escrituras"
    elif any(
        k in url_lower or k in title_lower
        for k in ["nwt", "bi12", "biblia", "bible", "/bc/", "/b/"]
    ):
        return "Bíblia Sagrada (Tradução do Novo Mundo)"
    elif any(
        k in url_lower or k in title_lower
        for k in ["ijwbq", "perguntas-biblicas", "perguntas"]
    ):
        return "Perguntas Bíblicas Respondidas"
    elif any(k in url_lower or k in title_lower for k in ["ijwyp", "jovens-perguntam"]):
        return "Os Jovens Perguntam"
    elif any(
        k in url_lower
        for k in ["/lfb/", "/my/", "historias-biblia", "aprenda-historias", "/110"]
    ):
        return "Histórias da Bíblia / Livros"
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
    if not raw_title or raw_title.lower() in [
        "jw.org",
        "wol",
        "wol - biblioteca",
        "link de referência",
        "artigo de referência",
        "início",
        "pesquisar",
    ]:
        path = urllib.parse.urlparse(url).path.strip("/")
        parts = [
            p
            for p in path.split("/")
            if p
            and p
            not in [
                "pt",
                "en",
                "es",
                "wol",
                "d",
                "r5",
                "lp-t",
                "biblioteca",
                "revistas",
                "livros",
            ]
        ]
        if parts:
            slug = urllib.parse.unquote(parts[-1]).replace("-", " ").replace("_", " ")
            raw_title = slug

    # If title looks like wp20130201 or g20040408
    if re.match(r"^(wp|ws|w|g)\d{6,8}$", raw_title, re.I):
        pub_type = "A Sentinela" if raw_title.lower().startswith("w") else "Despertai!"
        year = (
            raw_title[2:6]
            if raw_title.lower().startswith("wp") or raw_title.lower().startswith("ws")
            else raw_title[1:5]
        )
        return f"{pub_type} ({year})"

    return re.sub(r"\s+", " ", raw_title).strip() or "Publicação"


def get_clean_document(url, requested_title=None):
    # A click always opens that URL; never silently substitute a different article.
    html = fetch_url(url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    document = soup.select_one("div.document, #docContent, article")
    if document is None:
        return None
    for tag in document.find_all(
        ["script", "style", "nav", "footer", "button", "iframe", "form"]
    ):
        tag.decompose()
    return sanitize_article(str(document), url)


# =====================================================================
# Bible Verse Extraction & Floating Tooltip Parser (TNM / wol.jw.org)
# =====================================================================
BIBLE_BOOKS_MAP = {
    "gênesis": 1,
    "genesis": 1,
    "gên": 1,
    "gen": 1,
    "gn": 1,
    "êxodo": 2,
    "exodo": 2,
    "êx": 2,
    "ex": 2,
    "levítico": 3,
    "levitico": 3,
    "lev": 3,
    "lv": 3,
    "números": 4,
    "numeros": 4,
    "núm": 4,
    "num": 4,
    "nm": 4,
    "deuteronômio": 5,
    "deuteronomio": 5,
    "deut": 5,
    "dt": 5,
    "josué": 6,
    "josue": 6,
    "jos": 6,
    "js": 6,
    "juízes": 7,
    "juizes": 7,
    "juí": 7,
    "jui": 7,
    "jz": 7,
    "rute": 8,
    "rut": 8,
    "rt": 8,
    "1 samuel": 9,
    "1samuel": 9,
    "1 sam": 9,
    "1sam": 9,
    "1 sm": 9,
    "1sm": 9,
    "2 samuel": 10,
    "2samuel": 10,
    "2 sam": 10,
    "2sam": 10,
    "2 sm": 10,
    "2sm": 10,
    "1 reis": 11,
    "1reis": 11,
    "1 rs": 11,
    "1rs": 11,
    "2 reis": 12,
    "2reis": 12,
    "2 rs": 12,
    "2rs": 12,
    "1 crônicas": 13,
    "1 cronicas": 13,
    "1 crô": 13,
    "1 cro": 13,
    "1 cr": 13,
    "2 crônicas": 14,
    "2 cronicas": 14,
    "2 crô": 14,
    "2 cro": 14,
    "2 cr": 14,
    "esdras": 15,
    "esd": 15,
    "neemias": 16,
    "ne": 16,
    "nee": 16,
    "ester": 17,
    "est": 17,
    "jó": 18,
    "jo": 18,
    "salmos": 19,
    "salmo": 19,
    "sal": 19,
    "sl": 19,
    "provérbios": 20,
    "proverbios": 20,
    "prov": 20,
    "pr": 20,
    "eclesiastes": 21,
    "ecl": 21,
    "ec": 21,
    "cântico de salomão": 22,
    "cantico de salomao": 22,
    "cânticos": 22,
    "canticos": 22,
    "cânt": 22,
    "cant": 22,
    "ct": 22,
    "isaías": 23,
    "isaias": 23,
    "isa": 23,
    "is": 23,
    "jeremias": 24,
    "jer": 24,
    "jr": 24,
    "lamentações": 25,
    "lamentacoes": 25,
    "lam": 25,
    "lm": 25,
    "ezequiel": 26,
    "eze": 26,
    "ez": 26,
    "daniel": 27,
    "dan": 27,
    "dn": 27,
    "oseias": 28,
    "os": 28,
    "joel": 29,
    "joe": 29,
    "jl": 29,
    "amós": 30,
    "amos": 30,
    "am": 30,
    "obadias": 31,
    "ob": 31,
    "jonas": 32,
    "jon": 32,
    "jn": 32,
    "miqueias": 33,
    "miq": 33,
    "mq": 33,
    "naum": 34,
    "na": 34,
    "habacuque": 35,
    "hab": 35,
    "hc": 35,
    "sofonias": 36,
    "sof": 36,
    "sf": 36,
    "ageu": 37,
    "ag": 37,
    "zacarias": 38,
    "zac": 38,
    "zc": 38,
    "malaquias": 39,
    "mal": 39,
    "ml": 39,
    # Novo Testamento
    "mateus": 40,
    "mat": 40,
    "mt": 40,
    "marcos": 41,
    "mar": 41,
    "mc": 41,
    "lucas": 42,
    "luc": 42,
    "lc": 42,
    "joão": 43,
    "joao": 43,
    "jo": 43,
    "atos": 44,
    "at": 44,
    "romanos": 45,
    "rom": 45,
    "rm": 45,
    "1 coríntios": 46,
    "1 corintios": 46,
    "1 cor": 46,
    "1cor": 46,
    "1 co": 46,
    "2 coríntios": 47,
    "2 corintios": 47,
    "2 cor": 47,
    "2cor": 47,
    "2 co": 47,
    "gálatas": 48,
    "galatas": 48,
    "gál": 48,
    "gal": 48,
    "gl": 48,
    "efésios": 49,
    "efesios": 49,
    "ef": 49,
    "filipenses": 50,
    "fil": 50,
    "fp": 50,
    "colossenses": 51,
    "col": 51,
    "cl": 51,
    "1 tessalonicenses": 52,
    "1 tes": 52,
    "1ts": 52,
    "2 tessalonicenses": 53,
    "2 tes": 53,
    "2ts": 53,
    "1 timóteo": 54,
    "1 timoteo": 54,
    "1 tim": 54,
    "1tm": 54,
    "2 timóteo": 55,
    "2 timoteo": 55,
    "2 tim": 55,
    "2tm": 55,
    "tito": 56,
    "tit": 56,
    "tt": 56,
    "filemom": 57,
    "flm": 57,
    "hebreus": 58,
    "heb": 58,
    "hb": 58,
    "tiago": 59,
    "tia": 59,
    "tg": 59,
    "1 pedro": 60,
    "1 ped": 60,
    "1 pe": 60,
    "2 pedro": 61,
    "2 ped": 61,
    "2 pe": 61,
    "1 joão": 62,
    "1 joao": 62,
    "1 jo": 62,
    "2 joão": 63,
    "2 joao": 63,
    "2 jo": 63,
    "3 joão": 64,
    "3 joao": 64,
    "3 jo": 64,
    "judas": 65,
    "jud": 65,
    "jd": 65,
    "apocalipse": 66,
    "apoc": 66,
    "ap": 66,
    "revelação": 66,
    "revelacao": 66,
    "rev": 66,
}
