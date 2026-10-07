"""生成「星河晚歌」极繁蕾丝夜曲的原创矢量素材。

沿用 gen_mintchoco_skin.py 里的绘制函数（钩针蕾丝、珍珠、纸蝴蝶、方形蕾丝框、手帕蕾丝边……），
把它们换成星河晚歌的配色：藏蓝 #4D4B63、丁香紫 #A88D9F、薄荷绿 #7DA094、深蓝绿 #294C4C、浅叶绿 #9CC0A8
（取自角色原画），蕾丝是带一点丁香灰的白。再加上夜晚的小物：新月、星星挂坠和深蓝星空衬底。
散落位置使用固定随机种子，重复运行结果一致。

    python tools/gen_starry_lace.py
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_mintchoco_skin as m  # noqa: E402

NAVY, NAVY_D, NAVY_L = "#4D4B63", "#262A40", "#6E6B8A"
LILAC, LILAC_L, LILAC_M, LILAC_D = "#A88D9F", "#EEE6EE", "#CBB7CB", "#7C648A"
MINT, MINT_L, MINT_D = "#9CC0A8", "#DCEBDD", "#5E8C7A"
TEAL = "#294C4C"
MOON, MOON_D = "#F6EDC8", "#D8C68C"
SILVER = "#D6D3E2"

# 让薄荷可可的绘制函数改用星河配色：蕾丝、阴影、文字色都在模块全局里查
m.LACE, m.LACE_EDGE, m.LACE_HOLE = "#FFFFFF", "#BDB3CB", "#E6E0EC"
m.CHOCO_D, m.CHOCO, m.COCOA, m.COCOA_M = NAVY_D, NAVY, "#A99BB8", "#5F5A79"
m.CREAM = "#FFFFFF"
m.DEFS = f"""
<filter id="lift" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2.4" stdDeviation="2.2" flood-color="{NAVY_D}" flood-opacity=".24"/></filter>
<filter id="liftS" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="{NAVY_D}" flood-opacity=".26"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
<radialGradient id="pearl" cx=".34" cy=".3" r=".78"><stop stop-color="#FFFFFF"/><stop offset=".42" stop-color="#F3F1F6"/><stop offset=".82" stop-color="#CFCADB"/><stop offset="1" stop-color="#B2ABC2"/></radialGradient>
<linearGradient id="paperW" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F1ECF4"/><stop offset="1" stop-color="#D9CDE0"/></linearGradient>
<linearGradient id="satin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F4F1F6"/><stop offset=".55" stop-color="#E7E1EC"/><stop offset="1" stop-color="#F9F7FB"/></linearGradient>
<linearGradient id="satinLilac" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F1E8F1"/><stop offset=".45" stop-color="{LILAC}"/><stop offset="1" stop-color="{LILAC_D}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFBE6"/><stop offset=".5" stop-color="{MOON}"/><stop offset="1" stop-color="{MOON_D}"/></linearGradient>
<linearGradient id="moon" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFCEB"/><stop offset=".6" stop-color="{MOON}"/><stop offset="1" stop-color="{MOON_D}"/></linearGradient>
<linearGradient id="night" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3A3956"/><stop offset=".55" stop-color="#2C3350"/><stop offset="1" stop-color="{TEAL}"/></linearGradient>
<pattern id="starsNavy" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r=".9" fill="#F8F5D0"/><circle cx="17" cy="15" r=".7" fill="#BCDCC9"/><path d="M14 3l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z" fill="#F8F5D0"/><circle cx="7" cy="19" r=".6" fill="#E6DCE6"/></pattern>
<pattern id="ginghamLilac" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#FAF7FB"/><rect width="6" height="12" fill="{LILAC}" fill-opacity=".34"/><rect width="12" height="6" fill="{LILAC}" fill-opacity=".34"/></pattern>
<pattern id="ginghamMint" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#F6FAF7"/><rect width="6" height="12" fill="{MINT}" fill-opacity=".4"/><rect width="12" height="6" fill="{MINT}" fill-opacity=".4"/></pattern>
<pattern id="tapeStripe" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="#FFFFFF" fill-opacity=".3"/></pattern>
"""


class StarSvg(m.Svg):
    def moon(self, x, y, r=20, rot=-20, shadow="liftS"):
        """一弯新月：外弧是圆，内弧半径更大、往同侧鼓。"""
        k = r * 1.28
        d = f"M0 {-r}A{r} {r} 0 1 0 0 {r}A{k:.1f} {k:.1f} 0 0 1 0 {-r}Z"
        body = (f'<path d="{d}" transform="translate({r*.18:.1f} 0)" fill="{MOON}" filter="url(#glow)" opacity=".55"/>'
                f'<path d="{d}" fill="url(#moon)" stroke="{MOON_D}" stroke-width="1"/>'
                f'<circle cx="{-r*.55:.1f}" cy="{-r*.2:.1f}" r="{r*.1:.1f}" fill="{MOON_D}" fill-opacity=".35"/>'
                f'<circle cx="{-r*.4:.1f}" cy="{r*.35:.1f}" r="{r*.07:.1f}" fill="{MOON_D}" fill-opacity=".3"/>')
        self.g(x, y, 1, rot, body, shadow)

    def twinkle(self, x, y, r=6, color="#F8F5D0", op=1):
        """四角星光。"""
        self.add(f'<g opacity="{op}"><path d="M{x} {y-r}Q{x+r*.16:.1f} {y-r*.16:.1f} {x+r} {y}Q{x+r*.16:.1f} {y+r*.16:.1f} {x} {y+r}'
                 f'Q{x-r*.16:.1f} {y+r*.16:.1f} {x-r} {y}Q{x-r*.16:.1f} {y-r*.16:.1f} {x} {y-r}Z" fill="{color}"/></g>')

    def star_charm(self, x, y, length=28, r=8, color="url(#gold)"):
        """一枚挂坠：细珠链 + 星星，链顶一颗小珍珠。"""
        self.chain(x, y, x, y + length)
        self.pearl(x, y, 2.6)
        self.star(x, y + length + r * .8, r, fill=color, stroke=MOON_D, rot=0)

    def satin_bow(self, x, y, s=1, rot=0, fill="url(#satinLilac)", edge=LILAC_D, knot=LILAC, shadow="lift"):
        loop = "M0 0C-12-24-50-34-52-8-54 14-22 18 0 0Z"
        tail = "M-5 5-22 40-13 36-8 46 4 8Z"
        body = (f'<path d="{tail}" fill="{fill}" stroke="{edge}" stroke-width="1.4" stroke-linejoin="round"/>'
                f'<path d="{tail}" transform="scale(-1 1)" fill="{fill}" stroke="{edge}" stroke-width="1.4" stroke-linejoin="round"/>'
                f'<path d="{loop}" fill="{fill}" stroke="{edge}" stroke-width="1.6"/>'
                f'<path d="{loop}" transform="scale(-1 1)" fill="{fill}" stroke="{edge}" stroke-width="1.6"/>'
                f'<path d="M-12-6C-24-16-38-18-42-8M12-6C24-16 38-18 42-8" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.4"/>'
                f'<rect x="-9" y="-10" width="18" height="20" rx="7" fill="{knot}" stroke="{edge}" stroke-width="1.4"/>')
        self.g(x, y, s, rot, body, shadow)


def ephemera_tile():
    """正文背后的极淡底纹：星光、新月、珍珠和小蝴蝶。"""
    s = StarSvg(600, 600, 211)
    r = s.rnd
    for _ in range(26):
        s.twinkle(r.uniform(10, 590), r.uniform(10, 590), r.uniform(3, 7), r.choice([LILAC_D, MINT_D, NAVY_L]), op=r.uniform(.18, .32))
    s.add('<g opacity=".22">')
    for x, y in ((120, 140), (470, 420)):
        s.moon(x, y, 13, r.uniform(-40, 10), shadow=None)
    s.add('</g><g opacity=".35">')
    for x, y in ((360, 90), (80, 480), (540, 250)):
        s.butterfly(x, y, .45, r.uniform(-30, 30), shadow=None)
    s.add('</g>')
    for _ in range(8):
        s.add('<g opacity=".4">'); s.pearl(r.uniform(10, 590), r.uniform(10, 590), 2.4); s.add('</g>')
    s.save("starry-ephemera.svg")


def ornament():
    """卡片角花：钩针蕾丝蝴蝶结、一弯新月、星星挂坠、纸蝴蝶和珍珠串。"""
    s = StarSvg(200, 200, 221)
    s.twinkle(110, 140, 7, MINT_D); s.pearl(126, 128, 3.4)
    s.lace_bow(78, 74, .95, -16)
    s.moon(150, 116, 16, -30)
    s.butterfly(148, 46, .6, 18)
    s.star_charm(52, 112, 26, 7)
    s.pearl_str([(16, 176), (44, 164), (78, 166), (104, 154)], 3)
    s.twinkle(30, 36, 6, LILAC_D); s.twinkle(176, 166, 5, MINT_D)
    s.save("starry-lace-ornament.svg")


def hero():
    """首页横幅右侧：细链吊着一只穿缎带的方形蕾丝框，框里是深蓝星空和新月；
    框下垂两枚星星挂坠，钩针蕾丝丝带缀着珍珠穿过，纸蝴蝶停在框角。"""
    s = StarSvg(320, 230, 231)
    s.chain(176, 0, 176, 40)
    s.satin_curl("M176 40C150 32 140 8 160 4S190 28 176 40C200 48 214 26 206 16")
    s.satin_curl("M176 40C168 58 140 60 136 78S150 100 144 112")
    s.lace_frame(178, 100, 118, 118, 7, inner='<rect x="-50" y="-50" width="100" height="100" fill="url(#night)"/><rect x="-50" y="-50" width="100" height="100" fill="url(#starsNavy)"/>')
    s.moon(184, 98, 26, -24)
    s.twinkle(154, 70, 4); s.twinkle(208, 128, 3.5, "#BCDCC9")
    s.satin_bow(176, 40, .42, 0, shadow="liftS")
    s.star_charm(140, 160, 22, 7); s.star_charm(214, 166, 30, 6, color="#E6DCE6")
    s.lace_ribbon((0, 200), (90, 154), (180, 244), (320, 180), 13)
    s.pearl(52, 182, 4.6); s.pearl(130, 200, 4.6); s.pearl(214, 210, 4.6); s.pearl(290, 188, 4.6)
    s.star_charm(40, 128, 30, 7, color="#E6DCE6"); s.star_charm(272, 120, 22, 6)
    s.twinkle(70, 170, 5, "#BCDCC9"); s.twinkle(250, 196, 4.5)
    s.butterfly(244, 44, .62, 20); s.butterfly(92, 66, .5, -18)
    s.twinkle(300, 30, 7); s.twinkle(36, 34, 6, "#BCDCC9"); s.twinkle(306, 112, 4.5)
    s.save("starry-hero.svg")


def collage_br():
    """右下：蕾丝心、一弯大新月、星星挂坠、缀珍珠的蕾丝丝带和两只纸蝴蝶。"""
    s = StarSvg(420, 340, 241)
    s.lace_heart(330, 250, 1.15, 10, word="Stars", centre=LILAC_L)
    s.moon(170, 210, 46, -28)
    s.lace_ribbon((0, 190), (80, 150), (150, 300), (250, 280), 13)
    s.pearl(60, 172, 4.5); s.pearl(140, 258, 4.5); s.pearl(214, 288, 4.5)
    s.star_charm(250, 90, 40, 9); s.star_charm(290, 110, 26, 7, color="#E6DCE6")
    s.butterfly(110, 120, .8, -16); s.butterfly(370, 110, .62, 22)
    s.satin_bow(394, 206, .5, 18)
    s.pearl_str([(300, 176), (330, 166), (360, 170)], 3)
    s.twinkle(300, 30, 7, LILAC_D); s.twinkle(400, 40, 7, MINT_D); s.twinkle(190, 110, 5, LILAC_D)
    s.save("starry-collage-br.svg")


def collage_bl():
    """左下：格纹爱心插在方形蕾丝框里，一弯新月、星星挂坠和珍珠串。"""
    s = StarSvg(400, 300, 251)
    inner = '<rect x="-38" y="-38" width="76" height="76" fill="url(#ginghamMint)"/>'
    s.lace_frame(196, 150, 96, 96, -9, inner=inner)
    s.gingham_heart(196, 154, .8, -9, fill="url(#ginghamLilac)", edge=LILAC_D)
    s.moon(60, 250, 22, -16)
    s.twinkle(100, 200, 6, LILAC_D)
    s.lace_bow(146, 92, .55, 12)
    s.star_charm(286, 150, 34, 8)
    s.moon(330, 240, 24, -10)
    s.butterfly(330, 120, .7, 14); s.butterfly(70, 120, .5, -20)
    s.pearl_str([(222, 214), (250, 236), (282, 240)], 3)
    s.twinkle(300, 60, 6, LILAC_D); s.twinkle(120, 40, 6, MINT_D)
    s.save("starry-collage-bl.svg")


def tapes():
    for name, fill in (("lilac", "url(#ginghamLilac)"), ("mint", "url(#ginghamMint)"), ("navy", "url(#night)")):
        s = StarSvg(92, 24, 271, attrs='preserveAspectRatio="none"')
        d = "M0 2L1 7-1 12 1 17 0 22H92L91 17 93 12 91 7 92 2Z"
        stars = f'<path d="{d}" fill="url(#starsNavy)"/>' if name == "navy" else ""
        s.add(f'<g filter="url(#liftS)"><path d="{d}" fill="{fill}" fill-opacity=".9"/>{stars}<path d="{d}" fill="url(#tapeStripe)"/></g>')
        s.save(f"starry-tape-{name}.svg")


def small_pieces():
    s = StarSvg(120, 100, 281)
    s.lace_bow(60, 40, .95, 0)
    s.save("starry-bow-lace.svg")
    s = StarSvg(80, 64, 282)
    s.butterfly(40, 26, .95, 12)
    s.save("starry-butterfly.svg")
    s = StarSvg(40, 32, 283)
    s.twinkle(20, 16, 9, "#F8F5D0")
    s.twinkle(32, 6, 4, "#BCDCC9")
    s.save("starry-navstar.svg")


def star_lace():
    """横幅下摆：白蕾丝扇贝，每个扇贝里挖一颗星。"""
    s = StarSvg(32, 18, 291, attrs='width="32" height="18"')

    def star_path(cx, cy, r):
        pts = []
        for i in range(10):
            a = math.pi / 5 * i - math.pi / 2
            rr = r if i % 2 == 0 else r * .45
            pts.append(f"{cx+math.cos(a)*rr:.2f} {cy+math.sin(a)*rr:.2f}")
        return "M" + "L".join(pts) + "Z"
    s.add(f'<path d="M0 0H32V6C28 6 28 15 24 15S20 6 16 6 12 15 8 15 4 6 0 6Z{star_path(8, 9.4, 2.6)}{star_path(24, 9.4, 2.6)}" fill="#FFFFFF" fill-opacity=".92" fill-rule="evenodd"/>'
          f'<path d="M0 6C4 6 4 15 8 15S12 6 16 6 20 15 24 15 28 6 32 6" stroke="{m.LACE_EDGE}" stroke-width=".7"/>'
          f'<path d="M0 2.6H32" stroke="{m.LACE_EDGE}" stroke-width=".7" stroke-dasharray="1.6 1.6"/><circle cx="16" cy="9.5" r="1.1" fill="{m.LACE_EDGE}"/>')
    s.save("starry-lace-star.svg")


def lace_edge_v():
    """侧栏右缘的竖向蕾丝扇贝。"""
    s = StarSvg(14, 28, 292, attrs='width="14" height="28"')
    s.add(f'<path d="M0 0V28H6C6 24 12 24 12 21S6 17 6 14 12 10 12 7 6 3 6 0Z" fill="#FFFFFF" fill-opacity=".9"/>'
          f'<path d="M6 0C6 3 12 4 12 7S6 11 6 14 12 18 12 21 6 25 6 28" stroke="{m.LACE_EDGE}" stroke-width=".8"/>'
          f'<circle cx="3.5" cy="7" r="1.4" stroke="{m.LACE_EDGE}" stroke-width=".6"/><circle cx="3.5" cy="21" r="1.4" stroke="{m.LACE_EDGE}" stroke-width=".6"/>'
          f'<circle cx="9" cy="14" r=".9" fill="{m.LACE_EDGE}"/>')
    s.save("starry-lace-edge-v.svg")


def script_mark():
    """横幅里的花体字水印和手写批注（浅丁香，压在深蓝丝绒上）。"""
    s = StarSvg(520, 120, 293)
    c = "#D9CCE0"
    s.add(f'<text x="8" y="74" font-family="{m.SCRIPT}" font-size="58" fill="{c}" fill-opacity=".8">Evening song</text>'
          f'<path d="M330 92H420" stroke="{c}" stroke-opacity=".6" stroke-width="1"/>'
          f'<text x="428" y="96" font-family="{m.SERIF}" font-style="italic" font-size="12" fill="{c}">under the stars</text>'
          f'<path d="M300 22C314 10 332 12 338 20M332 12 338 20 328 22" stroke="{c}" stroke-opacity=".7" stroke-width="1"/>'
          f'<text x="346" y="24" font-family="{m.SCRIPT}" font-size="13" fill="{c}">one word, one star</text>')
    s.save("starry-script.svg")


if __name__ == "__main__":
    ephemera_tile(); ornament(); hero(); collage_br(); collage_bl()
    tapes(); small_pieces(); star_lace(); lace_edge_v(); script_mark()
    m.hanky(name="starry-hanky")
    m.hanky(True, name="starry-hanky", colors=("#4B5168", "#6B7088"))
    m.lace_tag_tile(name="starry-lace-tag")
    m.lace_tag_tile(True, name="starry-lace-tag", colors=("#4B5168", "#6B7088", "#252C3D"))
    m.lace_trim(name="starry-lace-trim")
    m.lace_trim(True, name="starry-lace-trim", colors=("#4B5168", "#6B7088", "#323A4E"))
