"""生成应用图标 assets/icon.ico（暖橙色圆角方块 + 白色字母 E + 小鸟窝弧线）。

    python tools/make_icon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SIZE = 512


def load_font(size):
    for name in ("georgiab.ttf", "georgia.ttf", "seguisb.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # 从左上到右下的渐变底色
    grad = Image.new("RGBA", (SIZE, SIZE))
    top, bottom = (232, 158, 92), (170, 88, 30)
    px = grad.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x + y) / (2 * SIZE)
            px[x, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((16, 16, SIZE - 16, SIZE - 16), radius=112, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    # 鸟窝：底部几道弧线
    for i, (inset, width) in enumerate([(96, 18), (122, 14), (150, 12)]):
        d.arc((inset, 250 + i * 14, SIZE - inset, 470 - i * 6), start=15, end=165, fill=(255, 238, 220, 230), width=width)

    # 字母 E
    font = load_font(300)
    bbox = d.textbbox((0, 0), "E", font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((SIZE - w) / 2 - bbox[0], 70 - bbox[1] + (260 - h) / 2), "E", font=font, fill=(255, 255, 255, 255))
    return img


if __name__ == "__main__":
    out = ROOT / "assets" / "icon.ico"
    out.parent.mkdir(exist_ok=True)
    icon = make()
    icon.save(out, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    icon.save(ROOT / "assets" / "icon.png")
    print(f"已生成 {out}")
