
import requests, os
url="https://github.com/freedoom/freedoom/releases/latest/download/freedoom2.wad"
dest="assets/wad/freedoom2.wad"
os.makedirs("assets/wad",exist_ok=True)
if not os.path.exists(dest):
    r=requests.get(url)
    open(dest,"wb").write(r.content)
