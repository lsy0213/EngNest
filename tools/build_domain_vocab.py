"""生成行业词书（医学、科技、法律、经济金融）和「雅思主题词汇」。

行业词书：从 ECDICT（MIT）里挑出带专业标注的常用词——[医] 医学、[计]/[电]/[机] 计算机与工程、[法] 法律、[经] 经济——
按 wordfreq 词频排序（常用的在前），例句从内置的公有领域文本（VOA、名著原文）里找一句含这个词的短句。
雅思主题词汇：把雅思词书里的词按中文释义归到十几个话题里，每个话题再按 50 词分单元。

    python tools/build_domain_vocab.py

需要先有 tools/raw/ecdict.csv（build_dict.py 会下载）和 web/data 下的 VOA、名著、雅思词书数据。
输出：web/data/vocab_med.js、vocab_tech.js、vocab_law.js、vocab_fin.js、vocab_ielts_topic.js
"""

import csv
import json
import re
import sys
from pathlib import Path

from wordfreq import zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "data"
RAW = ROOT / "tools" / "raw" / "ecdict.csv"
UNIT = 50
csv.field_size_limit(10_000_000)

DOMAINS = {
    "med": {"title": "医学英语", "desc": "医学和健康相关的常用词（来自 ECDICT 的医学标注），按使用频率排序", "tags": ["医"], "max": 2000, "min_zipf": 2.6},
    "tech": {"title": "计算机与科技", "desc": "计算机、电子和工程相关的常用词，按使用频率排序", "tags": ["计", "电", "机"], "max": 2000, "min_zipf": 2.6},
    "law": {"title": "法律英语", "desc": "法律相关的常用词（来自 ECDICT 的法律标注），按使用频率排序", "tags": ["法"], "max": 1500, "min_zipf": 2.4},
    "fin": {"title": "经济金融", "desc": "经济、金融和商务相关的常用词，按使用频率排序", "tags": ["经"], "max": 1500, "min_zipf": 2.3},
}

# 雅思主题：按中文释义里的关键词打分归类；动词、形容词没归进话题的放到「动作」「描述」
IELTS_TOPICS = [
    ("自然地理", "地理|山|河|海|岛|湖|洋|气候|天气|地震|火山|沙漠|森林|土壤|岩|地形|大陆|赤道|极地|雨|雪|风暴|云|潮|峡谷|平原|冰|洪水|干旱|温度|季节|矿"),
    ("动物植物", "动物|植物|鸟|鱼|昆虫|兽|树|花|草|叶|种子|物种|生物|哺乳|爬行|繁殖|捕猎|蛇|虫|猫|狗|马|牛|羊|猴|熊|狼|鹰|蜂|根|枝|果实|农场|农业|作物|庄稼|畜"),
    ("环境能源", "环境|污染|能源|资源|排放|回收|生态|保护|燃料|电力|核|废|气体|塑料|垃圾|节约|可持续|石油|煤|太阳能"),
    ("宇宙科学", "宇宙|星|行星|太空|天文|卫星|轨道|物理|化学|实验|科学|分子|原子|元素|光线|辐射|引力|重力|实验室|理论|假设|测量"),
    ("科技发明", "技术|发明|机器|电脑|计算机|网络|设备|装置|工程|数据|数字|软件|电子|自动|仪器|工具|机械|电池|信号|屏幕|程序|系统"),
    ("学校教育", "学校|教育|课程|考试|学生|教师|研究|论文|学位|知识|讲座|图书|学术|大学|学科|学习|作业|成绩|毕业|教授|学期|课堂"),
    ("健康医疗", "健康|疾病|病|医|药|治疗|身体|器官|症|营养|伤|疼|心理|肌肉|骨|血|手术|感染|呼吸|睡眠|锻炼|皮肤|牙"),
    ("饮食烹饪", "食|饮|菜|餐|味|烹|厨|水果|蔬菜|肉|面包|酒|糖|咖啡|茶|烤|煮|甜|调料|谷物|奶"),
    ("城市建筑", "建筑|城市|房|楼|街|桥|设施|居住|公寓|结构|墙|屋|社区|郊区|广场|公园|门|窗|地板|家具"),
    ("交通旅行", "交通|旅|车|船|飞机|航|道路|乘客|行李|港|驾驶|铁路|地铁|出发|到达|游客|景点|护照|票"),
    ("文化艺术", "文化|艺术|音乐|绘画|文学|小说|诗|戏剧|电影|博物馆|传统|宗教|历史|古代|节日|语言|雕塑|演出|表演|作家|故事|神话|风俗"),
    ("经济商业", "经济|商业|贸易|市场|公司|企业|金融|银行|货币|价格|投资|税|消费|产品|销售|广告|雇|工资|费用|利润|成本|收入|贷款|股|顾客|商品|合同|生意"),
    ("政府社会", "政府|政治|法律|法庭|社会|国家|公民|权利|犯罪|警|军|战争|选举|政策|人口|官员|议会|规则|规定|组织|机构|民族|公共|福利|贫困"),
    ("运动娱乐", "运动|体育|比赛|游戏|娱乐|休闲|球|冠军|俱乐部|赛|跑|游泳|训练|爱好|玩具|假期"),
    ("人物情感", "性格|情感|情绪|感到|心情|态度|朋友|家庭|婚|孩子|父亲|母亲|关系|害怕|高兴|愤怒|悲伤|担心|骄傲|羞|爱|恨|勇敢|聪明|愚蠢|善良|诚实|耐心"),
    ("工作职业", "工作|职业|职位|员工|经理|老板|办公|会议|项目|任务|职责|雇主|面试|专业|技能|同事|退休|晋升"),
    ("日常生活", "衣|穿|鞋|帽|买|钱|日常|家务|清洁|洗|电话|信|邮|礼物|钥匙|包|镜|床|浴|厨房|手表|眼镜|雨伞"),
    ("抽象概念", "概念|方法|原则|方面|因素|过程|形式|程度|状态|性质|特征|观点|意义|目的|原因|结果|影响|趋势|标准|范围|方式|能力|机会|问题|情况|事实|证据|作用"),
]


