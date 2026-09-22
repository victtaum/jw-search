import os
import socket
import pytest

# Set before app imports: ordinary tests never load local or hosted credentials.
for key in ("GEMINI_API_KEY", "DEEPSEEK_API_KEY", "HY3_API_KEY", "OPENAI_API_KEY"):
    os.environ.pop(key, None)
os.environ["JW_DISABLE_DOTENV"] = "1"


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    original_connect = socket.socket.connect

    def blocked(*args, **kwargs):
        raise AssertionError("Network is forbidden in offline tests")

    def connect(sock, address):
        # Windows implements asyncio's internal socketpair using loopback TCP.
        if isinstance(address, tuple) and address[0] in ("127.0.0.1", "::1"):
            return original_connect(sock, address)
        return blocked()

    monkeypatch.setattr(socket, "getaddrinfo", blocked)
    monkeypatch.setattr(socket.socket, "connect", connect)
