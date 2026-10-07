"""开发预览用的静态服务器：和 python -m http.server 一样，但不让浏览器缓存（改了 JS 刷新就生效）。
/packs/ 指向数据目录里的资料包，和局域网访问时一样。

    python tools/dev_server.py 8790
"""

import sys
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCache(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "application/javascript; charset=utf-8"}

    def translate_path(self, path):
        clean = path.split("?", 1)[0]
        if clean.startswith("/packs/"):
            sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
            from engnest.packs import packs_dir

            return str(packs_dir() / urllib.parse.unquote(clean[len("/packs/"):]))
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    web = Path(__file__).resolve().parent.parent / "web"
    ThreadingHTTPServer(("127.0.0.1", port), partial(NoCache, directory=str(web))).serve_forever()
