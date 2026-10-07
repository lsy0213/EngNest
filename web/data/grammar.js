// 语法课：从最常用的时态开始，逐步到从句和虚拟语气
// quiz: q 题目, o 选项, a 正确选项下标, e 解析
(function () {
  const ex = (en, zh) => `<p class="ex"><span class="en">${en}</span><span class="zh">${zh}</span></p>`;
  const tip = (t) => `<div class="tip">💡 ${t}</div>`;

  window.GRAMMAR_LESSONS = [
    {
      id: "present",
      title: "一般现在时 vs 现在进行时",
      level: "基础",
      summary: "习惯和事实用一般现在时，正在发生的事用现在进行时。",
      content: `
        <h3>一般现在时：习惯、事实、规律</h3>
        <p>结构：主语 + 动词原形（第三人称单数加 <b>-s / -es</b>）</p>
        ${ex("I drink coffee every morning.", "我每天早上喝咖啡。（习惯）")}
        ${ex("She works in a bank.", "她在银行工作。（事实）")}
        ${ex("Water boils at 100 degrees.", "水在 100 度沸腾。（规律）")}
        <p>常见时间词：always, usually, often, sometimes, never, every day</p>
        <h3>现在进行时：此刻正在做、近阶段在做</h3>
        <p>结构：主语 + <b>am / is / are + doing</b></p>
        ${ex("I'm reading a book right now.", "我现在正在看书。")}
        ${ex("She is learning to drive these days.", "她这段时间在学开车。")}
        <p>常见时间词：now, right now, at the moment, these days, Look! Listen!</p>
        ${tip("状态动词（like, love, know, want, need, believe）一般<b>不用</b>进行时：说 I <b>know</b> him，不说 I am knowing him。")}
      `,
      quiz: [
        { q: "My sister ___ to work by bus every day.", o: ["go", "goes", "is going", "going"], a: 1, e: "every day 表示习惯，用一般现在时；主语 my sister 是第三人称单数，动词加 -es。" },
        { q: "Look! The children ___ in the park.", o: ["play", "plays", "are playing", "played"], a: 2, e: "Look! 提示动作正在发生，用现在进行时 are playing。" },
        { q: "I ___ what you mean.", o: ["understand", "am understanding", "understands", "understanding"], a: 0, e: "understand 是状态动词，一般不用进行时。" },
        { q: "— Where is Tom? — He ___ a shower.", o: ["takes", "take", "is taking", "has taken"], a: 2, e: "问的是此刻 Tom 在哪，说明他此刻正在洗澡，用现在进行时。" },
        { q: "The sun ___ in the east.", o: ["rise", "rises", "is rising", "rose"], a: 1, e: "客观规律用一般现在时，sun 是单数，用 rises。" },
      ],
    },
    {
      id: "past",
      title: "一般过去时 vs 过去进行时",
      level: "基础",
      summary: "过去完成的动作用一般过去时，过去某一刻正在进行的动作用过去进行时。",
      content: `
        <h3>一般过去时：过去发生并结束的事</h3>
        <p>结构：主语 + 动词过去式（规则动词加 <b>-ed</b>，不规则动词需要记忆）</p>
        ${ex("I visited my grandparents last weekend.", "我上周末去看望了祖父母。")}
        ${ex("She bought a new phone yesterday.", "她昨天买了一部新手机。")}
        <p>常见时间词：yesterday, last week, two days ago, in 2020, just now</p>
        <h3>过去进行时：过去某个时刻正在做的事</h3>
        <p>结构：主语 + <b>was / were + doing</b></p>
        ${ex("I was watching TV at eight last night.", "昨晚八点我正在看电视。")}
        <h3>两者搭配：正在做某事时，另一件事发生了</h3>
        ${ex("I was cooking when the phone rang.", "我正在做饭时，电话响了。")}
        ${ex("While we were walking, it started to rain.", "我们正走着的时候，开始下雨了。")}
        ${tip("长动作（背景）用过去进行时，短动作（打断）用一般过去时。when 后面常接短动作，while 后面常接长动作。")}
      `,
      quiz: [
        { q: "We ___ a great time at the party last night.", o: ["have", "had", "were having", "has"], a: 1, e: "last night 是过去时间，描述过去完成的事，用一般过去时 had。" },
        { q: "What ___ you doing at 9 o'clock yesterday evening?", o: ["did", "are", "were", "was"], a: 2, e: "过去某一时刻正在做什么，用过去进行时；主语 you 搭配 were。" },
        { q: "I ___ a shower when my friend called.", o: ["took", "was taking", "take", "am taking"], a: 1, e: "洗澡是被打断的长动作，用过去进行时。" },
        { q: "She ___ to London three years ago.", o: ["moves", "has moved", "moved", "was moving"], a: 2, e: "three years ago 是明确的过去时间点，用一般过去时。" },
        { q: "While I ___ home, I saw an old friend.", o: ["walked", "was walking", "walk", "am walking"], a: 1, e: "while 引导的是持续的背景动作，用过去进行时。" },
      ],
    },
    {
      id: "perfect",
      title: "现在完成时",
      level: "基础",
      summary: "过去的动作对现在有影响，或者从过去一直持续到现在。",
      content: `
        <h3>结构</h3>
        <p>主语 + <b>have / has + 过去分词</b></p>
        <h3>用法一：过去的动作对现在有影响（强调结果）</h3>
        ${ex("I have lost my keys.", "我把钥匙弄丢了。（现在还没找到）")}
        ${ex("She has finished her homework.", "她已经做完作业了。")}
        <h3>用法二：从过去持续到现在</h3>
        ${ex("I have lived here for five years.", "我在这里住了五年了。（现在还住在这）")}
        ${ex("We have known each other since 2018.", "我们从 2018 年就认识了。")}
        <h3>用法三：到目前为止的经历</h3>
        ${ex("Have you ever been to Japan?", "你去过日本吗？")}
        <p>常见词：already, yet, just, ever, never, for + 时间段, since + 时间点, so far</p>
        ${tip("有明确的过去时间（yesterday, last year, ago）时<b>不能</b>用现在完成时：说 I <b>saw</b> him yesterday，不说 I have seen him yesterday。")}
        ${tip("have been to 表示「去过（已回来）」；have gone to 表示「去了（还没回来）」。")}
      `,
      quiz: [
        { q: "I ___ this movie three times.", o: ["see", "saw", "have seen", "am seeing"], a: 2, e: "表示到目前为止的经历（看过三次），用现在完成时。" },
        { q: "They ___ married for ten years.", o: ["have been", "were", "are", "have got"], a: 0, e: "for ten years 表示状态从过去持续到现在，用 have been married。" },
        { q: "— Where's Lisa? — She ___ to the supermarket.", o: ["has been", "has gone", "went", "goes"], a: 1, e: "Lisa 不在这里，说明她去了还没回来，用 has gone to。" },
        { q: "I ___ my wallet last night.", o: ["have lost", "lost", "lose", "has lost"], a: 1, e: "last night 是明确的过去时间，只能用一般过去时。" },
        { q: "Have you finished your report ___?", o: ["already", "yet", "since", "ago"], a: 1, e: "现在完成时的疑问句和否定句用 yet，肯定句常用 already。" },
      ],
    },
    {
      id: "future",
      title: "将来时的几种表达",
      level: "基础",
      summary: "will、be going to、现在进行时都能表示将来，但语气不同。",
      content: `
        <h3>will：临时决定、预测、承诺</h3>
        ${ex("It's cold. I'll close the window.", "好冷，我去关窗。（说话时临时决定）")}
        ${ex("I think it will rain tomorrow.", "我觉得明天会下雨。（预测）")}
        ${ex("I'll call you when I arrive.", "我到了就给你打电话。（承诺）")}
        <h3>be going to：事先的计划、有迹象的预测</h3>
        ${ex("I'm going to visit my parents this weekend.", "这周末我打算去看父母。（早有计划）")}
        ${ex("Look at those clouds. It's going to rain.", "看那些云，要下雨了。（有迹象）")}
        <h3>现在进行时：已经安排好的事</h3>
        ${ex("I'm meeting my friend at six tonight.", "我今晚六点要和朋友见面。（已约好）")}
        ${tip("时间和条件状语从句（when, if, as soon as）里，用一般现在时表示将来：If it <b>rains</b> tomorrow, we will stay at home.（不说 if it will rain）")}
      `,
      quiz: [
        { q: "— The phone is ringing. — I ___ it.", o: ["answer", "will answer", "am going to answer", "answered"], a: 1, e: "说话时临时做的决定，用 will。" },
        { q: "We ___ a new car next month. We've already saved the money.", o: ["buy", "will buy", "are going to buy", "bought"], a: 2, e: "钱已经攒好，是事先的计划，用 be going to。" },
        { q: "I'll call you as soon as I ___ home.", o: ["get", "will get", "got", "am getting"], a: 0, e: "as soon as 引导的时间状语从句，用一般现在时表示将来。" },
        { q: "Watch out! You ___ fall!", o: ["will", "are going to", "go to", "are"], a: 1, e: "眼前有迹象表明即将发生，用 be going to。" },
        { q: "If it ___ tomorrow, the game will be cancelled.", o: ["will rain", "rains", "rained", "is raining"], a: 1, e: "if 引导的条件状语从句中，用一般现在时代替将来时。" },
      ],
    },
    {
      id: "modal",
      title: "情态动词",
      level: "基础",
      summary: "can / could / may / must / should / have to 表达能力、许可、义务和建议。",
      content: `
        <h3>能力与请求：can / could</h3>
        ${ex("I can swim, but I can't dive.", "我会游泳，但不会潜水。")}
        ${ex("Could you help me with this box?", "你能帮我搬一下这个箱子吗？（could 更礼貌）")}
        <h3>许可与可能：may / might</h3>
        ${ex("May I come in?", "我可以进来吗？")}
        ${ex("He might be late because of the traffic.", "因为堵车，他可能会迟到。")}
        <h3>义务：must / have to</h3>
        ${ex("You must wear a seat belt.", "你必须系安全带。（规定或说话人认为必须）")}
        ${ex("I have to work this Saturday.", "我这周六得上班。（客观情况迫使）")}
        <h3>建议：should / had better</h3>
        ${ex("You should see a doctor.", "你应该去看医生。")}
        ${ex("You'd better leave now, or you'll miss the train.", "你最好现在就走，不然会赶不上火车。")}
        ${tip("mustn't = 禁止（不准）；don't have to = 不必。You <b>mustn't</b> smoke here.（这里禁止吸烟）You <b>don't have to</b> come.（你不必来）")}
      `,
      quiz: [
        { q: "You ___ park here. It's not allowed.", o: ["don't have to", "mustn't", "needn't", "might not"], a: 1, e: "表示禁止，用 mustn't。" },
        { q: "Tomorrow is Sunday. I ___ get up early.", o: ["mustn't", "don't have to", "can't", "shouldn't"], a: 1, e: "周日不用早起，表示「不必」，用 don't have to。" },
        { q: "___ you pass me the salt, please?", o: ["Must", "Should", "Could", "Have"], a: 2, e: "礼貌地请求别人帮忙，用 Could you ...?" },
        { q: "You look tired. You ___ take a rest.", o: ["should", "can", "may", "have"], a: 0, e: "给别人建议，用 should。" },
        { q: "Take an umbrella. It ___ rain later.", o: ["must", "might", "should", "has to"], a: 1, e: "表示「可能」但不确定，用 might。" },
      ],
    },
    {
      id: "passive",
      title: "被动语态",
      level: "进阶",
      summary: "当动作的承受者比执行者更重要时，用被动语态：be + 过去分词。",
      content: `
        <h3>结构：be + 过去分词（+ by 执行者）</h3>
        ${ex("English is spoken all over the world.", "全世界都在说英语。")}
        ${ex("The window was broken by a ball.", "窗户被一个球打破了。")}
        <h3>各时态的被动</h3>
        ${ex("The room is cleaned every day.", "房间每天都有人打扫。（一般现在时）")}
        ${ex("The bridge was built in 1990.", "这座桥建于 1990 年。（一般过去时）")}
        ${ex("The problem has been solved.", "问题已经解决了。（现在完成时）")}
        ${ex("A new hospital will be built here.", "这里将建一座新医院。（将来时）")}
        ${ex("The road is being repaired.", "这条路正在维修。（现在进行时）")}
        ${ex("This work must be finished today.", "这项工作必须今天完成。（情态动词）")}
        ${tip("什么时候用被动？执行者不知道、不重要或不言自明时。比如 My bike was stolen.（不知道谁偷的）")}
      `,
      quiz: [
        { q: "This bridge ___ in 1995.", o: ["built", "was built", "is built", "has built"], a: 1, e: "桥是「被建造」的，而且是过去的事，用 was built。" },
        { q: "The letters ___ every morning.", o: ["deliver", "are delivering", "are delivered", "delivered"], a: 2, e: "信件被投递，每天发生，用一般现在时的被动 are delivered。" },
        { q: "The meeting ___ until next week.", o: ["has been put off", "has put off", "puts off", "is putting off"], a: 0, e: "会议被推迟，而且对现在有影响，用现在完成时的被动。" },
        { q: "The new library ___ next year.", o: ["will build", "will be built", "is built", "builds"], a: 1, e: "图书馆被建造，时间是明年，用将来时的被动。" },
        { q: "Look! The classroom ___ now.", o: ["is cleaning", "is being cleaned", "cleans", "was cleaned"], a: 1, e: "正在被打扫，用现在进行时的被动 is being cleaned。" },
      ],
    },
    {
      id: "compare",
      title: "比较级和最高级",
      level: "基础",
      summary: "两者比较用比较级 + than，三者及以上用 the + 最高级。",
      content: `
        <h3>变化规则</h3>
        <p>短词加 -er / -est：tall → taller → tallest；big → bigger → biggest；easy → easier → easiest</p>
        <p>长词加 more / most：beautiful → more beautiful → most beautiful</p>
        <p>不规则：good → better → best；bad → worse → worst；many/much → more → most；little → less → least；far → farther/further</p>
        <h3>比较级</h3>
        ${ex("My brother is taller than me.", "我哥哥比我高。")}
        ${ex("This book is much more interesting than that one.", "这本书比那本有趣得多。")}
        <h3>最高级</h3>
        ${ex("It's the most beautiful place I've ever seen.", "这是我见过的最美的地方。")}
        <h3>常用句型</h3>
        ${ex("The more you practice, the better you'll get.", "你练得越多，就会变得越好。")}
        ${ex("She is as tall as her mother.", "她和她妈妈一样高。")}
        ${ex("It's getting colder and colder.", "天越来越冷了。")}
        ${tip("修饰比较级用 much / a lot / a little / even / far，不能用 very：much better ✓ very better ✗")}
      `,
      quiz: [
        { q: "This question is ___ than the last one.", o: ["difficult", "more difficult", "most difficult", "difficulter"], a: 1, e: "有 than，用比较级；difficult 是多音节词，用 more difficult。" },
        { q: "He is the ___ student in our class.", o: ["good", "better", "best", "well"], a: 2, e: "在班级中最好，用最高级 the best。" },
        { q: "The ___ you exercise, the healthier you'll be.", o: ["much", "more", "most", "many"], a: 1, e: "the + 比较级, the + 比较级，表示「越……越……」。" },
        { q: "My new phone is ___ cheaper than my old one.", o: ["very", "much", "more", "too"], a: 1, e: "修饰比较级用 much，不能用 very。" },
        { q: "Tom is as ___ as his father.", o: ["tall", "taller", "tallest", "the tallest"], a: 0, e: "as + 形容词原级 + as，表示「和……一样」。" },
      ],
    },
    {
      id: "article",
      title: "冠词 a / an / the",
      level: "基础",
      summary: "第一次提到、泛指某一个用 a/an；特指、双方都知道的用 the。",
      content: `
        <h3>a / an：泛指「一个」</h3>
        <p>看<b>读音</b>不看字母：元音音素开头用 an</p>
        ${ex("an apple, an hour, an honest man, an umbrella", "an hour 中 h 不发音，所以用 an")}
        ${ex("a university, a useful book, a European country", "u 读 /juː/，是辅音音素开头，所以用 a")}
        <h3>the：特指</h3>
        ${ex("I saw a cat. The cat was black.", "我看见一只猫。那只猫是黑色的。（第二次提到）")}
        ${ex("Could you open the door?", "你能开一下门吗？（双方都知道哪扇门）")}
        ${ex("The sun rises in the east.", "太阳从东方升起。（独一无二的事物）")}
        <h3>不用冠词的情况</h3>
        ${ex("I have breakfast at seven. I go to work by bus.", "三餐、交通方式（by bus）前不用冠词")}
        ${ex("She plays tennis. He plays the piano.", "球类运动不用冠词，西洋乐器前用 the")}
        ${tip("go to school / go to bed / in hospital 表示去做那件事本身（上学、睡觉、住院），不用冠词。")}
      `,
      quiz: [
        { q: "I waited for ___ hour.", o: ["a", "an", "the", "/"], a: 1, e: "hour 的 h 不发音，以元音音素开头，用 an。" },
        { q: "She is ___ university student.", o: ["a", "an", "the", "/"], a: 0, e: "university 读 /juː/ 开头，是辅音音素，用 a。" },
        { q: "___ moon goes around the earth.", o: ["A", "An", "The", "/"], a: 2, e: "月亮是独一无二的事物，用 the。" },
        { q: "My father plays ___ basketball every weekend.", o: ["a", "an", "the", "/"], a: 3, e: "球类运动前不用冠词。" },
        { q: "I bought a dress yesterday. ___ dress is red.", o: ["A", "An", "The", "/"], a: 2, e: "第二次提到同一件东西，用 the 特指。" },
      ],
    },
    {
      id: "relative",
      title: "定语从句",
      level: "进阶",
      summary: "用 who / which / that / whose / where 引导的从句修饰名词，相当于一个很长的形容词。",
      content: `
        <h3>什么是定语从句</h3>
        <p>中文把修饰语放在名词前（「我昨天见到的那个人」），英文把长修饰语放在名词<b>后面</b>。</p>
        ${ex("The man who lives next door is a doctor.", "住在隔壁的那个男人是医生。")}
        <h3>关系词怎么选</h3>
        <p><b>who</b>：指人 ｜ <b>which</b>：指物 ｜ <b>that</b>：人和物都可以</p>
        ${ex("This is the book which I told you about.", "这就是我跟你说过的那本书。")}
        <p><b>whose</b>：表示「……的」（所属关系）</p>
        ${ex("I have a friend whose father is a pilot.", "我有个朋友，他爸爸是飞行员。")}
        <p><b>where</b>：指地点 ｜ <b>when</b>：指时间</p>
        ${ex("This is the town where I grew up.", "这是我长大的小镇。")}
        ${ex("I remember the day when we first met.", "我记得我们初次见面的那一天。")}
        ${tip("关系词在从句中作<b>宾语</b>时可以省略：The movie (that) we saw last night was great.")}
      `,
      quiz: [
        { q: "The girl ___ is singing is my sister.", o: ["which", "who", "whose", "where"], a: 1, e: "先行词 the girl 是人，在从句中作主语，用 who。" },
        { q: "This is the hotel ___ we stayed last summer.", o: ["which", "that", "where", "who"], a: 2, e: "先行词是地点，在从句中作地点状语（stayed 后缺 in it），用 where。" },
        { q: "I met a man ___ car was stolen.", o: ["who", "whose", "which", "that"], a: 1, e: "「他的车」表示所属关系，用 whose。" },
        { q: "The phone ___ I bought last week is broken.", o: ["who", "where", "which", "whose"], a: 2, e: "先行词 phone 是物，在从句中作宾语，用 which（或 that，也可省略）。" },
        { q: "Do you remember the day ___ we first met?", o: ["which", "where", "when", "who"], a: 2, e: "先行词是时间 the day，在从句中作时间状语，用 when。" },
      ],
    },
    {
      id: "noun-clause",
      title: "名词性从句",
      level: "进阶",
      summary: "一个句子充当名词的角色（主语、宾语、表语），常用 that / whether / 疑问词引导。",
      content: `
        <h3>宾语从句（最常用）</h3>
        ${ex("I think that you are right.", "我认为你是对的。（that 常可省略）")}
        ${ex("I don't know whether he will come.", "我不知道他会不会来。")}
        ${ex("Can you tell me where the station is?", "你能告诉我车站在哪儿吗？")}
        <h3>主语从句</h3>
        ${ex("What he said surprised everyone.", "他说的话让所有人都很惊讶。")}
        ${ex("It is clear that she is tired.", "很明显她累了。（it 作形式主语）")}
        <h3>表语从句</h3>
        ${ex("The problem is that we don't have enough time.", "问题是我们没有足够的时间。")}
        ${tip("从句要用<b>陈述语序</b>：Can you tell me where <b>the station is</b>?（不说 where is the station）")}
        ${tip("否定转移：I don't think he is right. 比 I think he isn't right. 更地道。")}
      `,
      quiz: [
        { q: "Could you tell me ___?", o: ["where is the bank", "where the bank is", "where does the bank", "the bank where is"], a: 1, e: "宾语从句要用陈述语序：where the bank is。" },
        { q: "I'm not sure ___ she will like the gift.", o: ["that", "what", "whether", "which"], a: 2, e: "表示「是否」，用 whether（也可用 if）。" },
        { q: "___ you need is a good rest.", o: ["That", "What", "Which", "Whether"], a: 1, e: "从句中 need 缺宾语，且表示「……的东西」，用 what。" },
        { q: "The truth is ___ he didn't tell anyone.", o: ["what", "that", "which", "whether"], a: 1, e: "表语从句内容完整，不缺成分，用 that。" },
        { q: "I don't know ___ he lives.", o: ["what", "where", "that", "which"], a: 1, e: "live 是不及物动词，缺地点状语，用 where。" },
      ],
    },
    {
      id: "nonfinite",
      title: "非谓语动词：to do / doing / done",
      level: "进阶",
      summary: "不定式常表目的和将来，动名词表习惯和事实，过去分词表被动和完成。",
      content: `
        <h3>to do（不定式）：目的、将来</h3>
        ${ex("I went to the store to buy some milk.", "我去商店买牛奶。（目的）")}
        ${ex("I want to learn English.", "我想学英语。")}
        <p>后接 to do 的动词：want, hope, decide, plan, agree, refuse, manage, expect, would like</p>
        <h3>doing（动名词 / 现在分词）：习惯、事实、主动进行</h3>
        ${ex("I enjoy reading novels.", "我喜欢读小说。")}
        ${ex("Swimming is good exercise.", "游泳是很好的运动。")}
        <p>后接 doing 的动词：enjoy, finish, mind, avoid, practice, suggest, keep, give up, look forward to</p>
        <h3>done（过去分词）：被动、完成</h3>
        ${ex("I got my hair cut yesterday.", "我昨天剪了头发。（头发被剪）")}
        ${ex("The book written by him is popular.", "他写的那本书很受欢迎。")}
        <h3>意思不同的动词</h3>
        ${ex("Remember to lock the door.", "记得要锁门。（还没做）")}
        ${ex("I remember locking the door.", "我记得锁过门了。（已经做过）")}
        ${tip("stop to do = 停下来去做另一件事；stop doing = 停止正在做的事。")}
      `,
      quiz: [
        { q: "I enjoy ___ to music in my free time.", o: ["listen", "to listen", "listening", "listened"], a: 2, e: "enjoy 后接动名词 doing。" },
        { q: "She decided ___ abroad.", o: ["study", "to study", "studying", "studied"], a: 1, e: "decide 后接不定式 to do。" },
        { q: "Don't forget ___ the lights when you leave.", o: ["turning off", "to turn off", "turn off", "turned off"], a: 1, e: "forget to do 表示「忘了要去做」（还没做）。" },
        { q: "I'm looking forward to ___ from you.", o: ["hear", "hearing", "heard", "be heard"], a: 1, e: "look forward to 中的 to 是介词，后接动名词。" },
        { q: "I had my car ___ yesterday.", o: ["repair", "to repair", "repairing", "repaired"], a: 3, e: "have sth. done 表示让别人做某事，车是「被修」，用过去分词。" },
      ],
    },
    {
      id: "conditional",
      title: "条件句与虚拟语气",
      level: "提高",
      summary: "真实条件用正常时态；与现在或过去事实相反的假设，时态要「往后退一步」。",
      content: `
        <h3>真实条件句（可能发生）</h3>
        ${ex("If it rains tomorrow, I will stay at home.", "如果明天下雨，我就待在家里。")}
        <h3>与现在事实相反</h3>
        <p>If + 过去式（be 一律用 were），主句 would + 动词原形</p>
        ${ex("If I had more time, I would travel more.", "如果我有更多时间，我会多去旅行。（其实没时间）")}
        ${ex("If I were you, I would accept the offer.", "如果我是你，我会接受这个工作。")}
        <h3>与过去事实相反</h3>
        <p>If + had done，主句 would have done</p>
        ${ex("If I had studied harder, I would have passed the exam.", "如果我当时更用功，考试就能通过了。（其实没过）")}
        <h3>wish 表达遗憾</h3>
        ${ex("I wish I could speak English fluently.", "我真希望我能说一口流利的英语。")}
        ${ex("I wish I had listened to you.", "我真希望当时听了你的话。")}
        ${tip("记忆口诀：假设现在，时态退到过去；假设过去，时态退到过去完成。")}
      `,
      quiz: [
        { q: "If I ___ you, I would talk to her.", o: ["am", "was", "were", "be"], a: 2, e: "与现在事实相反的虚拟，be 动词一律用 were。" },
        { q: "If it ___ sunny tomorrow, we'll go hiking.", o: ["is", "will be", "were", "had been"], a: 0, e: "明天是否晴天有可能发生，是真实条件句，if 从句用一般现在时。" },
        { q: "If I had known about the party, I ___.", o: ["will come", "would come", "would have come", "came"], a: 2, e: "与过去事实相反，主句用 would have done。" },
        { q: "I wish I ___ a car. Walking to work is tiring.", o: ["have", "had", "will have", "has"], a: 1, e: "wish 表达与现在事实相反的愿望，用过去式。" },
        { q: "If she ___ earlier, she wouldn't have missed the train.", o: ["left", "leaves", "had left", "would leave"], a: 2, e: "与过去事实相反，if 从句用 had done。" },
      ],
    },
  ];
})();
