// 连词成句的句子成分解析（对每句话的完整句标注；中间步骤按单词对应到完整句）
// 一行一句：成分组用 | 分隔，每组「成分代码(说明): 单词=中文/词性 ...」，说明可省略
// 成分代码：S 主语 · V 谓语 · O 宾语 · P 表语 · A 状语 · C 补语 · T 定语 · J 连接词 · X 礼貌用语等
// 词性：代 名 动 形 副 介 冠 连 数 助(助动词) 情(情态动词) 限(限定词) 不(不定式符号)
window.BUILDER_NOTES_RAW = `
S: I=我/代 | V: drink=喝/动 | O: a=一/冠 cup=杯/名 of=…的/介 coffee=咖啡/名 | A(时间状语，表示频率): every=每个/限 morning=早上/名
S: I=我/代 | A(频度副词放在实义动词前面): usually=通常/副 | V(短语动词 get up 表示「起床」): get=起/动 up=来/副 | A: early=早/副 | A(时间状语): on=在/介 weekdays=工作日/名
S: She=她/代 | V(主语是第三人称单数，动词加 -s): takes=乘坐/动 | O: the=这/冠 bus=公交车/名 | A(表示目的地): to=去/介 work=上班/名 | A: every=每/限 day=天/名
S: I=我/代 | A: always=总是/副 | V: finish=完成/动 | O: my=我的/限 homework=作业/名 | A(时间状语): before=在…之前/介 dinner=晚饭/名
S: I=我/代 | V: like=喜欢/动 | O(动词不定式短语作宾语，表示喜欢做的事): to=(不定式标记)/不 eat=吃/动 apples=苹果/名 | A(程度状语): very=非常/副 much=很/副
S: He=他/代 | V(enjoy 后面接动名词 doing): enjoys=喜欢/动 | O(动名词短语作宾语): listening=听/动 to=…/介 music=音乐/名 | A(地点状语): in=在…里/介 the=这/冠 car=车/名
S: We=我们/代 | V: prefer=更喜欢/动 | O(不定式短语作宾语): to=(不定式标记)/不 watch=看/动 movies=电影/名 | A(地点状语): at=在/介 home=家/名
S: My=我的/限 mother=妈妈/名 | V(否定句：doesn't + 动词原形): doesn't=不/助 like=喜欢/动 | O: spicy=辣的/形 food=食物/名 | A(not … at all 表示「一点也不」): at=在/介 all=全部/代
S: The=这个/冠 meeting=会议/名 | V(按日程安排的将来，用一般现在时): starts=开始/动 | A: at=在/介 seven=七/数 o'clock=点钟/名 | A: tomorrow=明天/副
S: We=我们/代 | V(现在完成时：动作从过去持续到现在): have=已经/助 waited=等待/动 | O(wait for sb. 等某人): for=为/介 you=你/代 | A(for + 时间段，表示持续多久): for=持续/介 two=两个/数 hours=小时/名
S: They=他们/代 | A: often=经常/副 | V(go + doing 表示去做某项活动): go=去/动 hiking=徒步/动 | A: on=在/介 the=这个/冠 weekend=周末/名
S: I=我/代 | V(一般过去时): moved=搬/动 | A: here=到这里/副 | A(时间段 + ago 表示多久以前): three=三/数 years=年/名 ago=以前/副
S: Your=你的/限 keys=钥匙/名 | V(系动词；主语是复数用 are): are=在/动 | P(介词短语作表语，说明位置): on=在…上/介 the=这/冠 table=桌子/名 | T(介词短语作定语，修饰 table): in=在…里/介 the=这/冠 kitchen=厨房/名
V(情态动词提前，构成疑问句): Can=能/情 | S: you=你/代 | V: tell=告诉/动 | O(间接宾语): me=我/代 | O(直接宾语): the=这条/冠 way=路/名 | T(修饰 way): to=去/介 the=这个/冠 station=车站/名
S: My=我的/限 father=父亲/名 | V(短语动词 grow up 表示「长大」，grew 是过去式): grew=长/动 up=大/副 | A(地点状语): in=在/介 a=一个/冠 small=小的/形 town=镇/名 | T(修饰 town): by=在…旁边/介 the=这/冠 sea=海/名
J(There be 句型，表示「某处有某物」): There=(有)/副 | V: is=是/动 | S(there be 句型真正的主语): a=一家/冠 new=新的/形 cafe=咖啡馆/名 | A(地点状语): next=紧挨着/副 to=在…旁边/介 the=这个/冠 park=公园/名
S: I=我/代 | V(buy 的过去式): bought=买了/动 | O: a=一本/冠 book=书/名 | T(修饰 book): about=关于/介 history=历史/名 | A: yesterday=昨天/副
S: We=我们/代 | A: almost=差点/副 | V: missed=错过了/动 | O: the=这趟/冠 train=火车/名 | A: this=今天/限 morning=早上/名
S: She=她/代 | V(write 的过去式): wrote=写了/动 | O: a=一封/冠 letter=信/名 | A(write to sb. 写给某人): to=给/介 her=她的/限 grandmother=奶奶/名
S: He=他/代 | V(系动词): was=是/动 | P(形容词作表语): surprised=惊讶的/形 | A(when 引导时间状语从句): when=当…时/连 he=他/代 heard=听到/动 the=这个/冠 news=消息/名
S: We=我们/代 | V(be going to 表示打算、计划): are=(正)/助 going=打算/动 to=要/不 take=进行/动 | O: a=一次/冠 trip=旅行/名 | T: to=去/介 Japan=日本/名 | A: next=下个/形 month=月/名
S: I=我/代 | V(will + 动词原形，表示将来): will=将/情 call=打电话给/动 | O: you=你/代 | A: later=晚些时候/副 | A: tonight=今晚/副
S: I=我/代 | V(keep doing 表示「坚持做」): will=将/情 keep=坚持/动 | O(动名词短语作宾语): learning=学习/动 English=英语/名 | A: every=每/限 day=天/名
S: I=我/代 | V: think=认为/动 | O(宾语从句，省略了 that): it=(天气)/代 will=将/情 rain=下雨/动 tomorrow=明天/副
V(情态动词提前，构成疑问句): Can=可以/情 | S: I=我/代 | V(短语动词 try on 表示「试穿」): try=试/动 on=穿/副 | O: this=这件/限 jacket=夹克/名 | A: in=以/介 a=一个/冠 smaller=更小的/形 size=尺码/名
V: Can=可以/情 | S: I=我/代 | V: get=得到/动 | O: a=一个/冠 discount=折扣/名 | A(if 引导条件状语从句): if=如果/连 I=我/代 buy=买/动 two=两件/数
S(I'd = I would；I'd like 比 I want 更礼貌): I'd=我想/代 | V: like=想要/动 | O(不定式短语作宾语): to=(不定式标记)/不 pay=付款/动 | A(方式状语): in=用/介 cash=现金/名
X(祈使句，please 让语气更礼貌): Please=请/副 | V: keep=保留/动 | O: the=这张/冠 receipt=收据/名 | A(in case 引导从句，表示「以防」): in=以/介 case=防/名 you=你/代 need=需要/动 a=一笔/冠 refund=退款/名
S: We=我们/代 | V: need=需要/动 | O(不定式短语作宾语): to=(不定式标记)/不 finish=完成/动 the=这份/冠 report=报告/名 | A(by + 时间，表示「在…之前」): by=在…之前/介 Friday=周五/名
S: I=我/代 | V: have=有/动 | O: a=一个/冠 meeting=会议/名 | T: with=和/介 the=这位/冠 client=客户/名 | A: this=今天/限 afternoon=下午/名
S: I'd=我想/代 | V: like=想要/动 | O(take a day off 表示「请一天假」): to=(不定式标记)/不 take=请/动 a=一/冠 day=天/名 off=休假/副 | A: next=下/形 week=周/名
S(I'll = I will): I'll=我将/代 | V: send=发送/动 | O(间接宾语): you=你/代 | O(直接宾语): an=一封/冠 email=邮件/名 | T: with=带有/介 the=这些/冠 details=细节/名
S: I=我/代 | A: always=总是/副 | V(feel 在这里是系动词): feel=感到/动 | P: nervous=紧张的/形 | A: before=在…之前/介 exams=考试/名
V(感谢用语，省略了主语 I): Thank=感谢/动 | O: you=你/代 | A: so=非常/副 much=多/副 | A(thank sb. for sth. 为某事感谢某人): for=因为/介 your=你的/限 help=帮助/名
S: Small=小的/形 things=事情/名 | T(like this 表示「像这样的」，修饰 things): like=像/介 this=这/代 | V(make + 宾语 + 形容词，表示「使…怎么样」): make=使/动 | O: me=我/代 | C(形容词作宾语补足语): happy=开心/形
V(祈使句的否定：Don't + 动词原形): Don't=不要/助 worry=担心/动 | A: about=关于/介 it=这件事/代 | A: too=太/副 much=多/副
S: Your=你的/限 room=房间/名 | V: is=是/动 | P(much 修饰比较级，表示「…得多」): much=得多/副 bigger=更大的/形 | A(than 引出比较对象；mine = my room): than=比/连 mine=我的/代
S: This=这/代 | V: is=是/动 | P(the + 最高级): the=这/冠 best=最好的/形 restaurant=餐厅/名 | T: in=在…里/介 town=城里/名
S: He=他/代 | V: is=是/动 | A: now=现在/副 | P(as + 形容词原级 + as，表示「和…一样」): as=一样/副 tall=高的/形 as=和/连 his=他的/限 father=父亲/名
S(动名词短语作主语): Taking=乘坐/动 the=这/冠 subway=地铁/名 | V: is=是/动 | P: much=得多/副 faster=更快的/形 | A(比较对象): than=比/连 walking=走路/动
S: The=这个/冠 girl=女孩/名 | T(who 引导定语从句，修饰 girl): who=(她)/代 lives=住/动 next=隔壁/副 door=门/名 | V: is=是/动 | P: a=一名/冠 doctor=医生/名
X: Please=请/副 | V: call=打电话给/动 | O: me=我/代 | A(if 引导条件状语从句): if=如果/连 you=你/代 are=是/动 not=不/副 busy=忙的/形 | A: tonight=今晚/副
S: I=我/代 | V: don't=不/助 know=知道/动 | O(where 引导宾语从句，要用陈述语序): where=哪里/副 she=她/代 lives=住/动 now=现在/副
S: We=我们/代 | V: stayed=待/动 | A: at=在/介 home=家/名 | A(because 引导原因状语从句；过去进行时表示当时正在下雨): because=因为/连 it=(天气)/代 was=正在/助 raining=下雨/动
A: One=有一/数 day=天/名 | S: I=我/代 | V: want=想/动 | O(不定式短语作宾语): to=(不定式标记)/不 speak=说/动 English=英语/名 | A(方式状语): with=带着/介 confidence=自信/名
S: She=她/代 | V(现在进行时 be + doing): is=正在/助 saving=攒/动 | O: money=钱/名 | A(不定式作目的状语，表示「为了」): to=为了/不 travel=旅行/动 around=环绕/介 the=这个/冠 world=世界/名
A(if 条件从句用一般现在时，主句用将来时): If=如果/连 you=你/代 practice=练习/动 a=一/冠 little=点儿/名 every=每/限 day=天/名 | S: you=你/代 | V: will=会/情 improve=进步/动
S: The=这/冠 hardest=最难的/形 part=部分/名 | V: is=是/动 | A: always=总是/副 | P: the=这/冠 first=第一/数 step=步/名
S: I'd=我想/代 | V: like=想要/动 | O: a=一张/冠 table=桌子/名 | T(for two 表示「供两人用的」): for=供/介 two=两人/数 | T(by the window 表示「靠窗的」): by=在…旁边/介 the=这/冠 window=窗户/名
V(Could we …? 比 Can we …? 更礼貌): Could=能/情 | S: we=我们/代 | V: see=看/动 | O: the=这份/冠 dessert=甜点/名 menu=菜单/名 | X: please=请/副
S: I'll=我要/代 | V(点餐时常用 I'll have …): have=要/动 | O: the=这份/冠 steak=牛排/名 | T: with=配/介 a=一份/冠 green=蔬菜的/形 salad=沙拉/名 | X: please=请/副
V: Could=能/情 | S: you=你/代 | V: bring=带来/动 | O(间接宾语): us=我们/代 | O(直接宾语): the=这份/冠 bill=账单/名 | A(when 引导时间状语从句): when=当…时/连 you=你/代 have=有/动 a=一/冠 moment=片刻/名
S: I=我/代 | A: almost=差点/副 | V(forget 的过去式): forgot=忘了/动 | O: my=我的/限 passport=护照/名 | A: at=在/介 the=这家/冠 hotel=酒店/名
A(How long 用来问「多长时间」): How=多么/副 long=久/形 | V: does=(助动词)/助 | S(it 是形式主语): it=(这)/代 | V(It takes + 时间 + to do 表示「做某事花多长时间」): take=花费/动 | S(不定式短语是真正的主语): to=(不定式标记)/不 get=到达/动 to=去/介 the=这个/冠 airport=机场/名 | A(方式状语): by=乘坐/介 taxi=出租车/名
S: We=我们/代 | V: booked=预订了/动 | O: a=一个/冠 room=房间/名 | A(表示持续时间): for=为期/介 three=三/数 nights=晚/名 | A(地点状语): near=在…附近/介 the=这片/冠 beach=海滩/名
S: Our=我们的/限 flight=航班/名 | V(被动语态 was + 过去分词): was=被/助 delayed=延误/动 | A: for=持续/介 two=两个/数 hours=小时/名 | A(because of + 名词，表示原因): because=因为/连 of=…/介 the=这场/冠 storm=暴风雨/名
S: I=我/代 | V(现在完成时 have had，表示从过去一直持续到现在): have=已经/助 had=有/动 | O: a=一次/冠 terrible=可怕的/形 headache=头痛/名 | A(since + 过去的时间点): since=自从/介 last=上一个/形 night=晚上/名
S: You=你/代 | V(should 表示建议): should=应该/情 drink=喝/动 | O: more=更多的/形 water=水/名 | J: and=和/连 | V: get=得到/动 | O: some=一些/限 rest=休息/名
X: Please=请/副 | V: take=服用/动 | O: this=这种/限 medicine=药/名 | A(表示频率): twice=两次/副 a=每/冠 day=天/名 | A: after=在…之后/介 meals=饭/名
S: Regular=规律的/形 exercise=锻炼/名 | V: is=是/动 | P(be good for 表示「对…有好处」): good=好的/形 | A(both A and B 表示「两者都」): for=对/介 both=两者都/连 your=你的/限 body=身体/名 and=和/连 mind=心灵/名
S(It's = It is，it 指天气): It's=天气是/代 | P: very=很/副 cold=冷的/形 | A: today=今天/副 | J: so=所以/连 | V(祈使句): wear=穿/动 | O: a=一件/冠 warm=暖和的/形 coat=外套/名
S(You'd better = You had better): You'd=你最好/代 | V(had better + 动词原形，表示「最好做」): better=最好/副 take=带/动 | O: an=一把/冠 umbrella=雨伞/名 | A: with=随身/介 you=你/代
A(According to 表示「根据」): According=根据/副 to=…/介 the=这/冠 weather=天气/名 forecast=预报/名 | S: it=(天气)/代 | V: will=将/情 snow=下雪/动 | A: tonight=今晚/副
S: It=天气/代 | V: was=是/动 | P: warm=温暖的/形 and=和/连 sunny=晴朗的/形 | A: all=整个/限 week=星期/名
S: My=我的/限 sister=姐姐/名 | V: has=有/动 | O: two=两个/数 children=孩子/名 | T(同位语，具体说明 two children): a=一个/冠 boy=男孩/名 and=和/连 a=一个/冠 girl=女孩/名
S: I=我/代 | V: visit=看望/动 | O: my=我的/限 grandparents=祖父母/名 | A: in=在/介 the=这个/冠 countryside=乡下/名 | A: every=每个/限 weekend=周末/名
S: My=我的/限 father=爸爸/名 | A: usually=通常/副 | V: cooks=做/动 | O: dinner=晚饭/名 | A: for=为/介 the=这个/冠 family=家庭/名
S(A and I 作主语，谓语用复数): My=我的/限 cousin=表哥/名 and=和/连 I=我/代 | V: are=是/动 | P: the=这个/冠 same=相同的/形 age=年龄/名
P(特殊疑问词作表语): What=什么/代 | V: is=是/动 | S: the=这个/冠 best=最好的/形 way=方法/名 | T(不定式作定语，修饰 way): to=(不定式标记)/不 remember=记住/动 new=新的/形 words=单词/名
S: She=她/代 | A: finally=终于/副 | V: passed=通过了/动 | O: the=这场/冠 exam=考试/名 | A: after=在…之后/介 months=几个月/名 of=的/介 hard=努力的/形 work=工作/名
V(祈使句的否定：Don't be …): Don't=不要/助 be=是/动 | P(be afraid of doing 表示「害怕做某事」): afraid=害怕的/形 of=…/介 making=犯/动 mistakes=错误/名 | A(when 引导时间状语从句): when=当…时/连 you=你/代 speak=说/动
S: I=我/代 | V: joined=加入了/动 | O: an=一个/冠 English=英语/名 club=俱乐部/名 | A(不定式作目的状语): to=为了/不 practice=练习/动 speaking=口语/名
S: We=我们/代 | V(球类运动前不加冠词): play=打/动 | O: basketball=篮球/名 | A: with=和/介 friends=朋友们/名 | A: every=每个/限 Saturday=周六/名
S: I=我/代 | V(现在完成进行时，强调一直在做): have=已经/助 been=一直/助 learning=学习/动 | O(西洋乐器前要加 the): to=(不定式标记)/不 play=弹/动 the=这/冠 guitar=吉他/名 | A: for=持续/介 a=一/冠 year=年/名
S: He=他/代 | V: loves=喜欢/动 | O: to=(不定式标记)/不 take=拍/动 photos=照片/名 | T: of=…的/介 the=这座/冠 city=城市/名 | A: at=在/介 night=晚上/名
V(Let's = Let us，表示提议): Let's=让我们/动 go=去/动 | O(go for a run 表示「去跑步」): for=去/介 a=一次/冠 run=跑步/名 | A: in=在/介 the=这个/冠 park=公园/名 | A: this=今天/限 evening=晚上/名
V: Could=能/情 | S: you=你/代 | V(do sb. a favor 表示「帮某人一个忙」): do=做/动 | O(间接宾语): me=我/代 | O(直接宾语): a=一个/冠 favor=忙/名
V: Would=会/情 | S: you=你/代 | V(mind + doing 表示「介意做某事」): mind=介意/动 | O: opening=打开/动 the=这扇/冠 window=窗户/名
V: Can=能/情 | S: you=你/代 | V: help=帮助/动 | O: me=我/代 | C(help sb. do 表示「帮某人做」，省略了 to): carry=搬/动 this=这个/限 box=箱子/名 | A: upstairs=上楼/副
V: Could=能/情 | S: you=你/代 | V: speak=说/动 | A(a little 修饰比较级，表示「稍微」): a=一/冠 little=点儿/名 more=更/副 slowly=慢地/副 | X: please=请/副
S: You=你/代 | V: should=应该/情 see=看/动 | O: a=一位/冠 doctor=医生/名 | A(as … as possible 表示「尽可能…」): as=尽/副 soon=早/副 as=…/连 possible=可能的/形
A(Why don't you …? 表示建议): Why=为什么/副 | V: don't=不/助 | S: you=你/代 | V: take=进行/动 | O: a=一次/冠 break=休息/名 | J: and=并且/连 | V: have=喝/动 | O: some=一些/限 tea=茶/名
S: You=你/代 | V(had better not do 表示「最好不要做」): had=最好/助 better=最好/副 not=不要/副 stay=熬/动 up=夜/副 late=晚/副 | A: before=在…之前/介 the=这场/冠 exam=考试/名
A(与现在事实相反的虚拟语气，be 动词一律用 were): If=如果/连 I=我/代 were=是/动 you=你/代 | S: I=我/代 | V: would=会/情 try=尽量/动 | O: to=(不定式标记)/不 eat=吃/动 more=更多的/形 vegetables=蔬菜/名
V(现在完成时的疑问句 Have you ever done …?): Have=(助动词)/助 | S: you=你/代 | A: ever=曾经/副 | V(have been to 表示「去过」): been=去过/动 | A: to=到/介 Paris=巴黎/名 | A: in=在/介 the=这个/冠 spring=春天/名
S: I=我/代 | V: have=(助动词)/助 | A: never=从未/副 | V: tried=尝试过/动 | O: sushi=寿司/名 | A: before=以前/副
S: They=他们/代 | V: have=已经/助 lived=住了/动 | A: in=在/介 this=这座/限 city=城市/名 | A: for=持续/介 ten=十/数 years=年/名
S: I=我/代 | V: think=认为/动 | O(宾语从句，省略了 that): I=我/代 have=已经/助 lost=弄丢了/动 my=我的/限 keys=钥匙/名 again=又/副
S: This=这座/限 bridge=桥/名 | V(被动语态：was + 过去分词): was=被/助 built=建造/动 | A: in=在/介 1990=1990年/数 | A(by 引出动作的执行者): by=由/介 a=一家/冠 French=法国的/形 company=公司/名
S: English=英语/名 | V(一般现在时的被动：is + 过去分词): is=被/助 spoken=说/动 | A(as 表示「作为」): as=作为/介 a=一种/冠 first=第一/数 language=语言/名 | A: in=在/介 many=很多/形 countries=国家/名
S: My=我的/限 bike=自行车/名 | V: was=被/助 stolen=偷/动 | A(from outside 表示「从…外面」): from=从/介 outside=外面/介 the=这个/冠 library=图书馆/名 | A: last=昨/形 night=晚/名
S: The=这个/冠 meeting=会议/名 | V(现在完成时的被动：has been + 过去分词): has=已经/助 been=被/助 cancelled=取消/动 | A: because=因为/连 of=…/介 the=这场/冠 rain=雨/名
A(真实条件句：if 从句用一般现在时，主句用将来时): If=如果/连 it=(天气)/代 rains=下雨/动 tomorrow=明天/副 | S: we=我们/代 | V: will=将/情 stay=待/动 | A: at=在/介 home=家/名 | J: and=并且/连 | V: watch=看/动 | O: a=一部/冠 movie=电影/名
A(与现在事实相反的假设：if 从句用过去式): If=如果/连 I=我/代 had=有/动 more=更多的/形 time=时间/名 | S: I=我/代 | V(主句用 would + 动词原形): would=会/情 learn=学/动 | O: to=(不定式标记)/不 cook=做饭/动
V(祈使句): Hurry=赶快/动 up=起来/副 | J(祈使句 + or 表示「否则」): or=否则/连 | S(you'll = you will): you'll=你将/代 | V: miss=错过/动 | O: the=这班/冠 bus=公交车/名
O(特殊疑问词作 do 的宾语): What=什么/代 | V: would=会/情 | S: you=你/代 | V: do=做/动 | A(if 引导虚拟条件句): if=如果/连 you=你/代 won=赢得/动 the=这张/冠 lottery=彩票/名
O(特殊疑问词 what 作 do 的宾语，放在句首): What=什么/代 | V(助动词 do 帮助构成疑问句): do=(助动词)/助 | S: you=你/代 | A(频度副词): usually=通常/副 | V: do=做/动 | A(时间状语): on=在/介 weekends=周末/名
A(疑问副词 where 问地点): Where=哪里/副 | V(一般过去时的疑问句用助动词 did): did=(助动词)/助 | S: you=你/代 | V(did 后面用动词原形): live=住/动 | A(before 引导时间状语从句): before=在…之前/连 you=你/代 moved=搬/动 here=到这里/副
A(疑问副词 how 问方式): How=怎样/副 | V: did=(助动词)/助 | S: you=你/代 | V(get there 表示「到达那里」，there 前不加 to): get=到达/动 | A: there=那里/副 | A: so=这么/副 quickly=快地/副
A(疑问副词 why 问原因): Why=为什么/副 | V(系动词 be 的过去式提前，构成疑问句): were=是/动 | S: you=你/代 | P(be late for 表示「做…迟到」): late=迟到的/形 for=…/介 work=上班/名 | A: this=今天/限 morning=早上/名
S: My=我的/限 mom=妈妈/名 | V(现在进行时：am/is/are + doing): is=正在/助 cooking=做/动 | O: dinner=晚饭/名 | A(地点状语): in=在…里/介 the=这个/冠 kitchen=厨房/名
S: I=我/代 | V(现在进行时): am=正在/助 reading=读/动 | O: a=一本/冠 book=书/名 | T(介词短语作定语，修饰 book): about=关于/介 space=太空/名
S: We=我们/代 | V(过去进行时：was/were + doing，表示过去某一刻正在做): were=正在/助 watching=看/动 | O: TV=电视/名 | A(when 引导时间状语从句，打断了正在进行的动作): when=当…时/连 you=你/代 called=打电话/动
S(it 指天气): It=(天气)/代 | V(现在进行时): is=正在/助 raining=下雨/动 | A: hard=猛烈地/副 | J: so=所以/连 | V(let's = let us，表示提议): let's=让我们/动 stay=待/动 | A: inside=在屋里/副
S: My=我的/限 little=小的/形 brother=弟弟/名 | V(can 表示能力，后接动词原形): can=会/情 swim=游泳/动 | A: very=非常/副 well=好/副
S: You=你/代 | V(must 表示「必须」，语气很强): must=必须/情 wear=系/动 | O: a=一条/冠 seat=座位/名 belt=带子/名 | A(地点状语): in=在…里/介 the=这辆/冠 car=车/名
S: I=我/代 | V(have to 表示客观情况要求「不得不」): have=不得不/动 to=(不定式标记)/不 get=起/动 up=来/副 | A: early=早/副 | A: tomorrow=明天/副 | A(for 表示目的): for=为了/介 my=我的/限 flight=航班/名
S(it 指天气): It=(天气)/代 | V(may 表示可能性，把握不大): may=可能/情 rain=下雨/动 | A: this=今天/限 afternoon=下午/名
S: This=这/代 | V: is=是/动 | P: my=我的/限 friend=朋友/名 | T(同位语，说明朋友的名字): Anna=安娜/名 | T(介词短语作定语): from=来自/介 Canada=加拿大/名
S(It's = It is；it 是形式主语): It's=这是/代 | P: so=这么/副 nice=令人高兴的/形 | S(不定式短语是真正的主语): to=(不定式标记)/不 see=见到/动 you=你/代 | A: again=再次/副 | A(时间状语): after=在…之后/介 all=所有/限 these=这些/限 years=年/名
S: I=我/代 | V(现在完成时 have been，表示一直持续到现在的状态): have=一直/助 been=是/动 | P(be busy with 表示「忙于」): really=真的/副 busy=忙的/形 with=于/介 work=工作/名 | A(lately 常和完成时连用): lately=最近/副
X(礼貌用语): Please=请/副 | V(祈使句): say=说/动 | O: hello=你好/名 | A(say hello to sb. 表示「向某人问好」): to=向/介 your=你的/限 family=家人/名 | A: for=代替/介 me=我/代
S: I=我/代 | V: work=工作/动 | A(as 表示身份，「作为」): as=作为/介 a=一名/冠 teacher=老师/名 | A(地点状语): at=在/介 a=一所/冠 local=本地的/形 school=学校/名
S: I=我/代 | V: live=住/动 | A(地点状语): in=在/介 Beijing=北京/名 | A(伴随状语): with=和…一起/介 my=我的/限 parents=父母/名
S: I=我/代 | V(enjoy 后面接动名词 doing): enjoy=喜欢/动 | O(动名词作宾语): reading=阅读/动 | A(时间状语): in=在/介 my=我的/限 free=空闲的/形 time=时间/名
S: I=我/代 | V(start doing 表示「开始做」，started 是过去式): started=开始/动 | O(动名词短语作宾语): learning=学/动 English=英语/名 | A: again=再次/副 | A(时间状语): last=上一个/形 year=年/名
V(情态动词提前构成疑问句；Can I have … 是点单常用说法): Can=能/情 | S: I=我/代 | V: have=要/动 | O: a=一杯/冠 large=大的/形 latte=拿铁/名 | T(介词短语作定语): with=加/介 oat=燕麦/名 milk=奶/名
S(I'd = I would): I'd=我想/代 | V: like=想要/动 | O: my=我的/限 coffee=咖啡/名 | C(补充说明咖啡要怎样的): with=带有/介 less=更少的/形 sugar=糖/名
V(Let's = Let us，表示提议): Let's=让我们/动 find=找/动 | O: a=一个/冠 seat=座位/名 | T(by the window 表示「靠窗的」): by=在…旁边/介 the=这/冠 window=窗户/名
S: We=我们/代 | A(频度副词): often=经常/副 | V: come=来/动 | A(表示目的地): to=到/介 this=这家/限 cafe=咖啡馆/名 | A(时间状语): on=在/介 Sunday=周日/名 afternoons=下午/名
V(情态动词提前构成疑问句): Can=能/情 | S: I=我/代 | V: leave=留下/动 | O: a=一条/冠 message=留言/名 | A: for=给/介 him=他/代
V(Could you … 比 Can you … 更礼貌): Could=能/情 | S: you=你/代 | V: ask=请求/动 | O: her=她/代 | C(ask sb. to do 中不定式作宾语补足语): to=(不定式标记)/不 call=打电话给/动 me=我/代 back=回/副 | A: this=今天/限 afternoon=下午/名
S: I'd=我想/代 | V: like=想要/动 | O(make an appointment 表示「预约」): to=(不定式标记)/不 make=做/动 an=一个/冠 appointment=预约/名 | A: with=和/介 the=这位/冠 dentist=牙医/名
X(插入语，表示歉意): Sorry=抱歉/形 | S: I=我/代 | V(can't = cannot): can't=不能/情 hear=听见/动 | O: you=你/代 | A: very=很/副 well=清楚地/副
S: We=我们/代 | V(现在进行时；look for 表示「寻找」): are=正在/助 looking=找/动 | O: for=…/介 a=一套/冠 small=小的/形 apartment=公寓/名 | T(修饰 apartment): near=在…附近/介 the=这条/冠 subway=地铁/名
S: The=这个/冠 kitchen=厨房/名 sink=水槽/名 | V(现在完成进行时 has been doing，表示一直持续到现在): has=一直/助 been=(助动词)/助 leaking=漏水/动 | A(since + 时间点，表示「从…起」): since=自从/介 Monday=周一/名
S: We=我们/代 | V: pay=交/动 | O: the=这/冠 rent=房租/名 | A(时间状语): on=在/介 the=这/冠 first=第一/数 day=天/名 | T(修饰 day): of=…的/介 every=每个/限 month=月/名
S: Our=我们的/限 new=新的/形 neighbors=邻居/名 | V(系动词): are=是/动 | P(两个形容词并列作表语): very=非常/副 friendly=友好的/形 | J: and=而且/连 | P: helpful=乐于助人的/形
S: I=我/代 | V: need=需要/动 | O(不定式短语作宾语): to=(不定式标记)/不 withdraw=取/动 some=一些/限 cash=现金/名 | A: from=从/介 the=这台/冠 ATM=取款机/名
S: I'd=我想/代 | V: like=想要/动 | O: to=(不定式标记)/不 send=寄/动 this=这个/限 package=包裹/名 | A(表示目的地): to=到/介 Shanghai=上海/名
S(I'm = I am): I'm=我/代 | V(be going to 表示打算做某事): going=打算/动 to=(不定式标记)/不 get=去做/动 | O: a=一次/冠 haircut=理发/名 | A: this=这个/限 weekend=周末/名
A(how long 问时间长短): How=多/副 long=久/副 | V: will=将/情 | S(it 是形式主语): it=(形式主语)/代 | V(it takes + 时间 + to do 表示「做某事要花多长时间」): take=花费/动 | S(不定式短语是真正的主语): to=(不定式标记)/不 fix=修理/动 my=我的/限 phone=手机/名
S: I=我/代 | A(频度副词): usually=通常/副 | V: buy=买/动 | O: clothes=衣服/名 | A(方式状语): online=在网上/副
S: The=这个/冠 package=包裹/名 | V: arrived=到达/动 | A(two days 修饰 late，说明晚了多久): two=两/数 days=天/名 late=迟/副
S: I=我/代 | V: want=想/动 | O(ask for 表示「要求」): to=(不定式标记)/不 ask=请求/动 for=要/介 a=一笔/冠 refund=退款/名 | A(because 引导原因状语从句): because=因为/连 it=它/代 is=是/动 broken=坏的/形
X: Please=请/副 | V(祈使句): send=发送/动 | O(间接宾语): me=我/代 | O(直接宾语): the=这些/冠 photos=照片/名 | T(定语从句，省略了关系词 that): we=我们/代 took=拍/动 yesterday=昨天/副
S: I'd=我想/代 | V: like=想要/动 | O: to=(不定式标记)/不 book=预订/动 a=一间/冠 double=双人的/形 room=房间/名 | A(for 表示时长): for=为期/介 two=两/数 nights=晚/名
S: The=这台/冠 air=空气/名 conditioner=调节器/名 | T(修饰 air conditioner): in=在…里/介 my=我的/限 room=房间/名 | V(doesn't work 表示「坏了、不运转」): doesn't=不/助 work=运转/动
V(be 动词提前构成疑问句；be included 是被动语态): Is=是/动 | S: breakfast=早餐/名 | V: included=包含/动 | A: in=在…里/介 the=这个/冠 price=价格/名
V(情态动词提前构成疑问句): Can=能/情 | S: I=我/代 | V: leave=留下/动 | O: my=我的/限 luggage=行李/名 | A: here=这里/副 | A(时间状语): after=在…之后/介 checkout=退房/名
V(Could you … 是礼貌的请求): Could=能/情 | S: you=你/代 | V: take=拍/动 | O: a=一张/冠 picture=照片/名 | T: of=…的/介 us=我们/代 | A(in front of 表示「在…前面」): in=在/介 front=前面/名 of=…的/介 the=这座/冠 tower=塔/名
S: We=我们/代 | V: plan=打算/动 | O(不定式短语作宾语): to=(不定式标记)/不 visit=参观/动 the=这个/冠 museum=博物馆/名 | A: tomorrow=明天/名 morning=上午/名
S: We=我们/代 | V: want=想/动 | O: to=(不定式标记)/不 buy=买/动 two=两/数 tickets=票/名 | T(修饰 tickets): for=…的/介 the=这个/冠 boat=船/名 tour=游览/名
S: The=这/冠 view=景色/名 | T(修饰 view): from=从/介 the=这/冠 top=顶部/名 of=…的/介 the=这座/冠 mountain=山/名 | V(系动词): is=是/动 | P: beautiful=美丽的/形
S(We're = We are): We're=我们/代 | V(现在进行时表示已经安排好的将来): having=举办/动 | O: a=一个/冠 birthday=生日/名 party=派对/名 | A(对象): for=为/介 Tom=汤姆/名 | A(时间状语): on=在/介 Saturday=周六/名
S: I=我/代 | V(buy 的过去式): bought=买了/动 | O(间接宾语): her=她/代 | O(直接宾语): a=一份/冠 small=小的/形 gift=礼物/名
V: Thank=感谢/动 | O: you=你/代 | A(thank sb. for doing 表示「因…感谢某人」): for=因为/介 coming=来/动 | A: to=到/介 my=我的/限 party=派对/名
S: We=我们/代 | V: wish=祝愿/动 | O(间接宾语): you=你/代 | O(直接宾语): a=一个/冠 happy=快乐的/形 new=新的/形 year=年/名
S: Someone=某人/代 | V(steal 的过去式): stole=偷了/动 | O: my=我的/限 wallet=钱包/名 | A(地点状语): on=在…上/介 the=这辆/冠 bus=公交车/名
X: Please=请/副 | V(祈使句): call=叫/动 | O: an=一辆/冠 ambulance=救护车/名 | A(right now 表示「立刻」): right=正好/副 now=现在/副
S: I=我/代 | V(leave 的过去式，这里是「落下、遗忘」): left=落下/动 | O: my=我的/限 bag=包/名 | A(地点状语): in=在…里/介 the=这辆/冠 taxi=出租车/名
V(情态动词提前构成疑问句): Can=能/情 | S: you=你/代 | V: tell=告诉/动 | O(间接宾语): me=我/代 | O(宾语从句要用陈述句语序：主语在前，is 在后): where=哪里/副 the=这家/冠 nearest=最近的/形 hospital=医院/名 is=是/动
`;
