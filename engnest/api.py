"""暴露给前端 JS 调用的接口（window.pywebview.api.*）。

pywebview 会在独立线程里执行这些方法，所以 AI 请求阻塞也不会卡住界面。
"""

import logging
import os
import secrets
import shutil
import threading
import time

from . import VERSION, ai_client, ai_usage, dictionary, ext, films, kvcache, lan, library, net, offline_tts, packs, paths, progress, settings, stt, tts, webdav, webimport, wiki
from .log import log_file
from .paths import data_dir

log = logging.getLogger(__name__)

DEFAULT_AI = {"provider": "none", "base_url": "", "model": "", "api_key": ""}
PERSONAL_KV = {"tutor"}  # 每个人自己的（AI 语伴聊天记录）；其他命名空间是翻译、精讲的缓存，大家共用
NO_AI = "你还没有可用的 AI：可以在「设置 → AI 接入」填你自己的 API Key，或者请电脑主人在电脑的「设置 → 局域网访问」里给你开启。"


class Api:
    def __init__(self):
        self._dir = data_dir()
        self._settings = settings.Settings()
        net.set_proxy(self._settings.section("net").get("proxy", ""))
        self._progress = progress.Progress()
        self._kv = kvcache.KVCache()
        self._backup_today()
        self._webdav = webdav.Sync(self._settings, self._progress)
        self._webdav.start_auto()
        self._lan = lan.LanServer(self)
        self._dict = dictionary.Dictionary()
        self._lib = library.Library()
        self._stt = stt.Stt()
        self._piper = offline_tts.OfflineTTS()
        self._films = films.Films()
        self._ext = ext.Ext()
        self._packs = packs.Packs(self._dict.phonetic)
        self._window = None  # main.py 创建窗口后设置，用来弹出选择文件的对话框
        self._streams = {}  # 正在流式生成的 AI 回复
        self._streams_lock = threading.Lock()
        # 局域网里其他人：当前请求是谁（每个请求在自己的线程里处理），以及每个人的进度
        self._ctx = threading.local()
        self._profiles = {}
        self._profile_settings = {}  # 其他人自己的设置（目前只有 AI），profiles/<id>/settings.json，Key 同样用 DPAPI 加密
        self._profiles_lock = threading.Lock()
        # 查询网卡要调用 PowerShell，比较慢，启动时在后台先查好
        threading.Thread(target=lan.local_ips, daemon=True).start()

    def _autostart_lan(self):
        """启动时如果上次开着局域网访问，就自动打开。"""
        cfg = self._settings.section("lan")
        if cfg.get("enabled") and cfg.get("code"):
            if lan.is_weak(cfg["code"]):  # 旧版本的 6 位数字码换成 8 位的
                cfg = {**self._lan_cfg(), "code": lan.new_code()}
                self._save_lan_cfg(cfg)
            self._lan.users = cfg.get("users", [])
            self._lan.start(int(cfg.get("port") or lan.DEFAULT_PORT), cfg["code"], cfg.get("https", True))

    # ---------- 局域网里的其他人 ----------
    def lan_call(self, user, name, args, admin=False, account=None):
        """局域网 / 服务器接口的入口：user 是 None（主人）或 {id, name, ai}。在这个请求的线程里记下是谁，接口据此选进度、管 AI。
        服务器模式：account 是登录的账号 {id, username, admin, ...}；管理员 admin=True、user=None，用的是主人的那一份，
        而且能改主人的设置（局域网里用主人访问码的不行）"""
        self._ctx.user, self._ctx.lan, self._ctx.admin, self._ctx.account = user, True, admin, account
        try:
            return getattr(self, name)(*args)
        finally:
            self._ctx.user, self._ctx.lan, self._ctx.admin, self._ctx.account = None, False, False, None

    def _user(self):
        return getattr(self._ctx, "user", None)

    def _profile_dir(self, uid: str):
        return data_dir() / "profiles" / uid

    def _prog(self) -> progress.Progress:
        """当前请求该读写的进度：主人（电脑上、或用主人访问码进来的）是 progress.db，其他人各自一份"""
        user = self._user()
        if not user:
            return self._progress
        with self._profiles_lock:
            p = self._profiles.get(user["id"])
            if p is None:
                d = self._profile_dir(user["id"])
                d.mkdir(parents=True, exist_ok=True)
                p = self._profiles[user["id"]] = progress.Progress(d / "progress.db", backup_dir=d / "backups")
                try:
                    p.backup()  # 每天第一次用的时候备份一份
                except Exception:  # noqa: BLE001
                    log.exception("备份 %s 的进度失败", user["id"])
            return p

    def _user_settings(self, uid: str) -> settings.Settings:
        with self._profiles_lock:
            st = self._profile_settings.get(uid)
            if st is None:
                d = self._profile_dir(uid)
                d.mkdir(parents=True, exist_ok=True)
                st = self._profile_settings[uid] = settings.Settings(d / "settings.json")
            return st

    def _my_ai_store(self) -> settings.Settings:
        """当前请求的人自己的 AI 设置存在哪：主人是 settings.json，其他人是 profiles/<id>/settings.json"""
        user = self._user()
        return self._user_settings(user["id"]) if user else self._settings

    def _ai_plan(self):
        """这次 AI 调用用谁的配置：(cfg, 是不是用自己的 Key)；没有可用的返回 None。
        其他人：自己填了 Key 就用自己的；没填、而主人给 TA 开了，就用主人的"""
        user = self._user()
        owner = self._ai_cfg()
        if not user:
            return owner, False
        own = self._user_settings(user["id"]).section("ai", DEFAULT_AI)
        if _enabled(own):
            return own, True
        if user.get("ai") and _enabled(owner):
            return owner, False
        return None

    def _ai_denied(self) -> bool:
        return self._ai_plan() is None

    def _kv_ns(self, ns):
        user = self._user()
        return f"{ns}@{user['id']}" if user and ns in PERSONAL_KV else ns

    def _on_closing(self):
        """窗口关闭前：让前端把还没保存的改动发过来，再备份一次。
        在另一个线程里等前端（最多 3 秒），免得关闭窗口时卡住。"""
        if self._window:
            t = threading.Thread(target=lambda: self._window.evaluate_js("Store.flush().then(() => true)"), daemon=True)
            t.start()
            t.join(3)
        self._piper.stop()
        self._webdav.stop()
        if self._webdav.configured() and self._webdav.cfg().get("auto", True):
            t = threading.Thread(target=self._webdav.sync, daemon=True)  # 关闭前同步一次，最多等 10 秒
            t.start()
            t.join(10)
        try:
            self._progress.backup()
            with self._profiles_lock:
                for p in self._profiles.values():
                    p.backup()
        except Exception:  # noqa: BLE001 — 关闭时出错不能拦着用户关窗口
            log.exception("关闭时备份失败")

    def _backup_today(self):
        try:
            self._progress.backup()
        except Exception:  # noqa: BLE001
            log.exception("自动备份失败")

    def backup_all(self, uids=()):
        """主人和所有人的进度各备份一份（服务器模式每隔几小时调一次；同一天的每日备份会覆盖）"""
        self._backup_today()
        for uid in uids:
            self._ctx.user = {"id": uid, "name": "", "ai": False}
            try:
                self._prog().backup()
            except Exception:  # noqa: BLE001
                log.exception("备份 %s 的进度失败", uid)
            finally:
                self._ctx.user = None

    # ---------- 学习进度 ----------
    def progress_load(self):
        """{data, rev, notice}：notice 是启动时发生的事（比如从备份恢复），前端提示一次"""
        p, user = self._prog(), self._user()
        notice, p.notice = p.notice, ""
        acc = getattr(self._ctx, "account", None)
        who = {"name": acc["username"], "admin": bool(acc["admin"])} if acc else {"name": user["name"]} if user else None
        return {"data": p.load(), "rev": p.rev(), "notice": notice, "who": who}

    def progress_rev(self):
        return self._prog().rev()

    def progress_save(self, patch):
        """只传改动过的字段，按记录合并后写入，返回 {rev, changed}"""
        return self._prog().save_patch(patch)

    # ---------- AI 结果缓存（翻译、精讲） ----------
    def kv_get(self, ns, keys):
        return self._kv.get_many(self._kv_ns(ns), keys)

    def kv_all(self, ns):
        return self._kv.get_all(self._kv_ns(ns))

    def kv_set(self, ns, key, value):
        return self._kv.set(self._kv_ns(ns), key, value)

    def kv_set_many(self, ns, items):
        return self._kv.set_many(self._kv_ns(ns), items)

    def reset_progress(self):
        self._progress.reset(keep_prefs=True)
        return True

    def progress_backups(self):
        return {"dir": str(self._progress.backup_dir()), "items": self._progress.backups()}

    def progress_backup_now(self):
        return self._progress.backup(tag="manual").name

    def progress_restore(self, name):
        return self._progress.restore(name)

    def progress_export(self):
        """导出进度到用户选的位置。取消返回 None"""
        import json

        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "SAVE", None) or webview.SAVE_DIALOG
        name = f"EngNest-进度-{time.strftime('%Y%m%d')}.json"
        path = self._window.create_file_dialog(kind, save_filename=name, file_types=("JSON 文件 (*.json)",))
        if not path:
            return None
        path = path[0] if isinstance(path, (list, tuple)) else path
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self._progress.export_doc(), f, ensure_ascii=False, indent=1)
        return str(path)

    def progress_import(self, mode="merge"):
        """从文件导入进度。mode=merge 和现在的合并，replace 整个替换（替换前自动备份）。取消返回 None"""
        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "OPEN", None) or webview.OPEN_DIALOG
        paths_ = self._window.create_file_dialog(kind, allow_multiple=False, file_types=("JSON 文件 (*.json)", "所有文件 (*.*)"))
        if not paths_:
            return None
        try:
            data = progress.read_export(paths_[0] if isinstance(paths_, (list, tuple)) else paths_)
        except (OSError, ValueError) as e:
            return {"error": f"导入失败：{e}"}
        self._progress.backup(tag="before-import")
        if mode == "replace":
            self._progress.replace_all(data)
        else:
            self._progress.merge_in(data)
        return {"ok": True}

    # ---------- AI 设置 ----------
    def _ai_cfg(self) -> dict:
        return self._settings.section("ai", DEFAULT_AI)

    def get_presets(self):
        return ai_client.PRESETS

    def get_ai_settings(self):
        """返回给前端的设置里不包含完整 Key，只给一个掩码提示。
        局域网里的其他人拿到的是 TA 自己的设置（own：自己的 Key 能用；shared：主人给 TA 开了 AI）"""
        cfg = self._my_ai_store().section("ai", DEFAULT_AI)
        key = cfg.pop("api_key", "")
        cfg["has_key"] = bool(key)
        cfg["key_hint"] = f"{key[:3]}****{key[-4:]}" if len(key) > 8 else ("****" if key else "")
        cfg["enabled"] = _enabled({**cfg, "api_key": key})
        user = self._user()
        if user:
            cfg["own"] = cfg["enabled"]
            cfg["shared"] = bool(user.get("ai")) and _enabled(self._ai_cfg())
            cfg["enabled"] = cfg["own"] or cfg["shared"]
            if not cfg["enabled"]:  # 前端据此显示「填自己的 Key 或请主人开启」
                cfg["lan_denied"] = True
        return cfg

    def save_ai_settings(self, new_cfg):
        """主人只能在电脑上改；局域网里的其他人可以改 TA 自己的（存在 TA 的 profiles/<id>/settings.json）"""
        if getattr(self._ctx, "lan", False) and not self._user() and not getattr(self._ctx, "admin", False):
            raise PermissionError("AI 设置只能在电脑上修改")
        store = self._my_ai_store()
        cfg = store.section("ai", DEFAULT_AI)
        for field in ("provider", "base_url", "model"):
            if field in new_cfg:
                cfg[field] = (new_cfg[field] or "").strip()
        # 前端 Key 输入框留空表示「不修改」
        if new_cfg.get("api_key"):
            cfg["api_key"] = new_cfg["api_key"].strip()
        if new_cfg.get("clear_key"):
            cfg["api_key"] = ""
        store.update("ai", cfg)
        return self.get_ai_settings()

    def test_ai(self):
        return self.ai_chat(
            "You are a helpful assistant.",
            [{"role": "user", "content": "Reply with exactly: Hello from EngNest!"}],
        )

    def _ai_run(self, system, messages, json_mode=False, on_delta=None, plan=False):
        """调用 AI 并记用量。返回 {ok, text, data?, error?}
        plan：(cfg, own)，流式输出在后台线程里调用，拿不到「是谁」，要在请求线程里先算好传进来。
        用别人自己的 Key 时不算进主人的用量，也不受主人的每月上限限制"""
        if plan is False:
            plan = self._ai_plan()
        if plan is None:
            return {"ok": False, "error": NO_AI}
        cfg, own = plan
        if not own:
            msg = ai_usage.check_limit(self._settings.section("ai_limit"))
            if msg:
                return {"ok": False, "error": msg}
        try:
            text, usage = ai_client.chat(cfg, system, messages, json_mode=json_mode, on_delta=on_delta)
            if not own:
                ai_usage.record(cfg.get("model"), usage)
        except ai_client.AIError as e:
            return {"ok": False, "error": str(e)}
        except Exception as e:  # noqa: BLE001 — 兜底，避免异常直接抛到前端变成看不懂的报错
            log.exception("AI 调用出错")
            return {"ok": False, "error": f"未知错误：{e}"}
        out = {"ok": True, "text": text}
        if json_mode:
            try:
                out["data"] = ai_client.extract_json(text)
            except ValueError:
                return {"ok": False, "error": "AI 返回的格式有误", "text": text, "bad_json": True}
        return out

    def ai_chat(self, system, messages, opts=None):
        """opts: {"json": true} 让 AI 返回 JSON，结果在 data 里"""
        return self._ai_run(system, messages, json_mode=bool((opts or {}).get("json")))

    # 流式输出：前端先 ai_stream_start 拿到 id，再每隔一会儿 ai_stream_poll 取新生成的文字。
    # 用轮询而不是从 Python 往页面推，桌面版和局域网里的手机都能用同一套。
    def ai_stream_start(self, system, messages):
        sid = f"s{time.time_ns()}{secrets.token_hex(4)}"
        st = {"parts": [], "done": False, "result": None, "t": time.time()}
        plan = self._ai_plan()  # 后台线程里拿不到「是谁」，在这里先算好用谁的配置
        if plan is None:
            st.update(done=True, result={"ok": False, "error": NO_AI})
            with self._streams_lock:
                self._streams[sid] = st
            return sid
        with self._streams_lock:
            # 清掉一分钟前就结束、但前端没来取的
            for k in [k for k, v in self._streams.items() if v["done"] and time.time() - v["t"] > 60]:
                self._streams.pop(k, None)
            self._streams[sid] = st

        def run():
            st["result"] = self._ai_run(system, messages, on_delta=st["parts"].append, plan=plan)
            st["done"], st["t"] = True, time.time()

        threading.Thread(target=run, daemon=True, name="ai-stream").start()
        return sid

    def ai_stream_poll(self, sid, since=0):
        """{text: since 之后新生成的部分, n: 已取到第几段, done, result（结束时）}"""
        st = self._streams.get(sid)
        if not st:
            return {"text": "", "n": since, "done": True, "result": {"ok": False, "error": "这次对话已经过期了，请重试"}}
        parts = st["parts"][since:]
        out = {"text": "".join(parts), "n": since + len(parts), "done": st["done"] and since + len(parts) >= len(st["parts"])}
        if out["done"]:
            out["result"] = st["result"]
            with self._streams_lock:
                self._streams.pop(sid, None)
        return out

    def ai_models(self):
        try:
            return {"ok": True, "models": ai_client.list_models(self._my_ai_store().section("ai", DEFAULT_AI))}
        except ai_client.AIError as e:
            return {"ok": False, "error": str(e)}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": f"获取失败：{e}"}

    def ai_usage(self):
        return ai_usage.summary(self._settings.section("ai_limit"))

    def ai_set_limit(self, cfg):
        clean = {}
        for k in ("monthly_tokens", "price_in", "price_out"):
            try:
                clean[k] = max(0.0, float((cfg or {}).get(k) or 0))
            except (TypeError, ValueError):
                clean[k] = 0.0
        clean["monthly_tokens"] = int(clean["monthly_tokens"])
        self._settings.update("ai_limit", clean)
        return self.ai_usage()

    # ---------- 神经语音 ----------
    def tts_voices(self):
        return tts.VOICES

    def tts(self, text, voice, rate):
        try:
            return {"ok": True, "audio": tts.synthesize(text, voice, rate)}
        except Exception as e:  # 断网等情况，前端会退回系统语音
            return {"ok": False, "error": str(e)}

    # 离线神经语音（Piper）
    def tts_offline(self, text, voice="", rate=1.0):
        try:
            return {"ok": True, "audio": self._piper.synthesize(text, voice, rate)}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e)}

    def offline_tts_status(self):
        return self._piper.status()

    def offline_tts_install(self, voice=offline_tts.DEFAULT_VOICE):
        return self._piper.install(voice)

    def offline_tts_remove(self):
        return self._piper.remove()

    def tts_cache_info(self):
        return tts.cache_size_mb()

    def tts_clear_cache(self):
        tts.clear_cache()
        return True

    # ---------- 局域网访问（只能在电脑上操作） ----------
    def _lan_cfg(self) -> dict:
        cfg = self._settings.section("lan", {"enabled": False, "port": lan.DEFAULT_PORT, "code": ""})
        if not cfg["code"] or lan.is_weak(cfg["code"]):
            cfg["code"] = lan.new_code()
        cfg.setdefault("users", [])
        return cfg

    def _save_lan_cfg(self, cfg: dict):
        self._settings.update("lan", cfg)
        self._lan.code, self._lan.users = cfg["code"], cfg.get("users", [])  # 运行中也立即生效

    def _unique_code(self, cfg) -> str:
        used = {lan.norm_code(cfg["code"])} | {lan.norm_code(u["code"]) for u in cfg.get("users", [])}
        while True:
            code = lan.new_code()
            if code not in used:
                return code

    def lan_user_add(self, name):
        """给其他人加一个访问码。AI 默认关闭（用的是主人的 Key）"""
        name = (name or "").strip()[:20]
        if not name:
            return {"ok": False, "error": "请填一个名字"}
        cfg = self._lan_cfg()
        if any(u["name"] == name for u in cfg["users"]):
            return {"ok": False, "error": f"已经有叫「{name}」的人了"}
        cfg["users"].append({"id": secrets.token_hex(4), "name": name, "code": self._unique_code(cfg), "ai": False,
                             "created": time.strftime("%Y-%m-%d")})
        self._save_lan_cfg(cfg)
        return {"ok": True, "status": self.lan_status()}

    def lan_user_update(self, uid, changes):
        """改名字或 AI 开关：changes = {name?, ai?}"""
        cfg = self._lan_cfg()
        for u in cfg["users"]:
            if u["id"] == uid:
                if "ai" in changes:
                    u["ai"] = bool(changes["ai"])
                if (changes.get("name") or "").strip():
                    u["name"] = changes["name"].strip()[:20]
        self._save_lan_cfg(cfg)
        return self.lan_status()

    def lan_user_new_code(self, uid):
        cfg = self._lan_cfg()
        for u in cfg["users"]:
            if u["id"] == uid:
                u["code"] = self._unique_code(cfg)
        self._save_lan_cfg(cfg)
        self._lan.guard.reset()
        return self.lan_status()

    def lan_user_remove(self, uid):
        """删掉这个人：访问码立即失效，TA 的学习记录和 AI 语伴聊天记录一起删除"""
        cfg = self._lan_cfg()
        cfg["users"] = [u for u in cfg["users"] if u["id"] != uid]
        self._save_lan_cfg(cfg)
        self._delete_profile(uid)
        return self.lan_status()

    def _delete_profile(self, uid):
        """删掉一个人的进度、设置和 AI 语伴聊天记录"""
        with self._profiles_lock:
            p = self._profiles.pop(uid, None)
            self._profile_settings.pop(uid, None)
            if p:
                p.close()
        d = self._profile_dir(uid)
        if d.is_dir() and d.parent == data_dir() / "profiles":
            shutil.rmtree(d, ignore_errors=True)
        for ns in PERSONAL_KV:
            self._kv.clear_ns(f"{ns}@{uid}")

    def lan_user_qr(self, uid):
        """这个人的扫码链接（带上 TA 的访问码）"""
        cfg = self._lan_cfg()
        u = next((u for u in cfg["users"] if u["id"] == uid), None)
        if not u or not self._lan.running:
            return ""
        try:
            return lan.qr_svg(f"{self._lan.urls()[0]}?key={u['code']}")
        except Exception:  # noqa: BLE001
            return ""

    def _own_ai(self, uid) -> bool:
        return _enabled(self._user_settings(uid).section("ai", DEFAULT_AI))

    def lan_status(self):
        cfg = self._lan_cfg()
        cfg["users"] = [{**u, "own_ai": self._own_ai(u["id"])} for u in cfg["users"]]
        status = {**cfg, "https": cfg.get("https", True), "running": self._lan.running, "https_on": self._lan.https,
                  "error": self._lan.error, "urls": [], "qr": ""}
        if self._lan.running:
            status["urls"] = self._lan.urls()
            try:
                status["qr"] = lan.qr_svg(f"{status['urls'][0]}?key={cfg['code']}")
            except Exception:
                status["qr"] = ""
        return status

    def lan_set(self, enabled, port=None, https=None):
        cfg = self._lan_cfg()
        self._lan.users = cfg["users"]
        cfg["enabled"] = bool(enabled)
        if port:
            cfg["port"] = int(port)
        if https is not None:
            cfg["https"] = bool(https)
        if cfg["enabled"]:
            if not self._lan.start(cfg["port"], cfg["code"], cfg.get("https", True)):
                cfg["enabled"] = False
        else:
            self._lan.stop()
        self._save_lan_cfg(cfg)
        return self.lan_status()

    def lan_new_code(self):
        cfg = self._lan_cfg()
        cfg["code"] = self._unique_code(cfg)
        self._save_lan_cfg(cfg)  # 运行中也立即生效，旧访问码失效
        self._lan.guard.reset()
        return self.lan_status()

    # ---------- 英汉词典（ECDICT） ----------
    def dict_lookup(self, word):
        return self._dict.lookup(word)

    def dict_search(self, q, limit=40):
        return self._dict.search(q, int(limit))

    def dict_status(self):
        return self._dict.status()

    def dict_download_full(self):
        return self._dict.download_full()

    def dict_remove_full(self):
        return self._dict.remove_full()

    # ---------- 我的读物（导入的文章和书） ----------
    LIB_MAX_DOCS = 200            # 其他人（局域网 / 服务器账号）每人最多导入这么多份
    LIB_MAX_UPLOAD = 15 * 1024 * 1024  # 网页上传的单个文件（base64 之后还要能装进请求体）

    def _library(self) -> library.Library:
        """当前请求的人自己的书库：主人是 library/，其他人是 profiles/<id>/library/"""
        user = self._user()
        return library.Library(self._profile_dir(user["id"]) / "library") if user else self._lib

    def _library_add(self, do):
        lib = self._library()
        if self._user() and len(lib.index()) >= self.LIB_MAX_DOCS:
            return {"error": f"书架上导入的读物已经有 {self.LIB_MAX_DOCS} 份了，删掉一些不读的再导入吧"}
        try:
            return do(lib)
        except Exception as e:  # noqa: BLE001 — 格式不对、编码问题等直接告诉用户
            return {"error": f"导入失败：{e}"}

    def library_list(self):
        return self._library().index()

    def library_load(self, bid):
        return self._library().load(bid)

    def library_delete(self, bid):
        return self._library().delete(bid)

    def library_import_upload(self, name, b64):
        """网页里选的文件（txt / epub / html），内容是 base64。电脑上、手机上、服务器上都走这里"""
        import base64

        try:
            raw = base64.b64decode(b64 or "", validate=True)
        except ValueError:
            return {"error": "文件内容没有传完整，请再试一次"}
        if len(raw) > self.LIB_MAX_UPLOAD:
            return {"error": f"文件太大了（超过 {self.LIB_MAX_UPLOAD // 1024 // 1024} MB）"}
        return self._library_add(lambda lib: lib.import_data(str(name or "未命名.txt"), raw))

    def library_import_url(self, url):
        """从网址导入网页文章（只能是公网地址，见 webimport）"""
        def do(lib):
            a = webimport.fetch_article(str(url or "").strip())
            return lib.import_doc(a["title"], a["author"], a["chapters"], a["site"], a["url"])
        r = self._library_add(do)
        if "error" in r:
            r["error"] = r["error"].removeprefix("导入失败：")  # 网址的错误本身已经说清楚了
        return r

    def library_import_text(self, title, text, source="粘贴"):
        return self._library_add(lambda lib: lib.import_text(title, text, source))

    # ---------- 简明英文维基百科（联网） ----------
    WIKI_HINT = "维基百科在中国大陆通常无法直接访问：需要在「设置 → 网络」里填写代理，或者先读内置的维基精选文章。"

    def wiki_search(self, q):
        try:
            return {"ok": True, "results": wiki.search(q)}
        except OSError as e:
            return {"ok": False, "error": f"连不上维基百科（{e}）。{self.WIKI_HINT}"}

    def wiki_article(self, title):
        try:
            a = wiki.article(title)
            return {"ok": bool(a), "article": a, "error": "" if a else "没有找到这篇文章"}
        except OSError as e:
            return {"ok": False, "error": f"连不上维基百科（{e}）。{self.WIKI_HINT}"}

    # ---------- 离线语音识别 ----------
    def stt_status(self):
        return self._stt.status()

    def stt_download(self):
        return self._stt.download()

    def stt_remove(self):
        return self._stt.remove()

    def stt_transcribe(self, pcm_b64):
        try:
            return self._stt.transcribe(pcm_b64)
        except Exception as e:  # noqa: BLE001 — 识别出错不影响其他功能
            return {"ok": False, "error": f"识别失败：{e}"}

    def stt_assess(self, pcm_b64):
        """跟读评测用：除了文字，还返回每个词的识别把握和时间。"""
        try:
            return self._stt.transcribe(pcm_b64, words=True)
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": f"识别失败：{e}"}

    # ---------- 影视精听片库 ----------
    def film_status(self):
        return self._films.status()

    def film_local(self, fid):
        return self._films.local_url(fid)

    def film_download(self, fid, url):
        return self._films.download(fid, url)

    def film_cancel(self):
        return self._films.cancel()

    def film_remove(self, fid):
        return self._films.remove(fid)

    # ---------- 扩展资料（GitHub 上的学习系统，下载到本机用浏览器打开） ----------
    def ext_status(self):
        return self._ext.status()

    def ext_install(self, eid):
        return self._ext.install(eid)

    def ext_open(self, eid):
        return self._ext.open(eid)

    def ext_remove(self, eid):
        return self._ext.remove(eid)

    def ext_read(self, eid, rel):
        return self._ext.read(eid, rel)

    def ext_data(self, eid, rel):
        return self._ext.read_data(eid, rel)

    def ext_base(self, eid):
        return self._ext.base_uri(eid)

    # ---------- 资料包（下载到本机、不随软件分发的学习资料） ----------
    def pack_status(self):
        return self._packs.status()

    def pack_install(self, pid):
        return self._packs.install(pid)

    def pack_remove(self, pid):
        return self._packs.remove(pid)

    def pack_open_file(self, pid, name):
        """用系统默认程序打开资料包里的文件（比如语法讲义 PDF）"""
        p = self._packs.file_path(pid, name)
        if not p:
            return False
        os.startfile(p)
        return True

    # ---------- 网络（代理、连通性检查） ----------
    NET_CHECKS = [
        ("GitHub（完整词典、扩展资料、资料包）", "https://raw.githubusercontent.com/skywind3000/ECDICT/master/README.md"),
        ("GitHub 镜像", "https://ghfast.top/https://raw.githubusercontent.com/skywind3000/ECDICT/master/README.md"),
        ("Hugging Face（语音识别模型）", "https://huggingface.co/api/models/Systran/faster-whisper-base.en"),
        ("hf-mirror（模型国内镜像）", "https://hf-mirror.com/api/models/Systran/faster-whisper-base.en"),
        ("维基百科", "https://simple.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json"),
        ("VOA（原声音频、视频）", "https://learningenglish.voanews.com/"),
        ("TED 视频", "https://py.tedcdn.com/"),
    ]

    def net_get(self):
        cfg = self._settings.section("net", {"proxy": ""})
        return {"proxy": cfg.get("proxy", ""), "system_proxy": "" if cfg.get("proxy") else net.proxy()}

    def net_set(self, proxy):
        proxy = (proxy or "").strip()
        if proxy and not proxy.startswith(("http://", "https://", "socks5://")):
            proxy = "http://" + proxy
        self._settings.update("net", {"proxy": proxy})
        net.set_proxy(proxy)
        return self.net_get()

    def net_test(self):
        """逐个试一下常用的外部服务，返回 [{name, ok, ms, error}]"""
        import concurrent.futures

        def one(item):
            name, url = item
            t = time.time()
            try:
                with net.urlopen(url, timeout=8) as r:
                    r.read(256)
                return {"name": name, "ok": True, "ms": int((time.time() - t) * 1000), "error": ""}
            except Exception as e:  # noqa: BLE001
                code = getattr(e, "code", None)
                if code and code < 500:  # 有回应（比如 403、404）说明网络是通的
                    return {"name": name, "ok": True, "ms": int((time.time() - t) * 1000), "error": ""}
                return {"name": name, "ok": False, "ms": 0, "error": str(getattr(e, "reason", e))[:80]}

        def edge():
            import asyncio

            import edge_tts

            t = time.time()
            try:
                asyncio.run(edge_tts.list_voices(proxy=net.proxy() or None))
                return {"name": "微软神经语音（发音）", "ok": True, "ms": int((time.time() - t) * 1000), "error": ""}
            except Exception as e:  # noqa: BLE001
                return {"name": "微软神经语音（发音）", "ok": False, "ms": 0, "error": str(e)[:80]}

        with concurrent.futures.ThreadPoolExecutor(len(self.NET_CHECKS) + 1) as pool:
            tts_f = pool.submit(edge)
            return [tts_f.result()] + list(pool.map(one, self.NET_CHECKS))

    # ---------- WebDAV 同步（坚果云等网盘） ----------
    def webdav_get(self):
        c = self._webdav.cfg()
        return {"url": c.get("url", ""), "user": c.get("user", ""), "has_password": bool(c.get("password")),
                "folder": c.get("folder") or "EngNest", "auto": c.get("auto", True), **self._webdav.state}

    def webdav_set(self, cfg):
        cur = self._webdav.cfg()
        new = {"url": (cfg.get("url") or "").strip(), "user": (cfg.get("user") or "").strip(),
               "folder": (cfg.get("folder") or "EngNest").strip() or "EngNest", "auto": bool(cfg.get("auto", True)),
               "password": cfg.get("password") or cur.get("password", "")}
        if cfg.get("clear"):
            new = {"url": "", "user": "", "folder": "EngNest", "auto": True, "password": ""}
        self._settings.update("webdav", new)
        self._webdav.stop()
        self._webdav.start_auto()
        return self.webdav_get()

    def webdav_sync(self):
        return self._webdav.sync()

    # ---------- 其他 ----------
    def app_info(self):
        return {"version": VERSION, "data_dir": str(self._dir)}

    def update_check(self):
        from . import update

        return update.check()

    def open_url(self, url):
        """用系统浏览器打开外部链接（正版观看、来源网站）。"""
        import webbrowser

        if not str(url).startswith(("https://", "http://")):
            return False
        webbrowser.open(url)
        return True

    def get_data_dir(self):
        return str(self._dir)

    def open_data_dir(self):
        os.startfile(self._dir)
        return True

    def data_location(self):
        return {"dir": str(self._dir), "default": str(paths.default_data_dir()), "custom": paths.configured_data_dir() is not None}

    def set_data_location(self, target):
        """更改数据位置：下次启动生效，启动时自动把现有数据搬过去"""
        target = (target or "").strip()
        if not target:
            return {"error": "请填写目录"}
        try:
            new = paths.set_data_location(target)
        except OSError as e:
            return {"error": f"这个目录不能用：{e}"}
        if new.resolve() != self._dir.resolve():
            # 让下次启动的 migrate_legacy 从当前目录搬：在新目录留一个来源记录
            (new / "migrate_from.txt").write_text(str(self._dir), encoding="utf-8")
        return {"ok": True, "dir": str(new)}

    def save_text_file(self, name, content):
        """弹出保存对话框，把文字存成文件（导出单词表等）。取消返回 None"""
        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "SAVE", None) or webview.SAVE_DIALOG
        ext = os.path.splitext(name)[1].lower() or ".txt"
        label = {".csv": "CSV 文件 (*.csv)", ".tsv": "制表符分隔 (*.tsv)", ".txt": "文本文件 (*.txt)"}.get(ext, f"文件 (*{ext})")
        path = self._window.create_file_dialog(kind, save_filename=name, file_types=(label,))
        if not path:
            return None
        path = path[0] if isinstance(path, (list, tuple)) else path
        # CSV 加 BOM，Excel 打开中文才不乱码
        with open(path, "w", encoding="utf-8-sig" if ext == ".csv" else "utf-8", newline="") as f:
            f.write(content)
        return str(path)

    def open_text_file(self):
        """弹出打开对话框，读一个文本文件（导入单词表）。返回 {name, text}，取消返回 None"""
        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "OPEN", None) or webview.OPEN_DIALOG
        paths_ = self._window.create_file_dialog(kind, allow_multiple=False,
                                                 file_types=("单词表 (*.txt;*.csv;*.tsv)", "所有文件 (*.*)"))
        if not paths_:
            return None
        p = paths_[0] if isinstance(paths_, (list, tuple)) else paths_
        if os.path.getsize(p) > 10_000_000:
            return {"error": "文件太大了（超过 10 MB）"}
        raw = open(p, "rb").read()
        for enc in ("utf-8-sig", "gb18030"):
            try:
                return {"name": os.path.basename(p), "text": raw.decode(enc)}
            except UnicodeDecodeError:
                continue
        return {"name": os.path.basename(p), "text": raw.decode("latin-1")}

    def pick_folder(self):
        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "FOLDER", None) or webview.FOLDER_DIALOG
        r = self._window.create_file_dialog(kind)
        return (r[0] if isinstance(r, (list, tuple)) else r) if r else None

    def open_logs(self):
        os.startfile(log_file().parent)
        return True

    def export_diagnostics(self):
        """把日志和运行环境打包成 zip（不含 API Key、学习内容），方便反馈问题。取消返回 None"""
        import json
        import platform
        import zipfile

        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "SAVE", None) or webview.SAVE_DIALOG
        path = self._window.create_file_dialog(kind, save_filename=f"EngNest-诊断-{time.strftime('%Y%m%d-%H%M')}.zip",
                                               file_types=("ZIP 文件 (*.zip)",))
        if not path:
            return None
        path = path[0] if isinstance(path, (list, tuple)) else path
        ai = self.get_ai_settings()
        info = {
            "version": VERSION, "python": platform.python_version(), "os": platform.platform(),
            "data_dir": str(self._dir), "ai": {k: ai.get(k) for k in ("provider", "model", "base_url", "has_key", "enabled")},
            "proxy_set": bool(self._settings.section("net").get("proxy")), "lan_running": self._lan.running,
            "dict": {k: v for k, v in self._dict.status().items() if k != "error"}, "stt": self._stt.status(),
            "progress_rev": self._progress.rev(), "backups": len(self._progress.backups()), "ai_cache": self._kv.stats(),
        }
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("info.json", json.dumps(info, ensure_ascii=False, indent=2))
            for f in log_file().parent.glob("engnest.log*"):
                z.write(f, f"logs/{f.name}")
        return str(path)


def _enabled(cfg: dict) -> bool:
    if ai_client.provider_type(cfg.get("provider", "none")) == "none":
        return False
    return bool(cfg.get("api_key") and cfg.get("model"))