def load_js_data(name: str):
    t = (DATA / name).read_text(encoding="utf-8")
    return json.loads(t[t.index(".push(") + 6:].strip().rstrip(";").rstrip(")")) if ".push(" in t else None


def sentence_pool() -> dict:
    """公有领域文本里的短句：{小写单词: 一句例句}。优先用现代英语的 VOA，没有再用名著原文；
    名著里的老式拼写（chuse、shew、thou……）不适合当例句，跳过"""
    archaic = re.compile(r"\b(chuse|shew|shewn|thou|thee|thy|thine|hath|doth|'tis|'twas|ye|connexion|to-day|to-morrow)\b", re.I)
    sources = []
    t = (DATA / "voa_text.js").read_text(encoding="utf-8")
    voa = json.loads(t[t.index("window.VOA_TEXT = ") + 18:].strip().rstrip(";"))
    sources.append((0, [p for a in voa.values() for p in a["paras"]]))
    books = []
    for f in (DATA / "books").glob("*.js"):
        bt = f.read_text(encoding="utf-8")
        books += [p for _, ps in json.loads(bt[bt.index("] = ") + 4:].strip().rstrip(";")) for p in ps]
    sources.append((1, books))
    best = {}
    for rank, texts in sources:
        for para in texts:
            for s in re.split(r"(?<=[.!?])\s+", para):
                n = len(s.split())
                if (not 6 <= n <= 22 or not s[:1].isupper() or not s.endswith((".", "!", "?"))
                        or re.search(r"[_\[\]*\"“”]", s) or archaic.search(s)):
                    continue
                for w in set(re.findall(r"[a-z]+", s.lower())):
                    # VOA 优先；同一来源里选 10 词左右的（太短没上下文，太长难读）
                    score = (rank, abs(n - 11))
                    if w not in best or score < best[w][1]:
                        best[w] = (s, score)
    return {w: s for w, (s, _) in best.items()}


def meaning(trans: str, tags: list) -> str:
    """专业释义放在前面，再加一两条普通释义"""
    lines = [x.strip() for x in trans.replace("\\n", "\n").split("\n") if x.strip() and not x.startswith("[网络]")]
    pro = [x for x in lines if any(x.startswith(f"[{t}]") for t in tags)]
    rest = [x for x in lines if x not in pro]
    return "  ".join((pro[:2] + rest[:2])[:3])


