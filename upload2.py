import requests
import json

# Read the HTML file
with open('demo.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Try tiiny.host API
print("Trying tiiny.host...")
try:
    r = requests.post('https://api.tiiny.host/v1/upload',
        files={'file': ('index.html', content.encode('utf-8'), 'text/html')},
        timeout=30)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Try dpaste.org
print("\nTrying dpaste.org...")
try:
    r = requests.post('https://dpaste.org/api/',
        data={'content': content, 'syntax': 'html', 'expiry_days': 7},
        timeout=15)
    print(f"Status: {r.status_code}")
    print(f"URL: {r.text.strip()}")
except Exception as e:
    print(f"Error: {e}")

# Try dpaste.com
print("\nTrying dpaste.com...")
try:
    r = requests.post('https://dpaste.com/api/',
        data={'content': content, 'syntax': 'html', 'expiry_days': 7},
        timeout=15)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")