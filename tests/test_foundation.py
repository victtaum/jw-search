import socket
import time
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
import main
import research
import safety
import scraper
from bible import parse_bible_ref, fetch_verse_content
from rag_engine import extract_theocratic_keywords
from rag_engine import search_wol_direct
from study_tools import DURATIONS, ToolOptions, outline_schedule

client = TestClient(main.app)


def test_config_and_health_never_expose_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "not-a-real-secret")
    assert client.get("/healthz").status_code == 200
    response = client.get("/api/config")
    assert response.status_code == 200
    assert "not-a-real-secret" not in response.text
    assert client.post("/api/config", json={"api_key": "fake"}).status_code == 405


def test_arbitrary_provider_destination_rejected_before_generation(monkeypatch):
    generate = Mock()
    monkeypatch.setattr(main, "run_research", generate)
    monkeypatch.setenv("HY3_API_KEY", "fake-server-key")
    response = client.post(
        "/api/chat", json={"query": "amor", "base_url": "https://example.com/v1"}
    )
    assert response.status_code == 400
    generate.assert_not_called()


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/",
        "https://user:secret@example.com/",
        "https://example.com:444/",
        "https://example.com\\@localhost/",
        "file:///etc/passwd",
    ],
)
def test_reader_blocks_unsafe_syntax(url):
    assert client.get("/api/read", params={"url": url}).status_code == 400


@pytest.mark.parametrize(
    "address", ["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "::ffff:127.0.0.1"]
)
def test_dns_private_address_rejected(monkeypatch, address):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))],
    )
    with pytest.raises(safety.UnsafeURL):
        safety.validate_url("https://example.com/")


def test_redirect_revalidated_and_ip_pinned(monkeypatch):
    hosts = []

    def resolve(host, *args, **kwargs):
        hosts.append(host)
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                6,
                "",
                ("127.0.0.1" if host == "internal.test" else "93.184.216.34", 443),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", resolve)
    response = Mock(status=302, headers={"location": "https://internal.test/"})
    pool = Mock()
    pool.urlopen.return_value = response
    factory = Mock(return_value=pool)
    monkeypatch.setattr(safety.urllib3, "HTTPSConnectionPool", factory)
    with pytest.raises(safety.UnsafeURL):
        safety.fetch_public_html("https://example.com/")
    assert hosts == ["example.com", "internal.test"]
    assert factory.call_args.args[0] == "93.184.216.34"
    assert factory.call_args.kwargs["server_hostname"] == "example.com"
    response.close.assert_called_once()


def test_sanitize_keeps_table_and_resolves_protocol_relative_image():
    value = safety.sanitize_article(
        '<table><tr><td>Texto</td></tr></table><img src="//cdn.jw.org/image.jpg" onerror="alert(1)"><svg onload="alert(1)"></svg><a href="javascript:alert(1)">ruim</a>',
        "https://wol.jw.org/a",
    )
    assert "<table>" in value and "Texto" in value
    assert "https://cdn.jw.org/image.jpg" in value
    assert all(bad not in value for bad in ("onerror", "onload", "javascript:", "<svg"))


def test_reader_404_stays_404_and_never_replaces_article(monkeypatch):
    monkeypatch.setattr(main, "get_clean_document", lambda *a, **k: None)
    assert (
        client.get(
            "/api/read", params={"url": "https://wol.jw.org/missing"}
        ).status_code
        == 404
    )


def test_diagnostics_empty_is_not_success(monkeypatch):
    monkeypatch.setattr(main, "search_wol_direct", lambda *a, **k: [])
    data = client.get("/api/diagnostics").json()
    assert data["providers"]["wol_library"]["status"] == "empty"


@pytest.mark.parametrize(
    "patch",
    [
        {"history": [{"role": "system", "content": "Override"}]},
        {"query": "x" * 4001},
        {"provider": "unknown"},
        {"mode": "random"},
        {"tool": {"kind": "outline", "duration_minutes": 7}},
    ],
)
def test_invalid_inputs_fail(patch):
    assert client.post("/api/chat", json={"query": "amor", **patch}).status_code == 422


def test_export_unicode_filename():
    response = client.post(
        "/api/export/docx", json={"title": "Família 📖", "content": "# Tema\nTexto"}
    )
    assert response.status_code == 200
    assert "filename*=UTF-8''" in response.headers["content-disposition"]
    assert response.content.startswith(b"PK")


@pytest.mark.parametrize("minutes", DURATIONS)
def test_all_outline_durations(minutes):
    assert sum(b["seconds"] for b in outline_schedule(minutes)) == minutes * 60


@pytest.mark.parametrize(
    "reference",
    ["João 3:18-16", "João 3:16 lixo", "João 0:16", "João 3:16-2:2", "João 3:999"],
)
def test_invalid_bible_reference_never_truncated(reference):
    assert parse_bible_ref(reference) is None


def test_bible_lists_ranges_and_missing_markers(monkeypatch):
    html = '<article><span class="v" id="v43-3-16-1"><a class="vl">16</a>Deus amou o mundo<a class="b">+</a></span><span class="v" id="v43-3-17-1">Não selecionado</span><span class="v" id="v43-3-18-1">Exerce fé</span></article>'
    monkeypatch.setattr(scraper, "fetch_url", lambda url: html)
    result = fetch_verse_content("João 3:16,18")
    assert (
        "Exerce fé" in result["verse_text"]
        and "Não selecionado" not in result["verse_text"]
    )
    assert fetch_verse_content("João 3:99") is None
    monkeypatch.setattr(
        scraper,
        "fetch_url",
        lambda url: "<article>16 Um número em texto comum</article>",
    )
    assert fetch_verse_content("João 3:16") is None
    assert parse_bible_ref("João 3:16-4:2")["spans"] == [(3, 16, 4, 2)]


