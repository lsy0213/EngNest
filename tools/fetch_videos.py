"""影视精听「片库」：收集可以合法使用的英语视频，用 Whisper 生成按句切分的英文字幕。

来源（都可以自由使用）：
- VOA Learning English 的视频课程（美国政府作品，公有领域）：Let's Learn English 第一、二季（安娜在华盛顿的情景剧），
  English in a Minute、Everyday Grammar TV、How to Pronounce
- Blender 开放电影 Tears of Steel（CC BY 3.0，© Blender Foundation | mango.blender.org），用官方英文字幕
- TED 演讲（CC BY-NC-ND 4.0，非商业使用、不修改），用 TED 官方的英文和简体中文字幕

视频文件不打包进软件（太大），软件里在线播放来源网站的地址，也可以在软件里下载到本机。
字幕在本机用 faster-whisper 生成（VOA 网站上没有可用的字幕文件），按句子切开，存成 web/data/films/<id>.js。

    conda run -n engnest python tools/fetch_videos.py            # 全部
    conda run -n engnest python tools/fetch_videos.py lle1 tos   # 只处理某几个系列

输出：web/data/films_index.js（片单）、web/data/films/<id>.js（字幕，打开视频时才加载）
网页和下载的视频缓存在 tools/raw/videos/，转写完的视频会删掉，只留一个 .done 标记。
"""

import html
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "videos"
OUT = ROOT / "web" / "data"
SUBS = OUT / "films"
VOA = "https://learningenglish.voanews.com"
UA = "EngNest/0.3 (personal English-learning desktop app; educational use)"
WHISPER = "small.en"  # 比软件里用的 base.en 准；第一次运行会下载约 480 MB

