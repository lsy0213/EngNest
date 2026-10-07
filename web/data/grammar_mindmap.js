// 语法思维导图：每课的知识点树（对应 grammar*.js 里的课程 id）
// 节点写法："文字" 是叶子；["文字", [子节点…]] 是分支
(function () {
  window.GRAMMAR_MINDMAP = {
    // ================= 第一章 句子基础 =================
    sentence: [
      ["句子成分", [
        ["主干", ["主语：动作发出者 / 被描述对象", "谓语：由动词充当", "宾语：动作承受者", "表语：系动词后，说明状态"]],
        ["修饰", ["定语：修饰名词（a red car）", "状语：时间、地点、方式…", "补语：补充说明宾语（made him captain）"]],
      ]],
      ["五种基本句型", [
        "S + V：The baby is sleeping.",
        ["S + V + P（系表）", ["be, look, seem, feel", "become, get, sound, taste"]],
        "S + V + O：I love this city.",
        ["S + V + IO + DO（双宾）", ["give, send, show, buy, tell"]],
        ["S + V + O + C（复合宾语）", ["make, keep, find, call, let"]],
      ]],
      ["💡 要点", ["系动词后接形容词：sounds great", "读长句：先找谓语，再找主宾"]],
    ],
    "be-there": [
      ["be 动词", ["I → am / was", "he / she / it / 单数 → is / was", "you / we / they / 复数 → are / were"]],
      ["there be 句型", [
        "含义：某处存在某物",
        "就近原则：看紧跟 be 的第一个名词",
        ["各种时态", ["There was …", "There will be …", "There has been …"]],
      ]],
      ["💡 辨析", ["there be = 某处存在", "have = 某人拥有"]],
    ],
    questions: [
      ["一般疑问句", ["be / 助动词 / 情态动词提前", "用 yes / no 回答"]],
      ["特殊疑问句", ["疑问词 + 一般疑问句", "what / who / which / whose", "where / when / why", "how many / much / long / often"]],
      ["选择疑问句", ["… A or B?"]],
      ["反义疑问句", ["前肯后否，前否后肯", "时态、主语要对应", "Let's …, shall we?"]],
      ["祈使句", ["Please … / Don't … / Let's …"]],
      ["感叹句", ["What + (a) + 形 + 名！", "How + 形 / 副 + 主谓！"]],
      ["💡 易错", ["否定疑问句按事实回答", "Yes = 我喜欢（不）；No = 我不喜欢（是的）"]],
    ],

    // ================= 第二章 词法 =================
    nouns: [
      ["可数名词复数", [
        "一般 + s",
        "s / x / ch / sh 结尾 + es",
        "辅音 + y → ies",
        "f / fe → ves",
        ["不规则", ["man → men, child → children", "foot → feet, mouse → mice"]],
        "单复同形：sheep, fish, deer",
      ]],
      ["不可数名词", [
        "无复数，不能直接加 a / 数字",
        "advice, information, news, furniture…",
        "计量：a piece of / a cup of / a loaf of",
      ]],
      ["所有格", ["人：Tom's / parents'", "物：the end of the story", "共有 Tom and Mary's / 各有 Tom's and Mary's"]],
      ["💡 易错", ["news 是不可数：The news is good."]],
    ],
    article: [
      ["a / an（泛指）", ["看读音不看字母", "an hour, an honest man", "a university, a European"]],
      ["the（特指）", ["再次提到", "双方都知道的（open the door）", "独一无二（the sun）", "乐器：play the piano"]],
      ["零冠词", ["三餐：have breakfast", "交通：by bus", "球类：play tennis"]],
      ["💡 要点", ["go to school / bed、in hospital：做那件事本身"]],
    ],
    pronouns: [
      ["人称与物主", ["主格 I / 宾格 me", "形容词性 my + 名词", "名词性 mine 单独用", "反身 myself：by myself, help yourself"]],
      ["不定代词", [
        ["some / any", ["some：肯定句、请求建议", "any：否定句、疑问句"]],
        "something 等 + 形容词后置",
        ["范围", ["两者：both / either / neither", "三者及以上：all / any / none"]],
      ]],
      ["💡 易错", ["its = 它的；it's = it is"]],
    ],
    quantity: [
      ["数词", ["基数词：one hundred and five", "序数词：first, fifth, twelfth", "日期年代：May 1st, the 1990s", "分数：one third, two thirds"]],
      ["数量词", [
        ["可数", ["many / a few / few"]],
        ["不可数", ["much / a little / little"]],
        ["通用", ["a lot of / lots of / plenty of", "some / any"]],
        "a few / a little 肯定；few / little 否定",
      ]],
      ["hundred 类", ["具体数字：three hundred", "约数：hundreds of"]],
      ["💡 要点", ["much 多用于否定、疑问", "肯定句常用 a lot of"]],
    ],
    adjadv: [
      ["分工", ["形容词修饰名词", "副词修饰动词", "形 + ly → 副", "good → well；hard ≠ hardly"]],
      ["-ing / -ed", ["-ing：事物令人…", "-ed：人感到…"]],
      ["频度副词位置", ["实义动词前", "be / 助动词后"]],
      ["so / such / enough / too", ["so + 形容词 + that", "such + a + 形 + 名 + that", "形容词 + enough to", "too … to"]],
      ["多个形容词顺序", ["观点 → 大小 → 新旧 → 颜色 → 国籍 → 材料"]],
      ["💡 易错", ["感官系动词 + 形容词：sounds beautiful"]],
    ],
    compare: [
      ["变化规则", ["短词 + er / est", "重读闭音节双写：bigger", "辅音 + y → ier / iest", "长词 more / most", ["不规则", ["good → better → best", "bad → worse → worst", "little → less → least", "far → farther / further"]]]],
      ["比较级", ["A + 比较级 + than B"]],
      ["最高级", ["the + 最高级 + 范围", "… I've ever seen"]],
      ["常用句型", ["the more …, the better …", "as … as", "比较级 and 比较级"]],
      ["💡 易错", ["修饰比较级：much / a lot / even / far", "不能用 very"]],
    ],
    prepositions: [
      ["时间 at / on / in", ["at：时刻、节日时段", "on：具体某一天（含某天上下午）", "in：月、季、年、上午/晚上"]],
      ["地点 at / on / in", ["at：点（at the door）", "on：面（on the wall）", "in：空间范围（in the room）"]],
      ["其他常用", ["between / opposite", "for + 时间段 / since + 时间点", "by bus / on foot / in a car"]],
      ["固定搭配", ["be good at / interested in", "be afraid of / proud of", "depend on / wait for", "look forward to (doing)"]],
      ["💡 易错", ["next / last / this / every 前不加介词"]],
    ],
    conjunctions: [
      ["并列", ["and / but / or", "both … and", "either … or / neither … nor", "not only … but also"]],
      ["因果", ["because（原因）", "so（结果）"]],
      ["让步 / 转折", ["although + 句子", "despite + 名词", "However, + 句子"]],
      ["连接副词（写作）", ["递进：besides, moreover", "结果：therefore, as a result", "转折：however, on the other hand", "举例：for example", "总结：in conclusion"]],
      ["💡 易错", ["because 与 so 不连用", "although 与 but 不连用"]],
    ],

    // ================= 第三章 动词与时态 =================
    present: [
      ["一般现在时", ["结构：动词原形 / 三单 -s", "用法：习惯、事实、规律", "时间词：always, usually, every day"]],
      ["现在进行时", ["结构：am / is / are + doing", "用法：此刻正在、近阶段在做", "时间词：now, at the moment, these days"]],
      ["💡 易错", ["状态动词不用进行时", "know, like, want, need, believe"]],
    ],
    past: [
      ["一般过去时", ["结构：动词过去式", "用法：过去发生并已结束", "时间词：yesterday, last week, ago"]],
      ["过去进行时", ["结构：was / were + doing", "用法：过去某时刻正在做"]],
      ["两者搭配", ["长动作（背景）→ 过去进行", "短动作（打断）→ 一般过去", "when + 短动作", "while + 长动作"]],
    ],
    perfect: [
      ["结构", ["have / has + 过去分词"]],
      ["三种用法", ["对现在有影响（强调结果）", "从过去持续到现在", "到目前为止的经历"]],
      ["标志词", ["already / yet / just", "ever / never / so far", "for + 时间段", "since + 时间点"]],
      ["💡 易错", ["有明确过去时间不用完成时", "have been to 去过（已回）", "have gone to 去了（未回）"]],
    ],
    "perfect-cont": [
      ["结构", ["have / has been + doing"]],
      ["与现在完成时区别", ["完成时：强调结果、数量", "完成进行时：强调过程、持续"]],
      ["常见用法", ["解释眼前状况：I've been running."]],
      ["💡 易错", ["状态动词只用完成时：have known"]],
    ],
    "past-perfect": [
      ["过去完成时", ["结构：had + 过去分词", "过去的过去：先发生的用它", "By the end of last year, …"]],
      ["不用的情况", ["按顺序叙述，全用一般过去时"]],
      ["used to do", ["过去常常（现在不了）", "There used to be …", "Did you use to …?"]],
      ["三者辨析", ["used to do：过去常常", "be used to doing：习惯于", "be used to do：被用来做"]],
    ],
    future: [
      ["will", ["临时决定", "预测", "承诺"]],
      ["be going to", ["事先的计划", "有迹象的预测"]],
      ["现在进行时", ["已安排好的事"]],
      ["💡 易错", ["when / if / as soon as 从句", "用一般现在时表将来"]],
    ],
    "future-more": [
      ["将来进行时", ["will be doing", "将来某刻正在做", "委婉询问安排"]],
      ["将来完成时", ["will have done", "到将来某时已完成", "常搭配 by + 将来时间"]],
      ["过去将来时", ["would do / was going to do", "从过去看将来", "多见于间接引语"]],
      ["💡 要点", ["by + 将来 → 将来完成", "by + 过去 → 过去完成"]],
    ],
    phrasal: [
      ["高频短语", [
        ["look 系列", ["look for 寻找", "look after 照顾", "look up 查（词典）"]],
        ["其他", ["give up 放弃", "find out 查明", "put off 推迟", "pick up 捡起；接人", "run out of 用完", "come up with 想出", "set up 建立", "show up 出现"]],
      ]],
      ["宾语位置", ["动词 + 副词：代词必须放中间", "Turn it on.", "动词 + 介词：宾语只能放后面", "look for it"]],
      ["💡 方法", ["整句记忆，当成新词"]],
    ],
    modal: [
      ["can / could", ["能力", "请求（could 更礼貌）"]],
      ["may / might", ["许可：May I …?", "可能：might be late"]],
      ["must / have to", ["must：主观认为必须", "have to：客观不得不"]],
      ["should / had better", ["should：建议", "had better：最好（否则…）"]],
      ["💡 易错", ["mustn't = 禁止", "don't have to = 不必"]],
    ],
    "modal-deduce": [
      ["对现在推测", ["肯定 90%：must be", "否定 90%：can't be", "50%：may / might / could"]],
      ["对过去推测", ["must have done", "can't have done", "might have done"]],
      ["本该…", ["should have done：本该做却没做", "needn't have done：本不必做却做了"]],
      ["💡 易错", ["“一定不”用 can't，不是 mustn't"]],
    ],
    passive: [
      ["结构", ["be + 过去分词 (+ by 执行者)"]],
      ["各时态被动", ["一般现在：is cleaned", "一般过去：was built", "现在完成：has been solved", "将来：will be built", "进行：is being repaired", "情态：must be finished"]],
      ["何时用", ["执行者未知", "执行者不重要 / 不言自明"]],
    ],

    // ================= 第四章 非谓语动词 =================
    nonfinite: [
      ["to do（不定式）", ["表目的、将来", "want, hope, decide, plan", "agree, refuse, manage, expect"]],
      ["doing（动名词 / 现在分词）", ["表习惯、事实、主动进行", "enjoy, finish, mind, avoid", "practice, suggest, keep, give up", "look forward to doing"]],
      ["done（过去分词）", ["表被动、完成", "get my hair cut"]],
      ["意义不同的动词", ["remember / forget to do：要去做", "remember / forget doing：做过", "stop to do：停下去做别的", "stop doing：停止正在做的"]],
    ],
    infinitive: [
      ["作宾语 / 宾补", ["hope to do", "ask / tell sb. to do"]],
      ["省略 to", ["使役：make / let / have sb. do", "感官：see / hear / watch sb. do", "see sb. doing：看到正在做", "被动要还原 to：was made to do"]],
      ["作定语 / 目的状语", ["work to do", "get up early to catch …"]],
      ["常用句型", ["It is + 形容词 + to do", "疑问词 + to do", "too … for sb. to do"]],
      ["💡 易错", ["why 后不接 to do"]],
    ],
    participle: [
      ["作定语", ["doing：主动、进行", "done：被动、完成", "短语放名词后"]],
      ["作状语", ["Walking …, I …（主动）", "Seen from …, the city …（被动）", "Having done …（先完成）"]],
      ["常见错误", ["分词逻辑主语 = 句子主语"]],
      ["独立主格", ["Weather permitting, …"]],
      ["💡 判断", ["主动用 doing，被动用 done"]],
    ],

    // ================= 第五章 从句与虚拟 =================
    relative: [
      ["概念", ["修饰名词的从句", "英文长修饰语放名词后"]],
      ["关系词", [
        ["关系代词", ["who：指人", "which：指物", "that：人、物皆可", "whose：……的"]],
        ["关系副词", ["where：地点", "when：时间"]],
      ]],
      ["💡 要点", ["关系词作宾语时可省略"]],
    ],
    "relative-2": [
      ["限制 vs 非限制", ["限制：无逗号，缩小范围", "非限制：有逗号，补充说明", "非限制不用 that、不省略"]],
      ["which 指代整句", ["…, which surprised everyone."]],
      ["介词 + 关系词", ["in which / to whom", "介词看从句动词搭配"]],
      ["数量词 + of", ["both of whom", "some of which"]],
      ["💡 易错", ["介词后只用 which / whom", "不用 that / who"]],
    ],
    "noun-clause": [
      ["宾语从句", ["I think that …", "whether / if：是否", "疑问词引导：where the station is"]],
      ["主语从句", ["What he said …", "It is clear that …（形式主语）"]],
      ["表语从句", ["The problem is that …"]],
      ["💡 易错", ["从句用陈述语序", "否定转移：I don't think …"]],
    ],
    adverbial: [
      ["八大类型", [
        "时间：when, while, until, as soon as",
        "原因：because, since, as",
        "条件：if, unless, as long as, in case",
        "让步：although, even if, even though",
        "目的：so that, in order that",
        "结果：so … that, such … that",
        "比较：than, as … as",
        "方式：as, as if / as though",
      ]],
      ["重点辨析", ["unless = if not", "not … until：直到…才", "in case：以防"]],
      ["💡 易错", ["时间、条件从句用现在时表将来"]],
    ],
    reported: [
      ["陈述句", ["said (that) + 从句", "人称随说话人变"]],
      ["时态后退（主句过去时）", ["现在 → 过去", "现在进行 → 过去进行", "现在完成 / 过去 → 过去完成", "will / can / may → would / could / might"]],
      ["时间地点词", ["now → then", "today → that day", "tomorrow → the next day", "yesterday → the day before", "here → there, ago → before"]],
      ["疑问句", ["陈述语序", "一般疑问用 if / whether"]],
      ["祈使句", ["tell / ask sb. (not) to do"]],
      ["💡 例外", ["客观真理时态不变"]],
    ],
    conditional: [
      ["真实条件句", ["If + 现在时，will do"]],
      ["与现在相反", ["If + 过去式（be 用 were）", "主句 would + 动词原形"]],
      ["与过去相反", ["If + had done", "主句 would have done"]],
      ["wish 表遗憾", ["现在：wish + 过去式", "过去：wish + had done"]],
      ["💡 口诀", ["假设现在退到过去", "假设过去退到过去完成"]],
    ],
    "subjunctive-2": [
      ["as if / as though", ["好像：as if he were …"]],
      ["would rather", ["希望别人：would rather sb. did"]],
      ["It's (high) time", ["It's time we went …"]],
      ["建议要求类", ["suggest, insist, advise, demand", "require, order, recommend", "that + (should) + 动词原形", "It is important that sb. be …"]],
      ["混合虚拟", ["过去条件 + 现在结果", "If I had …, I would be … now"]],
      ["含蓄条件", ["without / but for：要不是"]],
      ["💡 例外", ["suggest = 表明时不用虚拟", "insist = 坚称时不用虚拟"]],
    ],

    // ================= 第六章 特殊句式 =================
    agreement: [
      ["语法一致", ["each / every- 作主语 → 单数", "Everyone is here."]],
      ["意义一致", ["时间、金钱作整体 → 单数", "family 整体单数 / 成员复数", "police 总是复数"]],
      ["就近一致", ["either … or / neither … nor", "not only … but also", "there be"]],
      ["就远一致", ["with / along with / together with", "as well as / besides / except"]],
      ["其他", ["the number of → 单数", "a number of → 复数", "动名词作主语 → 单数"]],
    ],
    inversion: [
      ["完全倒装", ["Here / There + 动词 + 名词", "地点状语提前：In front of … stands …", "主语是代词不倒装：Here it comes."]],
      ["部分倒装", [
        "否定词句首：never, seldom, hardly…",
        "not only / not until / no sooner",
        "only + 状语句首",
        "so / neither / nor + 助动词 + 主语",
        "省略 if 的虚拟：Had I known …",
      ]],
      ["💡 辨析", ["So do I：我也是", "So I do：我确实是（不倒装）"]],
    ],
    emphasis: [
      ["强调句", ["It is / was + 强调部分 + that / who", "可强调主语、宾语、状语", "检验：去掉后句子仍完整", "It was not until … that …"]],
      ["强调谓语", ["do / does / did + 动词原形"]],
      ["it 作形式主语", ["It is hard to do …", "It doesn't matter whether …"]],
      ["it 作形式宾语", ["find it difficult to do", "make it clear that …"]],
    ],
    ellipsis: [
      ["省略", ["答语省略：Yes, I am.", "动词省略：I can't (go).", "不定式只留 to", "从句省略主语 + be：When in Rome …"]],
      ["替代", ["so / not 替代从句：I think so. / I hope not.", "one 替代可数单数", "that 替代不可数 / 单数", "do 替代动词"]],
      ["💡 要点", ["I don't think so 比 I think not 常用"]],
    ],
  };
})();
