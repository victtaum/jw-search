import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import scraper
from main import app
from rag_engine import search_wol_direct, fetch_rag_context

class TestMultiModelAndRAGFlow(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.original_key = scraper.GEMINI_API_KEY
        self.original_client = scraper.client

    def tearDown(self):
        scraper.GEMINI_API_KEY = self.original_key
        scraper.client = self.original_client

    def test_search_gemini_without_key_fails_with_401(self):
        """When neither server nor client provides a Gemini key, /api/search must return 401."""
        scraper.client = None
        scraper.GEMINI_API_KEY = None
        
        response = self.client.get("/api/search?q=teste&provider=gemini")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Gemini", response.json()["detail"])
        print("PASS: Search without Gemini key correctly returned 401 with informative error.")

    def test_search_deepseek_without_key_fails_with_401(self):
        """When no DeepSeek or fallback keys are provided, /api/search?provider=deepseek must return 401."""
        scraper.client = None
        scraper.GEMINI_API_KEY = None
        orig_gem = os.environ.pop("GEMINI_API_KEY", None)
        orig_ds = os.environ.pop("DEEPSEEK_API_KEY", None)
        orig_hy3 = os.environ.pop("HY3_API_KEY", None)
        try:
            response = self.client.get("/api/search?q=amor&provider=deepseek")
            self.assertEqual(response.status_code, 401)
            self.assertIn("chave", response.json()["detail"].lower())
            print("PASS: DeepSeek search without key returned 401.")
        finally:
            if orig_gem: os.environ["GEMINI_API_KEY"] = orig_gem
            if orig_ds: os.environ["DEEPSEEK_API_KEY"] = orig_ds
            if orig_hy3: os.environ["HY3_API_KEY"] = orig_hy3

    def test_search_hy3_without_any_keys_fails_with_401(self):
        """When neither Hy3 nor Gemini keys are provided anywhere, /api/search?provider=hy3 must return 401."""
        scraper.client = None
        scraper.GEMINI_API_KEY = None
        orig_gem = os.environ.pop("GEMINI_API_KEY", None)
        orig_hy3 = os.environ.pop("HY3_API_KEY", None)
        orig_oa = os.environ.pop("OPENAI_API_KEY", None)
        try:
            response = self.client.get("/api/search?q=paz&provider=hy3")
            self.assertEqual(response.status_code, 401)
            self.assertIn("chave", response.json()["detail"].lower())
            print("PASS: Hy3 search without any server/client keys correctly returned 401.")
        finally:
            if orig_gem: os.environ["GEMINI_API_KEY"] = orig_gem
            if orig_hy3: os.environ["HY3_API_KEY"] = orig_hy3
            if orig_oa: os.environ["OPENAI_API_KEY"] = orig_oa

    def test_direct_wol_rag_retrieval(self):
        """The custom RAG retrieval engine must fetch real articles and links from wol.jw.org."""
        results = search_wol_direct("amor leal", lang="pt", max_results=5)
        self.assertGreater(len(results), 0)
        first = results[0]
        self.assertIn("title", first)
        self.assertIn("link", first)
        self.assertTrue(first["link"].startswith("https://wol.jw.org/"))
        print(f"PASS: Custom RAG successfully retrieved {len(results)} articles from wol.jw.org (Ex: '{first['title']}').")

    def test_reader_does_not_require_api_key(self):
        """The WOL reader /api/read must work independently without an AI key."""
        url = "https://wol.jw.org/pt/wol/d/r5/lp-t/1200002781"
        response = self.client.get(f"/api/read?url={url}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("content", response.json())
        print("PASS: WOL reader accessed article cleanly without requiring an AI key.")

    def test_export_docx_endpoint(self):
        """The /api/export/docx endpoint must convert markdown into a valid docx binary."""
        md_sample = """# Estudo Bíblico
### 📌 Síntese
Este é um teste de **exportação DOCX**.

| Personagem | Lição |
| :--- | :--- |
| Noé | Obediência e Fé |
| Abraão | Confiança Plena |
"""
        response = self.client.post("/api/export/docx", json={
            "title": "Estudo de Teste",
            "content": md_sample
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        self.assertGreater(len(response.content), 1000)
        print(f"PASS: /api/export/docx generated valid Word document ({len(response.content)} bytes).")

    def test_chat_endpoint_validates_payload(self):
        """The /api/chat endpoint must accept conversation history."""
        response = self.client.post("/api/chat", json={
            "query": "crie uma tabela comparando os pontos anteriores",
            "history": [
                {"role": "user", "content": "Quem foi Noé?"},
                {"role": "assistant", "content": "Noé foi um homem justo que construiu a arca."}
            ],
            "provider": "hy3"
        })
        # If no key, returns 401, or if key present returns 200
        self.assertIn(response.status_code, [200, 401, 429])
        print(f"PASS: /api/chat accepted multi-turn history payload (Status: {response.status_code}).")

    def test_diagnostics_endpoint(self):
        """The /api/diagnostics endpoint must return system latency and provider status."""
        response = self.client.get("/api/diagnostics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("providers", data)
        self.assertIn("wol_library", data["providers"])
        print(f"PASS: /api/diagnostics returned system health and WOL latency ({data['providers']['wol_library'].get('latency_ms')} ms).")

if __name__ == "__main__":
    unittest.main()
