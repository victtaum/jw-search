import sys
import os

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


from scraper import perform_ai_grounded_search, get_clean_document

def test_search():
    query = "o diluvio realmente aconteceu?"
    print(f"Testing RAG search for: '{query}' (only official sources)")
    response = perform_ai_grounded_search(query, include_external=False)
    
    print("\n--- AI Synthesized Response ---")
    print(response.get("ai_response"))
    
    results = response.get("results", [])
    print(f"\nFound {len(results)} cited sources:")
    for idx, r in enumerate(results[:5]):
        print(f"\nSource {idx+1}:")
        print(f"  Title: {r['title']}")
        print(f"  Publication: {r['publication']}")
        print(f"  Link: {r['link']}")
        print(f"  External: {r['is_external']}")
        print(f"  Snippet: {r['snippet'][:150]}")
    
    print("=" * 60)

def test_reader():
    url = "https://wol.jw.org/pt/wol/d/r5/lp-t/1200002781"
    print(f"\nTesting Reader View for: {url}")
    content = get_clean_document(url)
    if content:
        print(f"Successfully retrieved document content. Length: {len(content)} characters.")
        print("Content preview (first 400 chars):")
        print(content[:400])
    else:
        print("Failed to retrieve document content.")

if __name__ == "__main__":
    print("Starting Scraper Tests...")
    test_search()
    test_reader()
    print("\nTests complete!")
