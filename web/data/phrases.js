// 短语课程：按生活场景组成学习路径，每单元 4 课，每课 8 个常用短语/句子，单元最后是一课「连词成句」
// 每行「英文|中文」，可以再加一段「|用法提示」
// unit(id, 标题, 图标, 连词成句课 id, 课程)：单元进度按 id 记录，调整单元顺序不影响已有进度；课只能往后追加
(function () {
  const parse = (text) => text.trim().split("\n").map((l) => l.split("|").map((s) => s.trim()));
  const U = (window.PHRASE_UNITS = []);
  const unit = (id, title, icon, builder, lessons) =>
    U.push({ id, title, icon, builder, lessons: Object.entries(lessons).map(([t, p]) => ({ title: t, phrases: parse(p) })) });

  unit("hello", "打招呼", "👋", "greet", {
    "见面问候": `
Hello!|你好！
Good morning!|早上好！
How are you?|你好吗？
I'm fine, thank you.|我很好，谢谢。
Nice to meet you.|很高兴认识你。
Long time no see!|好久不见！
How's it going?|最近怎么样？
Not bad, and you?|还不错，你呢？`,
    "告别与礼貌": `
Goodbye!|再见！
See you later.|回头见。
Have a nice day!|祝你今天愉快！
Thank you very much.|非常感谢。
You're welcome.|不客气。
I'm sorry.|对不起。
No problem.|没问题。
Excuse me.|打扰一下。`,
    "寒暄近况": `
What's up?|最近怎么样？|朋友之间很随意的招呼，回答 Not much. 就行
Not much.|没什么特别的。
How have you been?|你最近过得怎么样？|适合问很久没见的人
I've been busy lately.|我最近挺忙的。
Same as usual.|老样子。
How was your day?|你今天过得怎么样？
Pretty good, thanks.|挺好的，谢谢。
Say hi to your family for me.|替我向你家人问好。`,
    "道谢与道歉": `
Thanks a lot.|多谢。
I really appreciate it.|我真的很感激。|appreciate 比 thank you 更郑重
That's very kind of you.|你真是太好了。
It's my pleasure.|不客气，这是我的荣幸。
I'm so sorry for being late.|非常抱歉我迟到了。
It's my fault.|是我的错。
That's all right.|没关系。
Never mind.|没关系，别在意。|用来回应别人的道歉，不能用来回应感谢`,
  });

  unit("me", "自我介绍", "🙋", "aboutme", {
    "关于我": `
My name is Lily.|我叫莉莉。
I'm from China.|我来自中国。
I live in Shanghai.|我住在上海。
I'm twenty-eight years old.|我二十八岁。
I work in an office.|我在办公室工作。
I'm a nurse.|我是一名护士。
I'm learning English.|我正在学英语。
I'm not married.|我还没结婚。`,
    "兴趣爱好": `
I like reading books.|我喜欢看书。
I love listening to music.|我爱听音乐。
I enjoy cooking.|我喜欢做饭。
I often go running.|我经常去跑步。
My favorite food is noodles.|我最喜欢的食物是面条。
What do you do for fun?|你平时玩些什么？
I don't like sports.|我不喜欢运动。
I'm good at drawing.|我擅长画画。`,
    "工作与学习": `
What do you do?|你是做什么工作的？|问职业最自然的说法
I'm a software engineer.|我是一名软件工程师。
I work for a small company.|我在一家小公司工作。
I've worked here for five years.|我在这里工作五年了。
I'm a college student.|我是一名大学生。
I majored in economics.|我大学学的是经济学。|major in 主修
I'm looking for a new job.|我正在找新工作。
I'm between jobs right now.|我目前在换工作。|委婉地说自己暂时没有工作`,
    "性格与梦想": `
I'm a bit shy.|我有点害羞。
I'm easy-going.|我很随和。
I'm an early bird.|我是个早起的人。
I'm a night owl.|我是个夜猫子。
I want to travel around the world.|我想环游世界。
My dream is to open a bookstore.|我的梦想是开一家书店。
I'm trying to be healthier.|我在努力让自己更健康。
That's a bit about me.|这就是我的一些情况。|自我介绍结尾常用`,
  });

  unit("daily", "日常生活", "☀️", "daily", {
    "早晨出门": `
I overslept this morning.|我今天早上睡过头了。
I need to brush my teeth.|我得去刷牙。
What's for breakfast?|早饭吃什么？
I'm leaving now.|我现在出门了。
Don't forget your keys.|别忘了带钥匙。
I'm stuck in traffic.|我堵在路上了。
I'll be home around seven.|我七点左右到家。
Have a good day at work!|上班顺利！`,
    "做家务": `
It's your turn to do the dishes.|轮到你洗碗了。|do the dishes 洗碗
I'll take out the trash.|我去倒垃圾。
Can you help me hang up the clothes?|你能帮我晾衣服吗？
I need to do the laundry.|我得洗衣服了。
The floor needs mopping.|地板该拖了。
Let's clean up the living room.|我们把客厅收拾一下吧。
Could you water the plants?|你能给植物浇浇水吗？
The fridge is empty.|冰箱空了。`,
    "晚上与睡前": `
What's for dinner?|晚饭吃什么？
Dinner is ready!|晚饭好了！
Let's order takeout tonight.|今晚我们点外卖吧。
I'm going to take a shower.|我去洗个澡。
What's on TV tonight?|今晚电视上有什么节目？
I'm exhausted.|我累坏了。
I'm going to bed.|我去睡了。
Good night, sleep well.|晚安，睡个好觉。`,
    "周末安排": `
Any plans for the weekend?|周末有什么安排吗？
I'm going to sleep in.|我打算睡个懒觉。|sleep in 睡懒觉
I'll just stay home and relax.|我就待在家里放松一下。
Let's go grocery shopping.|我们去买菜吧。
I need to run some errands.|我得出去办点事。|run errands 办杂事、跑腿
We're having friends over.|我们要请朋友来家里。|have sb. over 请某人来家里
Let's eat out tonight.|今晚我们出去吃吧。
The weekend went by so fast.|周末过得真快。`,
  });

  unit("family", "家人朋友", "👨‍👩‍👧", "family", {
    "介绍家人": `
This is my wife.|这是我妻子。
There are three people in my family.|我家有三口人。
I'm an only child.|我是独生子女。
I have an older brother.|我有一个哥哥。|英语一般不区分哥哥弟弟，需要时说 older / younger
My parents are retired.|我父母退休了。
We have a son and a daughter.|我们有一儿一女。
She takes after her mother.|她长得像她妈妈。|take after 像（长辈）
We're very close.|我们关系很亲密。`,
    "家庭琐事": `
Mom, I'm home!|妈，我回来了！
Can you pick up the kids today?|你今天能去接孩子吗？|pick up 接人
It's time for bed.|该睡觉了。
Turn off the TV.|把电视关掉。
Did you finish your homework?|你作业写完了吗？
Call me when you get there.|到了给我打个电话。
I miss you guys.|我想你们了。
Let's have dinner together.|我们一起吃晚饭吧。`,
    "朋友之间": `
We've known each other for years.|我们认识很多年了。
He's my best friend.|他是我最好的朋友。
We went to school together.|我们是同学。
I'll always be there for you.|我会一直在你身边支持你。
You can count on me.|你可以指望我。|count on 依靠、指望
Let's catch up soon.|我们找时间聚聚吧。|catch up 叙旧、聊聊近况
It was great seeing you.|见到你真好。
Thanks for being such a good friend.|谢谢你一直是这么好的朋友。`,
    "回家团聚": `
We're going home for the holidays.|我们要回家过节。
The whole family gets together.|全家人聚在一起。
Let's take a family photo.|我们拍张全家福吧。
I'll book the train tickets early.|我会早点订火车票。
My grandma cooked a big dinner.|奶奶做了一大桌晚饭。
We stayed up late chatting.|我们聊到很晚。|stay up 熬夜、晚睡
It's so good to be home.|回家的感觉真好。
I can't wait to see you all.|我等不及要见到你们了。`,
  });

  unit("cafe", "咖啡馆", "☕", "cafe", {
    "点单": `
Can I have a coffee, please?|请给我一杯咖啡。
A cup of tea, please.|请来一杯茶。
Small, medium or large?|小杯、中杯还是大杯？
A large one, please.|请给我大杯的。
With milk and sugar.|加奶加糖。
For here or to go?|在这里喝还是带走？
To go, please.|带走，谢谢。
How much is it?|多少钱？`,
    "小吃与付款": `
I'd like a sandwich.|我想要一个三明治。
Do you have any cake?|你们有蛋糕吗？
Is this seat taken?|这个座位有人吗？
Do you have Wi-Fi?|你们有无线网吗？
What's the password?|密码是多少？
Can I pay by card?|可以刷卡吗？
Keep the change.|不用找了。
This coffee is delicious.|这咖啡真好喝。`,
    "定制口味": `
An iced latte, please.|请来一杯冰拿铁。
Less sugar, please.|请少放点糖。
Can I get oat milk instead?|能换成燕麦奶吗？
Could I get an extra shot?|能加一份浓缩吗？|shot 指一份浓缩咖啡
Decaf, please.|请给我低咖啡因的。
Not too hot, please.|别太烫，谢谢。
Could I get a lid?|能给我一个杯盖吗？
Can I have a straw?|能给我一根吸管吗？`,
    "等单与小插曲": `
Is my order ready?|我点的好了吗？
I think this is someone else's drink.|我觉得这是别人的饮品。
I ordered a cappuccino, not a latte.|我点的是卡布奇诺，不是拿铁。
Could I get a napkin?|能给我一张纸巾吗？
Where is the restroom?|洗手间在哪里？|美式英语说 restroom，英式常说 toilet
Can I charge my phone here?|我能在这里给手机充电吗？
Are you open on Sundays?|你们周日营业吗？
What time do you close?|你们几点关门？`,
  });

  unit("restaurant", "餐厅", "🍽️", "restaurant", {
    "入座点菜": `
A table for two, please.|请给我们一张两人桌。
Can I see the menu?|我能看看菜单吗？
What do you recommend?|你推荐什么？
I'll have the steak.|我要牛排。
Medium, please.|五分熟，谢谢。
I'm allergic to nuts.|我对坚果过敏。
No ice, please.|请不要加冰。
I'm a vegetarian.|我吃素。`,
    "用餐结账": `
It tastes great.|味道很好。
Could I have some water?|能给我一些水吗？
This isn't what I ordered.|这不是我点的。
Can we have the bill?|请给我们结账。
Let's split the bill.|我们 AA 吧。
It's my treat.|我请客。
Can I take this home?|这个我能打包吗？
Everything was perfect.|一切都很完美。`,
    "订位等位": `
I'd like to book a table for tonight.|我想订今晚的位子。
For how many people?|请问几位？
There are four of us.|我们四个人。
Do you have a table by the window?|有靠窗的位子吗？
How long is the wait?|要等多久？
We'll wait.|我们等一下。
Can we sit outside?|我们能坐外面吗？
I have a reservation under Wang.|我用王这个姓订了位。|under + 名字：以某人的名义预订`,
    "用餐小问题": `
Excuse me, could you come here?|打扰一下，能过来一下吗？|叫服务员时这样说比喊 Waiter 更礼貌
My food is cold.|我的菜是凉的。
We've been waiting for a long time.|我们已经等了很久了。
Could we have some more napkins?|能再给我们一些餐巾纸吗？
Can I have a fork, please?|能给我一把叉子吗？
Is service included?|包含服务费吗？
Is it spicy?|这个辣吗？
Not too spicy, please.|请不要太辣。`,
  });

  unit("shopping", "购物", "🛍️", "shopping", {
    "逛街挑选": `
I'm just looking.|我只是看看。
How much is this?|这个多少钱？
Do you have this in blue?|这个有蓝色的吗？
Can I try it on?|我可以试穿吗？
It's too small.|太小了。
Do you have a bigger size?|有大一号的吗？
It looks great on you.|你穿着很好看。
I'll take it.|我买了。`,
    "付款退换": `
Is it on sale?|这个在打折吗？
Can you give me a discount?|能给我打个折吗？
That's too expensive.|太贵了。
Can I have a bag?|能给我一个袋子吗？
Where is the checkout?|收银台在哪里？
I'd like to return this.|我想退掉这个。
Can I exchange it?|可以换货吗？
Here is my receipt.|这是我的收据。`,
    "超市买菜": `
Where can I find the milk?|牛奶在哪里？
Which aisle is the rice in?|大米在哪一排货架？|aisle 超市里的货架通道
Is this fresh?|这个新鲜吗？
How much is it per kilo?|这个多少钱一公斤？
I'd like half a kilo of beef.|我要半公斤牛肉。
Do you have any eggs?|你们有鸡蛋吗？
Buy one, get one free.|买一送一。
I brought my own bag.|我自己带了袋子。`,
    "优惠与付款": `
Is there a discount for members?|会员有折扣吗？
It's twenty percent off.|打八折。|twenty percent off 是减 20%，也就是八折，别搞反
Can I use this coupon?|我能用这张优惠券吗？
Do you take credit cards?|你们收信用卡吗？
Can I pay with my phone?|可以用手机支付吗？
I think you gave me the wrong change.|我觉得你找错钱了。
Can I get a receipt?|能给我一张小票吗？
It's out of stock.|这个缺货了。`,
  });

  unit("directions", "问路出行", "🗺️", "places", {
    "问路": `
Excuse me, where is the station?|打扰一下，车站在哪里？
How do I get to the museum?|去博物馆怎么走？
Is it far from here?|离这里远吗？
Go straight ahead.|一直往前走。
Turn left at the corner.|在拐角处左转。
It's on your right.|在你的右边。
It's next to the bank.|在银行旁边。
I'm lost.|我迷路了。`,
    "交通": `
Where is the bus stop?|公交车站在哪里？
Which bus goes to the airport?|哪路公交去机场？
A ticket to London, please.|请给我一张去伦敦的票。
When does the next train leave?|下一班火车什么时候开？
Please take me to this address.|请带我去这个地址。
Stop here, please.|请在这里停车。
How long does it take?|要多长时间？
I'll take a taxi.|我打车去。`,
    "打车": `
Where can I get a taxi?|哪里可以打到车？
I'd like to go to the airport.|我想去机场。
How much will it cost?|大概要多少钱？
Could you turn on the air conditioning?|能开一下空调吗？
Please drive a little slower.|请开慢一点。
Can you drop me off here?|能让我在这里下车吗？|drop sb. off 让某人下车
I'm in a hurry.|我赶时间。
Could you open the trunk?|能打开后备箱吗？`,
    "地铁火车": `
Where is the nearest subway station?|最近的地铁站在哪里？
Which line should I take?|我应该坐几号线？
Where do I change trains?|我在哪里换乘？
How many stops is it?|要坐几站？
Is this the right platform?|是这个站台吗？
The next stop is Central Station.|下一站是中央车站。
I missed my stop.|我坐过站了。
A round-trip ticket, please.|请给我一张往返票。|单程票是 one-way ticket`,
  });

  unit("chat", "聊天交友", "💬", "weather", {
    "天气闲聊": `
It's a beautiful day.|今天天气真好。
It's so hot today.|今天好热啊。
It looks like rain.|看起来要下雨了。
What's the weather like?|天气怎么样？
I love this time of year.|我喜欢一年中的这个时候。
Did you have a good weekend?|你周末过得好吗？
What are you up to?|你在忙什么？
That sounds fun!|听起来很有趣！`,
    "邀约与感受": `
Would you like to grab a coffee?|要不要一起喝杯咖啡？
Let's hang out this weekend.|这周末我们出去玩吧。
I'd love to.|我很乐意。
Maybe next time.|下次吧。
I'm so happy for you!|真为你高兴！
That's too bad.|那太遗憾了。
Don't worry about it.|别担心。
Let's keep in touch.|保持联系哦。`,
    "赞美与回应": `
You look great today!|你今天气色真好！
I love your dress.|我很喜欢你的裙子。
Where did you get it?|你在哪儿买的？
You're a great cook.|你做饭真好吃。
Your English is really good.|你的英语真好。
Thank you, that's so nice of you.|谢谢，你真好。
I'm flattered.|过奖了。
You made my day!|你让我今天一整天都很开心！`,
    "表达观点": `
I think so too.|我也这么认为。
I don't think so.|我不这么认为。
In my opinion, it's too expensive.|在我看来，它太贵了。
You have a point.|你说得有道理。
I'm not sure about that.|这个我不太确定。
It depends.|看情况。
Exactly!|完全正确！
I see what you mean.|我明白你的意思。`,
  });

  unit("hobbies", "爱好运动", "⚽", "hobbies", {
    "运动健身": `
I go to the gym three times a week.|我每周去三次健身房。
I'm trying to lose weight.|我在努力减肥。
Let's go for a walk.|我们去散散步吧。
I'm out of shape.|我体能变差了。|out of shape 身材走样、体能差
Do you want to play badminton?|你想打羽毛球吗？
I pulled a muscle.|我拉伤了肌肉。
I'm sore all over.|我浑身酸痛。
Stretch before you run.|跑步前要拉伸。`,
    "音乐电影": `
What kind of music do you like?|你喜欢什么类型的音乐？
I'm a big fan of jazz.|我是爵士乐的忠实粉丝。
Have you seen the new movie?|你看了那部新电影吗？
It's worth watching.|它值得一看。|be worth doing 值得做
The ending was a surprise.|结局出乎意料。
No spoilers, please!|请不要剧透！
Let's get movie tickets.|我们去买电影票吧。
I can't stop listening to this song.|这首歌我单曲循环停不下来。`,
    "读书与游戏": `
I'm reading a great book right now.|我正在读一本很棒的书。
I couldn't put it down.|我读得爱不释手。|put down 放下
Who's your favorite writer?|你最喜欢的作家是谁？
Do you play video games?|你玩电子游戏吗？
I'm addicted to this game.|我玩这个游戏上瘾了。
Let's play cards.|我们打牌吧。
It's your turn.|轮到你了。
I won!|我赢了！`,
    "聊爱好": `
What do you do in your free time?|你空闲时间做什么？
How did you get into photography?|你是怎么喜欢上摄影的？|get into 开始对……感兴趣
I've been into cooking lately.|我最近迷上了做饭。|be into 很喜欢、迷上
I'd like to learn to swim.|我想学游泳。
It helps me relax.|它能帮我放松。
I'm not very good at it yet.|我还不太擅长。
Practice makes perfect.|熟能生巧。
You should give it a try.|你应该试一试。`,
  });

  unit("feelings", "情绪感受", "😊", "feelings", {
    "开心兴奋": `
I'm so excited!|我太激动了！
This is the best day ever!|这是有史以来最棒的一天！
I can't believe it!|我简直不敢相信！
I'm in a good mood today.|我今天心情很好。
That's great news!|真是好消息！
I'm really proud of you.|我真为你骄傲。
I'm looking forward to it.|我很期待。|look forward to 后面接名词或动名词
Congratulations!|恭喜！`,
    "难过失望": `
I'm feeling a bit down.|我有点情绪低落。|down 这里是「沮丧的」
I'm so disappointed.|我太失望了。
I had a bad day.|我今天过得很糟。
I miss home.|我想家了。
I feel lonely sometimes.|我有时会觉得孤单。
It's not fair.|这不公平。
I'm tired of waiting.|我等烦了。|be tired of 厌倦
What a pity!|真可惜！`,
    "生气抱怨": `
I'm so annoyed.|我好烦。
That's so rude!|太没礼貌了！
I've had enough!|我受够了！
Calm down.|冷静一下。
It drives me crazy.|这让我抓狂。
Why didn't you tell me?|你为什么不告诉我？
Please stop doing that.|请别再那样做了。
Let's talk about it later.|我们晚点再谈这件事。`,
    "安慰鼓励": `
Don't give up.|别放弃。
Everything will be okay.|一切都会好起来的。
It's not your fault.|这不是你的错。
I'm here for you.|我在这儿陪着你。
Cheer up!|振作起来！
You can do it!|你能行的！
Take your time.|慢慢来，不着急。
I know how you feel.|我理解你的感受。`,
  });

  unit("requests", "请求帮助", "🙏", "requests", {
    "礼貌请求": `
Could you do me a favor?|能帮我个忙吗？
Would you mind helping me?|你介意帮我一下吗？|回答 No, not at all. 表示「不介意」
Can I borrow your pen?|我能借一下你的笔吗？
Could you pass me the salt?|能把盐递给我吗？
Could you keep an eye on my bag?|能帮我看一下包吗？|keep an eye on 照看
Do you mind if I sit here?|你介意我坐这里吗？
Could you hold the door, please?|能帮我扶一下门吗？
May I use your phone?|我能用一下你的手机吗？`,
    "答应与拒绝": `
Sure, no problem.|当然，没问题。
Of course.|当然可以。
Not at all.|一点也不介意。
I'd be happy to help.|我很乐意帮忙。
Sorry, I can't right now.|抱歉，我现在不行。
I'm afraid I'm busy.|恐怕我没空。|I'm afraid 用来委婉地说不好的消息
Let me think about it.|让我考虑一下。
Maybe another time.|改天吧。`,
    "主动帮忙": `
Can I help you?|需要帮忙吗？
Let me help you with that.|我来帮你吧。
Do you need a hand?|需要搭把手吗？|a hand 口语里指帮助
Let me carry it for you.|我来帮你拿。
Here, take my umbrella.|给，拿我的伞吧。
Is there anything I can do?|有什么我能做的吗？
Just let me know.|跟我说一声就行。
Don't mention it.|不用谢。`,
    "没听清楚": `
Pardon?|请再说一遍？
Sorry, I didn't catch that.|抱歉，我没听清。|catch 这里是「听清」
Could you speak more slowly?|你能说慢一点吗？
What do you mean?|你是什么意思？
Do you mean tomorrow?|你是说明天吗？
Let me make sure I understand.|我确认一下我理解得对不对。
Could you explain that again?|你能再解释一遍吗？
Got it, thanks.|明白了，谢谢。`,
  });

  unit("phone", "打电话", "📞", "phone", {
    "接打电话": `
Hello, this is Tom speaking.|你好，我是汤姆。
May I speak to Mr. Smith?|我能和史密斯先生通话吗？
Who's calling, please?|请问您是哪位？
Hold on, please.|请稍等。
He's not in right now.|他现在不在。
Can I take a message?|要我帮您留言吗？
I'll call you back.|我会给你回电话。
Sorry, wrong number.|抱歉，打错了。`,
    "预约安排": `
I'd like to make an appointment.|我想预约一下。
Are you free tomorrow?|你明天有空吗？
How about three o'clock?|三点怎么样？
That works for me.|这个时间我可以。
Can we change the time?|我们能改个时间吗？
I'm afraid I can't make it.|恐怕我去不了了。
See you on Monday.|周一见。
The line is busy.|电话占线。`,
    "信号不好": `
I can't hear you very well.|我听不太清你说话。
You're breaking up.|你的声音断断续续的。|电话信号差时常说
The signal is bad here.|这里信号不好。
My phone is about to die.|我手机快没电了。|die 口语里指手机没电
Can you speak up a little?|你能大声一点吗？
Let me call you back in five minutes.|我五分钟后给你回电话。
Sorry, I was on another call.|抱歉，我刚才在接另一个电话。
Sorry, the line went dead.|抱歉，电话突然断了。`,
    "留言回电": `
Could you ask him to call me back?|能让他给我回个电话吗？
Can I leave a message?|我能留个言吗？
Could you spell your name, please?|你能拼一下你的名字吗？
What's the best number to reach you?|打哪个号码最容易找到你？|reach 这里是「联系上」
I'll let him know you called.|我会告诉他你来过电话。
Please leave a message after the beep.|请在提示音后留言。
Thanks for calling.|感谢来电。
Talk to you soon.|回头再聊。`,
  });

  unit("home", "租房居家", "🏠", "home", {
    "看房租房": `
I'm looking for an apartment.|我在找公寓。
How much is the rent?|房租多少钱？
Are utilities included?|包含水电费吗？|utilities 水、电、燃气等公共事业费
Is it furnished?|带家具吗？
How big is the apartment?|公寓有多大？
Can I see the bedroom?|我能看看卧室吗？
Are pets allowed?|可以养宠物吗？
When can I move in?|我什么时候可以入住？`,
    "报修与房东": `
The sink is leaking.|水槽漏水了。
The heater is broken.|暖气坏了。
The toilet is blocked.|马桶堵了。
The light doesn't turn on.|灯打不开。
When can you fix it?|你什么时候能修好？
Can you send someone over?|你能派个人过来吗？
The rent is due on the first.|房租每月一号交。|due 到期的
I'd like to renew the lease.|我想续租。|lease 租约`,
    "邻居": `
Hi, I just moved in next door.|你好，我刚搬到隔壁。
Welcome to the neighborhood!|欢迎来到这个社区！
Could you keep it down, please?|能小声一点吗？|keep it down 降低音量
Sorry about the noise.|抱歉，太吵了。
Your package was delivered to my place.|你的包裹送到我家来了。
Could you feed my cat while I'm away?|我不在的时候你能帮我喂猫吗？
Let me know if you need anything.|有什么需要跟我说。
We have great neighbors.|我们的邻居很好。`,
    "搬家": `
We're moving next week.|我们下周搬家。
I need to pack my things.|我得打包收拾东西。
Can you help me move?|你能帮我搬家吗？
Be careful, it's fragile.|小心，这个易碎。
Put the boxes in the bedroom.|把箱子放在卧室。
I'm still unpacking.|我还在拆箱整理。
The new place is much bigger.|新家大多了。
Come over for a housewarming party.|来参加我的乔迁派对吧。`,
  });

  unit("errands", "办事跑腿", "🏦", "errands", {
    "银行": `
I'd like to open an account.|我想开个户。
I'd like to withdraw some cash.|我想取点现金。
I'd like to deposit some money.|我想存点钱。
Can I transfer money online?|我能在网上转账吗？
The ATM ate my card.|取款机把我的卡吞了。
I lost my bank card.|我的银行卡丢了。
What's the exchange rate today?|今天的汇率是多少？
Please enter your PIN.|请输入密码。|PIN 是银行卡密码`,
    "快递邮局": `
I'd like to send this package to Beijing.|我想把这个包裹寄到北京。
How long will it take to arrive?|多久能到？
How much is the postage?|邮费多少钱？
Can I track my package?|我能查一下包裹的物流吗？|track 追踪
My package hasn't arrived yet.|我的包裹还没到。
Please sign here.|请在这里签字。
Can you leave it at the front door?|能放在门口吗？
I'd like to buy some stamps.|我想买些邮票。`,
    "理发": `
I'd like a haircut.|我想理发。
Just a trim, please.|修一修就行。|trim 修剪
Not too short, please.|别剪太短。
Can you make it shorter on the sides?|两边能剪短一点吗？
I'd like to dye my hair brown.|我想把头发染成棕色。
How much is a haircut?|理发多少钱？
Do I need an appointment?|需要预约吗？
I love it, thank you!|我很喜欢，谢谢！`,
    "修东西": `
My phone screen is cracked.|我的手机屏幕裂了。
Can you fix it?|你能修吗？
How long will the repair take?|修理需要多久？
Is it still under warranty?|还在保修期内吗？|warranty 保修
My laptop won't turn on.|我的笔记本电脑开不了机。
It keeps making a strange noise.|它一直发出奇怪的声音。|keep doing 一直做某事
Is it worth fixing?|还值得修吗？
I'll pick it up tomorrow.|我明天来取。`,
  });

  unit("online", "网购与手机", "📱", "online", {
    "网购": `
I bought it online.|我是在网上买的。
It's cheaper online.|网上更便宜。
Did you read the reviews?|你看过评价了吗？
I added it to my cart.|我把它加进购物车了。
Is shipping free?|包邮吗？
When will it be delivered?|什么时候送到？
It arrived today.|今天到了。
It looks different from the picture.|它和图片上看起来不一样。`,
    "售后退货": `
The item arrived damaged.|收到的东西是坏的。
I received the wrong size.|我收到的尺码不对。
I'd like a refund.|我想退款。
How do I return it?|我怎么退货？
Can I get a replacement?|能给我换一个新的吗？
I've been waiting for two weeks.|我已经等了两个星期了。
I'd like to speak to customer service.|我想联系客服。
The refund has been processed.|退款已经处理了。`,
    "手机与网络": `
My phone is dead.|我手机没电了。
Can I borrow your charger?|能借你的充电器用一下吗？
What's the Wi-Fi password?|无线网密码是多少？
The internet is so slow.|网速太慢了。
I forgot my password.|我忘记密码了。
Try restarting it.|试试重启一下。
Did you get my message?|你收到我的消息了吗？
I'll text you later.|我晚点给你发消息。|text 作动词：发短信、发消息`,
    "社交媒体": `
Let's add each other on WeChat.|我们加个微信吧。
I'll send you the link.|我把链接发给你。
I saw your post.|我看到你发的动态了。
Can you send me the photos?|你能把照片发给我吗？
That video went viral.|那个视频火了。|go viral 在网上迅速走红
I spend too much time on my phone.|我花太多时间在手机上了。
I'm taking a break from social media.|我暂时不上社交媒体了。
Are you on social media?|你用社交媒体吗？`,
  });

  unit("health", "看病", "🩺", "health", {
    "描述症状": `
I don't feel well.|我不舒服。
I have a headache.|我头疼。
I have a fever.|我发烧了。
My throat hurts.|我喉咙痛。
I have a stomachache.|我肚子疼。
I feel dizzy.|我头晕。
I've had a cough for three days.|我咳嗽三天了。
I think I have a cold.|我觉得我感冒了。`,
    "在医院药店": `
I need to see a doctor.|我需要看医生。
Where is the nearest pharmacy?|最近的药店在哪里？
Do I need a prescription?|需要处方吗？
How often should I take it?|这药多久吃一次？
Take it twice a day.|一天吃两次。
Get some rest.|多休息。
Drink plenty of water.|多喝水。
I hope you feel better soon.|希望你早日康复。`,
    "看医生": `
What seems to be the problem?|哪里不舒服？|医生常用的开场问句
It hurts here.|这里疼。
It started yesterday.|昨天开始的。
Is it serious?|严重吗？
I'm allergic to penicillin.|我对青霉素过敏。
Do I need an X-ray?|我需要拍 X 光吗？
Can I get a doctor's note?|能给我开张病假证明吗？
When should I come back?|我什么时候复诊？`,
    "关心与康复": `
You look pale.|你脸色不太好。
Are you feeling better?|你感觉好点了吗？
I'm much better now.|我现在好多了。
Take care of yourself.|照顾好自己。
Get well soon!|早日康复！
Don't push yourself too hard.|别太勉强自己。
I'm on the mend.|我在慢慢恢复。|口语，表示病情正在好转
You should see a doctor.|你应该去看医生。`,
  });

  unit("study", "学习", "🎓", "study", {
    "课堂用语": `
May I ask a question?|我可以问个问题吗？
I don't understand.|我不明白。
What does this word mean?|这个词是什么意思？
How do you spell it?|这个怎么拼？
How do you pronounce this word?|这个词怎么读？
Could you give me an example?|你能举个例子吗？
Can you write it down?|你能把它写下来吗？
Open your books to page ten.|把书翻到第十页。`,
    "学英语": `
I'm trying to improve my English.|我在努力提高英语。
I practice speaking every day.|我每天练习口语。
My vocabulary is limited.|我的词汇量有限。
Listening is the hardest part for me.|对我来说听力最难。
I watch movies with English subtitles.|我看带英文字幕的电影。
I'm afraid of making mistakes.|我害怕犯错。
Is this sentence correct?|这个句子对吗？
Could you correct my English?|你能帮我纠正一下英语吗？`,
    "考试": `
I have an exam tomorrow.|我明天有考试。
I stayed up all night studying.|我熬了一夜复习。|stay up 熬夜
I'm so nervous.|我好紧张。
I think I did well.|我觉得我考得不错。
I failed the test.|我考试没及格。
I passed!|我通过了！
Good luck on your exam!|考试加油！
I'll do better next time.|下次我会做得更好。`,
    "讨论与求助": `
Can we study together?|我们能一起学习吗？
Can I borrow your notes?|我能借你的笔记吗？
When is the homework due?|作业什么时候交？|due 到期的
I'm stuck on this question.|我被这道题卡住了。
Let me explain it to you.|我来给你讲讲。
Does that make sense?|这样说能理解吗？|讲解后确认对方是否听懂
Now I get it.|现在我明白了。
That's a good question.|这是个好问题。`,
  });

  unit("work", "职场", "💼", "work", {
    "日常办公": `
I have a meeting at ten.|我十点有个会。
Can we talk later?|我们晚点再聊可以吗？
I'll send you an email.|我会给你发邮件。
Let me check my schedule.|我查一下我的日程。
I'm working from home today.|我今天在家办公。
Could you help me with this?|你能帮我弄一下这个吗？
The deadline is Friday.|截止日期是周五。
Good job!|干得好！`,
    "请假与沟通": `
I'd like to take a day off.|我想请一天假。
I'm running late.|我要迟到了。
Sorry, I missed your call.|抱歉，没接到你的电话。
Let me get back to you.|我稍后回复你。
Could you say that again?|你能再说一遍吗？
I agree with you.|我同意你的看法。
I have a different idea.|我有不同的想法。
Thanks for your hard work.|辛苦了。`,
    "开会讨论": `
Let's get started.|我们开始吧。
Can everyone hear me?|大家都能听到我说话吗？|线上会议常用
Can you see my screen?|能看到我的屏幕吗？
Let's move on to the next topic.|我们进入下一个议题。
Does anyone have any questions?|大家有什么问题吗？
That's a good point.|说得有道理。
Let's wrap it up here.|今天就到这里吧。|wrap up 收尾、结束
I'll follow up on this.|这件事我来跟进。`,
    "面试求职": `
Tell me about yourself.|介绍一下你自己。
Why do you want this job?|你为什么想要这份工作？
What are your strengths?|你的优点是什么？
I'm a fast learner.|我学东西很快。
I work well in a team.|我擅长团队合作。
I have three years of experience.|我有三年的工作经验。
When can you start?|你什么时候能入职？
Thank you for your time.|感谢您抽出时间。`,
  });

  unit("hotel", "酒店", "🏨", "hotel", {
    "入住": `
I have a reservation.|我有预订。
I'd like to check in.|我想办理入住。
Here is my passport.|这是我的护照。
Is breakfast included?|含早餐吗？
What time is breakfast?|早餐几点？
What's my room number?|我的房间号是多少？
Where is the elevator?|电梯在哪里？
What time is checkout?|几点退房？`,
    "客房服务": `
The air conditioner doesn't work.|空调坏了。
Can I have an extra towel?|能再给我一条毛巾吗？
The room is too noisy.|房间太吵了。
Can I change rooms?|我能换个房间吗？
Could you wake me up at seven?|能七点叫醒我吗？
Can I leave my luggage here?|我能把行李放在这里吗？
I'd like to check out.|我要退房。
Can you call a taxi for me?|能帮我叫辆出租车吗？`,
    "预订咨询": `
Do you have any rooms available?|你们还有空房吗？
How much is it per night?|一晚多少钱？
I'd like a double room.|我想要一间大床房。|double room 一张双人床；twin room 两张单人床
For three nights.|住三晚。
Is there free Wi-Fi?|有免费无线网吗？
Is there parking?|有停车位吗？
Can I cancel for free?|可以免费取消吗？
Does the room have a view?|房间能看到风景吗？`,
    "退房与问题": `
There's no hot water.|没有热水。
The Wi-Fi isn't working.|无线网用不了。
I locked myself out.|我把自己锁在门外了。
I lost my room key.|我把房卡弄丢了。
Can I check out late?|我能晚点退房吗？
There's a mistake on my bill.|我的账单有错。
What's this charge for?|这笔费用是什么？
I really enjoyed my stay.|我在这里住得很愉快。`,
  });

  unit("airport", "机场", "✈️", "travel", {
    "值机安检": `
Where is the check-in counter?|值机柜台在哪里？
Window or aisle?|靠窗还是靠过道？
A window seat, please.|请给我靠窗的座位。
I have one bag to check.|我有一件行李要托运。
Can I take this on the plane?|这个能带上飞机吗？
Which gate is it?|在几号登机口？
My flight is delayed.|我的航班延误了。
When do we start boarding?|什么时候开始登机？`,
    "到达": `
Where is the baggage claim?|行李提取处在哪里？
My luggage is missing.|我的行李丢了。
I'm here on vacation.|我来这里度假。
I'm here on business.|我来这里出差。
I'll stay for a week.|我会待一周。
Where can I exchange money?|哪里可以换钱？
Is there a shuttle bus?|有机场大巴吗？
Welcome to New York!|欢迎来到纽约！`,
    "登机与飞行": `
May I see your boarding pass?|请出示您的登机牌。
Could you help me put this bag up?|能帮我把这个包放上去吗？
Please fasten your seat belt.|请系好安全带。
Chicken or beef?|鸡肉还是牛肉？|飞机餐常见的问法
Could I have a blanket?|能给我一条毯子吗？
Can I change seats?|我能换个座位吗？
I feel a little airsick.|我有点晕机。
When do we land?|我们什么时候降落？`,
    "转机与延误": `
I have a connecting flight.|我还要转机。
Where is the transfer desk?|中转柜台在哪里？
I missed my flight.|我误机了。
My flight was canceled.|我的航班取消了。
When is the next flight?|下一班航班是什么时候？
Can you put me on another flight?|能帮我改签到别的航班吗？
Will you pay for the hotel?|你们会支付酒店费用吗？
How long is the layover?|中转要停留多久？|layover 转机时的停留`,
  });

  unit("sights", "旅行观光", "🗺️", "sights", {
    "景点门票": `
Two adult tickets, please.|请给我两张成人票。
Is there a student discount?|学生有优惠吗？
What time does the museum open?|博物馆几点开门？
Where is the entrance?|入口在哪里？
Is there a map of the area?|有这一带的地图吗？
What's worth seeing here?|这里有什么值得看的？
How long does the tour take?|游览需要多长时间？
Is it free to get in?|是免费入场的吗？`,
    "拍照": `
Could you take a picture of us?|能帮我们拍张照吗？
Just press this button.|按这个按钮就行。
Can you get the tower in the background?|能把塔拍进背景里吗？
One more, please.|请再拍一张。
Say cheese!|笑一个！|拍照时让大家笑的说法
Can I take photos here?|这里可以拍照吗？
No flash, please.|请不要用闪光灯。
Let's take a selfie!|我们来自拍一张吧！`,
    "跟团游览": `
Where does the tour start?|旅游团从哪里出发？
What time should we meet back here?|我们几点回到这里集合？
Could you tell us about this building?|能给我们介绍一下这座建筑吗？
How old is this temple?|这座寺庙有多少年历史了？
Please stay together.|请大家不要走散。
We have thirty minutes of free time.|我们有三十分钟自由活动时间。
Is there a restroom nearby?|附近有洗手间吗？
The view is amazing!|风景太美了！`,
    "当地体验": `
I'm looking for a souvenir.|我在找纪念品。
Is this made locally?|这是本地制造的吗？
What's the local food here?|这里有什么当地特色菜？
Can you recommend a good place to eat?|你能推荐个吃饭的好地方吗？
Is it safe to walk around at night?|晚上在附近走走安全吗？
This is my first time here.|这是我第一次来这里。
I'd love to come back someday.|我很想哪天再回来。
We had a wonderful trip.|我们这趟旅行很棒。`,
  });

  unit("party", "节日聚会", "🎉", "party", {
    "生日": `
Happy birthday!|生日快乐！
Make a wish!|许个愿吧！
Blow out the candles!|吹蜡烛吧！
Let's cut the cake.|我们来切蛋糕吧。
This is for you.|这是给你的。
I hope you like it.|希望你喜欢。
You shouldn't have!|你太破费了！|收到礼物时说，意思是「你不必这么客气」
How old are you turning?|你满几岁了？`,
    "节日祝福": `
Happy New Year!|新年快乐！
Merry Christmas!|圣诞快乐！
Happy Spring Festival!|春节快乐！
Wishing you good health.|祝你身体健康。
All the best!|万事如意！
Happy holidays!|节日快乐！
Same to you!|你也一样！|回应别人的祝福
Enjoy the holiday!|假期愉快！`,
    "派对做客": `
Thanks for inviting me.|谢谢你邀请我。
Come on in!|快进来！
Make yourself at home.|别客气，就当在自己家。
Help yourself.|请随便吃。|招呼客人自己拿东西吃时说
Can I get you a drink?|要给你拿点喝的吗？
Cheers!|干杯！
This party is so much fun.|这个派对太好玩了。
I should get going.|我该走了。|告别时的委婉说法`,
    "婚礼与送礼": `
Congratulations on your wedding!|恭喜你们新婚！
You look beautiful.|你真美。
They make a lovely couple.|他们真是很般配的一对。
I wish you both a happy life together.|祝你们婚后生活幸福。
It's just a small gift.|只是一份小礼物。
You didn't have to bring anything.|你不用带东西来的。
What a thoughtful gift!|多么贴心的礼物！
Thanks for coming.|谢谢你们能来。`,
  });

  unit("emergency", "紧急情况", "🚨", "emergency", {
    "求助报警": `
Help!|救命！
Call the police!|快报警！
Call an ambulance!|快叫救护车！
It's an emergency.|这是紧急情况。
Fire!|着火了！
Someone stole my wallet.|有人偷了我的钱包。
I need help right away.|我马上需要帮助。
Is everyone okay?|大家都没事吧？`,
    "丢失物品": `
I lost my phone.|我的手机丢了。
I left my bag on the train.|我把包落在火车上了。|left 是 leave 的过去式，这里是「落下」
Where is the lost and found?|失物招领处在哪里？
It's a black backpack.|是一个黑色双肩包。
I'd like to report a theft.|我想报案，我的东西被偷了。
I need to freeze my credit card.|我需要冻结我的信用卡。
Has anyone handed in a wallet?|有人交来一个钱包吗？
I lost my passport.|我的护照丢了。`,
    "意外受伤": `
Are you hurt?|你受伤了吗？
I fell and hurt my knee.|我摔倒了，膝盖受伤了。
I cut my finger.|我切到手指了。
It's bleeding.|在流血。
I think my arm is broken.|我觉得我的胳膊骨折了。
Don't move.|别动。
Is there a first-aid kit?|有急救箱吗？
Where is the nearest hospital?|最近的医院在哪里？`,
    "迷路与求助": `
I can't find my hotel.|我找不到我的酒店了。
I don't know where I am.|我不知道自己在哪儿。
Could you show me on the map?|你能在地图上指给我看吗？
My child is missing.|我的孩子不见了。
I missed the last bus.|我错过了末班车。
My phone has no signal.|我的手机没信号。
Can I use your phone to make a call?|能借你的手机打个电话吗？
Does anyone here speak Chinese?|这里有人会说中文吗？`,
  });

})();