def phonetic(p: str) -> str:
    p = p.split(";")[0].split(",")[0].strip()
    return f"/{p}/" if p else ""


def write_book(bid: str, title: str, desc: str, units: list, note: str):
    payload = {"id": bid, "title": title, "desc": desc, "rich": True, "units": units}
    (DATA / f"vocab_{bid}.js").write_text(
        f"// 自动生成，请勿手改：{note}，由 tools/build_domain_vocab.py 生成\n"
        "(window.WORD_BOOKS = window.WORD_BOOKS || []).push(" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ");\n",
        encoding="utf-8")


def build_domains():
    pool = sentence_pool()
    print(f"例句库：{len(pool)} 个词有例句")
    picked = {k: [] for k in DOMAINS}
    seen = set()
    with open(RAW, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            w = r["word"]
            if " " in w or not w.isalpha() or not w.islower() or w in seen:
                continue
            found = set(re.findall(r"\[([一-鿿]{1,2})\]", r["translation"]))
            for k, d in DOMAINS.items():
                if found & set(d["tags"]):
                    zf = zipf_frequency(w, "en")
                    if zf >= d["min_zipf"]:
                        picked[k].append((zf, w, r))
                        seen.add(w)
                    break
    for k, d in DOMAINS.items():
        rows = sorted(picked[k], key=lambda x: -x[0])[:d["max"]]
        words = []
        for _, w, r in rows:
            ex = pool.get(w)
            words.append([w, phonetic(r["phonetic"]), meaning(r["translation"], d["tags"]), [[ex, ""]] if ex else [], [], "", []])
        units = [{"title": f"Unit {i // UNIT + 1}", "words": words[i:i + UNIT]} for i in range(0, len(words), UNIT)]
        write_book(k, d["title"], d["desc"], units, f"{d['title']}（ECDICT，MIT；例句来自公有领域文本）")
        print(f"{d['title']:8} {len(words):5} 词，{sum(1 for x in words if x[3])} 个有例句")


def build_ielts_topics():
    t = (DATA / "vocab_ielts.js").read_text(encoding="utf-8")
    book = json.loads(t[t.index(".push(") + 6:].strip().rstrip(";").rstrip(")"))
    words = [w for u in book["units"] for w in u["words"]]
    groups = {name: [] for name, _ in IELTS_TOPICS}
    groups.update({"动作与过程": [], "描述与评价": [], "综合词汇": []})
    for wd in words:
        m = wd[2]
        scores = [(len(re.findall(kw, m)), i) for i, (_, kw) in enumerate(IELTS_TOPICS)]
        best, i = max(scores, key=lambda x: (x[0], -x[1]))
        if best:
            groups[IELTS_TOPICS[i][0]].append(wd)
        elif re.match(r"^v[it]?\.", m):
            groups["动作与过程"].append(wd)
        elif re.match(r"^(adj|adv|a)\.", m):
            groups["描述与评价"].append(wd)
        else:
            groups["综合词汇"].append(wd)
    units = []
    for name, ws in groups.items():
        parts = [ws[i:i + UNIT] for i in range(0, len(ws), UNIT)]
        # 最后一小份并到前一个单元
        if len(parts) > 1 and len(parts[-1]) < UNIT // 3:
            last = parts.pop()
            parts[-1] += last
        for j, part in enumerate(parts):
            units.append({"title": f"{name} {j + 1}" if len(parts) > 1 else name, "en": f"{len(part)} 词", "words": part})
        print(f"  {name:6} {len(ws):4} 词，{len(parts)} 个单元")
    write_book("ielts_topic", "雅思主题词汇", "雅思词汇按话题分章：自然地理、科技、教育、健康……同一个话题的词放在一起记", units,
               "雅思词汇按话题分章（词条来自 vocab_ielts.js）")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    build_domains()
    print("雅思主题词汇：")
    build_ielts_topics()
    import build_vocab_index  # 词书内容变了，启动时加载的目录也要跟着更新
    build_vocab_index.main()