VOA_NOTE = "VOA Learning English（美国之音学习英语），美国政府作品，公有领域"
SERIES = [
    {"id": "lle1", "title": "Let's Learn English · Level 1", "zh": "跟安娜学英语 · 第一季", "group": "voa", "level": "A1",
     "icon": "🌸", "kind": "voa_course", "page": "/p/5644.html", "limit": 52,
     "desc": "VOA 专门给英语学习者拍的情景剧：安娜从小镇搬到华盛顿，找工作、交朋友、过节。语速慢、发音清楚，每集 5 分钟左右，适合从零开始。"},
    {"id": "lle2", "title": "Let's Learn English · Level 2", "zh": "跟安娜学英语 · 第二季", "group": "voa", "level": "A2",
     "icon": "🏙️", "kind": "voa_course", "page": "/p/6765.html", "limit": 30,
     "desc": "第二季：安娜成了电视台记者，在工作和生活里学更多日常表达，语法点逐渐加深。"},
    {"id": "eim", "title": "English in a Minute", "zh": "一分钟英语", "group": "voa", "level": "B1",
     "icon": "⏱️", "kind": "voa_z", "z": 3619, "limit": 40,
     "desc": "每集一分钟，讲一个美国人常说的习语或俚语（比如 break the ice、hit the books），有情景小短剧。"},
    {"id": "egtv", "title": "Everyday Grammar TV", "zh": "日常语法 TV", "group": "voa", "level": "B1",
     "icon": "🧩", "kind": "voa_z", "z": 4716, "limit": 20,
     "desc": "用小短剧讲一个语法点：时态、情态动词、介词、条件句……讲完马上有例子。"},
    {"id": "htp", "title": "How to Pronounce", "zh": "发音教学", "group": "voa", "level": "A2",
     "icon": "👄", "kind": "voa_z", "z": 6042, "limit": 30,
     "desc": "每集一两分钟，讲一个发音难点：连读、弱读、容易混的音。配合软件里的「跟读评测」（Ctrl+M）一起练。"},
    {"id": "ted", "title": "TED Talks", "zh": "TED 演讲", "group": "ted", "level": "B2",
     "icon": "🎤", "kind": "ted", "license": "CC BY-NC-ND 4.0 · TED Conferences, LLC（ted.com）",
     # 由短到长、由易到难；挑的是语速适中、话题贴近生活、学英语的人常推荐的演讲
     "slugs": [
         "matt_cutts_try_something_new_for_30_days", "derek_sivers_keep_your_goals_to_yourself", "terry_moore_how_to_tie_your_shoes",
         "derek_sivers_how_to_start_a_movement", "ric_elias_3_things_i_learned_while_my_plane_crashed", "graham_shaw_why_people_believe_they_can_t_draw",
         "chris_lonsdale_how_to_learn_any_language_in_six_months", "josh_kaufman_the_first_20_hours_how_to_learn_anything",
         "andy_puddicombe_all_it_takes_is_10_mindful_minutes", "angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",
         "celeste_headlee_10_ways_to_have_a_better_conversation", "julian_treasure_how_to_speak_so_that_people_want_to_listen",
         "jia_jiang_what_i_learned_from_100_days_of_rejection", "tim_urban_inside_the_mind_of_a_master_procrastinator",
         "robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness", "kelly_mcgonigal_how_to_make_stress_your_friend",
         "shawn_achor_the_happy_secret_to_better_work", "simon_sinek_how_great_leaders_inspire_action", "amy_cuddy_your_body_language_may_shape_who_you_are",
         "brene_brown_the_power_of_vulnerability", "susan_cain_the_power_of_introverts", "rita_pierson_every_kid_needs_a_champion",
         "lera_boroditsky_how_language_shapes_the_way_we_think", "dan_pink_the_puzzle_of_motivation", "adam_grant_the_surprising_habits_of_original_thinkers",
         "chimamanda_ngozi_adichie_the_danger_of_a_single_story", "bill_gates_the_next_outbreak_we_re_not_ready", "pamela_meyer_how_to_spot_a_liar",
         "dan_gilbert_the_surprising_science_of_happiness", "sir_ken_robinson_do_schools_kill_creativity",
     ],
     "desc": "TED 官方的中英双语字幕，每个演讲 3–20 分钟。从几分钟的短演讲开始，话题有学习方法、心理学、沟通、教育、科技。比 VOA 语速快、更接近真实英语，适合雅思听力和口语备考。"},
    {"id": "tos", "title": "Tears of Steel", "zh": "钢铁之泪（科幻短片）", "group": "open", "level": "B2",
     "icon": "🤖", "kind": "archive", "license": "CC BY 3.0 · © Blender Foundation | mango.blender.org",
     "items": [("Tears-of-Steel", "tears_of_steel_720p.mp4", "Tears of Steel")],
     "srt": "https://download.blender.org/demo/movies/ToS/subtitles/TOS-en.srt",
     "desc": "Blender 基金会的开放电影，12 分钟。未来的阿姆斯特丹，一群科学家想用一段回忆拯救世界。对白不多但很地道，官方英文字幕。"},
]


# ---------- 网络 ----------
def get(url: str, cache: Path) -> str:
    if cache.exists():
        with open(cache, encoding="utf-8", newline="") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (3, 10, 30, None):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                text = r.read().decode("utf-8", "replace")
            break
        except OSError as e:
            if wait is None:
                print("  放弃", url, e)
                return ""
            time.sleep(wait)
    cache.parent.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8", newline="") as f:  # 原样保存，Windows 上不然换行会变成两个
        f.write(text)
    time.sleep(0.5)
    return text


def download(url: str, path: Path):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(".part")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (5, 20, 60, None):
        try:
            with urllib.request.urlopen(req, timeout=120) as r, open(part, "wb") as out:
                while chunk := r.read(1 << 20):
                    out.write(chunk)
            part.replace(path)
            return
        except OSError as e:
            if wait is None:
                raise
            print("  下载出错，重试：", e)
            time.sleep(wait)


# ---------- VOA ----------
def voa_video(page: str):
    """页面里第一个视频就是这一集的正片：返回 (在线播放地址, 转写用的小文件地址)。"""
    m = re.search(r'data-sources="([^"]+)"', page)
    if not m:
        return None, None
    srcs = re.findall(r'"Src":"([^"]+)"', html.unescape(m.group(1)))
    srcs = [s for s in srcs if ".mp4" in s]
    if not srcs:
        return None, None
    def pick(*tags):
        for t in tags:
            for s in srcs:
                name = s.split("?")[0].rsplit("/", 1)[-1]
                if (t == "" and re.fullmatch(r"[0-9a-f-]+\.mp4", name)) or (t and name.endswith(t + ".mp4")):
                    return s
        return srcs[0]
    return pick("_480p", "", "_hq"), pick("_240p", "_mobile", "")


