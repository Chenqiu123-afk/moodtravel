import requests
import re

with open('demo.html', 'rb') as f:
    content = f.read()

# Try multiple upload services
services = [
    ('https://bashupload.com/', 'file'),
    ('https://envs.sh/', 'file'),
    ('https://temp.sh/upload', 'file'),
]

for url, field in services:
    try:
        r = requests.post(url, files={field: ('demo.html', content, 'text/html')}, timeout=15)
        print(f"Service: {url}")
        print(f"Status: {r.status_code}")
        urls = re.findall(r'https?://[^\s<>"\']+', r.text)
        for u in urls:
            if any(k in u.lower() for k in ['demo', 'envs', 'temp', 'bashupload']):
                print(f"URL: {u}")
        if not urls:
            print(r.text[:300])
        print("---")
        if r.status_code == 200 and urls:
            break
    except Exception as e:
        print(f"Error with {url}: {e}")
        print("---")