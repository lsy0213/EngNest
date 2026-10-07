"""生成「银雾流光」白纸手账主题的原创矢量素材。

配色取自白发角色立绘：珍珠白 #EDEDEF、冷银 #D0D0D2、脸颊粉雾 #EEE4E3；
拼贴材料参考用户给的白色撕纸手账图——揉皱白纸、旧报剪片、尤加利、满天星、洋甘菊、
小黄花、浅蓝蝴蝶、邮票邮戳、横线索引卡、票根、银色长尾夹，以及一张泛着虹彩的光碟（“流光”）。
所有图形都由下面的函数按固定随机种子绘制，重复运行结果一致；通用的撕边、纸胶带、珍珠
沿用 gen_garden_scrapbook.Svg，只把滤镜与材质换成冷白色系。

    python tools/gen_glass_scrapbook.py
"""
import math

import gen_garden_scrapbook as base

OUT = base.OUT

PAPER, PAPER_2 = "#FBFBF9", "#F1F2F0"
SHEET, SHEET_D = "#FAFAF7", "#2A3036"
NEWS, NEWS_INK = "#F0F0EC", "#70757B"
SILVER, SILVER_D = "#C3CAD0", "#8D979F"
SLATE, SLATE_D = "#5B7682", "#3E5560"
EUCA, EUCA_L, EUCA_D = "#A9BEB6", "#D2DFDA", "#71897F"
SAGE, SAGE_D = "#93A57F", "#5F7350"
YELLOW, YELLOW_D = "#E8CE57", "#B99B2C"
AQUA, AQUA_D = "#B6DCE2", "#6E9CA6"
BLUSH, BLUSH_D = "#E9D3D5", "#B88E94"
AMBER = "#D9A24C"

DEFS = """
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="9" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .32  0 0 0 0 .36  0 0 0 0 .4  0 0 0 .1 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.2" dy="3" stdDeviation="2.6" flood-color="#46525C" flood-opacity=".17"/></filter>
<filter id="liftS" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx=".6" dy="1.3" stdDeviation="1.1" flood-color="#46525C" flood-opacity=".2"/></filter>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<radialGradient id="pearl" cx=".36" cy=".32" r=".75"><stop stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F1F3F4"/><stop offset=".85" stop-color="#CDD3D8"/><stop offset="1" stop-color="#B3BBC2"/></radialGradient>
<linearGradient id="satin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".4" stop-color="#EEF1F3"/><stop offset=".75" stop-color="#D3D9DE"/><stop offset="1" stop-color="#BAC2C9"/></linearGradient>
<linearGradient id="satinR" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".4" stop-color="#EEF1F3"/><stop offset=".75" stop-color="#D3D9DE"/><stop offset="1" stop-color="#BAC2C9"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F6F8F9"/><stop offset=".3" stop-color="#B8C0C6"/><stop offset=".55" stop-color="#E6EAED"/><stop offset=".8" stop-color="#8F99A1"/><stop offset="1" stop-color="#C9D0D5"/></linearGradient>
<linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF0EE"/></linearGradient>
<linearGradient id="vellum" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".78"/><stop offset="1" stop-color="#E9EEF1" stop-opacity=".62"/></linearGradient>
<linearGradient id="euca" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#DCE7E3"/><stop offset=".55" stop-color="#ABC1B9"/><stop offset="1" stop-color="#8CA59C"/></linearGradient>
<linearGradient id="sage" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#B9C6A6"/><stop offset=".6" stop-color="#8E9F79"/><stop offset="1" stop-color="#6F8160"/></linearGradient>
<radialGradient id="cdBase" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#F3F6F7"/><stop offset=".7" stop-color="#DCE3E7"/><stop offset=".97" stop-color="#EEF2F4"/><stop offset="1" stop-color="#AEB8BF"/></radialGradient>
<pattern id="lace" width="18" height="24" patternUnits="userSpaceOnUse"><path d="M0 0h18v14c-3 0-3 6-9 6s-6-6-9-6Z" fill="#FFFFFF" fill-opacity=".95"/><path d="M0 14c3 0 3 6 9 6s6-6 9-6" fill="none" stroke="#CBD2D7" stroke-width=".8"/><circle cx="9" cy="6" r="2.6" fill="none" stroke="#C7CED4" stroke-width=".8"/><circle cx="9" cy="6" r=".9" fill="#C7CED4"/><circle cx="0" cy="10" r="1.3" fill="#DDE2E6"/><circle cx="18" cy="10" r="1.3" fill="#DDE2E6"/><circle cx="9" cy="15.5" r="1.1" fill="#DDE2E6"/><path d="M3 2.5h12" stroke="#D3D9DD" stroke-width=".6" stroke-dasharray="1.2 1.4"/></pattern>
<pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v4" stroke="#70757B" stroke-width=".7" stroke-opacity=".5"/></pattern>
<pattern id="tapeStripe" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="#FFFFFF" fill-opacity=".34"/></pattern>
<pattern id="tapeDot" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.3" fill="#7C8790" fill-opacity=".45"/></pattern>
"""


