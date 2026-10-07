// 语法扩展课程（第三部分：从句进阶 + 特殊句式）
(function () {
  const ex = (en, zh) => `<p class="ex"><span class="en">${en}</span><span class="zh">${zh}</span></p>`;
  const tip = (t) => `<div class="tip">💡 ${t}</div>`;
  const table = (rows) => `<table class="g-table">${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table>`;

  window.GRAMMAR_LESSONS.push(
    {
      id: "relative-2",
      title: "定语从句进阶：非限制性与介词 + 关系词",
      level: "提高",
      summary: "用逗号隔开的定语从句只是补充说明；介词 + which / whom 让表达更正式、更准确。",
      content: `
        <h3>限制性 vs 非限制性</h3>
        ${ex("My brother who lives in Paris is a chef.", "我那个住在巴黎的哥哥是厨师。（暗示我不止一个哥哥）")}
        ${ex("My brother, who lives in Paris, is a chef.", "我哥哥是厨师，他住在巴黎。（我只有一个哥哥，从句只是补充信息）")}
        <p>非限制性定语从句：用逗号隔开，<b>不能用 that</b>，关系词不能省略。</p>
        <h3>which 指代整个句子</h3>
        ${ex("He passed the exam, which surprised everyone.", "他考试通过了，这让所有人都很惊讶。")}
        <h3>介词 + which / whom</h3>
        ${ex("This is the house in which I grew up.", "这就是我长大的房子。（= where I grew up = which I grew up in）")}
        ${ex("The woman to whom I spoke was very kind.", "和我说话的那位女士很和善。")}
        <p>介词怎么选？看从句里的动词搭配：depend <b>on</b> → on which，talk <b>to</b> → to whom。</p>
        <h3>数量词 + of which / of whom</h3>
        ${ex("I have two brothers, both of whom are doctors.", "我有两个哥哥，他们都是医生。")}
        ${tip("介词后面只能用 which（指物）或 whom（指人），不能用 that 或 who。")}
      `,
      quiz: [
        { q: "Beijing, ___ is the capital of China, has a long history.", o: ["that", "which", "where", "what"], a: 1, e: "非限制性定语从句指物用 which，不能用 that。" },
        { q: "She didn't come to the party, ___ made us disappointed.", o: ["that", "it", "which", "what"], a: 2, e: "which 指代前面整个句子。" },
        { q: "This is the company ___ which my father works.", o: ["at", "for", "of", "to"], a: 1, e: "work for a company 为某公司工作。" },
        { q: "The students, most of ___ are from Asia, study very hard.", o: ["them", "who", "whom", "which"], a: 2, e: "介词 of 后指人用 whom。" },
        { q: "The man ___ you were talking is my boss.", o: ["to that", "to who", "to whom", "whom to"], a: 2, e: "talk to sb.，介词提前用 to whom。" },
      ],
    },
    {
      id: "adverbial",
      title: "状语从句",
      level: "进阶",
      summary: "状语从句说明主句动作的时间、原因、条件、让步、目的、结果等，关键是选对连接词。",
      content: `
        <h3>常见连接词一览</h3>
        ${table([["类型", "连接词", "例句"],
          ["时间", "when, while, as, before, after, until, since, as soon as", "Call me as soon as you arrive."],
          ["原因", "because, since, as", "Since it's late, let's go home."],
          ["条件", "if, unless, as long as, in case", "You can go out as long as you finish your homework."],
          ["让步", "although, though, even if, even though, while", "Even though he was ill, he went to work."],
          ["目的", "so that, in order that", "Speak louder so that everyone can hear you."],
          ["结果", "so … that, such … that", "He ran so fast that no one could catch him."],
          ["比较", "than, as … as", "She is taller than I am."],
          ["方式", "as, as if / as though", "He talks as if he knew everything."]])}
        <h3>重点辨析</h3>
        ${ex("I won't go unless you come with me.", "除非你和我一起去，否则我不去。（unless = if not）")}
        ${ex("I didn't go to bed until my mom came home.", "直到妈妈回家我才睡觉。（not … until 直到……才）")}
        ${ex("Take an umbrella in case it rains.", "带把伞以防下雨。")}
        ${tip("时间和条件状语从句里用一般现在时表示将来：I'll tell him when he <b>comes</b> back.（不说 will come）")}
      `,
      quiz: [
        { q: "You won't pass the exam ___ you study harder.", o: ["if", "unless", "because", "although"], a: 1, e: "除非更努力，否则不会通过：unless。" },
        { q: "He didn't leave ___ the rain stopped.", o: ["when", "until", "since", "while"], a: 1, e: "not … until 直到……才。" },
        { q: "Write it down ___ you forget.", o: ["in case", "so that", "as long as", "even if"], a: 0, e: "in case 以防。" },
        { q: "She got up early ___ she could catch the first train.", o: ["because", "so that", "although", "unless"], a: 1, e: "表示目的：so that 以便。" },
        { q: "I'll call you as soon as I ___ there.", o: ["will get", "get", "got", "am getting"], a: 1, e: "时间状语从句用一般现在时表将来。" },
      ],
    },
    {
      id: "reported",
      title: "间接引语",
      level: "进阶",
      summary: "转述别人的话时，人称、时态、时间地点状语都要相应变化。",
      content: `
        <h3>陈述句</h3>
        ${ex("He said, \"I am tired.\" → He said (that) he was tired.", "他说他累了。")}
        <h3>时态后退一步（主句是过去时）</h3>
        ${table([["直接引语", "间接引语"],
          ["一般现在时 am/is/do", "一般过去时 was/did"],
          ["现在进行时 is doing", "过去进行时 was doing"],
          ["现在完成时 has done", "过去完成时 had done"],
          ["一般过去时 did", "过去完成时 had done"],
          ["will / can / may", "would / could / might"]])}
        <h3>时间地点词的变化</h3>
        <p>now → then · today → that day · tomorrow → the next day · yesterday → the day before · here → there · this → that · ago → before</p>
        <h3>疑问句：变成陈述语序</h3>
        ${ex("She asked, \"Where do you live?\" → She asked me where I lived.", "她问我住在哪里。")}
        ${ex("He asked, \"Are you ready?\" → He asked if / whether I was ready.", "他问我是否准备好了。")}
        <h3>祈使句：tell / ask sb. (not) to do</h3>
        ${ex("\"Don't be late,\" the teacher said. → The teacher told us not to be late.", "老师告诉我们不要迟到。")}
        ${tip("如果转述的是客观真理或现在仍然成立的事，时态可以不变：He said the earth <b>goes</b> around the sun.")}
      `,
      quiz: [
        { q: "She said she ___ a headache.", o: ["has", "had", "have", "is having"], a: 1, e: "主句过去时，从句一般现在时后退为一般过去时。" },
        { q: "He asked me ___.", o: ["where did I work", "where I worked", "where do I work", "where I work did"], a: 1, e: "间接疑问句用陈述语序，时态后退。" },
        { q: "Mom told me ___ the window.", o: ["close", "to close", "closing", "closed"], a: 1, e: "祈使句转述：tell sb. to do。" },
        { q: "\"I will call you tomorrow,\" he said. → He said he would call me ___.", o: ["tomorrow", "the next day", "yesterday", "the day before"], a: 1, e: "tomorrow 在间接引语中变为 the next day。" },
        { q: "She asked me ___ I liked Chinese food.", o: ["that", "what", "whether", "which"], a: 2, e: "一般疑问句转述用 if / whether。" },
      ],
    },
    {
      id: "subjunctive-2",
      title: "虚拟语气进阶",
      level: "提高",
      summary: "除了 if 条件句，as if、would rather、it's time、suggest 等结构也常用虚拟语气。",
      content: `
        <h3>as if / as though：好像</h3>
        ${ex("He talks as if he were the boss.", "他说话的样子好像他是老板似的。（其实不是）")}
        <h3>would rather：宁愿，希望（别人）</h3>
        ${ex("I'd rather you didn't smoke here.", "我希望你别在这儿抽烟。（从句用过去式表现在或将来）")}
        <h3>It's (high) time：该做某事了</h3>
        ${ex("It's time we went home.", "我们该回家了。（= It's time for us to go home.）")}
        <h3>建议、要求、命令类动词：(should) + 动词原形</h3>
        <p>suggest, insist, advise, demand, require, order, recommend</p>
        ${ex("The doctor suggested that he (should) stop smoking.", "医生建议他戒烟。")}
        ${ex("It is important that everyone be on time.", "每个人都准时很重要。")}
        <h3>混合虚拟</h3>
        ${ex("If I had taken the job, I would be rich now.", "如果我当初接受了那份工作，我现在就有钱了。（从句对过去，主句对现在）")}
        <h3>without / but for：要不是</h3>
        ${ex("Without your help, I would have failed.", "要不是你的帮助，我就失败了。")}
        ${tip("suggest 表示「暗示、表明」时不用虚拟：His face suggested that he <b>was</b> angry.")}
      `,
      quiz: [
        { q: "She looks as if she ___ a ghost.", o: ["sees", "has seen", "had seen", "will see"], a: 2, e: "as if 表示与过去事实相反的比喻，用过去完成时。" },
        { q: "It's high time you ___ to bed.", o: ["go", "went", "will go", "have gone"], a: 1, e: "It's high time + 主语 + 过去式。" },
        { q: "The teacher insisted that we ___ our homework on time.", o: ["hand in", "handed in", "will hand in", "had handed in"], a: 0, e: "insist（坚决要求）后从句用 (should) + 动词原形。" },
        { q: "If I had listened to my parents, I ___ in trouble now.", o: ["won't be", "wouldn't be", "wouldn't have been", "am not"], a: 1, e: "混合虚拟：主句与现在事实相反，用 would do。" },
        { q: "I'd rather you ___ anything about it now.", o: ["don't say", "didn't say", "won't say", "hadn't said"], a: 1, e: "would rather sb. did 表示对现在或将来的愿望。" },
      ],
    },
    {
      id: "agreement",
      title: "主谓一致",
      level: "进阶",
      summary: "谓语动词的单复数要和主语保持一致，有语法一致、意义一致和就近一致三大原则。",
      content: `
        <h3>语法一致：看形式</h3>
        ${ex("Each of the students has a book.", "每个学生都有一本书。（each / every / either / neither 作主语用单数）")}
        ${ex("Everyone is here.", "大家都到了。（-one / -body / -thing 不定代词用单数）")}
        <h3>意义一致：看意思</h3>
        ${ex("Ten years is a long time.", "十年是一段很长的时间。（时间、金钱、距离作为整体用单数）")}
        ${ex("My family is big. / My family are all fond of music.", "家庭作为整体用单数；指家庭成员用复数。")}
        ${ex("The police are looking into the case.", "警察正在调查这个案子。（police, people, cattle 永远用复数）")}
        <h3>就近一致</h3>
        <p>either … or, neither … nor, not only … but also, there be：谓语和最近的主语一致。</p>
        ${ex("Neither you nor he is wrong.", "你和他都没错。")}
        <h3>就远一致</h3>
        <p>with, along with, together with, as well as, besides, except 连接时，和前面的主语一致。</p>
        ${ex("The teacher, together with his students, is visiting the museum.", "老师和他的学生们正在参观博物馆。")}
        <h3>其他</h3>
        ${ex("The number of cars is growing. / A number of cars are parked here.", "the number of 用单数；a number of（许多）用复数")}
        ${ex("Reading books is good for you.", "动名词、不定式、从句作主语用单数")}
      `,
      quiz: [
        { q: "Every boy and every girl ___ a gift.", o: ["get", "gets", "are getting", "have got"], a: 1, e: "every … and every … 作主语，谓语用单数。" },
        { q: "The number of students in our school ___ 2,000.", o: ["is", "are", "have", "were"], a: 0, e: "the number of + 复数名词，谓语用单数。" },
        { q: "Not only I but also my sister ___ fond of dancing.", o: ["am", "is", "are", "be"], a: 1, e: "not only … but also 就近一致，和 my sister 一致。" },
        { q: "The manager, as well as his assistants, ___ coming.", o: ["are", "is", "were", "have"], a: 1, e: "as well as 就远一致，和 the manager 一致。" },
        { q: "Twenty dollars ___ too much for this shirt.", o: ["is", "are", "were", "have been"], a: 0, e: "金钱作为一个整体，谓语用单数。" },
      ],
    },
    {
      id: "inversion",
      title: "倒装句",
      level: "提高",
      summary: "为了强调或表达需要，把谓语（或助动词）提到主语前面。分为完全倒装和部分倒装。",
      content: `
        <h3>完全倒装：整个谓语放到主语前</h3>
        ${ex("Here comes the bus.", "公交车来了。")}
        ${ex("In front of the house stands a tall tree.", "房子前面有一棵高大的树。（地点状语提前）")}
        ${ex("Here it comes.", "它来了。（主语是代词时不倒装）")}
        <h3>部分倒装：只把助动词/情态动词/be 提前</h3>
        <p><b>1. 否定词放句首</b>：never, seldom, hardly, rarely, little, not only, no sooner, not until</p>
        ${ex("Never have I seen such a beautiful sunset.", "我从没见过这么美的日落。")}
        ${ex("Not only does he speak English, but he also speaks French.", "他不仅会说英语，还会说法语。")}
        ${ex("Not until midnight did he come back.", "直到午夜他才回来。")}
        <p><b>2. only + 状语放句首</b></p>
        ${ex("Only in this way can we solve the problem.", "只有用这种方法，我们才能解决问题。")}
        <p><b>3. so / neither / nor：……也一样</b></p>
        ${ex("— I like coffee. — So do I.", "——我喜欢咖啡。——我也是。")}
        ${ex("— I can't swim. — Neither can I.", "——我不会游泳。——我也不会。")}
        <p><b>4. 省略 if 的虚拟条件句</b></p>
        ${ex("Had I known the truth, I would have told you.", "要是我早知道真相，我就会告诉你了。（= If I had known）")}
        ${tip("So do I（我也是）和 So I do（我确实是）意思不同，后者不倒装，表示赞同对方说的关于自己的情况。")}
      `,
      quiz: [
        { q: "Never ___ such a strange thing.", o: ["I have seen", "have I seen", "I saw", "saw I"], a: 1, e: "否定词 never 放句首，部分倒装。" },
        { q: "— I've been to Paris. — ___.", o: ["So I have", "So have I", "So did I", "Neither have I"], a: 1, e: "表示「我也去过」：So + 助动词 + 主语。" },
        { q: "Only then ___ how important health is.", o: ["I realized", "did I realize", "I did realize", "realized I"], a: 1, e: "only + 状语放句首，部分倒装。" },
        { q: "Here ___!", o: ["comes she", "she comes", "come she", "she come"], a: 1, e: "主语是代词时不倒装：Here she comes。" },
        { q: "___ harder, he would have passed the exam.", o: ["If he worked", "Had he worked", "Did he work", "Has he worked"], a: 1, e: "省略 if 的虚拟条件句，把 had 提前。" },
      ],
    },
    {
      id: "emphasis",
      title: "强调句与 it 的用法",
      level: "提高",
      summary: "It is … that … 可以强调句子中的任何成分；it 还能作形式主语和形式宾语。",
      content: `
        <h3>强调句：It is / was + 被强调部分 + that / who + 其余部分</h3>
        <p>原句：Tom met Lucy in the park yesterday.</p>
        ${ex("It was Tom who met Lucy in the park yesterday.", "是汤姆昨天在公园遇到了露西。（强调主语）")}
        ${ex("It was in the park that Tom met Lucy yesterday.", "汤姆昨天是在公园遇到露西的。（强调地点）")}
        ${ex("It was yesterday that Tom met Lucy in the park.", "汤姆是昨天在公园遇到露西的。（强调时间）")}
        <p>判断方法：去掉 It is / was 和 that，句子仍然完整，就是强调句。</p>
        ${ex("It was not until he left that I realized it.", "直到他走了我才意识到这一点。（强调 not until）")}
        <h3>do / does / did 强调谓语</h3>
        ${ex("I do love this song!", "我真的很喜欢这首歌！")}
        <h3>it 作形式主语</h3>
        ${ex("It is hard to learn a language well.", "学好一门语言很难。")}
        ${ex("It doesn't matter whether you win or not.", "你赢不赢都没关系。")}
        <h3>it 作形式宾语</h3>
        ${ex("I find it difficult to get up early.", "我觉得早起很难。")}
        ${ex("She made it clear that she disagreed.", "她明确表示不同意。")}
      `,
      quiz: [
        { q: "It was in this room ___ the meeting was held.", o: ["which", "where", "that", "when"], a: 2, e: "强调句结构 It was … that …，去掉后句子完整。" },
        { q: "It is my mother ___ always supports me.", o: ["which", "who", "whom", "what"], a: 1, e: "强调的是人（主语），可以用 who 或 that。" },
        { q: "I ___ tell you the truth yesterday!", o: ["do", "did", "does", "was"], a: 1, e: "用 did 强调过去时的谓语动词。" },
        { q: "I think ___ necessary to learn a foreign language.", o: ["it", "that", "this", "its"], a: 0, e: "it 作形式宾语，真正的宾语是后面的不定式。" },
        { q: "It was not until 10 p.m. ___ he finished the work.", o: ["when", "that", "before", "since"], a: 1, e: "not until 的强调句：It was not until … that …" },
      ],
    },
    {
      id: "ellipsis",
      title: "省略与替代",
      level: "提高",
      summary: "为了避免重复，英语会省略已经出现过的内容，或用 so / not / one / do 来替代。",
      content: `
        <h3>省略</h3>
        ${ex("— Are you coming? — Yes, I am (coming).", "——你来吗？——来。")}
        ${ex("I'd like to go, but I can't (go).", "我想去，但去不了。")}
        ${ex("You can go if you want to (go).", "想去就去吧。（保留 to，省略后面的动词）")}
        ${ex("When (you are) in Rome, do as the Romans do.", "入乡随俗。（状语从句主语和主句一致时，可以省略主语和 be）")}
        ${ex("If (it is) possible, call me tonight.", "如果可能，今晚给我打电话。（if possible / if necessary 常用）")}
        <h3>替代</h3>
        ${ex("— Will it rain tomorrow? — I think so. / I hope not.", "——明天会下雨吗？——我想会的。/ 希望不会。")}
        ${ex("I don't like this shirt. Show me a cheaper one.", "我不喜欢这件衬衫，给我看件便宜点的。（one 替代可数名词）")}
        ${ex("The weather here is warmer than that in Beijing.", "这里的天气比北京的暖和。（that 替代不可数名词或单数名词）")}
        ${ex("She works harder than I do.", "她比我工作更努力。（do 替代动词）")}
        ${tip("I don't think so 比 I think not 更常用，是口语里表达不同意的礼貌说法。")}
      `,
      quiz: [
        { q: "— Is he coming to the party? — I'm afraid ___.", o: ["not", "no", "so", "don't"], a: 0, e: "否定的替代：I'm afraid not。" },
        { q: "The population of China is larger than ___ of Japan.", o: ["it", "that", "those", "one"], a: 1, e: "that 替代前面的不可数名词 population。" },
        { q: "— Would you like to join us? — I'd love ___.", o: ["to", "it", "so", "that"], a: 0, e: "省略不定式动词时保留 to。" },
        { q: "___ necessary, I'll help you.", o: ["If", "If it", "It is", "Being"], a: 0, e: "if (it is) necessary 省略 it is。" },
        { q: "My phone is broken. I need a new ___.", o: ["it", "one", "that", "this"], a: 1, e: "one 替代同类的可数名词单数。" },
      ],
    },
  );

  // 课程章节（决定列表显示顺序和课号）
  window.GRAMMAR_CHAPTERS = [
    { title: "第一章 · 句子基础", ids: ["sentence", "be-there", "questions"] },
    { title: "第二章 · 词法", ids: ["nouns", "article", "pronouns", "quantity", "adjadv", "compare", "prepositions", "conjunctions"] },
    { title: "第三章 · 动词与时态", ids: ["present", "past", "perfect", "perfect-cont", "past-perfect", "future", "future-more", "phrasal", "modal", "modal-deduce", "passive"] },
    { title: "第四章 · 非谓语动词", ids: ["nonfinite", "infinitive", "participle"] },
    { title: "第五章 · 从句与虚拟", ids: ["relative", "relative-2", "noun-clause", "adverbial", "reported", "conditional", "subjunctive-2"] },
    { title: "第六章 · 特殊句式", ids: ["agreement", "inversion", "emphasis", "ellipsis"] },
  ];
})();
