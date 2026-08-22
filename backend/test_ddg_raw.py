import urllib.request
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

url = "https://html.duckduckgo.com/html/?q=ora%C3%A7%C3%A3o&kl=br-pt"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        print(f"Status Code: {response.status}")
        print(f"HTML Length: {len(html)}")
        print("First 1000 characters:")
        print(html[:1000])
        # Search for any "result" or "error" elements
        if "result__body" in html:
            print("Contains result__body!")
        else:
            print("Does NOT contain result__body.")
            # Let's save the HTML for analysis
            with open("ddg_error.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("Saved ddg_error.html")
except Exception as e:
    print(f"Error: {e}")
