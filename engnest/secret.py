"""保存密钥（AI 的 API Key、WebDAV 密码）：Windows 上用 DPAPI 加密，只有当前 Windows 用户能解开。

settings.json 里存成 "dpapi:<base64>"。把数据目录拷到别的电脑或别的用户下，解不开就当作没填，重新填一次就好。
非 Windows（开发调试）退回 "plain:<原文>"。
"""

import base64
import ctypes
import logging
import os

log = logging.getLogger(__name__)
ENTROPY = b"EngNest secret v1"

if os.name == "nt":
    from ctypes import wintypes

    class _Blob(ctypes.Structure):
        _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]

    _crypt32 = ctypes.windll.crypt32
    _kernel32 = ctypes.windll.kernel32
    _kernel32.LocalFree.argtypes = [ctypes.c_void_p]
    _CRYPTPROTECT_UI_FORBIDDEN = 0x1

    def _blob(data: bytes):
        buf = ctypes.create_string_buffer(data, len(data))
        return _Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char))), buf

    def _call(fn, data: bytes) -> bytes:
        inp, _keep = _blob(data)
        ent, _keep2 = _blob(ENTROPY)
        out = _Blob()
        if not fn(ctypes.byref(inp), None, ctypes.byref(ent), None, None, _CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(out)):
            raise OSError(ctypes.GetLastError(), "DPAPI 调用失败")
        try:
            return ctypes.string_at(out.pbData, out.cbData)
        finally:
            _kernel32.LocalFree(ctypes.cast(out.pbData, ctypes.c_void_p))

    def _protect(data: bytes) -> bytes:
        return _call(lambda i, d, e, r, p, f, o: _crypt32.CryptProtectData(i, d, e, r, p, f, o), data)

    def _unprotect(data: bytes) -> bytes:
        return _call(lambda i, d, e, r, p, f, o: _crypt32.CryptUnprotectData(i, None, e, r, p, f, o), data)


def protect(text: str) -> str:
    if not text:
        return ""
    if os.name == "nt":
        try:
            return "dpapi:" + base64.b64encode(_protect(text.encode("utf-8"))).decode("ascii")
        except OSError as e:
            log.error("加密失败，改为明文保存：%s", e)
    return "plain:" + text


def unprotect(value: str) -> str:
    """解开 protect() 的结果。旧版本直接存的明文原样返回；解不开返回空字符串。"""
    if not value:
        return ""
    if value.startswith("plain:"):
        return value[6:]
    if value.startswith("dpapi:"):
        if os.name != "nt":
            return ""
        try:
            return _unprotect(base64.b64decode(value[6:])).decode("utf-8")
        except (OSError, ValueError) as e:
            log.warning("密钥解不开（可能是换了电脑或 Windows 用户）：%s", e)
            return ""
    return value  # 旧版本的明文


def is_protected(value: str) -> bool:
    return bool(value) and value.startswith(("dpapi:", "plain:"))
