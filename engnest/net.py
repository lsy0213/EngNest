"""联网：代理设置、断点续传下载、SHA256 校验、镜像兜底。

- 代理：设置页「网络」里填的代理优先，没填就用 Windows 系统代理（urllib 会自动读注册表里的代理设置）。
  AI、神经语音、下载都走这里的代理。
- download()：按顺序试每个地址（原地址 + 国内能访问的镜像），.part 文件断点续传（服务器支持 Range 时），
  下完核对 SHA256 和大小，对不上就删掉换下一个地址。镜像是第三方的，靠 SHA256 保证内容没被改过。
"""

import hashlib
import logging
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from . import VERSION

log = logging.getLogger(__name__)
UA = f"EngNest/{VERSION} (personal English-learning desktop app)"

# GitHub 在国内经常连不上：这些公开的加速代理把 https://github.com/... 或 raw.githubusercontent.com 的地址拼在后面就能用。
# 它们随时可能失效，所以只当兜底，而且下载的东西都要核对 SHA256。
GITHUB_PROXIES = ["https://ghfast.top/", "https://gh-proxy.com/", "https://ghproxy.net/"]

_proxy = ""


def set_proxy(proxy: str) -> None:
    global _proxy
    _proxy = (proxy or "").strip()


def proxy() -> str:
    """当前生效的代理地址（设置里填的；没填返回系统代理的 https 代理，没有就是空）"""
    if _proxy:
        return _proxy
    sys_p = urllib.request.getproxies()
    return sys_p.get("https") or sys_p.get("http") or ""


def opener(*handlers) -> urllib.request.OpenerDirector:
    """handlers：额外的处理器（比如从网址导入时检查每次跳转的 webimport._SafeRedirect）"""
    if _proxy:
        return urllib.request.build_opener(urllib.request.ProxyHandler({"http": _proxy, "https": _proxy}), *handlers)
    return urllib.request.build_opener(*handlers)  # 默认的 ProxyHandler 会用系统代理


def urlopen(req, timeout=30):
    if isinstance(req, str):
        req = urllib.request.Request(req, headers={"User-Agent": UA})
    elif not req.has_header("User-agent"):
        req.add_header("User-Agent", UA)
    return opener().open(req, timeout=timeout)


def github_mirrors(url: str) -> list:
    """GitHub 的地址加上镜像"""
    if not url.startswith(("https://github.com/", "https://raw.githubusercontent.com/", "https://codeload.github.com/")):
        return [url]
    return [url] + [p + url for p in GITHUB_PROXIES]


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


class Cancelled(Exception):
    pass


def download(urls, dest: Path, sha256: str = "", size: int = 0, progress=None, cancel=None, timeout: int = 60) -> Path:
    """下载到 dest。urls 可以是一个地址或地址列表（依次尝试）。
    progress(已下载字节, 总字节) 报告进度；cancel() 返回 True 时中止（.part 留着，下次接着下）。"""
    urls = [urls] if isinstance(urls, str) else list(urls)
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and (not sha256 or sha256_of(dest) == sha256):
        return dest
    part = dest.with_name(dest.name + ".part")
    errors = []
    for url in urls:
        try:
            _fetch(url, part, size, progress, cancel, timeout)
            if size and part.stat().st_size != size:
                raise OSError(f"大小不对：{part.stat().st_size} != {size}")
            if sha256:
                got = sha256_of(part)
                if got != sha256:
                    part.unlink(missing_ok=True)
                    raise OSError(f"校验失败（SHA256 {got[:12]}… 和预期不一致），可能是下载被篡改或镜像出错")
            os.replace(part, dest)
            return dest
        except Cancelled:
            raise
        except (OSError, urllib.error.URLError) as e:
            log.warning("下载 %s 失败：%s", url, e)
            errors.append(f"{_host(url)}：{e}")
    raise OSError("所有下载地址都失败了：\n" + "\n".join(errors))


def _host(url: str) -> str:
    return url.split("/")[2] if "://" in url else url


def _fetch(url, part: Path, size, progress, cancel, timeout):
    have = part.stat().st_size if part.exists() else 0
    if size and have > size:
        part.unlink()
        have = 0
    headers = {"User-Agent": UA}
    if have:
        headers["Range"] = f"bytes={have}-"
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urlopen(req, timeout=timeout)
    except urllib.error.HTTPError as e:
        if e.code == 416 and have:  # 已经下完了
            return
        raise
    with resp:
        resumed = have and resp.status == 206
        if not resumed:
            have = 0
        total = int(resp.headers.get("Content-Length") or 0) + have or size
        last = 0.0
        with open(part, "ab" if resumed else "wb") as out:
            while chunk := resp.read(1 << 18):
                if cancel and cancel():
                    raise Cancelled("已取消")
                out.write(chunk)
                have += len(chunk)
                if progress and time.time() - last > 0.2:
                    last = time.time()
                    progress(have, total)
        if progress:
            progress(have, total or have)
