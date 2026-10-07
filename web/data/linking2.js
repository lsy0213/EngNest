// 连读与语调课程（续）：第四到第十单元。格式见 linking.js
window.LINK_UNITS.push(
  // ======================================================================
  { id: "u4", title: "第四单元 · 弱读：小词读得又轻又快", lessons: [
    { id: "weak1", title: "功能词的强读和弱读", icon: "🔉",
      sections: [
        { h: "实词和功能词", p: "句子里的词分两类：**实词**（名词、动词、形容词、副词、否定词、疑问词）带着主要意思，读得清楚；**功能词**（冠词、介词、连词、代词、助动词）只起语法作用，通常读得又轻又快，元音变成 /ə/，这就叫**弱读**。" },
        { h: "为什么非学不可", p: "英语里最常用的 100 个词，大部分都是功能词，而它们在正常说话时**几乎都是弱读**。课本和词典标的是强读（to /tuː/），可你在美剧里听到的是 /tə/。不知道弱读，就会觉得「每个单词都认识，连起来就听不懂」。" },
        { h: "最常用的弱读对照表", table: [["词", "强读（单独念、强调时）", "弱读（句子里的正常读法）", "例子"],
          ["a / an", "/eɪ/ /æn/", "/ə/ /ən/", "a cup /ə kʌp/"],
          ["the", "/ðiː/", "/ðə/（辅音前）/ði/（元音前）", "the book, the end"],
          ["and", "/ænd/", "/ən/ /n/", "you and me"],
          ["but", "/bʌt/", "/bət/", "but why?"],
          ["or", "/ɔː/", "/ə/", "tea or coffee"],
          ["of", "/ɒv/", "/əv/ /ə/", "a cup of tea"],
          ["to", "/tuː/", "/tə/（辅音前）/tu/（元音前）", "go to bed"],
          ["for", "/fɔː/", "/fə/", "for you"],
          ["from", "/frɒm/", "/frəm/", "from China"],
          ["at", "/æt/", "/ət/", "at home"],
          ["as", "/æz/", "/əz/", "as soon as"],
          ["than", "/ðæn/", "/ðən/", "taller than me"],
          ["that（连词）", "/ðæt/", "/ðət/", "I think that..."],
          ["some（一些）", "/sʌm/", "/səm/", "some tea"]] },
        { h: "怎么练", p: "读句子时，先找出实词用力读，再把中间的小词「一口带过」，嘴巴几乎不动。比如 a cup of tea：重点在 CUP 和 TEA，a 和 of 都只剩 /ə/：/ə ˈkʌp ə ˈtiː/。" },
      ],
      examples: [
        ["a cup of tea", "/ə/ CUP /ə/ TEA", "一杯茶"], ["I want to go.", "I WANT /tə/ GO", "我想去。"], ["fish and chips", "FISH /n/ CHIPS", "炸鱼薯条"],
        ["It's for you.", "it's /fə/ YOU", "这是给你的。"], ["I'm from China.", "I'm /frəm/ CHINA", "我来自中国。"], ["Tea or coffee?", "TEA /ə/ COFFEE", "茶还是咖啡？"],
        ["at the moment", "/ət ðə/ MOMENT", "目前"], ["as soon as possible", "/əz/ SOON /əz/ POSSIBLE", "尽快"], ["She's taller than me.", "she's TALLER /ðən/ ME", "她比我高。"],
        ["I think that he's right.", "I THINK /ðət/ he's RIGHT", "我觉得他是对的。"], ["Would you like some cake?", "would you LIKE /səm/ CAKE", "要来点蛋糕吗？"], ["go to the end", "GO /tə/ /ði/ END", "走到最后"],
      ],
      drills: [
        { type: "choose", q: "在这句话里，这个词读强读还是弱读？", items: [
          ["I'm going to the bank. （to）", ["强读 /tuː/", "弱读 /tə/"], 1, "句子中间、不强调 → 弱读。", "I'm going to the bank."],
          ["Who are you talking to? （to）", ["强读 /tuː/", "弱读 /tə/"], 0, "介词在句子末尾要强读。", "Who are you talking to?"],
          ["A cup of tea, please. （of）", ["强读 /ɒv/", "弱读 /ə/"], 1, "a cup of tea → /ə kʌp ə tiː/。", "A cup of tea, please."],
          ["Where are you from? （from）", ["强读 /frɒm/", "弱读 /frəm/"], 0, "介词在句尾要强读。", "Where are you from?"],
          ["It's not for you, it's FOR me. （第二个 for）", ["强读 /fɔː/", "弱读 /fə/"], 0, "对比强调时强读。", "It's not for you, it's for me."],
          ["bread and butter （and）", ["强读 /ænd/", "弱读 /n/"], 1, "固定搭配里 and 弱成 /n/：bread 'n' butter。", "bread and butter"],
        ] },
      ] },
    { id: "weak2", title: "助动词和代词的弱读（can 还是 can't）", icon: "🔈",
      sections: [
        { h: "助动词的弱读", table: [["词", "强读", "弱读", "例子"],
          ["can", "/kæn/", "/kən/", "I can swim /aɪ kən ˈswɪm/"],
          ["could", "/kʊd/", "/kəd/", "Could you help?"],
          ["do / does", "/duː/ /dʌz/", "/də/ /dəz/", "What do you think?"],
          ["have / has / had", "/hæv/ /hæz/ /hæd/", "/əv/ /əz/ /əd/", "Where have you been?"],
          ["was / were", "/wɒz/ /wɜː/", "/wəz/ /wə/", "It was great."],
          ["are", "/ɑː/", "/ə/", "What are you doing?"],
          ["will / would", "/wɪl/ /wʊd/", "'ll /l/ · 'd /d/", "I'll call you. I'd love to."],
          ["must / should", "/mʌst/ /ʃʊd/", "/məst/ /ʃəd/", "You should go."]] },
        { h: "代词的弱读", table: [["词", "强读", "弱读"], ["you / your", "/juː/ /jɔː/", "/jə/"], ["him", "/hɪm/", "/ɪm/"], ["her", "/hɜː/", "/ə/ /hə/"], ["them", "/ðem/", "/ðəm/ /əm/"], ["us", "/ʌs/", "/əs/"]] },
        { h: "can 和 can't 怎么听出来", p: "这是最经典的听力难点，两者意思完全相反：**can 在句子里弱读 /kən/，又短又轻，重音落在后面的动词上**：I can SWIM。**can't 不弱读，读得重而长（美音 /kænt/，英音 /kɑːnt/）**，t 常常只做口型：I CAN'T swim。所以判断的诀窍是**听重音和长度，不是听有没有 t**。" },
        { h: "什么时候不弱读", p: "① 在句子末尾：Yes, I **can**. / That's what I'm looking **at**.  ② 被强调或对比时：I **DO** like it! / Is it for him or **for** her?  ③ 否定缩写永远不弱读：can't、don't、isn't、wasn't。" },
      ],
      examples: [
        ["I can swim.", "I /kən/ SWIM", "我会游泳。"], ["I can't swim.", "I CAN'T swim（重、长）", "我不会游泳。"], ["Yes, I can.", "yes, I CAN（句尾强读）", "是的，我会。"],
        ["What do you think?", "WHAT /də jə/ THINK", "你觉得呢？"], ["Where have you been?", "WHERE /əv jə/ BEEN", "你去哪了？"], ["What are you doing?", "WHAT /ə jə/ DOING", "你在干什么？"],
        ["It was great.", "it /wəz/ GREAT", "太棒了。"], ["Tell them to wait.", "TELL /əm tə/ WAIT", "让他们等等。"], ["Give us a minute.", "GIVE /əs ə/ MINUTE", "给我们一分钟。"],
        ["I'll call you later.", "I'll CALL /jə/ LATER", "我晚点给你打电话。"], ["You should see a doctor.", "you /ʃəd/ SEE a DOCTOR", "你应该去看医生。"], ["I do like it!", "I DO like it（强调）", "我真的很喜欢！"],
      ],
      drills: [
        { type: "listen", q: "听一听：是 can 还是 can't？（每次换一个人读）", opts: ["can（能）", "can't（不能）"], items: [
          ["I can drive.", 0], ["I can't drive.", 1], ["She can come tomorrow.", 0], ["She can't come tomorrow.", 1], ["We can see it from here.", 0], ["We can't see it from here.", 1],
          ["You can park here.", 0], ["You can't park here.", 1], ["He can speak French.", 0], ["He can't speak French.", 1], ["They can help us.", 0], ["They can't help us.", 1],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u5", title: "第五单元 · 同化：两个音互相影响", lessons: [
    { id: "assim", title: "遇到 you / your：融合成新的音", icon: "🔀",
      sections: [
        { h: "规则", p: "单词以 **t、d、s、z** 结尾，后面紧跟 **you、your、yet、year** 这类以 /j/ 开头的词时，两个音融合成一个新的音：", table: [["组合", "变成", "例子"],
          ["/t/ + /j/", "/tʃ/（「吃」）", "meet you → mee-chu, don't you → don-chu"],
          ["/d/ + /j/", "/dʒ/（「知」）", "did you → di-ju, would you → wou-ju"],
          ["/s/ + /j/", "/ʃ/（「诗」）", "bless you → ble-shu, this year → thi-shyear"],
          ["/z/ + /j/", "/ʒ/", "how's your → how-zhur, as you know → a-zhu know"]] },
        { h: "这是母语者最常用的连读之一", p: "Did you...? Would you...? Could you...? What do you...? 这些问句每天都在说，几乎**每次**都会融合。听到「迪朱」「伍朱」就要反应过来是 did you、would you。" },
        { h: "自己要不要这样读", p: "这种融合是说快了自然产生的，**自己说的时候可以模仿，也可以读清楚**，都不影响理解。重点是听懂。" },
      ],
      examples: [
        ["Nice to meet you.", "nice to mee-[tʃ]u", "很高兴认识你。"], ["Did you eat?", "di-[dʒ]u eat", "你吃了吗？"], ["Would you like some tea?", "wou-[dʒ]u like some tea", "你想喝点茶吗？"],
        ["Could you help me?", "cou-[dʒ]u help me", "你能帮我吗？"], ["Don't you know?", "don-[tʃ]u know", "你不知道吗？"], ["What's your name?", "what-[ʃ]ur name", "你叫什么名字？"],
        ["Bless you!", "ble-[ʃ]u", "保佑你！（打喷嚏时说）"], ["this year", "thi-[ʃ]year", "今年"], ["Is your phone on?", "i-[ʒ]ur phone on", "你手机开着吗？"],
        ["I'll let you know.", "I'll le-[tʃ]u know", "我会告诉你的。"], ["Not yet.", "no-[tʃ]et", "还没。"], ["Got you!", "go-[tʃ]a → gotcha", "抓到你了！/ 明白了！"],
      ],
      drills: [
        { type: "choose", q: "这两个词连起来，中间会变成什么音？", items: [
          ["did you", ["/tʃ/", "/dʒ/", "/ʃ/"], 1, "d + j → dʒ：di-ju。", "did you"],
          ["meet you", ["/tʃ/", "/dʒ/", "/ʃ/"], 0, "t + j → tʃ：mee-chu。", "meet you"],
          ["bless you", ["/tʃ/", "/dʒ/", "/ʃ/"], 2, "s + j → ʃ：ble-shu。", "bless you"],
          ["would you", ["/tʃ/", "/dʒ/", "/ʃ/"], 1, "d + j → dʒ。", "would you"],
          ["what's your", ["/tʃ/", "/dʒ/", "/ʃ/"], 2, "s + j → ʃ。", "what's your"],
          ["don't you", ["/tʃ/", "/dʒ/", "/ʃ/"], 0, "t + j → tʃ。", "don't you"],
        ] },
      ] },
    { id: "assim2", title: "鼻音和爆破音的「顺口」变化", icon: "👄",
      sections: [
        { h: "n 在 p / b / m 前面变成 m", p: "发 p、b、m 要闭上嘴唇，前面的 n 为了省事就提前闭嘴，变成了 m：**ten people** → tem people，**in bed** → im bed，**green park** → greem park，**one more** → wum more，**input** → imput。" },
        { h: "n 在 k / g 前面变成 ŋ", p: "**in case** → iŋ case，**ten cups** → teŋ cups，**sun glasses** → suŋ glasses。" },
        { h: "t / d 在 p / b / m 前变成 p / b，在 k / g 前变成 k / g", p: "**that boy** → thap boy，**good boy** → goob boy，**white bread** → whipe bread，**that car** → thak car，**good girl** → goog girl。这些变化很细微，母语者自己都意识不到。" },
        { h: "为什么要知道", p: "这一课主要是为了**听**：当你听到 tem people、goob boy 这种「奇怪」的读法时，知道这是正常现象，不会卡住。自己说的时候不用刻意做。" },
      ],
      examples: [
        ["ten people", "te[m] people", "十个人"], ["in bed", "i[m] bed", "在床上"], ["one more time", "o[m]e more time", "再来一次"],
        ["Green Park", "gree[m] Park", "格林公园"], ["in case", "i[ŋ] case", "以防万一"], ["ten cups", "te[ŋ] cups", "十杯"],
        ["that boy", "tha[p] boy", "那个男孩"], ["good boy", "goo[b] boy", "好孩子"], ["that car", "tha[k] car", "那辆车"],
        ["good girl", "goo[g] girl", "好女孩"], ["handbag", "ha[m]bag", "手提包"], ["sandwich", "sa[m]wich", "三明治"],
      ],
      drills: [
        { type: "choose", q: "实际读出来，[ ] 里会变成什么音？", items: [
          ["te[n] people", ["n", "m", "ŋ"], 1, "n 在 p 前 → m。", "ten people"],
          ["i[n] case", ["n", "m", "ŋ"], 2, "n 在 k 前 → ŋ。", "in case"],
          ["goo[d] boy", ["d", "b", "g"], 1, "d 在 b 前 → b。", "good boy"],
          ["tha[t] car", ["t", "p", "k"], 2, "t 在 k 前 → k。", "that car"],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u6", title: "第六单元 · 美式英语的特色", lessons: [
    { id: "flap", title: "闪音：water 读成 wader", icon: "🇺🇸",
      sections: [
        { h: "规则", p: "美式英语里，**t（和 d）夹在两个元音之间、而且后面那个音节不重读**时，舌尖不再用力爆破，而是在上齿龈上**轻轻弹一下**，听起来像很快的 d，有点像中文「了」的开头。这叫**闪音**（flap t）。" },
        { h: "三种常见情况", table: [["情况", "例子"],
          ["单词内部，两个元音之间", "water, better, city, party, little, letter, computer"],
          ["跨词：t 结尾 + 元音开头", "get up → ge-dup, a lot of → a lo-da, what about → wha-da-bout, not at all → no-da-dall"],
          ["r 后面也会", "party → par-dy, dirty → dir-dy, forty → for-dy"]] },
        { h: "什么时候不变", p: "① 后面的音节**重读**时，t 照常爆破：**attack**（a-TTACK）、**hotel**（ho-TEL）、**return**。② t 在词首：table、today。③ 英式英语一般不用闪音，water 读 /ˈwɔːtə/ 清楚的 t。" },
        { h: "要不要学", p: "如果你想说美音，闪音是**最有「美国味」**的一个特征，可以学。不想学也完全没问题，但一定要能听懂：wader = water，beder = better，lida = little。" },
      ],
      examples: [
        ["water", "wa[d]er", "水"], ["better", "be[d]er", "更好"], ["city", "ci[d]y", "城市"], ["little", "li[d]le", "小的"],
        ["party", "par[d]y", "派对"], ["computer", "compu[d]er", "电脑"], ["a lot of", "a lo[d]a", "很多"], ["Get up!", "ge[d]up", "起床！"],
        ["What about you?", "wha[d]about you", "你呢？"], ["Not at all.", "no[d]a[d]all", "一点也不。"], ["Shut up.", "shu[d]up", "闭嘴。"], ["I bought a new car.", "I bough[d]a new car", "我买了辆新车。"],
      ],
      drills: [
        { type: "choose", q: "在美式英语里，这里的 t 会不会变成闪音？", items: [
          ["water", ["会", "不会"], 0, "t 在两个元音之间，后面音节不重读。", "water"],
          ["hotel", ["会", "不会"], 1, "ho-TEL，t 后面的音节重读，t 照常爆破。", "hotel"],
          ["get it", ["会", "不会"], 0, "跨词：get + it → ge-dit。", "get it"],
          ["table", ["会", "不会"], 1, "t 在词首。", "table"],
          ["party", ["会", "不会"], 0, "r 后面、元音前面也会：par-dy。", "party"],
          ["attack", ["会", "不会"], 1, "a-TTACK，后面重读。", "attack"],
        ] },
      ] },
    { id: "glottal", title: "吞掉的 t：button、internet、can't", icon: "😮",
      sections: [
        { h: "喉塞音：t 变成一个「顿」", p: "t 在 **n、m 或词尾**前面时，美国人常常不爆破 t，而是在喉咙里**卡一下**（声门短暂关闭），像中文说「啊、啊」中间那一下停顿：**button** → bu'n，**mountain** → mou'n，**certain** → cer'n，**Not now.** → no' now，**that one** → tha' one。" },
        { h: "nt 中间的 t 直接消失", p: "**internet** → innernet，**twenty** → twenny，**center** → cenner，**interview** → innerview，**wanted** → wanned，**printer** → prinner。这在美国口语里非常普遍。" },
        { h: "can't 的 t", p: "can't 的 t 经常只是喉咙里卡一下、听不到爆破，所以美国人区分 can / can't 主要靠**元音长短和重音**（上一单元讲过）：can't 的 /æ/ 又长又重。" },
        { h: "原则", p: "这些都是**听力**上必须知道的，自己说话时读清楚的 t 永远不会错。" },
      ],
      examples: [
        ["button", "bu'(t)n", "按钮"], ["mountain", "moun'(t)n", "山"], ["certain", "cer'(t)n", "确定的"], ["Not now.", "no'(t) now", "现在不行。"],
        ["internet", "in(t)ernet → innernet", "互联网"], ["twenty", "twen(t)y → twenny", "二十"], ["center", "cen(t)er → cenner", "中心"], ["interview", "in(t)erview", "面试"],
        ["I wanted to go.", "I wan(t)ed to go → wanned", "我本来想去。"], ["I can't believe it.", "I CAN'(t) believe it", "真不敢相信。"], ["That one?", "tha'(t) one", "那个吗？"], ["It's important.", "it's impor'(t)ant", "这很重要。"],
      ],
      drills: [
        { type: "listen", q: "听一听：读的是哪个数字？（美音里 twenty 常读成 twenny）", opts: ["twenty（20）", "twelve（12）"], items: [
          ["I have twenty dollars.", 0], ["I have twelve dollars.", 1], ["She's twenty.", 0], ["She's twelve.", 1], ["Page twenty, please.", 0], ["Page twelve, please.", 1],
        ] },
      ] },
    { id: "usuk", title: "美音和英音：r、a 和 o 的不同", icon: "🌍",
      sections: [
        { h: "最明显的区别：r", p: "**美音**里所有写出来的 r 都要发音（卷舌）：car /kɑːr/、bird /bɝːd/、water /ˈwɑːdər/。**英音**里 r 只在元音前面发音，词尾和辅音前的 r 不发音：car /kɑː/、bird /bɜːd/、water /ˈwɔːtə/。" },
        { h: "其他常见区别", table: [["", "美音", "英音"],
          ["can't, dance, ask, after, bath", "/æ/（像「哎」张大嘴）", "/ɑː/（像「啊」）"],
          ["hot, stop, not, job", "/ɑː/（hot 像 haht）", "/ɒ/（短、圆唇）"],
          ["go, no, home", "/oʊ/", "/əʊ/"],
          ["water, better（t）", "闪音 wader", "清楚的 t"],
          ["new, Tuesday, student", "/nuː/ /ˈtuːzdeɪ/", "/njuː/ /ˈtjuːzdeɪ/"],
          ["schedule", "/ˈskedʒuːl/", "/ˈʃedjuːl/"]] },
        { h: "该学哪一种", p: "**选一种为主，听两种**。国内课本音标是英式，但美剧、电影、大部分网上内容是美式。软件里的发音默认是美音（设置里可以换成英音的声音）。最重要的是**同一个词前后读法一致**，不要一会儿卷舌一会儿不卷。" },
      ],
      examples: [
        ["car", "美 /kɑːr/ · 英 /kɑː/", "汽车"], ["bird", "美 /bɝːd/ · 英 /bɜːd/", "鸟"], ["water", "美 wader · 英 /ˈwɔːtə/", "水"],
        ["can't", "美 /kænt/ · 英 /kɑːnt/", "不能"], ["dance", "美 /dæns/ · 英 /dɑːns/", "跳舞"], ["hot", "美 /hɑːt/ · 英 /hɒt/", "热的"],
        ["go", "美 /goʊ/ · 英 /gəʊ/", "去"], ["new", "美 /nuː/ · 英 /njuː/", "新的"], ["schedule", "美 /ˈskedʒuːl/ · 英 /ˈʃedjuːl/", "日程"],
      ],
      drills: [
        { type: "choose", q: "这是美音还是英音的读法？", items: [
          ["car 读成 /kɑː/（没有卷舌）", ["美音", "英音"], 1, "英音词尾 r 不发音。", ""],
          ["can't 读成 /kænt/", ["美音", "英音"], 0, "美音用 /æ/。", ""],
          ["water 读成 wader", ["美音", "英音"], 0, "闪音是美音特征。", ""],
          ["hot 读成短而圆唇的 /hɒt/", ["美音", "英音"], 1, "美音是 /hɑːt/。", ""],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u7", title: "第七单元 · 口语里的缩写和缩读", lessons: [
    { id: "contract", title: "缩写：I'm、you'll、I'd……", icon: "✍️",
      sections: [
        { h: "口语几乎总是用缩写", p: "说话时 I am、you will、do not 几乎都说成 **I'm、you'll、don't**。不用缩写反而显得生硬或者在强调。" },
        { h: "常用缩写", table: [["写法", "完整形式", "读音"],
          ["I'm / you're / we're / they're", "am / are", "/aɪm/ /jɔː/ /wɪə/ /ðeə/"],
          ["he's / she's / it's / that's", "is 或 has", "/hiːz/ /ʃiːz/ /ɪts/"],
          ["I've / you've / we've", "have", "/aɪv/ /juːv/"],
          ["I'll / you'll / it'll", "will", "/aɪl/ /juːl/ /ˈɪtl/"],
          ["I'd / you'd / he'd", "would 或 had", "/aɪd/ /juːd/"],
          ["don't / doesn't / didn't", "do not ……", "/dəʊnt/ /ˈdʌznt/ /ˈdɪdnt/"],
          ["can't / won't / shouldn't", "cannot / will not / should not", "/kɑːnt/ /wəʊnt/ /ˈʃʊdnt/"],
          ["let's", "let us", "/lets/"]] },
        { h: "容易混的 's 和 'd", p: "**'s** 可能是 is 也可能是 has：He's tired（is）/ He's gone（has，后面跟过去分词）。**'d** 可能是 would 也可能是 had：I'd like（would，后面跟动词原形）/ I'd finished（had，后面跟过去分词）。**看后面跟的词来判断**。" },
        { h: "won't 和 want", p: "won't /wəʊnt/（不会）和 want /wɒnt/（想要）非常像，区别在元音：won't 是双元音 /əʊ/，嘴唇由圆变小；want 是短的 /ɒ/。" },
      ],
      examples: [
        ["I'm tired.", "I'm = I am", "我累了。"], ["He's gone.", "he's = he has", "他走了。"], ["She's busy.", "she's = she is", "她很忙。"],
        ["I'd like a coffee.", "I'd = I would", "我想要一杯咖啡。"], ["I'd already eaten.", "I'd = I had", "我已经吃过了。"], ["It'll be fine.", "it'll = it will", "会好的。"],
        ["They've arrived.", "they've = they have", "他们到了。"], ["I won't tell anyone.", "won't /wəʊnt/", "我不会告诉任何人的。"], ["I want to tell you.", "want /wɒnt/", "我想告诉你。"],
        ["Let's go!", "let's = let us", "我们走吧！"], ["You shouldn't worry.", "shouldn't", "你不用担心。"], ["We're late.", "we're = we are", "我们迟到了。"],
      ],
      drills: [
        { type: "choose", q: "这里的缩写是哪个词？", items: [
          ["He's finished his work.", ["is", "has"], 1, "后面跟过去分词 finished → has。", "He's finished his work."],
          ["She's a teacher.", ["is", "has"], 0, "后面跟名词 → is。", "She's a teacher."],
          ["I'd love to come.", ["would", "had"], 0, "后面跟动词原形 love → would。", "I'd love to come."],
          ["I'd never seen snow before.", ["would", "had"], 1, "后面跟过去分词 seen → had。", "I'd never seen snow before."],
        ] },
        { type: "listen", q: "听一听：是 won't 还是 want？", opts: ["won't（不会）", "want（想要）"], items: [
          ["I won't go.", 0], ["I want to go.", 1], ["They won't stay.", 0], ["They want to stay.", 1], ["We won't eat here.", 0], ["We want to eat here.", 1],
        ] },
      ] },
    { id: "reduce", title: "口语缩读：gonna、wanna、gotta", icon: "💬",
      sections: [
        { h: "什么是缩读", p: "说得快的时候，一些高频词组被压缩成一个词。美剧和日常对话里**到处都是**，课本里却几乎不教。" },
        { h: "最常见的缩读", table: [["缩读", "原来是", "例子"],
          ["gonna", "going to", "I'm gonna call her."],
          ["wanna", "want to / want a", "I wanna go home."],
          ["gotta", "have got to / got to", "I gotta go."],
          ["hafta / hasta", "have to / has to", "You hafta try it."],
          ["kinda / sorta", "kind of / sort of", "It's kinda cold."],
          ["lotta / outta", "lot of / out of", "Get outta here!"],
          ["lemme / gimme", "let me / give me", "Lemme see. Gimme that."],
          ["dunno", "don't know", "I dunno."],
          ["ya / cha", "you（did you → didja, got you → gotcha）", "See ya! Gotcha."],
          ["'cause", "because", "'Cause I said so."],
          ["whaddaya / d'you", "what do you / do you", "Whaddaya want?"],
          ["shoulda / coulda / woulda", "should have / could have / would have", "You shoulda told me."]] },
        { h: "注意", p: "① gonna 只用在「将要」的意思：I'm gonna eat（将要吃），但 I'm going to Beijing（去北京）不能说 gonna Beijing。② 这些写法在正式写作、考试作文里**不能用**。③ 说的时候不必刻意模仿，**听得懂最重要**；说多了自然会出来。" },
      ],
      examples: [
        ["I'm going to call her.", "I'm gonna call her", "我要给她打电话。"], ["I want to go home.", "I wanna go home", "我想回家。"], ["I've got to go.", "I gotta go", "我得走了。"],
        ["You have to try it.", "you hafta try it", "你一定要试试。"], ["It's kind of cold.", "it's kinda cold", "有点冷。"], ["Let me see.", "lemme see", "让我看看。"],
        ["Give me a minute.", "gimme a minute", "给我一分钟。"], ["I don't know.", "I dunno", "我不知道。"], ["What do you want?", "whaddaya want", "你想要什么？"],
        ["Did you see that?", "didja see that", "你看到了吗？"], ["You should have told me.", "you shoulda told me", "你早该告诉我的。"], ["Get out of here!", "get outta here", "走开！/ 不会吧！"],
      ],
      drills: [
        { type: "choose", q: "这句缩读的原句是什么？", items: [
          ["I'm gonna be late.", ["I'm going to be late.", "I'm going be late.", "I'm gone to be late."], 0, "gonna = going to。", "I'm gonna be late."],
          ["You shoulda called.", ["You should call.", "You should have called.", "You should a call."], 1, "shoulda = should have。", "You should have called."],
          ["Whaddaya think?", ["What do you think?", "What did you think?", "What are you think?"], 0, "whaddaya = what do you。", "What do you think?"],
          ["Lemme help you.", ["Let me help you.", "Leave me help you.", "Lend me help you."], 0, "lemme = let me。", "Let me help you."],
          ["I gotta work tomorrow.", ["I got work tomorrow.", "I've got to work tomorrow.", "I go to work tomorrow."], 1, "gotta = (have) got to = 必须。", "I've got to work tomorrow."],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u8", title: "第八单元 · 句子重音和节奏", lessons: [
    { id: "rhythm", title: "实词重读、虚词轻读：英语的节奏", icon: "🥁",
      sections: [
        { h: "英语是「重音计时」的语言", p: "中文每个字占的时间差不多（音节计时）。英语不一样：**重读音节之间的时间差不多，中间不管夹了几个轻音节，都要「挤」进这段时间里**。所以轻音节被压得又快又弱。" },
        { h: "一个经典的例子", p: "下面这些句子越来越长，但**重读的词都只有三个**（CATS、CHASE、MICE），所以说出来的时间差不多：", table: [["句子", "重读"],
          ["Cats chase mice.", "CATS CHASE MICE"],
          ["The cats chase the mice.", "the CATS CHASE the MICE"],
          ["The cats will chase the mice.", "the CATS will CHASE the MICE"],
          ["The cats have been chasing the mice.", "the CATS have been CHASing the MICE"]] },
        { h: "哪些词重读", p: "**重读**：名词、实义动词、形容词、副词、疑问词（what、where……）、否定词（not、never、can't）、指示代词（this、that 单独用时）。**轻读**：冠词、介词、连词、人称代词、助动词（be、have、do、can……的肯定形式）。" },
        { h: "重读怎么读", p: "重读的词：**更响、更长、音调更高**，元音读饱满。轻读的词：快、轻、元音变 /ə/。练习时可以边说边拍手，只在重读音节上拍。" },
      ],
      examples: [
        ["Cats chase mice.", "CATS CHASE MICE", "猫追老鼠。"], ["The cats have been chasing the mice.", "the CATS have been CHASing the MICE", "猫一直在追老鼠。"],
        ["I want to go to the park.", "I WANT to GO to the PARK", "我想去公园。"], ["What do you think about it?", "WHAT do you THINK aBOUT it", "你觉得怎么样？"],
        ["She bought a new car last week.", "she BOUGHT a NEW CAR LAST WEEK", "她上周买了辆新车。"], ["I didn't see him at the party.", "I DIDN'T SEE him at the PARty", "我在派对上没看到他。"],
        ["Can you pass me the salt?", "can you PASS me the SALT", "能把盐递给我吗？"], ["Where did you put my keys?", "WHERE did you PUT my KEYS", "你把我钥匙放哪了？"],
      ],
      drills: [
        { type: "stress", q: "点出这句话里应该重读的词（实词）", items: [
          "I WANT to GO HOME.", "She LIVES in a BIG HOUSE.", "WHERE did you PUT my KEYS?", "I DIDN'T SEE him YESTERDAY.", "Can you PASS me the SALT?", "We're GOING to the BEACH on SATURDAY.",
        ] },
      ] },
    { id: "chunks", title: "意群和停顿：长句子怎么断", icon: "✂️",
      sections: [
        { h: "什么是意群", p: "长句子不是一口气读完的，而是分成几个**意思完整的小块**（意群），块和块之间稍微停一下，块里面的词连在一起读。停错地方，意思会变奇怪，别人也听得很累。" },
        { h: "在哪里停", p: "① 标点符号处。② 较长的主语后面：The man in the blue shirt / is my uncle。③ 从句、介词短语前：I'll call you / when I get home。④ and、but、because 这些连词前面。**不要停在**：冠词和名词之间（the / book ✗）、介词和它的宾语之间（in / the room ✗）。" },
        { h: "每个意群里通常有一个最重的词", p: "一般是这个意群的最后一个实词，读的时候音调在这里最突出：I'll call you when I get **HOME**。" },
        { h: "怎么练", p: "拿到一个长句子，先用 / 画出意群，每个意群当成一个「长单词」读，块和块之间换一口气。熟练以后停顿可以很短，但块里面一定不能断。" },
      ],
      examples: [
        ["The man in the blue shirt is my uncle.", "The man in the blue shirt / is my uncle.", "穿蓝衬衫的那个人是我叔叔。"],
        ["I'll call you when I get home.", "I'll call you / when I get home.", "我到家了给你打电话。"],
        ["If you have any questions, please let me know.", "If you have any questions, / please let me know.", "有问题请告诉我。"],
        ["The book that I bought yesterday is really interesting.", "The book that I bought yesterday / is really interesting.", "我昨天买的书很有意思。"],
        ["I wanted to go, but I was too tired.", "I wanted to go, / but I was too tired.", "我想去，可太累了。"],
        ["Most of the people in my office live outside the city.", "Most of the people in my office / live outside the city.", "我们办公室大部分人住在城外。"],
      ],
      drills: [
        { type: "choose", q: "哪种断句是对的？", items: [
          ["The girl with long hair is my sister.", ["The girl / with long hair is my sister.", "The girl with long hair / is my sister.", "The girl with long / hair is my sister."], 1, "长主语后面停。", "The girl with long hair is my sister."],
          ["I'll tell you when I see him.", ["I'll tell you / when I see him.", "I'll tell / you when I see him.", "I'll tell you when / I see him."], 0, "从句 when... 前面停。", "I'll tell you when I see him."],
          ["We stayed at home because it was raining.", ["We stayed at / home because it was raining.", "We stayed at home / because it was raining.", "We stayed / at home because / it was raining."], 1, "because 前面停。", "We stayed at home because it was raining."],
        ] },
      ] },
    { id: "contrast", title: "强调重音：重读哪个词，意思就不同", icon: "❗",
      sections: [
        { h: "重读可以「移动」", p: "正常情况下重读落在实词上，但说话人想**强调、对比或纠正**某个信息时，可以把最重的重音放到任何一个词上——连 I、he、did 这种平时轻读的词也可以。" },
        { h: "经典例句：I didn't say he stole the money.", table: [["重读的词", "言外之意"],
          ["I didn't say he stole the money.", "不是我说的（是别人说的）"],
          ["I DIDN'T say he stole the money.", "我没说过这话（否认）"],
          ["I didn't SAY he stole the money.", "我没说出来（只是暗示）"],
          ["I didn't say HE stole the money.", "我没说是他（是别人偷的）"],
          ["I didn't say he STOLE the money.", "我没说是偷（可能是借的）"],
          ["I didn't say he stole the MONEY.", "我没说偷的是钱（偷的是别的）"]] },
        { h: "最常用的场合：纠正别人", p: "A: Is it a **red** car? B: No, it's a **BLUE** car.（重读被纠正的信息）。A: Did **John** call? B: No, **MARY** called." },
        { h: "听的时候", p: "听到一个平时不该重读的词突然很重，说明**这里有对比或者言外之意**，要特别注意。" },
      ],
      examples: [
        ["I didn't say he stole the money.", "I didn't say HE stole the money.", "我没说是他偷的（是别人）。"],
        ["I didn't say he stole the money.", "I didn't say he stole the MONEY.", "我没说他偷的是钱。"],
        ["No, it's a blue car.", "No, it's a BLUE car.", "不，是辆蓝色的车。"], ["I said Tuesday, not Thursday.", "I said TUESday, not THURSday.", "我说的是周二，不是周四。"],
        ["I do like it!", "I DO like it!", "我真的很喜欢！"], ["It's your turn, not mine.", "It's YOUR turn, not MINE.", "轮到你了，不是我。"],
      ],
      drills: [
        { type: "choose", q: "说话人想表达什么？（大写的词重读）", items: [
          ["I didn't TAKE your pen.", ["不是我拿的", "我没拿（也许是借）", "我拿的不是你的笔"], 1, "重读 take → 否认的是「拿」这个动作。", ""],
          ["I didn't take YOUR pen.", ["不是我拿的", "我没拿（也许是借）", "我拿的不是你的笔"], 2, "重读 your → 我拿的是别人的笔。", ""],
          ["I didn't take your pen.（重读 I）", ["不是我拿的", "我没拿（也许是借）", "我拿的不是你的笔"], 0, "重读 I → 是别人拿的。", ""],
        ] },
      ] },
  ] },

  // ======================================================================
  { id: "u9", title: "第九单元 · 语调：音高的升和降", lessons: [
    { id: "fall", title: "降调 ↘：陈述、特殊疑问、命令", icon: "📉",
      sections: [
        { h: "降调是默认的语调", p: "句子最后一个重读音节上，音调**从高往下落**。表示说完了、很确定。用在：① 陈述句：I'm from China. ↘ ② **特殊疑问句**（what、where、who、how……开头的）：Where are you from? ↘ ③ 命令和请求：Close the door. ↘ ④ 感叹：What a nice day! ↘" },
        { h: "中国学习者的常见问题", p: "① 特殊疑问句用升调（Where are you from? ↗）——听起来像在质疑或者没听清。② 每句话都平平的没有起伏，听起来很无聊、不确定。**降调要降得够明显**，在最后一个重读词上从高处滑下来。" },
        { h: "降调落在哪", p: "落在**最后一个重读的词**上，而不一定是最后一个词：I'm from **CHI**↘na。What's your **NAME**↘?" },
      ],
      examples: [
        ["I'm from China.", "I'm from CHIna. ↘", "我来自中国。"], ["Where are you from?", "WHERE are you FROM? ↘", "你从哪里来？"], ["What's your name?", "What's your NAME? ↘", "你叫什么名字？"],
        ["How old are you?", "How OLD are you? ↘", "你多大了？"], ["Close the door, please.", "CLOSE the DOOR, please. ↘", "请关门。"], ["What a beautiful day!", "What a BEAUtiful DAY! ↘", "天气真好！"],
        ["I think so.", "I THINK so. ↘", "我想是的。"], ["Why are you late?", "WHY are you LATE? ↘", "你为什么迟到？"],
      ],
      drills: [
        { type: "choose", q: "这句话一般用升调还是降调？", items: [
          ["Where do you live?", ["↗ 升调", "↘ 降调"], 1, "特殊疑问句用降调。", "Where do you live?"],
          ["Do you live here?", ["↗ 升调", "↘ 降调"], 0, "一般疑问句（yes/no）用升调。", "Do you live here?"],
          ["Sit down, please.", ["↗ 升调", "↘ 降调"], 1, "请求、命令用降调。", "Sit down, please."],
          ["What time is it?", ["↗ 升调", "↘ 降调"], 1, "特殊疑问句。", "What time is it?"],
          ["Are you hungry?", ["↗ 升调", "↘ 降调"], 0, "一般疑问句。", "Are you hungry?"],
        ] },
      ] },
    { id: "rise", title: "升调 ↗：一般疑问、惊讶、没说完", icon: "📈",
      sections: [
        { h: "升调表示「还没完 / 不确定」", p: "最后一个重读音节上音调**往上扬**。用在：① **一般疑问句**（能用 yes / no 回答的）：Are you hungry? ↗ ② 用陈述句的形式提问、表示惊讶：You're leaving? ↗ ③ 没听清，请对方再说：Sorry? ↗ / Pardon? ↗ ④ 列举时前面的几项：apples ↗, oranges ↗, and bananas ↘ ⑤ 打招呼、显得友好：Hi! ↗" },
        { h: "选择疑问句：先升后降", p: "Would you like **tea** ↗ or **coffee** ↘?（二选一）。如果整句都升调：Would you like tea or coffee? ↗ 意思就变成了「要不要喝点什么（比如茶、咖啡之类）？」" },
        { h: "惊讶的 Really?", p: "Really? ↗（真的吗？表示惊讶、感兴趣）；Really. ↘（哦，是吗。表示不太感兴趣或者有点讽刺）。同一个词，语调不同，态度完全不同。" },
      ],
      examples: [
        ["Are you hungry?", "Are you HUNgry? ↗", "你饿吗？"], ["Do you like it?", "Do you LIKE it? ↗", "你喜欢吗？"], ["You're leaving?", "You're LEAVing? ↗", "你要走了？（惊讶）"],
        ["Sorry?", "Sorry? ↗", "什么？（没听清）"], ["Would you like tea or coffee?", "TEA ↗ or COFfee ↘", "你要茶还是咖啡？"], ["I need eggs, milk, and bread.", "EGGS ↗, MILK ↗, and BREAD ↘", "我要鸡蛋、牛奶和面包。"],
        ["Really?", "Really? ↗", "真的吗？"], ["Is this seat free?", "Is this SEAT free? ↗", "这个座位有人吗？"],
      ],
      drills: [
        { type: "choose", q: "选出合适的语调", items: [
          ["Would you like tea or coffee?（问对方二选一）", ["TEA ↗ or COFFEE ↗", "TEA ↗ or COFFEE ↘"], 1, "二选一：先升后降。", "Would you like tea or coffee?"],
          ["Sorry?（没听清，请对方再说一遍）", ["↗ 升调", "↘ 降调"], 0, "请对方重复用升调；降调的 Sorry. 是道歉。", "Sorry?"],
          ["You passed the exam?（非常惊讶）", ["↗ 升调", "↘ 降调"], 0, "陈述句形式表示惊讶时用升调。", "You passed the exam?"],
          ["I'm sorry.（真诚道歉）", ["↗ 升调", "↘ 降调"], 1, "道歉用降调。", "I'm sorry."],
        ] },
      ] },
    { id: "tags", title: "反意疑问句和降升调", icon: "🎢",
      sections: [
        { h: "反意疑问句的两种语调", p: "反意疑问句（..., isn't it? / ..., aren't you?）的意思取决于结尾的语调：", table: [["语调", "意思", "例子"],
          ["↘ 降调", "我很确定，只是想让你同意（不是真的问）", "It's a lovely day, isn't it? ↘"],
          ["↗ 升调", "我真的不确定，想问你", "You're coming tonight, aren't you? ↗"]] },
        { h: "降升调 ↘↗：话里有话", p: "先降再升，表示**还有没说出来的话**：保留、犹豫、委婉的不同意。A: Do you like it? B: Well... ↘↗（嗯……不太喜欢）。I like the color... ↘↗（但是别的不太喜欢）。It's not bad... ↘↗。" },
        { h: "听的时候", p: "反意疑问句降调时，对方期待你说 Yes；降升调说明对方「但是」还没说出口。这些语调信息往往比字面意思更重要。" },
      ],
      examples: [
        ["It's a lovely day, isn't it?", "..., ISn't it? ↘（确认）", "天气真好，是吧？"], ["You're coming tonight, aren't you?", "..., AREn't you? ↗（真的在问）", "你今晚会来的，对吧？"],
        ["You don't eat meat, do you?", "..., DO you? ↗", "你不吃肉，是吗？"], ["That was delicious, wasn't it?", "..., WASn't it? ↘", "很好吃，对吧？"],
        ["Well...", "Well... ↘↗", "嗯……（犹豫、不同意）"], ["I like the color...", "I like the COLor... ↘↗", "颜色我是喜欢……（但别的不行）"],
      ],
      drills: [
        { type: "choose", q: "说话人是什么意思？", items: [
          ["It's cold today, isn't it? ↘", ["很确定，想让你同意", "真的不确定，在问你"], 0, "降调 → 确认。", ""],
          ["You've met Tom before, haven't you? ↗", ["很确定，想让你同意", "真的不确定，在问你"], 1, "升调 → 真的在问。", ""],
          ["A: Did you like the movie? B: Well... ↘↗", ["很喜欢", "不太喜欢，但不好直说"], 1, "降升调表示保留。", ""],
        ] },
      ] },
    { id: "emotion", title: "语调和情绪：同一句话的不同态度", icon: "🎭",
      sections: [
        { h: "音高范围代表情绪", p: "**音调起伏大**（从很高降到很低）= 热情、真心、感兴趣；**音调很平**、起伏很小 = 无聊、敷衍、不高兴，甚至是讽刺。中文说话起伏比较小，所以中国人说英语常常**听起来不够热情**——这一点很多人自己都意识不到。" },
        { h: "同一句话的两种说法", table: [["说法", "意思"],
          ["That's GREAT! ↘（从很高降下来）", "太好了！（真心高兴）"],
          ["That's great.（平平的、低低的）", "哦，好吧。（敷衍，甚至讽刺）"],
          ["Thank you SO much! ↘", "非常感谢！（真心）"],
          ["Thanks.（平、短）", "谢了。（冷淡）"]] },
        { h: "怎么练", p: "跟读时**夸张地模仿**原音的音高起伏，自己觉得「太夸张了」的程度，在母语者听来往往刚刚好。录下来对比原音，看看自己是不是太平了。" },
      ],
      examples: [
        ["That's great!", "That's GREAT! ↘（热情）", "太好了！"], ["Thank you so much!", "Thank you SO much! ↘", "非常感谢！"], ["I'd love to!", "I'd LOVE to! ↘", "我很乐意！"],
        ["Oh, really?", "Oh, REALly? ↗（感兴趣）", "哦，真的吗？"], ["How was your weekend?", "How was your WEEKend? ↘（关心）", "周末过得怎么样？"], ["Nice to meet you!", "NICE to MEET you! ↘", "很高兴认识你！"],
      ],
      drills: [] },
  ] },

  // ======================================================================
  { id: "u10", title: "第十单元 · 综合练习：把所有技巧用在一段话里", lessons: [
    { id: "passage1", title: "综合练习一：自我介绍", icon: "🧑",
      sections: [
        { h: "怎么练这一课", p: "下面每句话都标出了连读（‿）、弱读（/ə/）、重读（大写）、停顿（/）和语调（↗↘）。练习步骤：① 先听原音，看着标注找出每个现象。② 一句一句跟读，用 🐢 慢速对照标注。③ 用 🎙️ 跟读评测检查。④ 最后不看标注，整段连起来说。" },
        { h: "这段话用到了什么", p: "连读：I'm‿a、kind‿of、a lot‿of、work‿in；弱读：to /tə/、and /ən/、for /fə/、of /ə/；闪音：a lot‿of → a lo-da；同化：Nice to meet you → mee-chu。" },
      ],
      examples: [
        ["Hi, I'm Li Wei.", "HI, ↗ I'm li WEI. ↘", "嗨，我是李伟。"],
        ["I'm a software engineer, and I work in Shanghai.", "I'm‿a SOFTware engiNEER, / /ən/ I WORK‿in SHANGhai. ↘", "我是一名软件工程师，在上海工作。"],
        ["I've been working there for about three years.", "I've been WORKing there /fər‿ə/BOUT THREE YEARS. ↘", "我在那儿工作了大概三年。"],
        ["In my free time, I like to go hiking and take photos.", "In my FREE TIME, / I LIKE /tə/ go HIKing /ən/ take PHOtos. ↘", "空闲时我喜欢徒步和拍照。"],
        ["I've been learning English for a long time,", "I've been LEARNing ENGlish /fər‿ə/ LONG TIME, ↗", "我学英语很久了，"],
        ["but I still find it kind of hard to speak fluently.", "but I STILL FIND‿it KIND‿of HARD /tə/ speak FLUently. ↘", "但还是觉得说流利有点难。"],
        ["Nice to meet you!", "NICE /tə/ MEE-[tʃ]u! ↘", "很高兴认识你！"],
      ],
      drills: [
        { type: "link", q: "点出连读的地方", items: ["I'm‿a software engineer.", "I work‿in Shanghai.", "I find‿it kind‿of hard.", "I've been there for‿about three years."] },
        { type: "stress", q: "点出重读的词", items: ["I LIKE to go HIKING.", "I've been LEARNING ENGLISH for a LONG TIME.", "NICE to MEET you."] },
      ] },
    { id: "passage2", title: "综合练习二：一段日常对话", icon: "☕",
      sections: [
        { h: "怎么练这一课", p: "这是一段两个人在咖啡店的对话，语速是正常口语。先整段听几遍，再一句一句模仿。注意问句的语调、弱读的 do you / are you、还有缩读 gonna、wanna。" },
      ],
      examples: [
        ["Hey! What are you doing here?", "HEY! ↗ WHAT /ə jə/ DOing HERE? ↘", "嘿！你怎么在这儿？"],
        ["I'm just grabbing a coffee before work. What about you?", "I'm just GRABbing‿a COFfee before WORK. ↘ / wha[d]‿aBOUT YOU? ↘", "上班前来买杯咖啡。你呢？"],
        ["Same here. Do you want to sit down for a minute?", "SAME HERE. ↘ / d'you WANna SIT DOWN /fər‿ə/ MINute? ↗", "我也是。要不要坐一会儿？"],
        ["Sure, I've got about ten minutes.", "SURE, ↘ / I've GO[d]‿aBOUT TEN MINutes. ↘", "好啊，我大概有十分钟。"],
        ["So, are you going to the party on Saturday?", "SO, / are you GONna /ðə/ PARty on SATurday? ↗", "那你周六去派对吗？"],
        ["I don't know yet. It kind of depends on my work.", "I dunno YET. ↘ / it KINda dePENDS‿on my WORK. ↘", "还不知道。有点看工作安排。"],
        ["Oh, come on! It's going to be fun.", "oh, COME‿ON! ↘ / it's GONna be FUN. ↘", "哎呀，来嘛！会很好玩的。"],
        ["OK, OK. I'll try to make it.", "O-KAY, o-KAY. ↘ / I'll TRY /tə/ MA‿KIT. ↘", "好吧好吧，我尽量去。"],
      ],
      drills: [
        { type: "stress", q: "点出重读的词", items: ["WHAT are you DOING HERE?", "Do you WANT to SIT DOWN?", "It's GOING to be FUN.", "I'll TRY to MAKE it."] },
      ] },
  ] },
);
