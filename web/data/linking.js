// 口语 · 连读与语调课程（本项目编写，面向零基础）：10 个单元、26 课
// 每课：sections 讲解（p 里 **加粗**；table 是对照表）、examples 例句 [英文, 标注, 中文]、drills 练习
// 标注符号：‿ 连读 · (x) 不发音或几乎不发音 · 大写 重读 · / 停顿 · ↗ 升调 · ↘ 降调 · ↘↗ 降升调 · [ ] 里是实际读出来的音
// 练习类型：
//   listen：听一句，选出听到的是哪个 { q, opts: [...], items: [[句子, 正确选项下标]] }
//   choose：选择题 { q, items: [[题目, [选项], 正确下标, 讲解, 要朗读的句子(可选)]] }
//   link：点出连读的位置 { q, items: ["pick‿it‿up", ...] }（‿ 的位置就是答案）
//   stress：点出重读的词 { q, items: ["I WANT to GO to the PARK.", ...] }（全大写的词是答案）
window.LINK_UNITS = [
  // ======================================================================
  { id: "u1", title: "第一单元 · 打基础：音节、重音和 /ə/", lessons: [
    { id: "syllable", title: "音节：英语的「节拍单位」", icon: "🥁",
      sections: [
        { h: "什么是音节", p: "音节就是一个词里能单独「拍一下」的部分。中文一个字就是一个音节（「你好」= 2 个音节）。英语里，**一个元音（注意是元音的「音」，不是元音字母）就是一个音节**，辅音附在元音的前后。" },
        { h: "英语音节和中文最大的不同", p: "中文的音节几乎都是「辅音 + 元音」，结尾最多跟 n 或 ng。英语的音节前后可以挂一串辅音：**strengths** /streŋθs/ 只有 1 个音节，前面 3 个辅音、后面 3 个辅音。中国学习者最常见的问题就是在辅音之间**偷偷加元音**：desk 读成「desi-ku」，hand 读成「han-de」，一下子多出好几个音节，听起来就不像英语了。" },
        { h: "怎么数音节", p: "① 先听，不要看拼写：数一数有几次「元音的响亮部分」。② 一个双元音（比如 /aɪ/）只算一个。③ 不发音的 e 不算：make /meɪk/ 是 1 个音节。④ 很多词在快速说的时候会「吞」掉一个音节：family 常读成 /ˈfæmli/（2 个），chocolate 读成 /ˈtʃɒklət/（2 个），comfortable 读成 /ˈkʌmftəbl/（3 个）。" },
        { h: "练习方法", p: "把手放在下巴下面，读单词时下巴每往下落一次，就是一个音节。读辅音结尾的词时，**最后的辅音只做口型、轻轻收住，不要加「呃」**。" },
      ],
      examples: [
        ["cat", "cat（1）", "猫"], ["desk", "desk（1）——不是 de-si-ku", "书桌"], ["hand", "hand（1）——不是 han-de", "手"],
        ["happy", "HAP-py（2）", "开心的"], ["banana", "ba-NA-na（3）", "香蕉"], ["strengths", "strengths（1）", "优点"],
        ["family", "FAM-ly（2，快读）", "家庭"], ["interesting", "IN-tres-ting（3，快读）", "有趣的"], ["comfortable", "COMF-ta-ble（3）", "舒服的"],
        ["asked", "asked（1）/ɑːskt/", "问了"], ["clothes", "clothes（1）", "衣服"], ["months", "months（1）", "月（复数）"],
      ],
      drills: [
        { type: "choose", q: "这个词（正常语速）有几个音节？", items: [
          ["desk", ["1", "2", "3"], 0, "desk 只有一个元音 /e/，k 前后不要加元音。", "desk"],
          ["picture", ["1", "2", "3"], 1, "PIC-ture，两个元音。", "picture"],
          ["banana", ["2", "3", "4"], 1, "ba-NA-na。", "banana"],
          ["strengths", ["1", "2", "3"], 0, "只有 /e/ 一个元音，前后都是辅音串。", "strengths"],
          ["family", ["2", "3", "4"], 0, "正常说话时常读成 FAM-ly，两个音节（慢读是三个）。", "family"],
          ["worked", ["1", "2", "3"], 0, "-ed 在清辅音 k 后面读 /t/，不加音节：/wɜːkt/。", "worked"],
          ["wanted", ["1", "2", "3"], 1, "-ed 在 t、d 后面才读 /ɪd/，多一个音节：WANT-ed。", "wanted"],
          ["everything", ["2", "3", "4"], 1, "EV-ry-thing，三个音节。", "everything"],
        ] },
      ] },
    { id: "wordstress", title: "单词重音：放对位置比发准每个音更重要", icon: "🎯",
      sections: [
        { h: "重读音节是什么样的", p: "两个音节以上的英语单词，总有一个音节读得特别突出：**更响、更长、音调更高、元音更清楚**。其他音节就弱下来，元音常常变成最轻的 /ə/。音标里重音符号 ˈ 标在重读音节**前面**：/ˈhæpi/ 重读 hap。" },
        { h: "为什么重要", p: "母语者听单词，很大程度上靠「节奏轮廓」来认。重音放错，哪怕每个音都对，别人也可能听不懂：把 hotel（ho-TEL）读成 HO-tel，把 develop（de-VEL-op）读成 DE-ve-lop，对方要愣一下。**中文每个字都一样重，所以我们容易把每个音节都读得一样重**——这是听起来「不像英语」的头号原因。" },
        { h: "常用规律", table: [["规律", "例子"],
          ["两音节名词、形容词：多重读第一个音节", "TA-ble, HAP-py, PRE-sent（礼物）"],
          ["两音节动词：多重读第二个音节", "pre-SENT（呈现）, de-CIDE, be-GIN"],
          ["-tion / -sion / -ic / -ical / -ity / -ial / -ian：重音在它前面一个音节", "e-du-CA-tion, e-co-NO-mic, a-BI-li-ty, mu-SI-cian"],
          ["-ee / -eer / -ese / -ique / -oon：重音就在这个后缀上", "em-ploy-EE, en-gi-NEER, Chi-NESE, u-NIQUE, after-NOON"],
          ["复合名词：重读第一部分", "BLACK-board（黑板）, GREEN-house, BED-room"],
          ["加前缀、大多数后缀不改变重音", "HAP-py → un-HAP-py → HAP-pi-ness"]] },
        { h: "同一个词，词性不同重音不同", p: "**REcord**（名词：记录）/ **reCORD**（动词：录制）；**OBject**（物体）/ **obJECT**（反对）；**INcrease**（增长，名词）/ **inCREASE**（增加，动词）。" },
        { h: "规律记不住怎么办", p: "规律只是帮助，最可靠的是**每学一个新词都看音标里的 ˈ，听原音的时候特别注意哪里最响**。跟读评测（Ctrl+M）里重音放错的词，识别把握会明显变低。" },
      ],
      examples: [
        ["hotel", "ho-TEL", "酒店"], ["develop", "de-VEL-op", "发展"], ["photograph", "PHO-to-graph", "照片"], ["photographer", "pho-TOG-ra-pher", "摄影师"],
        ["photographic", "pho-to-GRAPH-ic", "摄影的"], ["education", "ed-u-CA-tion", "教育"], ["economic", "e-co-NOM-ic", "经济的"], ["ability", "a-BIL-i-ty", "能力"],
        ["employee", "em-ploy-EE", "雇员"], ["Japanese", "Jap-a-NESE", "日本的"], ["record (n.)", "REC-ord", "记录"], ["record (v.)", "re-CORD", "录制"],
        ["comfortable", "COMF-ta-ble", "舒服的"], ["computer", "com-PU-ter", "电脑"], ["important", "im-POR-tant", "重要的"], ["afternoon", "af-ter-NOON", "下午"],
      ],
      drills: [
        { type: "choose", q: "听一听，重音在哪？", items: [
          ["hotel", ["HO-tel", "ho-TEL"], 1, "很多人读成 HO-tel，正确是 ho-TEL。", "hotel"],
          ["photographer", ["PHO-to-graph-er", "pho-TOG-ra-pher", "pho-to-GRAPH-er"], 1, "加了 -er 重音会移动：PHO-to-graph → pho-TOG-ra-pher。", "photographer"],
          ["education", ["ED-u-ca-tion", "ed-u-CA-tion", "ed-u-ca-TION"], 1, "-tion 前一个音节重读。", "education"],
          ["develop", ["DE-vel-op", "de-VEL-op", "de-vel-OP"], 1, "de-VEL-op。", "develop"],
          ["engineer", ["EN-gi-neer", "en-GI-neer", "en-gi-NEER"], 2, "-eer 结尾重读在后缀上。", "engineer"],
          ["comfortable", ["COM-for-ta-ble", "com-FOR-ta-ble", "com-for-TA-ble"], 0, "COMF-ta-ble，重音在第一个音节。", "comfortable"],
          ["economic", ["E-co-nom-ic", "e-co-NOM-ic", "e-CON-o-mic"], 1, "-ic 前一个音节重读。对比 e-CON-o-my。", "economic"],
          ["The new record is great. (record 是名词)", ["REC-ord", "re-CORD"], 0, "名词重读第一个音节。", "The new record is great."],
        ] },
      ] },
    { id: "schwa", title: "/ə/：英语里出现最多的音", icon: "😶",
      sections: [
        { h: "/ə/ 是什么", p: "/ə/ 叫「中央元音」（schwa），是嘴巴、舌头**完全放松**时发出的又短又轻的「呃」。它从不重读，也是英语里**出现次数最多的音**。" },
        { h: "为什么重要", p: "不重读的音节里，a、e、i、o、u 很多都会变成 /ə/：**a**bout /əˈbaʊt/、ban**a**n**a** /bəˈnɑːnə/、doct**o**r /ˈdɒktə/、t**o**day /təˈdeɪ/。如果你把每个元音都按字母读清楚（「巴娜娜」），节奏就全乱了。**重读音节读饱满、非重读音节读成 /ə/**——这一条做到了，英语马上就有「英语味」。" },
        { h: "/ə/ 也是弱读的核心", p: "后面讲到的弱读，本质上就是功能词里的元音变成了 /ə/：to /tə/、for /fə/、of /əv/、and /ənd/。所以先把 /ə/ 练熟。" },
        { h: "怎么练", p: "读下面的词时，重读音节「用力」，其他音节嘴巴几乎不动、轻轻带过。可以先用很夸张的方式读：ba-NAAA-na，再慢慢自然。" },
      ],
      examples: [
        ["about", "[ə]-BOUT", "关于"], ["banana", "b[ə]-NA-n[ə]", "香蕉"], ["today", "t[ə]-DAY", "今天"], ["doctor", "DOC-t[ə]", "医生"],
        ["problem", "PROB-l[ə]m", "问题"], ["police", "p[ə]-LICE", "警察"], ["Canada", "CAN-[ə]-d[ə]", "加拿大"], ["teacher", "TEA-ch[ə]", "老师"],
        ["support", "s[ə]-PPORT", "支持"], ["famous", "FA-m[ə]s", "著名的"], ["China", "CHI-n[ə]", "中国"], ["information", "in-f[ə]-MA-tion", "信息"],
      ],
      drills: [
        { type: "choose", q: "哪个音节里的元音读成了 /ə/？", items: [
          ["about", ["a-（第一个音节）", "-bout（第二个音节）"], 0, "a 不重读 → /ə/。", "about"],
          ["doctor", ["doc-", "-tor"], 1, "-tor 不重读，读 /tə/。", "doctor"],
          ["police", ["po-", "-lice"], 0, "重音在 -lice，po- 弱成 /pə/。", "police"],
          ["today", ["to-", "-day"], 0, "to- 读 /tə/。", "today"],
          ["support", ["sup-", "-port"], 0, "su- 读 /sə/，重音在 -port。", "support"],
          ["famous", ["fa-", "-mous"], 1, "-mous 读 /məs/。", "famous"],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u2", title: "第二单元 · 连读：词和词之间不断开", lessons: [
    { id: "cv", title: "辅音 + 元音：把辅音「借」给后面的词", icon: "🔗",
      sections: [
        { h: "规则", p: "前一个词**以辅音结尾**、后一个词**以元音开头**时，两个词连起来读，前一个词的最后那个辅音好像变成了后一个词的开头：**an apple** 听起来是 a-napple，**pick it up** 是 pi-ki-tup。" },
        { h: "为什么听不懂", p: "我们在书上看到的是一个个分开的单词，可母语者说的是**一串连起来的音**。an apple 你在脑子里找的是 an + apple，耳朵听到的却是 a + napple。练连读，首先是为了**听懂**。" },
        { h: "注意：看的是「音」不是字母", p: "**an hour**：hour 的 h 不发音，开头是元音 /aʊ/，所以连成 a-nour。**one of**：one 的发音是 /wʌn/，以 n 结尾，连成 wu-nof。**make it**：make 的 e 不发音，最后的音是 /k/，连成 ma-kit。" },
        { h: "词尾的 -s 和 -ed 也要连", p: "works on → wor-kson；looks at → loo-ksat；worked out → wor-ktout；picked up → pi-ktup。这些连读在快速口语里特别常见，也是听写时最容易漏掉 -s 和 -ed 的地方。" },
        { h: "怎么练", p: "① 先慢速把两个词「粘」起来，中间不停顿：pick‿it‿up。② 想象把辅音移到后面：pi / ki / tup。③ 加快到正常语速。**中间千万不要加停顿或者「呃」**。" },
      ],
      examples: [
        ["an apple", "a‿napple", "一个苹果"], ["an hour", "a‿nour（h 不发音）", "一小时"], ["pick it up", "pi‿ki‿tup", "捡起来"],
        ["Not at all.", "no‿ta‿tall", "一点也不。"], ["Come on in.", "co‿mo‿nin", "快进来。"], ["Check it out.", "che‿ki‿tout", "看看这个。"],
        ["Turn it off.", "tur‿ni‿toff", "把它关掉。"], ["Look at it.", "loo‿ka‿tit", "看它。"], ["Take it easy.", "ta‿ki‿teasy", "放轻松。"],
        ["a lot of", "a lo‿tof", "很多"], ["first of all", "firs‿to‿fall", "首先"], ["one of them", "wu‿nof them", "其中一个"],
        ["He works on Sundays.", "he work‿son Sundays", "他周日上班。"], ["It worked out.", "it work‿tout", "结果挺好。"], ["Can I have an egg?", "ca‿nI ha‿va‿negg", "能给我一个鸡蛋吗？"],
      ],
      drills: [
        { type: "link", q: "点出这句话里辅音 + 元音连读的地方（点词和词之间的空隙）", items: [
          "Pick‿it‿up.", "Turn‿it‿off.", "Not‿at‿all.", "Can‿I have‿an‿apple?", "Come‿on‿in.", "Look‿at‿this.", "Let's take‿a break.", "I need‿an‿umbrella.",
        ] },
      ] },
    { id: "vv", title: "元音 + 元音：中间加一个 /j/ 或 /w/", icon: "〰️",
      sections: [
        { h: "规则", p: "前一个词**以元音结尾**、后一个词**也以元音开头**时，两个元音之间会自然滑出一个很轻的过渡音，让两个词连起来，而不是中间断开。" },
        { h: "加 /j/ 还是 /w/？看嘴型", table: [["前一个词结尾的元音", "嘴型", "加什么", "例子"],
          ["/iː/ /ɪ/ /eɪ/ /aɪ/ /ɔɪ/", "嘴角向两边（扁）", "/j/（像「耶」）", "I‿(j)agree, see‿(j)it, say‿(j)it"],
          ["/uː/ /ʊ/ /əʊ/ /aʊ/", "嘴唇收圆", "/w/（像「乌」）", "go‿(w)out, do‿(w)it, how‿(w)are you"]] },
        { h: "英音里的连接 r", p: "英式英语里，单词结尾的 r 平时不发音（car /kɑː/），但**后面紧跟元音时，r 会读出来**把两个词连起来：far away → fa-raway，for a while → fo-ra while，where is → whe-ris。美式英语的 r 本来就一直发音，所以自然就连上了。" },
        { h: "注意 the 的读法", p: "the 在辅音前读 /ðə/（the book），在元音前读 /ði/（the end），而 /ði/ 后面接元音时又会加 /j/：the‿(j)end。" },
        { h: "怎么练", p: "不要刻意「发」这个 /j/ 或 /w/——只要两个元音之间**不停顿、不卡喉咙**，它就会自己出来。练习时可以先夸张地加出来，再慢慢放轻。" },
      ],
      examples: [
        ["I agree.", "I‿(j)agree", "我同意。"], ["see it", "see‿(j)it", "看到它"], ["Say it again.", "say‿(j)i‿tagain", "再说一遍。"],
        ["the end", "the‿(j)end", "结尾"], ["three apples", "three‿(j)apples", "三个苹果"], ["Go out.", "go‿(w)out", "出去。"],
        ["Do it now.", "do‿(w)it now", "现在就做。"], ["How are you?", "how‿(w)are you", "你好吗？"], ["You are right.", "you‿(w)are right", "你说得对。"],
        ["So easy!", "so‿(w)easy", "太简单了！"], ["far away", "far‿(r)away（英音）", "很远"], ["for a while", "for‿(r)a while（英音）", "一会儿"],
      ],
      drills: [
        { type: "choose", q: "这两个词之间加的是哪个过渡音？", items: [
          ["go out", ["/j/", "/w/"], 1, "go 以 /əʊ/ 结尾，嘴唇是圆的 → /w/。", "go out"],
          ["I am", ["/j/", "/w/"], 0, "I /aɪ/ 嘴角向两边 → /j/。", "I am"],
          ["see it", ["/j/", "/w/"], 0, "see /iː/ → /j/。", "see it"],
          ["do it", ["/j/", "/w/"], 1, "do /uː/ → /w/。", "do it"],
          ["she is", ["/j/", "/w/"], 0, "she /iː/ → /j/。", "she is"],
          ["you are", ["/j/", "/w/"], 1, "you /uː/ → /w/。", "you are"],
          ["the end", ["/j/", "/w/"], 0, "元音前 the 读 /ði/ → /j/。", "the end"],
          ["two eggs", ["/j/", "/w/"], 1, "two /uː/ → /w/。", "two eggs"],
        ] },
      ] },
    { id: "cc", title: "辅音 + 辅音：一样的音只读一次", icon: "🧲",
      sections: [
        { h: "相同的辅音碰在一起", p: "前一个词结尾和后一个词开头**是同一个辅音**时，只读一次，稍微拉长一点，中间不断开：bus stop 不是 bus-s-stop，而是 bu-sstop；some money 是 so-mmoney。" },
        { h: "很像的辅音碰在一起", p: "发音部位一样、只是清浊不同的辅音（t/d、p/b、k/g、s/z、f/v）碰在一起时也一样，**前一个基本不读，只读后一个**：hot dog → ho-dog，black gate → bla-gate。" },
        { h: "和「失去爆破」的关系", p: "这其实就是下一单元「失去爆破」的一种。区别在于：一样的辅音只读一次；不一样的爆破音前一个只做口型（下一单元细讲）。" },
        { h: "常见搭配", p: "bus stop、this song、some more、big game、good day、black coffee、well-known、next time、gas station、with them。" },
      ],
      examples: [
        ["bus stop", "bu‿sstop", "公交站"], ["some money", "so‿mmoney", "一些钱"], ["this song", "thi‿ssong", "这首歌"],
        ["big game", "bi‿ggame", "大比赛"], ["good day", "goo‿dday", "日安"], ["black coffee", "bla‿ccoffee", "黑咖啡"],
        ["well-known", "we‿llknown", "众所周知的"], ["with them", "wi‿them", "和他们一起"], ["hot dog", "ho(t)‿dog", "热狗"],
        ["What time is it?", "wha(t)‿time‿(m)i‿zit", "几点了？"], ["I'm making mistakes.", "I‿mmaking mistakes", "我在犯错。"], ["Is she?", "i‿(z)she", "她是吗？"],
      ],
      drills: [
        { type: "link", q: "点出相同或相近的辅音连在一起的地方", items: [
          "Get off at the bus‿stop.", "I need some‿money.", "Have a good‿day.", "A black‿coffee, please.", "What‿time is it?", "I like this‿song.",
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u3", title: "第三单元 · 省音：有些音不读出来", lessons: [
    { id: "drop", title: "失去爆破：只做口型，不爆破", icon: "🤐",
      sections: [
        { h: "什么是爆破音", p: "/p/ /b/ /t/ /d/ /k/ /g/ 叫爆破音：先把气流堵住，再突然放开「爆」出来。" },
        { h: "完全失去爆破", p: "一个爆破音后面**紧跟另一个爆破音**时，前一个只**做好口型、憋住气**，不放开，直接接着发后一个：good day → goo(d) day，sit down → si(t) down，stop talking → sto(p) talking。听起来前一个音「消失」了，但其实有一个短短的停顿，这个停顿就是它存在的证据。" },
        { h: "不完全失去爆破", p: "爆破音后面跟的是**鼻音（m n）、边音（l）或者摩擦音（f s ʃ ……）**时，爆破也会变得很弱：good morning → goo(d) morning，that man → tha(t) man，night shift → nigh(t) shift，at last → a(t) last。" },
        { h: "单词内部也会发生", p: "不止在两个词之间，单词内部也一样：**doctor** /ˈdɒ(k)tə/、**football** /ˈfʊ(t)bɔːl/、**blackboard**、**object**、**picture** /ˈpɪ(k)tʃə/。" },
        { h: "中国学习者常见的两个极端", p: "① 把每个爆破音都用力读出来甚至加元音：goo-de day、si-te down。② 完全吞掉不留停顿，结果 good day 听起来像 goo day。**正确的是：口型到位、憋住一下、不放气。**" },
      ],
      examples: [
        ["good day", "goo(d) day", "日安"], ["sit down", "si(t) down", "坐下"], ["Stop talking.", "sto(p) talking", "别说话了。"],
        ["big cake", "bi(g) cake", "大蛋糕"], ["next door", "nex(t) door", "隔壁"], ["hot tea", "ho(t) tea", "热茶"],
        ["good morning", "goo(d) morning", "早上好"], ["that man", "tha(t) man", "那个男人"], ["at last", "a(t) last", "终于"],
        ["doctor", "do(c)tor", "医生"], ["football", "foo(t)ball", "足球"], ["I don't know.", "I don'(t) know", "我不知道。"],
        ["Get back!", "ge(t) back", "回来！"], ["a big dog", "a bi(g) dog", "一只大狗"], ["Keep calm.", "kee(p) calm", "保持冷静。"],
      ],
      drills: [
        { type: "choose", q: "哪个音只做口型、不爆破出来？", items: [
          ["sit down", ["sit 的 t", "down 的 d"], 0, "两个爆破音相遇，前一个 t 失去爆破。", "sit down"],
          ["good morning", ["good 的 d", "morning 的 m"], 0, "d 后面接鼻音 m，不完全爆破。", "good morning"],
          ["stop talking", ["stop 的 p", "talking 的 t"], 0, "p 后接爆破音 t。", "stop talking"],
          ["doctor", ["c /k/", "t /t/"], 0, "单词内部 k 后接 t，k 失去爆破。", "doctor"],
          ["big cake", ["big 的 g", "cake 的 c"], 0, "g 后接 k。", "big cake"],
        ] },
      ] },
    { id: "elide", title: "t 和 d 的省略、and 变成 'n", icon: "✂️",
      sections: [
        { h: "夹在两个辅音中间的 t、d 常常直接消失", p: "**next week** → nex week，**last night** → las night，**must be** → mus be，**old man** → ol man，**handbag** → hanbag。规律：t 或 d 前面是辅音、后面也是辅音时，它很容易被省掉。" },
        { h: "and 的各种读法", p: "and 几乎从不读成「安德」：正常读 /ən/，在快速口语里只剩一个 /n/，写出来就是 **'n'**：rock 'n' roll，fish 'n' chips，salt 'n' pepper，black 'n' white，you 'n' me。" },
        { h: "-ed 结尾的省略", p: "asked /ɑːst/（k 几乎不读）、**I used to** /juːstə/、**I'm supposed to** /səˈpəʊstə/、**I kept quiet** → I kep quiet。所以听写时常常听不出 -ed，要靠语法判断。" },
        { h: "原则", p: "这些省略是为了说得顺，**自己说的时候不用刻意模仿**，读清楚也完全没问题；但要知道它们存在，否则听的时候会以为对方说的是 nex week 或者 fish 'n chips 是个奇怪的词。" },
      ],
      examples: [
        ["next week", "nex(t) week", "下周"], ["last night", "las(t) night", "昨晚"], ["You must be tired.", "you mus(t) be tired", "你一定累了。"],
        ["old man", "ol(d) man", "老人"], ["handbag", "han(d)bag", "手提包"], ["I don't know.", "I don'(t) know", "我不知道。"],
        ["fish and chips", "fish 'n' chips", "炸鱼薯条"], ["rock and roll", "rock 'n' roll", "摇滚乐"], ["you and me", "you 'n' me", "你和我"],
        ["black and white", "black 'n' white", "黑白的"], ["I asked him.", "I as(k)ed him", "我问了他。"], ["I used to live there.", "I use(d) to live there", "我以前住在那儿。"],
      ],
      drills: [
        { type: "listen", q: "听一听，选出你听到的句子（听写时这类最容易出错）", opts: ["现在时", "过去时"], items: [
          ["I walk to work.", 0], ["I walked to work.", 1], ["We play tennis on Sundays.", 0], ["We played tennis on Sunday.", 1], ["They ask a lot of questions.", 0], ["They asked a lot of questions.", 1],
        ] },
      ] },
    { id: "hdrop", title: "h 的脱落：tell him 读成 tellim", icon: "🫥",
      sections: [
        { h: "规则", p: "**he、him、his、her、have、has、had** 这些以 h 开头的词，不重读、又不在句子开头时，h 经常不发音，然后和前面的词连读：**tell him** → tel-lim，**ask her** → as-ker，**What's his name?** → what-sis name，**Is he?** → i-zee。" },
        { h: "什么时候 h 要读出来", p: "① 在句子开头：**He**'s my friend.（h 要读）② 被强调时：I said **HIM**, not her. ③ 实词（hat、house、happy）里的 h 永远要读。" },
        { h: "最常见的组合", p: "give him → gi-vim，let him → le-tim（美音 le-dim），love her → lo-ver，should have → shoul-dav → shoulda，must have → mus-tav，could have → coul-dav。" },
      ],
      examples: [
        ["Tell him.", "tel‿(h)im → tellim", "告诉他。"], ["Ask her.", "ask‿(h)er → asker", "问她。"], ["What's his name?", "what‿s‿(h)is name", "他叫什么名字？"],
        ["Is he coming?", "i‿z(h)e coming", "他来吗？"], ["Give him a call.", "gi‿v(h)i‿ma call", "给他打个电话。"], ["I love her.", "I lo‿v(h)er", "我爱她。"],
        ["Where has he gone?", "where‿(h)a‿z(h)e gone", "他去哪了？"], ["I should have known.", "I shoul‿d(h)ave known → shoulda known", "我早该知道的。"], ["He's here.", "He's here（句首 h 要读）", "他在这儿。"],
      ],
      drills: [
        { type: "choose", q: "这句话里哪个 h 会脱落？", items: [
          ["He told him the truth.", ["He 的 h", "him 的 h"], 1, "句首的 He 要读 h；him 不重读，h 脱落：tol-dim。", "He told him the truth."],
          ["Did you ask her?", ["ask 前面没有 h", "her 的 h"], 1, "ask her → as-ker。", "Did you ask her?"],
          ["What's his job?", ["What's 前面没有 h", "his 的 h"], 1, "what's his → what-sis。", "What's his job?"],
          ["Help him!", ["Help 的 h", "him 的 h"], 1, "Help 是实词，h 要读；him 的 h 脱落：hel-pim。", "Help him!"],
        ] },
      ] },
  ] },
];
