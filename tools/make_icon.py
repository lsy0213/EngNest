"""从原图生成应用图标：白天版（奶油底 + 蜜桃太阳）和夜晚版（墨绿底 + 月亮）。

    python tools/make_icon.py

原图在 assets/icon-src/day.png、night.png（带白边、阴影和圆角的成品图）。脚本会：
找到图标本体 → 去掉外圈的亮边 → 裁成正方形 → 把圆角外面的白色补成相邻的画面颜色（iPhone 要铺满不透明的图，圆角由系统切）。

输出（白天版是默认图标，深色界面换夜晚版，见 web/js/core.js 的 syncThemeColor）：
    assets/icon.ico、assets/icon.png                   电脑版窗口 / 任务栏 / 安装包（白天版，圆角，四角透明）
    web/img/icon-192.png、icon-512.png                  网页图标、安卓「添加到主屏幕」（圆角，四角透明）
    web/img/icon-maskable-512.png                       安卓自适应图标（铺满）
    web/img/apple-touch-icon.png                        iPhone / iPad 主屏幕（180×180 铺满）
    web/img/icon-dark-*.png、apple-touch-icon-dark.png   以上几样的夜晚版
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icon-src"
N = 1024
RADIUS = 0.2237  # iOS 图标圆角半径约占边长的 22%


def edges(line):
    """一条扫描线上，图标两侧边框的位置：在两端 12% 的范围里找颜色变化最剧烈的地方（图标外圈的亮边 / 明暗交界）。"""
    d = np.abs(np.diff(line, axis=0)).sum(axis=1)
    band = max(8, int(len(line) * .12))
    return int(np.argmax(d[:band])) + 1, len(line) - band + int(np.argmax(d[-band:]))


def find_box(a):
    """在中间几行几列上找图标本体的上下左右边界，取中位数。"""
    h, w = a.shape[:2]
    lefts, rights, tops, bottoms = [], [], [], []
    for f in (.35, .45, .55, .65):
        l, r = edges(a[int(h * f)])
        t, b = edges(a[:, int(w * f)])
        lefts.append(l); rights.append(r); tops.append(t); bottoms.append(b)
    return int(np.median(lefts)), int(np.median(tops)), int(np.median(rights)), int(np.median(bottoms))


def fill_outside(img: Image.Image, mask: np.ndarray) -> Image.Image:
    """把 mask 以外（圆角外的白色）用里面的颜色一圈圈向外延伸补满，再柔化一下。"""
    a = np.asarray(img, dtype=np.float32).copy()
    filled = mask.copy()
    while not filled.all():
        acc = np.zeros_like(a)
        cnt = np.zeros(filled.shape, dtype=np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            f = np.roll(filled, (dy, dx), axis=(0, 1))
            v = np.roll(a, (dy, dx), axis=(0, 1))
            acc += v * f[..., None]
            cnt += f
        grow = (~filled) & (cnt > 0)
        a[grow] = acc[grow] / cnt[grow][:, None]
        filled |= grow
    out = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    soft = out.filter(ImageFilter.GaussianBlur(6))
    keep = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
    return Image.composite(out, soft, keep)


def rounded_mask(size, radius, inset=0):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((inset, inset, size - 1 - inset, size - 1 - inset), radius=radius, fill=255)
    return m


def prepare(path: Path) -> Image.Image:
    src = Image.open(path).convert("RGB")
    a = np.asarray(src).astype(int)
    x0, y0, x1, y1 = find_box(a)
    # 往里收一点，去掉图标外圈的白色亮边和斜面
    k = round((x1 - x0) * .012)
    sq = src.crop((x0 + k, y0 + k, x1 - k + 1, y1 - k + 1)).resize((N, N), Image.LANCZOS)
    # 原图圆角外是白底：按比系统圆角稍大的半径把四角当成「外面」，用相邻画面的颜色补满
    inside = np.asarray(rounded_mask(N, round(N * .27), inset=3)) > 0
    return fill_outside(sq, inside)


def rounded(img: Image.Image, size: int) -> Image.Image:
    out = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    out.putalpha(rounded_mask(size, round(size * RADIUS)))
    return out


def export(full: Image.Image, suffix: str):
    img_dir = ROOT / "web" / "img"
    rounded(full, 512).save(img_dir / f"icon{suffix}-512.png")
    rounded(full, 192).save(img_dir / f"icon{suffix}-192.png")
    full.resize((512, 512), Image.LANCZOS).save(img_dir / f"icon{suffix}-maskable-512.png")
    full.resize((180, 180), Image.LANCZOS).save(img_dir / f"apple-touch-icon{suffix}.png")


if __name__ == "__main__":
    day = prepare(SRC / "day.png")
    night = prepare(SRC / "night.png")
    export(day, "")
    export(night, "-dark")
    icon = rounded(day, 256)
    icon.save(ROOT / "assets" / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    rounded(day, 512).save(ROOT / "assets" / "icon.png")
    print("icons ok")
