"""生成「薄荷可可」极繁主题的原创矢量素材。

配色：薄荷绿与可可棕取自用户提供的一张薄荷巧克力配色截图（只取颜色）（薄荷 #B6D5C0、可可 #8E7F72、黑可可 #56473A），
天空蓝、焦糖、黑巧和金色取自猫耳少女原画（天空蓝裙摆 #A9CEDA、焦糖外摆 #9E7354、深发色 #463020、
金色刺绣 #CAA67F）。蝴蝶结、马卡龙、蛋糕、糖果、纸杯蛋糕、巧克力、曲奇、蕾丝圆垫与心形、
音符和猫爪都由下面的函数绘制。第二批参考图带来的元素（钩针蕾丝丝带与珍珠、白色纸蝴蝶、带珍珠的蕾丝标签、
穿缎带的方形蕾丝框与挂链、格纹爱心、心形镂空花边、亚麻手帕的细蕾丝边、花体字与手写批注）也都是重新绘制的。
参考图只用于取色和题材方向，没有复用其中的像素、文字或排版。
散落位置使用固定随机种子，重复运行结果一致。

    python tools/gen_mintchoco_skin.py
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "css" / "skin"

MINT_L, MINT, MINT_M, MINT_D, MINT_INK = "#E3F1E8", "#C4E2D0", "#9FCDB6", "#6FA894", "#3F7A67"
COCOA_L, COCOA, COCOA_M, CHOCO, CHOCO_D = "#C9B2A2", "#8E7F72", "#7A5F4E", "#56473A", "#3E2A20"
CARAMEL, SKY, SKY_L = "#9E7354", "#A9CEDA", "#DDEEF2"
GOLD, GOLD_D = "#CAA67F", "#A8844F"
CREAM, CREAM_2, WHITE = "#FBF6EC", "#F1E7D7", "#FFFFFF"
BISCUIT, BISCUIT_D = "#D6A877", "#B7854F"
PINK, PINK_D, PINK_L = "#E9B9BF", "#C98D95", "#F7E1E3"
LACE, LACE_EDGE, LACE_HOLE = "#FFFFFF", "#C9BBA8", "#E6DCCF"
SCRIPT = "'Segoe Script', 'Edwardian Script ITC', 'Brush Script MT', cursive"
SERIF = "Georgia, 'Palatino Linotype', 'Book Antiqua', serif"

DEFS = f"""
<filter id="lift" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2.4" stdDeviation="2.2" flood-color="{CHOCO_D}" flood-opacity=".22"/></filter>
<filter id="liftS" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="{CHOCO_D}" flood-opacity=".24"/></filter>
<pattern id="dotsMint" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="{MINT}"/><circle cx="2.5" cy="2.5" r="1.25" fill="{CHOCO}"/><circle cx="7.5" cy="7.5" r="1.25" fill="{CHOCO}"/></pattern>
<pattern id="dotsChoco" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="{COCOA_M}"/><circle cx="2.5" cy="2.5" r="1.2" fill="{CREAM}"/><circle cx="7.5" cy="7.5" r="1.2" fill="{CREAM}"/></pattern>
<pattern id="dotsCream" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="{CREAM}"/><circle cx="2.25" cy="2.25" r=".95" fill="{MINT_M}"/><circle cx="6.75" cy="6.75" r=".95" fill="{MINT_M}"/></pattern>
<pattern id="stripeSky" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="{WHITE}"/><rect width="5" height="10" fill="{SKY}"/></pattern>
<pattern id="cupStripe" width="7" height="10" patternUnits="userSpaceOnUse"><rect width="7" height="10" fill="{COCOA_M}"/><rect width="3" height="10" fill="{CHOCO}"/></pattern>
<pattern id="tapeStripe" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="#FFFFFF" fill-opacity=".3"/></pattern>
<linearGradient id="choco" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6E5546"/><stop offset="1" stop-color="{CHOCO_D}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#EBD3A6"/><stop offset=".5" stop-color="{GOLD}"/><stop offset="1" stop-color="{GOLD_D}"/></linearGradient>
<radialGradient id="pearl" cx=".34" cy=".3" r=".78"><stop stop-color="#FFFFFF"/><stop offset=".42" stop-color="#F6F2EC"/><stop offset=".82" stop-color="#D8D0C5"/><stop offset="1" stop-color="#BFB5A8"/></radialGradient>
<linearGradient id="paperW" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F7F4F0"/><stop offset="1" stop-color="#E7E2DB"/></linearGradient>
<linearGradient id="satin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F6F2EA"/><stop offset=".55" stop-color="#ECE6DB"/><stop offset="1" stop-color="#FAF7F1"/></linearGradient>
<linearGradient id="satinPink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F9E6E8"/><stop offset=".45" stop-color="{PINK}"/><stop offset="1" stop-color="{PINK_D}"/></linearGradient>
<pattern id="ginghamMint" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#F6FBF8"/><rect width="6" height="12" fill="{MINT_M}" fill-opacity=".38"/><rect width="12" height="6" fill="{MINT_M}" fill-opacity=".38"/></pattern>
<pattern id="ginghamCocoa" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#FBF8F4"/><rect width="6" height="12" fill="{COCOA}" fill-opacity=".32"/><rect width="12" height="6" fill="{COCOA}" fill-opacity=".32"/></pattern>
<pattern id="ginghamSky" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#F7FBFD"/><rect width="6" height="12" fill="{SKY}" fill-opacity=".4"/><rect width="12" height="6" fill="{SKY}" fill-opacity=".4"/></pattern>
<radialGradient id="pom" cx=".5" cy=".5" r=".5"><stop stop-color="#FFFDF7"/><stop offset=".55" stop-color="#F3E6D2"/><stop offset="1" stop-color="#E2CDB0" stop-opacity="0"/></radialGradient>
"""


class Svg:
    def __init__(self, w, h, seed, attrs=""):
        self.w, self.h = w, h
        self.rnd = random.Random(seed)
        self.parts = []
        self.attrs = attrs

    def add(self, s):
        self.parts.append(s)

    def save(self, name):
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" fill="none" {self.attrs}>'
               f"<defs>{DEFS}</defs>\n" + "\n".join(self.parts) + "\n</svg>\n")
        (OUT / name).write_text(svg, encoding="utf-8")
        print(f"{name}: {len(svg)} bytes")

    def g(self, x, y, s, rot, body, shadow="lift"):
        f = f' filter="url(#{shadow})"' if shadow else ""
        self.add(f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f}) scale({s:.3f})"{f}>{body}</g>')

    # ---------- 甜点与小物：都以原点为中心、约 100 单位宽绘制 ----------
    def bow(self, x, y, s=1, rot=0, kind="mint", shadow="lift"):
        fill, edge, knot = {
            "mint": ("url(#dotsMint)", CHOCO, MINT_M),
            "choco": ("url(#dotsChoco)", CHOCO_D, CHOCO),
            "sky": ("url(#stripeSky)", "#6E95A3", SKY),
            "pink": ("url(#satinPink)", PINK_D, PINK),
            "satin": ("url(#satin)", LACE_EDGE, "#F3EEE6"),
        }[kind]
        loop = "M0 0C-12-24-50-34-52-8-54 14-22 18 0 0Z"
        tail = "M-5 5-22 40-13 36-8 46 4 8Z"
        body = (f'<path d="{tail}" fill="{fill}" stroke="{edge}" stroke-width="1.6" stroke-linejoin="round"/>'
                f'<path d="{tail}" transform="scale(-1 1)" fill="{fill}" stroke="{edge}" stroke-width="1.6" stroke-linejoin="round"/>'
                f'<path d="{loop}" fill="{fill}" stroke="{edge}" stroke-width="1.8"/>'
                f'<path d="{loop}" transform="scale(-1 1)" fill="{fill}" stroke="{edge}" stroke-width="1.8"/>'
                f'<path d="M-12-6C-24-16-38-18-42-8M12-6C24-16 38-18 42-8" stroke="{edge}" stroke-opacity=".45" stroke-width="1.2"/>'
                f'<rect x="-9" y="-10" width="18" height="20" rx="7" fill="{knot}" stroke="{edge}" stroke-width="1.6"/>'
                f'<path d="M-5-6h8" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>')
        self.g(x, y, s, rot, body, shadow)

    def macaron(self, x, y, s=1, rot=0, shell=MINT, cream=CREAM, shadow="lift"):
        body = (f'<path d="M-30 2C-30-22 30-22 30 2Z" fill="{shell}" stroke="{CHOCO}" stroke-opacity=".5" stroke-width="1.2"/>'
                f'<path d="M-29 2h58" stroke="{CHOCO}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 2"/>'
                f'<rect x="-28" y="2" width="56" height="9" rx="4.5" fill="{cream}" stroke="{CHOCO}" stroke-opacity=".3" stroke-width="1"/>'
                f'<path d="M-29 11h58" stroke="{CHOCO}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 2"/>'
                f'<path d="M-30 11C-30 30 30 30 30 11Z" fill="{shell}" stroke="{CHOCO}" stroke-opacity=".5" stroke-width="1.2"/>'
                f'<ellipse cx="-10" cy="-10" rx="11" ry="4" fill="#FFFFFF" fill-opacity=".55"/>'
                f'<circle cx="6" cy="-8" r="1.2" fill="{CHOCO}"/><circle cx="14" cy="-5" r="1.2" fill="{CHOCO}"/><circle cx="-2" cy="-4" r="1.2" fill="{CHOCO}"/>')
        self.g(x, y, s, rot, body, shadow)

    def heart(self, x, y, s=1, rot=0, fill=CHOCO, stroke=None, shadow="liftS"):
        st = f' stroke="{stroke}" stroke-width="2"' if stroke else ""
        body = (f'<path d="M0 26C-38 2-34-30-12-30-4-30 0-23 0-18 0-23 4-30 12-30 34-30 38 2 0 26Z" fill="{fill}"{st}/>'
                '<path d="M-20-20C-26-16-26-8-22-2" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>')
        self.g(x, y, s, rot, body, shadow)

    def lace_heart(self, x, y, s=1, rot=0, word="Love", centre=MINT, shadow="lift"):
        """蕾丝心形垫纸：外圈扇贝边，里面一枚薄荷心，写一个小词。"""
        hp = "M0 26C-38 2-34-30-12-30-4-30 0-23 0-18 0-23 4-30 12-30 34-30 38 2 0 26Z"
        body = (f'<path d="{hp}" transform="scale(1.45)" fill="{CREAM}" stroke="{CREAM}" stroke-width="7" stroke-linejoin="round"/>'
                f'<path d="{hp}" transform="scale(1.53)" stroke="{COCOA_M}" stroke-width="3.2" stroke-dasharray=".1 5.2" stroke-linecap="round"/>'
                f'<path d="{hp}" transform="scale(1.3)" stroke="{COCOA}" stroke-opacity=".6" stroke-width="1" stroke-dasharray="2 2.2"/>'
                f'<path d="{hp}" transform="scale(1.05)" fill="{centre}" stroke="{CHOCO}" stroke-width="2.2"/>'
                f'<text x="0" y="-1" text-anchor="middle" font-family="Georgia, \'Palatino Linotype\', serif" font-style="italic" font-size="15" fill="{CHOCO}">{word}</text>'
                f'<path d="M-9 6c3 3 6 3 9 0 3 3 6 3 9 0" stroke="{CHOCO}" stroke-width="1.4"/>')
        self.g(x, y, s, rot, body, shadow)

    def cake(self, x, y, s=1, rot=0, shadow="lift"):
        """一角夹心蛋糕：黑巧淋面 + 薄荷奶油夹层。"""
        body = (f'<path d="M-34 -6 22 -22 40 -6 -16 10Z" fill="{CHOCO}"/>'
                f'<path d="M-34-6V24L-16 40V10Z" fill="{COCOA_M}"/>'
                f'<path d="M-16 10V40L40 24V-6Z" fill="{CHOCO}"/>'
                f'<path d="M-16 18 40 2M-16 30 40 14" stroke="{MINT}" stroke-width="5"/>'
                f'<path d="M-34 2-16 18M-34 14-16 30" stroke="{MINT_M}" stroke-width="5"/>'
                f'<path d="M-34-6-16 10 40-6 40-1C36 5 34 0 31 6 27 11 25 4 21 9 16 14 14 7 9 12 5 16 3 10-2 15-7 19-10 13-16 16-20 12-24 9-27 13-29 7-32 5-34 3Z" fill="#3B2A22"/>'
                f'<path d="M-30-6 18-20" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>'
                f'<circle cx="8" cy="-20" r="6" fill="{MINT_M}" stroke="{CHOCO}" stroke-width="1.2"/><path d="M8-26c2-4 6-5 8-4" stroke="{CHOCO}" stroke-width="1.4"/>')
        self.g(x, y, s, rot, body, shadow)

    def candy(self, x, y, s=1, rot=0, fill="url(#dotsChoco)", edge=CHOCO_D, shadow="liftS"):
        body = (f'<path d="M-15 0-34-13-30 0-34 13Z" fill="{fill}" stroke="{edge}" stroke-width="1.4" stroke-linejoin="round"/>'
                f'<path d="M15 0 34-13 30 0 34 13Z" fill="{fill}" stroke="{edge}" stroke-width="1.4" stroke-linejoin="round"/>'
                f'<ellipse rx="17" ry="12" fill="{fill}" stroke="{edge}" stroke-width="1.6"/>'
                f'<ellipse cx="-5" cy="-5" rx="7" ry="3" fill="#FFFFFF" fill-opacity=".5"/>')
        self.g(x, y, s, rot, body, shadow)

    def cupcake(self, x, y, s=1, rot=0, shadow="lift"):
        body = (f'<path d="M-26 6-19 40H19L26 6Z" fill="url(#cupStripe)" stroke="{CHOCO_D}" stroke-width="1.4" stroke-linejoin="round"/>'
                f'<path d="M-30 8C-34-4-22-8-18-8-22-20-6-24 0-18 6-24 22-20 18-8 22-8 34-4 30 8Z" fill="{MINT}" stroke="{MINT_INK}" stroke-width="1.4"/>'
                f'<path d="M-20-2C-10 2 10 2 20-2M-12-12C-4-9 4-9 12-12" stroke="{MINT_D}" stroke-width="1.3"/>'
                f'<path d="M-12-27C-12-35 0-38 0-30 0-38 12-35 12-27 12-20 0-15 0-15S-12-20-12-27Z" fill="{CHOCO}" stroke="{CHOCO_D}" stroke-width="1.2"/>'
                f'<path d="M-15-4h3M8-7h3M-2 2h3M16 2h2M-22 3h2" stroke="{CHOCO}" stroke-width="2" stroke-linecap="round"/>'
                f'<ellipse cx="-10" cy="-8" rx="6" ry="2.4" fill="#FFFFFF" fill-opacity=".55"/>')
        self.g(x, y, s, rot, body, shadow)

    def choco_bar(self, x, y, s=1, rot=0, word="Choco", shadow="lift"):
        """一板半拆的巧克力：右半边露出格子，左半边是薄荷波点包装纸。"""
        sq = "".join(f'<rect x="{6+i*14}" y="{-22+j*15}" width="12" height="13" rx="2" fill="url(#choco)" stroke="#2C1E17" stroke-opacity=".5"/>'
                     f'<path d="M{8+i*14} {-20+j*15}h7" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="1.5"/>'
                     for i in range(4) for j in range(3))
        body = (f'<rect x="-62" y="-26" width="124" height="52" rx="5" fill="{CHOCO}"/>{sq}'
                f'<path d="M-62-26H10L4-14 11-2 3 10 10 26H-62Z" fill="url(#dotsCream)" stroke="{COCOA_M}" stroke-width="1.4"/>'
                f'<rect x="-56" y="-12" width="52" height="24" rx="12" fill="{CREAM}" stroke="{COCOA_M}" stroke-width="1.2"/>'
                f'<text x="-30" y="5" text-anchor="middle" font-family="Georgia, \'Palatino Linotype\', serif" font-style="italic" font-size="14" fill="{CHOCO}">{word}</text>')
        self.g(x, y, s, rot, body, shadow)

    def cookie(self, x, y, s=1, rot=0, shadow="liftS"):
        r = self.rnd
        chips = "".join(f'<path d="M{a:.1f} {b:.1f}l3-1.5 2 2.5-2.5 2.5-3-1Z" fill="{CHOCO_D}"/>'
                        for a, b in ((r.uniform(-18, 14), r.uniform(-18, 14)) for _ in range(9)) if a * a + b * b < 300)
        body = (f'<circle r="26" fill="{BISCUIT}" stroke="{BISCUIT_D}" stroke-width="2"/>'
                f'<circle r="21" stroke="{BISCUIT_D}" stroke-opacity=".35" stroke-dasharray="1 4" stroke-width="2" stroke-linecap="round"/>{chips}'
                f'<ellipse cx="-9" cy="-12" rx="8" ry="3" fill="#FFFFFF" fill-opacity=".3"/>')
        self.g(x, y, s, rot, body, shadow)

    def sandwich_cookie(self, x, y, s=1, rot=0, shadow="liftS"):
        dots = "".join(f'<circle cx="{math.cos(a)*15:.1f}" cy="{math.sin(a)*15:.1f}" r="1.6" fill="#2C1E17"/>' for a in [i * math.pi / 5 for i in range(10)])
        body = (f'<circle cx="4" cy="5" r="26" fill="{CHOCO}"/><circle cx="2" cy="3" r="26" fill="{CREAM}"/>'
                f'<circle r="26" fill="url(#choco)" stroke="#2C1E17" stroke-width="1.4"/><circle r="20" stroke="#2C1E17" stroke-opacity=".5" stroke-width="1.4"/>{dots}'
                f'<ellipse cx="-9" cy="-13" rx="9" ry="3" fill="#FFFFFF" fill-opacity=".22"/>')
        self.g(x, y, s, rot, body, shadow)

    def star(self, x, y, r=8, fill="url(#gold)", stroke=GOLD_D, rot=0):
        pts = []
        for i in range(10):
            a = math.pi / 5 * i - math.pi / 2 + math.radians(rot)
            rr = r if i % 2 == 0 else r * .45
            pts.append(f"{x + math.cos(a) * rr:.1f} {y + math.sin(a) * rr:.1f}")
        self.add(f'<path d="M{"L".join(pts)}Z" fill="{fill}" stroke="{stroke}" stroke-width=".8" stroke-linejoin="round"/>')

    def sparkle(self, x, y, r=6, color=GOLD):
        self.add(f'<path d="M{x} {y-r}Q{x+r*.18} {y-r*.18} {x+r} {y}Q{x+r*.18} {y+r*.18} {x} {y+r}Q{x-r*.18} {y+r*.18} {x-r} {y}Q{x-r*.18} {y-r*.18} {x} {y-r}Z" fill="{color}"/>')

    def paw(self, x, y, s=1, rot=0, color=COCOA_M, op=1):
        body = (f'<g fill="{color}" fill-opacity="{op}"><ellipse cx="0" cy="8" rx="12" ry="10"/><ellipse cx="-13" cy="-6" rx="4.6" ry="6"/>'
                f'<ellipse cx="-4.5" cy="-13" rx="4.6" ry="6.2"/><ellipse cx="4.5" cy="-13" rx="4.6" ry="6.2"/><ellipse cx="13" cy="-6" rx="4.6" ry="6"/></g>')
        self.g(x, y, s, rot, body, None)

    def note(self, x, y, s=1, rot=0, color=MINT_INK, shadow="liftS"):
        body = (f'<path d="M-8 18V-18L22-26V10" stroke="{color}" stroke-width="4" stroke-linejoin="round"/><path d="M-8-8 22-16" stroke="{color}" stroke-width="5"/>'
                f'<ellipse cx="-14" cy="19" rx="8" ry="6" transform="rotate(-20 -14 19)" fill="{color}"/>'
                f'<ellipse cx="16" cy="11" rx="8" ry="6" transform="rotate(-20 16 11)" fill="{color}"/>')
        self.g(x, y, s, rot, body, shadow)

    def doily(self, x, y, r=60, fill=CREAM, shadow="lift"):
        """圆形蕾丝垫纸：外圈一串扇贝、两圈针孔，中间一圈薄荷波点。"""
        n = max(12, int(r * 2 * math.pi / 13))
        sc = "".join(f'<circle cx="{math.cos(2*math.pi*i/n)*r:.1f}" cy="{math.sin(2*math.pi*i/n)*r:.1f}" r="{r*math.pi/n*1.25:.1f}" fill="{fill}" stroke="{COCOA}" stroke-opacity=".5" stroke-width=".8"/>' for i in range(n))
        holes = "".join(f'<circle cx="{math.cos(2*math.pi*i/n)*r*.9:.1f}" cy="{math.sin(2*math.pi*i/n)*r*.9:.1f}" r="1.5" fill="{COCOA}" fill-opacity=".35"/>' for i in range(n))
        body = (f'{sc}<circle r="{r}" fill="{fill}"/>{holes}'
                f'<circle r="{r*.76:.1f}" stroke="{COCOA}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="2 3"/>'
                f'<circle r="{r*.62:.1f}" fill="url(#dotsCream)" stroke="{MINT_D}" stroke-opacity=".6" stroke-width="1"/>')
        self.g(x, y, 1, 0, body, shadow)

    def envelope(self, x, y, s=1, rot=0, word="for you", shadow="lift"):
        body = (f'<rect x="-46" y="-30" width="92" height="60" rx="3" fill="{CREAM}" stroke="{COCOA}" stroke-width="1.2"/>'
                f'<path d="M-46-30 0 6 46-30" stroke="{COCOA}" stroke-width="1.2"/>'
                f'<path d="M-40 24h56" stroke="{COCOA}" stroke-opacity=".35" stroke-dasharray="3 3"/>'
                f'<text x="14" y="20" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="10" fill="{COCOA_M}">{word}</text>')
        self.g(x, y, s, rot, body, shadow)
        self.heart(x + 4 * s, y + 2 * s, .32 * s, rot, fill=CHOCO, shadow=None)

    def pompom(self, x, y, r=10):
        rays = "".join(f'<path d="M{x} {y}l{math.cos(a)*r*1.05:.1f} {math.sin(a)*r*1.05:.1f}" stroke="#E7D4B8" stroke-width=".8"/>' for a in [i * math.pi / 14 for i in range(28)])
        self.add(f'<g>{rays}<circle cx="{x}" cy="{y}" r="{r}" fill="url(#pom)"/><circle cx="{x}" cy="{y}" r="{r*.3:.1f}" fill="#FFFDF7"/></g>')

    def ribbon(self, d, w=7, color=SKY, edge="#7FA9B7", op=.9):
        """一条飘带：外缘一道深色描边，中间亮面。"""
        self.add(f'<path d="{d}" stroke="{edge}" stroke-width="{w+2}" stroke-linecap="round" stroke-opacity="{op*.6:.2f}"/>'
                 f'<path d="{d}" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-opacity="{op}"/>'
                 f'<path d="{d}" stroke="#FFFFFF" stroke-width="{w*.25:.1f}" stroke-linecap="round" stroke-opacity=".55"/>')

    def pearls(self, pts, r=2.6):
        out = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / (r * 2.3)))
            for i in range(n):
                t = i / n
                out.append(f'<circle cx="{x0+(x1-x0)*t:.1f}" cy="{y0+(y1-y0)*t:.1f}" r="{r}" fill="{CREAM}" stroke="{GOLD}" stroke-width=".7"/>')
        self.add("".join(out))

    # ---------- 珍珠、纸蝴蝶、钩针蕾丝、格纹心、方形蕾丝框 ----------
    def pearl(self, x, y, r=4):
        self.add(f'<circle cx="{x+r*.12:.1f}" cy="{y+r*.28:.1f}" r="{r}" fill="{CHOCO_D}" fill-opacity=".16"/>'
                 f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#pearl)"/>')

    def pearl_str(self, pts, r=2.6):
        """沿折线摆一串珍珠。"""
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / (r * 2.2)))
            for i in range(n):
                t = i / n
                self.pearl(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r)
        self.pearl(*pts[-1], r)

    def butterfly(self, x, y, s=1, rot=0, shadow="lift"):
        """白色纸蝴蝶：两侧翅膀一宽一窄，像折起来停着。"""
        up = "M0 0C4-18 30-32 36-16 40-4 20 4 0 2Z"
        lo = "M0 2C14 6 28 14 22 26 16 34 4 22 0 4Z"
        wing = f'<path d="{up}" fill="url(#paperW)" stroke="#D3C9BC" stroke-width=".9"/><path d="{lo}" fill="url(#paperW)" stroke="#D3C9BC" stroke-width=".9"/>'
        body = (f'<g transform="scale(-.72 1)">{wing}</g>{wing}'
                f'<path d="M3-1C12-10 24-18 32-16M3 4C10 9 16 14 19 22" stroke="{COCOA}" stroke-opacity=".12" stroke-width="1"/>'
                f'<ellipse cx="0" cy="4" rx="1.6" ry="10" fill="#EAE4DC"/><path d="M0-5C-2-12-5-15-8-16M0-5C2-12 5-15 8-16" stroke="#D9D1C6" stroke-width=".8"/>')
        self.g(x, y, s, rot, body, shadow)

    @staticmethod
    def lace_band(p0, p1, p2, p3, w=12):
        """一段钩针蕾丝丝带（三次贝塞尔）：奶油底、一排镂空椭圆、两侧小狗牙。返回 SVG 字符串。"""
        def pt(t):
            u = 1 - t
            x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
            y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
            dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
            dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
            l = math.hypot(dx, dy) or 1
            return x, y, dx / l, dy / l
        d = f"M{p0[0]} {p0[1]}C{p1[0]} {p1[1]} {p2[0]} {p2[1]} {p3[0]} {p3[1]}"
        length = sum(math.hypot(pt((i + 1) / 40)[0] - pt(i / 40)[0], pt((i + 1) / 40)[1] - pt(i / 40)[1]) for i in range(40))
        out = [f'<path d="{d}" stroke="{LACE_EDGE}" stroke-width="{w+1.6}"/>', f'<path d="{d}" stroke="{LACE}" stroke-width="{w}"/>']
        n = max(2, int(length / (w * .55)))
        for i in range(n + 1):
            x, y, tx, ty = pt(i / n)
            nx, ny = -ty, tx
            for side in (1, -1):
                out.append(f'<circle cx="{x+nx*side*w*.52:.1f}" cy="{y+ny*side*w*.52:.1f}" r="{w*.13:.1f}" fill="{LACE}" stroke="{LACE_EDGE}" stroke-width=".6"/>')
            if i % 2 == 0 and 0 < i < n:
                ang = math.degrees(math.atan2(ty, tx))
                out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{w*.3:.1f}" ry="{w*.17:.1f}" transform="rotate({ang:.0f} {x:.1f} {y:.1f})" fill="{LACE_HOLE}" stroke="{LACE_EDGE}" stroke-width=".6"/>')
            elif 0 < i < n:
                out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{w*.08:.1f}" fill="{LACE_EDGE}"/>')
        return "".join(out)

    def lace_ribbon(self, p0, p1, p2, p3, w=12, shadow="liftS"):
        f = f' filter="url(#{shadow})"' if shadow else ""
        self.add(f"<g{f}>{self.lace_band(p0, p1, p2, p3, w)}</g>")

    def lace_bow(self, x, y, s=1, rot=0, shadow="lift"):
        """钩针蕾丝蝴蝶结，中心一颗珍珠。"""
        lb = self.lace_band
        body = (lb((0, 4), (-6, 22), (-18, 34), (-28, 50), 11) + lb((0, 4), (8, 22), (20, 36), (24, 52), 11)
                + lb((0, 0), (-10, -30), (-56, -34), (-48, -4), 12) + lb((-48, -4), (-42, 18), (-12, 12), (0, 0), 12)
                + lb((0, 0), (10, -30), (56, -34), (48, -4), 12) + lb((48, -4), (42, 18), (12, 12), (0, 0), 12)
                + f'<circle cx=".8" cy="2" r="7" fill="{CHOCO_D}" fill-opacity=".16"/><circle r="7" fill="url(#pearl)"/>')
        self.g(x, y, s, rot, body, shadow)

    def gingham_heart(self, x, y, s=1, rot=0, fill="url(#ginghamMint)", edge=MINT_D, shadow="liftS"):
        hp = "M0 26C-38 2-34-30-12-30-4-30 0-23 0-18 0-23 4-30 12-30 34-30 38 2 0 26Z"
        body = (f'<path d="{hp}" fill="{fill}" stroke="{edge}" stroke-width="1.4"/>'
                f'<path d="{hp}" transform="scale(1.12)" stroke="{LACE}" stroke-width="3.4" stroke-dasharray=".1 4.6" stroke-linecap="round"/>'
                f'<path d="M-22-20C-28-14-27-6-23 0" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>')
        self.g(x, y, s, rot, body, shadow)

    def lace_frame(self, x, y, w, h, rot=0, inner="", shadow="lift"):
        """方形蕾丝框：外圈钩针狗牙，里圈穿一条白缎带（一段露一段藏），中间留空。"""
        hw, hh = w / 2, h / 2
        out = []
        per = 2 * (w + h)
        n = int(per / 6)
        for i in range(n):
            t = i / n * per
            if t < w:
                px, py = -hw + t, -hh
            elif t < w + h:
                px, py = hw, -hh + (t - w)
            elif t < 2 * w + h:
                px, py = hw - (t - w - h), hh
            else:
                px, py = -hw, hh - (t - 2 * w - h)
            out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.6" fill="{LACE}" stroke="{LACE_EDGE}" stroke-width=".6"/>')
        out.append(f'<rect x="{-hw+1}" y="{-hh+1}" width="{w-2}" height="{h-2}" stroke="{LACE}" stroke-width="12"/>')
        out.append(f'<rect x="{-hw+1}" y="{-hh+1}" width="{w-2}" height="{h-2}" stroke="{LACE_EDGE}" stroke-width=".7" stroke-dasharray="1.2 2.4"/>')
        out.append(f'<rect x="{-hw+8}" y="{-hh+8}" width="{w-16}" height="{h-16}" stroke="{LACE_EDGE}" stroke-width="10.6"/>')
        out.append(f'<rect x="{-hw+8}" y="{-hh+8}" width="{w-16}" height="{h-16}" stroke="url(#satin)" stroke-width="9" stroke-dasharray="11 4"/>')
        out.append(f'<rect x="{-hw+8}" y="{-hh+8}" width="{w-16}" height="{h-16}" stroke="#FFFFFF" stroke-opacity=".8" stroke-width="1.4" stroke-dasharray="11 4"/>')
        self.g(x, y, 1, rot, inner + "".join(out), shadow)

    def satin_curl(self, d, w=3.2):
        self.add(f'<path d="{d}" stroke="{LACE_EDGE}" stroke-width="{w+1.2}" stroke-linecap="round"/>'
                 f'<path d="{d}" stroke="url(#satin)" stroke-width="{w}" stroke-linecap="round"/>'
                 f'<path d="{d}" stroke="#FFFFFF" stroke-width="{w*.35:.1f}" stroke-linecap="round" stroke-opacity=".9"/>')

    def chain(self, x0, y0, x1, y1):
        self.add(f'<path d="M{x0} {y0}L{x1} {y1}" stroke="#BDB3A6" stroke-width="1"/>'
                 f'<path d="M{x0} {y0}L{x1} {y1}" stroke="#D9D1C6" stroke-width="2.6" stroke-dasharray="1.6 2.4" stroke-linecap="round"/>')

    def lace_tag(self, x, y, w, h, text, rot=0, size=11, shadow="liftS"):
        """带珍珠的蕾丝小标签。"""
        k = int(w / 5)
        sc = "".join(f'<circle cx="{-w/2+i*w/k:.1f}" cy="{-h/2}" r="2" fill="{LACE}" stroke="{LACE_EDGE}" stroke-width=".5"/>'
                     f'<circle cx="{-w/2+i*w/k:.1f}" cy="{h/2}" r="2" fill="{LACE}" stroke="{LACE_EDGE}" stroke-width=".5"/>' for i in range(k + 1))
        body = (f'{sc}<rect x="{-w/2}" y="{-h/2}" width="{w}" height="{h}" fill="{LACE}" stroke="{LACE_EDGE}" stroke-width=".8"/>'
                f'<rect x="{-w/2+3}" y="{-h/2+3}" width="{w-6}" height="{h-6}" stroke="{LACE_EDGE}" stroke-width=".6" stroke-dasharray="1.4 1.8"/>'
                f'<circle cx="{-w/2+11.5}" cy="1" r="5" fill="{CHOCO_D}" fill-opacity=".14"/><circle cx="{-w/2+11}" cy="0" r="5" fill="url(#pearl)"/>'
                f'<text x="8" y="{size*.36:.1f}" text-anchor="middle" font-family="{SERIF}" font-style="italic" font-size="{size}" fill="{COCOA_M}" letter-spacing=".08em">{text}</text>')
        self.g(x, y, 1, rot, body, shadow)


def scallop_path(x0, x1, y, r, down=True):
    """一串扇贝边（蕾丝下摆）的路径。"""
    n = max(1, int((x1 - x0) / (2 * r)))
    step = (x1 - x0) / n
    sweep = 0 if down else 1
    d = f"M{x0} {y}"
    for i in range(n):
        d += f"a{step/2:.1f} {r} 0 0 {sweep} {step:.1f} 0"
    return d


# ---------- 素材 ----------
def ephemera_tile():
    """正文背后的极淡底纹：散落的小心、小星、猫爪、音符与糖果。"""
    s = Svg(600, 600, 11)
    r = s.rnd
    spots = [(70, 80), (300, 60), (520, 130), (180, 250), (430, 290), (90, 430), (330, 470), (540, 520), (240, 590), (560, 330)]
    for i, (x, y) in enumerate(spots):
        k = i % 5
        if k == 0:
            s.add(f'<g opacity=".18">'); s.heart(x, y, .34, r.uniform(-20, 20), fill=COCOA_M, shadow=None); s.add('</g>')
        elif k == 1:
            s.add(f'<g opacity=".3">'); s.star(x, y, 8, fill=GOLD, stroke="none", rot=r.uniform(0, 30)); s.add('</g>')
        elif k == 2:
            s.add(f'<g opacity=".16">'); s.paw(x, y, .6, r.uniform(-25, 25), color=COCOA_M); s.add('</g>')
        elif k == 3:
            s.add(f'<g opacity=".2">'); s.note(x, y, .5, r.uniform(-15, 15), color=MINT_INK, shadow=None); s.add('</g>')
        else:
            s.add(f'<g opacity=".22">'); s.candy(x, y, .42, r.uniform(-30, 30), fill=MINT_M, edge=MINT_D, shadow=None); s.add('</g>')
    for _ in range(14):
        s.add(f'<g opacity=".35">'); s.sparkle(r.uniform(10, 590), r.uniform(10, 590), r.uniform(2.5, 4.5), color=GOLD); s.add('</g>')
    s.save("mintchoco-ephemera.svg")


def rule():
    """标题下的分隔线：蕾丝扇贝 + 波点缎带 + 中间一只蝴蝶结。"""
    s = Svg(360, 56, 21)
    s.add(f'<path d="{scallop_path(18, 342, 30, 5)}" fill="{CREAM}" stroke="{COCOA}" stroke-opacity=".55" stroke-width="1"/>')
    s.add(f'<path d="M18 30H342" stroke="{COCOA}" stroke-opacity=".45" stroke-width="1"/>')
    s.add(f'<rect x="30" y="22" width="300" height="8" rx="4" fill="url(#dotsMint)" stroke="{MINT_D}" stroke-width=".8"/>')
    for x in (60, 100, 140, 220, 260, 300):
        s.add(f'<circle cx="{x}" cy="40" r="1.3" fill="{COCOA}" fill-opacity=".7"/>')
    s.heart(28, 26, .2, -12, fill=CHOCO, shadow=None)
    s.heart(332, 26, .2, 12, fill=CHOCO, shadow=None)
    s.bow(180, 24, .36, 0, "mint", shadow="liftS")
    s.star(120, 14, 4.5); s.star(240, 14, 4.5)
    s.save("mintchoco-rule.svg")



def ornament():
    """卡片与横幅的角花：一只钩针蕾丝蝴蝶结、一只纸蝴蝶、几颗珍珠和一枚马卡龙。"""
    s = Svg(200, 200, 31)
    s.macaron(132, 120, .5, 18, shell=MINT_M)
    s.lace_bow(78, 74, .95, -16)
    s.butterfly(146, 52, .62, 18)
    s.pearl_str([(16, 176), (44, 164), (78, 166), (104, 154)], 3)
    s.pearl(150, 160, 4); s.sparkle(30, 36, 6)
    s.save("mintchoco-ornament.svg")


def bows():
    for kind in ("mint", "choco", "sky"):
        s = Svg(110, 96, 41)
        s.bow(55, 40, .95, 0, kind)
        s.save(f"mintchoco-bow-{kind}.svg")


def tapes():
    for name, fill, op in (("mint", "url(#dotsMint)", .86), ("choco", "url(#dotsChoco)", .88), ("sky", "url(#stripeSky)", .85)):
        s = Svg(92, 24, 51, attrs='preserveAspectRatio="none"')
        r = s.rnd
        pts = [(0, 2)] + [(0 + r.uniform(-1.5, 1.5), y) for y in (6, 10, 14, 18)] + [(0, 22)]
        right = [(92, 22)] + [(92 + r.uniform(-1.5, 1.5), y) for y in (18, 14, 10, 6)] + [(92, 2)]
        d = "M" + "L".join(f"{a:.1f} {b}" for a, b in pts + right) + "Z"
        s.add(f'<g filter="url(#liftS)"><path d="{d}" fill="{fill}" fill-opacity="{op}"/><path d="{d}" fill="url(#tapeStripe)"/></g>')
        s.save(f"mintchoco-tape-{name}.svg")


def lace_edge():
    s = Svg(28, 14, 1)
    s.add(f'<path d="M0 0H28V6C24 6 24 12 21 12S17 6 14 6 10 12 7 12 3 6 0 6Z" fill="{CREAM}"/>'
          f'<path d="M0 6C3 6 4 12 7 12S11 6 14 6 18 12 21 12 25 6 28 6" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".8"/>'
          f'<circle cx="7" cy="4" r="1.5" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".6"/><circle cx="21" cy="4" r="1.5" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".6"/>'
          f'<circle cx="14" cy="9" r=".9" fill="{COCOA}" fill-opacity=".6"/>')
    s.save("mintchoco-lace-edge.svg")
    # 竖向版本：侧栏右缘向外的扇贝
    s = Svg(14, 28, 2)
    s.add(f'<path d="M0 0V28H6C6 24 12 24 12 21S6 17 6 14 12 10 12 7 6 3 6 0Z" fill="{CREAM}"/>'
          f'<path d="M6 0C6 3 12 4 12 7S6 11 6 14 12 18 12 21 6 25 6 28" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".8"/>'
          f'<circle cx="3.5" cy="7" r="1.4" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".6"/><circle cx="3.5" cy="21" r="1.4" stroke="{COCOA}" stroke-opacity=".6" stroke-width=".6"/>'
          f'<circle cx="9" cy="14" r=".9" fill="{COCOA}" fill-opacity=".6"/>')
    s.save("mintchoco-lace-edge-v.svg")



def collage_br():
    """右下：一板巧克力、纸杯蛋糕、蕾丝心，一条缀珍珠的钩针蕾丝丝带斜穿过去，停着两只纸蝴蝶。"""
    s = Svg(420, 340, 71)
    s.lace_heart(330, 250, 1.15, 10, word="Love")
    s.choco_bar(150, 220, 1.05, -8)
    s.cupcake(360, 120, 1.1, 6)
    s.cookie(250, 150, .85, 0)
    s.sandwich_cookie(70, 300, .9, 0)
    s.lace_ribbon((0, 190), (80, 150), (150, 300), (250, 280), 13)
    s.pearl(60, 172, 4.5); s.pearl(140, 258, 4.5); s.pearl(214, 288, 4.5)
    s.butterfly(110, 120, .8, -16); s.butterfly(276, 70, .6, 22)
    s.bow(392, 205, .5, 18, "pink")
    s.star(300, 30, 7); s.sparkle(400, 40, 7); s.sparkle(190, 110, 5)
    s.save("mintchoco-collage-br.svg")


def collage_bl():
    """左下：马卡龙塔、信封，一枚格纹爱心插在穿缎带的方形蕾丝框里，框边挂着珍珠。"""
    s = Svg(400, 300, 81)
    s.envelope(268, 240, 1.1, 6)
    inner = '<rect x="-38" y="-38" width="76" height="76" fill="url(#ginghamSky)"/>'
    s.lace_frame(196, 132, 96, 96, -9, inner=inner)
    s.gingham_heart(196, 136, .8, -9, fill="url(#ginghamMint)")
    for i, (shell, cream) in enumerate(((COCOA_L, MINT_L), (MINT_M, CREAM), (MINT, CHOCO), (COCOA, MINT_L))):
        s.macaron(80, 270 - i * 38, .95 - i * .08, (-1) ** i * 4, shell=shell, cream=cream)
    s.lace_bow(146, 74, .55, 12)
    s.butterfly(330, 120, .7, 14); s.butterfly(36, 96, .5, -20)
    s.pearl_str([(240, 196), (262, 214), (290, 218)], 3)
    s.star(300, 60, 6); s.sparkle(120, 40, 6)
    s.save("mintchoco-collage-bl.svg")


def hero():
    """首页横幅右侧：一只穿缎带的方形蕾丝框挂在细链上，框里是一枚格纹爱心；
    钩针蕾丝丝带缀着珍珠从下面穿过，纸蝴蝶停在框角，旁边摆着纸杯蛋糕、马卡龙和巧克力。"""
    s = Svg(320, 230, 91)
    s.chain(176, 0, 176, 44)
    s.satin_curl("M176 44C150 36 140 10 160 6S190 30 176 44C200 52 214 30 206 20")
    s.satin_curl("M176 44C168 60 140 62 136 80S150 102 144 114")
    inner = '<rect x="-52" y="-52" width="104" height="104" fill="url(#ginghamSky)"/>'
    s.lace_frame(178, 104, 124, 124, 7, inner=inner)
    s.gingham_heart(178, 108, 1.05, 7, fill="url(#ginghamCocoa)", edge=COCOA_M)
    s.bow(176, 44, .42, 0, "satin", shadow="liftS")
    s.lace_ribbon((0, 196), (90, 150), (180, 240), (320, 176), 13)
    s.pearl(52, 178, 4.6); s.pearl(130, 196, 4.6); s.pearl(214, 206, 4.6); s.pearl(290, 184, 4.6)
    s.cupcake(282, 120, .72, 6)
    for i, (shell, cream) in enumerate(((COCOA_L, MINT_L), (MINT_M, CREAM))):
        s.macaron(62, 140 - i * 28, .62 - i * .06, (-1) ** i * 6, shell=shell, cream=cream)
    s.choco_bar(156, 206, .58, -5)
    s.butterfly(240, 46, .62, 20); s.butterfly(96, 62, .5, -18)
    s.star(292, 22, 6); s.sparkle(30, 30, 6); s.sparkle(306, 70, 4.5)
    s.save("mintchoco-hero.svg")


# 相框：240×430，照片窗口 x=20 y=28 w=200 h=368（与裁好的立绘同为 0.544 比例）
PX, PY, PW, PH = 20, 28, 200, 368



def photo_mat():
    """立绘相框：外圈钩针狗牙蕾丝，里圈穿一条白缎带。"""
    s = Svg(240, 430, 101, attrs='preserveAspectRatio="none"')
    s.add('<g filter="url(#lift)">')
    s.lace_frame(120, 215, 228, 418, 0, inner=f'<rect x="-110" y="-205" width="220" height="410" fill="{LACE}"/>', shadow=None)
    s.add('</g>')
    s.add(f'<rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" fill="#C19B71"/>')
    s.save("mintchoco-photo-mat.svg")


def photo_overlay():
    """压在照片上的小物：顶端一只白缎带蝴蝶结（挂链就系在这里），长长的缎带尾卷下来；
    四角珍珠、纸蝴蝶，底部一张带珍珠的蕾丝名签。"""
    s = Svg(240, 430, 111, attrs='preserveAspectRatio="none"')
    s.add(f'<rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" stroke="{LACE_EDGE}" stroke-width="1.2"/>')
    for (x, y) in ((PX, PY), (PX + PW, PY), (PX, PY + PH), (PX + PW, PY + PH)):
        s.pearl(x, y, 4.2)
    s.satin_curl("M120 18C100 30 70 22 64 46S84 78 62 96C48 108 30 100 26 118")
    s.satin_curl("M120 18C142 34 176 28 180 54S160 86 186 102")
    s.bow(120, 16, .6, 0, "satin")
    s.pearl(120, 16, 5)
    s.butterfly(204, 330, .6, 24); s.butterfly(30, 250, .48, -18)
    s.lace_tag(120, 408, 118, 24, "Mint &amp; Cocoa")
    s.sparkle(212, 66, 6, color="#FFFFFF"); s.sparkle(28, 160, 4.5, color="#FFFFFF")
    s.save("mintchoco-photo-overlay.svg")


def nav_mark():
    s = Svg(40, 32, 121)
    s.bow(20, 14, .34, 0, "choco", shadow=None)
    s.save("mintchoco-navbow.svg")
    s = Svg(40, 32, 122)
    s.bow(20, 14, .34, 0, "mint", shadow=None)
    s.save("mintchoco-navbow-mint.svg")



def hanky(dark=False, name="mintchoco-hanky", colors=None):
    """卡片四周的手帕细蕾丝（border-image 九宫格，slice 20）：外缘狗牙、一排镂空小孔、内侧一道折线。"""
    lace, edge = colors or (("#5E4E42", "#7C6A5C") if dark else (LACE, LACE_EDGE))
    s = Svg(60, 60, 131, attrs='width="60" height="60"')
    holes, pic = [], []
    for k in range(12):
        c = 2.5 + k * 5
        holes += [f'<circle cx="{c}" cy="12" r="2.1"/>', f'<circle cx="{c}" cy="48" r="2.1"/>', f'<circle cx="12" cy="{c}" r="2.1"/>', f'<circle cx="48" cy="{c}" r="2.1"/>']
        pic += [f'<circle cx="{c}" cy="6" r="3"/>', f'<circle cx="{c}" cy="54" r="3"/>', f'<circle cx="6" cy="{c}" r="3"/>', f'<circle cx="54" cy="{c}" r="3"/>']
    s.add(f'<mask id="m"><rect width="60" height="60" fill="#fff"/><g fill="#000">{"".join(holes)}</g><rect x="20" y="20" width="20" height="20" fill="#000"/></mask>')
    s.add(f'<g mask="url(#m)"><g fill="{lace}" stroke="{edge}" stroke-width=".5">{"".join(pic)}</g>'
          f'<path d="M6 6H54V54H6ZM20 20V40H40V20Z" fill="{lace}" fill-rule="evenodd"/></g>')
    zig = "M" + "L".join(f"{2.5+k*5} {16 if k % 2 else 18.5}" for k in range(12))
    s.add(f'<path d="{zig}" stroke="{edge}" stroke-width=".6"/>'
          f'<path d="{zig}" stroke="{edge}" stroke-width=".6" transform="translate(0 60) scale(1 -1)"/>'
          f'<path d="{zig}" stroke="{edge}" stroke-width=".6" transform="rotate(90 30 30)"/>'
          f'<path d="{zig}" stroke="{edge}" stroke-width=".6" transform="rotate(-90 30 30)"/>'
          f'<rect x="19.5" y="19.5" width="21" height="21" stroke="{edge}" stroke-width=".8"/>')
    s.save(f"{name}-dark.svg" if dark else f"{name}.svg")


def lace_tag_tile(dark=False, name="mintchoco-lace-tag", colors=None):
    """页标题的蕾丝标签（border-image 九宫格，slice 10，带底色）。"""
    lace, edge, fill = colors or (("#5E4E42", "#7C6A5C", "#3A2E26") if dark else (LACE, LACE_EDGE, "#FFFDF8"))
    s = Svg(30, 30, 141, attrs='width="30" height="30"')
    pic = "".join(f'<circle cx="{c}" cy="3" r="2.2"/><circle cx="{c}" cy="27" r="2.2"/><circle cx="3" cy="{c}" r="2.2"/><circle cx="27" cy="{c}" r="2.2"/>' for c in (2.5, 7.5, 12.5, 17.5, 22.5, 27.5))
    s.add(f'<g fill="{lace}" stroke="{edge}" stroke-width=".5">{pic}</g><rect x="3" y="3" width="24" height="24" fill="{fill}"/>'
          f'<rect x="3" y="3" width="24" height="24" stroke="{edge}" stroke-width=".7"/>'
          f'<rect x="6.5" y="6.5" width="17" height="17" stroke="{edge}" stroke-width=".6" stroke-dasharray="1.2 1.6"/>')
    s.save(f"{name}-dark.svg" if dark else f"{name}.svg")


def lace_trim(dark=False, name="mintchoco-lace-trim", colors=None):
    """卡片标题下横贯整行的蕾丝花边（20×14 横向平铺）。"""
    lace, edge, hole = colors or (("#5E4E42", "#7C6A5C", "#46382F") if dark else (LACE, LACE_EDGE, LACE_HOLE))
    s = Svg(20, 14, 151, attrs='width="20" height="14"')
    s.add(f'<g fill="{lace}" stroke="{edge}" stroke-width=".5"><circle cx="5" cy="2.2" r="2"/><circle cx="15" cy="2.2" r="2"/><circle cx="5" cy="11.8" r="2"/><circle cx="15" cy="11.8" r="2"/></g>'
          f'<rect x="0" y="2.2" width="20" height="9.6" fill="{lace}"/><path d="M0 2.4H20M0 11.6H20" stroke="{edge}" stroke-width=".6"/>'
          f'<ellipse cx="5" cy="7" rx="3" ry="1.8" fill="{hole}" stroke="{edge}" stroke-width=".5"/><circle cx="15" cy="7" r="1" fill="{edge}"/>'
          f'<path d="M10 4.4V9.6" stroke="{edge}" stroke-width=".5" stroke-dasharray=".8 .8"/>')
    s.save(f"{name}-dark.svg" if dark else f"{name}.svg")


def heart_lace():
    """横幅下摆：可可色镂空花边，每个扇贝里挖一颗心。"""
    s = Svg(32, 18, 161)
    s.add(f'<path d="M0 0H32V6C28 6 28 15 24 15S20 6 16 6 12 15 8 15 4 6 0 6Z'
          f'M8 7.4C6.6 6 5 7.2 5.6 8.6 6.2 10 8 11.2 8 11.2S9.8 10 10.4 8.6C11 7.2 9.4 6 8 7.4Z'
          f'M24 7.4C22.6 6 21 7.2 21.6 8.6 22.2 10 24 11.2 24 11.2S25.8 10 26.4 8.6C27 7.2 25.4 6 24 7.4Z" fill="{COCOA_M}" fill-rule="evenodd"/>'
          f'<path d="M0 2.6H32" stroke="{CREAM}" stroke-opacity=".7" stroke-width=".8" stroke-dasharray="1.6 1.6"/><circle cx="16" cy="9.5" r="1.2" fill="{COCOA_M}"/>')
    s.save("mintchoco-lace-heart.svg")


def script_mark():
    """横幅里的花体字水印和手写批注。"""
    s = Svg(520, 120, 171)
    s.add(f'<text x="8" y="74" font-family="{SCRIPT}" font-size="58" fill="{COCOA_M}" fill-opacity=".9">Little by little</text>'
          f'<path d="M318 92H420" stroke="{COCOA_M}" stroke-opacity=".6" stroke-width="1"/>'
          f'<text x="428" y="96" font-family="{SERIF}" font-style="italic" font-size="12" fill="{COCOA_M}">every day</text>'
          f'<path d="M286 22C300 10 318 12 324 20M318 12 324 20 314 22" stroke="{COCOA_M}" stroke-opacity=".7" stroke-width="1"/>'
          f'<text x="332" y="24" font-family="{SCRIPT}" font-size="13" fill="{COCOA_M}">one sweet word at a time</text>')
    s.save("mintchoco-script.svg")


def tape_gingham():
    s = Svg(92, 24, 52, attrs='preserveAspectRatio="none"')
    d = "M0 2L1 7-1 12 1 17 0 22H92L91 17 93 12 91 7 92 2Z"
    s.add(f'<g filter="url(#liftS)"><path d="{d}" fill="url(#ginghamSky)" fill-opacity=".92"/><path d="{d}" fill="{PINK}" fill-opacity=".3"/></g>')
    s.save("mintchoco-tape-gingham.svg")


def extra_bows():
    for kind in ("pink", "satin"):
        s = Svg(110, 96, 42)
        s.bow(55, 40, .95, 0, kind)
        s.save(f"mintchoco-bow-{kind}.svg")
    s = Svg(120, 100, 43)
    s.lace_bow(60, 40, .95, 0)
    s.save("mintchoco-bow-lace.svg")
    s = Svg(80, 64, 44)
    s.butterfly(40, 26, .95, 12)
    s.save("mintchoco-butterfly.svg")


if __name__ == "__main__":
    ephemera_tile(); rule(); ornament(); bows(); tapes(); lace_edge()
    collage_br(); collage_bl(); hero(); photo_mat(); photo_overlay(); nav_mark()
    hanky(); hanky(True); lace_tag_tile(); lace_tag_tile(True); lace_trim(); lace_trim(True)
    heart_lace(); script_mark(); tape_gingham(); extra_bows()
