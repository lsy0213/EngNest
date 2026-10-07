"""下载公有领域名著全文，按章节切分，生成阅读页「原著全文」书架的数据。

来源：Project Gutenberg 的纯文本版（这些作品都已进入公有领域）。脚本会去掉 Gutenberg 的版权声明页眉页脚、
插图标记和斜体标记，只保留正文。

    python tools/fetch_books.py

输出：web/data/books_index.js（书目：书名、作者、难度、中文简介、每章标题和词数，启动时加载）
      web/data/books/<id>.js（每本书的正文，打开这本书时才加载）
原始文本缓存在 tools/raw/books/。
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "books"
OUT = ROOT / "web" / "data"
MIN_SECTION = 200  # 目录里的章节标题后面几乎没有正文，用这个长度把它们筛掉

# id：阅读页「名著简读」里有同名文章时，两边会互相链接
# pat：章节标题（去掉首尾空白后整行匹配）；num：标题前加「Chapter N」；next_title：标题在下一行
# dedupe：同一个章节号出现多次时只留最后一次（目录最后一条后面紧跟着前言，长度筛不掉时用）
# chapters：预期章节数，用来检查切分结果
BOOKS = [
    dict(id="oz", pg=55, title="The Wonderful Wizard of Oz", zh="绿野仙踪", author="L. Frank Baum", year=1900, level="较易", chapters=24,
         pat=r"Chapter ([IVXL]+)\.?\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="堪萨斯的小女孩多萝西被龙卷风卷到奥兹国，和稻草人、铁皮人、胆小的狮子一起去翡翠城找魔法师。句子短、情节简单，很适合作为读的第一本英文原著。"),
    dict(id="happyprince", pg=902, title="The Happy Prince and Other Tales", zh="快乐王子及其他故事", author="Oscar Wilde", year=1888, level="较易", chapters=5,
         pat=r"(The Happy Prince|The Nightingale and the Rose|The Selfish Giant|The Devoted Friend|The Remarkable Rocket)\.", num=False,
         intro="王尔德写的五篇童话，包括《快乐王子》《夜莺与玫瑰》《自私的巨人》。每篇都不长，语言优美，结尾常常让人久久回味。"),
    dict(id="peterpan", pg=16, title="Peter Pan", zh="彼得·潘", author="J. M. Barrie", year=1911, level="较易", chapters=17,
         pat=r"Chapter ([IVXL]+)\.?\s*(.*)", num=True, next_title=True,
         intro="永远长不大的男孩彼得·潘带着温迪和弟弟们飞往梦幻岛，遇到小仙子叮当、迷失的男孩们和胡克船长。关于童年与成长的经典故事。"),
    dict(id="alice", pg=11, title="Alice's Adventures in Wonderland", zh="爱丽丝梦游仙境", author="Lewis Carroll", year=1865, level="较易", chapters=12,
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, next_title=True,
         intro="爱丽丝追着一只揣着怀表的白兔掉进兔子洞，来到一个一切都不讲道理的奇幻世界。书里有很多文字游戏和双关语，读起来很有意思。"),
    dict(id="callwild", pg=215, title="The Call of the Wild", zh="野性的呼唤", author="Jack London", year=1903, level="较易", chapters=7,
         pat=r"Chapter ([IVX]+)\.\s*(.*)", num=True,
         intro="家犬巴克被卖到阿拉斯加当雪橇狗，在严酷的淘金地带一步步找回祖先的野性。篇幅不长，节奏紧凑。"),
    dict(id="secretgarden", pg=113, title="The Secret Garden", zh="秘密花园", author="Frances Hodgson Burnett", year=1911, level="较易", chapters=27,
         pat=r"CHAPTER ([IVXL]+)\.?|[IVXL]+\. .+", num=True, next_title=True,
         intro="任性孤僻的玛丽被送到英国约克郡的古老庄园，发现了一座被锁了十年的花园。随着花园重新生长，孩子们也一起改变了。"),
    dict(id="timemachine", pg=35, title="The Time Machine", zh="时间机器", author="H. G. Wells", year=1895, level="较易", chapters=16,
         pat=r"([IVX]+)\.", num=True,
         intro="时间旅行者驾驶自己发明的机器来到公元 802701 年，发现人类分化成了两个种族。最早的时间旅行科幻小说之一。"),
    dict(id="carol", pg=46, title="A Christmas Carol", zh="圣诞颂歌", author="Charles Dickens", year=1843, level="中等", chapters=5,
         pat=r"STAVE ([IVX]+):\s*(.*)", num=True, label="Stave",
         intro="吝啬的老板斯克鲁奇在圣诞前夜被三个幽灵带去看自己的过去、现在和未来。狄更斯最广为流传的作品，只有五章。"),
    dict(id="jekyll", pg=43, title="The Strange Case of Dr. Jekyll and Mr. Hyde", zh="化身博士", author="Robert Louis Stevenson", year=1886, level="中等", chapters=10,
         pat=r"(STORY OF THE DOOR|SEARCH FOR MR\. HYDE|DR\. JEKYLL WAS QUITE AT EASE|THE CAREW MURDER CASE|INCIDENT OF THE LETTER|INCIDENT OF DR\. LANYON|"
             r"INCIDENT AT THE WINDOW|THE LAST NIGHT|DR\. LANYON.S NARRATIVE|HENRY JEKYLL.S FULL STATEMENT OF THE CASE)", num=False,
         intro="受人尊敬的杰基尔医生和凶残的海德先生之间，到底是什么关系？一部探讨人性善恶两面的中篇悬疑小说。"),
    dict(id="holmes", pg=1661, title="The Adventures of Sherlock Holmes", zh="福尔摩斯探案集", author="Arthur Conan Doyle", year=1892, level="中等", chapters=12,
         pat=r"([IVXL]+)\. ((?:THE|A) .+)", num=False, title_group=2,
         intro="十二个独立的短篇探案故事，包括《波希米亚丑闻》《红发会》《斑点带子案》。每篇一个案子，可以挑着读。"),
    dict(id="tomsawyer", pg=74, title="The Adventures of Tom Sawyer", zh="汤姆·索亚历险记", author="Mark Twain", year=1876, level="中等", chapters=36,
         pat=r"(?:CHAPTER ([IVXL]+)|(CONCLUSION))\.?", num=True,
         intro="密西西比河边小镇上的调皮男孩汤姆，逃学、刷篱笆、在墓地目击凶案、在山洞里寻宝。美式口语很多，读起来很生动。"),
    dict(id="treasure", pg=120, title="Treasure Island", zh="金银岛", author="Robert Louis Stevenson", year=1883, level="中等", chapters=34,
         pat=r"([IVXL]+)", num=True, next_title=True,
         intro="少年吉姆得到一张藏宝图，跟着寻宝船出海，却发现船上的厨子「高个子约翰·西尔弗」是海盗头子。经典海盗冒险故事。"),
    dict(id="anne", pg=45, title="Anne of Green Gables", zh="绿山墙的安妮", author="L. M. Montgomery", year=1908, level="中等", chapters=38,
         pat=r"CHAPTER ([IVXL]+)\.?\s*(.*)", num=True, next_title=True,
         intro="想象力丰富、话特别多的孤儿安妮被错领到绿山墙农舍，在爱德华王子岛上慢慢长大。温暖治愈的成长小说。"),
    dict(id="littlewomen", pg=514, title="Little Women", zh="小妇人", author="Louisa May Alcott", year=1868, level="中等", chapters=47,
         pat=r"CHAPTER ([A-Z]+(?:-[A-Z]+)?)\s*(.*)", num=True, next_title=True,
         intro="美国南北战争时期，马奇家四姐妹梅格、乔、贝思、艾米在贫困中相互扶持、各自成长。篇幅较长，可以慢慢读。"),
    dict(id="eighty", pg=103, title="Around the World in Eighty Days", zh="八十天环游地球", author="Jules Verne", year=1873, level="中等", chapters=37,
         pat=r"CHAPTER ([IVXL]+)\.?\s*(.*)", num=True, next_title=True,
         intro="英国绅士福格和人打赌，要在八十天内环游地球一周，带着仆人路路通坐火车、轮船甚至大象一路赶时间。（George Makepeace Towle 1873 年英译本）"),
    dict(id="gatsby", pg=64317, title="The Great Gatsby", zh="了不起的盖茨比", author="F. Scott Fitzgerald", year=1925, level="中等", chapters=9,
         pat=r"([IVX]+)", num=True, dedupe=True,
         intro="1920 年代的纽约长岛，神秘富豪盖茨比夜夜举办盛大派对，只为等一个人。篇幅不长，但文字很讲究。"),
    dict(id="crusoe", pg=521, title="Robinson Crusoe", zh="鲁滨逊漂流记", author="Daniel Defoe", year=1719, level="较难", chapters=20,
         pat=r"CHAPTER ([IVXL]+)[.—]\s*(.*)", num=True,
         intro="鲁滨逊在海难后独自流落荒岛二十八年，造房子、种粮食、驯养山羊，后来救下了「星期五」。三百年前的英语，有些拼写和用词比较老。"),
    dict(id="frankenstein", pg=84, title="Frankenstein", zh="弗兰肯斯坦", author="Mary Shelley", year=1818, level="较难", chapters=28,
         pat=r"((?:Letter|Chapter) \d+)", num=False,
         intro="年轻的科学家弗兰肯斯坦创造了一个生命，却因为它丑陋而抛弃了它。被世界拒绝的「怪物」开始复仇。公认的第一部科幻小说。"),
    dict(id="pride", pg=1342, title="Pride and Prejudice", zh="傲慢与偏见", author="Jane Austen", year=1813, level="较难", chapters=61,
         pat=r"(?:CHAPTER|Chapter) ([IVXLC]+)\.?\]?", num=True,
         intro="班内特家的二女儿伊丽莎白和傲慢的富人达西先生，从互相看不顺眼到彼此理解。对话多、讽刺含蓄，是练习阅读长句的好材料。"),
    dict(id="janeeyre", pg=1260, title="Jane Eyre", zh="简·爱", author="Charlotte Brontë", year=1847, level="较难", chapters=38,
         pat=r"CHAPTER ([IVXL]+)(?:—(.*))?", num=True,
         intro="孤女简·爱在寄人篱下和寄宿学校的艰难中长大，后来到桑菲尔德庄园当家庭教师，爱上了主人罗切斯特。第一人称叙述，情感细腻。"),

    # ---------- 第二批 ----------
    dict(id="aesop", pg=19994, title="The Aesop for Children", zh="伊索寓言（儿童版）", author="Aesop", year=1919, level="较易", chapters=None,
         caps_titles=True,
         intro="一百多则伊索寓言，《龟兔赛跑》《狐狸和葡萄》《狼来了》都在里面。每则只有几十到一两百词，结尾一句寓意，最适合刚开始读英文的人。"),
    dict(id="justso", pg=2781, title="Just So Stories", zh="原来如此的故事", author="Rudyard Kipling", year=1902, level="较易", chapters=12,
         caps_titles=True,
         intro="吉卜林讲给女儿听的十二个睡前故事：骆驼的驼峰是怎么来的？豹子身上为什么有斑点？语言有节奏感，适合朗读。"),
    dict(id="grimm", pg=2591, title="Grimms' Fairy Tales", zh="格林童话", author="Jacob & Wilhelm Grimm", year=1812, level="较易", chapters=63,
         caps_titles=True,
         intro="《白雪公主》《灰姑娘》《糖果屋》《小红帽》……六十多篇经典童话，每篇都不长。（Edgar Taylor 和 Marian Edwardes 的 19 世纪英译本）"),
    dict(id="andersen", pg=1597, title="Andersen's Fairy Tales", zh="安徒生童话", author="Hans Christian Andersen", year=1835, level="较易", chapters=18,
         caps_titles=True,
         intro="《皇帝的新装》《卖火柴的小女孩》《冰雪女王》等十八篇童话，有的温暖，有的忧伤。（19 世纪英译本）"),
    dict(id="willows", pg=289, title="The Wind in the Willows", zh="柳林风声", author="Kenneth Grahame", year=1908, level="较易", chapters=12,
         pat=r"([IVXL]+)\.", num=True, next_title=True, dedupe=True,
         intro="鼹鼠、河鼠、獾和爱炫耀的蟾蜍先生在河边的冒险和友谊。英国乡村风光描写很美，是很多英国人童年的回忆。"),
    dict(id="blackbeauty", pg=271, title="Black Beauty", zh="黑骏马", author="Anna Sewell", year=1877, level="较易", chapters=49,
         pat=r"(\d{1,2}) (.+)", num=True, dedupe=True,
         intro="一匹黑马用第一人称讲述自己从小马驹到拉车马的一生，遇到过好主人，也受过虐待。每章很短，语言平实。"),
    dict(id="princess", pg=146, title="A Little Princess", zh="小公主", author="Frances Hodgson Burnett", year=1905, level="较易", chapters=19,
         pat=r"(\d{1,2})", num=True, next_title=True, dedupe=True,
         intro="富家女萨拉在寄宿学校里突然变得一无所有，被迫做女仆，却始终像公主一样善良和有尊严。《秘密花园》作者的另一部名作。"),
    dict(id="railway", pg=1874, title="The Railway Children", zh="铁路边的孩子们", author="E. Nesbit", year=1906, level="较易", chapters=14,
         pat=r"Chapter ([IVXL]+)\.\s*(.*)", num=True, dedupe=True,
         intro="父亲突然被带走后，三个孩子跟着母亲搬到乡下铁路旁，在铁轨边结识了各种朋友，也慢慢解开了父亲的谜团。"),
    dict(id="heidi", pg=1448, title="Heidi", zh="海蒂", author="Johanna Spyri", year=1881, level="较易", chapters=23,
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, dedupe=True,
         intro="孤女海蒂被送到阿尔卑斯山上和脾气古怪的爷爷一起生活，山上的羊群、草地和朋友让她无比快乐。（Marion Edwards 早期英译本）"),
    dict(id="pollyanna", pg=1450, title="Pollyanna", zh="波丽安娜", author="Eleanor H. Porter", year=1913, level="较易", chapters=32,
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, dedupe=True,
         intro="孤女波丽安娜无论遇到什么事都能玩「找快乐的游戏」，慢慢改变了整个小镇的人。「Pollyanna」后来成了英语里「乐天派」的代名词。"),
    dict(id="jungle", pg=236, title="The Jungle Book", zh="丛林之书", author="Rudyard Kipling", year=1894, level="中等", chapters=7,
         titles=[r"Mowgli.s Brothers", r"Kaa.s Hunting", r"[“\"]?Tiger! Tiger![”\"]?", r"The White Seal", r"[“\"]?Rikki-Tikki-Tavi[”\"]?",
                 r"Toomai of the Elephants", r"Her Majesty.s Servants"],
         intro="被狼群养大的男孩毛克利，和黑豹巴希拉、棕熊巴鲁、老虎谢尔汗的故事，还有獴「里基-蒂基-塔维」大战眼镜蛇等七个短篇。"),
    dict(id="whitefang", pg=910, title="White Fang", zh="白牙", author="Jack London", year=1906, level="中等", chapters=25,
         pat=r"CHAPTER ([IVXL]+)\s*[—-]?\s*(.*)", num=True,
         intro="《野性的呼唤》的「反向」故事：一只四分之一狗血统的狼，在荒野和人类之间，从凶猛慢慢学会信任和爱。"),
    dict(id="hound", pg=2852, title="The Hound of the Baskervilles", zh="巴斯克维尔的猎犬", author="Arthur Conan Doyle", year=1902, level="中等", chapters=15,
         pat=r"Chapter (\d+)\.\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="荒原上的古老家族传说：一只魔犬世代纠缠着巴斯克维尔家族。福尔摩斯最有名的长篇探案，悬念一直保持到最后。"),
    dict(id="scarlet", pg=244, title="A Study in Scarlet", zh="血字的研究", author="Arthur Conan Doyle", year=1887, level="中等", chapters=14,
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, next_title=True,
         intro="福尔摩斯第一次登场：华生医生从阿富汗回来，和他合租贝克街 221B，随即卷入一桩墙上写着血字的谋杀案。"),
    dict(id="signfour", pg=2097, title="The Sign of the Four", zh="四签名", author="Arthur Conan Doyle", year=1890, level="中等", chapters=12,
         pat=r"Chapter ([IVXL]+)\.?\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="一位年轻女士每年都会收到一颗神秘的珍珠，背后牵出一批印度宝藏和一个约定。华生也在这个案子里遇到了未来的妻子。"),
    dict(id="memoirs", pg=834, title="The Memoirs of Sherlock Holmes", zh="福尔摩斯回忆录", author="Arthur Conan Doyle", year=1894, level="中等", chapters=12,
         pat=r"([IVXL]+)\.\s+(.+)", num=False, title_group=2, dedupe=True,
         intro="十二个短篇探案，包括《银色马》和福尔摩斯与莫里亚蒂教授在瀑布边决斗的《最后一案》。"),
    dict(id="fourmillion", pg=2776, title="The Four Million", zh="四百万（欧·亨利短篇集）", author="O. Henry", year=1906, level="中等", chapters=25,
         caps_titles=True,
         intro="欧·亨利写纽约普通人的二十五个短篇，包括《麦琪的礼物》《警察与赞美诗》。以出人意料的结尾闻名，每篇十几分钟就能读完。"),
    dict(id="seas", pg=164, title="Twenty Thousand Leagues under the Sea", zh="海底两万里", author="Jules Verne", year=1870, level="中等", chapters=46,
         pat=r"CHAPTER ([IVXL]+)\s*(.*)", num=True, next_title=True, start_after=r"PART ONE",
         intro="生物学家阿罗纳克斯被神秘的尼摩船长「请」上潜水艇鹦鹉螺号，在海底环游世界。（19 世纪英译本）"),
    dict(id="journey", pg=18857, title="A Journey to the Centre of the Earth", zh="地心游记", author="Jules Verne", year=1864, level="中等", chapters=44,
         pat=r"CHAPTER (\d+)\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="李登布洛克教授破解了一张古老的羊皮纸，带着侄子从冰岛的火山口一路深入地心。（19 世纪英译本）"),
    dict(id="warworlds", pg=36, title="The War of the Worlds", zh="世界大战", author="H. G. Wells", year=1898, level="中等", chapters=27,
         pat=r"([IVXL]+)\.", num=True, next_title=True,
         intro="火星人乘着「流星」降落在伦敦郊外，用三脚战斗机器和热射线横扫英国。外星人入侵题材的鼻祖。"),
    dict(id="invisible", pg=5230, title="The Invisible Man", zh="隐身人", author="H. G. Wells", year=1897, level="中等", chapters=28,
         pat=r"CHAPTER ([IVXL]+)\.?\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="一个裹满绷带的神秘陌生人住进乡村旅馆——他是发现了隐身方法的科学家，却因此一步步走向疯狂。"),
    dict(id="avonlea", pg=47, title="Anne of Avonlea", zh="少女安妮（安妮续集）", author="L. M. Montgomery", year=1909, level="中等", chapters=30,
         pat=r"([IVXL]+)", num=True, next_title=True, dedupe=True,
         intro="《绿山墙的安妮》续集：十六岁的安妮回到家乡当小学老师，还要照顾一对新来的双胞胎。"),
    dict(id="dorian", pg=174, title="The Picture of Dorian Gray", zh="道林·格雷的画像", author="Oscar Wilde", year=1890, level="中等", chapters=20,
         pat=r"CHAPTER ([IVXL]+)\.?\s*(.*)", num=True, dedupe=True,
         intro="美少年道林许愿：让画像替自己变老。从此他青春永驻，画像却随着他的罪恶越来越丑陋。王尔德唯一的长篇小说。"),
    dict(id="dracula", pg=345, title="Dracula", zh="德古拉", author="Bram Stoker", year=1897, level="中等", chapters=27,
         pat=r"CHAPTER ([IVXL]+)\s*(.*)", num=True, dedupe=True,
         intro="年轻律师乔纳森到特兰西瓦尼亚的城堡拜访德古拉伯爵，却发现主人是吸血鬼。全书由日记和书信组成，读起来很有代入感。"),
    dict(id="kidnapped", pg=421, title="Kidnapped", zh="诱拐", author="Robert Louis Stevenson", year=1886, level="较难", chapters=30,
         pat=r"CHAPTER ([IVXL]+)\s*(.*)", num=True, next_title=True, dedupe=True,
         intro="少年大卫被贪心的叔叔卖上贩奴船，船难后和流亡的苏格兰高地人艾伦一起逃亡。对话里有不少苏格兰方言。"),
    dict(id="huckfinn", pg=76, title="Adventures of Huckleberry Finn", zh="哈克贝利·费恩历险记", author="Mark Twain", year=1884, level="较难", chapters=43,
         pat=r"CHAPTER ([IVXL]+|THE LAST)\.?\s*(.*)", num=True, dedupe=True,
         intro="《汤姆·索亚》里的哈克和逃跑的黑奴吉姆坐着木筏顺密西西比河而下。被誉为「伟大的美国小说」，全书用南方方言写成，难度较高。"),
    dict(id="persuasion", pg=105, title="Persuasion", zh="劝导", author="Jane Austen", year=1817, level="较难", chapters=24,
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, dedupe=True,
         intro="安妮八年前听从劝告拒绝了心上人，如今他成了富有的海军上校回到身边。奥斯汀最后一部完整的小说，安静而深情。"),
    dict(id="sense", pg=161, title="Sense and Sensibility", zh="理智与情感", author="Jane Austen", year=1811, level="较难", chapters=50,
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, dedupe=True,
         intro="理智的姐姐埃莉诺和感性的妹妹玛丽安，面对爱情时完全不同的态度。奥斯汀出版的第一部小说。"),
    dict(id="emma", pg=158, title="Emma", zh="爱玛", author="Jane Austen", year=1815, level="较难", chapters=55,
         pat=r"CHAPTER ([IVXL]+)\.?", num=True,
         intro="聪明、漂亮又自以为是的爱玛热衷于给别人牵红线，结果一次次弄巧成拙，却看不清自己的心。"),
    dict(id="wuthering", pg=768, title="Wuthering Heights", zh="呼啸山庄", author="Emily Brontë", year=1847, level="较难", chapters=34,
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, dedupe=True,
         intro="荒原上的呼啸山庄里，弃儿希斯克利夫和凯瑟琳之间近乎疯狂的爱与复仇，延续了两代人。"),
    dict(id="twocities", pg=98, title="A Tale of Two Cities", zh="双城记", author="Charles Dickens", year=1859, level="较难", chapters=45,
         pat=r"CHAPTER ([IVXL]+)\.?\s*(.*)", num=True, next_title=True,
         intro="法国大革命时期的伦敦和巴黎，一个律师、一个法国贵族和他们共同爱着的女子。开头一句「这是最好的时代，也是最坏的时代」家喻户晓。"),
    dict(id="greatexp", pg=1400, title="Great Expectations", zh="远大前程", author="Charles Dickens", year=1861, level="较难", chapters=59,
         pat=r"Chapter ([IVXL]+)\.?", num=True, dedupe=True,
         intro="孤儿皮普突然得到一位神秘人的资助，要被培养成「上等人」。狄更斯晚年的代表作，写成长、虚荣与良心。"),

    # ---------- 第三批：英语学习书单里常被推荐的经典 + 近年进入美国公有领域的现代名著 ----------
    # 童话寓言
    dict(id="velveteen", pg=11757, title="The Velveteen Rabbit", zh="绒布小兔子", author="Margery Williams", year=1922, level="较易", chapters=1, whole=True, cat="fairy", pick=True,
         start_at=r"There was once a velveteen.*", fix=[("HERE was once a velveteen", "There was once a velveteen")], drop_indented=20, intro="一只绒布兔子被小男孩爱了很久很久，直到变旧、变破，却因此变成了「真的」。只有三千多词，十几分钟读完，是很多人读的第一本英文原著。"),
    dict(id="pinocchio", pg=500, title="The Adventures of Pinocchio", zh="木偶奇遇记", author="Carlo Collodi", year=1883, level="较易", chapters=36, cat="fairy",
         pat=r"CHAPTER (\d+)", num=True,
         intro="木匠老杰佩托做的木偶匹诺曹一说谎鼻子就变长，他逃学、被骗、被鲸鱼吞下，终于学会了做一个真正的孩子。每章开头有一句内容提要。（Carol Della Chiesa 英译本）"),
    dict(id="bluefairy", pg=503, title="The Blue Fairy Book", zh="蓝色童话书", author="Andrew Lang", year=1889, level="中等", chapters=None, caps_titles=True, cat="fairy",
         intro="安德鲁·朗编的世界童话集：《阿拉丁神灯》《睡美人》《美女与野兽》《穿靴子的猫》《东方之东，月亮之西》……三十七篇，英国几代孩子都读过。"),
    # 儿童与成长
    dict(id="lookingglass", pg=12, title="Through the Looking-Glass", zh="爱丽丝镜中奇遇", author="Lewis Carroll", year=1871, level="较易", chapters=11, cat="kids",
         pat=r"CHAPTER ([IVXL]+)\.", num=True, next_title=True, dedupe=True,
         intro="《爱丽丝梦游仙境》的续集：爱丽丝穿过镜子，走进一盘巨大的国际象棋，从小卒一路走成王后。著名的胡话诗《Jabberwocky》就出自这本。"),
    dict(id="pooh", pg=67098, title="Winnie-the-Pooh", zh="小熊维尼", author="A. A. Milne", year=1926, level="较易", chapters=10, cat="kids", pick=True,
         pat=r"CHAPTER ([IVXL]+)", num=True, next_title=True,
         intro="百亩森林里爱吃蜂蜜的小熊维尼、胆小的小猪、忧郁的驴子屹耳和克里斯托弗·罗宾。句子简单又幽默，2022 年起在美国进入公有领域。"),
    dict(id="dolittle", pg=501, title="The Story of Doctor Dolittle", zh="杜立德医生的故事", author="Hugh Lofting", year=1920, level="较易", chapters=None, cat="kids", pick=True,
         pat=r"_THE ([A-Z]+(?:-[A-Z]+)?) CHAPTER_", num=True, next_title=True,
         intro="会说动物语言的杜立德医生，带着鹦鹉、小狗、小猪和猴子们远渡非洲，去给生病的猴子治病。故事简单，词汇很生活化。"),
    dict(id="daddylong", pg=157, title="Daddy-Long-Legs", zh="长腿叔叔", author="Jean Webster", year=1912, level="较易", chapters=None, chunk=3200, cat="kids", pick=True,
         start_at=r"Blue Wednesday", intro="孤儿朱迪被一位神秘的资助人送进大学，条件是每个月给他写一封信。全书就是这些信：俏皮、真诚，像在读一个女孩的日记，非常适合练习地道的书面口语。"),
    dict(id="fivechildren", pg=778, title="Five Children and It", zh="五个孩子和一个怪物", author="E. Nesbit", year=1902, level="较易", chapters=11, cat="kids",
         pat=r"CHAPTER (\d+)", num=True, next_title=True,
         intro="五个孩子在沙坑里挖出一只脾气古怪的沙精，它每天能实现一个愿望——可每个愿望都会出点岔子。《铁路边的孩子们》作者的另一部名作。"),
    dict(id="goblin", pg=708, title="The Princess and the Goblin", zh="公主与妖精", author="George MacDonald", year=1872, level="较易", chapters=32, cat="kids",
         pat=r"CHAPTER (\d+)", num=True, next_title=True,
         intro="小公主艾琳住在山间的城堡里，山底下的妖精们正在策划一个阴谋；矿工的儿子柯迪用歌声和勇气保护她。影响过托尔金和 C. S. 刘易斯的奇幻童话。"),
    dict(id="rebecca", pg=498, title="Rebecca of Sunnybrook Farm", zh="太阳溪农场的丽贝卡", author="Kate Douglas Wiggin", year=1903, level="较易", chapters=None, cat="kids",
         pat=r"([IVXL]+)", num=True, next_title=True, dedupe=True,
         intro="聪明活泼、满脑子奇思妙想的丽贝卡被送到两位严厉的姨妈家里生活上学。和《绿山墙的安妮》风格很像的美国成长小说。"),
    dict(id="fauntleroy", pg=479, title="Little Lord Fauntleroy", zh="小爵爷", author="Frances Hodgson Burnett", year=1886, level="较易", chapters=15, cat="kids",
         pat=r"([IVXL]+)", num=True,
         intro="纽约穷人家的小男孩塞德里克突然得知自己是英国伯爵的继承人，他的善良慢慢融化了冷酷的老伯爵。《秘密花园》作者的成名作。"),
    dict(id="landoz", pg=54, title="The Marvelous Land of Oz", zh="奥兹国仙境", author="L. Frank Baum", year=1904, level="较易", chapters=None, chunk=3200, cat="kids",
         start_at=r"Tip Manufactures a Pumpkinhead", intro="《绿野仙踪》的续集：男孩蒂普带着南瓜头杰克和一匹被魔粉变活的木马逃出女巫的手掌，稻草人和铁皮人也再次登场。"),
    # 冒险
    dict(id="robinhood", pg=10148, title="The Merry Adventures of Robin Hood", zh="罗宾汉历险记", author="Howard Pyle", year=1883, level="中等", chapters=None, chunk=4000, cat="adventure",
         start_at=r"PROLOGUE", intro="舍伍德森林里的侠盗罗宾汉和小约翰、塔克修士、快活的伙伴们劫富济贫、捉弄诺丁汉郡长。用的是仿古英语（thee、thou），读起来别有味道。"),
    dict(id="solomon", pg=2166, title="King Solomon's Mines", zh="所罗门王的宝藏", author="H. Rider Haggard", year=1885, level="中等", chapters=20, cat="adventure",
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, next_title=True, dedupe=True,
         intro="猎人艾伦·夸特梅因带着两位英国绅士，按一张三百年前的地图穿越沙漠，寻找传说中所罗门王的钻石矿。「失落世界」冒险小说的开山之作。"),
    dict(id="zenda", pg=95, title="The Prisoner of Zenda", zh="曾达的囚徒", author="Anthony Hope", year=1894, level="中等", chapters=22, cat="adventure",
         pat=r"CHAPTER (\d+)", num=True, next_title=True,
         intro="英国绅士鲁道夫长得和一个小国的国王一模一样，国王在加冕前夜被绑架，他只好冒名顶替。节奏明快的宫廷冒险。"),
    dict(id="pimpernel", pg=60, title="The Scarlet Pimpernel", zh="红花侠", author="Baroness Orczy", year=1905, level="中等", chapters=31, cat="adventure",
         pat=r"CHAPTER ([IVXL]+)\.", num=True, next_title=True,
         intro="法国大革命恐怖时期，一个只留下红色小花标记的神秘英国人，一次次把贵族从断头台下救走。他究竟是谁？最早的「双重身份」英雄。"),
    dict(id="captains", pg=2186, title="Captains Courageous", zh="勇敢的船长", author="Rudyard Kipling", year=1897, level="中等", chapters=10, cat="adventure",
         pat=r"CHAPTER\s+([IVX]+)", num=True,
         intro="被宠坏的富家少年哈维从邮轮上掉进大海，被一艘捕鳕鱼的渔船救起，在海上做了一整季渔工，变成了真正的男子汉。"),
    dict(id="princepauper", pg=1837, title="The Prince and the Pauper", zh="王子与贫儿", author="Mark Twain", year=1881, level="中等", chapters=None, cat="adventure",
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, dedupe=True,
         intro="长相一模一样的王子爱德华和贫儿汤姆互换了衣服，结果一个流落街头，一个被当成发了疯的王子。马克·吐温笔下的都铎王朝。"),
    dict(id="gulliver", pg=829, title="Gulliver's Travels", zh="格列佛游记", author="Jonathan Swift", year=1726, level="较难", chapters=None, cat="adventure",
         pat=r"CHAPTER ([IVX]+)\.?", num=True, next_title=True,
         intro="船医格列佛先后漂流到小人国、大人国、飞岛国和慧骃国。表面是奇幻游记，其实处处是对当时英国社会的讽刺。三百年前的英语，句子很长。"),
    dict(id="musketeers", pg=1257, title="The Three Musketeers", zh="三个火枪手", author="Alexandre Dumas", year=1844, level="较难", chapters=None, cat="adventure",
         pat=r"Chapter ([IVXL]+)\.", num=True, next_title=True, dedupe=True,
         intro="乡下青年达达尼昂来到巴黎，和阿多斯、波尔托斯、阿拉米斯三个火枪手结为生死之交，卷入王后与红衣主教的明争暗斗。篇幅很长。（19 世纪英译本）"),
    dict(id="mobydick", pg=2701, title="Moby-Dick", zh="白鲸", author="Herman Melville", year=1851, level="较难", chapters=None, cat="adventure",
         pat=r"CHAPTER (\d+)\.\s*(.*)", num=True, dedupe=True,
         intro="「叫我以实玛利吧。」捕鲸船船长亚哈发誓要追杀咬掉他一条腿的白鲸莫比·迪克。美国文学的巨著，夹杂大量航海和捕鲸知识，难度很高。"),
    # 侦探推理
    dict(id="styles", pg=863, title="The Mysterious Affair at Styles", zh="斯泰尔斯庄园奇案", author="Agatha Christie", year=1920, level="中等", chapters=13, cat="mystery", pick=True,
         pat=r"CHAPTER ([IVXL]+)\.", num=True, next_title=True, dedupe=True,
         intro="阿加莎·克里斯蒂的第一部小说，比利时侦探波洛首次登场：庄园女主人深夜中毒身亡，嫌疑人个个有动机。语言比福尔摩斯更现代、更好读。"),
    dict(id="adversary", pg=1155, title="The Secret Adversary", zh="暗藏杀机", author="Agatha Christie", year=1922, level="中等", chapters=None, cat="mystery",
         pat=r"CHAPTER ([IVXL]+)\.\s*(.*)", num=True, dedupe=True,
         intro="战后找不到工作的年轻人汤米和塔彭丝合开了一家「冒险公司」，结果真的卷进了一桩国际阴谋。轻快的间谍冒险，对话很多。"),
    dict(id="ackroyd", pg=69087, title="The Murder of Roger Ackroyd", zh="罗杰疑案", author="Agatha Christie", year=1926, level="中等", chapters=None, cat="mystery",
         pat=r"CHAPTER ([IVXL]+)", num=True, next_title=True,
         intro="乡村富翁罗杰·艾克罗伊德在书房被刺，退休的波洛出山破案。结局是推理小说史上最著名的反转之一——千万别先查剧透。"),
    dict(id="fatherbrown", pg=204, title="The Innocence of Father Brown", zh="布朗神父的天真", author="G. K. Chesterton", year=1911, level="较难", chapters=None, caps_titles=True, cat="mystery",
         intro="矮小、笨拙、总拿着一把雨伞的布朗神父，凭着对人心的洞察破解一桩桩离奇案件。十二个短篇，文字机智，充满悖论。"),
    dict(id="returnholmes", pg=108, title="The Return of Sherlock Holmes", zh="福尔摩斯归来记", author="Arthur Conan Doyle", year=1905, level="中等", chapters=13, cat="mystery",
         pat=r"(THE ADVENTURE OF .+)", num=False, dedupe=True,
         intro="福尔摩斯「死而复生」，回到贝克街。包括《空屋》《跳舞的人》《六座拿破仑半身像》等十三个短篇。"),
    dict(id="valleyfear", pg=3289, title="The Valley of Fear", zh="恐怖谷", author="Arthur Conan Doyle", year=1915, level="中等", chapters=None, cat="mystery",
         pat=r"Chapter ([IVX]+)", num=True, next_title=True,
         intro="一封密码信预告了一桩谋杀，案子牵出美国矿区一个恐怖组织的往事。福尔摩斯的最后一部长篇，宿敌莫里亚蒂在幕后若隐若现。"),
    dict(id="lupin", pg=6133, title="The Extraordinary Adventures of Arsène Lupin, Gentleman-Burglar", zh="侠盗亚森·罗宾", author="Maurice Leblanc", year=1907, level="中等", chapters=9, cat="mystery",
         pat=r"([IVX]+)\. (.+)", num=False, title_group=2, dedupe=True,
         intro="法国「绅士大盗」亚森·罗宾的九个短篇：在船上被捕、在监狱里预告越狱、和福尔摩斯过招。（英译本）"),
    dict(id="thirtynine", pg=558, title="The Thirty-Nine Steps", zh="三十九级台阶", author="John Buchan", year=1915, level="中等", chapters=10, cat="mystery",
         pat=r"Chapter ([IVX]+)\.", num=True, next_title=True, dedupe=True,
         intro="伦敦的理查德·汉内被卷进一桩间谍谋杀案，一边被警察通缉、一边被敌国特务追杀，逃进苏格兰荒原。只有十章，一口气就能读完的惊险小说。"),
    # 科幻
    dict(id="moreau", pg=159, title="The Island of Doctor Moreau", zh="莫罗博士的岛", author="H. G. Wells", year=1896, level="中等", chapters=22, cat="scifi",
         pat=r"([IVXL]+)\.", num=True, next_title=True,
         intro="海难幸存者普伦迪克被带到一座孤岛，发现莫罗博士正在把动物「改造」成人。关于科学伦理的经典科幻。"),
    dict(id="lostworld", pg=139, title="The Lost World", zh="失落的世界", author="Arthur Conan Doyle", year=1912, level="中等", chapters=16, cat="scifi",
         pat=r"CHAPTER ([IVXL]+)", num=True, next_title=True,
         intro="脾气火爆的查林杰教授宣称南美高原上还活着恐龙，记者马隆跟着探险队去一探究竟。《侏罗纪公园》的老祖宗。"),
    dict(id="marsprincess", pg=62, title="A Princess of Mars", zh="火星公主", author="Edgar Rice Burroughs", year=1912, level="中等", chapters=28, cat="scifi",
         pat=r"CHAPTER ([IVXL]+)", num=True, next_title=True,
         intro="美国内战老兵约翰·卡特被神秘地传送到火星，在四臂绿人和红火星人之间征战，爱上了火星公主。太空冒险小说的源头。"),
    dict(id="earthmoon", pg=83, title="From the Earth to the Moon; and, Round the Moon", zh="从地球到月球", author="Jules Verne", year=1865, level="中等", chapters=None, cat="scifi",
         pat=r"CHAPTER ([IVXL]+)\.", num=True, next_title=True,
         intro="美国「大炮俱乐部」决定造一门巨炮，把炮弹连同三个人一起射向月球。凡尔纳对太空旅行的预言，很多细节和一百年后的阿波罗登月惊人地相似。（含续篇《环绕月球》）"),
    dict(id="herland", pg=32, title="Herland", zh="她乡", author="Charlotte Perkins Gilman", year=1915, level="中等", chapters=12, cat="scifi",
         pat=r"CHAPTER (\d+)\.", num=True, next_title=True,
         intro="三个男探险家闯进一个与世隔绝了两千年、只有女性的国度。轻松幽默的乌托邦小说，借三个男人的眼睛反思社会习以为常的观念。"),
    dict(id="we", pg=61963, title="We", zh="我们", author="Yevgeny Zamyatin", year=1924, level="较难", chapters=None, cat="scifi",
         pat=r"(RECORD [A-Z]+(?:[- ][A-Z]+)?)", num=False, dedupe=True,
         intro="人人只有编号、生活被时间表精确安排的「大一统国」里，工程师 D-503 的日记。反乌托邦小说的鼻祖，直接影响了《1984》和《美丽新世界》。（Zilboorg 1924 年英译本）"),
    # 哥特与惊悚
    dict(id="sleepyhollow", pg=41, title="The Legend of Sleepy Hollow", zh="睡谷传说", author="Washington Irving", year=1820, level="中等", chapters=1, whole=True, cat="gothic",
         start_at=r"FOUND AMONG THE PAPERS OF THE LATE DIEDRICH KNICKERBOCKER\.", intro="胆小又贪吃的乡村教师伊卡博德，在月夜的林间小路上遇到了传说中的「无头骑士」。美国最早的经典短篇之一，一万多词。"),
    dict(id="turnscrew", pg=209, title="The Turn of the Screw", zh="螺丝在拧紧", author="Henry James", year=1898, level="较难", chapters=None, cat="gothic",
         pat=r"([IVX]+)", num=True, dedupe=True,
         intro="一位年轻的家庭教师来到乡间庄园照顾两个孩子，却开始看见已经死去的前任仆人的身影——是真的鬼魂，还是她的幻觉？句子绵长曲折，难度较高。"),
    dict(id="phantom", pg=175, title="The Phantom of the Opera", zh="歌剧魅影", author="Gaston Leroux", year=1910, level="中等", chapters=None, cat="gothic",
         pat=r"Chapter ([IVXL]+)\s+(.*)", num=True,
         intro="巴黎歌剧院的地下深处住着一个戴面具的「幽灵」，他爱上了年轻的女高音克里斯汀。同名音乐剧的原著。（英译本）"),
    dict(id="carmilla", pg=10007, title="Carmilla", zh="卡米拉", author="Sheridan Le Fanu", year=1872, level="中等", chapters=16, cat="gothic",
         pat=r"([IVX]+)\.?", num=True, next_title=True, dedupe=True,
         intro="施蒂利亚森林城堡里的少女劳拉，迎来了一位美丽而神秘的客人卡米拉。比《德古拉》早 25 年的吸血鬼小说，只有五万字。"),
    # 经典文学
    dict(id="ethan", pg=4517, title="Ethan Frome", zh="伊坦·弗洛美", author="Edith Wharton", year=1911, level="中等", chapters=None, cat="classic",
         pat=r"([IVX]+)", num=True,
         intro="新英格兰冬天的贫瘠农庄里，伊坦被困在病弱的妻子身边，爱上了妻子的表妹马蒂。篇幅很短，文字冷峻，结局令人难忘。"),
    dict(id="roomview", pg=2641, title="A Room with a View", zh="看得见风景的房间", author="E. M. Forster", year=1908, level="中等", chapters=20, cat="classic",
         pat=r"Chapter ([IVX]+)", num=True, next_title=True,
         intro="英国少女露西在佛罗伦萨旅行时遇到了不拘礼节的乔治，回到英国后，她要在体面的未婚夫和自己的心之间做出选择。轻快幽默的爱情小说。"),
    dict(id="farewell", pg=75201, title="A Farewell to Arms", zh="永别了，武器", author="Ernest Hemingway", year=1929, level="中等", chapters=41, cat="classic",
         pat=r"CHAPTER ([IVXL]+)", num=True,
         intro="一战意大利前线的美国救护车司机亨利，爱上了英国护士凯瑟琳。海明威标志性的短句和简单词汇，读起来不难，却有很强的力量。2025 年在美国进入公有领域。"),
    dict(id="sunrises", pg=67138, title="The Sun Also Rises", zh="太阳照常升起", author="Ernest Hemingway", year=1926, level="中等", chapters=19, cat="classic",
         pat=r"(CHAPTER)", num=True, drop_next=r"\d+|[IVXL]+",
         intro="一战后旅居巴黎的「迷惘的一代」：记者杰克和朋友们从巴黎的酒吧一路到西班牙潘普洛纳看斗牛。对话多、句子短，是学习简洁英语的好范本。"),
    dict(id="oliver", pg=730, title="Oliver Twist", zh="雾都孤儿", author="Charles Dickens", year=1838, level="较难", chapters=53, cat="classic",
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, next_title=True, dedupe=True,
         intro="济贫院里的孤儿奥利弗因为「还想再要一点粥」被赶出去，流落伦敦，落进了贼窝。狄更斯揭露社会黑暗的名作。"),
    dict(id="northanger", pg=121, title="Northanger Abbey", zh="诺桑觉寺", author="Jane Austen", year=1817, level="较难", chapters=31, cat="classic",
         pat=r"CHAPTER (\d+)", num=True, dedupe=True,
         intro="爱读哥特小说的少女凯瑟琳到巴斯社交，又受邀住进古老的诺桑觉寺，总怀疑里面藏着可怕的秘密。奥斯汀最轻松俏皮的一部，篇幅也最短。"),
    dict(id="silas", pg=550, title="Silas Marner", zh="织工马南", author="George Eliot", year=1861, level="较难", chapters=21, cat="classic",
         pat=r"CHAPTER ([IVXL]+)\.?", num=True, dedupe=True,
         intro="被诬陷偷窃的织工马南离群索居、守着金币过日子，金币被偷后，一个金发小女孩却走进了他的小屋。英国中学的经典课文书目。"),
    dict(id="ageinnocence", pg=541, title="The Age of Innocence", zh="纯真年代", author="Edith Wharton", year=1920, level="较难", chapters=None, cat="classic",
         pat=r"([IVXL]+)\.", num=True,
         intro="19 世纪 70 年代纽约上流社会，律师纽兰即将迎娶门当户对的梅，却爱上了她离经叛道的表姐埃伦。第一部由女性作家获得普利策奖的小说。"),
    # 短篇小说集
    dict(id="dubliners", pg=2814, title="Dubliners", zh="都柏林人", author="James Joyce", year=1914, level="较难", chapters=15, caps_titles=True, cat="short",
         intro="乔伊斯写都柏林普通人的十五个短篇，包括《阿拉比》《伊芙琳》《死者》。每篇都在一个小小的「顿悟」时刻戛然而止。"),
    dict(id="gardenparty", pg=1429, title="The Garden Party, and Other Stories", zh="花园茶会", author="Katherine Mansfield", year=1922, level="中等", chapters=None, caps_titles=True, cat="short",
         intro="曼斯菲尔德的十五个短篇，捕捉日常生活里细微的情绪变化。《花园茶会》《一杯茶》常被选进英语课本。"),
    dict(id="awakening", pg=160, title="The Awakening, and Selected Short Stories", zh="觉醒（附短篇）", author="Kate Chopin", year=1899, level="中等", chapters=None, chunk=4000, cat="short",
         start_at=r"A green and yellow parrot.*", intro="中篇《觉醒》写一个新奥尔良的年轻母亲在海边度假时慢慢「醒来」，想要过自己的人生；另附《黛西蕾的婴孩》《一小时的故事》等短篇。"),
    # 戏剧
    dict(id="earnest", pg=844, title="The Importance of Being Earnest", zh="不可儿戏", author="Oscar Wilde", year=1895, level="中等", chapters=3, cat="drama", pick=True,
         pat=r"((?:FIRST|SECOND|THIRD) ACT)", num=False,
         intro="两个绅士都假冒「欧内斯特」去追求心上人，谎言越滚越大。王尔德最受欢迎的喜剧，全是机智的对白，适合拿来练口语和朗读。"),
    dict(id="pygmalion", pg=3825, title="Pygmalion", zh="卖花女", author="Bernard Shaw", year=1913, level="中等", chapters=5, cat="drama",
         pat=r"ACT ([IV]+)", num=True, label="Act",
         intro="语音学教授希金斯打赌，能把满口伦敦土腔的卖花女伊莉莎训练成上流社会的淑女。电影《窈窕淑女》的原著，讲的正是「发音」的故事。"),
    dict(id="dollhouse", pg=2542, title="A Doll's House", zh="玩偶之家", author="Henrik Ibsen", year=1879, level="中等", chapters=3, cat="drama",
         pat=r"ACT (I{1,3})\.?", num=True, label="Act", dedupe=True,
         intro="看似幸福的家庭主妇娜拉，为了丈夫偷偷借过一笔钱。秘密暴露后，她终于看清了自己的处境。结尾的那声关门声「震动了整个欧洲」。（英译本）"),
    dict(id="romeo", pg=1513, title="Romeo and Juliet", zh="罗密欧与朱丽叶", author="William Shakespeare", year=1597, level="较难", chapters=5, cat="drama",
         pat=r"ACT ([IV]+)\.?", num=True, label="Act", dedupe=True,
         intro="维罗纳两个世仇家族的少年少女一见钟情。莎士比亚最有名的爱情悲剧。早期现代英语，建议对照中文译本或先看电影再读。"),
    dict(id="macbeth", pg=1533, title="Macbeth", zh="麦克白", author="William Shakespeare", year=1606, level="较难", chapters=5, cat="drama",
         pat=r"ACT ([IV]+)\.?", num=True, label="Act", dedupe=True,
         intro="三个女巫预言麦克白将成为国王，他在妻子的怂恿下弑君篡位，从此陷入猜疑和杀戮。莎士比亚最短的悲剧。"),
    dict(id="hamlet", pg=1524, title="Hamlet", zh="哈姆雷特", author="William Shakespeare", year=1601, level="较难", chapters=5, cat="drama",
         pat=r"ACT ([IV]+)\.?", num=True, label="Act", dedupe=True,
         intro="丹麦王子哈姆雷特从父亲的鬼魂口中得知叔叔弑兄篡位，在复仇与犹豫之间挣扎。「To be, or not to be」就出自这里。"),
    # 传记与思想
    dict(id="storymylife", pg=2397, title="The Story of My Life", zh="我的人生故事", author="Helen Keller", year=1903, level="较易", chapters=23, cat="nonfic", pick=True,
         pat=r"CHAPTER ([IVXL]+)", num=True, stop_at=r"II\. LETTERS.*",
         intro="又聋又盲的海伦·凯勒讲述自己如何在莎莉文老师的帮助下学会语言、读完大学。语言清楚平实，那一段「水」的顿悟尤其动人。（只收自传正文）"),
    dict(id="douglass", pg=23, title="Narrative of the Life of Frederick Douglass", zh="道格拉斯自传", author="Frederick Douglass", year=1845, level="中等", chapters=11, cat="nonfic",
         pat=r"CHAPTER ([IVX]+)\.?", num=True, dedupe=True,
         intro="生为奴隶的道格拉斯偷偷学会读书写字，最终逃到北方，成为废奴运动的领袖。「知识是通往自由的道路」，篇幅短而有力。"),
    dict(id="upfromslavery", pg=2376, title="Up from Slavery", zh="超越奴役", author="Booker T. Washington", year=1901, level="中等", chapters=17, cat="nonfic",
         pat=r"Chapter ([IVX]+)\.", num=True, next_title=True,
         intro="生于奴隶小屋的布克·华盛顿，靠半工半读完成学业，创办了塔斯基吉学院。一本关于自强、勤奋和教育的自传。"),
    dict(id="franklin", pg=20203, title="Autobiography of Benjamin Franklin", zh="富兰克林自传", author="Benjamin Franklin", year=1791, level="较难", chapters=None, chunk=4000, cat="nonfic",
         start_at=r"ANCESTRY AND EARLY YOUTH IN", intro="印刷学徒出身的富兰克林讲自己怎样自学写作、创业、做公益，还有他著名的「十三条美德」修身计划。美国人的励志经典。"),
    dict(id="hours24", pg=2274, title="How to Live on 24 Hours a Day", zh="如何度过一天 24 小时", author="Arnold Bennett", year=1908, level="中等", chapters=None, cat="nonfic", pick=True,
         pat=r"([IVX]+)", num=True, next_title=True, dedupe=True,
         intro="一百多年前的时间管理小册子：每天上下班路上和晚上的几个小时，怎么用来读书和提升自己。只有一万多词，观点至今不过时。"),
    dict(id="artofwar", pg=17405, title="The Art of War", zh="孙子兵法", author="Sun Tzu", year=-500, level="中等", chapters=13, cat="nonfic",
         pat=r"([IVX]+)\. ([A-Z][A-Z ,’'Œ-]+)", num=False, title_group=2, dedupe=True,
         intro="翟林奈（Lionel Giles）1910 年的经典英译本，没有注释的纯正文版。中文读者熟悉内容，正好用来学习英文怎么表达「知己知彼」这类说法。"),
    dict(id="meditations", pg=2680, title="Meditations", zh="沉思录", author="Marcus Aurelius", year=180, level="较难", chapters=12, cat="nonfic",
         pat=r"(?:THE )?([A-Z]+) BOOK", num=True, label="Book", dedupe=True,
         intro="罗马皇帝马可·奥勒留写给自己的哲学笔记：如何面对他人、挫折和死亡。（Meric Casaubon 17 世纪英译本，语言比较古老）"),
    dict(id="prophet", pg=58585, title="The Prophet", zh="先知", author="Kahlil Gibran", year=1923, level="中等", chapters=None, chunk=2500, cat="nonfic",
         start_at=r"Almustafa, the chosen and the", intro="先知亚墨斯达法在离开奥法利斯城之前，回答人们关于爱、婚姻、孩子、工作、欢乐与悲伤的提问。散文诗，语言优美，适合朗读和摘抄。"),
]
LEVEL_ORDER = ["较易", "中等", "较难"]
# 书架分类（第一、二批的书在 CAT_OF 里归类，第三批在条目里写了 cat）
CATS = [["fairy", "🧚 童话寓言"], ["kids", "🧸 儿童与成长"], ["adventure", "🧭 冒险"], ["mystery", "🔍 侦探推理"], ["scifi", "🚀 科幻"],
        ["gothic", "🕯️ 哥特与惊悚"], ["classic", "🎩 经典文学"], ["short", "📝 短篇小说"], ["drama", "🎭 戏剧"], ["nonfic", "📜 传记与思想"]]
CAT_OF = {
    "fairy": "happyprince aesop justso grimm andersen",
    "kids": "oz peterpan alice secretgarden anne littlewomen willows blackbeauty princess railway heidi pollyanna avonlea",
    "adventure": "callwild treasure tomsawyer eighty crusoe jungle whitefang kidnapped huckfinn",
    "mystery": "holmes hound scarlet signfour memoirs",
    "scifi": "timemachine seas journey warworlds invisible",
    "gothic": "jekyll frankenstein dorian dracula",
    "classic": "carol gatsby pride janeeyre persuasion sense emma wuthering twocities greatexp",
    "short": "fourmillion",
}
CAT_OF = {bid: c for c, ids in CAT_OF.items() for bid in ids.split()}
# 第一次读原著推荐从这些开始（前两批里挑的）
PICKS = {"oz", "aesop", "happyprince", "alice", "callwild", "carol", "holmes", "gatsby"}


def fetch(b: dict) -> str:
    path = RAW / f"{b['id']}.txt"
    if not path.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        url = f"https://www.gutenberg.org/cache/epub/{b['pg']}/pg{b['pg']}.txt"
        print("  下载", url)
        urllib.request.urlretrieve(url, path)
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    start = re.search(r"^\*\*\* ?START OF.*$", text, re.M)
    end = re.search(r"^\*\*\* ?END OF", text, re.M)
    return text[start.end():end.start()]


def title_case(s: str) -> str:
    s = s.strip(" .:—-")
    if s.isupper():
        small = {"a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "by", "with"}
        words = s.lower().split()
        s = " ".join(w if i and w in small else w[:1].upper() + w[1:] for i, w in enumerate(words))
    return s


def clean_paragraphs(text: str) -> list:
    text = re.sub(r"\[(?:Illustration|Picture)[^\]]*\]", "", text)
    text = re.sub(r"\[(?:Illustration|Picture)[^\]]*$", "", text)  # 跨章节没闭合的插图标记
    text = re.sub(r"^[^\[\n]*\]\s*$", "", text, flags=re.M)        # 上一章留下的插图标记结尾
    text = re.sub(r"_([^_\n]+(?:\n[^_\n]+)*)_", r"\1", text)        # _斜体_
    paras = []
    for block in re.split(r"\n\s*\n", text):
        p = re.sub(r"\s+", " ", block).strip()
        if not p or re.fullmatch(r"[*\s.]+|THE END\.?|PART [A-Z]+.*|FINIS\.?", p, re.I):
            continue
        paras.append(p)
    return paras


def _title_key(s: str) -> str:
    """比较标题用：去掉页码、结尾标点和引号，忽略大小写"""
    s = re.sub(r"\s{2,}\d+$|\s*\.{2,}.*$", "", s.strip())
    return re.sub(r"[^a-z0-9]+", " ", s.lower().replace("’", "'")).strip()


def caps_title_lines(lines: list) -> list:
    """故事集：从书自带的目录里读出各篇标题，返回它们在正文里作为独立一行出现的那几行（正则）。"""
    start = next(i for i, l in enumerate(lines) if re.match(r"^\s*(TABLE OF )?CONTENTS:?\s*$|^\s*A LIST OF THE FABLES\s*$", l, re.I))
    standalone = {}
    for i in range(start + 1, len(lines)):
        s = lines[i].strip()
        if s and len(s) < 70 and not lines[i - 1].strip() and (i + 1 >= len(lines) or not lines[i + 1].strip()):
            standalone.setdefault(_title_key(s), []).append(s)
    titles = []
    for l in lines[start + 1:start + 600]:
        k = _title_key(l)
        if titles and k == _title_key(titles[0]):
            break  # 回到了第一篇的标题：目录结束
        if not k or k in [_title_key(t) for t in titles] or k in ("page", "illustrations", "list of illustrations"):
            continue
        if l.strip()[:1] in "‘“\"'(" or re.match(r"^\d+\.\s", l.strip()):
            continue  # 引号开头的是对话；「1. …」是某一篇里面的小节，都不算单独的一篇
        if k in standalone:
            titles.append(l.strip())
    # 正文里的标题写法（可能和目录的大小写不同）；有全大写的写法就只用它，故事里碰巧单独成行的同名小写句子不算
    def variants(t):
        vs = standalone[_title_key(t)]
        return [v for v in vs if v.isupper()] or vs
    return sorted({re.escape(s) for t in titles for s in variants(t)})


def chunk_paragraphs(paras: list, target: int) -> list:
    """没有可靠章节标题的书：按段落切成每份约 target 词的「Part N」"""
    parts, cur, n = [], [], 0
    for p in paras:
        cur.append(p)
        n += len(p.split())
        if n >= target:
            parts.append(cur)
            cur, n = [], 0
    if cur:
        if parts and n < target / 3:
            parts[-1].extend(cur)  # 最后剩一点就并进上一份
        else:
            parts.append(cur)
    return [[f"Part {i + 1}", ps] for i, ps in enumerate(parts)]


def split_book(b: dict, body: str) -> list:
    for old, new in b.get("fix", []):  # 个别排版问题（比如首字下沉丢了第一个字母）
        body = body.replace(old, new)
    lines = body.split("\n")
    if b.get("drop_indented"):  # 缩进很深的单独一行是插图说明
        lines = [l for l in lines if len(l) - len(l.lstrip(" ")) < b["drop_indented"]]
    if b.get("stop_at"):  # 只要前面的正文（比如去掉书后附的书信集）
        stop = next((i for i, l in enumerate(lines) if re.match(rf"^\s*{b['stop_at']}\s*$", l)), len(lines))
        lines = lines[:stop]
    if b.get("start_after"):  # 跳过目录等前置内容，从这一行之后开始找章节
        s = next(i for i, l in enumerate(lines) if re.match(rf"^\s*{b['start_after']}\s*$", l))
        lines = lines[s + 1:]
    if b.get("start_at"):  # 同上，但包括这一行（比如第一封信的标题）
        s = next(i for i, l in enumerate(lines) if re.match(rf"^\s*{b['start_at']}\s*$", l))
        lines = lines[s:]
    if b.get("whole"):
        return [[b["title"], clean_paragraphs("\n".join(lines))]]
    if b.get("chunk"):
        return chunk_paragraphs(clean_paragraphs("\n".join(lines)), b["chunk"])
    if b.get("caps_titles") or b.get("titles"):
        names = b.get("titles") or caps_title_lines(lines)  # 已经是转义过的正则
        b = {**b, "pat": "(" + "|".join(names) + ")", "num": False, "dedupe": True}
    pat = re.compile(rf"^{b['pat']}$")
    heads = [i for i, l in enumerate(lines) if pat.match(l.strip())]
    if b.get("dedupe"):
        key = lambda i: next((g for g in pat.match(lines[i].strip()).groups() if g), lines[i].strip())
        last = {key(i): i for i in heads}
        heads = [i for i in heads if last[key(i)] == i]
    chapters = []
    for k, i in enumerate(heads):
        stop = heads[k + 1] if k + 1 < len(heads) else len(lines)
        section = lines[i + 1:stop]
        if len("\n".join(section).strip()) < MIN_SECTION:
            continue  # 目录里的条目
        m = pat.match(lines[i].strip())
        sub = next((g for g in m.groups()[1:] if g), "") if b.get("num") else m.group(1)
        if b.get("num") and m.group(1) is None:  # 比如 Tom Sawyer 的 CONCLUSION
            sub = m.group(2)
        # 标题写在下一行（或者全大写的标题折成了好几行）
        j = 0
        while j < len(section) and not section[j].strip():
            j += 1
        if b.get("drop_next") and j < len(section) and re.fullmatch(b["drop_next"], section[j].strip()):
            j += 1  # 标题下一行是单独的章节号（比如 CHAPTER 换行 1）
            while j < len(section) and not section[j].strip():
                j += 1
        # 下一行是标题的条件：比较短，而且后面紧跟空行（正文段落的第一行后面通常还有正文）
        if (b.get("next_title") and not sub and j < len(section) and len(section[j].strip()) < 70
                and (j + 1 >= len(section) or not section[j + 1].strip() or section[j].strip().isupper())):
            sub, j = section[j].strip(), j + 1
        while sub and sub.isupper() and j < len(section) and section[j].strip() and section[j].strip().isupper() and len(section[j].strip()) < 70:
            sub, j = sub + " " + section[j].strip(), j + 1
        paras = clean_paragraphs("\n".join(section[j:]))
        n = len(chapters) + 1
        if b.get("num"):
            label = b.get("label", "Chapter")
            title = f"{label} {n}" + (f": {title_case(sub)}" if sub and sub.upper() != "CONCLUSION" else "")
            if sub and sub.upper() == "CONCLUSION":
                title = "Conclusion"
        else:
            title = title_case(m.group(b.get("title_group", 1)))
        chapters.append([title, paras])
    return chapters


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    (OUT / "books").mkdir(parents=True, exist_ok=True)
    index, bad = [], []
    for b in BOOKS:
        chapters = split_book(b, fetch(b))
        words = [sum(len(p.split()) for p in ps) for _, ps in chapters]
        status = "OK" if b["chapters"] in (None, len(chapters)) else f"期望 {b['chapters']} 章"
        if status != "OK":
            bad.append(b["id"])
        if not chapters:
            print(f"{b['id']:13}   0 章  ← 没切出章节")
            continue
        print(f"{b['id']:13} {len(chapters):3} 章 {sum(words):7} 词  最短 {min(words):5}  最长 {max(words):5}  {status}  | {chapters[0][0]} … {chapters[-1][0]}")
        # 生成的数据里不提 Gutenberg 的名字：按它的许可，去掉许可声明后分发的文本也应去掉对它的引用
        js = (f"// 自动生成，请勿手改：{b['title']}（{b['author']}，{b['year']}，公有领域），由 tools/fetch_books.py 生成\n"
              f"(window.BOOK_TEXT = window.BOOK_TEXT || {{}})[{json.dumps(b['id'])}] = "
              + json.dumps([[t, ps] for t, ps in chapters], ensure_ascii=False, separators=(",", ":")) + ";\n")
        (OUT / "books" / f"{b['id']}.js").write_text(js, encoding="utf-8")
        index.append({k: b[k] for k in ("id", "title", "zh", "author", "year", "level", "intro")}
                     | {"cat": b.get("cat") or CAT_OF[b["id"]], "pick": bool(b.get("pick") or b["id"] in PICKS)}
                     | {"words": sum(words), "chapters": [[t, w] for (t, _), w in zip(chapters, words)]})
    index.sort(key=lambda x: LEVEL_ORDER.index(x["level"]))  # 按难度从易到难（同一难度保持 BOOKS 里的顺序）
    js = ("// 自动生成，请勿手改：原著全文书架的书目，正文在 data/books/<id>.js，由 tools/fetch_books.py 生成\n"
          "window.BOOK_CATS = " + json.dumps(CATS, ensure_ascii=False) + ";\n"
          "window.BOOK_SHELF = " + json.dumps(index, ensure_ascii=False, indent=0, separators=(",", ":")) + ";\n")
    (OUT / "books_index.js").write_text(js, encoding="utf-8")
    total = sum(f.stat().st_size for f in (OUT / "books").glob("*.js"))
    print(f"\n{len(index)} 本书，正文共 {total / 1e6:.1f} MB" + (f"；章节数不对：{bad}" if bad else ""))


if __name__ == "__main__":
    main()
