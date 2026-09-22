"""Network, rendering and provider boundaries shared by retrieval and the API."""

import ipaddress
import os
import socket
import time
from contextvars import ContextVar
from urllib.parse import urljoin, urlsplit

import nh3
import urllib3


class UnsafeURL(ValueError):
    pass


class SearchDeadline(TimeoutError):
    pass


deadline = ContextVar("search_deadline", default=None)


def remaining(cap=30.0):
    end = deadline.get()
    seconds = min(cap, end - time.monotonic()) if end else cap
    if seconds <= 0.1:
        raise SearchDeadline("O tempo disponível para esta pesquisa terminou.")
    return seconds


def official_url(url):
    host = (urlsplit(url).hostname or "").lower()
    return host == "jw.org" or host.endswith(".jw.org")


def validate_url(url):
    try:
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.username
            or parsed.password
            or parsed.port not in (None, 443)
            or any(ord(c) < 33 for c in url)
            or "\\" in url
        ):
            raise UnsafeURL(
                "Use uma URL HTTPS pública, sem credenciais e na porta padrão."
            )
        host = parsed.hostname.encode("idna").decode("ascii")
        addresses = list(
            dict.fromkeys(
                a[4][0] for a in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
            )
        )
        if not addresses or any(
            not ipaddress.ip_address(a).is_global for a in addresses
        ):
            raise UnsafeURL("Endereços internos ou reservados não são permitidos.")
        return parsed, host, addresses
    except (ValueError, UnicodeError) as exc:
        raise UnsafeURL("URL inválida ou endereço não permitido.") from exc


def fetch_public_html(url, max_bytes=2_000_000):
    """Pin the checked address; revalidate each redirect; never use proxy credentials."""
    stop = time.monotonic() + remaining(8)
    for _ in range(4):
        parsed, host, addresses = validate_url(url)
        budget = min(remaining(8), stop - time.monotonic())
        if budget <= 0:
            raise SearchDeadline("Tempo de leitura da fonte esgotado.")
        pool = urllib3.HTTPSConnectionPool(
            addresses[0],
            port=443,
            server_hostname=host,
            assert_hostname=host,
            cert_reqs="CERT_REQUIRED",
        )
        response = None
        try:
            response = pool.urlopen(
                "GET",
                (parsed.path or "/") + ("?" + parsed.query if parsed.query else ""),
                headers={
                    "Host": host,
                    "User-Agent": "JWSearch/2.19 (+https://github.com/victtaum/jw-search)",
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Encoding": "identity",
                },
                timeout=urllib3.Timeout(
                    total=budget, connect=min(3, budget), read=budget
                ),
                retries=False,
                redirect=False,
                preload_content=False,
            )
            if response.status in (301, 302, 303, 307, 308):
                url = urljoin(url, response.headers.get("location", ""))
                continue
            if response.status != 200:
                return None
            if not any(
                t in response.headers.get("content-type", "").lower()
                for t in ("text/html", "application/xhtml+xml")
            ):
                return None
            chunks, size = [], 0
            while True:
                remaining(8)
                if time.monotonic() >= stop:
                    raise SearchDeadline("Tempo de leitura da fonte esgotado.")
                chunk = response.read(32_768, decode_content=True)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise ValueError("Documento maior que o limite de leitura.")
                chunks.append(chunk)
            return b"".join(chunks).decode("utf-8", errors="replace")
        finally:
            if response is not None:
                response.close()
            pool.close()
    raise UnsafeURL("Número excessivo de redirecionamentos.")


def sanitize_article(html, base_url):
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    for image in soup.find_all("img"):
        image["src"] = (
            image.get("src")
            or image.get("data-src")
            or image.get("data-img-small-src")
            or ""
        )
    for tag in soup.find_all(True):
        for attr in ("href", "src"):
            if tag.get(attr):
                url = urljoin(base_url, tag[attr])
                if urlsplit(url).scheme == "https":
                    tag[attr] = url
                else:
                    del tag[attr]
    return nh3.clean(
        str(soup),
        tags={
            "div",
            "section",
            "article",
            "header",
            "p",
            "span",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "strong",
            "em",
            "b",
            "i",
            "u",
            "br",
            "hr",
            "ul",
            "ol",
            "li",
            "blockquote",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "a",
            "img",
            "figure",
            "figcaption",
            "sup",
            "sub",
        },
        attributes={
            "*": {"id", "class"},
            "a": {"href", "title"},
            "img": {"src", "alt", "width", "height"},
            "td": {"colspan", "rowspan"},
            "th": {"colspan", "rowspan"},
        },
        url_schemes={"https"},
        link_rel="noopener noreferrer",
    )


def provider_endpoint(provider, supplied=None):
    name = (
        "hy3"
        if provider in ("hy3", "hunyuan", "tencent", "openai", "openrouter")
        else provider
    )
    registry = {
        "deepseek": "https://api.deepseek.com",
        "hy3": "https://openrouter.ai/api/v1",
        "gemini": None,
    }
    if name not in registry:
        raise ValueError("Provedor desconhecido.")
    expected = (
        os.environ.get(f"JW_{name.upper()}_BASE_URL", registry[name])
        if name != "gemini"
        else None
    )
    if supplied and supplied.rstrip("/") != (expected or "").rstrip("/"):
        raise ValueError(
            "O endpoint deve corresponder ao provedor configurado no servidor."
        )
    return name, expected
