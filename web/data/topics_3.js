// 主题词汇（第 3 批）：每行「单词|美式音标|中文|例句|例句翻译」
(function () {
  const T = (window.TOPICS = window.TOPICS || []);
  const add = (id, title, en, icon, desc, groups) => T.push({ id, title, en, icon, desc, groups: Object.entries(groups).map(([g, text]) => ({ title: g, words: text.trim().split("\n").map((l) => l.split("|").map((s) => s.trim())) })) });

  add("numbers", "数字", "Numbers", "🔢", "基数词、整十数、大数、序数词和数学词汇", {
    "基数词": `
one|/wʌn/|一|I have one brother.|我有一个哥哥。
two|/tuː/|二|Two coffees, please.|请来两杯咖啡。
three|/θriː/|三|The shop opens at three.|商店三点开门。
eight|/eɪt/|八|Eight is a lucky number in China.|在中国，八是幸运数字。
eleven|/ɪˈlevn/|十一|The match starts at eleven.|比赛十一点开始。
twelve|/twelv/|十二|There are twelve months in a year.|一年有十二个月。
thirteen|/ˌθɜːrˈtiːn/|十三|She is thirteen years old.|她十三岁。
fifteen|/ˌfɪfˈtiːn/|十五|The bus comes every fifteen minutes.|公交车每十五分钟来一趟。`,
    "整十数与大数": `
twenty|/ˈtwenti/|二十|I'm twenty years old.|我二十岁。
forty|/ˈfɔːrti/|四十|It costs forty dollars.|它要四十美元。
fifty|/ˈfɪfti/|五十|Half of one hundred is fifty.|一百的一半是五十。
hundred|/ˈhʌndrəd/|百|There are a hundred people here.|这里有一百个人。
thousand|/ˈθaʊznd/|千|The car costs twenty thousand dollars.|这辆车值两万美元。
million|/ˈmɪljən/|百万|The city has ten million people.|这座城市有一千万人。
billion|/ˈbɪljən/|十亿|The world has about eight billion people.|世界上约有八十亿人。`,
    "序数词": `
first|/fɜːrst/|第一|This is my first time here.|这是我第一次来这里。
second|/ˈsekənd/|第二|She came second in the race.|她在比赛中获得第二名。
third|/θɜːrd/|第三|I live on the third floor.|我住在三楼。
fifth|/fɪfθ/|第五|Today is the fifth of May.|今天是五月五日。
ninth|/naɪnθ/|第九|He is in ninth grade.|他上九年级。
twelfth|/twelfθ/|第十二|It's my twelfth birthday.|这是我的十二岁生日。
last|/læst/|最后的|This is the last train tonight.|这是今晚最后一班火车。`,
    "数学词汇": `
number|/ˈnʌmbər/|数字|What's your phone number?|你的电话号码是多少？
plus|/plʌs/|加|Two plus two is four.|二加二等于四。
minus|/ˈmaɪnəs/|减|Ten minus three is seven.|十减三等于七。
times|/taɪmz/|乘|Three times four is twelve.|三乘四等于十二。
half|/hæf/|一半|Cut the apple in half.|把苹果切成两半。
percent|/pərˈsent/|百分之……|Fifty percent of the students are girls.|百分之五十的学生是女生。
dozen|/ˈdʌzn/|一打|I bought a dozen eggs.|我买了一打鸡蛋。`,
  });

  add("clothes", "衣服", "Clothes", "👕", "上衣、下装、鞋子配饰和内衣泳装", {
    "上衣": `
shirt|/ʃɜːrt/|衬衫|He wears a white shirt to work.|他穿白衬衫上班。
T-shirt|/ˈtiː ʃɜːrt/|T 恤|I bought a new T-shirt.|我买了一件新 T 恤。
sweater|/ˈswetər/|毛衣|This sweater is very warm.|这件毛衣很暖和。
jacket|/ˈdʒækɪt/|夹克|Take a jacket, it's windy.|带件夹克，外面有风。
coat|/koʊt/|外套；大衣|Put on your coat.|穿上你的外套。
hoodie|/ˈhʊdi/|连帽衫|He always wears a hoodie.|他总是穿连帽衫。
suit|/suːt/|西装|He wore a suit to the interview.|他穿西装去面试。
dress|/dres/|连衣裙|She looks lovely in that dress.|她穿那条裙子真好看。`,
    "下装": `
pants|/pænts/|裤子（美式）|These pants are too long.|这条裤子太长了。
jeans|/dʒiːnz/|牛仔裤|I wear jeans almost every day.|我几乎每天都穿牛仔裤。
shorts|/ʃɔːrts/|短裤|It's hot. I'll wear shorts.|天热，我要穿短裤。
skirt|/skɜːrt/|裙子|She wore a long skirt.|她穿了一条长裙。`,
    "鞋子与配饰": `
shoes|/ʃuːz/|鞋|Take off your shoes, please.|请脱鞋。
sneakers|/ˈsniːkərz/|运动鞋|I need new sneakers for running.|我需要一双新跑鞋。
boots|/buːts/|靴子|She wears boots in winter.|她冬天穿靴子。
socks|/sɑːks/|袜子|I can't find my socks.|我找不到我的袜子。
hat|/hæt/|帽子|Wear a hat in the sun.|太阳下戴顶帽子。
glasses|/ˈɡlæsɪz/|眼镜|I can't see without my glasses.|不戴眼镜我看不清。
belt|/belt/|腰带|This belt is too tight.|这条腰带太紧了。
gloves|/ɡlʌvz/|手套|Don't forget your gloves.|别忘了戴手套。
tie|/taɪ/|领带|He wore a blue tie.|他系了一条蓝色领带。`,
    "内衣与泳装": `
pajamas|/pəˈdʒɑːməz/|睡衣|The kids are in their pajamas.|孩子们穿着睡衣。
underwear|/ˈʌndərwer/|内衣|Pack enough underwear for the trip.|旅行要带够内衣。
swimsuit|/ˈswɪmsuːt/|泳衣|I forgot my swimsuit.|我忘了带泳衣。
uniform|/ˈjuːnɪfɔːrm/|制服|Nurses wear uniforms.|护士穿制服。`,
    "穿搭动作": `
wear|/wer/|穿着|What should I wear tonight?|我今晚该穿什么？
put on|/ˌpʊt ˈɑːn/|穿上|Put on your shoes.|穿上鞋。
take off|/ˌteɪk ˈɔːf/|脱下|Take off your hat inside.|在室内请脱帽。
try on|/ˌtraɪ ˈɑːn/|试穿|Can I try this on?|我能试穿这件吗？
fit|/fɪt/|合身|These jeans fit perfectly.|这条牛仔裤非常合身。`,
  });

  add("time", "时间", "Time", "⏰", "基础时间单位、一天时段、星期月份和频率副词", {
    "时间单位": `
second|/ˈsekənd/|秒|Wait a second.|等一下。
minute|/ˈmɪnɪt/|分钟|I'll be there in five minutes.|我五分钟后到。
hour|/ˈaʊər/|小时|The movie is two hours long.|电影有两个小时长。
day|/deɪ/|天|Have a nice day!|祝你今天愉快！
week|/wiːk/|星期；周|I go swimming twice a week.|我一周游两次泳。
month|/mʌnθ/|月|I'll see you next month.|下个月见。
year|/jɪr/|年|Happy New Year!|新年快乐！
century|/ˈsentʃəri/|世纪|This house is a century old.|这栋房子有一百年了。`,
    "一天时段": `
morning|/ˈmɔːrnɪŋ/|早上|I run every morning.|我每天早上跑步。
noon|/nuːn/|中午|Let's meet at noon.|我们中午见吧。
afternoon|/ˌæftərˈnuːn/|下午|I have a meeting this afternoon.|我今天下午有个会。
evening|/ˈiːvnɪŋ/|傍晚；晚上|What are you doing this evening?|你今晚做什么？
night|/naɪt/|夜晚|Good night!|晚安！
midnight|/ˈmɪdnaɪt/|午夜|He came home at midnight.|他午夜才到家。`,
    "星期": `
Monday|/ˈmʌndeɪ/|星期一|I hate Mondays.|我讨厌星期一。
Wednesday|/ˈwenzdeɪ/|星期三|The shop is closed on Wednesday.|商店周三关门。
Thursday|/ˈθɜːrzdeɪ/|星期四|See you on Thursday.|星期四见。
Saturday|/ˈsætərdeɪ/|星期六|We go shopping on Saturday.|我们周六去购物。
weekend|/ˈwiːkend/|周末|Have a good weekend!|周末愉快！
weekday|/ˈwiːkdeɪ/|工作日|I get up early on weekdays.|我工作日起得早。`,
    "时间表达": `
today|/təˈdeɪ/|今天|What's the date today?|今天几号？
tomorrow|/təˈmɑːroʊ/|明天|See you tomorrow.|明天见。
yesterday|/ˈjestərdeɪ/|昨天|I saw him yesterday.|我昨天见过他。
early|/ˈɜːrli/|早的|I got up early today.|我今天起得很早。
late|/leɪt/|迟的；晚的|Sorry I'm late.|抱歉我迟到了。
o'clock|/əˈklɑːk/|……点钟|It's six o'clock.|现在六点。
quarter|/ˈkwɔːrtər/|一刻钟|It's a quarter past nine.|现在九点一刻。`,
    "频率副词": `
always|/ˈɔːlweɪz/|总是|She is always on time.|她总是很准时。
usually|/ˈjuːʒuəli/|通常|I usually walk to work.|我通常走路上班。
often|/ˈɔːfn/|经常|We often eat out.|我们经常出去吃饭。
sometimes|/ˈsʌmtaɪmz/|有时|Sometimes I cook at home.|有时我在家做饭。
never|/ˈnevər/|从不|I never drink coffee at night.|我晚上从不喝咖啡。`,
  });

  add("sports", "运动", "Sports", "⚽", "球类运动、水上运动、田径体操、装备和术语", {
    "球类运动": `
football|/ˈfʊtbɔːl/|足球（英式）；橄榄球（美式）|Football is popular all over the world.|足球在全世界都很流行。
soccer|/ˈsɑːkər/|足球（美式）|We play soccer after school.|我们放学后踢足球。
basketball|/ˈbæskɪtbɔːl/|篮球|He is tall and good at basketball.|他个子高，擅长篮球。
tennis|/ˈtenɪs/|网球|Do you want to play tennis?|你想打网球吗？
badminton|/ˈbædmɪntən/|羽毛球|Badminton is popular in China.|羽毛球在中国很流行。
volleyball|/ˈvɑːlibɔːl/|排球|We played volleyball on the beach.|我们在海滩上打排球。
table tennis|/ˈteɪbl tenɪs/|乒乓球|China is strong in table tennis.|中国的乒乓球很强。
golf|/ɡɑːlf/|高尔夫球|My boss plays golf on weekends.|我老板周末打高尔夫。`,
    "水上运动": `
swimming|/ˈswɪmɪŋ/|游泳|Swimming is good for your back.|游泳对腰背有好处。
diving|/ˈdaɪvɪŋ/|跳水；潜水|We went diving in Thailand.|我们在泰国潜水了。
surfing|/ˈsɜːrfɪŋ/|冲浪|Surfing looks fun but hard.|冲浪看起来有趣但很难。
rowing|/ˈroʊɪŋ/|划船|Rowing is a team sport.|赛艇是团体运动。`,
    "田径与健身": `
running|/ˈrʌnɪŋ/|跑步|Running clears my mind.|跑步让我头脑清醒。
marathon|/ˈmærəθɑːn/|马拉松|She finished her first marathon.|她跑完了第一个马拉松。
yoga|/ˈjoʊɡə/|瑜伽|I do yoga every morning.|我每天早上做瑜伽。
gym|/dʒɪm/|健身房|I go to the gym three times a week.|我一周去三次健身房。
skiing|/ˈskiːɪŋ/|滑雪|We went skiing in the mountains.|我们去山里滑雪了。
skating|/ˈskeɪtɪŋ/|滑冰|Skating is fun in winter.|冬天滑冰很有意思。`,
    "装备": `
ball|/bɔːl/|球|Kick the ball to me!|把球踢给我！
racket|/ˈrækɪt/|球拍|I need a new tennis racket.|我需要一支新网球拍。
helmet|/ˈhelmɪt/|头盔|Always wear a helmet when cycling.|骑车时一定要戴头盔。
net|/net/|网|The ball hit the net.|球打在了网上。`,
    "比赛术语": `
team|/tiːm/|队|Which team do you support?|你支持哪支队？
match|/mætʃ/|比赛|We won the match 3–1.|我们以 3 比 1 赢了比赛。
score|/skɔːr/|得分；比分|What's the score?|比分多少了？
win|/wɪn/|赢|I hope our team wins.|希望我们队赢。
lose|/luːz/|输|They lost the game.|他们输了比赛。
coach|/koʊtʃ/|教练|The coach is very strict.|教练很严格。
champion|/ˈtʃæmpiən/|冠军|She is the world champion.|她是世界冠军。`,
  });

  add("kitchen", "厨房", "Kitchen", "🍳", "厨房电器、炊具、餐具、厨房用品和烹饪动作", {
    "厨房电器": `
fridge|/frɪdʒ/|冰箱|Put the milk in the fridge.|把牛奶放进冰箱。
oven|/ˈʌvn/|烤箱|The cake is in the oven.|蛋糕在烤箱里。
microwave|/ˈmaɪkrəweɪv/|微波炉|Heat it in the microwave.|用微波炉加热一下。
stove|/stoʊv/|炉灶|The soup is on the stove.|汤在炉子上。
dishwasher|/ˈdɪʃwɑːʃər/|洗碗机|Put the plates in the dishwasher.|把盘子放进洗碗机。
kettle|/ˈketl/|水壶|I'll put the kettle on.|我去烧壶水。`,
    "炊具": `
pot|/pɑːt/|锅（深锅）|Boil the water in a big pot.|在大锅里烧水。
pan|/pæn/|平底锅|Fry the egg in a pan.|在平底锅里煎蛋。
wok|/wɑːk/|炒锅|You need a wok for stir-frying.|炒菜需要炒锅。
knife|/naɪf/|刀|Be careful, the knife is sharp.|小心，刀很锋利。
cutting board|/ˈkʌtɪŋ bɔːrd/|砧板|Chop the onions on the cutting board.|在砧板上切洋葱。`,
    "餐具": `
plate|/pleɪt/|盘子|Pass me a plate, please.|请递给我一个盘子。
bowl|/boʊl/|碗|A bowl of rice, please.|请来一碗米饭。
cup|/kʌp/|杯子|Would you like a cup of tea?|要来杯茶吗？
chopsticks|/ˈtʃɑːpstɪks/|筷子|Can you use chopsticks?|你会用筷子吗？
fork|/fɔːrk/|叉子|Eat the salad with a fork.|用叉子吃沙拉。
spoon|/spuːn/|勺子|I need a spoon for my soup.|我需要一把汤勺。`,
    "厨房用品": `
apron|/ˈeɪprən/|围裙|Put on an apron before cooking.|做饭前系上围裙。
napkin|/ˈnæpkɪn/|餐巾|Here's a napkin.|给你一张餐巾。
tray|/treɪ/|托盘|She carried the drinks on a tray.|她用托盘端着饮料。
jar|/dʒɑːr/|罐子|I can't open this jar.|我打不开这个罐子。
bottle opener|/ˈbɑːtl oʊpənər/|开瓶器|Where's the bottle opener?|开瓶器在哪儿？`,
    "烹饪动作": `
cook|/kʊk/|烹饪|Who cooks in your family?|你家谁做饭？
boil|/bɔɪl/|煮；烧开|Boil the eggs for ten minutes.|鸡蛋煮十分钟。
fry|/fraɪ/|煎；炸|Fry the fish until golden.|把鱼煎到金黄。
bake|/beɪk/|烘烤|I'm baking bread.|我在烤面包。
chop|/tʃɑːp/|切碎|Chop the carrots into small pieces.|把胡萝卜切成小块。
stir|/stɜːr/|搅拌|Stir the soup slowly.|慢慢搅拌汤。
steam|/stiːm/|蒸|Steam the fish for eight minutes.|把鱼蒸八分钟。`,
  });

  add("vegetables", "蔬菜", "Vegetables", "🥦", "叶菜、根茎、果菜、豆类和其他蔬菜", {
    "叶菜类": `
cabbage|/ˈkæbɪdʒ/|卷心菜|Cabbage is cheap and healthy.|卷心菜便宜又健康。
lettuce|/ˈletɪs/|生菜|Add some lettuce to the sandwich.|在三明治里加点生菜。
spinach|/ˈspɪnɪtʃ/|菠菜|Spinach is full of iron.|菠菜富含铁。
celery|/ˈseləri/|芹菜|I don't like the taste of celery.|我不喜欢芹菜的味道。
broccoli|/ˈbrɑːkəli/|西兰花|Kids often don't like broccoli.|孩子们往往不喜欢西兰花。`,
    "根茎类": `
potato|/pəˈteɪtoʊ/|土豆|I love mashed potatoes.|我爱吃土豆泥。
carrot|/ˈkærət/|胡萝卜|Carrots are good for your eyes.|胡萝卜对眼睛好。
onion|/ˈʌnjən/|洋葱|Cutting onions makes me cry.|切洋葱让我流眼泪。
garlic|/ˈɡɑːrlɪk/|大蒜|Add some garlic for flavor.|加点大蒜提味。
ginger|/ˈdʒɪndʒər/|姜|Ginger tea helps with colds.|姜茶有助于缓解感冒。
sweet potato|/ˌswiːt pəˈteɪtoʊ/|红薯|Roasted sweet potatoes smell great.|烤红薯闻起来真香。
radish|/ˈrædɪʃ/|萝卜|This radish is very crunchy.|这萝卜很脆。`,
    "果菜类": `
tomato|/təˈmeɪtoʊ/|西红柿|Tomato and egg is a classic dish.|西红柿炒蛋是经典菜。
cucumber|/ˈkjuːkʌmbər/|黄瓜|Cucumber salad is refreshing.|拍黄瓜很清爽。
eggplant|/ˈeɡplænt/|茄子|I don't like eggplant.|我不喜欢茄子。
pepper|/ˈpepər/|甜椒；辣椒|Green peppers are good in stir-fries.|青椒适合炒菜。
pumpkin|/ˈpʌmpkɪn/|南瓜|Pumpkin soup is sweet.|南瓜汤是甜的。
corn|/kɔːrn/|玉米|We had corn on the cob.|我们吃了整根玉米。`,
    "豆类与菌菇": `
bean|/biːn/|豆子|Green beans are my favorite.|四季豆是我的最爱。
pea|/piː/|豌豆|Peas are small and green.|豌豆又小又绿。
tofu|/ˈtoʊfuː/|豆腐|Mapo tofu is very spicy.|麻婆豆腐很辣。
mushroom|/ˈmʌʃrʊm/|蘑菇|I'd like a mushroom pizza.|我要一个蘑菇披萨。
bean sprouts|/ˈbiːn spraʊts/|豆芽|Stir-fry the bean sprouts quickly.|豆芽要快炒。`,
    "蔬菜相关": `
vegetable|/ˈvedʒtəbl/|蔬菜|Eat more vegetables.|多吃蔬菜。
salad|/ˈsæləd/|沙拉|I'll just have a salad.|我就吃份沙拉吧。
fresh|/freʃ/|新鲜的|These vegetables are very fresh.|这些蔬菜很新鲜。
vegetarian|/ˌvedʒəˈteriən/|素食者|She's a vegetarian.|她是素食者。`,
  });

  add("body", "身体部位", "Body", "🧍", "头部五官、上半身、下半身、手脚和内部器官", {
    "头部五官": `
head|/hed/|头|My head hurts.|我头疼。
face|/feɪs/|脸|Wash your face.|洗洗脸。
eye|/aɪ/|眼睛|She has big eyes.|她有一双大眼睛。
ear|/ɪr/|耳朵|I can't hear with this ear.|这只耳朵听不见。
nose|/noʊz/|鼻子|My nose is running.|我在流鼻涕。
mouth|/maʊθ/|嘴|Open your mouth, please.|请张开嘴。
tooth|/tuːθ/|牙齿（复数 teeth）|Brush your teeth twice a day.|每天刷两次牙。
hair|/her/|头发|She has long hair.|她留着长发。`,
    "上半身": `
neck|/nek/|脖子|My neck is stiff.|我脖子僵硬。
shoulder|/ˈʃoʊldər/|肩膀|He hurt his shoulder.|他肩膀受伤了。
arm|/ɑːrm/|手臂|She broke her arm.|她摔断了胳膊。
chest|/tʃest/|胸部|I have a pain in my chest.|我胸口疼。
back|/bæk/|背|My back hurts after sitting all day.|坐了一整天背很疼。
stomach|/ˈstʌmək/|肚子；胃|My stomach is full.|我吃饱了。`,
    "下半身": `
leg|/leɡ/|腿|My legs are tired.|我的腿很累。
knee|/niː/|膝盖|I hurt my knee playing football.|我踢球伤了膝盖。
hip|/hɪp/|臀部；髋部|She put her hands on her hips.|她双手叉腰。
ankle|/ˈæŋkl/|脚踝|I twisted my ankle.|我扭伤了脚踝。`,
    "手和脚": `
hand|/hænd/|手|Raise your hand.|举手。
finger|/ˈfɪŋɡər/|手指|I cut my finger.|我割伤了手指。
thumb|/θʌm/|大拇指|Give me a thumbs up!|给我点个赞！
nail|/neɪl/|指甲|Don't bite your nails.|别咬指甲。
foot|/fʊt/|脚（复数 feet）|My feet are cold.|我的脚很冷。
toe|/toʊ/|脚趾|I stubbed my toe.|我撞到了脚趾。
wrist|/rɪst/|手腕|He wears a watch on his wrist.|他手腕上戴着手表。`,
    "内部器官": `
heart|/hɑːrt/|心脏|Exercise is good for your heart.|运动对心脏有好处。
brain|/breɪn/|大脑|The brain needs sleep.|大脑需要睡眠。
lung|/lʌŋ/|肺|Smoking damages your lungs.|吸烟损害肺。
bone|/boʊn/|骨头|Milk makes your bones strong.|牛奶让骨骼强壮。
blood|/blʌd/|血|He lost a lot of blood.|他失了很多血。
skin|/skɪn/|皮肤|Protect your skin from the sun.|保护皮肤免受日晒。`,
  });

  add("flowers", "花", "Flowers", "🌸", "常见花卉、花园花卉、花的部分和相关描述", {
    "常见花卉": `
rose|/roʊz/|玫瑰|He gave her a red rose.|他送了她一朵红玫瑰。
lily|/ˈlɪli/|百合|Lilies smell very sweet.|百合花很香。
tulip|/ˈtuːlɪp/|郁金香|The Netherlands is famous for tulips.|荷兰以郁金香闻名。
sunflower|/ˈsʌnflaʊər/|向日葵|Sunflowers turn toward the sun.|向日葵朝着太阳转。
daisy|/ˈdeɪzi/|雏菊|Daisies are white and yellow.|雏菊是白色和黄色的。
orchid|/ˈɔːrkɪd/|兰花|Orchids are hard to grow.|兰花很难养。`,
    "中国常见花": `
lotus|/ˈloʊtəs/|莲花；荷花|The lotus grows in ponds.|荷花生长在池塘里。
peony|/ˈpiːəni/|牡丹|The peony is called the king of flowers.|牡丹被称为花中之王。
chrysanthemum|/krɪˈsænθəməm/|菊花|Chrysanthemum tea is good in summer.|夏天喝菊花茶很好。
plum blossom|/ˈplʌm blɑːsəm/|梅花|Plum blossoms bloom in winter.|梅花在冬天开放。
jasmine|/ˈdʒæzmɪn/|茉莉花|I love jasmine tea.|我喜欢茉莉花茶。
cherry blossom|/ˈtʃeri blɑːsəm/|樱花|We went to see the cherry blossoms.|我们去看樱花了。`,
    "花的部分": `
petal|/ˈpetl/|花瓣|The petals fell to the ground.|花瓣落到了地上。
stem|/stem/|茎|Cut the stems before putting them in water.|插入水中前先修剪花茎。
leaf|/liːf/|叶子|This plant has big leaves.|这株植物叶子很大。
thorn|/θɔːrn/|刺|Roses have sharp thorns.|玫瑰有尖刺。
bud|/bʌd/|花蕾|The buds will open next week.|花蕾下周会开。`,
    "花相关": `
bouquet|/buˈkeɪ/|花束|She got a bouquet on her birthday.|她生日时收到了一束花。
vase|/veɪs/|花瓶|Put the flowers in a vase.|把花插进花瓶。
fragrant|/ˈfreɪɡrənt/|芳香的|The garden is full of fragrant flowers.|花园里满是芳香的花。
wither|/ˈwɪðər/|枯萎|The flowers withered without water.|花没水枯萎了。
florist|/ˈflɔːrɪst/|花店；花商|I bought them at the florist's.|我在花店买的。`,
  });

  add("jobs", "职业", "Jobs", "👩‍⚕️", "医疗、教育、商业办公、服务、技术和艺术类职业", {
    "医疗类": `
doctor|/ˈdɑːktər/|医生|She wants to be a doctor.|她想当医生。
nurse|/nɜːrs/|护士|The nurse was very kind.|护士非常和善。
dentist|/ˈdentɪst/|牙医|I see the dentist twice a year.|我一年看两次牙医。
pharmacist|/ˈfɑːrməsɪst/|药剂师|Ask the pharmacist about the medicine.|关于这药问问药剂师。
vet|/vet/|兽医|We took our dog to the vet.|我们带狗去看了兽医。`,
    "教育类": `
teacher|/ˈtiːtʃər/|老师|My mom is a teacher.|我妈妈是老师。
professor|/prəˈfesər/|教授|The professor gave a great lecture.|教授讲了一堂很棒的课。
librarian|/laɪˈbreriən/|图书管理员|Ask the librarian for help.|找图书管理员帮忙。
tutor|/ˈtuːtər/|家庭教师|I have an English tutor.|我有一位英语家教。`,
    "商业办公类": `
manager|/ˈmænɪdʒər/|经理|I'd like to speak to the manager.|我想和经理谈谈。
accountant|/əˈkaʊntənt/|会计|My sister is an accountant.|我姐姐是会计。
lawyer|/ˈlɔːjər/|律师|You should talk to a lawyer.|你应该找律师谈谈。
secretary|/ˈsekrəteri/|秘书|The secretary answered the phone.|秘书接了电话。
salesperson|/ˈseɪlzpɜːrsn/|销售员|The salesperson was very helpful.|销售员很热情。`,
    "服务类": `
waiter|/ˈweɪtər/|服务员|The waiter brought us the menu.|服务员给我们拿来了菜单。
chef|/ʃef/|厨师|The chef is famous for his noodles.|这位厨师以他的面条出名。
driver|/ˈdraɪvər/|司机|The taxi driver was friendly.|出租车司机很友好。
police officer|/pəˈliːs ɔːfɪsər/|警察|Ask a police officer for directions.|向警察问路。
firefighter|/ˈfaɪərfaɪtər/|消防员|Firefighters are very brave.|消防员非常勇敢。
cashier|/kæˈʃɪr/|收银员|Pay the cashier over there.|去那边的收银员那儿付款。`,
    "技术类": `
engineer|/ˌendʒɪˈnɪr/|工程师|My dad is an engineer.|我爸爸是工程师。
programmer|/ˈproʊɡræmər/|程序员|Programmers write code.|程序员写代码。
scientist|/ˈsaɪəntɪst/|科学家|She is a famous scientist.|她是一位著名的科学家。
mechanic|/məˈkænɪk/|机械师；修车工|The mechanic fixed my car.|修车工修好了我的车。
electrician|/ɪˌlekˈtrɪʃn/|电工|Call an electrician to fix the lights.|叫电工来修灯。`,
    "艺术媒体类": `
artist|/ˈɑːrtɪst/|艺术家|The artist painted a portrait.|艺术家画了一幅肖像。
actor|/ˈæktər/|演员|He is a famous actor.|他是一位著名演员。
writer|/ˈraɪtər/|作家|She is a writer of children's books.|她是儿童读物作家。
photographer|/fəˈtɑːɡrəfər/|摄影师|The photographer took our wedding photos.|摄影师给我们拍了婚纱照。
journalist|/ˈdʒɜːrnəlɪst/|记者|The journalist asked many questions.|记者问了很多问题。
designer|/dɪˈzaɪnər/|设计师|She is a fashion designer.|她是一名时装设计师。`,
  });

  add("furniture", "家具", "Furniture", "🛋️", "客厅、卧室、餐厅和书房家具", {
    "客厅": `
sofa|/ˈsoʊfə/|沙发|The cat is sleeping on the sofa.|猫在沙发上睡觉。
armchair|/ˈɑːrmtʃer/|扶手椅|Grandpa sits in his armchair.|爷爷坐在他的扶手椅上。
coffee table|/ˈkɔːfi teɪbl/|茶几|Put your cup on the coffee table.|把杯子放在茶几上。
TV stand|/ˌtiː ˈviː stænd/|电视柜|We bought a new TV stand.|我们买了一个新电视柜。
carpet|/ˈkɑːrpɪt/|地毯|Don't spill anything on the carpet.|别把东西洒在地毯上。
curtain|/ˈkɜːrtn/|窗帘|Close the curtains, please.|请拉上窗帘。
lamp|/læmp/|灯|Turn on the lamp.|打开台灯。`,
    "卧室": `
bed|/bed/|床|I go to bed at eleven.|我十一点睡觉。
pillow|/ˈpɪloʊ/|枕头|This pillow is too soft.|这个枕头太软了。
blanket|/ˈblæŋkɪt/|毯子|I need another blanket.|我还需要一条毯子。
wardrobe|/ˈwɔːrdroʊb/|衣柜|Hang your clothes in the wardrobe.|把衣服挂进衣柜。
closet|/ˈklɑːzɪt/|壁橱（美式）|My closet is full of clothes.|我的衣橱塞满了衣服。
mirror|/ˈmɪrər/|镜子|She looked in the mirror.|她照了照镜子。
drawer|/drɔːr/|抽屉|The keys are in the top drawer.|钥匙在最上面的抽屉里。`,
    "餐厅": `
dining table|/ˈdaɪnɪŋ teɪbl/|餐桌|We sat around the dining table.|我们围坐在餐桌旁。
chair|/tʃer/|椅子|Pull up a chair.|拉把椅子过来坐。
stool|/stuːl/|凳子|He sat on a stool at the bar.|他坐在吧台的凳子上。
cupboard|/ˈkʌbərd/|橱柜|The cups are in the cupboard.|杯子在橱柜里。`,
    "书房": `
desk|/desk/|书桌|I do my homework at my desk.|我在书桌上写作业。
bookshelf|/ˈbʊkʃelf/|书架|The bookshelf is full of novels.|书架上摆满了小说。
office chair|/ˈɔːfɪs tʃer/|办公椅|I need a comfortable office chair.|我需要一把舒服的办公椅。
furniture|/ˈfɜːrnɪtʃər/|家具（不可数）|We bought some new furniture.|我们买了些新家具。`,
  });
})();
