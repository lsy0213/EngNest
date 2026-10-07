// 连词成句：每句话从一个小词块开始，一步步扩展成完整句子，每一步都有中文
// 每个句子是一段文本，一行一步：「英文|中文」
(function () {
  const L = (window.BUILDER_LESSONS = []);
  const lesson = (id, title, icon, desc, sentences) =>
    L.push({ id, title, icon, desc, sentences: sentences.map((s) => s.trim().split("\n").map((l) => l.split("|").map((x) => x.trim()))) });

  lesson("daily", "日常生活", "☀️", "一天里最常做的事", [`
coffee|咖啡
a cup of coffee|一杯咖啡
drink a cup of coffee|喝一杯咖啡
I drink a cup of coffee|我喝一杯咖啡
I drink a cup of coffee every morning|我每天早上喝一杯咖啡`, `
get up|起床
get up early|早起
I get up early|我起得很早
I usually get up early on weekdays|我工作日通常起得很早`, `
the bus|公交车
take the bus|坐公交车
take the bus to work|坐公交车上班
She takes the bus to work|她坐公交车上班
She takes the bus to work every day|她每天坐公交车上班`, `
my homework|我的作业
finish my homework|完成我的作业
finish my homework before dinner|在晚饭前完成作业
I always finish my homework before dinner|我总是在晚饭前完成作业`]);

  lesson("likes", "喜欢与不喜欢", "❤️", "like / enjoy / prefer 的用法", [`
apples|苹果
eat apples|吃苹果
like to eat apples|喜欢吃苹果
I like to eat apples|我喜欢吃苹果
I like to eat apples very much|我非常喜欢吃苹果`, `
music|音乐
listen to music|听音乐
enjoy listening to music|喜欢听音乐
He enjoys listening to music|他喜欢听音乐
He enjoys listening to music in the car|他喜欢在车里听音乐`, `
movies|电影
watch movies|看电影
watch movies at home|在家看电影
We prefer to watch movies at home|我们更喜欢在家看电影`, `
spicy food|辣的食物
like spicy food|喜欢吃辣
My mother doesn't like spicy food|我妈妈不喜欢吃辣
My mother doesn't like spicy food at all|我妈妈一点也不喜欢吃辣`]);

  lesson("time", "时间表达", "⏰", "时刻、时长、频率和过去的时间", [`
seven o'clock|七点
at seven o'clock|在七点
The meeting starts at seven o'clock|会议七点开始
The meeting starts at seven o'clock tomorrow|会议明天七点开始`, `
two hours|两个小时
for two hours|（持续）两个小时
have waited for two hours|已经等了两个小时
We have waited for two hours|我们已经等了两个小时
We have waited for you for two hours|我们已经等了你两个小时`, `
the weekend|周末
on the weekend|在周末
go hiking on the weekend|周末去徒步
They often go hiking on the weekend|他们周末经常去徒步`, `
three years|三年
three years ago|三年前
moved here three years ago|三年前搬到这里
I moved here three years ago|我三年前搬到了这里`]);

  lesson("places", "地点与方位", "📍", "in / on / next to 和问路", [`
the table|桌子
on the table|在桌子上
Your keys are on the table|你的钥匙在桌子上
Your keys are on the table in the kitchen|你的钥匙在厨房的桌子上`, `
the station|车站
the way to the station|去车站的路
tell me the way to the station|告诉我去车站的路
Can you tell me the way to the station?|你能告诉我去车站的路吗？`, `
a small town|一个小镇
in a small town|在一个小镇
grew up in a small town|在一个小镇长大
My father grew up in a small town|我父亲在一个小镇长大
My father grew up in a small town by the sea|我父亲在海边的一个小镇长大`, `
the park|公园
next to the park|在公园旁边
a new cafe next to the park|公园旁边的一家新咖啡馆
There is a new cafe next to the park|公园旁边有一家新咖啡馆`]);

  lesson("past", "过去发生的事", "📅", "一般过去时，讲讲昨天和以前", [`
a book|一本书
bought a book|买了一本书
bought a book yesterday|昨天买了一本书
I bought a book yesterday|我昨天买了一本书
I bought a book about history yesterday|我昨天买了一本关于历史的书`, `
the train|火车
missed the train|错过了火车
almost missed the train|差点错过火车
We almost missed the train this morning|我们今天早上差点没赶上火车`, `
a letter|一封信
wrote a letter|写了一封信
wrote a letter to her grandmother|给她奶奶写了一封信
She wrote a letter to her grandmother|她给奶奶写了一封信`, `
the news|这个消息
heard the news|听到这个消息
when he heard the news|当他听到这个消息时
He was surprised when he heard the news|他听到这个消息时很惊讶`]);

  lesson("future", "计划与将来", "🗓️", "will / be going to 说打算", [`
a trip to Japan|去日本的旅行
take a trip to Japan|去日本旅行
are going to take a trip to Japan|打算去日本旅行
We are going to take a trip to Japan|我们打算去日本旅行
We are going to take a trip to Japan next month|我们打算下个月去日本旅行`, `
you|你
call you|给你打电话
call you later|晚点给你打电话
I will call you later|我晚点给你打电话
I will call you later tonight|我今晚晚些时候给你打电话`, `
English|英语
learn English|学英语
keep learning English|坚持学英语
I will keep learning English every day|我会每天坚持学英语`, `
rain|下雨
it will rain|会下雨
it will rain tomorrow|明天会下雨
I think it will rain tomorrow|我觉得明天会下雨`]);

  lesson("shopping", "购物", "🛍️", "试穿、打折、付款、退换", [`
this jacket|这件夹克
try on this jacket|试穿这件夹克
Can I try on this jacket?|我可以试穿这件夹克吗？
Can I try on this jacket in a smaller size?|我可以试穿小一号的这件夹克吗？`, `
a discount|折扣
get a discount|得到折扣
Can I get a discount?|能给我打个折吗？
Can I get a discount if I buy two?|如果我买两件能打折吗？`, `
cash|现金
pay in cash|付现金
I'd like to pay in cash|我想付现金`, `
the receipt|收据
keep the receipt|保留收据
Please keep the receipt|请保留收据
Please keep the receipt in case you need a refund|请保留收据，以防你需要退款`]);

  lesson("work", "职场", "💼", "报告、会议、请假、邮件", [`
the report|报告
finish the report|完成报告
finish the report by Friday|在周五前完成报告
We need to finish the report by Friday|我们需要在周五前完成报告`, `
a meeting|一个会议
have a meeting|开会
have a meeting with the client|和客户开会
I have a meeting with the client this afternoon|我今天下午要和客户开会`, `
a day off|一天假
take a day off|请一天假
take a day off next week|下周请一天假
I'd like to take a day off next week|我想下周请一天假`, `
an email|一封邮件
send you an email|给你发一封邮件
send you an email with the details|给你发一封写明细节的邮件
I'll send you an email with the details|我会给你发一封邮件说明细节`]);

  lesson("feelings", "表达感受", "😊", "紧张、感谢、开心、别担心", [`
nervous|紧张的
feel nervous|感到紧张
feel nervous before exams|考试前感到紧张
I always feel nervous before exams|我考试前总是很紧张`, `
your help|你的帮助
thank you for your help|谢谢你的帮助
Thank you so much for your help|非常感谢你的帮助`, `
happy|开心的
make me happy|让我开心
Small things make me happy|小事情让我开心
Small things like this make me happy|像这样的小事让我开心`, `
worry|担心
don't worry|别担心
Don't worry about it|别为这件事担心
Don't worry about it too much|别太担心这件事`]);

  lesson("compare", "比较", "⚖️", "比较级、最高级和 as ... as", [`
bigger|更大的
bigger than mine|比我的大
Your room is bigger than mine|你的房间比我的大
Your room is much bigger than mine|你的房间比我的大得多`, `
the best|最好的
the best restaurant|最好的餐厅
the best restaurant in town|城里最好的餐厅
This is the best restaurant in town|这是城里最好的餐厅`, `
as tall as|和……一样高
as tall as his father|和他父亲一样高
He is as tall as his father|他和他父亲一样高
He is now as tall as his father|他现在和他父亲一样高了`, `
faster|更快的
faster than walking|比走路快
Taking the subway is faster than walking|坐地铁比走路快
Taking the subway is much faster than walking|坐地铁比走路快得多`]);

  lesson("clauses", "从句入门", "🔗", "who / if / where / because 把句子连起来", [`
the girl|那个女孩
the girl who lives next door|住在隔壁的那个女孩
The girl who lives next door is a doctor|住在隔壁的那个女孩是医生`, `
busy|忙的
if you are not busy|如果你不忙
call me if you are not busy|如果你不忙就给我打电话
Please call me if you are not busy tonight|如果你今晚不忙，请给我打电话`, `
where she lives|她住在哪里
I don't know where she lives|我不知道她住在哪里
I don't know where she lives now|我不知道她现在住在哪里`, `
it was raining|正在下雨
because it was raining|因为在下雨
stayed at home because it was raining|因为下雨待在家里
We stayed at home because it was raining|因为下雨，我们待在了家里`]);

  lesson("long", "长句挑战", "🏔️", "把前面学到的都用上", [`
English|英语
speak English|说英语
speak English with confidence|自信地说英语
I want to speak English with confidence|我想自信地说英语
One day I want to speak English with confidence|有一天我想自信地说英语`, `
the world|世界
travel around the world|环游世界
save money to travel around the world|攒钱去环游世界
She is saving money to travel around the world|她正在攒钱去环游世界`, `
a little|一点
practice a little|练一点
practice a little every day|每天练一点
If you practice a little every day, you will improve|如果你每天练一点，你就会进步`, `
the first step|第一步
is the first step|是第一步
The hardest part is the first step|最难的是第一步
The hardest part is always the first step|最难的永远是第一步`]);

  lesson("restaurant", "餐厅点餐", "🍽️", "订位、点菜、结账", [`
a table|一张桌子
a table for two|一张两人桌
I'd like a table for two|我想要一张两人桌
I'd like a table for two by the window|我想要一张靠窗的两人桌`, `
the menu|菜单
the dessert menu|甜点菜单
see the dessert menu|看甜点菜单
Could we see the dessert menu, please?|请问我们能看一下甜点菜单吗？`, `
the steak|牛排
I'll have the steak|我要牛排
I'll have the steak with a salad|我要牛排配沙拉
I'll have the steak with a green salad, please|我要牛排配一份蔬菜沙拉，谢谢`, `
the bill|账单
bring us the bill|把账单拿给我们
Could you bring us the bill?|你能把账单拿给我们吗？
Could you bring us the bill when you have a moment?|你有空的时候能把账单拿给我们吗？`]);

  lesson("travel", "旅行出行", "✈️", "护照、机场、订房、航班", [`
my passport|我的护照
forgot my passport|忘带护照了
I almost forgot my passport|我差点忘了带护照
I almost forgot my passport at the hotel|我差点把护照忘在酒店了`, `
the airport|机场
get to the airport|到机场
How long does it take to get to the airport?|到机场要多长时间？
How long does it take to get to the airport by taxi?|坐出租车到机场要多长时间？`, `
a room|一个房间
booked a room|订了一个房间
booked a room for three nights|订了一个房间，住三晚
We booked a room for three nights near the beach|我们在海边订了一个房间，住三晚`, `
the flight|航班
the flight was delayed|航班延误了
the flight was delayed for two hours|航班延误了两个小时
Our flight was delayed for two hours because of the storm|因为暴风雨，我们的航班延误了两个小时`]);

  lesson("health", "看病与健康", "🩺", "描述症状、听医生的建议", [`
a headache|头痛
have a headache|头疼
I have a terrible headache|我头疼得厉害
I have had a terrible headache since last night|我从昨晚开始就头疼得厉害`, `
more water|更多的水
drink more water|多喝水
You should drink more water|你应该多喝水
You should drink more water and get some rest|你应该多喝水，多休息`, `
this medicine|这种药
take this medicine|吃这种药
take this medicine twice a day|这种药一天吃两次
Please take this medicine twice a day after meals|这种药请一天两次、饭后服用`, `
exercise|锻炼
regular exercise|规律的锻炼
Regular exercise is good for you|规律锻炼对你有好处
Regular exercise is good for both your body and mind|规律锻炼对身心都有好处`]);

  lesson("weather", "天气", "⛅", "冷热晴雨、天气预报", [`
cold|冷的
very cold|很冷
It's very cold today|今天很冷
It's very cold today, so wear a warm coat|今天很冷，穿件暖和的外套吧`, `
an umbrella|一把伞
take an umbrella|带把伞
take an umbrella with you|随身带把伞
You'd better take an umbrella with you|你最好随身带把伞`, `
the weather forecast|天气预报
according to the weather forecast|根据天气预报
According to the weather forecast, it will snow|根据天气预报，会下雪
According to the weather forecast, it will snow tonight|根据天气预报，今晚会下雪`, `
sunny|晴朗的
warm and sunny|温暖晴朗
It was warm and sunny|天气温暖晴朗
It was warm and sunny all week|整个星期都温暖晴朗`]);

  lesson("family", "家人", "👨‍👩‍👧", "介绍家庭成员和家里的事", [`
two children|两个孩子
has two children|有两个孩子
My sister has two children|我姐姐有两个孩子
My sister has two children, a boy and a girl|我姐姐有两个孩子，一男一女`, `
my grandparents|我的祖父母
visit my grandparents|看望祖父母
I visit my grandparents every weekend|我每个周末都去看望祖父母
I visit my grandparents in the countryside every weekend|我每个周末都去乡下看望祖父母`, `
dinner|晚饭
cook dinner|做晚饭
cook dinner for the family|给全家人做晚饭
My father usually cooks dinner for the family|我爸爸通常给全家人做晚饭`, `
the same age|同龄
are the same age|同岁
My cousin and I are the same age|我和表哥同岁`]);

  lesson("study", "学习", "🎓", "背单词、考试、不怕犯错", [`
new words|新单词
remember new words|记住新单词
the best way to remember new words|记新单词的最好方法
What is the best way to remember new words?|记新单词最好的方法是什么？`, `
the exam|考试
passed the exam|通过了考试
finally passed the exam|终于通过了考试
She finally passed the exam after months of hard work|经过几个月的努力，她终于通过了考试`, `
mistakes|错误
making mistakes|犯错
be afraid of making mistakes|害怕犯错
Don't be afraid of making mistakes when you speak|说英语的时候不要害怕犯错`, `
an English club|一个英语俱乐部
joined an English club|加入了一个英语俱乐部
I joined an English club to practice speaking|我加入了一个英语俱乐部来练习口语`]);

  lesson("hobbies", "爱好与运动", "⚽", "打球、弹琴、拍照、跑步", [`
basketball|篮球
play basketball|打篮球
play basketball with friends|和朋友打篮球
We play basketball with friends every Saturday|我们每周六和朋友打篮球`, `
the guitar|吉他
play the guitar|弹吉他
learning to play the guitar|学弹吉他
I have been learning to play the guitar for a year|我学弹吉他已经一年了`, `
photos|照片
take photos|拍照
take photos of the city|拍城市的照片
He loves to take photos of the city at night|他喜欢在晚上拍城市的照片`, `
a run|跑步
go for a run|去跑步
go for a run in the park|去公园跑步
Let's go for a run in the park this evening|我们今晚去公园跑步吧`]);

  lesson("requests", "请求与帮助", "🙏", "礼貌地请别人帮忙", [`
a favor|一个忙
do me a favor|帮我个忙
Could you do me a favor?|你能帮我个忙吗？`, `
the window|窗户
open the window|打开窗户
Would you mind opening the window?|你介意打开窗户吗？`, `
this box|这个箱子
carry this box|搬这个箱子
help me carry this box|帮我搬这个箱子
Can you help me carry this box upstairs?|你能帮我把这个箱子搬上楼吗？`, `
more slowly|慢一点
speak more slowly|说慢一点
Could you speak more slowly?|你能说慢一点吗？
Could you speak a little more slowly, please?|请你说得稍微慢一点好吗？`]);

  lesson("advice", "给出建议", "💡", "should / had better / Why don't you", [`
a doctor|医生
see a doctor|看医生
You should see a doctor|你应该去看医生
You should see a doctor as soon as possible|你应该尽快去看医生`, `
a break|休息
take a break|休息一下
Why don't you take a break?|你为什么不休息一下呢？
Why don't you take a break and have some tea?|你何不休息一下，喝点茶？`, `
stay up late|熬夜
had better not stay up late|最好不要熬夜
You had better not stay up late|你最好不要熬夜
You had better not stay up late before the exam|考试前你最好不要熬夜`, `
more vegetables|更多的蔬菜
eat more vegetables|多吃蔬菜
try to eat more vegetables|尽量多吃蔬菜
If I were you, I would try to eat more vegetables|如果我是你，我会尽量多吃蔬菜`]);

  lesson("experience", "人生经历", "🌏", "现在完成时：去过、做过、住了多久", [`
Paris|巴黎
been to Paris|去过巴黎
Have you ever been to Paris?|你去过巴黎吗？
Have you ever been to Paris in the spring?|你春天去过巴黎吗？`, `
sushi|寿司
tried sushi|吃过寿司
never tried sushi|从没吃过寿司
I have never tried sushi before|我以前从没吃过寿司`, `
this city|这座城市
lived in this city|住在这座城市
have lived in this city for ten years|在这座城市住了十年
They have lived in this city for ten years|他们在这座城市已经住了十年`, `
my keys|我的钥匙
lost my keys|把钥匙弄丢了
I have lost my keys again|我又把钥匙弄丢了
I think I have lost my keys again|我觉得我又把钥匙弄丢了`]);

  lesson("passive", "被动语态", "🏗️", "be + 过去分词：被……", [`
in 1990|在 1990 年
built in 1990|建于 1990 年
This bridge was built in 1990|这座桥建于 1990 年
This bridge was built in 1990 by a French company|这座桥是一家法国公司在 1990 年建造的`, `
in many countries|在很多国家
spoken in many countries|在很多国家被使用
English is spoken in many countries|很多国家都说英语
English is spoken as a first language in many countries|在很多国家，英语是第一语言`, `
my bike|我的自行车
my bike was stolen|我的自行车被偷了
My bike was stolen last night|我的自行车昨晚被偷了
My bike was stolen from outside the library last night|我的自行车昨晚在图书馆外面被偷了`, `
the meeting|会议
the meeting has been cancelled|会议被取消了
The meeting has been cancelled because of the rain|会议因为下雨被取消了`]);

  lesson("conditional", "如果……", "🔀", "if 条件句：真实条件和假设", [`
if it rains|如果下雨
if it rains tomorrow|如果明天下雨
If it rains tomorrow, we will stay at home|如果明天下雨，我们就待在家里
If it rains tomorrow, we will stay at home and watch a movie|如果明天下雨，我们就待在家里看电影`, `
more time|更多的时间
if I had more time|如果我有更多时间
If I had more time, I would learn to cook|如果我有更多时间，我会学做饭`, `
hurry up|快点
Hurry up, or you'll miss the bus|快点，不然你会错过公交车`, `
the lottery|彩票
won the lottery|中了彩票
if you won the lottery|如果你中了彩票
What would you do if you won the lottery?|如果你中了彩票，你会做什么？`]);

  lesson("questions", "疑问句", "❓", "what / where / how / why 开头的问句", [`
do|做
What do you do|你做什么
What do you usually do|你通常做什么
What do you usually do on weekends?|你周末通常做什么？`, `
live|住
did you live|你（以前）住
Where did you live|你以前住在哪里
Where did you live before you moved here?|你搬来这里之前住在哪里？`, `
get there|到那里
How did you get there|你是怎么到那里的
How did you get there so quickly?|你怎么这么快就到那里了？`, `
late|迟到的
Why were you late|你为什么迟到了
Why were you late for work this morning?|你今天早上上班为什么迟到了？`]);

  lesson("continuous", "进行时", "🏃", "be + doing：正在做、当时正在做", [`
dinner|晚饭
cooking dinner|做晚饭
My mom is cooking dinner|我妈妈正在做晚饭
My mom is cooking dinner in the kitchen|我妈妈正在厨房做晚饭`, `
a book|一本书
reading a book|读一本书
I am reading a book|我正在读一本书
I am reading a book about space|我正在读一本关于太空的书`, `
TV|电视
watching TV|看电视
We were watching TV|我们（当时）正在看电视
We were watching TV when you called|你打电话来的时候我们正在看电视`, `
hard|（雨）大
raining hard|雨下得很大
It is raining hard|雨下得很大
It is raining hard, so let's stay inside|雨下得很大，我们待在屋里吧`]);

  lesson("modals", "情态动词", "🔑", "can / must / have to / may", [`
swim|游泳
can swim|会游泳
My little brother can swim|我弟弟会游泳
My little brother can swim very well|我弟弟游泳游得很好`, `
a seat belt|安全带
wear a seat belt|系安全带
You must wear a seat belt|你必须系安全带
You must wear a seat belt in the car|在车里你必须系安全带`, `
get up early|早起
have to get up early|得早起
I have to get up early tomorrow|我明天得早起
I have to get up early tomorrow for my flight|我明天得早起赶飞机`, `
rain|下雨
may rain|可能会下雨
It may rain this afternoon|今天下午可能会下雨`]);

  // ---------- 以下是短语课程各单元的收尾课（在 phrases.js 里用单元的第 4 个参数关联） ----------

  lesson("greet", "打招呼", "👋", "见面寒暄、介绍朋友、问候家人", [`
friend|朋友
my friend|我的朋友
This is my friend|这是我的朋友
This is my friend Anna from Canada|这是我来自加拿大的朋友安娜`, `
see you|见到你
nice to see you|见到你很高兴
It's nice to see you again|很高兴再次见到你
It's so nice to see you again after all these years|这么多年后再见到你真好`, `
busy|忙的
busy with work|忙于工作
I have been busy with work|我一直忙于工作
I have been really busy with work lately|我最近工作一直很忙`, `
your family|你的家人
say hello to your family|向你的家人问好
Please say hello to your family for me|请替我向你的家人问好`]);

  lesson("aboutme", "自我介绍", "🙋", "工作、住处、爱好和学英语", [`
a teacher|一名老师
work as a teacher|当老师
I work as a teacher|我是一名老师
I work as a teacher at a local school|我在本地一所学校当老师`, `
Beijing|北京
in Beijing|在北京
live in Beijing|住在北京
I live in Beijing with my parents|我和父母一起住在北京`, `
reading|阅读
enjoy reading|喜欢阅读
I enjoy reading|我喜欢阅读
I enjoy reading in my free time|我空闲时喜欢阅读`, `
English|英语
learning English|学英语
I started learning English|我开始学英语了
I started learning English again last year|我去年重新开始学英语`]);

  lesson("cafe", "咖啡馆", "☕", "点饮品、提要求、找座位", [`
a latte|一杯拿铁
a large latte|一大杯拿铁
Can I have a large latte?|能给我一大杯拿铁吗？
Can I have a large latte with oat milk?|能给我一大杯加燕麦奶的拿铁吗？`, `
sugar|糖
less sugar|少糖
with less sugar|少放点糖
I'd like my coffee with less sugar|我的咖啡请少放点糖`, `
a seat|一个座位
find a seat|找个座位
Let's find a seat|我们找个座位吧
Let's find a seat by the window|我们找个靠窗的座位吧`, `
this cafe|这家咖啡馆
come to this cafe|来这家咖啡馆
We often come to this cafe|我们经常来这家咖啡馆
We often come to this cafe on Sunday afternoons|我们经常周日下午来这家咖啡馆`]);

  lesson("phone", "打电话", "📞", "留言、回电、预约、信号不好", [`
a message|一条留言
leave a message|留言
Can I leave a message for him?|我能给他留个言吗？`, `
call me back|给我回电话
ask her to call me back|让她给我回电话
Could you ask her to call me back?|你能让她给我回个电话吗？
Could you ask her to call me back this afternoon?|你能让她今天下午给我回个电话吗？`, `
an appointment|一个预约
make an appointment|预约
I'd like to make an appointment|我想预约
I'd like to make an appointment with the dentist|我想预约看牙医`, `
hear you|听到你说话
I can't hear you|我听不到你说话
I can't hear you very well|我听不太清你说话
Sorry, I can't hear you very well|抱歉，我听不太清你说话`]);

  lesson("home", "租房居家", "🏠", "找房子、报修、交房租、邻居", [`
an apartment|一套公寓
a small apartment|一套小公寓
looking for a small apartment|在找一套小公寓
We are looking for a small apartment|我们在找一套小公寓
We are looking for a small apartment near the subway|我们在找一套地铁附近的小公寓`, `
the kitchen sink|厨房的水槽
The kitchen sink has been leaking|厨房的水槽一直在漏水
The kitchen sink has been leaking since Monday|厨房的水槽从周一起一直在漏水`, `
the rent|房租
pay the rent|交房租
We pay the rent|我们交房租
We pay the rent on the first day of every month|我们每个月第一天交房租`, `
neighbors|邻居
Our new neighbors|我们的新邻居
Our new neighbors are very friendly|我们的新邻居非常友好
Our new neighbors are very friendly and helpful|我们的新邻居非常友好，也很热心`]);

  lesson("errands", "办事跑腿", "🏦", "取钱、寄快递、理发、修手机", [`
some cash|一些现金
withdraw some cash|取一些现金
I need to withdraw some cash|我需要取些现金
I need to withdraw some cash from the ATM|我需要从取款机取些现金`, `
this package|这个包裹
send this package|寄这个包裹
I'd like to send this package|我想寄这个包裹
I'd like to send this package to Shanghai|我想把这个包裹寄到上海`, `
a haircut|理发
get a haircut|理个发
I'm going to get a haircut|我要去理个发
I'm going to get a haircut this weekend|我这周末要去理个发`, `
my phone|我的手机
fix my phone|修我的手机
How long will it take to fix my phone?|修我的手机要多长时间？`]);

  lesson("online", "网购与手机", "📱", "网购、退款、发照片", [`
clothes|衣服
buy clothes|买衣服
buy clothes online|在网上买衣服
I usually buy clothes online|我通常在网上买衣服`, `
the package|这个包裹
The package arrived|包裹到了
The package arrived two days late|包裹晚到了两天`, `
a refund|退款
ask for a refund|申请退款
I want to ask for a refund|我想申请退款
I want to ask for a refund because it is broken|东西坏了，我想申请退款`, `
the photos|那些照片
send me the photos|把照片发给我
Please send me the photos|请把照片发给我
Please send me the photos we took yesterday|请把我们昨天拍的照片发给我`]);

  lesson("hotel", "酒店", "🏨", "订房、报修、早餐、寄存行李", [`
a room|一个房间
book a room|订一个房间
I'd like to book a room|我想订一个房间
I'd like to book a double room for two nights|我想订一间大床房，住两晚`, `
the air conditioner|空调
The air conditioner in my room|我房间里的空调
The air conditioner in my room doesn't work|我房间里的空调坏了`, `
breakfast|早餐
Is breakfast included|包含早餐吗
Is breakfast included in the price?|价格里包含早餐吗？`, `
my luggage|我的行李
leave my luggage|寄存我的行李
Can I leave my luggage here|我能把行李寄存在这里吗
Can I leave my luggage here after checkout?|退房后我能把行李寄存在这里吗？`]);

  lesson("sights", "旅行观光", "🗺️", "拍照、参观、买票、看风景", [`
a picture|一张照片
take a picture|拍张照片
take a picture of us|给我们拍张照
Could you take a picture of us in front of the tower?|能帮我们在塔前拍张照吗？`, `
the museum|博物馆
visit the museum|参观博物馆
We plan to visit the museum|我们打算参观博物馆
We plan to visit the museum tomorrow morning|我们打算明天上午参观博物馆`, `
two tickets|两张票
buy two tickets|买两张票
buy two tickets for the boat tour|买两张游船观光的票
We want to buy two tickets for the boat tour|我们想买两张游船观光的票`, `
the view|景色
The view is beautiful|景色很美
The view from the top of the mountain is beautiful|从山顶看到的景色很美`]);

  lesson("party", "节日聚会", "🎉", "生日派对、送礼、道谢、祝福", [`
a birthday party|一个生日派对
having a birthday party|开生日派对
We're having a birthday party for Tom|我们要给汤姆开生日派对
We're having a birthday party for Tom on Saturday|我们周六要给汤姆开生日派对`, `
a small gift|一份小礼物
bought her a small gift|给她买了一份小礼物
I bought her a small gift|我给她买了一份小礼物`, `
coming|到来
Thank you for coming|谢谢你能来
Thank you for coming to my party|谢谢你来参加我的派对`, `
a happy new year|新年快乐
wish you a happy new year|祝你新年快乐
We wish you a happy new year|我们祝你新年快乐`]);

  lesson("emergency", "紧急情况", "🚨", "被偷、叫救护车、丢东西、找医院", [`
my wallet|我的钱包
stole my wallet|偷了我的钱包
Someone stole my wallet|有人偷了我的钱包
Someone stole my wallet on the bus|有人在公交车上偷了我的钱包`, `
an ambulance|一辆救护车
call an ambulance|叫救护车
Please call an ambulance|请叫救护车
Please call an ambulance right now|请马上叫救护车`, `
my bag|我的包
left my bag|把包落下了
I left my bag in the taxi|我把包落在出租车上了`, `
the nearest hospital|最近的医院
where the nearest hospital is|最近的医院在哪里
Can you tell me where the nearest hospital is?|你能告诉我最近的医院在哪里吗？`]);
})();
