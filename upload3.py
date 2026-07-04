import requests
import json

with open('demo.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Try paste.mod.gg (returns raw URL)
print("=== Trying paste.mod.gg ===")
try:
    r = requests.post('https://paste.mod.gg/documents', data=content.encode('utf-8'), timeout=15)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        key = r.json().get('key', '')
        raw_url = f"https://paste.mod.gg/raw/{key}"
        print(f"Raw URL: {raw_url}")
except Exception as e:
    print(f"Error: {e}")

# Try rentry.co
print("\n=== Trying rentry.co ===")
try:
    r = requests.post('https://rentry.co/api/new',
        data={'text': content, 'edit_code': 'travel2025'},
        timeout=15)
    print(f"Status: {r.status_code}")
    result = r.json()
    if result.get('status') == '200':
        url = result.get('url', '')
        print(f"URL: {url}")
        print(f"Raw: {url}/raw")
    else:
        print(f"Response: {result}")
except Exception as e:
    print(f"Error: {e}")

# Try ix.io
print("\n=== Trying ix.io ===")
try:
    r = requests.post('http://ix.io', data={'f:1': content.encode('utf-8')}, timeout=15)
    print(f"Status: {r.status_code}")
    print(f"URL: {r.text.strip()}")
except Exception as e:
    print(f"Error: {e}")