def voa_meta(page: str):
    def og(name):
        m = re.search(rf'<meta (?:content="([^"]*)" property="og:{name}"|property="og:{name}" content="([^"]*)")', page)
        return html.unescape(m.group(1) or m.group(2)).strip() if m else ""
    title, desc = og("title"), og("description")
    date = (re.search(r'<time[^>]*datetime="([0-9-]{10})', page) or [0, ""])[1]
    return title, desc, date


def voa_links(series: dict) -> list:
    if series["kind"] == "voa_course":
        page = get(VOA + series["page"], RAW / "pages" / f"{series['id']}-index.html")
        return list(dict.fromkeys(re.findall(r'href="(?:https://learningenglish\.voanews\.com)?(/a/[^"]*?(\d+)\.html)"', page)))
    links = []
    for p in range(8):
        page = get(f"{VOA}/z/{series['z']}" + (f"?p={p}" if p else ""), RAW / "pages" / f"z{series['z']}-{p}.html")
        new = [x for x in re.findall(r'href="(/a/[^"]*?(\d+)\.html)"', page) if x not in links]
        if not new:
            break
        links += new
        if len(links) >= series["limit"] * 1.3:
            break
    return links


def voa_items(series: dict) -> list:
    items = []
    for href, num in voa_links(series):
        page = get(VOA + href, RAW / "pages" / f"a{num}.html")
        title, desc, date = voa_meta(page)
        play, small = voa_video(page)
        if not play or not title:
            continue
        if series["kind"] == "voa_course":
            m = re.search(r"Lesson\s*(\d+)", title, re.I)
            if not m:
                continue
            items.append({"n": int(m.group(1)), "id": f"{series['id']}-{int(m.group(1)):02d}",
                          "t": re.sub(r"^Let.s Learn English\s*[-–:]?\s*(Level \d\s*[-–:]?\s*)?", "", title, flags=re.I),
                          "desc": desc, "url": play, "small": small, "page": VOA + href})
        else:
            title = re.sub(r"^(English in a Minute|Everyday Grammar (TV|Video)|How to Pronounce)\s*:\s*", "", title, flags=re.I)
            items.append({"id": f"{series['id']}-{num}", "t": title, "desc": desc, "date": date, "url": play,
                          "small": small, "page": VOA + href})
    if series["kind"] == "voa_course":
        seen, out = set(), []
        for it in sorted(items, key=lambda x: x["n"]):
            if it["n"] not in seen:
                seen.add(it["n"])
                out.append(it)
        return out[: series["limit"]]
    # 同一集偶尔在列表里出现两次（不同的页面编号），按视频地址去重
    seen, out = set(), []
    for it in items:
        key = it["url"].split("?")[0]
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out[: series["limit"]]


# ---------- Internet Archive ----------
def archive_items(series: dict) -> list:
    items = []
    for ident, fname, title in series["items"]:
        meta = json.loads(get(f"https://archive.org/metadata/{ident}", RAW / "pages" / f"ia-{ident}.json") or "{}")
        files = meta.get("files", [])
        if not fname:  # 没指定就挑最小的 mp4
            mp4s = sorted((f for f in files if f["name"].endswith(".mp4")), key=lambda f: int(f.get("size") or 0))
            if not mp4s:
                print("  没有 mp4：", ident)
                continue
            fname = mp4s[0]["name"]
        url = f"https://archive.org/download/{ident}/{urllib.request.quote(fname)}"
        items.append({"id": f"{series['id']}-{re.sub(r'[^a-z0-9]+', '', ident.lower())[:60]}", "t": title, "url": url,
                      "small": url, "page": f"https://archive.org/details/{ident}"})
    return items


# ---------- TED ----------
def ted_page(slug, lang=""):
    page = get(f"https://www.ted.com/talks/{slug}" + (f"?language={lang}" if lang else ""), RAW / "pages" / f"ted-{slug}{'-' + lang if lang else ''}.html")
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', page, re.S)
    return json.loads(m.group(1))["props"]["pageProps"]["videoData"] if m else None


