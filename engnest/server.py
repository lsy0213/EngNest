"""服务器模式：不开窗口，在服务器上提供网页和接口，用账号登录（engnest/accounts.py）。

    python main.py --server                    # 默认 8766 端口，自签名 HTTPS（手机浏览器要 HTTPS 才能录音）
    python main.py --server --port 8766 --public-ip 1.2.3.4 --domain en.example.cn
    python main.py --invite --admin            # 生成管理员邀请码（第一次部署时用它注册自己的账号）
    python main.py --users                     # 列出账号

和局域网访问共用同一套网页服务（lan.Handler），只是：
- 认证用登录凭证（请求头 X-EngNest-Session），不用访问码；登录、注册、重置密码这三个接口不用登录，输错多次按 IP 限流；
- 管理员（admin）用的是主人的那一份进度和设置，能改 AI 设置、管理邀请码和账号、下载词典和语音模型；
- 普通账号用自己的那一份（data_dir/profiles/<账号 id>/），能填自己的 AI Key；管理员可以给 TA 开「可以用我的 AI」；
- 每 6 小时给所有人的进度各备份一次（每天的备份同一天覆盖，保留 7 天）；收到 SIGTERM（systemctl stop）时先备份再退出。
"""

import logging
import signal
import threading
import time

from . import accounts, lan

log = logging.getLogger(__name__)

PUBLIC = {"account_login", "account_register", "account_reset_password"}
ACCOUNT = {"account_info", "account_logout", "account_change_password"}
# 普通账号能用的：局域网里其他人能用的那些（学习、查词、AI、自己的 AI 设置）
USER_ALLOWED = set(lan.ALLOWED)
# 管理员另外能用的：主人的设置、下载数据、管理账号（打开文件夹、选文件这类只有电脑上才有的操作不在里面）
ADMIN_ALLOWED = {
    "ai_models", "ai_usage", "ai_set_limit", "test_ai",
    "dict_download_full", "dict_remove_full",
    "offline_tts_install", "offline_tts_remove", "tts_clear_cache",
    "stt_download", "stt_remove",
    "net_get", "net_set", "net_test",
    "library_import_text", "library_delete", "pack_install", "pack_remove",
    "app_info", "update_check",
    "admin_users", "admin_user_ai", "admin_user_reset", "admin_user_remove",
    "admin_invites", "admin_invite_new", "admin_invite_revoke",
}


