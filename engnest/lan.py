"""局域网访问：在本机起一个 HTTP 服务，让同一网络下的手机/电脑用浏览器打开 EngNest。

- 静态文件：直接提供 web/ 目录
- 接口：POST /api/<方法名>，body 为 {"args": [...]}，需要请求头 X-EngNest-Key 带上访问码
- 只开放学习需要的方法；改 AI 设置、打开文件夹等只能在电脑上操作
"""

import hmac
import ipaddress
import json
import os
import secrets
import socket
import subprocess
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from .paths import resource_dir

DEFAULT_PORT = 8766

# 局域网设备可以调用的方法
ALLOWED = {
    "progress_load", "progress_rev", "progress_save", "get_presets", "get_ai_settings",
    "ai_chat", "test_ai", "tts", "tts_voices", "tts_cache_info",
    "dict_lookup", "dict_search", "dict_status",
    "library_list", "library_load", "wiki_search", "wiki_article",  # 局域网设备只能看，不能导入和删除
    "kv_get", "kv_all", "kv_set", "kv_set_many",
}


def new_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


_FAKE_NET = ipaddress.ip_network("198.18.0.0/15")  # 代理软件 TUN 模式常用的网段
_ips_cache = (0.0, [])


def _usable(ip: str) -> bool:
    a = ipaddress.ip_address(ip)
    return not (a.is_loopback or a.is_link_local or a in _FAKE_NET)


def _gateway_ips() -> list:
    """Windows 上查出「有默认网关、正在连接」的网卡地址，基本就是连着路由器的那块网卡。"""
    if os.name != "nt":
        return []
    cmd = ("Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } "
           "| ForEach-Object { $_.IPv4Address.IPAddress }")
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True,
                             timeout=10, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return [line.strip() for line in out.stdout.splitlines() if line.strip()]
    except (OSError, subprocess.SubprocessError):
        return []


def _score(ip: str) -> int:
    """没有网关信息时的排序依据：家用路由器常见网段优先，虚拟网卡（多以 .1 结尾）靠后。"""
    a = ipaddress.ip_address(ip)
    s = 3 if ip.startswith("192.168.") else 2 if ip.startswith("10.") else 1 if a.is_private else 0
    return s - (2 if ip.endswith(".1") else 0)


def local_ips() -> list:
    """本机的局域网 IPv4 地址，最可能被手机访问到的排在最前面（结果缓存 10 分钟）。"""
    global _ips_cache
    if time.time() - _ips_cache[0] < 600 and _ips_cache[1]:
        return _ips_cache[1]
    candidates = []
    try:
        candidates += socket.gethostbyname_ex(socket.gethostname())[2]
    except OSError:
        pass
    try:
        # 不会真的发包，只是让系统选出默认出口网卡
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            candidates.append(s.getsockname()[0])
    except OSError:
        pass
    gateway = [ip for ip in _gateway_ips() if _usable(ip)]
    rest = sorted({ip for ip in candidates if _usable(ip)} - set(gateway), key=_score, reverse=True)
    ips = gateway + rest or ["127.0.0.1"]
    _ips_cache = (time.time(), ips)
    return ips


class Handler(SimpleHTTPRequestHandler):
    # Windows 注册表里 .js 有时被映射成 text/plain，这里写死常用类型
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".ico": "image/x-icon",
    }

    def __init__(self, *args, server_ref=None, **kwargs):
        self.server_ref = server_ref
        super().__init__(*args, **kwargs)

    def log_message(self, *args):
        # 打包成无控制台的 exe 时 sys.stderr 是 None，默认日志会直接报错
        pass

    def end_headers(self):
        # 始终拿最新的页面和脚本，避免更新后手机上还是旧版本
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_POST(self):
        # 先把请求体读完：不读就回复并关闭连接，Windows 会发 RST，部分客户端会报「连接被中止」
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b""
        if not self.path.startswith("/api/"):
            return self._json(404, {"error": "not found"})
        name = self.path[5:].split("?")[0]
        key = self.headers.get("X-EngNest-Key", "")
        # 按字节比较：请求头里混进非 ASCII 字符时 compare_digest(str, str) 会直接抛异常
        if not hmac.compare_digest(key.encode("utf-8", "replace"), self.server_ref.code.encode()):
            return self._json(401, {"error": "访问码不正确"})
        if name == "ping":
            return self._json(200, {"ok": True})
        if name not in ALLOWED:
            return self._json(403, {"error": "这个操作只能在电脑上进行"})
        try:
            body = json.loads(raw or b"{}")
            result = getattr(self.server_ref.api, name)(*body.get("args", []))
            return self._json(200, {"result": result})
        except Exception as e:  # 接口出错不影响服务继续运行
            return self._json(500, {"error": str(e)})

    def _json(self, code, data):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


class LanServer:
    def __init__(self, api):
        self.api = api
        self.code = ""
        self.port = DEFAULT_PORT
        self.httpd = None
        self.error = ""

    @property
    def running(self) -> bool:
        return self.httpd is not None

    def start(self, port: int, code: str) -> bool:
        self.stop()
        self.port, self.code, self.error = port, code, ""
        handler = partial(Handler, directory=str(resource_dir() / "web"), server_ref=self)
        try:
            self.httpd = ThreadingHTTPServer(("0.0.0.0", port), handler)
        except OSError as e:
            self.httpd = None
            self.error = f"端口 {port} 无法使用（{e.strerror or e}），换一个端口试试"
            return False
        self.httpd.daemon_threads = True
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return True

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None

    def urls(self) -> list:
        return [f"http://{ip}:{self.port}/" for ip in local_ips()]


def qr_svg(text: str) -> str:
    import qrcode
    import qrcode.image.svg

    img = qrcode.make(text, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=2)
    return img.to_string(encoding="unicode")
