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

class TestApiKeyFlow(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Backup original client and key
        self.original_key = scraper.GEMINI_API_KEY
        self.original_client = scraper.client

    def tearDown(self):
        # Restore original state
        scraper.GEMINI_API_KEY = self.original_key
        scraper.client = self.original_client

    def test_search_without_key_fails_with_401(self):
        """When neither server nor client provides an API key, /api/search must return 401."""
        scraper.client = None
        scraper.GEMINI_API_KEY = None
        
        response = self.client.get("/api/search?q=teste")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Chave da API do Gemini", response.json()["detail"])
        print("PASS: Search without key correctly returned 401 with informative error.")

    def test_config_status_endpoint(self):
        """The /api/config endpoint must return status dictionary."""
        response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("has_key", data)
        print(f"PASS: /api/config returned has_key={data['has_key']}")

    def test_search_with_client_header_key(self):
        """When a client provides X-Gemini-Api-Key, it should be received and processed."""
        # Using a dummy client key to verify it is accepted and handled by the endpoint
        response = self.client.get(
            "/api/search?q=amor",
            headers={"X-Gemini-Api-Key": "AIzaSyDummyTestKeyForVerificationOnly12345"}
        )
        # The key is dummy so Google will return an error (400 or 500), but not 401 missing key!
        self.assertNotEqual(response.status_code, 401)
        print("PASS: Custom client header X-Gemini-Api-Key was accepted and processed by backend.")

    def test_reader_does_not_require_api_key(self):
        """The WOL reader /api/read must work independently without an AI key."""
        scraper.client = None
        scraper.GEMINI_API_KEY = None
        
        # Test with an official WOL URL
        url = "https://wol.jw.org/pt/wol/d/r5/lp-t/1200002781"
        response = self.client.get(f"/api/read?url={url}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("content", response.json())
        print("PASS: WOL reader accessed article cleanly without requiring an AI key.")

if __name__ == "__main__":
    unittest.main()
