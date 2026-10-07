"""WebDAV 同步：多台电脑之间通过网盘（坚果云、Nextcloud 等支持 WebDAV 的服务）同步学习进度。

- 只同步学习进度（progress），不同步设置和 API Key；
- 同步 = 下载网盘上的 EngNest/progress.json → 按记录合并进本机（和局域网多设备一样的规则，见 progress.merge_all）
  → 合并结果上传回去。两台电脑各学各的也不会互相覆盖；
- 只允许 https 地址（http 只允许本机地址，开发测试用），密码用 secret.protect 加密保存。
"""

import base64
import json
import logging
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from . import APP_NAME, VERSION, net

log = logging.getLogger(__name__)
FILE = "progress.json"
AUTO_MINUTES = 15


class WebDavError(Exception):
    pass


class Client:
    def __init__(self, url: str, user: str, password: str, folder: str = APP_NAME):
        url = (url or "").strip()
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" and parsed.hostname not in ("127.0.0.1", "localhost"):
            raise WebDavError("WebDAV 地址必须以 https:// 开头（密码要加密传输）")
        self.base = url.rstrip("/") + "/" + urllib.parse.quote(folder.strip("/")) + "/"
        token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
        self.headers = {"Authorization": f"Basic {token}", "User-Agent": net.UA}

    def _req(self, method, name="", data=None, headers=None):
        req = urllib.request.Request(self.base + urllib.parse.quote(name), data=data, method=method,
                                     headers={**self.headers, **(headers or {})})
        try:
            return net.urlopen(req, timeout=30)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                raise WebDavError("用户名或密码不对（坚果云要用「应用密码」，不是登录密码）") from e
            raise

    def ensure_folder(self):
        try:
            self._req("MKCOL").close()
        except urllib.error.HTTPError as e:
            if e.code not in (405, 301, 409):  # 405：已经有了
                raise WebDavError(f"创建网盘文件夹失败（HTTP {e.code}）") from e

    def get(self, name):
        try:
            with self._req("GET", name) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise WebDavError(f"下载失败（HTTP {e.code}）") from e

    def put(self, name, data: bytes):
        try:
            self._req("PUT", name, data=data, headers={"Content-Type": "application/json; charset=utf-8"}).close()
        except urllib.error.HTTPError as e:
            raise WebDavError(f"上传失败（HTTP {e.code}）") from e


class Sync:
    def __init__(self, settings, progress):
        self.settings = settings
        self.progress = progress
        self._lock = threading.Lock()
        self.state = {"running": False, "last": "", "error": "", "changed_local": False}
        self._timer = None

    def cfg(self) -> dict:
        return self.settings.section("webdav", {"url": "", "user": "", "password": "", "folder": APP_NAME, "auto": True})

    def configured(self) -> bool:
        c = self.cfg()
        return bool(c.get("url") and c.get("user") and c.get("password"))

    def sync(self) -> dict:
        """同步一次，返回 {ok, changed_local, error, last}"""
        if not self.configured():
            return {"ok": False, "error": "还没有填写 WebDAV 地址、用户名和密码"}
        if not self._lock.acquire(blocking=False):
            return {"ok": False, "error": "正在同步，请稍等"}
        self.state["running"] = True
        try:
            c = self.cfg()
            client = Client(c["url"], c["user"], c["password"], c.get("folder") or APP_NAME)
            client.ensure_folder()
            raw = client.get(FILE)
            before = self.progress.load()
            if raw:
                from .progress import read_export_bytes

                remote = read_export_bytes(raw)
                merged = self.progress.merge_in(remote)
            else:
                merged = before
            changed_local = merged != before
            doc = {"app": APP_NAME, "version": VERSION, "exported": time.strftime("%Y-%m-%d %H:%M:%S"), "data": merged}
            body = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            if not raw or json.loads(raw.decode("utf-8")).get("data") != merged:
                client.put(FILE, body)
            last = time.strftime("%Y-%m-%d %H:%M:%S")
            self.state.update(last=last, error="", changed_local=changed_local)
            log.info("WebDAV 同步完成（本机%s变化）", "有" if changed_local else "没有")
            return {"ok": True, "changed_local": changed_local, "last": last}
        except (WebDavError, OSError, ValueError) as e:
            msg = str(e) if isinstance(e, WebDavError) else f"同步失败：{getattr(e, 'reason', e)}"
            self.state.update(error=msg)
            log.warning("WebDAV 同步失败：%s", e)
            return {"ok": False, "error": msg}
        finally:
            self.state["running"] = False
            self._lock.release()

    # ---------- 自动同步：启动后、每 15 分钟、关闭时 ----------
    def start_auto(self):
        if self.configured() and self.cfg().get("auto", True):
            self._schedule(10)

    def _schedule(self, delay):
        self._timer = threading.Timer(delay, self._tick)
        self._timer.daemon = True
        self._timer.start()

    def _tick(self):
        if self.configured() and self.cfg().get("auto", True):
            self.sync()
            self._schedule(AUTO_MINUTES * 60)

    def stop(self):
        if self._timer:
            self._timer.cancel()
