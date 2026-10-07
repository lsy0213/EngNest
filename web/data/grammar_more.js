// 语法扩展课程（第一部分：句子基础 + 词法）
// 结构同 grammar.js：quiz 中 q 题目, o 选项, a 正确选项下标, e 解析
(function () {
  const ex = (en, zh) => `<p class="ex"><span class="en">${en}</span><span class="zh">${zh}</span></p>`;
  const tip = (t) => `<div class="tip">💡 ${t}</div>`;
  const table = (rows) => `<table class="g-table">${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table>`;

  window.GRAMMAR_LESSONS.push(
    // ================= 第一章 句子基础 =================
    {
      id: "sentence",
      title: "句子成分与五种基本句型",
      level: "基础",
      summary: "英语句子都由主语、谓语、宾语等成分搭成，所有句子都能归到五种基本句型里。",
      content: `
        <h3>句子的主要成分</h3>
        ${table([["成分", "作用", "例子（加粗部分）"],
          ["主语", "动作的发出者 / 被描述的对象", "<b>Tom</b> likes music."],
          ["谓语", "说明主语做什么、是什么（由动词充当）", "Tom <b>likes</b> music."],
          ["宾语", "动作的承受者", "Tom likes <b>music</b>."],
          ["表语", "跟在系动词后，说明主语的状态", "She is <b>happy</b>."],
          ["定语", "修饰名词", "a <b>red</b> car"],
          ["状语", "修饰动词、形容词或整个句子（时间、地点、方式…）", "He runs <b>fast</b>."],
          ["补语", "补充说明宾语", "They made him <b>captain</b>."]])}
        <h3>五种基本句型</h3>
        <p><b>1. 主语 + 不及物动词（S + V）</b></p>
        ${ex("The baby is sleeping.", "宝宝在睡觉。")}
        <p><b>2. 主语 + 系动词 + 表语（S + V + P）</b>：常见系动词 be, look, seem, feel, become, get, sound, taste</p>
        ${ex("The soup tastes good.", "这汤味道很好。")}
        <p><b>3. 主语 + 及物动词 + 宾语（S + V + O）</b></p>
        ${ex("I love this city.", "我爱这座城市。")}
        <p><b>4. 主语 + 动词 + 间接宾语 + 直接宾语（S + V + IO + DO）</b>：give, send, show, buy, tell</p>
        ${ex("She gave me a book.", "她给了我一本书。＝ She gave a book to me.")}
        <p><b>5. 主语 + 动词 + 宾语 + 宾语补足语（S + V + O + C）</b>：make, keep, find, call, let</p>
        ${ex("The news made everyone happy.", "这个消息让大家都很开心。")}
        ${tip("系动词后面接<b>形容词</b>，不接副词：It sounds <b>great</b>.（不说 sounds greatly）")}
        ${tip("读长句的诀窍：先找谓语动词，再找它的主语和宾语，剩下的都是修饰成分。")}
      `,
      quiz: [
        { q: "The flowers smell ___.", o: ["sweet", "sweetly", "sweetness", "sweeten"], a: 0, e: "smell 在这里是系动词，后面接形容词作表语。" },
        { q: "Which sentence is S + V + IO + DO?", o: ["He runs every day.", "My mom bought me a bike.", "She looks tired.", "We found the room empty."], a: 1, e: "bought 后有两个宾语：me（间接宾语）和 a bike（直接宾语）。" },
        { q: "In \"We found the room empty\", \"empty\" is the ___.", o: ["subject", "object", "object complement", "adverbial"], a: 2, e: "empty 补充说明宾语 the room 的状态，是宾语补足语。" },
        { q: "Which verb is a linking verb in this sentence: \"She became a doctor.\"", o: ["She", "became", "a", "doctor"], a: 1, e: "become 是系动词，a doctor 是表语。" },
        { q: "Please keep the door ___.", o: ["close", "closed", "closing", "to close"], a: 1, e: "keep + 宾语 + 宾补；门是「被关上的」状态，用过去分词 closed。" },
      ],
    },
    {
      id: "be-there",
      title: "be 动词与 there be 句型",
      level: "基础",
      summary: "be 动词表示「是 / 在」，there be 表示「某处有某物」，是最常用的两个结构。",
      content: `
        <h3>be 动词的形式</h3>
        ${table([["主语", "现在", "过去"], ["I", "am", "was"], ["he / she / it / 单数名词", "is", "was"], ["you / we / they / 复数名词", "are", "were"]])}
        ${ex("I am a nurse. My parents are teachers.", "我是护士。我父母是老师。")}
        ${ex("Where were you last night?", "你昨晚在哪儿？")}
        <h3>there be：某处存在某物</h3>
        ${ex("There is a cat under the table.", "桌子下面有一只猫。")}
        ${ex("There are two banks near my home.", "我家附近有两家银行。")}
        <p><b>就近原则</b>：be 的单复数由紧跟它的第一个名词决定。</p>
        ${ex("There is a pen and two books on the desk.", "桌上有一支笔和两本书。（紧跟的是 a pen，所以用 is）")}
        <h3>there be 的各种时态</h3>
        ${ex("There was a big storm last night.", "昨晚有一场大暴风雨。")}
        ${ex("There will be a meeting tomorrow.", "明天有个会。（不说 There will have）")}
        ${ex("There has been a lot of rain this year.", "今年雨水很多。")}
        ${tip("there be 和 have 的区别：there be 表示「某处存在」，have 表示「某人拥有」。说 <b>There are</b> many people in the park.，不说 The park has many people（口语中偶尔可以，但不地道）。")}
      `,
      quiz: [
        { q: "There ___ some milk in the fridge.", o: ["is", "are", "be", "have"], a: 0, e: "milk 是不可数名词，用 is。" },
        { q: "There ___ a teacher and forty students in the classroom.", o: ["is", "are", "am", "be"], a: 0, e: "就近原则：紧跟 be 的是 a teacher（单数），用 is。" },
        { q: "There ___ a football match on TV tonight.", o: ["will have", "is going to have", "will be", "has"], a: 2, e: "there be 的将来时是 there will be / there is going to be。" },
        { q: "My brother and I ___ at home yesterday.", o: ["was", "were", "are", "is"], a: 1, e: "主语是复数（my brother and I），过去时用 were。" },
        { q: "— ___ there any questions? — No, there aren't.", o: ["Is", "Are", "Do", "Have"], a: 1, e: "questions 是复数，疑问句用 Are there…?" },
      ],
    },
    {
      id: "questions",
      title: "疑问句、反义疑问句、祈使句与感叹句",
      level: "基础",
      summary: "学会怎么提问、怎么请求、怎么表达感叹，口语里天天都要用。",
      content: `
        <h3>一般疑问句：用 yes / no 回答</h3>
        <p>把 be / 助动词 / 情态动词提到主语前面。</p>
        ${ex("Are you ready? Do you like coffee? Can you swim?", "你准备好了吗？你喜欢咖啡吗？你会游泳吗？")}
        <h3>特殊疑问句：疑问词 + 一般疑问句</h3>
        <p>what 什么 · who 谁 · which 哪个 · whose 谁的 · where 哪里 · when 何时 · why 为什么 · how 怎样 / how many / how much / how long / how often</p>
        ${ex("Where do you live? How often do you exercise?", "你住在哪里？你多久锻炼一次？")}
        ${ex("Who told you that?", "谁告诉你的？（who 作主语时不用 do）")}
        <h3>选择疑问句</h3>
        ${ex("Would you like tea or coffee?", "你想喝茶还是咖啡？")}
        <h3>反义疑问句：陈述句 + 简短问句</h3>
        <p><b>前肯后否，前否后肯</b>，时态和主语要对应。</p>
        ${ex("It's a nice day, isn't it?", "今天天气不错，对吧？")}
        ${ex("You don't eat meat, do you?", "你不吃肉，是吗？")}
        ${ex("Let's go, shall we?", "我们走吧，好吗？（Let's 开头用 shall we）")}
        <h3>祈使句：请求、命令、建议</h3>
        ${ex("Please sit down. Don't be late. Let's take a break.", "请坐。别迟到。我们休息一下吧。")}
        <h3>感叹句</h3>
        ${ex("What a beautiful day (it is)!", "多美好的一天啊！（What + 名词）")}
        ${ex("How fast he runs!", "他跑得真快啊！（How + 形容词/副词）")}
        ${tip("回答否定疑问句按<b>事实</b>回答：— Don't you like it? — <b>Yes</b>, I do.（不，我喜欢）/ <b>No</b>, I don't.（是的，我不喜欢）。和中文习惯正好相反！")}
      `,
      quiz: [
        { q: "She can speak French, ___?", o: ["can she", "can't she", "doesn't she", "isn't she"], a: 1, e: "前肯后否；前面用的是 can，后面用 can't she。" },
        { q: "___ do you go to the gym? — Three times a week.", o: ["How long", "How often", "How many", "How much"], a: 1, e: "问频率用 how often。" },
        { q: "___ interesting book it is!", o: ["What", "What an", "How", "How an"], a: 1, e: "What + a/an + 形容词 + 可数名词单数；interesting 以元音开头用 an。" },
        { q: "— You didn't go to the party, did you? — ___. I was too busy.", o: ["Yes, I did", "No, I didn't", "Yes, I didn't", "No, I did"], a: 1, e: "按事实回答：没去，所以用 No, I didn't（中文意思是「是的，我没去」）。" },
        { q: "___ told you the news?", o: ["Who", "Whom", "Whose", "Who did"], a: 0, e: "who 在句中作主语，直接跟动词，不需要助动词 did。" },
      ],
    },

    // ================= 第二章 词法 =================
    {
      id: "nouns",
      title: "名词：可数与不可数、复数、所有格",
      level: "基础",
      summary: "名词分可数和不可数，可数名词有单复数，表示「谁的」要用所有格。",
      content: `
        <h3>可数名词的复数</h3>
        ${table([["规则", "例子"],
          ["一般加 -s", "book → books, day → days"],
          ["以 s, x, ch, sh 结尾加 -es", "bus → buses, box → boxes, watch → watches"],
          ["辅音 + y 结尾，变 y 为 i 加 -es", "city → cities, baby → babies"],
          ["以 f / fe 结尾，多数变 ves", "leaf → leaves, knife → knives, life → lives"],
          ["不规则变化", "man → men, child → children, foot → feet, tooth → teeth, mouse → mice"],
          ["单复数同形", "sheep, fish, deer, Chinese, species"]])}
        <h3>不可数名词</h3>
        <p>没有复数形式，不能直接用 a/an 和数字：water, money, information, advice, news, furniture, homework, luggage, equipment, bread</p>
        ${ex("Can you give me some advice?", "你能给我一些建议吗？（不说 an advice / advices）")}
        ${ex("two pieces of information, a cup of tea, a loaf of bread", "表示数量要借助量词：两条信息、一杯茶、一条面包")}
        <h3>名词所有格：「……的」</h3>
        ${ex("Tom's car, my parents' house, the children's toys", "单数加 's；以 s 结尾的复数只加 '；不以 s 结尾的复数加 's")}
        ${ex("the name of the song, the end of the story", "无生命的东西常用 of 结构")}
        ${ex("Tom and Mary's mother / Tom's and Mary's bikes", "共有：最后一个加 's；各自拥有：每个都加 's")}
        ${tip("news 看起来像复数，其实是不可数名词：The news <b>is</b> good.")}
      `,
      quiz: [
        { q: "I need some ___ about the train times.", o: ["information", "informations", "an information", "information's"], a: 0, e: "information 是不可数名词，没有复数，不能加 an。" },
        { q: "There are three ___ in the tree.", o: ["leafs", "leaves", "leaf", "leafes"], a: 1, e: "leaf 的复数是 leaves。" },
        { q: "This is my ___ room. They share it.", o: ["sister's", "sisters'", "sisters's", "sister"], a: 1, e: "They share it，说明是两个姐妹共用，复数 sisters 的所有格只加 '。" },
        { q: "How many ___ do you have?", o: ["furniture", "furnitures", "pieces of furniture", "piece of furnitures"], a: 2, e: "furniture 不可数，计数要用 pieces of furniture。" },
        { q: "The ___ are playing in the garden.", o: ["child", "childs", "children", "childrens"], a: 2, e: "child 的复数是不规则的 children。" },
      ],
    },
    {
      id: "pronouns",
      title: "代词：人称、物主、反身与不定代词",
      level: "基础",
      summary: "代词用来代替名词，避免重复。人称代词分主格和宾格，还有 my/mine、myself、some/any 等。",
      content: `
        <h3>人称代词和物主代词</h3>
        ${table([["主格", "宾格", "形容词性物主", "名词性物主", "反身代词"],
          ["I", "me", "my", "mine", "myself"],
          ["you", "you", "your", "yours", "yourself / yourselves"],
          ["he", "him", "his", "his", "himself"],
          ["she", "her", "her", "hers", "herself"],
          ["it", "it", "its", "its", "itself"],
          ["we", "us", "our", "ours", "ourselves"],
          ["they", "them", "their", "theirs", "themselves"]])}
        ${ex("This is my phone. That one is hers.", "这是我的手机，那部是她的。（my + 名词；hers 单独使用）")}
        ${ex("Help yourself to some fruit.", "请随便吃点水果。")}
        ${ex("I did it by myself.", "我自己完成的。")}
        <h3>不定代词</h3>
        <p><b>some</b> 用于肯定句，<b>any</b> 用于否定句和疑问句；表示请求、建议的疑问句用 some。</p>
        ${ex("I have some friends here. I don't have any money.", "我在这里有些朋友。我没有钱。")}
        ${ex("Would you like some tea?", "要来点茶吗？（邀请用 some）")}
        <p><b>something / anything / nothing / everything</b>，形容词放在后面：</p>
        ${ex("Is there anything interesting in the news?", "新闻里有什么有意思的吗？")}
        <p><b>both / either / neither</b>（两者），<b>all / any / none</b>（三者及以上）</p>
        ${ex("Neither of my parents likes coffee.", "我父母都不喜欢咖啡。")}
        ${tip("its 是「它的」，it's 是 it is 的缩写：The dog wagged <b>its</b> tail. / <b>It's</b> raining.")}
      `,
      quiz: [
        { q: "Is this bag ___? — No, mine is black.", o: ["you", "your", "yours", "yourself"], a: 2, e: "后面没有名词，用名词性物主代词 yours。" },
        { q: "Did you enjoy ___ at the party?", o: ["you", "your", "yours", "yourselves"], a: 3, e: "enjoy oneself 玩得开心，主语是 you（复数或单数都可），选项中只有 yourselves 是反身代词。" },
        { q: "I'm hungry. Is there ___ to eat?", o: ["something", "anything", "nothing", "everything"], a: 1, e: "疑问句中表示「什么东西」用 anything。" },
        { q: "___ of the two answers is correct. Both are wrong.", o: ["Either", "Neither", "None", "Both"], a: 1, e: "两者都不，用 neither。" },
        { q: "The cat is licking ___ paw.", o: ["it's", "its", "it", "itself"], a: 1, e: "「它的」是 its，it's = it is。" },
      ],
    },
    {
      id: "quantity",
      title: "数词与数量表达",
      level: "基础",
      summary: "基数词、序数词、日期、分数，以及 many / much / a few / a little 等数量词。",
      content: `
        <h3>基数词与序数词</h3>
        ${ex("one, two, three … twenty-one … one hundred and five", "基数词：表示数量")}
        ${ex("first, second, third, fifth, ninth, twelfth, twentieth", "序数词：表示顺序，注意特殊拼写")}
        ${ex("the 1st of May / May 1st, in 2024, in the 1990s", "日期和年代")}
        ${ex("one third, two thirds, a half, a quarter", "分数：分子用基数词，分母用序数词，分子大于 1 时分母加 s")}
        <h3>many / much 与 a few / a little</h3>
        ${table([["", "修饰可数名词", "修饰不可数名词"],
          ["很多", "many (books)", "much (water)"],
          ["一些（肯定）", "a few (friends)", "a little (time)"],
          ["几乎没有（否定）", "few (friends)", "little (time)"],
          ["都可以用", "a lot of / lots of / plenty of / some / any", "同左"]])}
        ${ex("I have a few friends here, so I'm not lonely.", "我在这里有几个朋友，所以不孤单。")}
        ${ex("He has few friends, so he often feels lonely.", "他几乎没有朋友，所以常感到孤独。")}
        <h3>hundred / thousand / million 的用法</h3>
        ${ex("three hundred people / hundreds of people", "有具体数字时不加 s；表示「成百上千」时用 hundreds of")}
        ${tip("much 一般用于否定句和疑问句，肯定句更常说 a lot of：I don't have <b>much</b> time. / I have <b>a lot of</b> time.")}
      `,
      quiz: [
        { q: "There isn't ___ milk left. Let's buy some.", o: ["many", "much", "few", "a few"], a: 1, e: "milk 不可数，否定句用 much。" },
        { q: "Don't worry. We still have ___ time.", o: ["a little", "little", "a few", "few"], a: 0, e: "time 不可数，「还有一点」是肯定意味，用 a little。" },
        { q: "___ people came to the concert. The hall was full.", o: ["Hundred of", "Hundreds of", "Hundreds", "Hundred"], a: 1, e: "表示「数以百计」用 hundreds of。" },
        { q: "Today is her ___ birthday.", o: ["twenty", "twentyth", "twentieth", "twentith"], a: 2, e: "twenty 的序数词是 twentieth（y 变 ie 加 th）。" },
        { q: "About ___ of the students are girls.", o: ["two third", "two thirds", "second three", "two three"], a: 1, e: "分子大于 1，分母序数词加 s：two thirds。" },
      ],
    },
    {
      id: "adjadv",
      title: "形容词与副词",
      level: "基础",
      summary: "形容词修饰名词，副词修饰动词、形容词或整句。注意位置、-ed/-ing 以及 so/such/enough。",
      content: `
        <h3>形容词与副词的分工</h3>
        ${ex("She is a careful driver. She drives carefully.", "她是个谨慎的司机。她开车很谨慎。")}
        <p>副词常由形容词加 -ly：quick → quickly, happy → happily, gentle → gently；特殊：good → well，fast → fast，hard → hard（hardly 意思是「几乎不」）</p>
        <h3>-ed 和 -ing 形容词</h3>
        ${ex("The movie was boring, so I was bored.", "电影很无聊，所以我觉得很无聊。")}
        <p>-ing：事物「令人……的」；-ed：人「感到……的」。interesting / interested, exciting / excited, surprising / surprised, tiring / tired</p>
        <h3>频度副词的位置</h3>
        <p>always, usually, often, sometimes, seldom, never：放在<b>实义动词前</b>、<b>be 动词和助动词后</b>。</p>
        ${ex("I often go jogging. She is always late. I have never been there.", "我经常慢跑。她总是迟到。我从没去过那里。")}
        <h3>so / such / enough / too</h3>
        ${ex("It was so cold that we stayed inside.", "天太冷了，我们待在屋里。（so + 形容词）")}
        ${ex("It was such a cold day that we stayed inside.", "那天太冷了……（such + (a) + 形容词 + 名词）")}
        ${ex("He is old enough to drive. He is too young to drive.", "他够年龄开车了。他太小，还不能开车。（enough 放在形容词后）")}
        <h3>多个形容词的顺序</h3>
        <p>观点 → 大小 → 新旧 → 颜色 → 国籍 → 材料 + 名词</p>
        ${ex("a lovely small old red Chinese wooden box", "一个可爱的小的旧红色中国木盒子")}
        ${tip("感官类系动词后用形容词：The music sounds <b>beautiful</b>.（不说 beautifully）")}
      `,
      quiz: [
        { q: "I was very ___ when I heard the news.", o: ["surprise", "surprising", "surprised", "surprisedly"], a: 2, e: "人「感到惊讶」用 -ed 形容词 surprised。" },
        { q: "She speaks English very ___.", o: ["good", "well", "nice", "fluent"], a: 1, e: "修饰动词 speaks 要用副词，good 的副词是 well。" },
        { q: "He ___ late for work.", o: ["never is", "is never", "never", "does never"], a: 1, e: "频度副词放在 be 动词之后：is never。" },
        { q: "It was ___ good movie that I watched it twice.", o: ["so", "such", "such a", "so a"], a: 2, e: "such + a + 形容词 + 单数名词 + that。" },
        { q: "The box isn't ___ to hold all the books.", o: ["enough big", "big enough", "too big", "so big"], a: 1, e: "enough 修饰形容词时放在形容词后面：big enough。" },
      ],
    },
    {
      id: "prepositions",
      title: "介词：时间、地点与常见搭配",
      level: "基础",
      summary: "in / on / at 的用法是最容易错的地方，此外还要记住很多固定搭配。",
      content: `
        <h3>时间介词 in / on / at</h3>
        ${table([["介词", "用法", "例子"],
          ["at", "具体时刻、节日时段", "at 7:30, at noon, at night, at the weekend(英), at Christmas"],
          ["on", "具体某一天（包括某天的上午/下午）", "on Monday, on May 1st, on my birthday, on Sunday morning"],
          ["in", "较长的时间：月、季节、年、世纪，一天中的上午下午晚上", "in July, in summer, in 2020, in the morning"]])}
        ${ex("I was born in 1995, on a cold morning in January.", "我出生在 1995 年一月的一个寒冷的早晨。")}
        <h3>地点介词 in / on / at</h3>
        ${ex("at the door, at the bus stop, at home, at school", "at：一个点")}
        ${ex("on the wall, on the table, on the second floor", "on：表面上")}
        ${ex("in the room, in the box, in China, in the city", "in：在……里面、较大的地方")}
        <h3>其他常用介词</h3>
        ${ex("The shop is between the bank and the café, opposite the park.", "商店在银行和咖啡馆之间，公园对面。")}
        ${ex("I've lived here for three years / since 2021.", "for + 时间段；since + 时间点")}
        ${ex("by bus, on foot, in a car, by email", "交通和方式：by + 交通工具（无冠词）；on foot 步行")}
        <h3>常见固定搭配</h3>
        <p>be good at 擅长 · be interested in 对……感兴趣 · be afraid of 害怕 · be proud of 以……自豪 · depend on 取决于 · look forward to 期待 · wait for 等待 · agree with sb. 同意某人 · arrive at/in 到达</p>
        ${tip("next / last / this / every 前面不用介词：I'll see you <b>next Monday</b>.（不说 on next Monday）")}
      `,
      quiz: [
        { q: "The meeting starts ___ 9 o'clock ___ Monday.", o: ["at; on", "on; at", "in; on", "at; in"], a: 0, e: "具体时刻用 at，具体某一天用 on。" },
        { q: "We usually go skiing ___ winter.", o: ["on", "at", "in", "by"], a: 2, e: "季节前用 in。" },
        { q: "I've worked here ___ 2019.", o: ["for", "since", "from", "in"], a: 1, e: "2019 是时间点，和现在完成时连用，用 since。" },
        { q: "She is very good ___ math.", o: ["in", "on", "at", "for"], a: 2, e: "be good at 擅长……" },
        { q: "I'll call you ___.", o: ["on next Friday", "at next Friday", "next Friday", "in next Friday"], a: 2, e: "next 前面不用介词。" },
      ],
    },
    {
      id: "conjunctions",
      title: "连词与连接副词",
      level: "基础",
      summary: "连词把词、短语和句子连起来，表达并列、转折、因果、让步等逻辑关系。",
      content: `
        <h3>并列连词</h3>
        ${ex("I like tea, but my wife prefers coffee.", "我喜欢茶，但我妻子更喜欢咖啡。（and 并列 · but 转折 · or 选择 · so 结果）")}
        ${ex("Hurry up, or you'll miss the bus.", "快点，否则你会赶不上公交。（祈使句 + or = 否则）")}
        ${ex("both A and B / either A or B / neither A nor B / not only A but also B", "成对连词")}
        <h3>因果</h3>
        ${ex("I stayed at home because it was raining.", "因为下雨，我待在家里。")}
        ${ex("It was raining, so I stayed at home.", "下雨了，所以我待在家里。")}
        ${tip("中文说「因为……所以……」，英文里 <b>because 和 so 不能同时用</b>；同理 although 和 but 也不能同时用。")}
        <h3>让步 / 转折：although vs despite vs however</h3>
        ${ex("Although it was late, she kept working.", "虽然很晚了，她还在工作。（although + 句子）")}
        ${ex("Despite the rain, we went out.", "尽管下雨，我们还是出去了。（despite / in spite of + 名词或 doing）")}
        ${ex("It was expensive. However, we bought it.", "很贵。然而我们还是买了。（however 是副词，常用句号或分号隔开）")}
        <h3>常用连接副词（写作必备）</h3>
        <p>递进：besides, moreover, in addition · 结果：therefore, as a result · 转折：however, on the other hand · 举例：for example, for instance · 总结：in conclusion, in short</p>
      `,
      quiz: [
        { q: "___ he was tired, he finished the report.", o: ["Because", "Although", "Despite", "However"], a: 1, e: "前后是让步关系，后接完整句子，用 although。" },
        { q: "___ the bad weather, the flight took off on time.", o: ["Although", "Despite", "Because", "However"], a: 1, e: "后接名词短语 the bad weather，用 despite。" },
        { q: "Study hard, ___ you will pass the exam.", o: ["or", "but", "and", "so"], a: 2, e: "祈使句 + and = 那么就会……（顺承）。" },
        { q: "Neither my brother ___ I like spicy food.", o: ["or", "nor", "and", "but"], a: 1, e: "neither … nor … 两者都不。" },
        { q: "Because it was raining, ___.", o: ["so we stayed home", "we stayed home", "but we stayed home", "and we stayed home"], a: 1, e: "because 和 so 不能同时用。" },
      ],
    },
  );
})();
