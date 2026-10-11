"""把思源宋体（Noto Serif SC，SIL OFL 1.1）切成按字频分组的小块 woff2，给白瓷星轨主题用。

生成 web/fonts/serif-sc/*.woff2 和 web/css/font-serif-sc.css。浏览器按 unicode-range 只下载页面上
真正用到的那几块（和 Google Fonts 一样的做法），不用的主题一块都不下载。iPhone 的 Safari 里没有宋体，
不带字体的话衬线中文会退回黑体。

字的范围：拉丁字母和标点 + GB2312 的 6763 个常用字 + 项目文字里出现过的字。
按项目里的文字统计字频，常用字集中在前几块。保留 300–700 的字重轴（一个文件里有细到粗）。

    pip install fonttools brotli
    python tools/build_fonts.py NotoSerifSC-VF.ttf
（NotoSerifSC-VF.ttf 来自 https://github.com/notofonts/noto-cjk 的 Serif/Variable/TTF）
"""

import collections
import re
import sys
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
OUT = WEB / "fonts" / "serif-sc"
CSS = WEB / "css" / "font-serif-sc.css"
FAMILY = "Noto Serif SC Web"
WGHT = (300, 700)


def gb2312():
    chars = []
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return chars


def is_cjk(c):
    return 0x3400 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF


def project_freq():
    freq = collections.Counter()
    for p in WEB.rglob("*"):
        if p.suffix not in (".js", ".html", ".json") or "vendor" in p.parts or "fonts" in p.parts:
            continue
        freq.update(c for c in p.read_text(encoding="utf-8", errors="ignore") if is_cjk(c))
    return freq


def ranges(cps):
    cps = sorted(cps)
    out, start, prev = [], cps[0], cps[0]
    for c in cps[1:] + [None]:
        if c is not None and c == prev + 1:
            prev = c
            continue
        out.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        if c is not None:
            start = prev = c
    return ", ".join(out)


def main(src):
    font = TTFont(src)
    cmap = set(font.getBestCmap())
    # 拉丁字母、常用符号、中文标点、全角字符
    base = [c for r in [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x205E), (0x2190, 0x2193), (0x3000, 0x303F), (0xFF01, 0xFF5E)]
            for c in range(r[0], r[1] + 1) if c in cmap]
    freq = project_freq()
    order = {c: i for i, c in enumerate(gb2312())}
    han = {c for c in list(order) + list(freq) if ord(c) in cmap}
    han = sorted(han, key=lambda c: (-freq[c], order.get(c, 99999), c))
    slices = [base + [ord(c) for c in han[:400]]]
    rest, i = han[400:], 0
    while i < len(rest):
        n = 300 if i < 3000 else 500
        slices.append([ord(c) for c in rest[i:i + n]])
        i += n

    print(f"{len(base)} 个拉丁和标点，{len(han)} 个汉字，{len(slices)} 块；限制字重 {WGHT} …")
    font = instancer.instantiateVariableFont(font, {"wght": WGHT})
    tmp = Path(tempfile.mkdtemp()) / "limited.ttf"
    font.save(tmp)

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    faces = []
    for k, cps in enumerate(slices):
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["kern", "liga", "locl", "palt", "halt"]
        opts.hinting = False
        opts.name_IDs = ["*"]
        opts.notdef_outline = False
        f = TTFont(tmp)
        s = subset.Subsetter(opts)
        s.populate(unicodes=cps)
        s.subset(f)
        name = f"{k:02d}.woff2"
        f.flavor = "woff2"
        f.save(OUT / name)
        faces.append(f'@font-face {{ font-family: "{FAMILY}"; font-style: normal; font-weight: {WGHT[0]} {WGHT[1]}; font-display: swap;\n'
                     f'  src: url("../fonts/serif-sc/{name}") format("woff2"); unicode-range: {ranges(cps)}; }}')
        print(f"  {name}  {len(cps)} 字  {(OUT / name).stat().st_size // 1024} KB")
    CSS.write_text(
        "/* 思源宋体（Noto Serif SC，SIL OFL 1.1，许可见 fonts/serif-sc/LICENSE.txt）按字频切成的小块，tools/build_fonts.py 生成。\n"
        "   浏览器只下载页面上用到的字所在的那几块；只有白瓷星轨主题用到这个字体 */\n" + "\n".join(faces) + "\n",
        encoding="utf-8", newline="\n")
    total = sum(p.stat().st_size for p in OUT.glob("*.woff2"))
    print(f"共 {total // 1024} KB → {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "NotoSerifSC-VF.ttf")
