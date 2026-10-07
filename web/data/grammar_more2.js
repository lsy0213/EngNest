// 语法扩展课程（第二部分：时态进阶 + 情态 + 非谓语）
(function () {
  const ex = (en, zh) => `<p class="ex"><span class="en">${en}</span><span class="zh">${zh}</span></p>`;
  const tip = (t) => `<div class="tip">💡 ${t}</div>`;
  const table = (rows) => `<table class="g-table">${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table>`;

  window.GRAMMAR_LESSONS.push(
    {
      id: "perfect-cont",
      title: "现在完成进行时",
      level: "进阶",
      summary: "强调一个动作从过去开始、一直持续到现在（可能还在继续）。",
      content: `
        <h3>结构</h3>
        <p>主语 + <b>have / has been + doing</b></p>
        ${ex("I have been learning English for three months.", "我学英语已经三个月了。（现在还在学）")}
        ${ex("It has been raining since this morning.", "从早上起就一直在下雨。")}
        <h3>和现在完成时的区别</h3>
        ${ex("I have painted the room.", "我把房间刷完了。（强调结果：完成了）")}
        ${ex("I have been painting the room.", "我一直在刷房间。（强调过程，不一定刷完，可能身上还有油漆）")}
        ${ex("She has written three emails this morning.", "她今天上午写了三封邮件。（有具体数量用现在完成时）")}
        <h3>常见用法：解释眼前的状况</h3>
        ${ex("Why are you so tired? — I've been running.", "你怎么这么累？——我刚才一直在跑步。")}
        ${tip("状态动词（know, like, own, believe）不能用进行时，只能用现在完成时：I <b>have known</b> him for years.")}
      `,
      quiz: [
        { q: "We ___ for the bus for 20 minutes. It still hasn't come.", o: ["wait", "are waiting", "have been waiting", "waited"], a: 2, e: "从过去一直持续到现在还在等，用现在完成进行时。" },
        { q: "I ___ her since we were children.", o: ["have been knowing", "have known", "know", "am knowing"], a: 1, e: "know 是状态动词，不用进行时。" },
        { q: "Your eyes are red. ___ you ___?", o: ["Have; cried", "Have; been crying", "Did; cry", "Are; crying"], a: 1, e: "看到眼睛红推断刚才一直在哭，用现在完成进行时。" },
        { q: "She ___ five books so far.", o: ["has been writing", "has written", "is writing", "writes"], a: 1, e: "有具体数量（five books）强调结果，用现在完成时。" },
        { q: "How long ___ you ___ English?", o: ["have; learned", "have; been learning", "did; learn", "are; learning"], a: 1, e: "询问持续到现在的时间，用 have been learning（have learned 也可接受，但此处强调持续过程）。" },
      ],
    },
    {
      id: "past-perfect",
      title: "过去完成时与 used to",
      level: "进阶",
      summary: "过去完成时表示「过去的过去」；used to 表示过去的习惯或状态，现在已经不这样了。",
      content: `
        <h3>过去完成时：had + 过去分词</h3>
        <p>两个过去的动作，<b>先发生</b>的那个用过去完成时。</p>
        ${ex("When I arrived at the station, the train had already left.", "我到车站时，火车已经开走了。")}
        ${ex("She said she had never seen snow before.", "她说她以前从没见过雪。")}
        ${ex("By the end of last year, we had saved enough money.", "到去年年底，我们已经攒够钱了。（by + 过去时间）")}
        <h3>什么时候不用</h3>
        ${ex("I got up, had breakfast and went to work.", "按顺序叙述的一连串动作，都用一般过去时即可。")}
        <h3>used to do：过去常常（现在不了）</h3>
        ${ex("I used to smoke, but I quit two years ago.", "我以前抽烟，两年前戒了。")}
        ${ex("There used to be a cinema here.", "这里以前有家电影院。")}
        ${ex("Did you use to play video games?", "你以前玩电子游戏吗？（疑问句和否定句用 use to）")}
        <h3>别搞混这三个</h3>
        ${table([["结构", "意思", "例子"],
          ["used to do", "过去常常做", "I used to get up late."],
          ["be used to doing", "习惯于做", "I'm used to getting up early now."],
          ["be used to do", "被用来做（被动）", "Knives are used to cut things."]])}
      `,
      quiz: [
        { q: "When we got to the cinema, the film ___.", o: ["already started", "has already started", "had already started", "was already starting"], a: 2, e: "电影开始发生在「我们到达」之前，是过去的过去，用过去完成时。" },
        { q: "I ___ live in Beijing, but now I live in Shanghai.", o: ["used to", "am used to", "was used to", "use to"], a: 0, e: "过去住北京，现在不住了，用 used to do。" },
        { q: "After living in London for years, she is used to ___ on the left.", o: ["drive", "driving", "drove", "be driving"], a: 1, e: "be used to 中的 to 是介词，后接动名词。" },
        { q: "By the time the police arrived, the thief ___.", o: ["escaped", "had escaped", "has escaped", "escapes"], a: 1, e: "by the time + 过去时，主句用过去完成时。" },
        { q: "He told me that he ___ the book twice.", o: ["reads", "has read", "had read", "is reading"], a: 2, e: "间接引语中，「读过」发生在「告诉」之前，用过去完成时。" },
      ],
    },
    {
      id: "future-more",
      title: "将来进行时、将来完成时与过去将来时",
      level: "提高",
      summary: "will be doing 表示将来某时正在做；will have done 表示到将来某时已完成；would do 是「站在过去看将来」。",
      content: `
        <h3>将来进行时：will be doing</h3>
        ${ex("This time tomorrow, I will be lying on the beach.", "明天这个时候，我会正躺在沙滩上。")}
        ${ex("Will you be using the car tonight?", "你今晚要用车吗？（礼貌地询问对方的安排）")}
        <h3>将来完成时：will have done</h3>
        ${ex("By next June, I will have graduated.", "到明年六月，我就已经毕业了。")}
        ${ex("The work will have been finished by Friday.", "工作到周五前将会完成。（被动）")}
        <h3>过去将来时：would do / was going to do</h3>
        <p>从过去某个时间点看「将来」要发生的事，常见于间接引语。</p>
        ${ex("He said he would call me later.", "他说他晚点会给我打电话。")}
        ${ex("I was going to call you, but I forgot.", "我本来打算给你打电话的，但是忘了。")}
        ${tip("by + 将来时间 常和将来完成时连用；by + 过去时间 常和过去完成时连用。")}
      `,
      quiz: [
        { q: "At 8 p.m. tonight, we ___ dinner.", o: ["have", "will be having", "will have had", "had"], a: 1, e: "将来某一时刻正在进行的动作，用将来进行时。" },
        { q: "By 2030, scientists ___ a cure for the disease.", o: ["find", "will find", "will have found", "have found"], a: 2, e: "by + 将来时间，表示到那时已完成，用将来完成时。" },
        { q: "She promised that she ___ help me.", o: ["will", "would", "is going to", "shall"], a: 1, e: "主句是过去时 promised，从句用过去将来时 would。" },
        { q: "I ___ go shopping, but it started to rain.", o: ["am going to", "was going to", "will", "would have"], a: 1, e: "was going to do 表示「本来打算做（但没做成）」。" },
        { q: "Don't call me at nine. I ___ a meeting then.", o: ["will be attending", "will have attended", "attended", "attend"], a: 0, e: "九点那个时候正在开会，用将来进行时。" },
      ],
    },
    {
      id: "phrasal",
      title: "短语动词",
      level: "进阶",
      summary: "动词 + 介词/副词组成的短语，意思常常不能从字面猜，是地道英语的关键。",
      content: `
        <h3>高频短语动词</h3>
        ${table([["短语", "意思", "例句"],
          ["give up", "放弃；戒掉", "Don't give up!"],
          ["look for", "寻找", "I'm looking for my keys."],
          ["look after", "照顾", "Can you look after my cat?"],
          ["look up", "（在词典里）查", "Look up the word in a dictionary."],
          ["find out", "查明，弄清楚", "I need to find out the truth."],
          ["turn on / off", "打开 / 关掉（电器）", "Turn off the lights."],
          ["put off", "推迟", "The game was put off."],
          ["pick up", "捡起；接（人）；学会", "I'll pick you up at six."],
          ["get along (with)", "相处融洽", "I get along well with my boss."],
          ["run out of", "用完", "We've run out of milk."],
          ["come up with", "想出（主意）", "She came up with a great idea."],
          ["take care of", "照顾；处理", "I'll take care of it."],
          ["set up", "建立，设立", "They set up a company."],
          ["show up", "出现，露面", "He didn't show up."]])}
        <h3>宾语的位置</h3>
        <p>「动词 + 副词」型（turn on, pick up, put off）：宾语是<b>代词</b>时必须放中间。</p>
        ${ex("Turn on the TV. / Turn the TV on. / Turn it on.", "打开电视。（不说 Turn on it）")}
        <p>「动词 + 介词」型（look for, look after）：宾语只能放后面。</p>
        ${ex("I'm looking for it.", "我在找它。")}
        ${tip("学短语动词最好的方法是整句记忆，把它当成一个新词。")}
      `,
      quiz: [
        { q: "It's dark. Could you turn ___?", o: ["on the light it", "on it", "it on", "it up"], a: 2, e: "turn on 的宾语是代词时，放在中间：turn it on。" },
        { q: "We've ___ sugar. Can you buy some?", o: ["run out of", "run away from", "given up", "looked for"], a: 0, e: "run out of 用完。" },
        { q: "My grandma ___ me when I was little.", o: ["looked for", "looked after", "looked up", "looked at"], a: 1, e: "look after 照顾。" },
        { q: "The concert has been ___ because of the storm.", o: ["put off", "put on", "turned off", "given up"], a: 0, e: "put off 推迟。" },
        { q: "Who ___ this brilliant idea?", o: ["came up with", "came across", "got along with", "set off"], a: 0, e: "come up with 想出（主意）。" },
      ],
    },
    {
      id: "modal-deduce",
      title: "情态动词表推测",
      level: "提高",
      summary: "must / may / might / can't 可以表示对现在或过去情况的推测，把握程度各不相同。",
      content: `
        <h3>对现在的推测</h3>
        ${table([["把握", "肯定推测", "否定推测"],
          ["非常确定（90%+）", "must be / must do", "can't be / can't do"],
          ["可能（50%）", "may / might / could be", "may not / might not be"]])}
        ${ex("The lights are on. They must be at home.", "灯亮着，他们一定在家。")}
        ${ex("She can't be hungry. She just ate.", "她不可能饿，她刚吃过。（否定推测用 can't，不用 mustn't）")}
        ${ex("He might be in the library.", "他可能在图书馆。")}
        <h3>对过去的推测：情态动词 + have done</h3>
        ${ex("The ground is wet. It must have rained last night.", "地面湿了，昨晚一定下过雨。")}
        ${ex("He can't have seen me. He didn't say hello.", "他不可能看见我了，他没打招呼。")}
        ${ex("I might have left my phone in the taxi.", "我可能把手机落在出租车上了。")}
        <h3>表示「本该……」</h3>
        ${ex("You should have told me earlier.", "你本该早点告诉我的。（实际没告诉）")}
        ${ex("You needn't have bought flowers.", "你本不必买花的。（实际买了）")}
        ${tip("推测的否定：一定不 = can't，不是 mustn't（mustn't 是「禁止」）。")}
      `,
      quiz: [
        { q: "Tom has been working all day. He ___ be tired.", o: ["must", "can't", "mustn't", "needn't"], a: 0, e: "非常肯定的推测用 must。" },
        { q: "That ___ be Lisa. She's in Paris this week.", o: ["must", "can't", "may", "should"], a: 1, e: "非常肯定「不可能是」，用 can't。" },
        { q: "The road is wet. It ___ last night.", o: ["must rain", "must have rained", "can't have rained", "should rain"], a: 1, e: "对过去的肯定推测：must have done。" },
        { q: "I failed the exam. I ___ harder.", o: ["should study", "must have studied", "should have studied", "can't have studied"], a: 2, e: "should have done 表示「本应该做而没做」。" },
        { q: "— Where's Jack? — I'm not sure. He ___ be in his office.", o: ["must", "might", "can't", "has to"], a: 1, e: "不确定的推测用 might / may。" },
      ],
    },
    {
      id: "infinitive",
      title: "不定式深入：to do 的各种用法",
      level: "进阶",
      summary: "不定式可以作主语、宾语、宾补、定语和状语；使役动词和感官动词后要省略 to。",
      content: `
        <h3>作宾语和宾语补足语</h3>
        ${ex("I hope to see you soon.", "我希望很快见到你。")}
        ${ex("My boss asked me to finish it today.", "老板让我今天完成。（ask / tell / want / allow / encourage sb. to do）")}
        <h3>省略 to 的情况</h3>
        <p>使役动词 <b>make, let, have</b> 和感官动词 <b>see, hear, watch, notice, feel</b> 后面接不带 to 的不定式。</p>
        ${ex("My mom made me clean my room.", "妈妈让我打扫房间。")}
        ${ex("I heard someone knock on the door.", "我听到有人敲门。（听到了全过程）")}
        ${ex("I heard someone knocking on the door.", "我听到有人正在敲门。（听到时正在进行）")}
        ${ex("He was made to work overtime.", "他被迫加班。（变成被动语态时，to 要还原）")}
        <h3>作定语和目的状语</h3>
        ${ex("I have a lot of work to do.", "我有很多工作要做。（修饰 work）")}
        ${ex("She got up early to catch the first bus.", "她早起去赶第一班公交。（目的）")}
        <h3>常用句型</h3>
        ${ex("It is important to exercise regularly.", "定期锻炼很重要。（it 作形式主语）")}
        ${ex("I don't know what to do.", "我不知道该怎么办。（疑问词 + to do）")}
        ${ex("The box is too heavy for me to carry.", "箱子太重了，我搬不动。")}
        ${tip("why 后面不能接 to do：不说 I don't know why to go。")}
      `,
      quiz: [
        { q: "The teacher let us ___ home early.", o: ["go", "to go", "going", "went"], a: 0, e: "let sb. do，不带 to。" },
        { q: "He was seen ___ the building at midnight.", o: ["enter", "to enter", "entered", "enters"], a: 1, e: "感官动词变被动语态时要还原 to：be seen to do。" },
        { q: "I don't know ___ next.", o: ["what to do", "what do", "to do what", "what doing"], a: 0, e: "疑问词 + to do 作宾语。" },
        { q: "She went to the library ___ some books.", o: ["borrow", "to borrow", "borrowing", "borrowed"], a: 1, e: "不定式作目的状语。" },
        { q: "It's kind of you ___ me.", o: ["help", "to help", "helping", "helped"], a: 1, e: "It's + adj. + of/for sb. + to do。" },
      ],
    },
    {
      id: "participle",
      title: "分词作定语和状语",
      level: "提高",
      summary: "现在分词 doing 表示主动、进行；过去分词 done 表示被动、完成。分词短语能让句子更简洁。",
      content: `
        <h3>分词作定语</h3>
        ${ex("the rising sun / the risen sun", "正在升起的太阳 / 已经升起的太阳")}
        ${ex("The girl sitting next to me is my cousin.", "坐在我旁边的女孩是我表妹。（主动：女孩坐）")}
        ${ex("This is a book written by a famous writer.", "这是一本由著名作家写的书。（被动：书被写）")}
        <h3>分词作状语</h3>
        <p>分词的逻辑主语必须和句子的主语<b>一致</b>。</p>
        ${ex("Walking in the park, I met an old friend.", "在公园散步时，我遇到了一位老朋友。（我走路：主动）")}
        ${ex("Seen from the hill, the city looks beautiful.", "从山上看，这座城市很美。（城市被看：被动）")}
        ${ex("Having finished the work, he went home.", "完成工作后，他回家了。（having done：先完成）")}
        <h3>常见错误：分词主语不一致</h3>
        ${ex("✗ Walking in the street, a car hit me.", "错：看起来像「车在街上走」")}
        ${ex("✓ Walking in the street, I was hit by a car.", "对：我在街上走的时候被车撞了")}
        <h3>独立主格（了解）</h3>
        ${ex("Weather permitting, we'll go hiking.", "天气允许的话，我们就去远足。（分词有自己的主语 weather）")}
        ${tip("判断用 doing 还是 done：看被修饰的名词（或句子主语）和这个动词是主动关系还是被动关系。")}
      `,
      quiz: [
        { q: "The man ___ a red hat is my uncle.", o: ["wear", "wearing", "worn", "to wear"], a: 1, e: "男人主动戴帽子，用现在分词作定语。" },
        { q: "The car ___ in Germany is very expensive.", o: ["making", "made", "make", "to make"], a: 1, e: "车是被制造的，用过去分词作定语。" },
        { q: "___ from space, the earth looks blue.", o: ["Seeing", "Seen", "To see", "Having seen"], a: 1, e: "地球「被看」，用过去分词作状语。" },
        { q: "___ the homework, she went out to play.", o: ["Finishing", "Finished", "Having finished", "To finish"], a: 2, e: "先完成作业再出去，强调动作在前，用 having done。" },
        { q: "___ the news, she burst into tears.", o: ["Hearing", "Heard", "To hear", "Hear"], a: 0, e: "她主动听到消息，用现在分词。" },
      ],
    },
  );
})();
