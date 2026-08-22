import sys
from scraper import search_ddg

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print("Searching DDG for external sources with 'oração'...")
results = search_ddg("oração", is_external=True)
print(f"Found {len(results)} results.")
for idx, r in enumerate(results[:5]):
    print(f"\nResult {idx+1}:")
    print(f"  Title: {r['title']}")
    print(f"  Link: {r['link']}")
    print(f"  Publication: {r['publication']}")
    print(f"  External: {r['is_external']}")
    print(f"  Snippet: {r['snippet']}")