def ted_captions(tid, lang):
    txt = get(f"https://www.ted.com/talks/subtitles/id/{tid}/lang/{lang}", RAW / "pages" / f"ted-{tid}-{lang}.json")
    try:
        caps = json.loads(txt)["captions"]
    except (ValueError, KeyError):
        return []
    return [[round(c["startTime"] / 1000, 2), round((c["startTime"] + c["duration"]) / 1000, 2), re.sub(r"\s+", " ", c["content"]).strip()]
            for c in caps if c.get("content", "").strip()]


def ted_items(series: dict) -> list:
    items = []
    for slug in series["slugs"]:
        v = ted_page(slug)
        if not v:
            print("  没找到", slug)
            continue
        try:
            mp4 = v["videoPlayerData"]["resources"]["h264"][0]["file"]
        except (KeyError, IndexError, TypeError):
            print("  没有视频地址", slug)
            continue
        zh = ted_page(slug, "zh-cn")
        title = v["title"]
        zh_title = zh["title"] if zh and zh.get("title") and zh["title"] != title else ""
        items.append({"id": f"ted-{v['id']}", "tid": v["id"], "t": f"{v['presenterDisplayName']}: {title}" + (f"（{zh_title}）" if zh_title else ""),
                      "desc": (zh or v).get("description", "")[:160], "url": mp4, "page": v.get("canonicalUrl") or f"https://www.ted.com/talks/{slug}",
                      "dur": int(v.get("duration") or 0)})
    return items


# ---------- 字幕 ----------
_model = None


def model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        try:
            _model = WhisperModel(WHISPER, device="cpu", compute_type="int8", download_root=str(RAW / "whisper"),
                                  cpu_threads=max(4, (os.cpu_count() or 4) - 2))
        except Exception:  # noqa: BLE001 — huggingface.co 连不上时用镜像
            os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
            _model = WhisperModel(WHISPER, device="cpu", compute_type="int8", download_root=str(RAW / "whisper"),
                                  cpu_threads=max(4, (os.cpu_count() or 4) - 2))
    return _model


ABBR = re.compile(r"\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|Prof|Mt)\.$")


def transcribe(path: Path) -> tuple:
    """返回 (cues, 时长)。按句子切：句号问号叹号处断开，太长（>16 词或 >7 秒）就在逗号或停顿处断。"""
    segments, info = model().transcribe(str(path), language="en", beam_size=5, word_timestamps=True, vad_filter=True,
                                        condition_on_previous_text=False)
    words = [w for s in segments for w in (s.words or []) if w.word.strip()]
    cues, cur = [], []

    def flush():
        if cur:
            text = re.sub(r"\s+", " ", "".join(w.word for w in cur)).strip()
            if text and not re.fullmatch(r"[\W_]*", text):
                cues.append([round(cur[0].start, 2), round(cur[-1].end, 2), text])
            cur.clear()

    for i, w in enumerate(words):
        if cur and w.start - cur[-1].end > 1.2:  # 中间停了很久：换人说话或者换场景
            flush()
        cur.append(w)
        t = w.word.strip()
        nxt = words[i + 1] if i + 1 < len(words) else None
        dur = cur[-1].end - cur[0].start
        if re.search(r"[.?!][\"')\]]?$", t) and not ABBR.search(t):
            flush()
        elif len(cur) >= 16 or dur > 7:
            if t.endswith((",", ";", ":")) or not nxt or nxt.start - w.end > 0.3 or len(cur) >= 22:
                flush()
    flush()
    return cues, round(info.duration)


def srt_cues(text: str) -> list:
    def ts(s):
        h, m, rest = s.strip().replace(",", ".").split(":")
        return round(int(h) * 3600 + int(m) * 60 + float(rest), 2)
    cues = []
    for block in text.replace("\r", "").split("\n\n"):
        lines = [l for l in block.split("\n") if l.strip()]
        k = next((i for i, l in enumerate(lines) if "-->" in l), -1)
        if k < 0:
            continue
        a, b = lines[k].split("-->")
        body = re.sub(r"<[^>]+>", "", " ".join(lines[k + 1:])).strip()
        if body:
            cues.append([ts(a), ts(b), body])
    return cues


