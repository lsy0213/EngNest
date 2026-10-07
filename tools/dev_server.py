"""开发预览用的静态服务器：和 python -m http.server 一样，但不让浏览器缓存（改了 JS 刷新就生效）。

    python tools/dev_server.py 8790
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCache(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "application/javascript; charset=utf-8"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    web = Path(__file__).resolve().parent.parent / "web"
    ThreadingHTTPServer(("127.0.0.1", port), partial(NoCache, directory=str(web))).serve_forever()
