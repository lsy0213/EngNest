"""生成「月桂蔷薇」剪贴簿主题的原创矢量素材。

配色取自缎带少女立绘：蓝绿缎带 #86C9BF、蜂蜜金发 #C5B896、皮带棕 #413D2B、
象牙裙 #EFEBE2，以及原界面里的板岩蓝绿 #526A6A 与铁锈红 #865C4F。
撕边、珍珠、蕾丝、邮票、压花和蝴蝶都由下面的函数按固定随机种子绘制，重复运行结果一致。

    python tools/gen_garden_scrapbook.py
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "css" / "skin"

TEAL_L, TEAL, TEAL_D, TEAL_INK = "#A9DCD3", "#74BFB4", "#3F918A", "#2D6E69"
HONEY, HONEY_D = "#C5B896", "#8E7A55"
LEATHER, LEATHER_L = "#4A3B2A", "#6E563D"
IVORY, IVORY_2 = "#F8F4EA", "#EFE8DA"
KRAFT, KRAFT_D = "#CDB792", "#A98F69"
SLATE, RUST = "#526A6A", "#865C4F"
NEWS, NEWS_INK = "#ECE7DB", "#7B7468"
FERN, FERN_D, SAGE = "#7F8B5E", "#5E6A45", "#A3AE84"
ROSE, ROSE_D, ROSE_L = "#B8907F", "#8E6556", "#D9BCAA"
LAV = "#9E90B1"

DEFS = """
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="4" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .38  0 0 0 0 .29  0 0 0 0 .2  0 0 0 .16 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.5" dy="3" stdDeviation="2.4" flood-color="#4A3B2A" flood-opacity=".2"/></filter>
<filter id="liftS" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".8" dy="1.4" stdDeviation="1.1" flood-color="#4A3B2A" flood-opacity=".24"/></filter>
<radialGradient id="pearl" cx=".36" cy=".32" r=".75"><stop stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F4EFE6"/><stop offset=".85" stop-color="#D3C9B8"/><stop offset="1" stop-color="#B9AE9A"/></radialGradient>
<linearGradient id="satin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#C3EAE2"/><stop offset=".38" stop-color="#7DC6BA"/><stop offset=".72" stop-color="#4FA39A"/><stop offset="1" stop-color="#3B8C84"/></linearGradient>
<linearGradient id="satinR" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#C3EAE2"/><stop offset=".38" stop-color="#7DC6BA"/><stop offset=".72" stop-color="#4FA39A"/><stop offset="1" stop-color="#3B8C84"/></linearGradient>
<linearGradient id="kraft" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#D8C5A2"/><stop offset="1" stop-color="#C2A97F"/></linearGradient>
<linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FCFAF3"/><stop offset="1" stop-color="#EEE6D6"/></linearGradient>
<pattern id="lace" width="18" height="24" patternUnits="userSpaceOnUse"><path d="M0 0h18v14c-3 0-3 6-9 6s-6-6-9-6Z" fill="#FBF8F1" fill-opacity=".93"/><path d="M0 14c3 0 3 6 9 6s6-6 9-6" fill="none" stroke="#D8CDB9" stroke-width=".8"/><circle cx="9" cy="6" r="2.6" fill="none" stroke="#D3C7B2" stroke-width=".8"/><circle cx="9" cy="6" r=".9" fill="#D3C7B2"/><circle cx="0" cy="10" r="1.3" fill="#E4DCCB"/><circle cx="18" cy="10" r="1.3" fill="#E4DCCB"/><circle cx="9" cy="15.5" r="1.1" fill="#E4DCCB"/><path d="M3 2.5h12" stroke="#DED4C2" stroke-width=".6" stroke-dasharray="1.2 1.4"/></pattern>
<pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v4" stroke="#7B7468" stroke-width=".7" stroke-opacity=".55"/></pattern>
<pattern id="tapeStripe" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="#FFFFFF" fill-opacity=".28"/></pattern>
"""


class Svg:
    def __init__(self, w, h, seed, extra_defs="", attrs=""):
        self.w, self.h = w, h
        self.rnd = random.Random(seed)
        self.parts = []
        self.defs = DEFS + extra_defs
        self.attrs = attrs
        self.uid = 0

    def add(self, s):
        self.parts.append(s)

    def nid(self, p):
        self.uid += 1
        return f"{p}{self.uid}"

    def save(self, name):
        body = "\n".join(self.parts)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" fill="none" {self.attrs}>'
               f"<defs>{self.defs}</defs>\n{body}\n</svg>\n")
        (OUT / name).write_text(svg, encoding="utf-8")
        print(f"{name}: {len(svg)} bytes")

    # ---------- 纸 ----------
    def torn_path(self, x, y, w, h, rough=(1, 1, 1, 1), amp=3.2, step=7):
        """矩形纸片；rough 依次对应上、右、下、左，1 为撕边，0 为直边。"""
        r = self.rnd
        pts = []

        def edge(x0, y0, x1, y1, torn, nx, ny):
            n = max(2, int(math.hypot(x1 - x0, y1 - y0) / step))
            off = 0.0
            for i in range(n):
                t = i / n
                if torn:
                    off = max(-amp, min(amp, off * .55 + r.uniform(-amp, amp)))
                    if r.random() < .12:
                        off += r.uniform(-amp, amp) * .9
                pts.append((x0 + (x1 - x0) * t + nx * (off if torn else 0),
                            y0 + (y1 - y0) * t + ny * (off if torn else 0)))

        edge(x, y, x + w, y, rough[0], 0, 1)
        edge(x + w, y, x + w, y + h, rough[1], 1, 0)
        edge(x + w, y + h, x, y + h, rough[2], 0, 1)
        edge(x, y + h, x, y, rough[3], 1, 0)
        return "M" + "L".join(f"{a:.1f} {b:.1f}" for a, b in pts) + "Z"

    def paper(self, x, y, w, h, fill="url(#ivory)", rot=0, rough=(1, 1, 1, 1), amp=3.2, deckle=True, shadow="lift", inner=""):
        d = self.torn_path(x, y, w, h, rough, amp)
        cx, cy = x + w / 2, y + h / 2
        fiber = ""
        if deckle:
            fiber = f'<path d="{d}" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.6" transform="translate(-.6 -.6)"/>'
        self.add(f'<g transform="rotate({rot} {cx:.0f} {cy:.0f})"><g filter="url(#{shadow})"><path d="{d}" fill="{fill}"/></g>'
                 f'<path d="{d}" fill="#000" filter="url(#grain)"/>{fiber}{inner}</g>')

    def newsprint(self, x, y, w, h, rot=0, cols=2, headline=True, picture=False):
        r = self.rnd
        inner = []
        pad = 8
        cy0 = y + pad
        if headline:
            inner.append(f'<rect x="{x+pad}" y="{cy0}" width="{w-2*pad}" height="5" fill="{NEWS_INK}" fill-opacity=".72"/>')
            inner.append(f'<rect x="{x+pad+10}" y="{cy0+8}" width="{w-2*pad-20}" height="2" fill="{NEWS_INK}" fill-opacity=".5"/>')
            cy0 += 15
        gap = 6
        cw = (w - 2 * pad - gap * (cols - 1)) / cols
        for c in range(cols):
            cx = x + pad + c * (cw + gap)
            yy = cy0
            if picture and c == cols - 1:
                inner.append(f'<rect x="{cx:.1f}" y="{yy}" width="{cw:.1f}" height="{cw*0.8:.1f}" fill="url(#hatch)" stroke="{NEWS_INK}" stroke-opacity=".5" stroke-width=".6"/>')
                yy += cw * 0.8 + 4
            while yy < y + h - pad:
                ln = cw if r.random() > .14 else cw * r.uniform(.3, .8)
                inner.append(f'<rect x="{cx:.1f}" y="{yy:.1f}" width="{ln:.1f}" height="1.3" fill="{NEWS_INK}" fill-opacity=".42"/>')
                yy += 3.6 if r.random() > .08 else 7
        self.paper(x, y, w, h, fill=NEWS, rot=rot, inner="".join(inner))

    def label(self, x, y, w, h, text, rot=0, size=11, fill="#FBF8F0", color="#4A443A", italic=False):
        style = "italic" if italic else "normal"
        fam = "Georgia, 'Palatino Linotype', serif" if italic else "'Courier New', Courier, monospace"
        inner = (f'<text x="{x+w/2:.1f}" y="{y+h/2+size*.36:.1f}" text-anchor="middle" font-family="{fam}" font-style="{style}" '
                 f'font-size="{size}" fill="{color}" letter-spacing=".04em">{text}</text>')
        self.paper(x, y, w, h, fill=fill, rot=rot, rough=(0, 1, 0, 1), amp=2.2, shadow="liftS", inner=inner)

    def tape(self, x, y, w, h, rot=0, color=TEAL, opacity=.62, stripes=True):
        d = self.torn_path(x, y, w, h, (0, 1, 0, 1), amp=1.8, step=3)
        cx, cy = x + w / 2, y + h / 2
        s = f'<path d="{d}" fill="url(#tapeStripe)"/>' if stripes else ""
        self.add(f'<g transform="rotate({rot} {cx:.0f} {cy:.0f})" filter="url(#liftS)"><path d="{d}" fill="{color}" fill-opacity="{opacity}"/>{s}'
                 f'<path d="{d}" stroke="#FFFFFF" stroke-opacity=".35" stroke-width=".8"/></g>')

    # ---------- 小物 ----------
    def pearls(self, pts, r=3.1, spacing=None):
        """沿折线（取样点）摆珍珠。"""
        spacing = spacing or r * 2.15
        out = []
        acc = 0
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            seg = math.hypot(x1 - x0, y1 - y0)
            t = acc
            while t < seg:
                px, py = x0 + (x1 - x0) * t / seg, y0 + (y1 - y0) * t / seg
                out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r}" fill="url(#pearl)" stroke="#B8AD99" stroke-width=".35"/>')
                t += spacing
            acc = t - seg
        self.add(f'<g filter="url(#liftS)">{"".join(out)}</g>')

    @staticmethod
    def curve(p0, p1, p2, p3=None, n=60):
        pts = []
        for i in range(n + 1):
            t = i / n
            if p3 is None:
                x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
                y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
            else:
                x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0]
                y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]
            pts.append((x, y))
        return pts

    def bow(self, cx, cy, s=1.0, rot=0):
        """蓝绿缎带蝴蝶结，取自角色头顶和胸前的缎带。"""
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#lift)" stroke-linejoin="round">
<path d="M-4 4C-10 20-17 34-27 47l11-2 3 11C-5 40-1 22 2 6Z" fill="url(#satin)" stroke="{TEAL_INK}" stroke-width=".9"/>
<path d="M4 4C11 19 19 31 30 42l-11 0-1 11C10 37 4 21-1 6Z" fill="url(#satinR)" stroke="{TEAL_INK}" stroke-width=".9"/>
<path d="M-2-1C-12-20-38-31-45-15-50-2-30 9-2 3Z" fill="url(#satin)" stroke="{TEAL_INK}" stroke-width=".9"/>
<path d="M2-1C13-20 39-29 45-12 49 1 28 10 2 3Z" fill="url(#satinR)" stroke="{TEAL_INK}" stroke-width=".9"/>
<path d="M-4-1C-15-10-30-14-37-9-30-5-17-2-4 1Z" fill="{TEAL_D}" fill-opacity=".45"/>
<path d="M4-1C15-10 30-13 37-7 30-4 17-1 4 1Z" fill="{TEAL_D}" fill-opacity=".45"/>
<path d="M-40-14C-33-24-20-22-11-14M14-14C24-22 36-21 41-11M-9 12C-13 24-18 33-22 41M9 12C14 22 20 30 25 37" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>
<ellipse cx="0" cy="1" rx="7.5" ry="8.5" fill="{TEAL}" stroke="{TEAL_INK}" stroke-width=".9"/>
<path d="M-4-3C-1-6 3-6 5-2" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>
</g>''')

    def stamp(self, x, y, w, h, rot=0, color=SLATE, value="12", motif="rose"):
        mid = self.nid("sm")
        holes = []
        step = 5.2
        for i in range(int(w / step) + 1):
            holes.append(f'<circle cx="{x + i*step:.1f}" cy="{y}" r="1.9"/><circle cx="{x + i*step:.1f}" cy="{y+h}" r="1.9"/>')
        for i in range(int(h / step) + 1):
            holes.append(f'<circle cx="{x}" cy="{y + i*step:.1f}" r="1.9"/><circle cx="{x+w}" cy="{y + i*step:.1f}" r="1.9"/>')
        mx, my = x + w / 2, y + h * .46
        if motif == "rose":
            art = (f'<g stroke="#F4EEDF" stroke-width=".9" stroke-linecap="round">'
                   f'<circle cx="{mx}" cy="{my}" r="{w*.17:.1f}"/><path d="M{mx-w*.08:.1f} {my}c2-4 7-4 8 0s-4 6-7 3 0-6 3-5"/>'
                   f'<path d="M{mx} {my+w*.17:.1f}v{h*.2:.1f}M{mx} {my+w*.25:.1f}c-5-1-8 1-9 4 5 1 8-1 9-4Zm0 3c5-1 8 1 9 4-5 1-8-1-9-4Z"/></g>')
        elif motif == "fern":
            art = (f'<g stroke="#F4EEDF" stroke-width=".9" stroke-linecap="round"><path d="M{mx} {my+h*.28:.1f}C{mx-2} {my} {mx+3} {my-h*.12:.1f} {mx} {my-h*.25:.1f}"/>'
                   + "".join(f'<path d="M{mx:.1f} {my-h*.2+i*h*.09:.1f}l-{5+i*.8:.1f}-3M{mx:.1f} {my-h*.18+i*h*.09:.1f}l{5+i*.8:.1f}-3"/>' for i in range(5)) + "</g>")
        else:  # 蝴蝶
            art = (f'<g stroke="#F4EEDF" stroke-width=".9"><path d="M{mx} {my-6}v12M{mx} {my-2}c-4-8-12-8-11-1 1 5 7 5 11 1Zm0 0c4-8 12-8 11-1-1 5-7 5-11 1Zm0 2c-3 4-9 7-9 3s5-4 9-3Zm0 0c3 4 9 7 9 3s-5-4-9-3Z"/></g>')
        self.add(f'''<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})" filter="url(#liftS)"><mask id="{mid}"><rect x="{x-3}" y="{y-3}" width="{w+6}" height="{h+6}" fill="#fff"/><g fill="#000">{"".join(holes)}</g></mask>
<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#F6F1E4" mask="url(#{mid})"/>
<rect x="{x+3.5}" y="{y+3.5}" width="{w-7}" height="{h-7}" fill="{color}"/>
<rect x="{x+5.5}" y="{y+5.5}" width="{w-11}" height="{h-11}" stroke="#F4EEDF" stroke-opacity=".7" stroke-width=".6"/>
{art}<text x="{x+7}" y="{y+13}" font-family="Georgia,serif" font-size="7" font-weight="700" fill="#F4EEDF">{value}</text>
<text x="{x+w/2}" y="{y+h-7.5}" text-anchor="middle" font-family="Georgia,serif" font-size="4.6" letter-spacing=".12em" fill="#F4EEDF">ENGNEST</text>
<rect x="{x+3.5}" y="{y+3.5}" width="{w-7}" height="{h-7}" fill="#000" filter="url(#grain)"/></g>''')

    def postmark(self, cx, cy, r=24, rot=-12, color="#4E463D", waves=True):
        pid = self.nid("pm")
        w = ""
        if waves:
            w = "".join(f'<path d="M{cx+r+3} {cy-9+i*6}c6-4 10 4 16 0s10 4 16 0 10 4 16 0 10 4 16 0"/>' for i in range(4))
        self.add(f'''<g transform="rotate({rot} {cx} {cy})" stroke="{color}" stroke-opacity=".5" fill="none" stroke-width="1"><path id="{pid}" d="M{cx-r+5} {cy}a{r-5} {r-5} 0 1 1 {2*(r-5)} 0"/>
<circle cx="{cx}" cy="{cy}" r="{r}"/><circle cx="{cx}" cy="{cy}" r="{r-9}"/>{w}
<text font-family="Georgia,serif" font-size="6.2" letter-spacing=".18em" fill="{color}" fill-opacity=".55" stroke="none"><textPath href="#{pid}" startOffset="50%" text-anchor="middle">WORDS · LETTRES</textPath></text>
<text x="{cx}" y="{cy+2.4}" text-anchor="middle" font-family="'Courier New',monospace" font-size="6.5" font-weight="700" fill="{color}" fill-opacity=".55" stroke="none">01 OCT</text></g>''')

    def fern(self, x0, y0, x1, y1, bend=20, leaves=14, size=11, color=FERN, rot_bias=0):
        mxp, myp = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy)
        nx, ny = -dy / L, dx / L
        ctrl = (mxp + nx * bend, myp + ny * bend)
        pts = self.curve((x0, y0), ctrl, (x1, y1), n=leaves * 2)
        out = [f'<path d="M{x0} {y0}Q{ctrl[0]:.1f} {ctrl[1]:.1f} {x1} {y1}" stroke="{FERN_D}" stroke-width="1.3" stroke-linecap="round"/>']
        for i in range(1, leaves * 2, 2):
            (ax, ay), (bx, by) = pts[i - 1], pts[i + 1]
            ang = math.degrees(math.atan2(by - ay, bx - ax))
            px, py = pts[i]
            sz = size * (1 - i / (leaves * 2.3))
            for side in (-1, 1):
                a = ang + side * (58 + rot_bias)
                fill = color if self.rnd.random() > .3 else SAGE
                out.append(f'<path d="M0 0C{sz*.35:.1f} {-sz*.32:.1f} {sz*.8:.1f} {-sz*.28:.1f} {sz:.1f} 0 {sz*.8:.1f} {sz*.28:.1f} {sz*.35:.1f} {sz*.32:.1f} 0 0Z" '
                           f'transform="translate({px:.1f} {py:.1f}) rotate({a:.0f})" fill="{fill}" stroke="{FERN_D}" stroke-width=".5"/>')
        self.add(f'<g filter="url(#liftS)">{"".join(out)}</g>')

    def rose(self, cx, cy, s=1.0, rot=0, leaf=True):
        lv = ""
        if leaf:
            lv = (f'<path d="M6 10C18 12 28 22 30 32 18 31 9 22 6 10Z" fill="{SAGE}" stroke="{FERN_D}" stroke-width=".6"/>'
                  f'<path d="M-6 9C-18 8-28 15-31 25-19 26-9 20-6 9Z" fill="{FERN}" stroke="{FERN_D}" stroke-width=".6"/>'
                  f'<path d="M8 12C16 18 22 24 28 31M-8 11C-16 15-22 19-28 24" stroke="{FERN_D}" stroke-width=".5"/>')
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#liftS)">{lv}
<path d="M0-15C11-16 17-7 15 3 13 13 3 16-5 14-14 12-17 2-14-6-11-13-6-15 0-15Z" fill="{ROSE_L}" stroke="{ROSE_D}" stroke-width=".7"/>
<path d="M-11-4C-9-12 2-14 9-9 14-5 12 5 6 9-1 13-10 9-11-4Z" fill="{ROSE}" stroke="{ROSE_D}" stroke-width=".6"/>
<path d="M-6-3C-4-8 3-9 6-5 8-1 5 4 1 5-3 6-7 2-6-3Z" fill="{ROSE_D}" fill-opacity=".55"/>
<path d="M-3-2C0-5 4-3 3 0S-1 3-2 1" stroke="#6E4A3F" stroke-width=".8" stroke-linecap="round"/>
<path d="M-13 3C-9 10 0 13 9 9M13-4C10-11 3-14-4-13" stroke="#F4E6DA" stroke-opacity=".6" stroke-width=".8"/></g>''')

    def baby_breath(self, x, y, s=1.0, rot=0, n=16):
        r = self.rnd
        out = [f'<path d="M0 0C-2 -20 2 -40 0 -62" stroke="#958F72" stroke-width="1"/>']
        for _ in range(n):
            ang = r.uniform(-150, -30)
            ln = r.uniform(14, 34)
            bx, by = 0, -r.uniform(18, 50)
            ex, ey = bx + math.cos(math.radians(ang)) * ln, by + math.sin(math.radians(ang)) * ln
            out.append(f'<path d="M{bx:.1f} {by:.1f}L{ex:.1f} {ey:.1f}" stroke="#A8A288" stroke-width=".55"/>')
            for _k in range(r.randint(1, 3)):
                fx, fy = ex + r.uniform(-4, 4), ey + r.uniform(-4, 4)
                out.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{r.uniform(1.4, 2.3):.1f}" fill="#FBF8EF" stroke="#CFC5AE" stroke-width=".45"/>')
        self.add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#liftS)">{"".join(out)}</g>')

    def lavender(self, x, y, s=1.0, rot=0):
        out = [f'<path d="M0 0C1-25-1-50 2-80" stroke="{FERN_D}" stroke-width="1"/>']
        for i in range(14):
            yy = -40 - i * 3
            for side in (-1, 1):
                out.append(f'<ellipse cx="{side*2.4+ (i%2):.1f}" cy="{yy}" rx="1.9" ry="3.2" transform="rotate({side*25} {side*2.4:.1f} {yy})" fill="{LAV}" stroke="#7B6D8F" stroke-width=".4"/>')
        self.add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#liftS)">{"".join(out)}</g>')

    def butterfly(self, cx, cy, s=1.0, rot=0, c1="#9ED0D6", c2="#5D9EAE"):
        gid = self.nid("bf")
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#liftS)"><defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<path d="M-1-2C-8-18-26-24-30-15-33-6-20 2-2 1Z" fill="url(#{gid})" stroke="#2F5562" stroke-width=".7"/>
<path d="M1-2C8-18 26-24 30-15 33-6 20 2 2 1Z" fill="url(#{gid})" stroke="#2F5562" stroke-width=".7"/>
<path d="M-1 1C-14 3-22 11-18 18-13 23-5 14-1 3Z" fill="url(#{gid})" stroke="#2F5562" stroke-width=".7"/>
<path d="M1 1C14 3 22 11 18 18 13 23 5 14 1 3Z" fill="url(#{gid})" stroke="#2F5562" stroke-width=".7"/>
<path d="M-2-1C-10-8-18-14-26-15M-2 0C-12-4-20-5-27-8M-2 2C-9 7-14 12-16 17M2-1C10-8 18-14 26-15M2 0C12-4 20-5 27-8M2 2C9 7 14 12 16 17" stroke="#2F5562" stroke-opacity=".45" stroke-width=".5"/>
<path d="M-29-15C-27-20-22-21-18-20M29-15C27-20 22-21 18-20" stroke="#24434E" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="0" cy="1" rx="1.6" ry="8" fill="#2F3D3F"/><path d="M-1-6C-3-11-6-13-8-14M1-6C3-11 6-13 8-14" stroke="#2F3D3F" stroke-width=".6"/></g>''')

    def lace_strip(self, x, y, w, rot=0, h=24):
        self.add(f'<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})" filter="url(#liftS)"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#lace)"/></g>')

    def wax_seal(self, cx, cy, r=17, rot=0):
        rr = self.rnd
        pts = []
        for i in range(28):
            a = i / 28 * math.tau
            k = r * (1 + rr.uniform(-.06, .1))
            pts.append(f"{cx+math.cos(a)*k:.1f} {cy+math.sin(a)*k:.1f}")
        self.add(f'''<g transform="rotate({rot} {cx} {cy})" filter="url(#lift)"><path d="M{"L".join(pts)}Z" fill="{RUST}"/>
<circle cx="{cx}" cy="{cy}" r="{r*.68:.1f}" fill="#7A5045" stroke="#5E3B32" stroke-width="1"/>
<circle cx="{cx}" cy="{cy}" r="{r*.68:.1f}" stroke="#B88676" stroke-opacity=".5" stroke-width=".7" transform="translate(-.7 -.7)"/>
<path d="M{cx} {cy+7}C{cx-1} {cy+1} {cx+1} {cy-3} {cx} {cy-8}M{cx} {cy-2}c-3-3-6-2-7 0 3 2 5 2 7 0Zm0 3c3-3 6-2 7 0-3 2-5 2-7 0Z" stroke="#C99A89" stroke-width="1" stroke-linecap="round"/></g>''')

    def twine(self, pts):
        d = "M" + "L".join(f"{a:.1f} {b:.1f}" for a, b in pts)
        self.add(f'<path d="{d}" stroke="#A88E6A" stroke-width="1.6" stroke-linecap="round"/><path d="{d}" stroke="#D6C3A0" stroke-width="1.6" stroke-dasharray="1.4 2.2"/>')

    def tag(self, x, y, w, h, rot=0, text="", sub=""):
        hole = f'<circle cx="{x+w/2}" cy="{y+11}" r="3.2" fill="#F1EADB" stroke="{KRAFT_D}"/><circle cx="{x+w/2}" cy="{y+11}" r="5.4" stroke="{KRAFT_D}" stroke-opacity=".7"/>'
        txt = (f'<text x="{x+w/2}" y="{y+h*.58:.1f}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12" fill="#4A3B2A">{text}</text>'
               f'<text x="{x+w/2}" y="{y+h*.58+13:.1f}" text-anchor="middle" font-family="\'Courier New\',monospace" font-size="6.5" letter-spacing=".1em" fill="#6E563D">{sub}</text>')
        d = f"M{x+8} {y}H{x+w-8}L{x+w} {y+8}V{y+h}H{x}V{y+8}Z"
        self.add(f'<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})"><g filter="url(#lift)"><path d="{d}" fill="url(#kraft)"/></g><path d="{d}" fill="#000" filter="url(#grain)"/>{hole}{txt}</g>')

    def script_lines(self, x, y, w, n=4, color=NEWS_INK, op=.45, gap=8):
        """仿手写的草书波线，不含可读文字。"""
        r = self.rnd
        out = []
        for i in range(n):
            yy = y + i * gap
            xx = x
            end = x + w * r.uniform(.6, 1)
            d = f"M{xx:.1f} {yy:.1f}"
            while xx < end:
                step = r.uniform(3, 6)
                d += f"q{step/2:.1f} {r.uniform(-4, -1.5):.1f} {step:.1f} 0"
                if r.random() < .14:
                    d += f"m{r.uniform(3, 6):.1f} 0"
                xx += step
            out.append(f'<path d="{d}" stroke="{color}" stroke-opacity="{op}" stroke-width=".8" stroke-linecap="round"/>')
        self.add("".join(out))


# ====================== 资产 ======================

def collage_tr():
    s = Svg(720, 330, 11)
    s.paper(300, -30, 440, 250, fill="url(#kraft)", rot=-5, rough=(0, 0, 1, 1), amp=4.5)
    s.newsprint(330, -6, 210, 150, rot=-7, cols=3, picture=True)
    s.paper(468, -20, 270, 300, fill="url(#ivory)", rot=4, rough=(0, 0, 1, 1), amp=4)
    s.script_lines(500, 160, 170, n=6, color="#6E563D", op=.4, gap=9)
    s.lace_strip(250, 196, 520, rot=-11)
    s.stamp(612, 22, 50, 60, rot=7, color=SLATE, value="12", motif="rose")
    s.stamp(540, 70, 44, 54, rot=-6, color=RUST, value="5", motif="fern")
    s.postmark(606, 112, rot=-14)
    s.pearls(s.curve((262, 8), (380, 150), (560, 120), (725, 236)), r=3.4)
    s.pearls(s.curve((300, 4), (390, 96), (520, 70), (650, 140)), r=2.4)
    s.fern(560, 300, 430, 150, bend=-26, leaves=13, size=13)
    s.baby_breath(662, 300, s=1.1, rot=-16)
    s.rose(528, 236, s=1.25, rot=-12)
    s.rose(584, 262, s=.85, rot=24, leaf=False)
    s.label(360, 150, 150, 24, "Words &amp; Petals", rot=-8, size=11)
    s.bow(392, 62, s=1.05, rot=-14)
    s.butterfly(300, 150, s=.9, rot=-22)
    s.tape(640, 210, 70, 20, rot=34, color=KRAFT, opacity=.75)
    s.save("garden-collage-tr.svg")


def collage_bl():
    s = Svg(440, 330, 23)
    s.paper(-30, 120, 300, 240, fill="url(#kraft)", rot=6, rough=(1, 1, 0, 0), amp=4)
    s.add('<g transform="translate(0 330)" filter="url(#liftS)"><path d="M0 0V-150A150 150 0 0 1 150 0Z" fill="#FBF8F1" fill-opacity=".95"/>'
          + "".join(f'<path d="M0 0L{150*math.cos(math.radians(-a)):.1f} {150*math.sin(math.radians(-a)):.1f}" stroke="#D8CDB9" stroke-width=".7"/>' for a in range(6, 90, 12))
          + "".join(f'<path d="M{r} 0A{r} {r} 0 0 0 0 -{r}" stroke="#D8CDB9" stroke-width=".8" stroke-dasharray="{2+r/40:.1f} 3"/>' for r in (40, 75, 110, 140))
          + "".join(f'<circle cx="{150*math.cos(math.radians(-a)):.1f}" cy="{150*math.sin(math.radians(-a)):.1f}" r="7" fill="#FBF8F1" stroke="#D8CDB9" stroke-width=".7"/>' for a in range(0, 91, 9))
          + '</g>')
    s.newsprint(110, 150, 170, 130, rot=-9, cols=2)
    s.paper(40, 196, 200, 120, fill="url(#ivory)", rot=-3, rough=(1, 1, 1, 1), amp=2.4,
            inner=''.join(f'<path d="M58 {226+i*14}H222" stroke="#B9C9C6" stroke-width=".7"/>' for i in range(6))
                  + '<path d="M70 206V310" stroke="#C99A89" stroke-opacity=".6" stroke-width=".8"/>'
                  + '<text x="80" y="221" font-family="Georgia,serif" font-style="italic" font-size="12" fill="#4A3B2A" fill-opacity=".8">Little Notes</text>')
    s.script_lines(82, 238, 130, n=5, color="#526A6A", op=.5, gap=14)
    s.stamp(226, 176, 46, 56, rot=9, color="#7E8C6A", value="3", motif="butterfly")
    s.postmark(268, 230, r=22, rot=10, waves=False)
    s.lavender(30, 330, s=1.2, rot=14)
    s.lavender(44, 330, s=1.05, rot=26)
    s.fern(120, 330, 250, 120, bend=24, leaves=12, size=12)
    s.rose(92, 270, s=1.15, rot=18)
    s.twine(s.curve((250, 330), (300, 280), (310, 250), (330, 205)))
    s.tag(300, 140, 78, 96, rot=14, text="Lesson", sub="N° 12 · OCT")
    s.pearls(s.curve((0, 190), (90, 240), (160, 190), (300, 300)), r=3)
    s.bow(36, 176, s=.85, rot=-16)
    s.butterfly(340, 86, s=.75, rot=18, c1="#B9DDE0", c2="#6EA9B7")
    s.save("garden-collage-bl.svg")


def collage_br():
    s = Svg(400, 300, 37)
    s.paper(130, 90, 300, 230, fill="url(#ivory)", rot=-6, rough=(1, 0, 0, 1), amp=3.5)
    # 信封
    s.add('<g transform="rotate(-6 280 205)" filter="url(#lift)"><path d="M150 120H420V300H150Z" fill="#E9DFCB"/><path d="M150 120L285 214 420 120" stroke="#BDA987" stroke-width="1.2" fill="#F2EADA"/></g>')
    s.wax_seal(284, 210, r=19, rot=-8)
    s.newsprint(60, 160, 120, 150, rot=8, cols=2, headline=True)
    s.stamp(330, 132, 46, 56, rot=-8, color=SLATE, value="8", motif="fern")
    s.postmark(300, 142, r=22, rot=-18)
    s.fern(390, 300, 300, 40, bend=-22, leaves=12, size=12)
    s.baby_breath(150, 300, s=1, rot=-8)
    s.rose(196, 262, s=1.05, rot=-30)
    s.pearls(s.curve((90, 300), (180, 210), (300, 270), (400, 180)), r=3.1)
    s.bow(366, 238, s=.8, rot=18)
    s.butterfly(110, 120, s=.8, rot=-14)
    s.save("garden-collage-br.svg")


def hero():
    s = Svg(300, 220, 41)
    s.newsprint(40, 12, 150, 120, rot=-8, cols=2, picture=True)
    s.paper(120, 20, 150, 180, fill="url(#ivory)", rot=5, amp=2.6,
            inner='<rect x="135" y="36" width="120" height="118" fill="#E5EEEA" stroke="#C9BFA9" stroke-width=".8"/>')
    # 植物版画小窗
    s.fern(178, 150, 214, 52, bend=10, leaves=11, size=11)
    s.rose(206, 108, s=.9, rot=-10)
    s.add('<text x="196" y="182" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12" fill="#4A3B2A" transform="rotate(5 196 182)">Today’s Page</text>')
    s.stamp(234, 4, 44, 54, rot=12, color=RUST, value="1", motif="rose")
    s.postmark(250, 60, r=20, rot=-10, waves=False)
    s.lace_strip(70, 199, 220, rot=-3, h=18)
    s.pearls(s.curve((20, 60), (60, 190), (200, 214), (298, 140)), r=3)
    s.tape(150, 10, 64, 18, rot=-10)
    s.label(26, 120, 104, 22, "Daily Lessons", rot=-6, size=10)
    s.bow(98, 50, s=.8, rot=-18)
    s.butterfly(268, 176, s=.6, rot=20)
    s.save("garden-hero.svg")


def rule():
    s = Svg(360, 56, 3)
    s.pearls(s.curve((0, 26), (60, 40), (120, 40), (180, 28)), r=2.6)
    s.pearls(s.curve((180, 28), (240, 40), (300, 40), (362, 26)), r=2.6)
    s.add(f'<path d="M0 22C60 35 120 35 180 24S300 35 360 22" stroke="{HONEY_D}" stroke-opacity=".45" stroke-width=".7"/>')
    for x, flip in ((132, 1), (228, -1)):
        s.add(f'<g transform="translate({x} 34) scale({flip} 1)"><path d="M0 0C-8-9-20-9-24-3-16 2-7 3 0 0Z" fill="{SAGE}" stroke="{FERN_D}" stroke-width=".5"/><path d="M-4 1C-9 8-18 10-22 6-17 1-10-1-4 1Z" fill="{FERN}" stroke="{FERN_D}" stroke-width=".5"/></g>')
    s.bow(180, 22, s=.44)
    for x in (70, 290):
        s.add(f'<circle cx="{x}" cy="38" r="4.2" fill="url(#pearl)" stroke="#B8AD99" stroke-width=".35"/><path d="M{x} 42v5" stroke="{HONEY_D}" stroke-opacity=".5" stroke-width=".6"/><circle cx="{x}" cy="49" r="2.4" fill="url(#pearl)"/>')
    s.save("garden-rule.svg")


def ornament():
    s = Svg(170, 170, 5)
    s.add('<g filter="url(#liftS)"><path d="M0 0H100A100 100 0 0 1 0 100Z" fill="#FBF8F1" fill-opacity=".75"/>'
          + "".join(f'<circle cx="{100*math.cos(math.radians(a)):.1f}" cy="{100*math.sin(math.radians(a)):.1f}" r="6" fill="#FBF8F1" fill-opacity=".85" stroke="#D3C7B2" stroke-width=".6"/>' for a in range(0, 91, 10))
          + "".join(f'<path d="M{r} 0A{r} {r} 0 0 1 0 {r}" stroke="#D3C7B2" stroke-width=".7" stroke-dasharray="2 3"/>' for r in (35, 62, 86))
          + '</g>')
    s.fern(6, 6, 120, 70, bend=-14, leaves=10, size=10)
    s.fern(6, 6, 64, 130, bend=14, leaves=9, size=9)
    s.pearls(s.curve((4, 26), (40, 80), (60, 40), (110, 120)), r=2.5)
    s.rose(28, 28, s=.95, rot=-30, leaf=False)
    s.bow(52, 22, s=.42, rot=-28)
    s.save("garden-ornament.svg")


def photo_mat():
    """立绘相框底：象牙卡纸，带撕边与内阴影。照片窗口位于 x16 y16 w208 h220。"""
    s = Svg(240, 300, 51, attrs='preserveAspectRatio="none"')
    s.paper(10, 18, 226, 280, fill="url(#kraft)", rot=4, amp=3, shadow="lift")
    s.paper(4, 4, 232, 290, fill="url(#ivory)", rot=0, amp=2.4, shadow="lift")
    s.add('<rect x="16" y="16" width="208" height="220" fill="#DCD6C8" stroke="#BDB19A" stroke-width=".8"/>')
    s.save("garden-photo-mat.svg")


def photo_overlay():
    s = Svg(240, 300, 53, attrs='preserveAspectRatio="none"')
    s.add('<rect x="16" y="16" width="208" height="220" stroke="#FBF8F0" stroke-width="3"/>'
          '<rect x="16" y="16" width="208" height="220" stroke="#8E7A55" stroke-opacity=".35" stroke-width=".8"/>')
    s.add('<text x="112" y="262" text-anchor="middle" font-family="Georgia,\'Palatino Linotype\',serif" font-style="italic" font-size="15" fill="#4A3B2A">my study muse</text>'
          '<text x="112" y="279" text-anchor="middle" font-family="\'Courier New\',monospace" font-size="7.5" letter-spacing=".22em" fill="#865C4F">RUBAN · Nº 56 · OCT</text>')
    s.tape(78, -2, 84, 24, rot=-4)
    s.stamp(190, 222, 42, 52, rot=10, color=SLATE, value="56", motif="rose")
    s.postmark(196, 214, r=17, rot=-10, waves=False)
    s.lace_strip(-6, 222, 118, rot=-8, h=18)
    s.pearls(s.curve((0, 196), (24, 236), (60, 250), (104, 238)), r=2.7)
    s.fern(10, 300, 40, 168, bend=-14, leaves=10, size=10)
    s.rose(24, 252, s=.8, rot=-20)
    s.baby_breath(36, 300, s=.75, rot=12)
    s.bow(214, 26, s=.62, rot=24)
    s.butterfly(18, 40, s=.55, rot=-24)
    s.save("garden-photo-overlay.svg")


def tapes():
    for i, (name, color, op, stripes) in enumerate((("garden-tape-teal.svg", TEAL, .6, True), ("garden-tape-kraft.svg", "#D9C6A3", .82, False), ("garden-tape-rose.svg", ROSE_L, .7, True))):
        s = Svg(110, 30, 90 + i)
        s.tape(4, 5, 102, 20, rot=0, color=color, opacity=op, stripes=stripes)
        s.save(name)


def stamps():
    for name, color, value, motif in (("garden-stamp-a.svg", SLATE, "12", "rose"), ("garden-stamp-b.svg", RUST, "5", "fern"), ("garden-stamp-c.svg", "#7E8C6A", "3", "butterfly")):
        s = Svg(56, 66, 7)
        s.stamp(5, 5, 46, 56, rot=0, color=color, value=value, motif=motif)
        s.save(name)


def label():
    s = Svg(300, 54, 61, attrs='preserveAspectRatio="none"')
    s.paper(6, 6, 288, 42, fill="url(#ivory)", rough=(0, 1, 0, 1), amp=3, shadow="liftS")
    s.save("garden-label.svg")


def lace_edge():
    s = Svg(36, 18, 1)
    s.add('<path d="M0 0H36V8C31 8 31 15 27 15S23 8 18 8 13 15 9 15 5 8 0 8Z" fill="#FBF8F1"/>'
          '<path d="M0 8C5 8 5 15 9 15S13 8 18 8 23 15 27 15 31 8 36 8" stroke="#CDBFA6" stroke-width=".8"/>'
          '<circle cx="9" cy="5" r="1.8" stroke="#CDBFA6" stroke-width=".7"/><circle cx="27" cy="5" r="1.8" stroke="#CDBFA6" stroke-width=".7"/>'
          '<circle cx="18" cy="11" r="1" fill="#CDBFA6"/><circle cx="0" cy="11" r="1" fill="#CDBFA6"/><circle cx="36" cy="11" r="1" fill="#CDBFA6"/>'
          '<path d="M0 2.5H36" stroke="#D8CDB9" stroke-width=".6" stroke-dasharray="1.5 1.5"/>')
    s.save("garden-lace-edge.svg")


def ephemera_tile():
    """正文背后极淡的旧信纸底纹：邮戳、草书线和星点。"""
    s = Svg(560, 560, 71)
    s.postmark(90, 110, r=30, rot=-14, color="#6E5E4C")
    s.postmark(420, 380, r=26, rot=12, color="#6E5E4C", waves=False)
    s.script_lines(250, 60, 240, n=7, color="#6E5E4C", op=.22, gap=11)
    s.script_lines(40, 400, 220, n=6, color="#6E5E4C", op=.2, gap=11)
    for x, y in ((300, 250), (520, 150), (180, 520), (60, 300), (480, 520)):
        s.add(f'<path d="m{x} {y-5} 1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5Z" fill="#A88E6A" fill-opacity=".35"/>')
    s.save("garden-ephemera.svg")


def newsprint_tile():
    s = Svg(220, 300, 83)
    s.newsprint(0, 0, 220, 300, cols=3, headline=True)
    s.parts[-1] = s.parts[-1].replace('filter="url(#lift)"', "")
    s.save("garden-newsprint.svg")


if __name__ == "__main__":
    collage_tr(); collage_bl(); collage_br(); hero(); rule(); ornament()
    photo_mat(); photo_overlay(); tapes(); stamps(); label(); lace_edge()
    ephemera_tile(); newsprint_tile()
