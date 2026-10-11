"""从 Lucide（lucide-static，ISC 协议）里挑出网页用到的图标，生成 web/js/vendor/icons.js。

用到哪些图标看 web/js/icons.js 里 EMOJI_ICON 的值。换图标、加图标只改那张表，再运行一次：
    npm pack lucide-static@1.47.0 && tar -xzf lucide-static-1.47.0.tgz
    python tools/build_icons.py package/icon-nodes.json
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = ROOT / "web" / "js" / "icons.js"
OUT = ROOT / "web" / "js" / "vendor" / "icons.js"
VERSION = "1.47.0"


def main(nodes_path: str):
    nodes = json.loads(Path(nodes_path).read_text(encoding="utf-8"))
    src = MAP.read_text(encoding="utf-8")
    table = src[src.index("const EMOJI_ICON = {"):src.index("};", src.index("const EMOJI_ICON = {"))]
    names = sorted(set(re.findall(r':\s*"([a-z0-9-]+)"', table)))
    missing = [n for n in names if n not in nodes]
    if missing:
        raise SystemExit(f"Lucide 里没有这些图标：{missing}")
    out = {}
    for n in names:
        parts = []
        for tag, attrs in nodes[n]:
            a = " ".join(f'{k}="{v}"' for k, v in attrs.items() if k != "key")
            parts.append(f"<{tag} {a}/>")
        out[n] = "".join(parts)
    OUT.write_text(
        f"/*! Lucide v{VERSION}（ISC，https://lucide.dev）的子集，tools/build_icons.py 生成，许可见 lucide.LICENSE.txt */\n"
        "window.LUCIDE = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8", newline="\n")
    print(f"{len(out)} 个图标 → {OUT}（{OUT.stat().st_size // 1024} KB）")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "package/icon-nodes.json")
