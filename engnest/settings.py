"""设置：数据目录的 settings.json。分几块：ai、lan、net（代理）、webdav、ai_limit。

密钥（ai.api_key、webdav.password）用 secret.protect 加密后存成 *_enc 字段；
旧版本明文存的 api_key 第一次读到时自动加密并删掉明文。
"""

import threading

from . import secret
from .paths import data_dir
from .storage import load_json, save_json

SECRET_FIELDS = {"ai": ["api_key"], "webdav": ["password"]}


class Settings:
    def __init__(self, path=None):
        self.path = path or (data_dir() / "settings.json")
        self._lock = threading.Lock()
        self._migrate_plain_secrets()

    def _load(self) -> dict:
        return load_json(self.path, {})

    def _migrate_plain_secrets(self):
        with self._lock:
            data = self._load()
            changed = False
            for sec, fields in SECRET_FIELDS.items():
                part = data.get(sec)
                if not isinstance(part, dict):
                    continue
                for f in fields:
                    if part.get(f):
                        part[f + "_enc"] = secret.protect(part.pop(f))
                        changed = True
            if changed:
                save_json(self.path, data)

    def section(self, name: str, defaults: dict = None) -> dict:
        """读一块设置，密钥字段解密后放回原名"""
        part = dict(self._load().get(name) or {})
        for f in SECRET_FIELDS.get(name, []):
            enc = part.pop(f + "_enc", "")
            part[f] = secret.unprotect(enc) if enc else part.get(f, "")
        return {**(defaults or {}), **part}

    def update(self, name: str, values: dict) -> dict:
        """整块写回（密钥字段自动加密）"""
        with self._lock:
            data = self._load()
            part = dict(values)
            for f in SECRET_FIELDS.get(name, []):
                if f in part:
                    v = part.pop(f)
                    if v:
                        part[f + "_enc"] = secret.protect(v)
            data[name] = part
            save_json(self.path, data)
        return self.section(name)