class GSvg(base.Svg):
    def __init__(self, w, h, seed, extra_defs="", attrs=""):
        super().__init__(w, h, seed, extra_defs, attrs)
        self.defs = DEFS + extra_defs

    # ---------- 纸 ----------
    def pearls(self, pts, r=3.1, spacing=None):
        spacing = spacing or r * 2.15
        out, acc = [], 0
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            seg = math.hypot(x1 - x0, y1 - y0)
            t = acc
            while t < seg:
                px, py = x0 + (x1 - x0) * t / seg, y0 + (y1 - y0) * t / seg
                out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r}" fill="url(#pearl)" stroke="#AEB6BD" stroke-width=".35"/>')
                t += spacing
            acc = t - seg
        self.add(f'<g filter="url(#liftS)">{"".join(out)}</g>')

    def newsprint(self, x, y, w, h, rot=0, cols=2, headline=None, picture=False, fill=NEWS):
        """旧报剪片；headline 给出时排一行衬线大标题，其余是灰色字行。"""
        r = self.rnd
        inner, pad = [], 8
        cy0 = y + pad
        if headline:
            inner.append(f'<text x="{x+pad}" y="{cy0+15}" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" font-size="17" fill="#3F444A" fill-opacity=".86" letter-spacing=".01em">{headline}</text>')
            inner.append(f'<rect x="{x+pad}" y="{cy0+20}" width="{w-2*pad}" height=".8" fill="{NEWS_INK}" fill-opacity=".6"/>')
            cy0 += 27
        else:
            inner.append(f'<rect x="{x+pad}" y="{cy0}" width="{w-2*pad}" height="4" fill="{NEWS_INK}" fill-opacity=".62"/>')
            cy0 += 10
        gap = 6
        cw = (w - 2 * pad - gap * (cols - 1)) / cols
        for c in range(cols):
            cx = x + pad + c * (cw + gap)
            yy = cy0
            if picture and c == cols - 1:
                inner.append(f'<rect x="{cx:.1f}" y="{yy}" width="{cw:.1f}" height="{cw*0.8:.1f}" fill="url(#hatch)" stroke="{NEWS_INK}" stroke-opacity=".45" stroke-width=".6"/>')
                yy += cw * 0.8 + 4
            while yy < y + h - pad:
                ln = cw if r.random() > .14 else cw * r.uniform(.3, .8)
                inner.append(f'<rect x="{cx:.1f}" y="{yy:.1f}" width="{ln:.1f}" height="1.2" fill="{NEWS_INK}" fill-opacity=".4"/>')
                yy += 3.6 if r.random() > .08 else 7
        self.paper(x, y, w, h, fill=fill, rot=rot, inner="".join(inner))

    def stamp(self, x, y, w, h, rot=0, color="#8FA3AD", value="12", motif="daisy"):
        mid = self.nid("sm")
        holes, step = [], 5.2
        for i in range(int(w / step) + 1):
            holes.append(f'<circle cx="{x + i*step:.1f}" cy="{y}" r="1.9"/><circle cx="{x + i*step:.1f}" cy="{y+h}" r="1.9"/>')
        for i in range(int(h / step) + 1):
            holes.append(f'<circle cx="{x}" cy="{y + i*step:.1f}" r="1.9"/><circle cx="{x+w}" cy="{y + i*step:.1f}" r="1.9"/>')
        mx, my = x + w / 2, y + h * .47
        ink = "#F6F8F8"
        if motif == "daisy":
            petals = "".join(f'<ellipse cx="{mx}" cy="{my-w*.13:.1f}" rx="1.7" ry="{w*.1:.1f}" transform="rotate({a} {mx} {my})"/>' for a in range(0, 360, 30))
            art = f'<g fill="none" stroke="{ink}" stroke-width=".7">{petals}<circle cx="{mx}" cy="{my}" r="{w*.06:.1f}" fill="{ink}"/><path d="M{mx} {my+w*.09:.1f}C{mx+1} {my+h*.2:.1f} {mx-2} {my+h*.28:.1f} {mx} {my+h*.34:.1f}"/></g>'
        elif motif == "leaf":
            art = (f'<g stroke="{ink}" stroke-width=".8" stroke-linecap="round"><path d="M{mx} {my+h*.3:.1f}C{mx-1} {my} {mx+2} {my-h*.15:.1f} {mx} {my-h*.27:.1f}"/>'
                   + "".join(f'<ellipse cx="{mx+(5 if i%2 else -5)}" cy="{my-h*.18+i*h*.1:.1f}" rx="4.4" ry="2.6" fill="none" transform="rotate({-25 if i%2 else 25} {mx+(5 if i%2 else -5)} {my-h*.18+i*h*.1:.1f})"/>' for i in range(5)) + "</g>")
        else:
            art = (f'<g stroke="{ink}" stroke-width=".8" fill="none"><path d="M{mx} {my-6}v12M{mx} {my-2}c-4-8-12-8-11-1 1 5 7 5 11 1Zm0 0c4-8 12-8 11-1-1 5-7 5-11 1Zm0 2c-3 4-9 7-9 3s5-4 9-3Zm0 0c3 4 9 7 9 3s-5-4-9-3Z"/></g>')
        self.add(f'''<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})" filter="url(#liftS)"><mask id="{mid}"><rect x="{x-3}" y="{y-3}" width="{w+6}" height="{h+6}" fill="#fff"/><g fill="#000">{"".join(holes)}</g></mask>
<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#FAFAF8" mask="url(#{mid})"/>
<rect x="{x+3.5}" y="{y+3.5}" width="{w-7}" height="{h-7}" fill="{color}"/>
<rect x="{x+5.5}" y="{y+5.5}" width="{w-11}" height="{h-11}" stroke="{ink}" stroke-opacity=".7" stroke-width=".6"/>
{art}<text x="{x+7}" y="{y+13}" font-family="Georgia,serif" font-size="7" font-weight="700" fill="{ink}">{value}</text>
<text x="{x+w/2}" y="{y+h-7.5}" text-anchor="middle" font-family="Georgia,serif" font-size="4.6" letter-spacing=".12em" fill="{ink}">ENGNEST</text>
<rect x="{x+3.5}" y="{y+3.5}" width="{w-7}" height="{h-7}" fill="#000" filter="url(#grain)"/></g>''')

    # ---------- 花叶 ----------
    def eucalyptus(self, x0, y0, x1, y1, bend=16, pairs=7, size=14, op=.95):
        """尤加利：成对的圆叶，叶面带一层灰白粉霜。"""
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy)
        ctrl = (mx - dy / L * bend, my + dx / L * bend)
        pts = self.curve((x0, y0), ctrl, (x1, y1), n=pairs * 4)
        out = [f'<path d="M{x0} {y0}Q{ctrl[0]:.1f} {ctrl[1]:.1f} {x1} {y1}" stroke="#8C8F7E" stroke-width="1.1" stroke-linecap="round"/>']
        for k in range(pairs):
            i = 2 + k * 4
            (ax, ay), (bx, by) = pts[i - 1], pts[i + 1]
            ang = math.degrees(math.atan2(by - ay, bx - ax))
            px, py = pts[i]
            sz = size * (1 - k / (pairs * 1.8))
            for side in (-1, 1):
                a = ang + side * (62 + self.rnd.uniform(-10, 10))
                out.append(f'<g transform="translate({px:.1f} {py:.1f}) rotate({a:.0f})"><path d="M0 0C{sz*.15:.1f} {-sz*.5:.1f} {sz*.85:.1f} {-sz*.6:.1f} {sz:.1f} 0 {sz*.85:.1f} {sz*.6:.1f} {sz*.15:.1f} {sz*.5:.1f} 0 0Z" fill="url(#euca)" stroke="{EUCA_D}" stroke-width=".45"/>'
                           f'<path d="M1 0H{sz*.86:.1f}" stroke="{EUCA_D}" stroke-opacity=".45" stroke-width=".45"/></g>')
        self.add(f'<g filter="url(#liftS)" opacity="{op}">{"".join(out)}</g>')

    def big_leaf(self, cx, cy, ln=60, wd=22, rot=0, fill="url(#sage)", edge=SAGE_D):
        """尖卵形大叶，参考图里的灰绿叶片。"""
        h = wd / 2
        veins = "".join(f'<path d="M{ln*t:.1f} 0Q{ln*t+ln*.08:.1f} {-h*.5:.1f} {ln*t+ln*.14:.1f} {-h*.78*(1-t*.6):.1f}M{ln*t:.1f} 0Q{ln*t+ln*.08:.1f} {h*.5:.1f} {ln*t+ln*.14:.1f} {h*.78*(1-t*.6):.1f}"/>' for t in (.18, .36, .54, .7))
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot})" filter="url(#liftS)">
<path d="M0 0C{ln*.2:.1f} {-h*1.2:.1f} {ln*.7:.1f} {-h:.1f} {ln} 0 {ln*.7:.1f} {h:.1f} {ln*.2:.1f} {h*1.2:.1f} 0 0Z" fill="{fill}" stroke="{edge}" stroke-width=".6"/>
<path d="M0 0C{ln*.3:.1f} -1 {ln*.6:.1f} 0 {ln*.94:.1f} 0" stroke="{edge}" stroke-opacity=".6" stroke-width=".7"/>
<g stroke="{edge}" stroke-opacity=".32" stroke-width=".5">{veins}</g>
<path d="M{ln*.12:.1f} {-h*.55:.1f}C{ln*.35:.1f} {-h*.95:.1f} {ln*.6:.1f} {-h*.8:.1f} {ln*.8:.1f} {-h*.35:.1f}" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1"/></g>''')

    def stem(self, pts, color="#8E957E", w=1.1):
        d = "M" + "L".join(f"{a:.1f} {b:.1f}" for a, b in pts)
        self.add(f'<path d="{d}" stroke="{color}" stroke-width="{w}" stroke-linecap="round" fill="none"/>')

    def daisy(self, cx, cy, r=9, rot=0, tilt=1.0):
        """洋甘菊：白色细瓣与金黄色圆心；tilt<1 表示侧倾。"""
        petals = []
        for i in range(16):
            a = i * 22.5 + self.rnd.uniform(-5, 5)
            ln = r * self.rnd.uniform(.88, 1.05)
            petals.append(f'<ellipse cx="0" cy="{-ln*.55:.1f}" rx="{r*.17:.1f}" ry="{ln*.5:.1f}" transform="rotate({a:.0f})" fill="#FFFFFF" stroke="#CDD2D0" stroke-width=".45"/>')
        dots = "".join(f'<circle cx="{self.rnd.uniform(-r*.25, r*.25):.1f}" cy="{self.rnd.uniform(-r*.25, r*.25):.1f}" r=".55" fill="#B88F22" fill-opacity=".7"/>' for _ in range(7))
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale(1 {tilt})" filter="url(#liftS)">{"".join(petals)}
<circle r="{r*.36:.1f}" fill="#EBC94F" stroke="#C9A332" stroke-width=".5"/><circle cx="{-r*.1:.1f}" cy="{-r*.12:.1f}" r="{r*.15:.1f}" fill="#F6E294"/>{dots}</g>''')

    def daisy_sprig(self, x, y, h=90, rot=0, heads=2, r=8):
        """带茎与细裂叶的洋甘菊小枝。"""
        rr = self.rnd
        top = (x + rr.uniform(-8, 8), y - h)
        pts = self.curve((x, y), (x + rr.uniform(-14, 14), y - h * .5), top, n=24)
        self.stem(pts, "#8C9878", 1)
        for t in (.3, .5, .68):
            px, py = pts[int(t * 24)]
            side = 1 if rr.random() > .5 else -1
            leaf = "".join(f'<path d="M0 0l{side*(5+i*2)} {-3-i*2}" />' for i in range(3))
            self.add(f'<g transform="translate({px:.1f} {py:.1f})" stroke="#93A27E" stroke-width=".9" stroke-linecap="round">{leaf}<path d="M0 0l{side*10} -9"/></g>')
        self.daisy(top[0], top[1], r=r, rot=rot, tilt=rr.uniform(.75, 1))
        for k in range(1, heads):
            bx, by = pts[int(24 * (.55 - k * .1))]
            ex, ey = bx + (k % 2 * 2 - 1) * rr.uniform(14, 22), by - rr.uniform(18, 28)
            self.stem([(bx, by), (ex, ey)], "#8C9878", .8)
            self.daisy(ex, ey, r=r * .75, rot=rot + 20, tilt=rr.uniform(.6, .95))

    def yellow_cluster(self, x, y, s=1.0, rot=0, heads=5, h=90):
        """小黄花：分叉的细茎顶着平顶小花团。"""
        rr = self.rnd
        out = [f'<path d="M0 0C-2 {-h*.35:.1f} 2 {-h*.6:.1f} 0 {-h*.72:.1f}" stroke="#8E9A62" stroke-width="1.1"/>']
        for k in range(heads):
            bx, by = rr.uniform(-2, 2), -h * rr.uniform(.4, .72)
            ex, ey = bx + rr.uniform(-28, 28), -h * rr.uniform(.82, 1.05)
            out.append(f'<path d="M{bx:.1f} {by:.1f}Q{(bx+ex)/2:.1f} {by-8:.1f} {ex:.1f} {ey:.1f}" stroke="#9AA46C" stroke-width=".7"/>')
            for _ in range(rr.randint(5, 9)):
                fx, fy = ex + rr.uniform(-7, 7), ey + rr.uniform(-4, 3)
                fr = rr.uniform(1.6, 2.6)
                out.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{fr:.1f}" fill="{YELLOW}" stroke="{YELLOW_D}" stroke-width=".4"/>'
                           f'<circle cx="{fx-fr*.3:.1f}" cy="{fy-fr*.3:.1f}" r="{fr*.35:.1f}" fill="#FBEFA8"/>')
        self.add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#liftS)">{"".join(out)}</g>')

    def baby_breath(self, x, y, s=1.0, rot=0, n=16):
        rr = self.rnd
        out = ['<path d="M0 0C-2 -20 2 -40 0 -62" stroke="#9AA295" stroke-width="1"/>']
        for _ in range(n):
            ang = rr.uniform(-150, -30)
            ln = rr.uniform(14, 34)
            bx, by = 0, -rr.uniform(18, 50)
            ex, ey = bx + math.cos(math.radians(ang)) * ln, by + math.sin(math.radians(ang)) * ln
            out.append(f'<path d="M{bx:.1f} {by:.1f}L{ex:.1f} {ey:.1f}" stroke="#AAB1A6" stroke-width=".55"/>')
            for _k in range(rr.randint(1, 3)):
                fx, fy = ex + rr.uniform(-4, 4), ey + rr.uniform(-4, 4)
                out.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{rr.uniform(1.4, 2.3):.1f}" fill="#FFFFFF" stroke="#C8CDCF" stroke-width=".45"/>')
        self.add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#liftS)">{"".join(out)}</g>')

    def butterfly(self, cx, cy, s=1.0, rot=0, kind="aqua", op=1):
        """aqua 浅蓝粉蝶；amber 黄褐蛱蝶；ink 黑边白蝶。"""
        gid = self.nid("bf")
        c1, c2, edge, vein, border = {
            "aqua": ("#E4F4F5", "#A7D2D9", "#6D98A2", "#6D98A2", None),
            "amber": ("#F3D387", "#CF8E3A", "#3E3128", "#3E3128", "#3E3128"),
            "ink": ("#FFFFFF", "#ECEEEE", "#2E2F31", "#2E2F31", "#2E2F31"),
        }[kind]
        wings = ('<path d="M-1-2C-8-19-27-25-31-15-34-6-20 2-2 1Z"/><path d="M1-2C8-19 27-25 31-15 34-6 20 2 2 1Z"/>'
                 '<path d="M-1 1C-14 3-22 11-18 18-13 23-5 14-1 3Z"/><path d="M1 1C14 3 22 11 18 18 13 23 5 14 1 3Z"/>')
        rim = ""
        if border:
            rim = (f'<g stroke="{border}" stroke-width="1.7" fill="none" stroke-linejoin="round">{wings}</g>'
                   + "".join(f'<circle cx="{sx*x:.1f}" cy="{y:.1f}" r=".75" fill="#FFFFFF"/>' for sx in (-1, 1) for x, y in ((29, -16), (31, -11), (26, -21), (19, 17), (15, 20))))
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#liftS)" opacity="{op}"><defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<g fill="url(#{gid})" stroke="{edge}" stroke-width=".65">{wings}</g>{rim}
<path d="M-2-1C-10-8-18-14-26-15M-2 0C-12-4-20-5-27-8M-2 2C-9 7-14 12-16 17M2-1C10-8 18-14 26-15M2 0C12-4 20-5 27-8M2 2C9 7 14 12 16 17" stroke="{vein}" stroke-opacity=".42" stroke-width=".5"/>
<ellipse cx="0" cy="1" rx="1.5" ry="8" fill="#3A3D40"/><path d="M-1-6C-3-11-6-13-8-14M1-6C3-11 6-13 8-14" stroke="#3A3D40" stroke-width=".55"/></g>''')

    # ---------- 小物 ----------
    def cd(self, cx, cy, r=60, rot=0, text="LUMIÈRE · SILVER MIST · ENGNEST"):
        """光碟：虹彩扇面柔化后叠在银白底上，就是主题名里的“流光”。"""
        mid, tid = self.nid("cd"), self.nid("cdt")
        # 只在两道对角反光里出现彩虹，其余是银白底，像真光碟斜着接住光
        hues = ("#F6C6D2", "#F3E7A6", "#BEE7E3", "#C3D3F2", "#DCC8EE")
        wedges = []
        for base_a in (-40, 140):
            for i, c in enumerate(hues):
                a0, a1 = math.radians(base_a + i * 13), math.radians(base_a + i * 13 + 16)
                wedges.append(f'<path d="M0 0L{r*math.cos(a0):.1f} {r*math.sin(a0):.1f}A{r} {r} 0 0 1 {r*math.cos(a1):.1f} {r*math.sin(a1):.1f}Z" fill="{c}" fill-opacity=".8"/>')
        rings = "".join(f'<circle r="{r*k:.1f}" stroke="#FFFFFF" stroke-opacity=".5" stroke-width=".6"/>' for k in (.48, .6, .72, .84, .94))
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot})"><mask id="{mid}"><circle r="{r}" fill="#fff"/><circle r="{r*.11:.1f}" fill="#000"/></mask>
<g filter="url(#lift)"><g mask="url(#{mid})"><circle r="{r}" fill="url(#cdBase)"/><g filter="url(#soft)">{"".join(wedges)}</g>{rings}
<path d="M0 0L{r*.98:.1f} {-r*.2:.1f}A{r} {r} 0 0 1 {r*.88:.1f} {r*.45:.1f}Z" fill="#FFFFFF" fill-opacity=".38"/>
<path d="M0 0L{-r*.98:.1f} {r*.2:.1f}A{r} {r} 0 0 1 {-r*.88:.1f} {-r*.45:.1f}Z" fill="#FFFFFF" fill-opacity=".3"/>
<circle r="{r*.38:.1f}" fill="#F3F5F6" fill-opacity=".86" stroke="#C9D0D5" stroke-width=".7"/><circle r="{r*.24:.1f}" fill="#E7ECEF" stroke="#B6BFC5" stroke-width=".6"/>
<circle r="{r-.6:.1f}" stroke="#A9B3BA" stroke-width="1"/></g></g>
<path id="{tid}" d="M{-r*.31:.1f} 0A{r*.31:.1f} {r*.31:.1f} 0 1 1 {r*.31:.1f} 0" fill="none"/>
<text font-family="'Courier New',monospace" font-size="{r*.07:.1f}" letter-spacing=".12em" fill="#6F7A82"><textPath href="#{tid}" startOffset="50%" text-anchor="middle">{text}</textPath></text></g>''')

    def binder_clip(self, cx, cy, s=1.0, rot=0):
        """银色长尾夹：扁梯形夹身，两根钢丝把手向上折起。"""
        wire = "M-13 3V-12C-13-19-9-22-5-22H5C9-22 13-19 13-12V3"
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#lift)">
<path d="{wire}" stroke="#87919A" stroke-width="2" fill="none" transform="translate(-2 1)"/><path d="{wire}" stroke="#E9EDF0" stroke-width=".8" fill="none" transform="translate(-2.4 .6)"/>
<path d="{wire}" stroke="#87919A" stroke-width="2" fill="none" transform="translate(2 -1)"/><path d="{wire}" stroke="#F4F6F8" stroke-width=".8" fill="none" transform="translate(1.6 -1.4)"/>
<path d="M-20 1H20L16 13H-16Z" fill="url(#metal)" stroke="#78838B" stroke-width=".8"/>
<path d="M-19 3H19" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="1"/><path d="M-16 11H16" stroke="#6E777E" stroke-opacity=".45" stroke-width=".8"/>
<path d="M-20 1C-22 1-23 3-21 4M20 1C22 1 23 3 21 4" stroke="#78838B" stroke-width="1.2" fill="none"/></g>''')

    def paper_clip(self, x, y, s=1.0, rot=0):
        d = "M4 46V8a6 6 0 0 1 12 0v40a9 9 0 0 1-18 0V14"
        self.add(f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" filter="url(#liftS)" fill="none" stroke-linecap="round">'
                 f'<path d="{d}" stroke="#8E979E" stroke-width="2.2"/><path d="{d}" stroke="#F3F6F7" stroke-width=".8" transform="translate(-.4 -.4)"/></g>')

    def bow(self, cx, cy, s=1.0, rot=0):
        """白缎蝴蝶结，银灰阴影。"""
        e = "#99A3AB"
        self.add(f'''<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" filter="url(#lift)" stroke-linejoin="round">
<path d="M-4 4C-10 20-17 34-27 47l11-2 3 11C-5 40-1 22 2 6Z" fill="url(#satin)" stroke="{e}" stroke-width=".8"/>
<path d="M4 4C11 19 19 31 30 42l-11 0-1 11C10 37 4 21-1 6Z" fill="url(#satinR)" stroke="{e}" stroke-width=".8"/>
<path d="M-2-1C-12-20-38-31-45-15-50-2-30 9-2 3Z" fill="url(#satin)" stroke="{e}" stroke-width=".8"/>
<path d="M2-1C13-20 39-29 45-12 49 1 28 10 2 3Z" fill="url(#satinR)" stroke="{e}" stroke-width=".8"/>
<path d="M-4-1C-15-10-30-14-37-9-30-5-17-2-4 1Z" fill="#AEB7BE" fill-opacity=".4"/>
<path d="M4-1C15-10 30-13 37-7 30-4 17-1 4 1Z" fill="#AEB7BE" fill-opacity=".4"/>
<path d="M-40-14C-33-24-20-22-11-14M14-14C24-22 36-21 41-11M-9 12C-13 24-18 33-22 41M9 12C14 22 20 30 25 37" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
<ellipse cx="0" cy="1" rx="7.5" ry="8.5" fill="#EEF1F3" stroke="{e}" stroke-width=".8"/>
<circle cx="0" cy="1" r="3" fill="url(#pearl)"/></g>''')

    def wax_seal(self, cx, cy, r=15, rot=0):
        rr = self.rnd
        pts = []
        for i in range(28):
            a = i / 28 * math.tau
            k = r * (1 + rr.uniform(-.06, .1))
            pts.append(f"{cx+math.cos(a)*k:.1f} {cy+math.sin(a)*k:.1f}")
        self.add(f'''<g transform="rotate({rot} {cx} {cy})" filter="url(#lift)"><path d="M{"L".join(pts)}Z" fill="#D8B8BC"/>
<circle cx="{cx}" cy="{cy}" r="{r*.68:.1f}" fill="#CFAAAF" stroke="#B48E93" stroke-width="1"/>
<circle cx="{cx}" cy="{cy}" r="{r*.68:.1f}" stroke="#F1DDE0" stroke-opacity=".7" stroke-width=".7" transform="translate(-.7 -.7)"/>
<path d="M{cx} {cy+6}V{cy-6}M{cx} {cy-1}c-3-5-9-5-8 0 1 3 5 3 8 0Zm0 0c3-5 9-5 8 0-1 3-5 3-8 0Z" stroke="#F3E3E5" stroke-width=".9" stroke-linecap="round" fill="none"/></g>''')

    def index_card(self, x, y, w, h, rot=0, title="WORD LIST", no="Nº 07"):
        lines = "".join(f'<path d="M{x+6} {y+30+i*11}H{x+w-6}" stroke="#C5D5DE" stroke-width=".7"/>' for i in range(int((h - 36) / 11)))
        inner = (f'<path d="M{x+6} {y+24}H{x+w-6}M{x+6} {y+26.5}H{x+w-6}" stroke="#D3AEB3" stroke-width=".7"/>{lines}'
                 f'<text x="{x+10}" y="{y+17}" font-family="\'Courier New\',monospace" font-size="9" font-weight="700" letter-spacing=".08em" fill="#4E565D">{title}</text>'
                 f'<text x="{x+w-10}" y="{y+17}" text-anchor="end" font-family="\'Courier New\',monospace" font-size="7.5" fill="#7A838A">{no}</text>')
        self.paper(x, y, w, h, fill="#FFFFFF", rot=rot, rough=(0, 0, 0, 0), amp=0, deckle=False, shadow="lift", inner=inner)

    def ticket(self, x, y, w, h, rot=0, text="ADMIT ONE", sub="LESSON · 01"):
        mid = self.nid("tk")
        self.add(f'''<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})"><mask id="{mid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#fff"/><circle cx="{x}" cy="{y+h/2}" r="6" fill="#000"/><circle cx="{x+w}" cy="{y+h/2}" r="6" fill="#000"/></mask>
<g filter="url(#liftS)"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#F5F4EF" mask="url(#{mid})"/></g>
<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#000" filter="url(#grain)" mask="url(#{mid})"/>
<rect x="{x+5}" y="{y+5}" width="{w-10}" height="{h-10}" stroke="#9AA4AB" stroke-width=".6" stroke-dasharray="2 1.6"/>
<path d="M{x+w*.72:.1f} {y+4}V{y+h-4}" stroke="#9AA4AB" stroke-width=".8" stroke-dasharray="1.5 2"/>
<text x="{x+w*.36:.1f}" y="{y+h*.48:.1f}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" letter-spacing=".14em" fill="#4D565E">{text}</text>
<text x="{x+w*.36:.1f}" y="{y+h*.48+11:.1f}" text-anchor="middle" font-family="'Courier New',monospace" font-size="6.5" letter-spacing=".16em" fill="#7A838A">{sub}</text>
<text x="{x+w*.86:.1f}" y="{y+h*.6:.1f}" text-anchor="middle" font-family="'Courier New',monospace" font-size="9" font-weight="700" fill="#B48E93" transform="rotate(-90 {x+w*.86:.1f} {y+h*.55:.1f})">0718</text></g>''')

    def vellum(self, x, y, w, h, rot=0):
        """半透明硫酸纸，压在拼贴上方。"""
        d = self.torn_path(x, y, w, h, (1, 0, 1, 0), amp=2.2)
        self.add(f'<g transform="rotate({rot} {x+w/2:.0f} {y+h/2:.0f})"><path d="{d}" fill="url(#vellum)" stroke="#FFFFFF" stroke-opacity=".9" stroke-width=".8"/></g>')

    def specks(self, w, h, n=40, color="#3E4348"):
        """白纸上散落的细小纸屑与灰点。"""
        rr = self.rnd
        out = []
        for _ in range(n):
            x, y = rr.uniform(0, w), rr.uniform(0, h)
            pts = []
            k = rr.uniform(.6, 1.8)
            for i in range(6):
                a = i / 6 * math.tau + rr.uniform(-.3, .3)
                pts.append(f"{x+math.cos(a)*k*rr.uniform(.5, 1.4):.1f} {y+math.sin(a)*k*rr.uniform(.5, 1.4):.1f}")
            out.append(f'<path d="M{"L".join(pts)}Z" fill="{color}" fill-opacity="{rr.uniform(.18, .45):.2f}"/>')
        self.add("".join(out))


# ====================== 资产 ======================

def periodic_noise(rnd, n, amp, smooth=3):
    raw = [rnd.uniform(-1, 1) for _ in range(n)]
    for _ in range(smooth):
        raw = [(raw[i - 1] + raw[i] * 2 + raw[(i + 1) % n]) / 4 for i in range(n)]
    peak = max(abs(v) for v in raw) or 1
    return [v / peak * amp for v in raw]


def sheet(dark=False):
    """整页撕边白纸，九宫格 border-image 用：四边中段按 308px 周期平铺，接缝处的撕口对得上。"""
    S, E, P = 360, 26, 308          # 尺寸、切片宽度、周期
    s = GSvg(S, S, 101, attrs=f'width="{S}" height="{S}"')
    rnd = s.rnd
    step = 4
    n = P // step
    edges = [periodic_noise(rnd, n, 3.4) for _ in range(4)]

    def f(edge, pos):
        i = int(round((pos - E) / step)) % n
        return edges[edge][i]

    inset = 11
    pts = []
    for x in range(inset, S - inset + 1, step):                 # 上
        pts.append((x, inset + f(0, x)))
    for y in range(inset, S - inset + 1, step):                 # 右
        pts.append((S - inset + f(1, y), y))
    for x in range(S - inset, inset - 1, -step):                # 下
        pts.append((x, S - inset + f(2, x)))
    for y in range(S - inset, inset - 1, -step):                # 左
        pts.append((inset + f(3, y), y))
    d = "M" + "L".join(f"{a:.1f} {b:.1f}" for a, b in pts) + "Z"
    fill = SHEET_D if dark else SHEET
    fiber = "#5D6872" if dark else "#FFFFFF"
    shadow = "#000000" if dark else "#3E4A55"
    op = ".45" if dark else ".16"
    s.defs += (f'<filter id="sheetShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2.6" stdDeviation="3.2" flood-color="{shadow}" flood-opacity="{op}"/></filter>')
    s.add(f'<path d="{d}" fill="{fill}" filter="url(#sheetShadow)"/>'
          f'<path d="{d}" stroke="{fiber}" stroke-opacity=".7" stroke-width="1.4" transform="translate(-.5 -.7)"/>'
          f'<rect x="{E}" y="{E}" width="{S-2*E}" height="{S-2*E}" fill="{fill}"/>')
    s.save("glass-sheet-dark.svg" if dark else "glass-sheet.svg")


def crumple(dark=False):
    """揉皱白纸的底纹：湍流噪声打上斜向漫射光，得到折痕和起伏。"""
    s = GSvg(420, 420, 7)
    base_c = "#20252A" if dark else "#F0F1F0"
    light = "#C9D2DA" if dark else "#FFFFFF"
    s.defs += ('<filter id="crumple" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
               '<feTurbulence type="turbulence" baseFrequency=".0095 .012" numOctaves="3" seed="12" stitchTiles="stitch" result="n"/>'
               f'<feDiffuseLighting in="n" lighting-color="{light}" surfaceScale="2.4" diffuseConstant="1"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>'
               '<feComponentTransfer><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>')
    s.add(f'<rect width="420" height="420" fill="{base_c}"/>'
          f'<rect width="420" height="420" filter="url(#crumple)" opacity="{".16" if dark else ".26"}" style="mix-blend-mode:{"screen" if dark else "multiply"}"/>')
    s.save("glass-crumple-dark.svg" if dark else "glass-crumple.svg")


def ephemera_tile():
    """背景散点：纸屑、淡灰蝴蝶剪影与邮戳，极淡。"""
    s = GSvg(620, 620, 73)
    s.specks(620, 620, n=46)
    s.postmark(120, 470, r=28, rot=-12, color="#6E7880")
    s.script_lines(330, 90, 220, n=6, color="#6E7880", op=.18, gap=11)
    for cx, cy, sc, rot in ((470, 300, .9, -18), (90, 160, .7, 24), (300, 560, .55, 8)):
        s.add(f'<g transform="translate({cx} {cy}) rotate({rot}) scale({sc})" fill="#9AA2A8" fill-opacity=".22" stroke="#8B949B" stroke-opacity=".3" stroke-width=".6">'
              '<path d="M-1-2C-8-19-27-25-31-15-34-6-20 2-2 1Z"/><path d="M1-2C8-19 27-25 31-15 34-6 20 2 2 1Z"/>'
              '<path d="M-1 1C-14 3-22 11-18 18-13 23-5 14-1 3Z"/><path d="M1 1C14 3 22 11 18 18 13 23 5 14 1 3Z"/></g>')
    s.save("glass-ephemera.svg")


def collage_top():
    """顶部花环：横贯页顶的旧报撕条、尤加利长枝、纸胶带与一只浅蓝蝶。"""
    s = GSvg(1000, 120, 13)
    s.newsprint(520, -40, 300, 104, rot=-2, cols=4)
    s.paper(760, -30, 260, 120, fill="url(#ivory)", rot=3, rough=(0, 0, 1, 1), amp=3.5)
    s.script_lines(790, 30, 170, n=5, color="#6E7880", op=.38, gap=9)
    s.newsprint(250, -34, 210, 84, rot=2, cols=3, picture=True)
    s.vellum(420, -10, 160, 70, rot=-4)
    s.eucalyptus(1004, 8, 600, 74, bend=-20, pairs=9, size=15)
    s.eucalyptus(700, 20, 430, 70, bend=14, pairs=6, size=12, op=.85)
    s.stamp(900, 10, 44, 54, rot=8, color="#8FA3AD", value="20", motif="daisy")
    s.postmark(888, 70, r=20, rot=-14, waves=False, color="#5E6A73")
    s.tape(470, 30, 72, 18, rot=-8, color=AQUA, opacity=.6)
    s.pearls(s.curve((140, 4), (300, 60), (520, 30), (700, 82)), r=2.6)
    s.butterfly(332, 70, s=.62, rot=-18, kind="aqua")
    s.daisy(612, 74, r=7, rot=10)
    s.save("glass-collage-top.svg")


def collage_br():
    """右下：横线索引卡、票根、小黄花、灰绿大叶与黄褐蛱蝶。"""
    s = GSvg(420, 340, 37)
    s.paper(170, 120, 290, 260, fill="url(#ivory)", rot=-5, rough=(1, 0, 0, 1), amp=3.6)
    s.index_card(214, 150, 190, 120, rot=-4, title="WORD LIST", no="Nº 07")
    s.ticket(150, 262, 150, 54, rot=7, text="ADMIT ONE", sub="SILVER · 01")
    s.stamp(352, 118, 44, 54, rot=9, color="#A7B5A2", value="5", motif="leaf")
    s.postmark(338, 132, r=20, rot=-18, color="#5E6A73")
    s.binder_clip(300, 154, s=.9, rot=-4)
    s.big_leaf(400, 340, ln=96, wd=34, rot=-112)
    s.big_leaf(380, 340, ln=74, wd=26, rot=-138)
    s.big_leaf(410, 300, ln=60, wd=22, rot=-160)
    s.yellow_cluster(330, 340, s=1.1, rot=-8, heads=6, h=110)
    s.yellow_cluster(372, 340, s=.85, rot=12, heads=4, h=100)
    s.daisy_sprig(268, 340, h=96, rot=-10, heads=2, r=9)
    s.baby_breath(240, 340, s=.9, rot=-16)
    s.butterfly(214, 128, s=.9, rot=-14, kind="amber")
    s.save("glass-collage-br.svg")


def page_foot():
    """白纸左下角的花束：光碟、旧报标题剪片、满天星、洋甘菊、小黄花和尤加利。"""
    s = GSvg(360, 200, 59)
    s.cd(110, 112, r=56, rot=-12)
    s.tape(122, 70, 58, 18, rot=-38, color="#DDE3E7", opacity=.75, stripes=False)
    s.newsprint(150, 96, 150, 120, rot=-4, cols=2, headline="Lumière")
    s.eucalyptus(30, 205, 90, 40, bend=14, pairs=7, size=14)
    s.big_leaf(60, 205, ln=74, wd=26, rot=-70)
    s.big_leaf(78, 205, ln=60, wd=22, rot=-112)
    s.baby_breath(36, 200, s=1.25, rot=-10, n=20)
    s.yellow_cluster(54, 200, s=1.05, rot=6, heads=5, h=120)
    s.daisy_sprig(108, 200, h=74, rot=8, heads=2, r=8.5)
    s.yellow_cluster(292, 200, s=.8, rot=14, heads=4, h=80)
    s.butterfly(258, 64, s=.9, rot=16, kind="aqua")
    s.save("glass-page-foot.svg")


def page_corner():
    """白纸右上角：一角旧报、一截尤加利与邮票。"""
    s = GSvg(200, 140, 61)
    s.newsprint(70, -10, 150, 92, rot=6, cols=3)
    s.stamp(132, 42, 40, 50, rot=-8, color="#C4A7AA", value="2", motif="butterfly")
    s.eucalyptus(204, 6, 70, 120, bend=-16, pairs=6, size=13)
    s.pearls(s.curve((60, 2), (100, 40), (140, 50), (205, 70)), r=2.3)
    s.save("glass-page-corner.svg")


def hero():
    """首页横幅右侧：贴在白纸上的压花卡、光碟、邮票和蝴蝶。"""
    s = GSvg(300, 220, 41)
    s.cd(78, 126, r=62, rot=10)
    s.paper(120, 14, 150, 188, fill="url(#ivory)", rot=4, amp=2.6,
            inner='<rect x="134" y="30" width="122" height="120" fill="#EEF2F3" stroke="#CBD2D7" stroke-width=".8"/>')
    s.daisy_sprig(186, 146, h=92, rot=-6, heads=3, r=8)
    s.eucalyptus(214, 148, 236, 50, bend=8, pairs=5, size=10)
    s.add('<text x="196" y="178" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="12.5" fill="#4E565D" transform="rotate(4 196 178)">Silver Notes</text>'
          '<text x="196" y="190" text-anchor="middle" font-family="\'Courier New\',monospace" font-size="6.5" letter-spacing=".2em" fill="#9A8387" transform="rotate(4 196 190)">PRESSED · Nº 01</text>')
    s.stamp(242, 2, 42, 52, rot=12, color="#8FA3AD", value="1", motif="daisy")
    s.postmark(258, 58, r=19, rot=-10, waves=False, color="#5E6A73")
    s.tape(158, 6, 64, 18, rot=-9, color=AQUA, opacity=.6)
    s.pearls(s.curve((14, 40), (30, 190), (180, 214), (298, 160)), r=2.8)
    s.butterfly(36, 44, s=.75, rot=-20, kind="aqua")
    s.butterfly(276, 184, s=.42, rot=24, kind="ink")
    s.save("glass-hero.svg")


def rule():
    s = GSvg(360, 56, 3)
    s.add('<path d="M10 30H162M198 30H350" stroke="#AEB7BE" stroke-width=".7"/>'
          '<path d="M30 33H150M210 33H330" stroke="#D5C2C5" stroke-width=".5" stroke-dasharray="1.5 2.5"/>')
    s.pearls([(118, 30), (160, 30)], r=2.2)
    s.pearls([(200, 30), (242, 30)], r=2.2)
    for x, flip in ((166, -1), (194, 1)):
        s.add(f'<g transform="translate({x} 30) scale({flip} 1)">'
              f'<path d="M0 0C6-7 16-8 22-4 15 1 7 2 0 0Z" fill="url(#euca)" stroke="{EUCA_D}" stroke-width=".45"/>'
              f'<path d="M2 1C8 7 17 8 22 4 16 0 8-1 2 1Z" fill="url(#euca)" stroke="{EUCA_D}" stroke-width=".45"/></g>')
    s.daisy(180, 29, r=7.5)
    for x in (10, 350):
        s.add(f'<circle cx="{x}" cy="30" r="2.4" fill="url(#pearl)" stroke="#AEB6BD" stroke-width=".35"/>')
    s.save("glass-rule.svg")


def ornament():
    """卡片角落探出的小枝：尤加利、满天星和一朵洋甘菊。"""
    s = GSvg(170, 170, 5)
    s.eucalyptus(6, 6, 130, 72, bend=-14, pairs=6, size=13)
    s.baby_breath(30, 34, s=.9, rot=140, n=12)
    s.daisy_sprig(16, 20, h=80, rot=150, heads=2, r=8)
    s.yellow_cluster(10, 10, s=.6, rot=128, heads=3, h=100)
    s.save("glass-ornament.svg")


def photo_mat():
    """立绘相框底：白色撕边卡纸、蕾丝垫纸与银灰内框。照片窗口位于 x16 y16 w208 h220。"""
    s = GSvg(240, 300, 51, attrs='preserveAspectRatio="none"')
    s.defs += ('<linearGradient id="mist" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#D3DCE2"/><stop offset=".62" stop-color="#DFE4E8"/><stop offset="1" stop-color="#EBDDDF"/></linearGradient>'
               '<radialGradient id="mistGlow" cx=".78" cy=".2" r=".6"><stop stop-color="#F6EDEE" stop-opacity=".9"/><stop offset="1" stop-color="#F6EDEE" stop-opacity="0"/></radialGradient>')
    s.paper(150, 10, 96, 160, fill="#F1F3F2", rot=5, amp=3)
    s.paper(4, 4, 232, 290, fill="url(#ivory)", rot=0, amp=2.4, shadow="lift")
    s.add('<rect x="16" y="16" width="208" height="220" fill="url(#mist)" stroke="#B9C1C7" stroke-width=".8"/>'
          '<rect x="16" y="16" width="208" height="220" fill="url(#mistGlow)"/>')
    s.save("glass-photo-mat.svg")


def photo_overlay():
    s = GSvg(240, 300, 53, attrs='preserveAspectRatio="none"')
    s.add('<rect x="16" y="16" width="208" height="220" stroke="#FFFFFF" stroke-width="3"/>'
          '<rect x="16" y="16" width="208" height="220" stroke="#8D979F" stroke-opacity=".4" stroke-width=".8"/>')
    s.add('<text x="112" y="262" text-anchor="middle" font-family="Georgia,\'Palatino Linotype\',serif" font-style="italic" font-size="15" fill="#4E565D">silver mist</text>'
          '<text x="112" y="279" text-anchor="middle" font-family="\'Courier New\',monospace" font-size="7.5" letter-spacing=".22em" fill="#A0858A">LUMIÈRE · Nº 02 · OCT</text>')
    s.lace_strip(-8, 224, 120, rot=-7, h=18)
    s.pearls(s.curve((0, 200), (26, 238), (62, 250), (106, 238)), r=2.6)
    s.eucalyptus(6, 300, 30, 150, bend=-12, pairs=6, size=12)
    s.baby_breath(30, 300, s=.85, rot=10, n=14)
    s.daisy_sprig(46, 300, h=58, rot=-8, heads=1, r=7)
    s.yellow_cluster(18, 300, s=.55, rot=-6, heads=3, h=110)
    s.wax_seal(204, 254, r=14, rot=-10)
    s.bow(214, 30, s=.6, rot=22)
    s.binder_clip(120, 16, s=.95)
    s.butterfly(26, 34, s=.55, rot=-24, kind="aqua")
    s.butterfly(214, 200, s=.36, rot=18, kind="amber")
    s.save("glass-photo-overlay.svg")


def tapes():
    specs = (("glass-tape-aqua.svg", AQUA, .62, "stripe"), ("glass-tape-dot.svg", "#E6EAEC", .85, "dot"),
             ("glass-tape-butter.svg", "#F1E3A6", .66, None), ("glass-tape-blush.svg", BLUSH, .72, "stripe"))
    for i, (name, color, op, pat) in enumerate(specs):
        s = GSvg(110, 30, 90 + i)
        s.tape(4, 5, 102, 20, rot=0, color=color, opacity=op, stripes=pat == "stripe")
        if pat == "dot":
            d = s.torn_path(4, 5, 102, 20, (0, 1, 0, 1), amp=1.8, step=3)
            s.add(f'<path d="{d}" fill="url(#tapeDot)"/>')
        s.save(name)


def clip():
    s = GSvg(26, 62, 2)
    s.paper_clip(5, 3, s=1)
    s.save("glass-clip.svg")


def butterfly_icon():
    s = GSvg(70, 56, 4)
    s.butterfly(35, 28, s=.95, rot=12, kind="aqua")
    s.save("glass-butterfly.svg")


if __name__ == "__main__":
    sheet(); sheet(dark=True); crumple(); crumple(dark=True); ephemera_tile()
    collage_top(); collage_br(); page_foot(); page_corner(); hero(); rule(); ornament()
    photo_mat(); photo_overlay(); tapes(); clip(); butterfly_icon()
