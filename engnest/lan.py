"""局域网访问：在本机起一个 HTTP 服务，让同一网络下的手机/电脑用浏览器打开 EngNest。

- 静态文件：直接提供 web/ 目录
- 接口：POST /api/<方法名>，body 为 {"args": [...]}，需要请求头 X-EngNest-Key 带上访问码
- 只开放学习需要的方法；改 AI 设置、打开文件夹等只能在电脑上操作
- 访问码是 8 位字母数字（约 1 万亿种）；同一个地址 10 分钟内输错 5 次锁 10 分钟，
  所有地址加起来 10 分钟内错 30 次就全部锁 10 分钟，防止在局域网里暴力猜
- 请求体最大 20 MB
- 多人使用：主人的访问码打开主人的进度（和电脑共用）；给其他人（朋友、家人）各发一个自己的访问码，
  用那个码进来的人有单独的一份进度、生词本、设置和 AI 语伴聊天记录（data_dir/profiles/<id>/），互不影响。
  每个人可以在自己的设置里填自己的 AI Key（加密存在 TA 的 profiles/<id>/settings.json，不算进主人的用量）；
  没填的话，主人可以单独给 TA 开「用我的 AI」（用主人的 Key，费用算主人的）
"""

import hmac
import ipaddress
import json
import logging
import os
import secrets
import socket
import subprocess
import threading
import time
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from .paths import resource_dir

DEFAULT_PORT = 8766
MAX_BODY = 20 * 1024 * 1024
CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # 去掉了容易看错的 0 O 1 I L
WINDOW = 600          # 统计输错次数的时间窗口（秒）
LOCK = 600            # 锁定时长（秒）
MAX_FAIL_PER_IP = 5
MAX_FAIL_TOTAL = 30
log = logging.getLogger(__name__)

# 局域网设备可以调用的方法
ALLOWED = {
    "progress_load", "progress_rev", "progress_save", "get_presets", "get_ai_settings",
    "save_ai_settings", "ai_models",  # 只有其他人能改，改的是 TA 自己的 AI 设置；主人的只能在电脑上改（api 里会拒绝）
    "ai_chat", "ai_stream_start", "ai_stream_poll", "test_ai", "tts", "tts_offline", "offline_tts_status", "tts_voices", "tts_cache_info",
    "dict_lookup", "dict_search", "dict_status",
    "library_list", "library_load", "wiki_search", "wiki_article",  # 局域网设备只能看，不能导入和删除
    "kv_get", "kv_all", "kv_set", "kv_set_many", "pack_status",
    "stt_status", "stt_transcribe", "stt_assess",  # 手机上通过 HTTPS 录音后，识别在电脑上做
}


def new_code() -> str:
    return "".join(secrets.choice(CODE_CHARS) for _ in range(8))


def norm_code(code: str) -> str:
    """输入时可以带空格、横线，不分大小写"""
    return "".join(ch for ch in str(code or "").upper() if ch.isalnum())


def is_weak(code: str) -> bool:
    """旧版本的 6 位数字访问码：太短，启动时自动换成新的"""
    return len(norm_code(code)) < 8


