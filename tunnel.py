import subprocess
import threading
import time
import sys
import os
import re

os.chdir(r'C:\Users\30466\Documents\trae_projects\旅游')

# Start HTTP server
http = subprocess.Popen(
    [sys.executable, '-m', 'http.server', '8084'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
print("HTTP server started on port 8084")

# Start SSH tunnel
ssh = subprocess.Popen(
    ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=NUL',
     '-o', 'ServerAliveInterval=30', '-R', '80:localhost:8084', 'nokey@localhost.run'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

url_found = None
for line in iter(ssh.stdout.readline, ''):
    print(line, end='', flush=True)
    m = re.search(r'https://[a-z0-9]+\.lhr\.life', line)
    if m:
        url_found = m.group(0)
        with open('public_url.txt', 'w') as f:
            f.write(url_found + '\n')
        print(f'\n\n===== PUBLIC URL: {url_found} =====\n', flush=True)
        break

# Keep running
try:
    while True:
        time.sleep(60)
        if ssh.poll() is not None:
            print("SSH tunnel died, restarting...")
            break
except KeyboardInterrupt:
    pass
finally:
    http.terminate()
    ssh.terminate()