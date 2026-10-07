// 主题词汇（第 2 批）：每行「单词|美式音标|中文|例句|例句翻译」
(function () {
  const T = (window.TOPICS = window.TOPICS || []);
  const add = (id, title, en, icon, desc, groups) => T.push({ id, title, en, icon, desc, groups: Object.entries(groups).map(([g, text]) => ({ title: g, words: text.trim().split("\n").map((l) => l.split("|").map((s) => s.trim())) })) });

  add("family", "家庭成员", "Family", "👨‍👩‍👧", "核心家庭、祖辈、亲戚、姻亲和年龄称谓", {
    "核心家庭": `
family|/ˈfæməli/|家庭|I have a big family.|我有一个大家庭。
parents|/ˈperənts/|父母|My parents live in the countryside.|我父母住在乡下。
father|/ˈfɑːðər/|父亲|My father is a doctor.|我父亲是医生。
mother|/ˈmʌðər/|母亲|My mother cooks very well.|我妈妈做饭很好吃。
son|/sʌn/|儿子|Their son is five years old.|他们的儿子五岁了。
daughter|/ˈdɔːtər/|女儿|She has two daughters.|她有两个女儿。
brother|/ˈbrʌðər/|兄弟|My brother is two years older than me.|我哥哥比我大两岁。
sister|/ˈsɪstər/|姐妹|My little sister loves drawing.|我妹妹喜欢画画。`,
    "祖辈与孙辈": `
grandfather|/ˈɡrænfɑːðər/|祖父；外祖父|My grandfather tells great stories.|我爷爷很会讲故事。
grandmother|/ˈɡrænmʌðər/|祖母；外祖母|Grandmother made us dumplings.|奶奶给我们包了饺子。
grandparents|/ˈɡrænperənts/|祖父母|We visit our grandparents every Sunday.|我们每周日去看祖父母。
grandson|/ˈɡrænsʌn/|孙子；外孙|She is proud of her grandson.|她为孙子感到骄傲。
granddaughter|/ˈɡrændɔːtər/|孙女；外孙女|Their granddaughter was born last month.|他们的孙女上个月出生了。`,
    "亲戚": `
uncle|/ˈʌŋkl/|叔叔；舅舅；伯伯|My uncle lives in Canada.|我舅舅住在加拿大。
aunt|/ænt/|阿姨；姑姑；婶婶|My aunt is a nurse.|我姑姑是护士。
cousin|/ˈkʌzn/|堂/表兄弟姐妹|My cousin and I are the same age.|我和表哥同岁。
nephew|/ˈnefjuː/|侄子；外甥|My nephew is learning to walk.|我侄子在学走路。
niece|/niːs/|侄女；外甥女|I bought a doll for my niece.|我给外甥女买了个娃娃。
relative|/ˈrelətɪv/|亲戚|All our relatives came for the wedding.|我们所有亲戚都来参加婚礼了。`,
    "姻亲与婚姻": `
husband|/ˈhʌzbənd/|丈夫|Her husband is a teacher.|她丈夫是老师。
wife|/waɪf/|妻子|This is my wife, Lily.|这是我妻子莉莉。
couple|/ˈkʌpl/|夫妻；情侣|They are a lovely couple.|他们是很般配的一对。
wedding|/ˈwedɪŋ/|婚礼|The wedding is next Saturday.|婚礼在下周六。
father-in-law|/ˈfɑːðər ɪn lɔː/|岳父；公公|My father-in-law loves fishing.|我岳父喜欢钓鱼。
mother-in-law|/ˈmʌðər ɪn lɔː/|岳母；婆婆|I get along well with my mother-in-law.|我和婆婆相处得很好。`,
    "年龄称谓": `
baby|/ˈbeɪbi/|婴儿|The baby is sleeping.|宝宝在睡觉。
child|/tʃaɪld/|孩子|Every child needs love.|每个孩子都需要爱。
teenager|/ˈtiːneɪdʒər/|青少年|He is a typical teenager.|他是个典型的青少年。
adult|/əˈdʌlt/|成年人|Tickets are $10 for adults.|成人票 10 美元。
twins|/twɪnz/|双胞胎|The twins look exactly alike.|这对双胞胎长得一模一样。`,
  });

  add("colors", "颜色", "Colors", "🎨", "基础颜色、混合色和色调描述", {
    "基础颜色": `
red|/red/|红色|She is wearing a red dress.|她穿着一条红裙子。
blue|/bluː/|蓝色|The sky is blue.|天空是蓝色的。
yellow|/ˈjeloʊ/|黄色|Bananas are yellow.|香蕉是黄色的。
green|/ɡriːn/|绿色|The leaves are green in summer.|夏天树叶是绿色的。
black|/blæk/|黑色|He always wears black.|他总是穿黑色。
white|/waɪt/|白色|Snow is white.|雪是白色的。
orange|/ˈɔːrɪndʒ/|橙色|The sky turned orange at sunset.|日落时天空变成了橙色。
purple|/ˈpɜːrpl/|紫色|Purple is my favorite color.|紫色是我最喜欢的颜色。
pink|/pɪŋk/|粉色|The baby's room is pink.|宝宝的房间是粉色的。
brown|/braʊn/|棕色|He has brown eyes.|他有一双棕色的眼睛。`,
    "更多颜色": `
gray|/ɡreɪ/|灰色|It's a gray, rainy day.|这是一个灰蒙蒙的雨天。
gold|/ɡoʊld/|金色|She wore a gold necklace.|她戴着一条金项链。
silver|/ˈsɪlvər/|银色|I want a silver car.|我想要一辆银色的车。
beige|/beɪʒ/|米色|The walls are painted beige.|墙刷成了米色。
navy|/ˈneɪvi/|深蓝色；海军蓝|He wore a navy suit.|他穿了一套深蓝色西装。
violet|/ˈvaɪələt/|紫罗兰色|Violet is between blue and purple.|紫罗兰色介于蓝和紫之间。
turquoise|/ˈtɜːrkwɔɪz/|青绿色|The sea was a beautiful turquoise.|海水是漂亮的青绿色。`,
    "色调描述": `
light|/laɪt/|浅色的|I like light blue.|我喜欢浅蓝色。
dark|/dɑːrk/|深色的|He has dark hair.|他头发是深色的。
bright|/braɪt/|鲜艳的|Children love bright colors.|孩子们喜欢鲜艳的颜色。
pale|/peɪl/|淡的；苍白的|You look pale. Are you OK?|你脸色很苍白，没事吧？
colorful|/ˈkʌlərfl/|色彩丰富的|The market is full of colorful fruit.|市场上满是五颜六色的水果。
color|/ˈkʌlər/|颜色|What color is your car?|你的车是什么颜色的？`,
  });

  add("transport", "交通工具", "Transport", "🚌", "陆地、水上、空中交通和交通设施、动作", {
    "陆地交通": `
car|/kɑːr/|汽车|I drive my car to work.|我开车上班。
bus|/bʌs/|公交车|The bus is late again.|公交车又晚点了。
taxi|/ˈtæksi/|出租车|Let's take a taxi.|我们打车吧。
subway|/ˈsʌbweɪ/|地铁|The subway is the fastest way.|坐地铁最快。
train|/treɪn/|火车|The train leaves at 8:30.|火车 8 点半出发。
bicycle|/ˈbaɪsɪkl/|自行车|I ride my bicycle to school.|我骑自行车上学。
motorcycle|/ˈmoʊtərsaɪkl/|摩托车|He rides a motorcycle.|他骑摩托车。
truck|/trʌk/|卡车|A big truck blocked the road.|一辆大卡车挡住了路。`,
    "水上与空中": `
boat|/boʊt/|小船|We rowed a boat on the lake.|我们在湖上划船。
ship|/ʃɪp/|轮船|The ship sailed across the ocean.|轮船横渡大洋。
ferry|/ˈferi/|渡轮|We took the ferry to the island.|我们坐渡轮去了岛上。
plane|/pleɪn/|飞机|The plane landed safely.|飞机安全着陆了。
helicopter|/ˈhelɪkɑːptər/|直升机|A helicopter flew over the city.|一架直升机飞过城市上空。`,
    "交通设施": `
station|/ˈsteɪʃn/|车站|Meet me at the station.|在车站等我。
airport|/ˈerpɔːrt/|机场|How long does it take to get to the airport?|去机场要多长时间？
traffic light|/ˈtræfɪk laɪt/|红绿灯|Turn left at the traffic light.|在红绿灯处左转。
crosswalk|/ˈkrɔːswɔːk/|人行横道|Cross the street at the crosswalk.|走人行横道过马路。
highway|/ˈhaɪweɪ/|公路；高速公路|The highway was very busy.|高速公路很拥堵。
parking lot|/ˈpɑːrkɪŋ lɑːt/|停车场|The parking lot is full.|停车场满了。
ticket|/ˈtɪkɪt/|票|I bought a one-way ticket.|我买了一张单程票。`,
    "交通动作": `
drive|/draɪv/|开车|Can you drive?|你会开车吗？
ride|/raɪd/|骑；乘坐|I ride my bike every day.|我每天骑自行车。
get on|/ɡet ɑːn/|上（车）|Get on the bus quickly.|快上公交车。
get off|/ɡet ɔːf/|下（车）|Get off at the next stop.|下一站下车。
transfer|/trænsˈfɜːr/|换乘|You need to transfer at the next station.|你需要在下一站换乘。
traffic jam|/ˈtræfɪk dʒæm/|交通堵塞|Sorry, I was stuck in a traffic jam.|抱歉，我堵车了。`,
  });

  add("music", "音乐", "Music", "🎵", "乐器、音乐类型、音乐元素和音乐人", {
    "乐器": `
piano|/piˈænoʊ/|钢琴|She plays the piano very well.|她钢琴弹得很好。
guitar|/ɡɪˈtɑːr/|吉他|He is learning the guitar.|他在学吉他。
violin|/ˌvaɪəˈlɪn/|小提琴|The violin sounds beautiful.|小提琴声音很美。
drum|/drʌm/|鼓|My neighbor plays the drums every night.|我邻居每晚都打鼓。
flute|/fluːt/|长笛|She plays the flute in the band.|她在乐队里吹长笛。
trumpet|/ˈtrʌmpɪt/|小号|The trumpet is very loud.|小号声音很响。`,
    "音乐类型": `
pop|/pɑːp/|流行音乐|I mostly listen to pop music.|我主要听流行音乐。
rock|/rɑːk/|摇滚乐|He loves rock music.|他爱听摇滚。
jazz|/dʒæz/|爵士乐|This café plays jazz all day.|这家咖啡馆整天放爵士乐。
classical|/ˈklæsɪkl/|古典的|Classical music helps me relax.|古典音乐让我放松。
hip-hop|/ˈhɪp hɑːp/|嘻哈|Hip-hop is popular with young people.|嘻哈很受年轻人欢迎。
folk|/foʊk/|民谣|I enjoy folk songs.|我喜欢民谣。`,
    "音乐元素": `
song|/sɔːŋ/|歌曲|This is my favorite song.|这是我最喜欢的歌。
melody|/ˈmelədi/|旋律|The melody is easy to remember.|旋律很好记。
rhythm|/ˈrɪðəm/|节奏|Clap to the rhythm.|跟着节奏拍手。
lyrics|/ˈlɪrɪks/|歌词|I don't understand the lyrics.|我听不懂歌词。
album|/ˈælbəm/|专辑|Their new album is great.|他们的新专辑很棒。
concert|/ˈkɑːnsərt/|音乐会；演唱会|We went to a concert last night.|我们昨晚去了音乐会。`,
    "音乐人": `
singer|/ˈsɪŋər/|歌手|She is a famous singer.|她是一位著名歌手。
band|/bænd/|乐队|They started a band in college.|他们在大学时组了个乐队。
musician|/mjuˈzɪʃn/|音乐家|He wants to be a musician.|他想当音乐家。
composer|/kəmˈpoʊzər/|作曲家|Mozart was a great composer.|莫扎特是伟大的作曲家。
audience|/ˈɔːdiəns/|观众|The audience clapped loudly.|观众热烈鼓掌。`,
  });

  add("hobbies", "爱好", "Hobbies", "🎯", "创意类、户外类、娱乐类和收藏类爱好", {
    "创意类": `
drawing|/ˈdrɔːɪŋ/|画画|Drawing helps me relax.|画画让我放松。
painting|/ˈpeɪntɪŋ/|绘画（上色）|She took up painting last year.|她去年开始学画画。
photography|/fəˈtɑːɡrəfi/|摄影|I'm interested in photography.|我对摄影感兴趣。
writing|/ˈraɪtɪŋ/|写作|He enjoys writing short stories.|他喜欢写短篇小说。
cooking|/ˈkʊkɪŋ/|烹饪|Cooking is my favorite hobby.|做饭是我最喜欢的爱好。
knitting|/ˈnɪtɪŋ/|编织|My grandma loves knitting.|我奶奶喜欢织毛衣。`,
    "户外类": `
hiking|/ˈhaɪkɪŋ/|徒步|We go hiking every weekend.|我们每周末去徒步。
camping|/ˈkæmpɪŋ/|露营|Camping under the stars is amazing.|在星空下露营太棒了。
fishing|/ˈfɪʃɪŋ/|钓鱼|My dad goes fishing on Sundays.|我爸爸周日去钓鱼。
cycling|/ˈsaɪklɪŋ/|骑行|Cycling is good exercise.|骑行是很好的锻炼。
gardening|/ˈɡɑːrdnɪŋ/|园艺|She spends hours gardening.|她花几个小时打理花园。`,
    "娱乐类": `
reading|/ˈriːdɪŋ/|阅读|Reading is a great way to relax.|阅读是很好的放松方式。
gaming|/ˈɡeɪmɪŋ/|打游戏|He spends too much time gaming.|他打游戏花的时间太多了。
dancing|/ˈdænsɪŋ/|跳舞|She loves dancing at parties.|她喜欢在聚会上跳舞。
singing|/ˈsɪŋɪŋ/|唱歌|We went singing at a karaoke bar.|我们去 KTV 唱歌了。
watching movies|/ˈwɑːtʃɪŋ ˈmuːviz/|看电影|Watching movies is fun.|看电影很有意思。
chess|/tʃes/|国际象棋|Do you know how to play chess?|你会下国际象棋吗？`,
    "收藏与其他": `
collecting|/kəˈlektɪŋ/|收藏|He enjoys collecting coins.|他喜欢收集硬币。
stamp|/stæmp/|邮票|My uncle collects old stamps.|我叔叔收集旧邮票。
hobby|/ˈhɑːbi/|爱好|What are your hobbies?|你有什么爱好？
free time|/ˌfriː ˈtaɪm/|空闲时间|What do you do in your free time?|你空闲时间做什么？
be into|/bi ˈɪntuː/|热衷于|I'm really into yoga these days.|我最近很迷瑜伽。`,
  });

  add("travel", "旅行", "Travel", "✈️", "住宿、景点、旅行用品和旅行动作", {
    "住宿": `
hotel|/hoʊˈtel/|酒店|We stayed at a nice hotel.|我们住在一家不错的酒店。
hostel|/ˈhɑːstl/|青年旅舍|Hostels are cheap for students.|青年旅舍对学生来说很便宜。
reservation|/ˌrezərˈveɪʃn/|预订|I have a reservation for two nights.|我预订了两晚。
check in|/ˌtʃek ˈɪn/|办理入住|We checked in at 3 p.m.|我们下午三点办理了入住。
check out|/ˌtʃek ˈaʊt/|退房|What time do we need to check out?|我们几点要退房？
single room|/ˌsɪŋɡl ˈruːm/|单人间|I'd like a single room, please.|我要一间单人间。`,
    "景点": `
museum|/mjuˈziːəm/|博物馆|The museum is closed on Mondays.|博物馆周一闭馆。
castle|/ˈkæsl/|城堡|We visited an old castle.|我们参观了一座古堡。
temple|/ˈtempl/|寺庙|The temple is 800 years old.|这座寺庙有 800 年历史。
tower|/ˈtaʊər/|塔|You can see the whole city from the tower.|从塔上可以看到整个城市。
landmark|/ˈlændmɑːrk/|地标|The bridge is a famous landmark.|这座桥是著名地标。
sightseeing|/ˈsaɪtsiːɪŋ/|观光|We went sightseeing in Rome.|我们在罗马观光。`,
    "旅行用品": `
passport|/ˈpæspɔːrt/|护照|Don't forget your passport!|别忘了带护照！
luggage|/ˈlʌɡɪdʒ/|行李|My luggage is too heavy.|我的行李太重了。
suitcase|/ˈsuːtkeɪs/|行李箱|I packed my suitcase last night.|我昨晚收拾好了行李箱。
backpack|/ˈbækpæk/|双肩包|I travel with just a backpack.|我只背一个双肩包旅行。
map|/mæp/|地图|Let's check the map.|我们看看地图吧。
visa|/ˈviːzə/|签证|Do I need a visa to visit Japan?|去日本需要签证吗？`,
    "旅行动作": `
travel|/ˈtrævl/|旅行|I love to travel.|我喜欢旅行。
book|/bʊk/|预订|I booked a flight to Paris.|我订了去巴黎的机票。
pack|/pæk/|收拾（行李）|Have you packed yet?|你收拾好行李了吗？
explore|/ɪkˈsplɔːr/|探索|Let's explore the old town.|我们去逛逛老城吧。
tour|/tʊr/|游览；旅游团|We joined a city tour.|我们参加了一个城市观光团。
souvenir|/ˌsuːvəˈnɪr/|纪念品|I bought some souvenirs for my friends.|我给朋友们买了些纪念品。`,
  });

  add("health", "健康", "Health", "🩺", "常见症状、医疗场所与人员、药品治疗和健康习惯", {
    "常见症状": `
headache|/ˈhedeɪk/|头痛|I have a terrible headache.|我头痛得厉害。
fever|/ˈfiːvər/|发烧|She has a high fever.|她发高烧了。
cough|/kɔːf/|咳嗽|I've had a cough for a week.|我咳嗽一个星期了。
cold|/koʊld/|感冒|I think I'm catching a cold.|我好像要感冒了。
sore throat|/ˌsɔːr ˈθroʊt/|喉咙痛|I have a sore throat.|我喉咙痛。
stomachache|/ˈstʌməkeɪk/|胃痛|I ate too much and got a stomachache.|我吃太多，胃疼了。
dizzy|/ˈdɪzi/|头晕的|I feel dizzy.|我觉得头晕。`,
    "医疗场所与人员": `
hospital|/ˈhɑːspɪtl/|医院|He was taken to the hospital.|他被送进了医院。
clinic|/ˈklɪnɪk/|诊所|There's a clinic near my home.|我家附近有个诊所。
pharmacy|/ˈfɑːrməsi/|药店|You can buy it at the pharmacy.|你可以在药店买到。
doctor|/ˈdɑːktər/|医生|You should see a doctor.|你应该去看医生。
nurse|/nɜːrs/|护士|The nurse took my temperature.|护士给我量了体温。
dentist|/ˈdentɪst/|牙医|I'm afraid of the dentist.|我害怕看牙医。`,
    "药品与治疗": `
medicine|/ˈmedsn/|药|Take this medicine three times a day.|这药一天吃三次。
pill|/pɪl/|药片|Take two pills after meals.|饭后吃两片。
prescription|/prɪˈskrɪpʃn/|处方|You need a prescription for this.|这个需要处方。
injection|/ɪnˈdʒekʃn/|注射；打针|The child is afraid of injections.|孩子害怕打针。
surgery|/ˈsɜːrdʒəri/|手术|He needs surgery on his knee.|他的膝盖需要做手术。
recover|/rɪˈkʌvər/|康复|I hope you recover soon.|希望你早日康复。`,
    "健康习惯": `
exercise|/ˈeksərsaɪz/|锻炼|Regular exercise is important.|经常锻炼很重要。
diet|/ˈdaɪət/|饮食|Eat a balanced diet.|饮食要均衡。
healthy|/ˈhelθi/|健康的|Vegetables are healthy.|蔬菜有益健康。
checkup|/ˈtʃekʌp/|体检|I have a checkup every year.|我每年做一次体检。
rest|/rest/|休息|You need some rest.|你需要休息一下。
stress|/stres/|压力|Too much stress can make you sick.|压力过大会让人生病。`,
  });

  add("weather", "天气", "Weather", "⛅", "晴天、雨天、冬天、风和温度描述", {
    "晴天": `
sunny|/ˈsʌni/|晴朗的|It's sunny today.|今天天气晴朗。
clear|/klɪr/|晴朗无云的|The sky is clear tonight.|今晚夜空晴朗。
warm|/wɔːrm/|温暖的|It's warm and sunny.|天气温暖晴朗。
hot|/hɑːt/|炎热的|It's too hot to go out.|太热了，出不去。
dry|/draɪ/|干燥的|The air is very dry here.|这里空气很干燥。`,
    "雨天": `
rain|/reɪn/|雨；下雨|It's going to rain.|要下雨了。
rainy|/ˈreɪni/|下雨的|I don't like rainy days.|我不喜欢下雨天。
cloudy|/ˈklaʊdi/|多云的|It's cloudy this morning.|今天早上多云。
shower|/ˈʃaʊər/|阵雨|There will be showers in the afternoon.|下午有阵雨。
storm|/stɔːrm/|暴风雨|The storm knocked down trees.|暴风雨把树刮倒了。
umbrella|/ʌmˈbrelə/|雨伞|Take an umbrella with you.|带把伞吧。
wet|/wet/|湿的|My shoes are wet.|我的鞋湿了。`,
    "冬天": `
snowy|/ˈsnoʊi/|下雪的|It was a snowy morning.|那是一个下雪的早晨。
cold|/koʊld/|冷的|It's really cold today.|今天真冷。
frost|/frɔːst/|霜|There was frost on the window.|窗户上结了霜。
icy|/ˈaɪsi/|结冰的|The roads are icy.|路面结冰了。
foggy|/ˈfɔːɡi/|有雾的|It's too foggy to drive.|雾太大了，没法开车。`,
    "风": `
wind|/wɪnd/|风|The wind is very strong.|风很大。
windy|/ˈwɪndi/|有风的|It's windy outside.|外面在刮风。
typhoon|/taɪˈfuːn/|台风|A typhoon is coming.|台风要来了。
tornado|/tɔːrˈneɪdoʊ/|龙卷风|The tornado destroyed many houses.|龙卷风摧毁了很多房子。`,
    "温度与预报": `
temperature|/ˈtemprətʃər/|温度|The temperature is 25 degrees.|温度是 25 度。
degree|/dɪˈɡriː/|度|It's minus five degrees.|零下五度。
forecast|/ˈfɔːrkæst/|预报|Check the weather forecast.|看一下天气预报。
humid|/ˈhjuːmɪd/|潮湿的|It's hot and humid.|又热又潮。
mild|/maɪld/|温和的|Winters here are mild.|这里的冬天很温和。`,
  });

  add("school", "学校", "School", "🏫", "学校场所、学习用品、学科、人员和考试", {
    "学校场所": `
classroom|/ˈklæsruːm/|教室|The classroom is on the second floor.|教室在二楼。
library|/ˈlaɪbreri/|图书馆|I study in the library.|我在图书馆学习。
playground|/ˈpleɪɡraʊnd/|操场|The kids are on the playground.|孩子们在操场上。
lab|/læb/|实验室|We did an experiment in the lab.|我们在实验室做了个实验。
dormitory|/ˈdɔːrmətɔːri/|宿舍|I lived in a dormitory in college.|我大学时住宿舍。
canteen|/kænˈtiːn/|食堂|Let's eat at the canteen.|我们去食堂吃吧。`,
    "学习用品": `
pen|/pen/|钢笔|Can I borrow a pen?|能借我支笔吗？
pencil|/ˈpensl/|铅笔|Write your name in pencil.|用铅笔写上你的名字。
eraser|/ɪˈreɪsər/|橡皮|I need an eraser.|我需要一块橡皮。
textbook|/ˈtekstbʊk/|课本|Open your textbook to page 20.|把课本翻到第 20 页。
dictionary|/ˈdɪkʃəneri/|词典|Look it up in the dictionary.|在词典里查一下。
schoolbag|/ˈskuːlbæɡ/|书包|My schoolbag is very heavy.|我的书包很重。`,
    "学科": `
math|/mæθ/|数学|Math is my best subject.|数学是我最好的科目。
English|/ˈɪŋɡlɪʃ/|英语|I have an English class today.|我今天有英语课。
history|/ˈhɪstri/|历史|I love learning about history.|我喜欢学历史。
science|/ˈsaɪəns/|科学|Science helps us understand the world.|科学帮助我们了解世界。
physics|/ˈfɪzɪks/|物理|Physics is difficult for me.|物理对我来说很难。
chemistry|/ˈkemɪstri/|化学|We have chemistry on Friday.|我们周五有化学课。
geography|/dʒiˈɑːɡrəfi/|地理|Geography teaches us about places.|地理课教我们认识各地。`,
    "人员": `
teacher|/ˈtiːtʃər/|老师|Our teacher is very patient.|我们的老师很有耐心。
student|/ˈstuːdnt/|学生|There are 40 students in my class.|我们班有 40 个学生。
classmate|/ˈklæsmeɪt/|同学|She was my classmate in high school.|她是我高中同学。
principal|/ˈprɪnsəpl/|校长|The principal gave a speech.|校长发表了讲话。
professor|/prəˈfesər/|教授|He is a professor of physics.|他是物理学教授。`,
    "考试与学习": `
exam|/ɪɡˈzæm/|考试|I have an exam tomorrow.|我明天有考试。
homework|/ˈhoʊmwɜːrk/|家庭作业|Have you finished your homework?|你做完作业了吗？
grade|/ɡreɪd/|成绩；年级|She got good grades this term.|她这学期成绩很好。
pass|/pæs/|通过|I passed the driving test!|我驾照考试通过了！
fail|/feɪl/|不及格|He failed the math test.|他数学考试没及格。
semester|/sɪˈmestər/|学期|The new semester starts in September.|新学期九月开始。`,
  });

  add("animals", "动物", "Animals", "🐼", "家畜宠物、野生动物、海洋动物、鸟类和昆虫", {
    "家畜与宠物": `
dog|/dɔːɡ/|狗|The dog is barking.|狗在叫。
cat|/kæt/|猫|My cat sleeps all day.|我的猫整天睡觉。
rabbit|/ˈræbɪt/|兔子|The rabbit is eating a carrot.|兔子在吃胡萝卜。
horse|/hɔːrs/|马|Can you ride a horse?|你会骑马吗？
cow|/kaʊ/|奶牛|Cows give us milk.|奶牛给我们提供牛奶。
pig|/pɪɡ/|猪|The pig is rolling in the mud.|猪在泥里打滚。
sheep|/ʃiːp/|绵羊|There are many sheep on the hill.|山坡上有很多羊。
hamster|/ˈhæmstər/|仓鼠|My hamster runs on its wheel at night.|我的仓鼠晚上在轮子上跑。`,
    "野生动物": `
lion|/ˈlaɪən/|狮子|The lion is the king of animals.|狮子是百兽之王。
tiger|/ˈtaɪɡər/|老虎|Tigers are in danger of dying out.|老虎濒临灭绝。
elephant|/ˈelɪfənt/|大象|Elephants have long noses.|大象有长长的鼻子。
panda|/ˈpændə/|熊猫|Pandas eat bamboo.|熊猫吃竹子。
monkey|/ˈmʌŋki/|猴子|The monkey climbed the tree.|猴子爬上了树。
bear|/ber/|熊|Bears sleep through the winter.|熊冬眠一整个冬天。
wolf|/wʊlf/|狼|We heard a wolf at night.|我们夜里听到了狼叫。
giraffe|/dʒəˈræf/|长颈鹿|Giraffes have very long necks.|长颈鹿的脖子很长。`,
    "海洋动物": `
dolphin|/ˈdɑːlfɪn/|海豚|Dolphins are very smart.|海豚非常聪明。
whale|/weɪl/|鲸|The blue whale is the largest animal.|蓝鲸是最大的动物。
shark|/ʃɑːrk/|鲨鱼|Some sharks are dangerous.|有些鲨鱼很危险。
octopus|/ˈɑːktəpəs/|章鱼|An octopus has eight arms.|章鱼有八条腕足。
turtle|/ˈtɜːrtl/|海龟|Sea turtles can live for 100 years.|海龟能活 100 年。
crab|/kræb/|螃蟹|A crab walks sideways.|螃蟹横着走。`,
    "鸟类": `
bird|/bɜːrd/|鸟|Birds are singing in the trees.|鸟儿在树上唱歌。
eagle|/ˈiːɡl/|鹰|The eagle flew high in the sky.|老鹰在高空飞翔。
parrot|/ˈpærət/|鹦鹉|The parrot can say hello.|这只鹦鹉会说你好。
owl|/aʊl/|猫头鹰|Owls hunt at night.|猫头鹰在夜间捕猎。
penguin|/ˈpeŋɡwɪn/|企鹅|Penguins can't fly.|企鹅不会飞。
duck|/dʌk/|鸭子|Ducks are swimming in the pond.|鸭子在池塘里游泳。`,
    "昆虫": `
bee|/biː/|蜜蜂|Bees make honey.|蜜蜂酿蜂蜜。
butterfly|/ˈbʌtərflaɪ/|蝴蝶|A butterfly landed on the flower.|一只蝴蝶落在花上。
ant|/ænt/|蚂蚁|Ants work together.|蚂蚁齐心协力。
mosquito|/məˈskiːtoʊ/|蚊子|I was bitten by a mosquito.|我被蚊子咬了。
spider|/ˈspaɪdər/|蜘蛛|A spider is making a web.|一只蜘蛛在织网。`,
  });
})();