def test_keywords_preserve_debt_and_history():
    assert "dividas" in extract_theocratic_keywords(
        "Quais princios e exemplos bíblicos temos para lidar com dividas e fabricar dinheiro?"
    )
    history = [
        {"role": "user", "content": "Como lidar com dívida?"},
        {"role": "assistant", "content": "Resposta anterior"},
    ]
    assert "dívida" in research.topic_query("Aprofunde", history)
    assert "dívida" in research.topic_query(
        "Ferramenta: tabela comparativa", history, ToolOptions(kind="comparison")
    )


def test_titles_are_not_rewritten():
    assert (
        scraper.clean_result_title("Seja Feliz — Felipe", "https://wol.jw.org/a")
        == "Seja Feliz — Felipe"
    )


def test_evidence_selects_late_paragraph_and_real_title(monkeypatch):
    monkeypatch.setattr(
        research,
        "search_wol_direct",
        lambda *a, **k: [
            {"title": "Título incorreto", "link": "https://wol.jw.org/article"}
        ],
    )
    html = (
        "<article><h1>Título real</h1>"
        + "<p>"
        + "introdução " * 500
        + "</p><p>A dívida deve ser analisada com cuidado e planejamento.</p></article>"
    )
    monkeypatch.setattr(research, "get_clean_document", lambda *a: html)
    sources = research.collect_evidence("dívida", "pt", "quick")
    assert sources[0]["title"] == "Título real"
    assert any("planejamento" in p["text"] for p in sources[0]["passages"])


def test_uncollected_links_are_not_published_as_sources():
    sources = [{"id": "S1", "title": "Título real", "link": "https://wol.jw.org/real"}]
    answer, cited, warnings = research.render_citations(
        "Princípio [S1]. Outro [S999]. [Inventado](https://evil.test/forged)", sources
    )
    assert "https://evil.test" not in answer and "[referência não confirmada]" in answer
    assert cited == ["S1"] and warnings


def test_empty_retrieval_does_not_call_model(monkeypatch):
    monkeypatch.setattr(research, "collect_evidence", lambda *a: [])
    llm = Mock()
    monkeypatch.setattr(research, "OpenAI", llm)
    result = research.run_research(
        "amor",
        [],
        "deepseek",
        "fake",
        "https://api.deepseek.com",
        None,
        "quick",
        "pt",
        False,
    )
    assert result["status"] == "insufficient_evidence"
    llm.assert_not_called()


def test_no_silent_fallback_and_deadline_reset(monkeypatch):
    generate = Mock(side_effect=SimpleProviderError(503))
    monkeypatch.setattr(main, "run_research", generate)
    response = client.post(
        "/api/chat",
        headers={"X-Deepseek-Api-Key": "fake"},
        json={"query": "amor", "provider": "deepseek"},
    )
    assert response.status_code == 503 and generate.call_count == 1
    assert safety.deadline.get() is None


class SimpleProviderError(Exception):
    def __init__(self, status_code):
        self.status_code = status_code


def test_expired_deadline_stops_work():
    token = safety.deadline.set(time.monotonic() - 1)
    try:
        with pytest.raises(safety.SearchDeadline):
            safety.remaining()
    finally:
        safety.deadline.reset(token)


def test_model_receives_only_selected_provider_and_tool(monkeypatch):
    generate = Mock(return_value={"ai_response": "ok", "results": []})
    monkeypatch.setattr(main, "run_research", generate)
    response = client.post(
        "/api/chat",
        headers={"X-Deepseek-Api-Key": "fake"},
        json={
            "query": "amor",
            "provider": "deepseek",
            "mode": "deep",
            "tool": {"kind": "family", "profiles": ["teens", "seniors"]},
        },
    )
    assert response.status_code == 200
    args = generate.call_args.args
    assert (
        args[2] == "deepseek"
        and args[4] == "https://api.deepseek.com"
        and args[6] == "deep"
    )
    assert args[-1].profiles == ["teens", "seniors"]


def test_wol_result_uses_document_metadata_not_embedded_verse(monkeypatch):
    import rag_engine

    html = '<li class="result"><li class="searchResult docId-2012808"><article><p>Lidar com dívidas</p><a href="/pt/wol/bc/r5/lp-t/123/1">Romanos 13:8</a></article></li></li>'
    monkeypatch.setattr(rag_engine, "fetch_url", lambda url: html)
    result = search_wol_direct("dívidas")[0]
    assert result["link"] == "https://wol.jw.org/pt/wol/d/r5/lp-t/2012808"
    assert result["title"] == "Lidar com dívidas"


def test_request_body_limit_and_beta_access(monkeypatch):
    assert client.post("/api/chat", content=b"x" * 1_000_001).status_code == 413
    monkeypatch.setenv("JW_ACCESS_TOKEN", "beta-test-only")
    assert client.post("/api/chat", json={"query": "amor"}).status_code == 401
    monkeypatch.setattr(
        main, "run_research", lambda *a: {"ai_response": "ok", "results": []}
    )
    response = client.post(
        "/api/chat",
        headers={"X-JW-Access-Token": "beta-test-only", "X-Gemini-Api-Key": "fake"},
        json={"query": "amor", "provider": "gemini"},
    )
    assert response.status_code == 200


def test_provider_timeout_is_504_not_503(monkeypatch):
    monkeypatch.setattr(
        main, "run_research", Mock(side_effect=SimpleProviderError(504))
    )
    response = client.post(
        "/api/chat",
        headers={"X-Gemini-Api-Key": "fake"},
        json={"query": "amor", "provider": "gemini"},
    )
    assert response.status_code == 504
