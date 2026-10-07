"""暴露给前端 JS 调用的接口（window.pywebview.api.*）。

pywebview 会在独立线程里执行这些方法，所以 AI 请求阻塞也不会卡住界面。
"""

import os
import threading

from . import ai_client, dictionary, ext, films, lan, library, stt, tts, wiki
from .paths import data_dir
from .storage import load_json, save_json

DEFAULT_AI = {"provider": "none", "base_url": "", "model": "", "api_key": ""}


class Api:
    def __init__(self):
        self._dir = data_dir()
        self._progress_file = self._dir / "progress.json"
        self._settings_file = self._dir / "settings.json"
        self._lan = lan.LanServer(self)
        self._dict = dictionary.Dictionary()
        self._lib = library.Library()
        self._stt = stt.Stt()
        self._films = films.Films()
        self._ext = ext.Ext()
        self._window = None  # main.py 创建窗口后设置，用来弹出选择文件的对话框
        # 查询网卡要调用 PowerShell，比较慢，启动时在后台先查好
        threading.Thread(target=lan.local_ips, daemon=True).start()

    def _autostart_lan(self):
        """启动时如果上次开着局域网访问，就自动打开。"""
        cfg = load_json(self._settings_file, {}).get("lan", {})
        if cfg.get("enabled") and cfg.get("code"):
            self._lan.start(int(cfg.get("port") or lan.DEFAULT_PORT), cfg["code"])

    # ---------- 学习进度 ----------
    def load_progress(self):
        return load_json(self._progress_file, None)

    def save_progress(self, data):
        save_json(self._progress_file, data)
        return True

    def reset_progress(self):
        if self._progress_file.exists():
            self._progress_file.unlink()
        return True

    # ---------- AI 设置 ----------
    def _ai_cfg(self) -> dict:
        settings = load_json(self._settings_file, {})
        return {**DEFAULT_AI, **settings.get("ai", {})}

    def get_presets(self):
        return ai_client.PRESETS

    def get_ai_settings(self):
        """返回给前端的设置里不包含完整 Key，只给一个掩码提示。"""
        cfg = self._ai_cfg()
        key = cfg.pop("api_key", "")
        cfg["has_key"] = bool(key)
        cfg["key_hint"] = f"{key[:3]}****{key[-4:]}" if len(key) > 8 else ("****" if key else "")
        cfg["enabled"] = _enabled({**cfg, "api_key": key})
        return cfg

    def save_ai_settings(self, new_cfg):
        cfg = self._ai_cfg()
        for field in ("provider", "base_url", "model"):
            if field in new_cfg:
                cfg[field] = (new_cfg[field] or "").strip()
        # 前端 Key 输入框留空表示「不修改」
        if new_cfg.get("api_key"):
            cfg["api_key"] = new_cfg["api_key"].strip()
        if new_cfg.get("clear_key"):
            cfg["api_key"] = ""
        settings = load_json(self._settings_file, {})
        settings["ai"] = cfg
        save_json(self._settings_file, settings)
        return self.get_ai_settings()

    def test_ai(self):
        return self.ai_chat(
            "You are a helpful assistant.",
            [{"role": "user", "content": "Reply with exactly: Hello from EngNest!"}],
        )

    def ai_chat(self, system, messages):
        try:
            text = ai_client.chat(self._ai_cfg(), system, messages)
            return {"ok": True, "text": text}
        except ai_client.AIError as e:
            return {"ok": False, "error": str(e)}
        except Exception as e:  # 兜底，避免异常直接抛到前端变成看不懂的报错
            return {"ok": False, "error": f"未知错误：{e}"}

    # ---------- 神经语音 ----------
    def tts_voices(self):
        return tts.VOICES

    def tts(self, text, voice, rate):
        try:
            return {"ok": True, "audio": tts.synthesize(text, voice, rate)}
        except Exception as e:  # 断网等情况，前端会退回系统语音
            return {"ok": False, "error": str(e)}

    def tts_cache_info(self):
        return tts.cache_size_mb()

    def tts_clear_cache(self):
        tts.clear_cache()
        return True

    # ---------- 局域网访问（只能在电脑上操作） ----------
    def _lan_cfg(self) -> dict:
        cfg = {"enabled": False, "port": lan.DEFAULT_PORT, "code": "", **load_json(self._settings_file, {}).get("lan", {})}
        if not cfg["code"]:
            cfg["code"] = lan.new_code()
        return cfg

    def _save_lan_cfg(self, cfg: dict):
        settings = load_json(self._settings_file, {})
        settings["lan"] = cfg
        save_json(self._settings_file, settings)

    def lan_status(self):
        cfg = self._lan_cfg()
        status = {**cfg, "running": self._lan.running, "error": self._lan.error, "urls": [], "qr": ""}
        if self._lan.running:
            status["urls"] = self._lan.urls()
            try:
                status["qr"] = lan.qr_svg(f"{status['urls'][0]}?key={cfg['code']}")
            except Exception:
                status["qr"] = ""
        return status

    def lan_set(self, enabled, port=None):
        cfg = self._lan_cfg()
        cfg["enabled"] = bool(enabled)
        if port:
            cfg["port"] = int(port)
        if cfg["enabled"]:
            if not self._lan.start(cfg["port"], cfg["code"]):
                cfg["enabled"] = False
        else:
            self._lan.stop()
        self._save_lan_cfg(cfg)
        return self.lan_status()

    def lan_new_code(self):
        cfg = self._lan_cfg()
        cfg["code"] = lan.new_code()
        self._save_lan_cfg(cfg)
        self._lan.code = cfg["code"]  # 运行中也立即生效，旧访问码失效
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
    def library_list(self):
        return self._lib.index()

    def library_load(self, bid):
        return self._lib.load(bid)

    def library_delete(self, bid):
        return self._lib.delete(bid)

    def library_import_file(self):
        """弹出选择文件的对话框，导入 txt / epub / html。取消返回 None，出错返回 {"error": ...}"""
        import webview

        kind = getattr(getattr(webview, "FileDialog", None), "OPEN", None) or webview.OPEN_DIALOG
        paths = self._window.create_file_dialog(kind, allow_multiple=False,
                                                file_types=("文本和电子书 (*.txt;*.epub;*.html;*.htm)", "所有文件 (*.*)"))
        if not paths:
            return None
        try:
            return self._lib.import_path(paths[0] if isinstance(paths, (list, tuple)) else paths)
        except Exception as e:  # noqa: BLE001 — 格式不对、编码问题等直接告诉用户
            return {"error": f"导入失败：{e}"}

    def library_import_text(self, title, text):
        try:
            return self._lib.import_text(title, text)
        except Exception as e:  # noqa: BLE001
            return {"error": f"导入失败：{e}"}

    # ---------- 简明英文维基百科（联网） ----------
    def wiki_search(self, q):
        try:
            return {"ok": True, "results": wiki.search(q)}
        except OSError as e:
            return {"ok": False, "error": f"连不上维基百科：{e}"}

    def wiki_article(self, title):
        try:
            a = wiki.article(title)
            return {"ok": bool(a), "article": a, "error": "" if a else "没有找到这篇文章"}
        except OSError as e:
            return {"ok": False, "error": f"连不上维基百科：{e}"}

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

    def ext_base(self, eid):
        return self._ext.base_uri(eid)

    def open_file(self, rel):
        """用系统默认程序打开软件自带的文件（比如语法讲义 PDF），只允许 web/ext/ 下面的。"""
        from .paths import web_index

        base = (web_index().parent / "ext").resolve()
        path = (web_index().parent / rel).resolve()
        if base not in path.parents or not path.exists():
            return False
        os.startfile(path)
        return True

    # ---------- 其他 ----------
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


def _enabled(cfg: dict) -> bool:
    if ai_client.provider_type(cfg.get("provider", "none")) == "none":
        return False
    return bool(cfg.get("api_key") and cfg.get("model"))