def write_subs(item_id: str, cues: list, zh: list = None):
    """英文字幕放 FILM_SUBS；有官方中文字幕的（TED）另外放 FILM_SUBS_ZH，前端按时间配对成双语。"""
    SUBS.mkdir(parents=True, exist_ok=True)
    body = json.dumps(cues, ensure_ascii=False, separators=(",", ":"))
    text = f"(window.FILM_SUBS ||= {{}})[{json.dumps(item_id)}] = {body};\n"
    if zh:
        text += f"(window.FILM_SUBS_ZH ||= {{}})[{json.dumps(item_id)}] = {json.dumps(zh, ensure_ascii=False, separators=(',', ':'))};\n"
    (SUBS / f"{item_id}.js").write_text(text, encoding="utf-8")


def process(series: dict, item: dict):
    """生成一集的字幕。返回时长（秒）；已经做过就读缓存。"""
    done = RAW / "media" / f"{item['id']}.done"
    if done.exists() and (SUBS / f"{item['id']}.js").exists():
        return json.loads(done.read_text())["dur"]
    zh = None
    if series["kind"] == "ted":
        cues, zh = ted_captions(item["tid"], "en"), ted_captions(item["tid"], "zh-cn")
        dur = item["dur"] or (round(cues[-1][1]) if cues else 0)
    elif series.get("srt"):
        cues = srt_cues(get(series["srt"], RAW / "pages" / f"{series['id']}.srt"))
        dur = round(cues[-1][1]) + 30 if cues else 0
    else:
        media = RAW / "media" / f"{item['id']}.mp4"
        print("  下载", item["small"][:100])
        download(item["small"], media)
        t0 = time.time()
        cues, dur = transcribe(media)
        print(f"  转写完成：{len(cues)} 句，{dur} 秒，用时 {time.time() - t0:.0f} 秒")
        media.unlink(missing_ok=True)
    if not cues:
        raise ValueError("没有得到任何字幕")
    write_subs(item["id"], cues, zh)
    done.parent.mkdir(parents=True, exist_ok=True)
    done.write_text(json.dumps({"dur": dur, "cues": len(cues)}))
    return dur


def main():
    only = set(sys.argv[1:])
    index_file = OUT / "films_index.js"
    old = {}
    if index_file.exists():  # 只处理部分系列时保留其他系列
        txt = index_file.read_text(encoding="utf-8")
        old = {s["id"]: s for s in json.loads(txt[txt.index("["): txt.rindex("]") + 1])}
    out = []
    for series in SERIES:
        if only and series["id"] not in only:
            if series["id"] in old:
                out.append(old[series["id"]])
            continue
        print(f"== {series['zh']}")
        items = archive_items(series) if series["kind"] == "archive" else ted_items(series) if series["kind"] == "ted" else voa_items(series)
        rows = []
        for it in items:
            print(f"- {it['id']} {it['t']}")
            try:
                dur = process(series, it)
            except Exception as e:  # noqa: BLE001 — 一集失败不影响其他
                print("  失败：", e)
                continue
            rows.append({"id": it["id"], "t": it["t"], "d": dur, "url": it["url"], "page": it["page"],
                         **({"desc": it["desc"][:160]} if it.get("desc") else {}), **({"date": it["date"]} if it.get("date") else {})})
        out.append({k: series[k] for k in ("id", "title", "zh", "group", "level", "icon", "desc")}
                   | {"license": series.get("license", VOA_NOTE), "items": rows})
        write_index(index_file, out + [old[s["id"]] for s in SERIES if s["id"] in old and s["id"] not in {x["id"] for x in out}])
    write_index(index_file, out)


def write_index(path: Path, series: list):
    order = [s["id"] for s in SERIES]
    series = sorted(series, key=lambda s: order.index(s["id"]) if s["id"] in order else 99)
    path.write_text("// 由 tools/fetch_videos.py 生成：影视精听片库（视频在线播放，字幕在 data/films/<id>.js）\n"
                    "window.FILM_SERIES = " + json.dumps(series, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
