import urllib.request
import urllib.parse
import sys
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

query = "site:jw.org/pt oração"
safe_query = urllib.parse.quote(query)
url = f"https://www.mojeek.com/search?q={safe_query}"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        print(f"Status Code: {response.status}")
        
        soup = BeautifulSoup(html, "html.parser")
        results = soup.find_all("li")
        print(f"Found {len(results)} list items.")
        
        count = 0
        for i, res in enumerate(results):
            # In Mojeek, the title link usually has class "t" or is just a link inside a result-link block
            title_a = res.find("a", class_="t") or res.find("a")
            # Snippet is often in a p or span with class "s" or just a p
            snippet_p = res.find("p", class_="s") or res.find("span", class_="s")
            
            if title_a and title_a.get("href") and (title_a.get("href").startswith("http") or title_a.get("href").startswith("https")):
                count += 1
                title = title_a.text.strip()
                link = title_a.get("href")
                desc = snippet_p.text.strip() if snippet_p else ""
                print(f"\nMojeek Result {count}:")
                print(f"  Title: {title}")
                print(f"  Link: {link}")
                print(f"  Snippet: {desc}")
                if count >= 5:
                    break
                    
except Exception as e:
    print(f"Error: {e}")
