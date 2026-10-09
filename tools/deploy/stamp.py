"""给服务器上 web/index.html 里的脚本和样式加版本号（?v=文件内容的哈希），配合 Nginx 让浏览器长期缓存、打开时一个都不用问。

不加的话浏览器每次打开都要把一百多个文件挨个问一遍「变了没有」，网络远的时候要半分钟以上；
加了以后没变的文件直接用缓存，改过的文件哈希变了、网址跟着变，自然会重新下载。
只改服务器上部署的那份（每次上传代码后跑一次，setup.sh 也会跑），仓库里的 index.html 不动，桌面版不受影响。
    python3 -I stamp.py /opt/engnest/app/web
"""

import hashlib
import re
import sys
from pathlib import Path

REF = re.compile(r'(<(?:script|link)\b[^>]*?\b(?:src|href)=")([^"?#:]+\.(?:js|css))(?:\?v=[0-9a-f]*)?(")')  # 已有的旧版本号换成新的


def stamp(web: Path) -> int:
    index = web / "index.html"
    html = index.read_text(encoding="utf-8")
    n = 0

    def add(m):
        nonlocal n
        f = web / m.group(2)
        if not f.is_file():
            return m.group(0)
        n += 1
        return f"{m.group(1)}{m.group(2)}?v={hashlib.sha1(f.read_bytes()).hexdigest()[:10]}{m.group(3)}"

    out = REF.sub(add, html)
    if out != html:
        index.write_text(out, encoding="utf-8", newline="\n")
    return n


if __name__ == "__main__":
    print(f"index.html：{stamp(Path(sys.argv[1] if len(sys.argv) > 1 else '/opt/engnest/app/web'))} 个文件加了版本号")
