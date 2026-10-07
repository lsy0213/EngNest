// 句型专项：语法句型（补充）、写作句型、口语句型的连词成句课，格式同 builder.js（一行一步「英文|中文」）
// 句子成分解析在 builder_notes2.js。PATTERN_CATS 是「句型专项」的目录：分类 → 分组 → 课程 id（包括 builder.js 里的老课）
(function () {
  const L = (window.BUILDER_LESSONS ||= []);
  const lesson = (id, title, icon, desc, sentences) =>
    L.push({ id, title, icon, desc, sentences: sentences.map((s) => s.trim().split("\n").map((l) => l.split("|").map((x) => x.trim()))) });

  window.PATTERN_CATS = [
    { id: "grammar", title: "语法句型", icon: "📐", desc: "按「语法」板块的六章由浅入深：每课一个语法点，句子一步步搭起来，做完看句子成分。", groups: [
      { title: "第一章 · 句子基础", desc: "五种基本句型、there be、各种问句和感叹句", ids: ["basic5", "therebe", "questions", "tagq"] },
      { title: "第二章 · 词法", desc: "动词搭配、时间、数量、介词、连词、比较、短语动词", ids: ["likes", "time", "quantity", "prep", "conj", "compare", "phrasal"] },
      { title: "第三章 · 动词与时态", desc: "各种时态、情态动词和被动语态", ids: ["continuous", "past", "future", "experience", "perfcont", "pastperf", "modals", "deduce", "advice", "passive", "passive2"] },
      { title: "第四章 · 非谓语动词", desc: "to do、doing、done", ids: ["infinitive", "gerund", "participle"] },
      { title: "第五章 · 从句与虚拟", desc: "定语从句、名词性从句、状语从句、间接引语、虚拟语气", ids: ["clauses", "relative", "relative2", "nounclause", "adverbial", "reported", "conditional", "subjunctive"] },
      { title: "第六章 · 特殊句式", desc: "强调、倒装、it 的用法和长句", ids: ["emphasis", "inversion", "itform", "long"] },
    ] },
    { id: "writing", title: "写作句型", icon: "✍️", desc: "四六级作文和雅思写作里最常用的句型：开头、观点、论证、举例、让步、结尾，以及图表和流程图的描述。打熟了考场上直接能用。", groups: [
      { title: "四六级作文", desc: "开头、观点、论证、举例、让步、结尾、书信", ids: ["w-open", "w-view", "w-reason", "w-example", "w-contrast", "w-conclude", "w-letter"] },
      { title: "雅思写作 Task 2", desc: "讨论双方观点、原因与影响、问题与解决、优缺点", ids: ["i-discuss", "i-cause", "i-problem", "i-adv"] },
      { title: "雅思写作 Task 1", desc: "趋势、数据比较、流程图和地图", ids: ["c-trend", "c-compare", "c-process"] },
    ] },
    { id: "speaking", title: "口语句型", icon: "🗣️", desc: "雅思口语三个部分的常用说法，和日常对话里地道的回应、委婉表达。做完可以按 Ctrl+M 跟读。", groups: [
      { title: "雅思口语 Part 1", desc: "家乡住处、学习工作、喜好习惯", ids: ["s-home", "s-daily", "s-likes"] },
      { title: "雅思口语 Part 2", desc: "讲一段经历，描述人、地方和物品", ids: ["s-story", "s-describe"] },
      { title: "雅思口语 Part 3", desc: "发表看法，比较过去与现在", ids: ["s-opinion", "s-compare"] },
      { title: "地道表达", desc: "回应、附和、委婉地说不确定", ids: ["s-respond", "s-hedge"] },
    ] },
  ];

  // ==================== 语法句型 ====================

  lesson("basic5", "五种基本句型", "🧩", "主谓 / 主谓宾 / 主系表 / 双宾语 / 宾语补足语", [`
The baby|这个宝宝
The baby is sleeping|宝宝在睡觉
The baby is sleeping peacefully|宝宝睡得很安稳`, `
the answer|答案
know the answer|知道答案
Nobody knows the answer|没有人知道答案
Nobody knows the answer to this question|没有人知道这个问题的答案`, `
tired|累的
look tired|看起来很累
You look tired|你看起来很累
You look tired today|你今天看起来很累`, `
a birthday card|一张生日卡
sent me a birthday card|寄给我一张生日卡
My aunt sent me a birthday card|我姑姑寄给我一张生日卡`, `
the room|房间
keep the room clean|保持房间干净
Please keep the room clean|请保持房间干净`]);

  lesson("therebe", "There be 句型", "🏠", "有……：there is / there are / there will be / there used to be", [`
a lot of people|很多人
There are a lot of people|有很多人
There are a lot of people in the park|公园里有很多人
There are a lot of people in the park today|今天公园里有很多人`, `
any milk|一些牛奶
Is there any milk|有牛奶吗
Is there any milk in the fridge?|冰箱里还有牛奶吗？`, `
a concert|一场音乐会
There will be a concert|将会有一场音乐会
There will be a concert in the square|广场上将会有一场音乐会
There will be a concert in the square this Saturday|这周六广场上会有一场音乐会`, `
nothing wrong|没什么问题
There is nothing wrong|没什么问题
There is nothing wrong with your computer|你的电脑没什么问题`, `
a cinema|一家电影院
There used to be a cinema|过去有一家电影院
There used to be a cinema on this street|这条街上以前有一家电影院`]);

  lesson("tagq", "反义疑问、祈使与感叹", "❗", "isn't it? / Don't … / What a …! / How …!", [`
a lovely day|美好的一天
It's a lovely day|今天天气真好
It's a lovely day, isn't it?|今天天气真好，不是吗？`, `
been to Paris|去过巴黎
You haven't been to Paris|你没去过巴黎
You haven't been to Paris, have you?|你没去过巴黎，对吧？`, `
the door|门
Don't open the door|别开门
Don't open the door to strangers|别给陌生人开门`, `
a beautiful garden|一个漂亮的花园
What a beautiful garden|多么漂亮的花园啊
What a beautiful garden you have!|你的花园真漂亮！`, `
time|时间
time flies|时光飞逝
How fast time flies!|时间过得真快！`]);

  lesson("quantity", "数量表达", "🔢", "much / many / a few / a little / plenty of", [`
free time|空闲时间
much free time|很多空闲时间
I don't have much free time|我没有多少空闲时间
I don't have much free time these days|我最近没有多少空闲时间`, `
a few friends|几个朋友
invited a few friends|邀请了几个朋友
She invited a few friends to dinner|她请了几个朋友来吃晚饭`, `
a little sugar|一点糖
with a little sugar|加一点糖
I'd like my tea with a little sugar|我的茶想加一点糖`, `
plenty of time|充足的时间
we have plenty of time|我们有充足的时间
Don't worry, we have plenty of time|别担心，我们的时间很充足`, `
How many students|多少个学生
How many students are there|有多少个学生
How many students are there in your class?|你们班有多少个学生？`]);

  lesson("prep", "介词搭配", "📌", "in / on / at 和常见的「形容词、动词 + 介词」", [`
a meeting|一个会
on Monday morning|在周一早上
I have a meeting on Monday morning|我周一早上有个会`, `
good at math|擅长数学
My sister is good at math|我妹妹擅长数学
My sister is good at math but bad at drawing|我妹妹擅长数学，但不擅长画画`, `
interested in history|对历史感兴趣
very interested in Chinese history|对中国历史很感兴趣
He is very interested in Chinese history|他对中国历史很感兴趣`, `
the weather|天气
depends on the weather|取决于天气
Whether we go or not depends on the weather|我们去不去取决于天气`, `
the end of the month|月底
at the end of the month|在月底
I'll pay you back at the end of the month|我月底把钱还你`]);

  lesson("conj", "连词与连接副词", "🔀", "so / although / however / both … and / not only … but also", [`
I was tired|我很累
went to bed early|早早睡了
I was tired, so I went to bed early|我很累，所以早早就睡了`, `
it was raining|在下雨
Although it was raining|虽然在下雨
Although it was raining, they kept playing football|虽然下着雨，他们还是继续踢足球`, `
The hotel was expensive|酒店很贵
the service was excellent|服务非常好
The hotel was expensive; however, the service was excellent|酒店很贵，不过服务非常好`, `
both English and French|英语和法语都
She speaks both English and French|她英语和法语都会说
She speaks both English and French fluently|她英语和法语都说得很流利`, `
cheap|便宜的
not only cheap but also healthy|不仅便宜而且健康
Cooking at home is not only cheap but also healthy|在家做饭不仅便宜，而且健康`]);

  lesson("phrasal", "短语动词", "🧷", "look after / give up / figure out / turn down / put off", [`
my cat|我的猫
look after my cat|照顾我的猫
Could you look after my cat?|你能帮我照看一下猫吗？
Could you look after my cat while I'm away?|我不在的时候，你能帮我照看猫吗？`, `
smoking|吸烟
gave up smoking|戒了烟
My father gave up smoking|我爸爸戒烟了
My father gave up smoking two years ago|我爸爸两年前戒了烟`, `
the problem|这个问题
figured out the problem|弄清楚了问题
We finally figured out the problem|我们终于弄清楚了问题所在`, `
the job offer|那份工作邀请
turned down the job offer|拒绝了那份工作
She turned down the job offer|她拒绝了那份工作邀请
She turned down the job offer because the pay was too low|她拒绝了那份工作，因为工资太低`, `
the meeting|会议
put off the meeting|推迟会议
They put off the meeting until next week|他们把会议推迟到了下周`]);

  lesson("perfcont", "现在完成进行时", "⏳", "have been doing：从过去一直做到现在", [`
learning English|学英语
have been learning English|一直在学英语
I have been learning English for ten years|我学英语已经十年了`, `
raining|下雨
It has been raining|一直在下雨
It has been raining since this morning|从今天早上开始一直在下雨`, `
waiting here|在这里等
have you been waiting|你一直在等
How long have you been waiting here?|你在这里等了多久了？`, `
working too hard|工作太拼了
she has been working too hard|她最近工作太拼了
She looks tired because she has been working too hard|她看起来很累，因为她最近工作太拼了`, `
this report|这份报告
writing this report|写这份报告
I've been writing this report since lunch|我从午饭后就一直在写这份报告`]);

  lesson("pastperf", "过去完成时与 used to", "🕰️", "had done：过去的过去 · used to：以前常常", [`
had already left|已经离开了
the train had already left|火车已经开走了
When we got to the station, the train had already left|我们到车站的时候，火车已经开走了`, `
the sea|大海
had never seen the sea|从没见过大海
She had never seen the sea before she was twenty|她二十岁以前从没见过大海`, `
lived in Shanghai|住在上海
I used to live in Shanghai|我以前住在上海
I used to live in Shanghai, but now I live in Beijing|我以前住在上海，现在住在北京`, `
play outside|在外面玩
We used to play outside|我们以前常在外面玩
We used to play outside until it got dark|我们以前常常在外面玩到天黑`, `
the film|这部电影
I had seen the film before|这部电影我以前看过
I had seen the film before, so I knew the ending|这部电影我以前看过，所以知道结局`]);

  lesson("deduce", "情态动词表推测", "🔍", "must be / can't be / might be / must have done", [`
at home|在家
she must be at home|她一定在家
The lights are on, so she must be at home|灯亮着，所以她一定在家`, `
true|真的
can't be true|不可能是真的
That story can't be true|那个说法不可能是真的`, `
in the car|在车里
might be in the car|可能在车里
Your phone might be in the car|你的手机可能在车里`, `
missed the bus|错过了公交车
He might have missed the bus|他可能错过了公交车
He might have missed the bus this morning|他今天早上可能没赶上公交车`, `
lock the door|锁门
forgotten to lock the door|忘了锁门
You must have forgotten to lock the door|你一定是忘了锁门`]);

  lesson("passive2", "被动语态进阶", "🏛️", "完成时、进行时、情态动词的被动，和 It is said that …", [`
been sold|被卖掉了
have already been sold|已经卖出去了
All the tickets have already been sold|所有的票都已经卖出去了`, `
be finished|被完成
must be finished by Friday|必须在周五前完成
The work must be finished by Friday|这项工作必须在周五前完成`, `
being repaired|正在被修理
The road is being repaired|这条路正在维修
The road is being repaired, so we have to take another way|路正在维修，所以我们得换条路走`, `
It is said|据说
It is said that the old house is haunted|据说那座老房子闹鬼`, `
The telephone|电话
The telephone was invented|电话被发明了
The telephone was invented by Alexander Graham Bell|电话是亚历山大·格雷厄姆·贝尔发明的`]);

  lesson("infinitive", "不定式 to do", "🎯", "表示目的、作宾语、作定语，和 It is … to do", [`
catch the first train|赶头班火车
got up early to catch the first train|为了赶头班火车早早起床
He got up early to catch the first train|他早早起床去赶头班火车`, `
learn to drive|学开车
decided to learn to drive|决定学开车
She decided to learn to drive this summer|她决定今年夏天学开车`, `
say no|说「不」
It is hard to say no|很难说「不」
It is hard to say no to your boss|对老板说「不」很难`, `
what to do|该做什么
didn't know what to do|不知道该怎么办
I didn't know what to do next|我不知道接下来该怎么办`, `
a place to stay|一个住的地方
need a cheap place to stay|需要一个便宜的住处
We need a cheap place to stay for tonight|我们今晚需要一个便宜的住处`]);

  lesson("gerund", "动名词 doing", "🚴", "作主语、作宾语，和介词后面的 doing", [`
Swimming|游泳
Swimming is good exercise|游泳是很好的运动
Swimming is good exercise for your whole body|游泳对全身都是很好的锻炼`, `
waiting|等
mind waiting|介意等
Do you mind waiting a few minutes?|你介意等几分钟吗？`, `
seeing you|见到你
looking forward to seeing you|期待见到你
I'm looking forward to seeing you again|我很期待再次见到你`, `
saying goodbye|说再见
without saying goodbye|没说再见
He left the party without saying goodbye|他没打招呼就离开了聚会`, `
stopped talking|不说话了
Everyone stopped talking|大家都不说话了
Everyone stopped talking when the teacher came in|老师进来的时候，大家都不说话了`]);

  lesson("participle", "分词作定语和状语", "🍂", "the broken window / the man standing … / Feeling tired, …", [`
the broken window|那扇破窗户
fix the broken window|修那扇破窗户
Someone came to fix the broken window|有人来修那扇破窗户了`, `
the man|那个男人
the man standing by the door|站在门边的那个男人
Who is the man standing by the door?|站在门边的那个人是谁？`, `
tired|累的
Feeling tired|觉得累
Feeling tired, she went to bed early|她觉得累，就早早睡了`, `
Written in simple English|用简单的英语写成
the book is easy to read|这本书很好读
Written in simple English, the book is easy to read|这本书用简单的英语写成，读起来很容易`, `
the sleeping baby|熟睡的宝宝
looked at the sleeping baby|看着熟睡的宝宝
She smiled and looked at the sleeping baby|她微笑着看着熟睡的宝宝`]);

  lesson("relative", "定语从句", "🧵", "who / that / whose / where / why 修饰名词", [`
the book|那本书
the book that you lent me|你借给我的那本书
I have finished the book that you lent me|你借给我的那本书我看完了`, `
a friend|一个朋友
a friend whose father is a pilot|一个爸爸是飞行员的朋友
I have a friend whose father is a pilot|我有个朋友，他爸爸是飞行员`, `
the town|那个小镇
the town where I grew up|我长大的那个小镇
This is the town where I grew up|这就是我长大的小镇`, `
the people|那些人
the people who work here|在这里工作的人
The people who work here are very friendly|在这里工作的人都很友好`, `
the reason|原因
the reason why he left|他离开的原因
Nobody knows the reason why he left|没有人知道他离开的原因`]);

  lesson("relative2", "非限制性定语从句", "🪢", ", who … / , which … / 介词 + which / most of whom", [`
My brother|我哥哥
My brother, who lives in Canada|我哥哥住在加拿大
My brother, who lives in Canada, is coming home next week|我哥哥住在加拿大，他下周回家`, `
missed the bus|错过了公交车
which made me late for work|这让我上班迟到了
I missed the bus, which made me late for work|我错过了公交车，结果上班迟到了`, `
the Great Wall|长城
We visited the Great Wall|我们参观了长城
We visited the Great Wall, which was even bigger than we expected|我们参观了长城，它比我们想象的还要壮观`, `
the house|那座房子
the house in which he was born|他出生的房子
This is the house in which he was born|这就是他出生的房子`, `
ten colleagues|十个同事
most of whom are younger than me|其中大部分比我年轻
I have ten colleagues, most of whom are younger than me|我有十个同事，其中大部分比我年轻`]);

  lesson("nounclause", "名词性从句", "📦", "what / whether / that / how 引导的主语、宾语、表语从句", [`
what you said|你说的话
agree with what you said|同意你说的
I completely agree with what you said|我完全同意你说的`, `
whether he will come|他会不会来
I'm not sure whether he will come|我不确定他会不会来
I'm not sure whether he will come to the party|我不确定他会不会来参加聚会`, `
your health|你的健康
What matters most|最重要的
What matters most is your health|最重要的是你的健康`, `
enough money|足够的钱
we don't have enough money|我们的钱不够
The problem is that we don't have enough money|问题是我们的钱不够`, `
this machine|这台机器
how this machine works|这台机器怎么运作
Can you explain how this machine works?|你能解释一下这台机器是怎么运作的吗？`]);

  lesson("adverbial", "状语从句", "🧭", "as soon as / so … that / in case / even though / so that", [`
as soon as I get home|我一到家
I'll call you as soon as I get home|我一到家就给你打电话`, `
fell asleep|睡着了
so tired that I fell asleep|太累了，一下就睡着了
I was so tired that I fell asleep on the sofa|我太累了，在沙发上就睡着了`, `
an umbrella|一把伞
Take an umbrella|带把伞
Take an umbrella in case it rains|带把伞，以防下雨`, `
she was ill|她病了
Even though she was ill|即使她生病了
Even though she was ill, she went to work|即使生病了，她还是去上班了`, `
speak louder|大声一点
so that everyone can hear you|好让大家都能听到你
Please speak louder so that everyone can hear you|请大声一点，好让大家都能听到`]);

  lesson("reported", "间接引语", "💬", "He said that … / She asked if … / told me to …", [`
he was busy|他很忙
He said that he was busy|他说他很忙
He said that he was busy that day|他说他那天很忙`, `
hungry|饿的
if I was hungry|我饿不饿
She asked me if I was hungry|她问我饿不饿`, `
turn off our phones|把手机关掉
told us to turn off our phones|让我们把手机关掉
The teacher told us to turn off our phones|老师让我们把手机关掉`, `
where I lived|我住在哪里
wanted to know where I lived|想知道我住在哪里
He wanted to know where I lived|他想知道我住在哪里`, `
a little late|晚一点
she would be a little late|她会晚到一会儿
She said she would be a little late|她说她会晚到一会儿`]);

  lesson("subjunctive", "虚拟语气进阶", "🌙", "I wish … / If I had done … / as if / It's time …", [`
speak English|说英语
speak English fluently|流利地说英语
I wish I could speak English fluently|我真希望我能说一口流利的英语`, `
had studied harder|当时更努力学习
If I had studied harder|如果我当时更努力学习
If I had studied harder, I would have passed the exam|如果我当时更努力学习，考试就过了`, `
nothing had happened|什么都没发生过
as if nothing had happened|好像什么都没发生过
He acted as if nothing had happened|他表现得好像什么都没发生过`, `
home|家
went home|回家
It's time we went home|我们该回家了`, `
tell anyone|告诉任何人
you didn't tell anyone|你不要告诉任何人
I'd rather you didn't tell anyone about this|我希望你别把这件事告诉任何人`]);

  lesson("emphasis", "强调句", "🔦", "It is/was … that/who … 和 do / did 强调谓语", [`
broke the window|打破了窗户
It was Tom who broke the window|是汤姆打破了窗户
It was Tom who broke the window, not me|是汤姆打破的窗户，不是我`, `
first met|初次见面
they first met|他们初次相遇
It was in Paris that they first met|他们正是在巴黎初次相遇的`, `
this song|这首歌
love this song|喜欢这首歌
I do love this song|我真的很喜欢这首歌`, `
called you yesterday|昨天给你打了电话
I did call you yesterday|我昨天确实给你打过电话
I did call you yesterday, but you didn't answer|我昨天真的给你打过电话，可你没接`, `
time|时间
not money but time|不是钱，而是时间
What I need is not money but time|我需要的不是钱，而是时间`]);

  lesson("inversion", "倒装句", "🔄", "so do I / Never have I … / Not until … / Only then … / Here comes …", [`
coffee|咖啡
She likes coffee|她喜欢咖啡
She likes coffee, and so do I|她喜欢咖啡，我也喜欢`, `
a beautiful sunset|美丽的日落
such a beautiful sunset|这么美的日落
Never have I seen such a beautiful sunset|我从没见过这么美的日落`, `
came home|回家
He didn't come home until midnight|他直到半夜才回家
Not until midnight did he come home|直到半夜他才回家`, `
my mistake|我的错误
realize my mistake|意识到我的错误
Only then did I realize my mistake|直到那时我才意识到自己的错误`, `
the bus|公交车
Here comes the bus|公交车来了
Look, here comes the bus|看，公交车来了`]);

  lesson("itform", "it 的用法", "🌀", "形式主语、形式宾语，It takes … / It seems that …", [`
an hour|一个小时
It takes me an hour|我要花一个小时
It takes me an hour to get to work|我上班路上要花一个小时`, `
nobody is home|家里没人
It seems that nobody is home|看起来家里没人
It seems that nobody is home right now|看起来现在家里没人`, `
find it difficult|觉得很难
find it difficult to get up early|觉得早起很难
I find it difficult to get up early in winter|我发现冬天早起很难`, `
It's no use crying|哭也没用
It's no use crying over spilt milk|覆水难收（为打翻的牛奶哭泣也没用）`, `
enough water|足够的水
drink enough water|喝足够的水
It is important to drink enough water|喝足够的水很重要
It is important to drink enough water every day|每天喝足够的水很重要`]);

  // ==================== 写作句型 ====================

  lesson("w-open", "开头：引出话题", "🚪", "With the development of … / has aroused a heated discussion / It is widely believed that …", [`
the development of the Internet|互联网的发展
With the development of the Internet|随着互联网的发展
With the development of the Internet, online shopping has become more and more popular|随着互联网的发展，网购越来越流行`, `
a heated discussion|一场激烈的讨论
has aroused a heated discussion|引起了激烈的讨论
Whether college students should take part-time jobs has aroused a heated discussion|大学生是否应该做兼职，引起了激烈的讨论`, `
broaden our horizons|开阔眼界
reading can broaden our horizons|读书能开阔眼界
It is widely believed that reading can broaden our horizons|人们普遍认为读书可以开阔眼界`, `
live alone|独自生活
choose to live alone|选择独居
Nowadays, more and more young people choose to live alone|如今，越来越多的年轻人选择独居`, `
practice|练习
practice makes perfect|熟能生巧
As the saying goes, practice makes perfect|俗话说，熟能生巧`]);

  lesson("w-view", "表达观点", "💭", "As far as I am concerned / I firmly believe / There is no doubt that …", [`
the disadvantages|缺点
the advantages outweigh the disadvantages|利大于弊
As far as I am concerned, the advantages outweigh the disadvantages|在我看来，利大于弊`, `
success|成功
hard work leads to success|努力会带来成功
I firmly believe that hard work leads to success|我坚信努力会带来成功`, `
protect the environment|保护环境
it is necessary to protect the environment|保护环境很有必要
From my perspective, it is necessary to protect the environment|在我看来，保护环境很有必要`, `
changed our lives|改变了我们的生活
technology has changed our lives|科技改变了我们的生活
There is no doubt that technology has changed our lives|毫无疑问，科技改变了我们的生活`, `
this proposal|这个提议
in favor of this proposal|赞成这个提议
Personally, I am in favor of this proposal|就我个人而言，我赞成这个提议`]);

  lesson("w-reason", "列举理由", "🪜", "First of all / Moreover / What's more / Last but not least", [`
stay healthy|保持健康
helps us stay healthy|帮助我们保持健康
First of all, regular exercise helps us stay healthy|首先，规律运动帮助我们保持健康`, `
reduce stress|减轻压力
improve our mood|改善心情
Moreover, it can reduce stress and improve our mood|此外，它还能减轻压力、改善心情`, `
make friends|交朋友
a chance to make friends|交朋友的机会
What's more, it gives us a chance to make friends|更重要的是，它让我们有机会交朋友`, `
the cost|成本
we should consider the cost|我们应该考虑成本
Last but not least, we should consider the cost|最后但同样重要的是，我们应该考虑成本`, `
an important role|重要的作用
plays an important role in our daily life|在日常生活中起着重要作用
The mobile phone plays an important role in our daily life|手机在我们的日常生活中起着重要作用`]);

  lesson("w-example", "举例说明", "🔎", "For example / such as / Take … for example / A good case in point is …", [`
learn English|学英语
use apps to learn English|用 App 学英语
For example, many students use apps to learn English|例如，很多学生用 App 学英语`, `
outdoor activities|户外活动
outdoor activities such as hiking and cycling|徒步、骑行这类户外活动
I enjoy outdoor activities such as hiking and cycling|我喜欢徒步、骑行这类户外活动`, `
my cousin|我表哥
Take my cousin for example|以我表哥为例
Take my cousin for example; he found his job online|以我表哥为例，他是在网上找到工作的`, `
high-speed railway|高铁
China's high-speed railway|中国的高铁
A good case in point is China's high-speed railway|中国的高铁就是一个很好的例子`, `
a recent survey|最近的一项调查
According to a recent survey|根据最近的一项调查
According to a recent survey, over half of the students feel stressed|根据最近的一项调查，超过一半的学生感到有压力`]);

  lesson("w-contrast", "对比与让步", "⚖️", "On the one hand … on the other hand / Admittedly / Despite / Compared with", [`
saves time|节省时间
working from home saves time|在家办公节省时间
On the one hand, working from home saves time|一方面，在家办公节省时间`, `
feel lonely|感到孤独
make people feel lonely|让人感到孤独
On the other hand, it can make people feel lonely|另一方面，它可能让人感到孤独`, `
some drawbacks|一些缺点
online courses have some drawbacks|网课有一些缺点
Admittedly, online courses have some drawbacks|诚然，网课有一些缺点`, `
worth trying|值得一试
Despite these problems|尽管有这些问题
Despite these problems, I still think it is worth trying|尽管有这些问题，我仍然认为值得一试`, `
paper books|纸质书
Compared with paper books|与纸质书相比
Compared with paper books, e-books are much easier to carry|和纸质书相比，电子书携带起来方便得多`]);

  lesson("w-conclude", "结尾与建议", "🏁", "In conclusion / take effective measures / Only in this way … / It is high time …", [`
the Internet|互联网
make full use of the Internet|充分利用互联网
In conclusion, we should make full use of the Internet|总之，我们应该充分利用互联网`, `
take effective measures|采取有效措施
take effective measures to solve this problem|采取有效措施解决这个问题
The government should take effective measures to solve this problem|政府应该采取有效措施来解决这个问题`, `
our planet|我们的地球
protect our planet|保护地球
Only in this way can we protect our planet|只有这样，我们才能保护地球`, `
take action|采取行动
we took action|我们采取行动
It is high time that we took action|我们早就该采取行动了`, `
a bright future|光明的未来
we will have a bright future|我们会有光明的未来
As long as we work together, we will have a bright future|只要我们齐心协力，就会有光明的未来`]);

  lesson("w-letter", "书信：申请、感谢、建议", "✉️", "I am writing to … / I would appreciate it if … / looking forward to …", [`
apply for the position|申请这个职位
I am writing to apply for the position|我写信是想申请这个职位
I am writing to apply for the position of English tutor|我写信是想申请英语家教这个职位`, `
reply|回复
if you could reply|如果您能回复
I would appreciate it if you could reply at your earliest convenience|如果您能尽早回复，我将不胜感激`, `
my sincere thanks|我真诚的感谢
express my sincere thanks|表达我真诚的感谢
I'd like to express my sincere thanks for your help|我想对您的帮助表示衷心的感谢`, `
some suggestions|一些建议
make some suggestions|提几点建议
I'd like to make some suggestions on how to improve the library|关于如何改进图书馆，我想提几点建议`, `
hearing from you|收到您的来信
looking forward to hearing from you|期待收到您的来信
I am looking forward to hearing from you soon|期待早日收到您的回信`]);

  lesson("i-discuss", "讨论双方观点", "🗣️", "Some people argue that … / while others … / On balance …", [`
be free|免费
university education should be free|大学教育应该免费
Some people argue that university education should be free|有些人认为大学教育应该免费`, `
the countryside|乡下
live in the countryside|住在乡下
others would rather live in the countryside|另一些人宁愿住在乡下
While some people prefer to live in cities, others would rather live in the countryside|有些人喜欢住在城市，另一些人则宁愿住在乡下`, `
both views|两种观点
discuss both views|讨论两种观点
This essay will discuss both views|本文将讨论这两种观点
This essay will discuss both views before giving my own opinion|本文将先讨论这两种观点，再给出我自己的看法`, `
the latter view|后一种观点
agree with the latter view|赞同后一种观点
On balance, I agree with the latter view|总的来说，我赞同后一种观点`, `
several important factors|几个重要因素
it ignores several important factors|它忽略了几个重要因素
Although there is some truth in this argument, it ignores several important factors|尽管这种观点有一定道理，但它忽略了几个重要因素`]);

  lesson("i-cause", "原因与影响", "🌊", "lead to / be due to / One of the main reasons … / As a result / have an impact on", [`
serious health problems|严重的健康问题
can lead to serious health problems|可能导致严重的健康问题
A lack of sleep can lead to serious health problems|缺乏睡眠可能导致严重的健康问题`, `
unhealthy diets|不健康的饮食
due to unhealthy diets|由于不健康的饮食
The rise in obesity is largely due to unhealthy diets|肥胖率上升很大程度上是由于不健康的饮食`, `
too expensive|太贵
housing has become too expensive|房价太高
One of the main reasons for this is that housing has become too expensive|造成这种情况的主要原因之一是房价太高`, `
afford a home|买得起房
many young people cannot afford a home|很多年轻人买不起房
As a result, many young people cannot afford a home|结果，很多年轻人买不起房`, `
public health|公众健康
a negative impact on public health|对公众健康的负面影响
Air pollution has a negative impact on public health|空气污染对公众健康有负面影响`]);

  lesson("i-problem", "问题与解决办法", "🛠️", "One possible solution … / In order to tackle … / raise awareness", [`
public transport|公共交通
improve public transport|改善公共交通
One possible solution would be to improve public transport|一个可行的办法是改善公共交通`, `
work from home|在家办公
let employees work from home|让员工在家办公
Companies should be encouraged to let employees work from home|应该鼓励公司让员工在家办公`, `
tackle this problem|解决这个问题
In order to tackle this problem|为了解决这个问题
In order to tackle this problem, governments need to invest more in education|为了解决这个问题，政府需要在教育上投入更多`, `
raise public awareness|提高公众意识
raise public awareness of the issue|提高公众对这个问题的认识
The media can help raise public awareness of the issue|媒体可以帮助提高公众对这个问题的认识`, `
heavier fines|更重的罚款
introduce heavier fines for littering|对乱扔垃圾处以更重的罚款
Another measure would be to introduce heavier fines for littering|另一个措施是对乱扔垃圾处以更重的罚款`]);

  lesson("i-adv", "优点与缺点", "🌗", "The main advantage … / A major drawback … / outweigh / a double-edged sword", [`
living in a city|住在城市
The main advantage of living in a city|住在城市的主要好处
The main advantage of living in a city is convenience|住在城市的主要好处是方便`, `
the high cost of living|高昂的生活成本
A major drawback is the high cost of living|一个主要缺点是生活成本高`, `
the benefits far outweigh the drawbacks|好处远远大于坏处
the benefits of studying abroad|出国留学的好处
In my opinion, the benefits of studying abroad far outweigh the drawbacks|在我看来，出国留学的好处远远大于坏处`, `
a double-edged sword|一把双刃剑
Social media is a double-edged sword|社交媒体是一把双刃剑
Social media is a double-edged sword for teenagers|社交媒体对青少年来说是一把双刃剑`, `
some disadvantages|一些缺点
there are also some disadvantages to consider|也有一些缺点需要考虑
However, there are also some disadvantages to consider|然而，也有一些缺点需要考虑`]);

  lesson("c-trend", "描述趋势", "📈", "rose sharply / a steady decline / remained stable / reached a peak / fluctuated", [`
rose sharply|急剧上升
The number of tourists rose sharply|游客数量急剧上升
The number of tourists rose sharply between 2010 and 2015|2010 年到 2015 年间，游客数量急剧上升`, `
a steady decline|稳步下降
a steady decline in car sales|汽车销量稳步下降
There was a steady decline in car sales over the period|在这段时间里，汽车销量稳步下降`, `
remained stable|保持稳定
remained stable at around 20%|稳定在 20% 左右
The figure remained stable at around 20% for the next five years|在接下来的五年里，这个数字稳定在 20% 左右`, `
reached a peak|达到顶峰
reached a peak of 50 million|达到 5000 万的峰值
Sales reached a peak of 50 million in 2018|销量在 2018 年达到 5000 万的峰值`, `
fluctuated|波动
fluctuated between 30 and 40 dollars|在 30 到 40 美元之间波动
Prices fluctuated between 30 and 40 dollars throughout the year|全年价格在 30 到 40 美元之间波动`]);

  lesson("c-compare", "比较数据", "📊", "account for / twice as many … as / the highest proportion / whereas", [`
accounted for 40%|占 40%
accounted for 40% of the total|占总数的 40%
Coal accounted for 40% of the total energy consumption|煤炭占能源消耗总量的 40%`, `
visitors|游客
twice as many visitors|两倍多的游客
There were twice as many visitors in summer as in winter|夏天的游客是冬天的两倍`, `
significantly higher|明显更高
The figure for men was significantly higher|男性的数据明显更高
The figure for men was significantly higher than that for women|男性的数据明显高于女性`, `
elderly people|老年人
the highest proportion of elderly people|最高的老年人口比例
Japan had the highest proportion of elderly people|日本的老年人口比例最高
Overall, Japan had the highest proportion of elderly people|总体来看，日本的老年人口比例最高`, `
preferred reading|更喜欢阅读
most women preferred reading|大多数女性更喜欢阅读
Most men preferred sports, whereas most women preferred reading|大多数男性更喜欢运动，而大多数女性更喜欢阅读`]);

  lesson("c-process", "流程图与地图", "🗺️", "被动语态描述步骤，At the first stage / After that / was replaced by / to the north of", [`
is recycled|被回收
how paper is recycled|纸是如何被回收的
The diagram shows how paper is recycled|这张图展示了纸张回收的过程`, `
the raw materials|原材料
the raw materials are collected|原材料被收集起来
At the first stage, the raw materials are collected|在第一阶段，原材料被收集起来`, `
small pieces|小块
washed and cut into small pieces|被清洗并切成小块
After that, they are washed and cut into small pieces|之后，它们被清洗并切成小块`, `
a shopping mall|一个购物中心
was replaced by a shopping mall|被一个购物中心取代了
The old factory was replaced by a shopping mall|旧工厂被一个购物中心取代了`, `
to the north of the hospital|在医院北边
A new car park was built|新建了一个停车场
A new car park was built to the north of the hospital|医院北边新建了一个停车场`]);

  // ==================== 口语句型 ====================

  lesson("s-home", "家乡与住处", "🏡", "I come from … / It's famous for … / What I like most about …", [`
a quiet town|一个安静的小镇
I come from a quiet town|我来自一个安静的小镇
I come from a quiet town in the south of China|我来自中国南方的一个安静小镇`, `
famous for its seafood|以海鲜出名
It's famous for its delicious seafood|它以美味的海鲜出名
It's famous for its delicious seafood and beautiful beaches|它以美味的海鲜和漂亮的海滩出名`, `
a two-bedroom apartment|一套两居室的公寓
I live in a two-bedroom apartment|我住在一套两居室的公寓里
I live in a two-bedroom apartment with my parents|我和父母住在一套两居室的公寓里`, `
very peaceful|很安静
What I like most about my neighborhood|我最喜欢我们小区的一点
What I like most about my neighborhood is that it's very peaceful|我最喜欢我们小区的一点是它很安静`, `
somewhere bigger|大一点的地方
live somewhere bigger|住在大一点的地方
I'd prefer to live somewhere bigger|我更想住在大一点的地方
To be honest, I'd prefer to live somewhere bigger|说实话，我更想住在大一点的地方`]);

  lesson("s-daily", "学习、工作与日常", "📅", "I'm currently … / I work as … / On a typical day … / It depends on …", [`
business|商科
studying business|学商科
I'm currently studying business at university|我目前在大学学商科`, `
a software engineer|一名软件工程师
I work as a software engineer|我是一名软件工程师
I work as a software engineer for a tech company|我在一家科技公司当软件工程师`, `
at around seven|七点左右
I get up at around seven|我七点左右起床
On a typical day, I get up at around seven|平常我七点左右起床`, `
go for a walk|去散步
go for a walk or read a novel|去散步或者看小说
In my spare time, I usually go for a walk or read a novel|空闲时间我一般去散步或者看小说`, `
how busy I am|我有多忙
it depends on how busy I am|这要看我有多忙
Well, it depends on how busy I am|嗯，这要看我有多忙`]);

  lesson("s-likes", "喜好与习惯", "🎧", "I'm really into … / not a big fan of … / whenever I get the chance", [`
jazz music|爵士乐
I'm really into jazz music|我特别喜欢爵士乐
I'm really into jazz music these days|我最近特别迷爵士乐`, `
horror movies|恐怖片
not a big fan of horror movies|不太喜欢恐怖片
Honestly, I'm not a big fan of horror movies|说实话，我不太喜欢恐怖片`, `
play the piano|弹钢琴
used to play the piano|以前常弹钢琴
I used to play the piano when I was a kid|我小时候常弹钢琴`, `
go swimming|去游泳
whenever I get the chance|一有机会就
I try to go swimming whenever I get the chance|我一有机会就去游泳`, `
helps me relax|帮我放松
Listening to music helps me relax|听音乐能帮我放松
Listening to music helps me relax after a long day|忙了一天之后，听音乐能帮我放松`]);

  lesson("s-story", "讲一段经历", "📖", "I'd like to talk about … / It all started when … / Looking back …", [`
a trip|一次旅行
a trip I took last year|我去年的一次旅行
I'd like to talk about a trip I took last year|我想讲讲我去年的一次旅行`, `
go camping|去露营
invited me to go camping|邀请我去露营
It all started when my friend invited me to go camping|这一切始于我朋友邀请我去露营`, `
the best weekend ever|最棒的一个周末
it turned out to be the best weekend ever|结果那成了最棒的一个周末
To my surprise, it turned out to be the best weekend ever|让我意外的是，那成了我过得最好的一个周末`, `
the moment|那一刻
the moment when we reached the top|我们登顶的那一刻
I'll never forget the moment when we reached the top|我永远不会忘记我们登顶的那一刻`, `
how lucky I was|我有多幸运
I realize how lucky I was|我意识到自己有多幸运
Looking back, I realize how lucky I was|回想起来，我才意识到自己有多幸运`]);

  lesson("s-describe", "描述人、地方和物品", "🖼️", "The person I admire most … / It's located … / What makes it special …", [`
my grandmother|我奶奶
The person I admire most|我最钦佩的人
The person I admire most is my grandmother|我最敬佩的人是我奶奶`, `
in her sixties|六十多岁
She is in her sixties|她六十多岁了
She is in her sixties but still very active|她六十多岁了，但仍然很活跃`, `
the old town|老城
in the center of the old town|在老城的中心
It's located in the center of the old town|它位于老城的中心`, `
a gift from my father|我父亲送的礼物
What makes it special|它特别的地方
What makes it special is that it was a gift from my father|它特别的地方在于，这是我父亲送给我的礼物`, `
It means a lot to me|它对我意义重大
it reminds me of my childhood|它让我想起童年
It means a lot to me because it reminds me of my childhood|它对我意义重大，因为它让我想起童年`]);

  lesson("s-opinion", "发表看法", "🤔", "I'd say that … / It's hard to say, but … / On the whole …", [`
more open-minded|思想更开放
young people today are more open-minded|现在的年轻人思想更开放
I'd say that young people today are more open-minded than their parents|我觉得现在的年轻人比他们的父母思想更开放`, `
more common|更普遍
it will become more common|这会越来越普遍
It's hard to say, but I think it will become more common|很难说，不过我觉得这会越来越普遍`, `
an interesting question|一个有意思的问题
That's an interesting question|这是个有意思的问题
That's an interesting question that I've never really thought about|这是个有意思的问题，我从来没真正想过`, `
the benefits are greater|好处更大
I think the benefits are greater|我认为好处更大
On the whole, I think the benefits are greater|总的来说，我认为好处更大`, `
money|钱
not just about money|不只是钱的问题
a good job is not just about money|好工作不只是钱的问题
For most people, a good job is not just about money|对大多数人来说，好工作不只是钱的问题`]);

  lesson("s-compare", "过去与现在", "⏮️", "Compared with the past … / In my grandparents' time … / These days …", [`
more choices|更多选择
people now have more choices|现在人们有更多选择
Compared with the past, people now have more choices|和过去相比，现在人们有更多选择`, `
afford a car|买得起车
few people could afford a car|很少有人买得起车
In my grandparents' time, few people could afford a car|在我祖父母那个年代，很少有人买得起车`, `
a smartphone|一部智能手机
almost everyone has a smartphone|几乎人人都有智能手机
These days, almost everyone has a smartphone|如今几乎人人都有智能手机`, `
The way we communicate|我们交流的方式
The way we communicate has changed a lot|我们交流的方式变了很多
The way we communicate has changed a lot over the past twenty years|过去二十年里，我们交流的方式变了很多`, `
work from home|在家工作
more people will probably work from home|可能会有更多人在家工作
In the future, more people will probably work from home|将来，可能会有更多人在家工作`]);

  lesson("s-respond", "回应与附和", "👍", "I couldn't agree more / That makes sense / Fair enough / You can say that again", [`
agree with you|同意你
I couldn't agree more|我完全同意
I couldn't agree more with you on that|在这一点上我完全同意你`, `
That makes sense|有道理
I see it a bit differently|我的看法有点不一样
That makes sense, but I see it a bit differently|有道理，不过我的看法有点不一样`, `
what you mean|你的意思
I know what you mean|我懂你的意思
I know exactly what you mean|我完全明白你的意思`, `
your way|你的方式
do it your way|按你的方法做
Fair enough, let's do it your way|好吧，就按你的方法来`, `
say that|那么说
say that again|再说一遍
You can say that again|你说得太对了`]);

  lesson("s-hedge", "委婉与不确定", "🌫️", "I'm not entirely sure / I might be wrong / I was wondering if … / kind of", [`
not entirely sure|不太确定
it starts at nine|九点开始
I'm not entirely sure, but I think it starts at nine|我不太确定，不过我觉得是九点开始`, `
I might be wrong|我可能说错了
isn't the meeting on Thursday?|会议不是在周四吗？
I might be wrong, but isn't the meeting on Thursday?|我可能记错了，会议不是在周四吗？`, `
the plan needs more work|这个计划还需要完善
It seems to me that the plan needs more work|在我看来，这个计划还需要完善`, `
help me|帮我
if you could help me|你能不能帮我
I was wondering if you could help me with my essay|不知道你能不能帮我看看我的论文`, `
hard to explain|难以解释
kind of hard to explain|有点难解释
It's kind of hard to explain|这事有点难解释`]);
})();