class Guard:
    """输错访问码的限流"""

    def __init__(self):
        self._lock = threading.Lock()
        self.fails = {}       # ip → [时间, ...]
        self.locked = {}      # ip → 解锁时间；"*" 表示全部锁住
        self.total = []

    def blocked(self, ip: str) -> float:
        now = time.time()
        with self._lock:
            return max(self.locked.get(ip, 0), self.locked.get("*", 0)) - now

    def fail(self, ip: str):
        now = time.time()
        with self._lock:
            lst = [t for t in self.fails.get(ip, []) if now - t < WINDOW] + [now]
            self.fails[ip] = lst
            self.total = [t for t in self.total if now - t < WINDOW] + [now]
            if len(lst) >= MAX_FAIL_PER_IP:
                self.locked[ip] = now + LOCK
                self.fails[ip] = []
                log.warning("局域网访问：%s 连续输错访问码，锁定 %d 分钟", ip, LOCK // 60)
            if len(self.total) >= MAX_FAIL_TOTAL:
                self.locked["*"] = now + LOCK
                self.total = []
                log.warning("局域网访问：短时间内大量输错访问码，全部锁定 %d 分钟", LOCK // 60)

    def ok(self, ip: str):
        with self._lock:
            self.fails.pop(ip, None)

    def reset(self):
        with self._lock:
            self.fails, self.locked, self.total = {}, {}, []


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
    # HTTP/1.1：一条连接连续请求很多个文件（页面有一百多个脚本），不用每个文件都重新握手（HTTPS 握手很慢）
    protocol_version = "HTTP/1.1"

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
        ".webmanifest": "application/manifest+json",
    }

    def __init__(self, *args, server_ref=None, **kwargs):
        self.server_ref = server_ref
        super().__init__(*args, **kwargs)

    def translate_path(self, path):
        # /packs/... 是用户下载的资料包，在数据目录里，不在 web/ 下
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == "/packs" or clean.startswith("/packs/"):
            from .packs import packs_dir

            rel = urllib.parse.unquote(clean[len("/packs"):]).lstrip("/")
            root = packs_dir().resolve()
            target = (root / rel).resolve()
            return str(target) if (target == root or root in target.parents) else str(root / "__forbidden__")
        return super().translate_path(path)

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
        if length > MAX_BODY:
            self.close_connection = True
            return self._json(413, {"error": "请求太大"})
        raw = self.rfile.read(length) if length > 0 else b""
        if not self.path.startswith("/api/"):
            return self._json(404, {"error": "not found"})
        try:
            args = json.loads(raw or b"{}").get("args", [])
        except (ValueError, AttributeError):
            return self._json(400, {"error": "请求格式不对"})
        status, data = self.server_ref.dispatch(self.path[5:].split("?")[0], args if isinstance(args, list) else [],
                                                self.headers, self.client_ip())
        return self._json(status, data)

    def client_ip(self) -> str:
        """服务器模式前面有 Nginx 时，请求都从本机转过来：用 Nginx 带的 X-Real-IP（只信本机来的）"""
        ip = self.client_address[0]
        if ip in ("127.0.0.1", "::1") and self.headers.get("X-Real-IP"):
            return self.headers["X-Real-IP"].strip()
        return ip

    def _json(self, code, data):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


class _Server(ThreadingHTTPServer):
    """HTTPS 时在处理请求的线程里做 TLS 握手：慢的或者用 http 连进来的设备不会卡住其他请求"""

    daemon_threads = True
    tls = None

    def finish_request(self, request, client_address):
        if self.tls:
            request.settimeout(15)
            request = self.tls.wrap_socket(request, server_side=True)
            request.settimeout(None)
        super().finish_request(request, client_address)

    def handle_error(self, request, client_address):
        # 用 http 打开了 https 地址、证书被拒绝、手机锁屏断开……都很常见，记一下就行
        log.debug("局域网连接出错 %s", client_address, exc_info=True)


class LanServer:
    def __init__(self, api):
        self.api = api
        self.code = ""
        self.port = DEFAULT_PORT
        self.httpd = None
        self.error = ""
        self.https = False
        self.guard = Guard()
        self.users = []  # 其他人：[{id, name, code, ai}]，设置里改了就整个换掉

    # ---------- 一个接口请求：认证 → 白名单 → 调用（账号服务器 server.AccountServer 换掉认证和白名单） ----------
    def dispatch(self, name: str, args: list, headers, ip: str) -> tuple:
        """返回 (HTTP 状态码, 响应 JSON)"""
        guard = self.guard
        wait = guard.blocked(ip)
        if wait > 0:
            return 429, {"error": f"访问码输错太多次，请 {int(wait // 60) + 1} 分钟后再试", "wait": int(wait)}
        user = self.who(headers.get("X-EngNest-Key", ""))
        if user is False:
            guard.fail(ip)
            return 401, {"error": "访问码不正确"}
        guard.ok(ip)
        if name == "ping":
            return 200, {"ok": True, "name": user["name"] if user else None}
        if name not in ALLOWED:
            return 403, {"error": "这个操作只能在电脑上进行"}
        # user：None 是主人，否则是 {id, name, ai}；接口按它决定读写哪一份进度、能不能用 AI
        return self.call(user, name, args)

    def call(self, user, name: str, args: list, **ctx) -> tuple:
        try:
            result = self.api.lan_call(user, name, args, **ctx)
            if name == "get_ai_settings" and isinstance(result, dict):
                result = {k: v for k, v in result.items() if k != "key_hint"}  # Key 的任何部分都不发给其他设备
            return 200, {"result": result}
        except PermissionError as e:  # 比如用主人的访问码从手机上改 AI 设置
            return 403, {"error": str(e)}
        except TypeError as e:  # 参数个数不对
            log.warning("接口 %s 参数不对：%s", name, e)
            return 400, {"error": "参数不对"}
        except Exception as e:  # 接口出错不影响服务继续运行
            log.exception("接口 %s 出错", name)
            return 500, {"error": str(e)}

    def who(self, key: str):
        """访问码属于谁：主人返回 None，其他人返回 {id, name, ai}，都不对返回 False。
        每个码都比一遍（按字节、恒定时间比较；请求头里混进非 ASCII 字符时 compare_digest(str, str) 会直接抛异常）"""
        k = norm_code(key).encode("utf-8", "replace")
        found = False
        if self.code and hmac.compare_digest(k, norm_code(self.code).encode()):
            found = None
        for u in self.users:
            if u.get("code") and hmac.compare_digest(k, norm_code(u["code"]).encode()):
                found = {"id": u["id"], "name": u.get("name", ""), "ai": bool(u.get("ai"))}
        return found

    @property
    def running(self) -> bool:
        return self.httpd is not None

    host = "0.0.0.0"  # 服务器模式在 Nginx 后面时只听本机：127.0.0.1

    def start(self, port: int, code: str, https: bool = True) -> bool:
        """https=True：用自签名证书提供 HTTPS（手机浏览器只有 HTTPS 才允许录音）"""
        self.stop()
        self.port, self.code, self.error = port, code, ""
        self.guard.reset()
        handler = partial(Handler, directory=str(resource_dir() / "web"), server_ref=self)
        try:
            self.httpd = _Server((self.host, port), handler)
        except OSError as e:
            self.httpd = None
            self.error = f"端口 {port} 无法使用（{e.strerror or e}），换一个端口试试"
            return False
        self.https = False
        if https:
            try:
                from . import lancert

                self.httpd.tls = lancert.context(local_ips())
                self.https = True
            except Exception as e:  # noqa: BLE001 — 生成证书失败就退回 http（只是不能录音）
                log.warning("局域网 HTTPS 证书生成失败，改用 http：%s", e)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return True

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None

    def urls(self) -> list:
        scheme = "https" if self.https else "http"
        return [f"{scheme}://{ip}:{self.port}/" for ip in local_ips()]


def qr_svg(text: str) -> str:
    import qrcode
    import qrcode.image.svg

    img = qrcode.make(text, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=2)
    return img.to_string(encoding="unicode")
