"""生成「珍藏手稿」主题用到的 SVG 素材（web/css/skin/cabinet-*.svg）。

全部为原创矢量：油画感风景条、拱廊横幅、非周期撕纸边、洛可可卷草与贝壳线刻。
随机数固定种子，重复运行得到相同结果。

    python tools/make_cabinet_skin.py
"""

import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "css" / "skin"

PAPER = "#ECE6DB"        # 浅色页面底
PAPER_SIDE = "#F3EEE5"   # 浅色侧栏纸
NIGHT = "#131A16"        # 深色页面底
NIGHT_SIDE = "#18201C"   # 深色侧栏
CLARET = "#8A2232"


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def pts(points):
    return " ".join(f"{f(x)},{f(y)}" for x, y in points)


def smooth_path(points, closed=False):
    """Catmull-Rom 转三次贝塞尔，得到顺滑但不规则的轮廓。"""
    p = points
    n = len(p)
    d = [f"M{f(p[0][0])},{f(p[0][1])}"]
    rng = range(n if closed else n - 1)
    for i in rng:
        p0 = p[(i - 1) % n] if (closed or i > 0) else p[i]
        p1 = p[i]
        p2 = p[(i + 1) % n]
        p3 = p[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{f(c1[0])},{f(c1[1])} {f(c2[0])},{f(c2[1])} {f(p2[0])},{f(p2[1])}")
    if closed:
        d.append("Z")
    return "".join(d)


def tear_profile(length, step, rnd, amp=1.0):
    """非周期撕边：几条无理频率的正弦叠加 + 随机游走 + 少数压痕。"""
    waves = [(rnd.uniform(0.004, 0.009), rnd.uniform(0, 6.3), 5.0),
             (rnd.uniform(0.017, 0.029), rnd.uniform(0, 6.3), 2.6),
             (rnd.uniform(0.05, 0.08), rnd.uniform(0, 6.3), 1.2),
             (rnd.uniform(0.15, 0.23), rnd.uniform(0, 6.3), 0.6)]
    out, walk, x = [], 0.0, 0.0
    notches = []
    while x <= length:
        walk = walk * 0.86 + rnd.uniform(-0.9, 0.9)
        y = sum(a * math.sin(fr * x + ph) for fr, ph, a in waves) + walk
        if rnd.random() < 0.025:
            notches.append((x, rnd.uniform(8, 18), rnd.uniform(3, 7)))
        for nx, nw, nd in notches:
            if abs(x - nx) < nw:
                y += nd * (1 - abs(x - nx) / nw) ** 1.5
        out.append((x, y * amp))
        x += step * rnd.uniform(0.7, 1.3)
    return out


def fibers(edge, rnd, outward, count, color, opacity):
    """沿撕边伸出的细纤维。outward 为外法线方向 (dx, dy)。"""
    s = []
    for _ in range(count):
        x, y = rnd.choice(edge)
        L = rnd.uniform(1.5, 5.5)
        ang = rnd.uniform(-0.7, 0.7)
        dx = outward[0] * math.cos(ang) - outward[1] * math.sin(ang)
        dy = outward[0] * math.sin(ang) + outward[1] * math.cos(ang)
        mx, my = x + dx * L * 0.5 + rnd.uniform(-1, 1), y + dy * L * 0.5 + rnd.uniform(-1, 1)
        s.append(f'<path d="M{f(x)},{f(y)}Q{f(mx)},{f(my)} {f(x + dx * L)},{f(y + dy * L)}" '
                 f'stroke="{color}" stroke-opacity="{opacity}" stroke-width="{rnd.uniform(.35, .8):.2f}" fill="none"/>')
    return "".join(s)


# ---------- 撕纸边 ----------

def tear_h(paper, rim, shadow, name, seed):
    """横向撕边：上方透明（露出油画），下方是纸。1200×44，拉伸使用。"""
    rnd = random.Random(seed)
    W, H, base = 1200, 44, 18
    edge = [(x, base + y) for x, y in tear_profile(W, 5, rnd)]
    edge[0] = (-2, edge[0][1]); edge[-1] = (W + 2, edge[-1][1])
    top = smooth_path(edge)
    body = f"{top}L{W + 2},{H}L-2,{H}Z"
    rim_edge = [(x, y + 2.2 + rnd.uniform(0, 1.6)) for x, y in edge]
    rim_d = smooth_path(edge) + "L" + "L".join(f"{f(x)},{f(y)}" for x, y in reversed(rim_edge)) + "Z"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">
<defs><filter id="b" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
<path d="{body}" fill="{shadow}" transform="translate(0 -3.5)" filter="url(#b)"/>
<path d="{body}" fill="{paper}"/>
<path d="{rim_d}" fill="{rim}"/>
{fibers(edge, rnd, (0, -1), 120, rim, .85)}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def tear_v(paper, rim, shadow, name, seed):
    """纵向撕边：左侧是侧栏纸，右侧透明。16×1200，拉伸使用。"""
    rnd = random.Random(seed)
    W, H, base = 16, 1200, 6
    prof = tear_profile(H, 5, rnd, amp=0.62)
    edge = [(base + y, x) for x, y in prof]
    edge[0] = (edge[0][0], -2); edge[-1] = (edge[-1][0], H + 2)
    right = smooth_path(edge)
    body = f"{right}L-2,{H + 2}L-2,-2Z"
    rim_edge = [(x - 1.6 - rnd.uniform(0, 1.2), y) for x, y in edge]
    rim_d = right + "L" + "L".join(f"{f(x)},{f(y)}" for x, y in reversed(rim_edge)) + "Z"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">
<defs><filter id="b" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
<path d="{body}" fill="{shadow}" transform="translate(2.6 0)" filter="url(#b)"/>
<path d="{body}" fill="{paper}"/>
<path d="{rim_d}" fill="{rim}"/>
{fibers(edge, rnd, (1, 0), 70, rim, .8)}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def claret_strip(name, seed):
    """酒红撕纸条：导航当前项和引文旁的小标记。"""
    rnd = random.Random(seed)
    H = 90
    left = [(3 + rnd.uniform(-1.4, 1.4) + (1.6 if rnd.random() < .12 else 0), y) for y in range(0, H + 1, 5)]
    right = [(11 + rnd.uniform(-1.6, 1.6) - (2 if rnd.random() < .15 else 0), y) for y in range(H, -1, -5)]
    left[0] = (4, 1); right[-1] = (10, 0)
    d = smooth_path(left + right, closed=True)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 {H}" preserveAspectRatio="none">
<defs><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
<path d="{d}" fill="{CLARET}"/>
<path d="{d}" fill="#000" filter="url(#g)"/>
<path d="{d}" fill="none" stroke="#B4515D" stroke-width=".5" stroke-opacity=".6"/>
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def brush_stroke(name, seed):
    """标题下的一笔酒红干笔。"""
    rnd = random.Random(seed)
    W, H = 220, 16
    top, bot = [], []
    for i in range(0, 41):
        t = i / 40
        x = 4 + t * (W - 10)
        w = 4.2 * math.sin(math.pi * min(1, t * 1.25 + .05)) ** .55 + 0.7
        c = 8 + 1.6 * math.sin(t * 2.4 + .8) - t * 1.2
        top.append((x, c - w + rnd.uniform(-.5, .5)))
        bot.append((x, c + w * .8 + rnd.uniform(-.6, .6)))
    d = smooth_path(top + list(reversed(bot)), closed=True)
    streaks = "".join(
        f'<path d="M{f(rnd.uniform(30, 90))},{f(rnd.uniform(5, 11))}H{f(rnd.uniform(120, 214))}" stroke="{PAPER}" stroke-width="{rnd.uniform(.3, .8):.2f}" stroke-opacity=".55"/>'
        for _ in range(6))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
<path d="{d}" fill="{CLARET}"/>{streaks}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


# ---------- 线刻：卷草、贝壳、花线 ----------

def leaf(cx, cy, ang, L, W, bend=0.25, lobes=0):
    """以 (cx,cy) 为叶柄、方向 ang 的叶片轮廓；lobes>0 时边缘带莨苕式分裂。"""
    left, right = [], []
    for i in range(0, 25):
        s = i / 24
        ax = s * L
        ay = bend * L * s * s
        w = W * math.sin(math.pi * s) ** 0.75
        if lobes:
            w *= 0.78 + 0.22 * abs(math.sin(lobes * math.pi * s))
        left.append((ax, ay - w))
        right.append((ax, ay + w * 0.82))
    poly = left + list(reversed(right[1:-1]))
    ca, sa = math.cos(ang), math.sin(ang)
    out = [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in poly]
    rib = [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in ((s * L * .9, bend * (s * L * .9) ** 2 / L) for s in (0, .3, .6, .9))]
    return smooth_path(out, closed=True), smooth_path(rib)


def spiral(cx, cy, r_in, r_out, turns, a0, cw=1, n=80):
    """对数螺线，从内到外返回点列。"""
    b = math.log(r_out / r_in) / (turns * 2 * math.pi)
    res = []
    for i in range(n + 1):
        th = turns * 2 * math.pi * i / n
        r = r_in * math.exp(b * th)
        a = a0 + cw * th
        res.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return res


def ribbon(center, w0, w1, wmid=None):
    """沿中心线生成由粗到细的带状轮廓。"""
    n = len(center)
    left, right = [], []
    for i, (x, y) in enumerate(center):
        t = i / (n - 1)
        w = w0 + (w1 - w0) * t
        if wmid:
            w += wmid * math.sin(math.pi * t)
        x0, y0 = center[max(0, i - 1)]
        x1, y1 = center[min(n - 1, i + 1)]
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    return smooth_path(left + list(reversed(right)), closed=True)


def hermite(p0, t0, p1, t1, n=30):
    res = []
    for i in range(1, n):
        s = i / n
        h00, h10 = 2 * s ** 3 - 3 * s ** 2 + 1, s ** 3 - 2 * s ** 2 + s
        h01, h11 = -2 * s ** 3 + 3 * s ** 2, s ** 3 - s ** 2
        res.append((h00 * p0[0] + h10 * t0[0] + h01 * p1[0] + h11 * t1[0],
                    h00 * p0[1] + h10 * t0[1] + h01 * p1[1] + h11 * t1[1]))
    return res


def acanthus(x, y, ang, L, curl, side, rnd):
    """一片莨苕叶：弯曲的中脉 + 两侧逐渐变小的尖裂片 + 叶尖小卷。返回 (裂片路径列表, 中脉中心线)。"""
    rib, a, px, py = [], ang, x, y
    n = 26
    for i in range(n + 1):
        rib.append((px, py))
        a += curl * side / n
        px += math.cos(a) * L / n
        py += math.sin(a) * L / n
    tx, ty = rib[-1]
    tip = spiral(tx + math.cos(a + side * 1.57) * 5, ty + math.sin(a + side * 1.57) * 5, 1.5, 5, .8, a - side * 1.57, side, 16)
    lobes = []
    for s_, big in ((.16, 1), (.34, .92), (.52, .8), (.68, .66), (.82, .5)):
        i = int(s_ * n)
        (x0, y0), (x1, y1) = rib[i], rib[i + 1]
        ta = math.atan2(y1 - y0, x1 - x0)
        for sd, scale in ((side, 1.0), (-side, .72)):
            ll = L * .36 * big * scale * rnd.uniform(.9, 1.1)
            d, _ = leaf(x0, y0, ta + sd * rnd.uniform(.75, 1.0), ll, ll * .3, bend=-sd * .35)
            lobes.append(d)
    sheath, _ = leaf(x, y, ang, L * .3, L * .07, bend=0)
    return [sheath] + lobes, rib + tip


def rococo_scroll(name):
    """不对称 S 形卷草，石膏浮雕质感（象牙填色 + 褐色刻线 + 投影），可压在撕边上。"""
    rnd = random.Random(31)
    # 大卷：左下，从内向外；小卷：右上，从外向内，转向相反
    a = spiral(78, 196, 6, 46, 1.35, 0.6, cw=-1, n=80)
    b = list(reversed(spiral(214, 66, 4, 30, 1.2, 2.2, cw=1, n=60)))
    ta = (a[-1][0] - a[-2][0], a[-1][1] - a[-2][1]); La = math.hypot(*ta)
    tb = (b[1][0] - b[0][0], b[1][1] - b[0][1]); Lb = math.hypot(*tb)
    k = 260
    mid = hermite(a[-1], (ta[0] / La * k, ta[1] / La * k), b[0], (tb[0] / Lb * k, tb[1] / Lb * k), 40)
    line = a + mid + b
    body = ribbon(line, 2.5, 2, wmid=10)
    groove = smooth_path(line[10:-8])
    lobes, ribs = [], []
    # 莨苕叶从主弧两侧剥出：外侧大而舒展，内侧小而回卷——不对称的生长感
    for idx, ang, L, curl, side in ((84, -2.5, 70, 1.1, -1), (98, -1.7, 58, 1.0, 1), (112, -2.8, 46, 1.2, -1),
                                    (92, 0.6, 46, 1.3, -1), (124, 1.2, 34, 1.4, 1), (60, 1.9, 40, 1.2, 1)):
        x, y = line[idx]
        lb, rib = acanthus(x, y, ang, L, curl, side, rnd)
        lobes += lb
        ribs.append(rib)
    lobe_paths = "".join(f'<path d="{d}"/>' for d in lobes)
    rib_paths = "".join(f'<path d="{ribbon(r, 3.2, 1)}" fill="url(#iv)" stroke="#6F5D45" stroke-width=".8"/>' for r in ribs)
    shadow = lobe_paths + f'<path d="{body}"/>'
    beads = "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="url(#iv)" stroke="#6F5D45" stroke-width=".8"/>' for x, y, r in ((36, 240, 3.6), (27, 231, 2.7), (21, 220, 2), (17, 210, 1.4)))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 260">
<defs>
<linearGradient id="iv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF6EA"/><stop offset=".55" stop-color="#E7DCC5"/><stop offset="1" stop-color="#B9A88A"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
</defs>
<g fill="#1E160E" opacity=".42" transform="translate(4 7)" filter="url(#sh)">{shadow}</g>
<g fill="url(#iv)" stroke="#6F5D45" stroke-width=".9" stroke-linejoin="round">{lobe_paths}</g>
{rib_paths}
<path d="{body}" fill="url(#iv)" stroke="#5F4E39" stroke-width="1.1"/>
<path d="{groove}" fill="none" stroke="#8C7858" stroke-width="1.1" stroke-opacity=".8"/>
<path d="{groove}" fill="none" stroke="#FFFDF6" stroke-width="1.3" stroke-opacity=".8" transform="translate(-1.6 -1.4)"/>
{beads}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def shell(name):
    """洛可可贝壳与小枝的线刻（单色，供 mask 使用）。"""
    rnd = random.Random(7)
    hx, hy = 96, 168
    parts = []
    tilt = -0.2
    n = 13
    ends = []
    for i in range(n):
        t = i / (n - 1)
        ang = math.pi * (1.08 + 0.84 * t) + tilt
        R = 92 + 10 * math.sin(math.pi * t) + rnd.uniform(-3, 3)
        ex, ey = hx + R * math.cos(ang), hy + R * math.sin(ang)
        mx, my = hx + R * .55 * math.cos(ang + .06), hy + R * .55 * math.sin(ang + .06)
        parts.append(f'<path d="M{f(hx + 14 * math.cos(ang))},{f(hy + 14 * math.sin(ang))}Q{f(mx)},{f(my)} {f(ex)},{f(ey)}" stroke-width="1.1"/>')
        ends.append((ex, ey))
    # 扇贝外缘：相邻肋骨端点之间的外凸小弧
    scal = [f"M{f(ends[0][0])},{f(ends[0][1])}"]
    for (x0, y0), (x1, y1) in zip(ends, ends[1:]):
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        ox, oy = mx - hx, my - hy
        L = math.hypot(ox, oy)
        scal.append(f"Q{f(mx + ox / L * 11)},{f(my + oy / L * 11)} {f(x1)},{f(y1)}")
    parts.append(f'<path d="{"".join(scal)}" stroke-width="1.6"/>')
    # 内圈细肋
    for i in range(n - 1):
        t = (i + .5) / (n - 1)
        ang = math.pi * (1.08 + 0.84 * t) + tilt
        parts.append(f'<path d="M{f(hx + 30 * math.cos(ang))},{f(hy + 30 * math.sin(ang))}L{f(hx + 70 * math.cos(ang))},{f(hy + 70 * math.sin(ang))}" stroke-width=".6" stroke-opacity=".7"/>')
    # 贝壳根部两侧不对称的 C 形卷
    for cx, cy, r0, r1, turns, a0, cw in ((70, 172, 3, 17, 1.1, 0, 1), (126, 170, 2.5, 12, 1, 3.1, -1)):
        parts.append(f'<path d="{smooth_path(spiral(cx, cy, r0, r1, turns, a0, cw, 40))}" stroke-width="1.3"/>')
    # 向右上生长的小枝
    stem = [(132, 166), (160, 150), (178, 124), (186, 92), (184, 62)]
    parts.append(f'<path d="{smooth_path(stem)}" stroke-width="1.1"/>')
    for (x, y), ang, L in zip(stem[1:], (-0.6, -2.4, -0.3, -2.2), (20, 18, 16, 13)):
        d, r = leaf(x, y, ang, L, 5, bend=.2)
        parts.append(f'<path d="{d}" stroke-width=".9"/><path d="{r}" stroke-width=".5"/>')
    parts.append('<circle cx="184" cy="58" r="3" stroke-width=".9"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
{"".join(parts)}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def flourish(name):
    """页头细线末端的卷叶小饰（单色，供 mask 使用）。"""
    parts = ['<path d="M0,20H44" stroke-width=".9"/>']
    parts.append(f'<path d="{smooth_path(spiral(58, 15, 2, 9, 1.1, 2.4, 1, 30))}" stroke-width="1.1"/>')
    parts.append('<path d="M44,20C52,22 60,22 66,15C70,10 76,8 84,10" stroke-width="1"/>')
    for x, y, ang, L in ((72, 10, -1.9, 12), (80, 9, -0.5, 10), (64, 18, 0.7, 9)):
        d, r = leaf(x, y, ang, L, 3.5, bend=.25)
        parts.append(f'<path d="{d}" stroke-width=".8"/>')
    parts.append('<circle cx="88" cy="11" r="1.8" fill="#000"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 28" fill="none" stroke="#000" stroke-linecap="round">
{"".join(parts)}
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


# ---------- 拼贴：鼠尾草绿撕纸 ----------

def sage_paper(name):
    """右上角的鼠尾草绿撕纸，带一枝浅色植物线刻。"""
    rnd = random.Random(12)
    W, H = 380, 250
    # 从上边 x=40 开始，沿撕边斜下到右边 y=232
    edge = []
    prof = tear_profile(360, 6, rnd, amp=1.4)
    for x, y in prof:
        t = x / 360
        px = 40 + t * (W - 40) + y * .5
        py = t ** 1.35 * 232 + y * .9
        edge.append((px, py))
    edge = [(36, -2)] + edge + [(W + 2, 236)]
    outline = smooth_path(edge) + f"L{W + 2},-2Z"
    rim_edge = [(x + 2.4, y - 2.6 - rnd.uniform(0, 1.5)) for x, y in edge]
    rim = smooth_path(edge) + "L" + "L".join(f"{f(x)},{f(y)}" for x, y in reversed(rim_edge)) + "Z"
    stems = []
    stem = [(372, 10), (338, 46), (318, 86), (306, 128), (300, 168)]
    stems.append(f'<path d="{smooth_path(stem)}" stroke-width="1.2"/>')
    for (x, y), side in zip(stem[1:] + [(326, 66), (311, 106), (302, 148)], (1, -1, 1, -1, -1, 1, -1)):
        ang = math.atan2(y - 10, x - 372) + side * 1.0
        d, r = leaf(x, y, ang, rnd.uniform(26, 36), rnd.uniform(6, 9), bend=side * .25, lobes=3)
        stems.append(f'<path d="{d}" stroke-width=".9"/><path d="{r}" stroke-width=".55"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
<defs>
<linearGradient id="s" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E6E5F"/><stop offset=".6" stop-color="#718070"/><stop offset="1" stop-color="#7E8C7B"/></linearGradient>
<filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .12  0 0 0 0 .1  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .05" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 .95  0 0 0 .16 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<path d="{outline}" fill="#2C2418" opacity=".22" transform="translate(-3 5)" filter="url(#sh)"/>
<path d="{outline}" fill="url(#s)"/>
<path d="{outline}" fill="#000" filter="url(#m)"/>
<path d="{outline}" fill="#000" filter="url(#t)"/>
<path d="{rim}" fill="#EFE9DD"/>
{fibers(edge, rnd, (-.7, .7), 90, "#EFE9DD", .9)}
<g fill="none" stroke="#DDE3D4" stroke-opacity=".55" stroke-linecap="round" stroke-linejoin="round">{"".join(stems)}</g>
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


# ---------- 油画：风景竖条与拱廊横幅 ----------

PAINT_DEFS = '''
<filter id="paint" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="{seed}"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".012 .04" numOctaves="2" seed="{seed2}"/><feDisplacementMap in="SourceGraphic" scale="14"/><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="haze"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .08  0 0 0 .2 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="crack" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="1" seed="5"/><feColorMatrix type="luminanceToAlpha"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/></feComponentTransfer><feComposite in="SourceGraphic" operator="in"/></filter>
<filter id="stroke" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .06 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
'''


def foliage(rnd, cx_range, cy_range, n, rmin, rmax, colors, weight=None):
    out = []
    for _ in range(n):
        x = rnd.uniform(*cx_range)
        y = rnd.uniform(*cy_range)
        if weight and rnd.random() > weight(x, y):
            continue
        r = rnd.uniform(rmin, rmax)
        out.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(r)}" ry="{f(r * rnd.uniform(.6, .9))}" fill="{rnd.choice(colors)}"/>')
    return "".join(out)


def landscape(name):
    """意大利式古典风景竖条（侧栏油画）。300×1000，按 slice 裁切。"""
    rnd = random.Random(21)
    W, H = 300, 1000
    ridge = [(x, 560 - 26 * math.sin(x / 70 + 1) - 14 * math.sin(x / 23) - (40 if 150 < x < 240 else 0) * math.sin((x - 150) / 90 * math.pi)) for x in range(-20, W + 30, 15)]
    ridge2 = [(x, 598 - 12 * math.sin(x / 40 + 2) - 6 * math.sin(x / 13)) for x in range(-20, W + 30, 12)]
    hills = [(x, 690 - 30 * math.sin(x / 90 + .4) - 10 * math.sin(x / 27)) for x in range(-20, W + 30, 12)]
    ground = [(x, 790 - 20 * math.sin(x / 60 + 2) - 8 * math.sin(x / 17)) for x in range(-20, W + 30, 12)]
    tree = foliage(rnd, (-60, 210), (-30, 640), 260, 20, 56, ["#2D3123", "#353A29", "#3E4330", "#474B33", "#2A2C20"],
                   weight=lambda x, y: max(0.05, 1 - (x + 40) / 260 - max(0, y - 420) / 500))
    lights = foliage(rnd, (60, 220), (40, 520), 70, 6, 16, ["#6E6F48", "#7F7C51", "#8C875A"],
                     weight=lambda x, y: 0.7 if x > 110 else 0.15)
    right_tree = foliage(rnd, (240, 330), (120, 520), 50, 12, 30, ["#33382A", "#3D4231", "#4A4D35"])
    clouds = "".join(f'<ellipse cx="{f(rnd.uniform(60, 320))}" cy="{f(rnd.uniform(90, 470))}" rx="{f(rnd.uniform(40, 90))}" ry="{f(rnd.uniform(10, 24))}" fill="#F3EBD6" opacity="{rnd.uniform(.25, .55):.2f}"/>' for _ in range(14))
    town = "".join(f'<rect x="{f(x)}" y="{f(590 - h)}" width="{f(w)}" height="{f(h)}" fill="{c}"/>' for x, w, h, c in ((196, 9, 9, "#C7B48D"), (205, 6, 14, "#B8A47C"), (212, 11, 7, "#CDBB93"), (226, 7, 11, "#BFAC84"), (234, 12, 6, "#C9B78F")))
    cypress = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#3F4434"/>' for x, y, rx, ry in ((188, 584, 2.6, 13), (246, 582, 2.2, 11), (252, 586, 1.8, 8), (124, 664, 4, 26), (132, 668, 3, 18)))
    streaks = "".join(f'<rect x="{f(rnd.uniform(-10, 200))}" y="{f(rnd.uniform(606, 690))}" width="{f(rnd.uniform(40, 140))}" height=".9" fill="#F4EBCF" opacity="{rnd.uniform(.2, .5):.2f}"/>' for _ in range(16))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
<defs>
{PAINT_DEFS.format(seed=11, seed2=4)}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#77858A"/><stop offset=".32" stop-color="#9FA7A0"/><stop offset=".72" stop-color="#D6CBA9"/><stop offset="1" stop-color="#E9D7A8"/></linearGradient>
<linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2D6B2"/><stop offset="1" stop-color="#A4A898"/></linearGradient>
<linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76734F"/><stop offset="1" stop-color="#4E4F37"/></linearGradient>
<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4130"/><stop offset="1" stop-color="#241E16"/></linearGradient>
<radialGradient id="var" cx=".55" cy=".45" r=".75"><stop offset=".5" stop-color="#5A3A14" stop-opacity="0"/><stop offset="1" stop-color="#2A1A08" stop-opacity=".55"/></radialGradient>
</defs>
<rect width="{W}" height="620" fill="url(#sky)"/>
<g filter="url(#haze)">{clouds}</g>
<path d="{smooth_path(ridge)}L{W + 30},640L-20,640Z" fill="#8B979A" opacity=".9" filter="url(#soft)"/>
<path d="{smooth_path(ridge2)}L{W + 30},640L-20,640Z" fill="#7F8879" filter="url(#soft)"/>
{town}
<rect y="600" width="{W}" height="110" fill="url(#lake)"/>
{streaks}
<path d="{smooth_path(hills)}L{W + 30},820L-20,820Z" fill="url(#hill)" filter="url(#soft)"/>
{cypress}
<path d="{smooth_path(ground)}L{W + 30},{H}L-20,{H}Z" fill="url(#gr)" filter="url(#soft)"/>
<g filter="url(#haze)" opacity=".5"><ellipse cx="170" cy="820" rx="90" ry="16" fill="#8A7547"/><ellipse cx="90" cy="900" rx="70" ry="12" fill="#6E5C38"/></g>
<path d="M70,{H}C74,880 78,760 92,640C98,590 96,520 106,440L118,442C110,520 114,600 108,650C100,760 98,880 104,{H}Z" fill="#251F17" filter="url(#paint)"/>
<path d="M104,520C126,500 150,470 170,430M100,600C80,580 60,560 30,552" stroke="#2A241A" stroke-width="5" fill="none" filter="url(#paint)"/>
<g filter="url(#paint)">{tree}{right_tree}</g>
<g filter="url(#paint)" opacity=".85">{lights}</g>
<rect width="{W}" height="{H}" fill="#000" filter="url(#stroke)"/>
<rect width="{W}" height="{H}" fill="#000" filter="url(#grain)"/>
<rect width="{W}" height="{H}" fill="url(#var)"/>
<rect width="{W}" height="{H}" fill="#9B6A23" opacity=".08"/>
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


def loggia(name):
    """拱廊横幅：左侧是安静的暗墙（放标题），右侧拱洞外是托斯卡纳远景。1200×420。"""
    rnd = random.Random(44)
    W, H = 1200, 420
    arches = [(600, 120), (760, 120), (920, 120), (1080, 120)]
    spring, top_r, rail = 150, 60, 286
    clip = "".join(f'<path d="M{x},{rail}V{spring}A{w / 2},{top_r} 0 0 1 {x + w},{spring}V{rail}Z"/>' for x, w in arches)
    ridge = [(x, 228 - 18 * math.sin(x / 80) - 9 * math.sin(x / 27 + 1)) for x in range(560, W + 40, 14)]
    hills = [(x, 262 - 14 * math.sin(x / 60 + 2) - 5 * math.sin(x / 19)) for x in range(560, W + 40, 12)]
    cyp = "".join(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}" fill="#3C412F"/>' for x, y, rx, ry in ((688, 236, 4, 30), (700, 244, 3, 20), (862, 248, 3.4, 22), (1012, 232, 4.6, 34), (1024, 244, 3, 20), (1150, 240, 4, 28)))
    clouds = "".join(f'<ellipse cx="{f(rnd.uniform(580, 1200))}" cy="{f(rnd.uniform(110, 200))}" rx="{f(rnd.uniform(50, 110))}" ry="{f(rnd.uniform(8, 18))}" fill="#F7EEDA" opacity="{rnd.uniform(.3, .6):.2f}"/>' for _ in range(10))
    pil = []
    for (x0, w0), (x1, _) in zip(arches, arches[1:] + [(1240, 0)]):
        px, pw = x0 + w0, x1 - (x0 + w0)
        pil.append(f'<rect x="{px}" y="40" width="{pw}" height="{rail + 6 - 40}" fill="url(#stone)"/>')
        pil.append(f'<rect x="{px - 6}" y="{spring - 12}" width="{pw + 12}" height="12" fill="#8D7B5F"/><rect x="{px - 6}" y="{spring}" width="{pw + 12}" height="3" fill="#3A2F22" opacity=".6"/>')
        for k in range(1, 4):
            fx = px + pw * k / 4
            pil.append(f'<path d="M{f(fx)},{spring + 10}V{rail - 6}" stroke="#3B3125" stroke-opacity=".45" stroke-width="1.4"/>')
    pil.append('<rect x="560" y="40" width="40" height="252" fill="url(#stone)"/>')
    moulding = "".join(f'<path d="M{x - 4},{spring}A{w / 2 + 4},{top_r + 4} 0 0 1 {x + w + 4},{spring}" fill="none" stroke="#9A876A" stroke-width="7"/><path d="M{x + 2},{spring}A{w / 2 - 2},{top_r - 2} 0 0 1 {x + w - 2},{spring}" fill="none" stroke="#2C241A" stroke-width="2" stroke-opacity=".6"/>' for x, w in arches)
    bal = []
    for x in range(566, W + 10, 20):
        bal.append(f'<path d="M{x},{rail + 52}h10c-1-8-4-10-1-18c3-6 4-12-2-18c3-3 3-6 3-9h-10c0 3 0 6 3 9c-6 6-5 12-2 18c3 8 0 10-1 18Z" fill="url(#stone2)"/>')
    book_lines = "".join(f'<path d="M{f(966 + i * .6)},{f(326 + i * 3.6)}Q{f(990)},{f(323 + i * 3.6)} {f(1014 - i * .4)},{f(328 + i * 3.2)}" stroke="#6E5E45" stroke-width=".7" opacity=".55" fill="none"/>' for i in range(6)) + \
        "".join(f'<path d="M{f(1026 + i * .4)},{f(328 + i * 3.2)}Q{f(1050)},{f(323 + i * 3.6)} {f(1074 - i * .6)},{f(326 + i * 3.6)}" stroke="#6E5E45" stroke-width=".7" opacity=".55" fill="none"/>' for i in range(6))
    vine = [(1076, 292), (1084, 250), (1078, 210), (1090, 170), (1084, 128), (1096, 96)]
    vine_leaves = "".join(f'<ellipse cx="{f(x + s * 7)}" cy="{f(y)}" rx="6" ry="3.4" transform="rotate({s * 35} {f(x + s * 7)} {f(y)})" fill="#4D5534"/>' for (x, y), s in zip(vine[1:] + [(1081, 232), (1086, 150)], (1, -1, 1, -1, 1, -1, 1)))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMaxYMid slice">
<defs>
{PAINT_DEFS.format(seed=17, seed2=6)}
<linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1B1612"/><stop offset=".42" stop-color="#2A221B"/><stop offset=".75" stop-color="#3B3024"/><stop offset="1" stop-color="#342A20"/></linearGradient>
<linearGradient id="vault" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120E0B" stop-opacity=".9"/><stop offset="1" stop-color="#120E0B" stop-opacity="0"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DB0B6"/><stop offset=".55" stop-color="#D9D3BC"/><stop offset="1" stop-color="#EBDDB5"/></linearGradient>
<linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8A7859"/><stop offset=".45" stop-color="#6B5B44"/><stop offset="1" stop-color="#3F3427"/></linearGradient>
<linearGradient id="stone2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A08C6B"/><stop offset=".6" stop-color="#6F5F47"/><stop offset="1" stop-color="#43382A"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3026"/><stop offset="1" stop-color="#1A1511"/></linearGradient>
<linearGradient id="page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EDE2C8"/><stop offset="1" stop-color="#C9B994"/></linearGradient>
<linearGradient id="beam" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DCA4" stop-opacity=".22"/><stop offset="1" stop-color="#F3DCA4" stop-opacity="0"/></linearGradient>
<radialGradient id="vig" cx=".7" cy=".5" r=".85"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<clipPath id="open">{clip}</clipPath>
</defs>
<rect width="{W}" height="{H}" fill="url(#wall)"/>
<g filter="url(#soft)" opacity=".5"><path d="M120,300V150A110,110 0 0 1 340,150V300Z" fill="#14100C"/><path d="M380,300V170A80,80 0 0 1 540,170V300Z" fill="#17120E"/></g>
<rect width="{W}" height="110" fill="url(#vault)"/>
<g clip-path="url(#open)">
<rect x="560" y="80" width="660" height="230" fill="url(#sky)"/>
<g filter="url(#haze)">{clouds}</g>
<path d="{smooth_path(ridge)}L{W + 40},300L560,300Z" fill="#94A0A2" filter="url(#soft)"/>
<rect x="560" y="246" width="660" height="20" fill="#DCD3B6"/>
<path d="{smooth_path(hills)}L{W + 40},300L560,300Z" fill="#76764F" filter="url(#soft)"/>
{cyp}
</g>
{"".join(pil)}
{moulding}
<rect x="560" y="{rail}" width="{W - 560}" height="8" fill="#9C8869"/>
<rect x="560" y="{rail + 8}" width="{W - 560}" height="3" fill="#2C241A" opacity=".55"/>
{"".join(bal)}
<rect x="560" y="{rail + 52}" width="{W - 560}" height="8" fill="#806E52"/>
<rect y="{rail + 60}" width="{W}" height="{H - rail - 60}" fill="url(#floor)"/>
<path d="M600,{rail + 60}L1200,{rail + 60}L1000,{H}L360,{H}Z" fill="url(#beam)"/>
<path d="M600,90L760,90L420,{rail + 60}L180,{rail + 60}Z" fill="url(#beam)" opacity=".45"/>
<g filter="url(#soft)"><path d="M950,350L1030,338L1090,352L1012,368Z" fill="#1A140F" opacity=".7"/></g>
<path d="M960,322Q992,314 1020,330L1018,364Q990,350 952,356Z" fill="url(#page)"/>
<path d="M1020,330Q1050,314 1082,322L1090,356Q1052,350 1018,364Z" fill="url(#page)"/>
<path d="M1020,330L1018,364" stroke="#7A6648" stroke-width="1.2"/>
{book_lines}
<path d="{smooth_path(vine)}" stroke="#3B4229" stroke-width="2" fill="none"/>
{vine_leaves}
<rect width="{W}" height="{H}" fill="#000" filter="url(#stroke)"/>
<rect width="{W}" height="{H}" fill="#000" filter="url(#grain)"/>
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect width="{W}" height="{H}" fill="#9B6A23" opacity=".07"/>
</svg>'''
    (OUT / name).write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    tear_h(PAPER, "#FAF7F0", "#140E08", "cabinet-tear-h.svg", 3)
    tear_h(NIGHT, "#2A332D", "#000000", "cabinet-tear-h-dark.svg", 3)
    tear_v(PAPER_SIDE, "#FCFAF5", "#3A2C1C", "cabinet-tear-v.svg", 9)
    tear_v(NIGHT_SIDE, "#28312B", "#000000", "cabinet-tear-v-dark.svg", 9)
    claret_strip("cabinet-strip.svg", 5)
    brush_stroke("cabinet-brush.svg", 8)
    rococo_scroll("cabinet-scroll.svg")
    shell("cabinet-shell.svg")
    flourish("cabinet-flourish.svg")
    sage_paper("cabinet-sage.svg")
    landscape("cabinet-landscape.svg")
    loggia("cabinet-loggia.svg")
    print("written to", OUT)
