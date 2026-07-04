import subprocess
import sys
import os
import re
import time
import threading

os.chdir(r'C:\Users\30466\Documents\trae_projects\旅游')

# Start HTTP server
http = subprocess.Popen(
    [sys.executable, '-m', 'http.server', '8085'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(1)
print("HTTP server started on port 8085", flush=True)

# Start SSH tunnel
ssh = subprocess.Popen(
    ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=NUL',
     '-o', 'ServerAliveInterval=10', '-o', 'ServerAliveCountMax=3',
     '-R', '80:localhost:8085', 'nokey@localhost.run'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
)

url = None
for line in iter(ssh.stdout.readline, ''):
    print(line, end='', flush=True)
    m = re.search(r'https://[a-z0-9]+\.lhr\.life', line)
    if m:
        url = m.group(0)
        break

if url:
    print(f'\nPUBLIC_URL={url}', flush=True)
    # Keep alive
    while True:
        time.sleep(30)
        if ssh.poll() is not None:
            print("Tunnel died!", flush=True)
            break
else:
    print("Failed to get URL", flush=True)
    ssh.terminate()

http.terminate()