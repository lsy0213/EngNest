"""服务器模式的账号：注册（要邀请码）、登录、登录凭证、改密码、重置码。数据在数据目录的 accounts.db（SQLite）。

- 密码只存 scrypt 加盐哈希；登录凭证（session token）发给浏览器，库里只存它的 SHA-256，库泄露了也拿不到能用的凭证；
- 凭证 30 天没用就过期，每次使用顺延；改密码、被管理员删除时这个人的凭证全部作废；
- 注册必须有邀请码，一个码只能用一次；管理员邀请码（服务器第一次部署时在命令行生成）注册出来的是管理员；
- 忘记密码：管理员生成一个 24 小时内有效的重置码发给这个人，凭重置码设新密码。

每个账号的学习进度、设置、AI Key、AI 语伴聊天记录放在 data_dir/profiles/<账号 id>/（和局域网「给其他人用」是同一套），
管理员的就是主人的那一份（progress.db、settings.json）。
"""

import base64
import hashlib
import hmac
import re
import secrets
import sqlite3
import threading
import time

from .paths import data_dir

SESSION_DAYS = 30
RESET_HOURS = 24
_NAME = re.compile(r"^[A-Za-z0-9_\-一-鿿]{2,20}$")
_SCRYPT = {"n": 2**14, "r": 8, "p": 1}


def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode("utf-8"), salt=salt, dklen=32, **_SCRYPT)
    return "scrypt$%d$%d$%d$%s$%s" % (_SCRYPT["n"], _SCRYPT["r"], _SCRYPT["p"], base64.b64encode(salt).decode(), base64.b64encode(h).decode())


def check_password(pw: str, stored: str) -> bool:
    try:
        _, n, r, p, salt, h = stored.split("$")
        got = hashlib.scrypt(pw.encode("utf-8"), salt=base64.b64decode(salt), dklen=32, n=int(n), r=int(r), p=int(p))
        return hmac.compare_digest(got, base64.b64decode(h))
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(str(token or "").encode("utf-8")).hexdigest()


def new_code() -> str:
    from .lan import new_code as code  # 8 位、去掉容易看错的字母，和访问码一样

    return code()