class AccountServer(lan.LanServer):
    def __init__(self, api, acc: accounts.Accounts = None):
        super().__init__(api)
        self.accounts = acc or accounts.Accounts()
        self.extra_hosts = []  # 证书里额外写上的公网 IP / 域名

    def start(self, port: int, code: str = "", https: bool = True) -> bool:
        if https and self.extra_hosts:
            ips = lan.local_ips
            lan.local_ips = lambda: list(dict.fromkeys(self.extra_hosts + ips()))  # 证书里带上公网 IP
            try:
                return super().start(port, code, https)
            finally:
                lan.local_ips = ips
        return super().start(port, code, https)

    def who(self, key):  # 服务器模式不用访问码
        return False

    # ---------- 请求 ----------
    def dispatch(self, name: str, args: list, headers, ip: str) -> tuple:
        if name in PUBLIC:
            return self._public(name, args, ip)
        token = headers.get("X-EngNest-Session", "")
        acc = self.accounts.session_user(token)
        if not acc:
            return 401, {"error": "请先登录", "auth": "account", "server": True}
        if name == "ping":
            return 200, {"ok": True, "name": acc["username"], "admin": acc["admin"], "server": True}
        if name in ACCOUNT:
            return self._account(name, args, acc, token)
        if name.startswith("admin_"):
            if not acc["admin"]:
                return 403, {"error": "只有管理员能做这个操作"}
            return self._admin(name, args)
        allowed = USER_ALLOWED | (ADMIN_ALLOWED if acc["admin"] else set())
        if name not in allowed:
            return 403, {"error": "这个操作在服务器上不能用"}
        if acc["admin"]:
            return self.call(None, name, args, admin=True, account=acc)
        return self.call({"id": acc["id"], "name": acc["username"], "ai": acc["ai"]}, name, args, account=acc)

    def _public(self, name, args, ip) -> tuple:
        wait = self.guard.blocked(ip)
        if wait > 0:
            return 429, {"error": f"输错太多次了，请 {int(wait // 60) + 1} 分钟后再试", "wait": int(wait)}
        a = (list(args) + ["", "", ""])[:3]
        if name == "account_login":
            r = self.accounts.login(a[0], a[1])
        elif name == "account_register":
            r = self.accounts.register(a[0], a[1], a[2])
        else:
            r = self.accounts.reset_password(a[0], a[1], a[2])
        if r.get("ok"):
            self.guard.ok(ip)
        elif name != "account_register" or "邀请码" in r.get("error", ""):
            self.guard.fail(ip)  # 猜密码、猜邀请码、猜重置码都算输错（用户名格式不对这种不算）
        return 200, {"result": r}

    def _account(self, name, args, acc, token) -> tuple:
        if name == "account_info":
            return 200, {"result": {"username": acc["username"], "admin": acc["admin"], "created": acc["created"]}}
        if name == "account_logout":
            self.accounts.logout(token)
            return 200, {"result": True}
        a = (list(args) + ["", ""])[:2]
        return 200, {"result": self.accounts.change_password(acc["id"], a[0], a[1], keep_token=token)}

    def _admin(self, name, args) -> tuple:
        A = self.accounts
        a = list(args) + [None, None]
        if name == "admin_users":
            return 200, {"result": [{**u, "own_ai": self.api._own_ai(u["id"]) if not u["admin"] else True} for u in A.users()]}
        if name == "admin_user_ai":
            A.set_ai(a[0], bool(a[1]))
            return 200, {"result": True}
        if name == "admin_user_reset":
            return 200, {"result": A.new_reset(a[0])}
        if name == "admin_user_remove":
            u = A.get(a[0])
            if not u:
                return 404, {"error": "没有这个账号"}
            if u["admin"]:
                return 403, {"error": "管理员账号不能在这里删除"}
            A.remove(u["id"])
            self.api._delete_profile(u["id"])
            return 200, {"result": True}
        if name == "admin_invites":
            return 200, {"result": A.invites()}
        if name == "admin_invite_new":
            return 200, {"result": A.new_invite(admin=False, note=a[0] or "")}
        if name == "admin_invite_revoke":
            A.revoke_invite(a[0])
            return 200, {"result": True}
        return 404, {"error": "没有这个接口"}


def run(port: int = lan.DEFAULT_PORT, https: bool = True, extra_hosts=()):
    """前台运行，直到收到 SIGTERM / Ctrl+C"""
    from .api import Api

    api = Api()
    srv = AccountServer(api)
    srv.extra_hosts = [h for h in extra_hosts if h]
    if not srv.accounts.has_admin():
        code = srv.accounts.new_invite(admin=True, note="第一次部署")
        log.warning("还没有管理员账号。管理员邀请码：%s（打开网页，用它注册你自己的账号）", code)
        print(f"还没有管理员账号。管理员邀请码：{code}\n打开网页，用它注册你自己的账号（密码自己设）。", flush=True)
    if not srv.start(port, https=https):
        raise SystemExit(srv.error)
    scheme = "https" if srv.https else "http"
    print(f"EngNest 服务器已启动：{scheme}://<服务器地址>:{port}/", flush=True)
    log.info("服务器模式启动：%s 端口 %d", scheme, port)

    stop = threading.Event()

    def backups():
        while not stop.wait(6 * 3600):
            api.backup_all([u["id"] for u in srv.accounts.users() if not u["admin"]])

    threading.Thread(target=backups, daemon=True, name="backups").start()
    api.backup_all([u["id"] for u in srv.accounts.users() if not u["admin"]])

    def quit_(*_):
        stop.set()

    signal.signal(signal.SIGTERM, quit_)
    signal.signal(signal.SIGINT, quit_)
    while not stop.wait(1):
        pass
    log.info("服务器模式退出：备份后关闭")
    srv.stop()
    api.backup_all([u["id"] for u in srv.accounts.users() if not u["admin"]])
    api._piper.stop()
    api._webdav.stop()
    time.sleep(0.2)
