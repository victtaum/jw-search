"""Small ASGI boundary: bounded bodies and optional private-beta access token."""

import hmac
import os
from starlette.responses import JSONResponse


class RequestBoundary:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        access = os.environ.get("JW_ACCESS_TOKEN", "")
        if (
            access
            and scope["path"] in ("/api/chat", "/api/search", "/api/diagnostics")
            and scope["method"] != "OPTIONS"
        ):
            supplied = headers.get(b"x-jw-access-token", b"").decode("utf-8", "replace")
            if not hmac.compare_digest(supplied.encode(), access.encode()):
                return await JSONResponse(
                    {"detail": "Código de acesso necessário para este servidor."},
                    status_code=401,
                )(scope, receive, send)
        if scope["method"] in ("POST", "PUT", "PATCH"):
            chunks, size = [], 0
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                chunk = message.get("body", b"")
                size += len(chunk)
                if size > 1_000_000:
                    return await JSONResponse(
                        {"detail": "Requisição maior que 1 MB."}, status_code=413
                    )(scope, receive, send)
                chunks.append(chunk)
                if not message.get("more_body", False):
                    break
            delivered = False
            original_receive = receive

            async def bounded_receive():
                nonlocal delivered
                if delivered:
                    return await original_receive()
                delivered = True
                return {
                    "type": "http.request",
                    "body": b"".join(chunks),
                    "more_body": False,
                }

            receive = bounded_receive

        async def secure_send(message):
            if message["type"] == "http.response.start":
                message.setdefault("headers", []).extend(
                    [
                        (b"x-content-type-options", b"nosniff"),
                        (b"referrer-policy", b"no-referrer"),
                        (
                            b"content-security-policy",
                            b"object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
                        ),
                    ]
                )
            await send(message)

        await self.app(scope, receive, secure_send)