class Accounts:
    def __init__(self, path=None):
        self.path = path or (data_dir() / "accounts.db")
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self.path, check_same_thread=False, isolation_level=None)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.executescript("""
            CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, pw TEXT NOT NULL,
                admin INTEGER NOT NULL DEFAULT 0, ai INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, last_seen REAL);
            CREATE TABLE IF NOT EXISTS invites (code TEXT PRIMARY KEY, admin INTEGER NOT NULL DEFAULT 0, note TEXT,
                created REAL NOT NULL, used_by TEXT, used_at REAL);
            CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, uid TEXT NOT NULL, created REAL NOT NULL, expires REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS resets (code TEXT PRIMARY KEY, uid TEXT NOT NULL, expires REAL NOT NULL);
        """)

    def _one(self, sql, args=()):
        return self._db.execute(sql, args).fetchone()

    @staticmethod
    def _user(row) -> dict:
        return {"id": row[0], "username": row[1], "admin": bool(row[3]), "ai": bool(row[4]), "created": row[5], "last_seen": row[6]}

    # ---------- 注册 / 登录 ----------
    def check_new(self, username: str, password: str) -> str:
        """用户名、密码不合要求时返回原因"""
        if not _NAME.match(username or ""):
            return "用户名 2–20 个字，只能用中文、英文字母、数字、下划线和横线"
        if len(password or "") < 8:
            return "密码至少 8 位"
        if len(password) > 128:
            return "密码太长了"
        return ""

    def register(self, code: str, username: str, password: str) -> dict:
        """{ok, token} 或 {ok: False, error}"""
        from .lan import norm_code

        username = (username or "").strip()
        err = self.check_new(username, password)
        if err:
            return {"ok": False, "error": err}
        pw = hash_password(password)
        with self._lock:
            inv = self._one("SELECT code, admin FROM invites WHERE code=? AND used_by IS NULL", (norm_code(code),))
            if not inv:
                return {"ok": False, "error": "邀请码不对，或者已经被用过了"}
            if self._one("SELECT 1 FROM users WHERE username=?", (username,)):
                return {"ok": False, "error": f"用户名「{username}」已经有人用了"}
            uid = secrets.token_hex(4)
            while self._one("SELECT 1 FROM users WHERE id=?", (uid,)):
                uid = secrets.token_hex(4)
            self._db.execute("INSERT INTO users (id, username, pw, admin, ai, created, last_seen) VALUES (?,?,?,?,?,?,?)",
                             (uid, username, pw, inv[1], 0, time.strftime("%Y-%m-%d"), time.time()))
            self._db.execute("UPDATE invites SET used_by=?, used_at=? WHERE code=?", (uid, time.time(), inv[0]))
            if inv[1]:  # 管理员注册好了：其他还没用的管理员邀请码全部作废，免得被别人拿去注册管理员
                self._db.execute("DELETE FROM invites WHERE admin=1 AND used_by IS NULL")
        return {"ok": True, "token": self._new_session(uid)}

    def login(self, username: str, password: str) -> dict:
        row = self._one("SELECT * FROM users WHERE username=?", ((username or "").strip(),))
        # 用户名不存在时也算一次哈希，不让人从响应时间猜出哪些用户名存在
        if not row:
            check_password(password or "", hash_password("x"))
            return {"ok": False, "error": "用户名或密码不对"}
        if not check_password(password or "", row[2]):
            return {"ok": False, "error": "用户名或密码不对"}
        return {"ok": True, "token": self._new_session(row[0])}

    def _new_session(self, uid: str) -> str:
        token = secrets.token_urlsafe(32)
        now = time.time()
        with self._lock:
            self._db.execute("DELETE FROM sessions WHERE expires < ?", (now,))
            self._db.execute("INSERT INTO sessions (token, uid, created, expires) VALUES (?,?,?,?)",
                             (_token_hash(token), uid, now, now + SESSION_DAYS * 86400))
        return token

    def session_user(self, token: str):
        """凭证对应的账号（顺延有效期），无效返回 None"""
        if not token:
            return None
        now = time.time()
        h = _token_hash(token)
        row = self._one("SELECT u.*, s.expires FROM sessions s JOIN users u ON u.id = s.uid WHERE s.token=?", (h,))
        if not row or row[-1] < now:
            return None
        if row[-1] - now < (SESSION_DAYS - 1) * 86400:  # 一天顺延一次就够，不用每个请求都写库
            with self._lock:
                self._db.execute("UPDATE sessions SET expires=? WHERE token=?", (now + SESSION_DAYS * 86400, h))
                self._db.execute("UPDATE users SET last_seen=? WHERE id=?", (now, row[0]))
        return self._user(row)

    def logout(self, token: str):
        with self._lock:
            self._db.execute("DELETE FROM sessions WHERE token=?", (_token_hash(token),))

    def change_password(self, uid: str, old: str, new: str, keep_token: str = "") -> dict:
        row = self._one("SELECT * FROM users WHERE id=?", (uid,))
        if not row or not check_password(old or "", row[2]):
            return {"ok": False, "error": "原密码不对"}
        err = self.check_new(row[1], new)
        if err:
            return {"ok": False, "error": err}
        with self._lock:
            self._db.execute("UPDATE users SET pw=? WHERE id=?", (hash_password(new), uid))
            # 其他设备上的登录全部作废，当前这台保留
            self._db.execute("DELETE FROM sessions WHERE uid=? AND token != ?", (uid, _token_hash(keep_token)))
        return {"ok": True}

    # ---------- 重置密码 ----------
    def new_reset(self, uid: str) -> str:
        code = new_code()
        with self._lock:
            self._db.execute("DELETE FROM resets WHERE uid=? OR expires < ?", (uid, time.time()))
            self._db.execute("INSERT INTO resets (code, uid, expires) VALUES (?,?,?)", (code, uid, time.time() + RESET_HOURS * 3600))
        return code

    def reset_password(self, code: str, username: str, new: str) -> dict:
        from .lan import norm_code

        row = self._one("SELECT r.uid, u.username FROM resets r JOIN users u ON u.id = r.uid WHERE r.code=? AND r.expires > ?",
                        (norm_code(code), time.time()))
        if not row or row[1].lower() != (username or "").strip().lower():
            return {"ok": False, "error": "重置码不对、已经过期，或者和用户名对不上"}
        err = self.check_new(row[1], new)
        if err:
            return {"ok": False, "error": err}
        with self._lock:
            self._db.execute("UPDATE users SET pw=? WHERE id=?", (hash_password(new), row[0]))
            self._db.execute("DELETE FROM resets WHERE uid=?", (row[0],))
            self._db.execute("DELETE FROM sessions WHERE uid=?", (row[0],))
        return {"ok": True, "token": self._new_session(row[0])}

    # ---------- 管理 ----------
    def new_invite(self, admin: bool = False, note: str = "") -> str:
        code = new_code()
        with self._lock:
            self._db.execute("INSERT INTO invites (code, admin, note, created) VALUES (?,?,?,?)", (code, int(admin), (note or "")[:40], time.time()))
        return code

    def invites(self) -> list:
        rows = self._db.execute("""SELECT i.code, i.admin, i.note, i.created, i.used_at, u.username FROM invites i
                                   LEFT JOIN users u ON u.id = i.used_by ORDER BY i.created DESC LIMIT 100""").fetchall()
        return [{"code": r[0], "admin": bool(r[1]), "note": r[2] or "", "created": time.strftime("%Y-%m-%d", time.localtime(r[3])),
                 "used_by": r[5], "used_at": time.strftime("%Y-%m-%d", time.localtime(r[4])) if r[4] else ""} for r in rows]

    def revoke_invite(self, code: str):
        with self._lock:
            self._db.execute("DELETE FROM invites WHERE code=? AND used_by IS NULL", (code,))

    def users(self) -> list:
        return [self._user(r) for r in self._db.execute("SELECT * FROM users ORDER BY created, username").fetchall()]

    def get(self, uid: str):
        row = self._one("SELECT * FROM users WHERE id=?", (uid,))
        return self._user(row) if row else None

    def set_ai(self, uid: str, on: bool):
        with self._lock:
            self._db.execute("UPDATE users SET ai=? WHERE id=?", (int(bool(on)), uid))

    def remove(self, uid: str):
        with self._lock:
            self._db.execute("DELETE FROM users WHERE id=?", (uid,))
            self._db.execute("DELETE FROM sessions WHERE uid=?", (uid,))
            self._db.execute("DELETE FROM resets WHERE uid=?", (uid,))

    def has_admin(self) -> bool:
        return bool(self._one("SELECT 1 FROM users WHERE admin=1"))

    def admin_invite(self) -> str:
        """还没有管理员时用的邀请码：已经有一个没用的就沿用（重启服务不会越攒越多），没有再生成"""
        row = self._one("SELECT code FROM invites WHERE admin=1 AND used_by IS NULL ORDER BY created DESC")
        return row[0] if row else self.new_invite(admin=True, note="第一次部署")
