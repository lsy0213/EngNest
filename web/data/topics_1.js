// 主题词汇（第 1 批）：每行「单词|美式音标|中文|例句|例句翻译」
(function () {
  const T = (window.TOPICS = window.TOPICS || []);
  const add = (id, title, en, icon, desc, groups) => T.push({ id, title, en, icon, desc, groups: Object.entries(groups).map(([g, text]) => ({ title: g, words: text.trim().split("\n").map((l) => l.split("|").map((s) => s.trim())) })) });

  add("emotions", "情绪", "Emotions", "😊", "积极、消极、中性和复杂情绪", {
    "积极情绪": `
happy|/ˈhæpi/|开心的|I'm so happy to see you.|见到你我真开心。
excited|/ɪkˈsaɪtɪd/|兴奋的|The kids are excited about the trip.|孩子们对这次旅行很兴奋。
proud|/praʊd/|自豪的|I'm proud of you.|我为你骄傲。
grateful|/ˈɡreɪtfl/|感激的|I'm grateful for your help.|我很感激你的帮助。
relieved|/rɪˈliːvd/|松了口气的|I was relieved to hear the news.|听到这个消息我松了口气。
delighted|/dɪˈlaɪtɪd/|非常高兴的|We are delighted to meet you.|我们非常高兴见到你。
hopeful|/ˈhoʊpfl/|充满希望的|She feels hopeful about the future.|她对未来充满希望。
cheerful|/ˈtʃɪrfl/|欢快的|He is always cheerful in the morning.|他早上总是很开朗。`,
    "消极情绪": `
sad|/sæd/|难过的|Why do you look so sad?|你为什么看起来这么难过？
angry|/ˈæŋɡri/|生气的|Don't be angry with me.|别生我的气。
worried|/ˈwɜːrid/|担心的|I'm worried about my exam.|我很担心我的考试。
scared|/skerd/|害怕的|She is scared of spiders.|她害怕蜘蛛。
lonely|/ˈloʊnli/|孤独的|He felt lonely in the new city.|在新城市里他感到孤独。
upset|/ʌpˈset/|心烦的|She was upset about the mistake.|她为这个错误感到心烦。
jealous|/ˈdʒeləs/|嫉妒的|He is jealous of his brother.|他嫉妒他的哥哥。
frustrated|/ˈfrʌstreɪtɪd/|沮丧的|I get frustrated when my computer is slow.|电脑一慢我就很烦躁。`,
    "中性情绪": `
calm|/kɑːm/|平静的|Stay calm and think.|保持冷静，想一想。
bored|/bɔːrd/|无聊的|I'm bored. Let's go out.|好无聊，我们出去吧。
surprised|/sərˈpraɪzd/|惊讶的|I was surprised to see him there.|在那儿看到他我很惊讶。
curious|/ˈkjʊriəs/|好奇的|Cats are curious animals.|猫是好奇的动物。
tired|/ˈtaɪərd/|累的|I'm too tired to cook tonight.|我今晚太累了，不想做饭。
confused|/kənˈfjuːzd/|困惑的|I'm confused. Can you explain again?|我有点糊涂，你能再解释一遍吗？
sleepy|/ˈsliːpi/|困的|I always feel sleepy after lunch.|我午饭后总是犯困。`,
    "复杂情绪": `
nervous|/ˈnɜːrvəs/|紧张的|I'm nervous about the interview.|我对面试感到紧张。
embarrassed|/ɪmˈbærəst/|尴尬的|I was embarrassed when I fell.|我摔倒时很尴尬。
guilty|/ˈɡɪlti/|内疚的|I feel guilty about lying to her.|我为骗了她感到内疚。
homesick|/ˈhoʊmsɪk/|想家的|Students often feel homesick at first.|学生们刚开始常常想家。
disappointed|/ˌdɪsəˈpɔɪntɪd/|失望的|I'm disappointed with the result.|我对结果很失望。
ashamed|/əˈʃeɪmd/|羞愧的|He was ashamed of his behavior.|他为自己的行为感到羞愧。
anxious|/ˈæŋkʃəs/|焦虑的|She gets anxious in crowds.|她在人群中会感到焦虑。`,
  });

  add("fruits", "水果", "Fruits", "🍎", "常见水果、热带水果、浆果和瓜类", {
    "常见水果": `
apple|/ˈæpl/|苹果|An apple a day keeps the doctor away.|一天一苹果，医生远离我。
banana|/bəˈnænə/|香蕉|Monkeys love bananas.|猴子喜欢香蕉。
pear|/per/|梨|This pear is very juicy.|这个梨水分很多。
peach|/piːtʃ/|桃子|Peaches are sweet in summer.|夏天的桃子很甜。
grape|/ɡreɪp/|葡萄|Wine is made from grapes.|葡萄酒是用葡萄酿的。
plum|/plʌm/|李子|There is a plum tree in our yard.|我们院子里有棵李子树。
cherry|/ˈtʃeri/|樱桃|She put a cherry on the cake.|她在蛋糕上放了一颗樱桃。
apricot|/ˈeɪprɪkɑːt/|杏|Dried apricots are a healthy snack.|杏干是健康的零食。`,
    "柑橘类": `
orange|/ˈɔːrɪndʒ/|橙子|I'd like a glass of orange juice.|我想要一杯橙汁。
lemon|/ˈlemən/|柠檬|Add some lemon to the tea.|在茶里加点柠檬。
lime|/laɪm/|青柠|The drink tastes of lime.|这饮料有青柠味。
grapefruit|/ˈɡreɪpfruːt/|葡萄柚|Grapefruit is a little bitter.|葡萄柚有点苦。
tangerine|/ˌtændʒəˈriːn/|橘子|Tangerines are easy to peel.|橘子很容易剥皮。`,
    "热带水果": `
mango|/ˈmæŋɡoʊ/|芒果|This mango is perfectly ripe.|这个芒果熟得正好。
pineapple|/ˈpaɪnæpl/|菠萝|Do you like pineapple on pizza?|你喜欢披萨上放菠萝吗？
coconut|/ˈkoʊkənʌt/|椰子|We drank coconut water on the beach.|我们在海边喝了椰子水。
papaya|/pəˈpaɪə/|木瓜|Papaya is good for digestion.|木瓜有助于消化。
lychee|/ˈliːtʃi/|荔枝|Lychees are popular in southern China.|荔枝在中国南方很受欢迎。
durian|/ˈdʊriən/|榴莲|Durian smells strong but tastes great.|榴莲闻着冲，吃着香。
kiwi|/ˈkiːwiː/|猕猴桃|Kiwis are full of vitamin C.|猕猴桃富含维生素 C。
avocado|/ˌævəˈkɑːdoʊ/|牛油果|I had avocado toast for breakfast.|我早餐吃了牛油果吐司。`,
    "浆果类": `
strawberry|/ˈstrɔːberi/|草莓|Strawberries and cream are delicious.|草莓配奶油很好吃。
blueberry|/ˈbluːberi/|蓝莓|I put blueberries in my yogurt.|我在酸奶里放了蓝莓。
raspberry|/ˈræzberi/|树莓|Raspberry jam is my favorite.|树莓酱是我的最爱。
blackberry|/ˈblækberi/|黑莓|We picked blackberries in the woods.|我们在树林里摘了黑莓。`,
    "瓜类": `
watermelon|/ˈwɔːtərmelən/|西瓜|Nothing beats watermelon on a hot day.|大热天吃西瓜最棒了。
melon|/ˈmelən/|甜瓜|This melon is very sweet.|这个甜瓜很甜。
cantaloupe|/ˈkæntəloʊp/|哈密瓜|Cantaloupe has orange flesh.|哈密瓜的瓜瓤是橙色的。`,
  });

  add("seasons", "四季", "Seasons", "🍂", "春夏秋冬各季特色词汇和通用季节词", {
    "季节与通用词": `
season|/ˈsiːzn/|季节|Which season do you like best?|你最喜欢哪个季节？
spring|/sprɪŋ/|春天|Flowers bloom in spring.|春天花儿盛开。
summer|/ˈsʌmər/|夏天|We go swimming in summer.|我们夏天去游泳。
autumn|/ˈɔːtəm/|秋天（英式）|Autumn is my favorite season.|秋天是我最喜欢的季节。
fall|/fɔːl/|秋天（美式）|The leaves turn red in the fall.|秋天树叶变红。
winter|/ˈwɪntər/|冬天|It snows a lot in winter.|冬天经常下雪。
weather|/ˈweðər/|天气|The weather is lovely today.|今天天气真好。`,
    "春": `
bloom|/bluːm/|开花|The cherry trees are in bloom.|樱桃树正开着花。
blossom|/ˈblɑːsəm/|（果树的）花|The apple blossoms smell sweet.|苹果花闻起来很香。
breeze|/briːz/|微风|A cool breeze came from the lake.|湖上吹来一阵凉爽的微风。
fresh|/freʃ/|清新的|I love the fresh air in spring.|我喜欢春天清新的空气。
grow|/ɡroʊ/|生长|Plants grow quickly in spring.|春天植物长得很快。`,
    "夏": `
hot|/hɑːt/|炎热的|It's too hot to go outside.|太热了，不想出门。
sunshine|/ˈsʌnʃaɪn/|阳光|Let's enjoy the sunshine.|我们来享受阳光吧。
beach|/biːtʃ/|海滩|We spent the day at the beach.|我们在海滩待了一天。
vacation|/veɪˈkeɪʃn/|假期|Where are you going on vacation?|你假期去哪儿？
sunburn|/ˈsʌnbɜːrn/|晒伤|Wear sunscreen to avoid sunburn.|涂防晒霜以免晒伤。
humid|/ˈhjuːmɪd/|潮湿的|Summers here are hot and humid.|这里的夏天又热又潮。`,
    "秋": `
leaf|/liːf/|树叶|A leaf fell on my head.|一片树叶落在我头上。
harvest|/ˈhɑːrvɪst/|收获|Farmers are busy with the harvest.|农民们正忙着收割。
cool|/kuːl/|凉爽的|The evenings are getting cool.|晚上越来越凉了。
pumpkin|/ˈpʌmpkɪn/|南瓜|We made pumpkin soup.|我们做了南瓜汤。`,
    "冬": `
snow|/snoʊ/|雪；下雪|It snowed all night.|下了一整夜的雪。
freezing|/ˈfriːzɪŋ/|极冷的|It's freezing outside!|外面冷死了！
snowman|/ˈsnoʊmæn/|雪人|The children built a snowman.|孩子们堆了个雪人。
ice|/aɪs/|冰|Be careful, there's ice on the road.|小心，路上有冰。
scarf|/skɑːrf/|围巾|Wear a scarf, it's cold.|戴条围巾，天冷。
fireplace|/ˈfaɪərpleɪs/|壁炉|We sat by the fireplace.|我们坐在壁炉边。`,
  });

  add("countries", "国家", "Countries", "🌍", "亚洲、欧洲、美洲、大洋洲和非洲国家，以及国家相关词", {
    "亚洲": `
China|/ˈtʃaɪnə/|中国|China has a long history.|中国历史悠久。
Japan|/dʒəˈpæn/|日本|Japan is famous for sushi.|日本以寿司闻名。
Korea|/kəˈriːə/|韩国；朝鲜|Korean food is often spicy.|韩国菜常常很辣。
India|/ˈɪndiə/|印度|India has a huge population.|印度人口众多。
Thailand|/ˈtaɪlænd/|泰国|We went to Thailand for our holiday.|我们去泰国度假了。
Singapore|/ˈsɪŋəpɔːr/|新加坡|Singapore is very clean.|新加坡非常干净。`,
    "欧洲": `
Britain|/ˈbrɪtn/|英国|Tea is very popular in Britain.|茶在英国很流行。
France|/fræns/|法国|Paris is the capital of France.|巴黎是法国的首都。
Germany|/ˈdʒɜːrməni/|德国|Germany is known for its cars.|德国以汽车闻名。
Italy|/ˈɪtəli/|意大利|Pizza comes from Italy.|披萨来自意大利。
Spain|/speɪn/|西班牙|People in Spain eat dinner late.|西班牙人晚饭吃得很晚。
Russia|/ˈrʌʃə/|俄罗斯|Russia is the largest country in the world.|俄罗斯是世界上面积最大的国家。`,
    "美洲": `
America|/əˈmerɪkə/|美国；美洲|She moved to America last year.|她去年搬到了美国。
Canada|/ˈkænədə/|加拿大|Canada is cold in winter.|加拿大冬天很冷。
Mexico|/ˈmeksɪkoʊ/|墨西哥|Tacos are a Mexican dish.|塔可是墨西哥菜。
Brazil|/brəˈzɪl/|巴西|Brazil loves football.|巴西人热爱足球。
Argentina|/ˌɑːrdʒənˈtiːnə/|阿根廷|Argentina is famous for tango.|阿根廷以探戈闻名。`,
    "大洋洲和非洲": `
Australia|/ɔːˈstreɪliə/|澳大利亚|Kangaroos live in Australia.|袋鼠生活在澳大利亚。
New Zealand|/ˌnuː ˈziːlənd/|新西兰|New Zealand has beautiful mountains.|新西兰有美丽的山脉。
Egypt|/ˈiːdʒɪpt/|埃及|The pyramids are in Egypt.|金字塔在埃及。
Kenya|/ˈkenjə/|肯尼亚|You can see lions in Kenya.|在肯尼亚可以看到狮子。
South Africa|/ˌsaʊθ ˈæfrɪkə/|南非|South Africa has three capital cities.|南非有三个首都。`,
    "国家相关词": `
country|/ˈkʌntri/|国家|How many countries have you visited?|你去过多少个国家？
capital|/ˈkæpɪtl/|首都|Tokyo is the capital of Japan.|东京是日本的首都。
language|/ˈlæŋɡwɪdʒ/|语言|How many languages can you speak?|你会说几种语言？
flag|/flæɡ/|国旗|The flag is red and white.|国旗是红白相间的。
nationality|/ˌnæʃəˈnæləti/|国籍|What's your nationality?|你是哪国人？
border|/ˈbɔːrdər/|边境|We crossed the border by car.|我们开车过了边境。`,
  });

  add("tools", "工具", "Tools", "🔧", "手工工具、测量工具、园艺工具和电动工具", {
    "手工工具": `
hammer|/ˈhæmər/|锤子|Hand me the hammer, please.|请把锤子递给我。
screwdriver|/ˈskruːdraɪvər/|螺丝刀|I need a screwdriver to fix this.|我需要螺丝刀来修这个。
wrench|/rentʃ/|扳手|Use a wrench to tighten the bolt.|用扳手拧紧螺栓。
pliers|/ˈplaɪərz/|钳子|Pliers can cut wire.|钳子可以剪断电线。
saw|/sɔː/|锯子|He cut the wood with a saw.|他用锯子锯木头。
nail|/neɪl/|钉子|Hammer the nail into the wall.|把钉子钉进墙里。
screw|/skruː/|螺丝|One screw is missing.|少了一颗螺丝。
scissors|/ˈsɪzərz/|剪刀|Be careful with the scissors.|小心剪刀。`,
    "测量工具": `
ruler|/ˈruːlər/|直尺|Draw a line with a ruler.|用尺子画一条线。
tape measure|/ˈteɪp meʒər/|卷尺|Let me get the tape measure.|我去拿卷尺。
scale|/skeɪl/|秤|Put the bag on the scale.|把包放在秤上。
level|/ˈlevl/|水平仪|Use a level to hang the picture straight.|用水平仪把画挂正。
thermometer|/θərˈmɑːmɪtər/|温度计|The thermometer shows 30 degrees.|温度计显示 30 度。`,
    "园艺工具": `
shovel|/ˈʃʌvl/|铁锹|He dug a hole with a shovel.|他用铁锹挖了个洞。
rake|/reɪk/|耙子|Use the rake to collect the leaves.|用耙子把树叶聚拢。
hose|/hoʊz/|水管|Water the flowers with the hose.|用水管浇花。
watering can|/ˈwɔːtərɪŋ kæn/|浇水壶|The watering can is empty.|浇水壶空了。
lawn mower|/ˈlɔːn moʊər/|割草机|The lawn mower is very noisy.|割草机很吵。`,
    "电动工具": `
drill|/drɪl/|电钻|Use a drill to make a hole.|用电钻打个孔。
battery|/ˈbætəri/|电池|The battery is dead.|电池没电了。
flashlight|/ˈflæʃlaɪt/|手电筒|Take a flashlight in case it gets dark.|带个手电筒，以防天黑。
ladder|/ˈlædər/|梯子|Hold the ladder for me.|帮我扶着梯子。
toolbox|/ˈtuːlbɑːks/|工具箱|The tools are in the toolbox.|工具在工具箱里。`,
  });

  add("rooms", "房间", "Rooms & House", "🏠", "房间类型、房屋结构、家居设施和户外区域", {
    "房间类型": `
living room|/ˈlɪvɪŋ ruːm/|客厅|We watch TV in the living room.|我们在客厅看电视。
bedroom|/ˈbedruːm/|卧室|My bedroom is upstairs.|我的卧室在楼上。
kitchen|/ˈkɪtʃɪn/|厨房|Mom is cooking in the kitchen.|妈妈在厨房做饭。
bathroom|/ˈbæθruːm/|浴室；卫生间|Where is the bathroom?|卫生间在哪里？
dining room|/ˈdaɪnɪŋ ruːm/|餐厅|We eat dinner in the dining room.|我们在餐厅吃晚饭。
study|/ˈstʌdi/|书房|Dad is working in the study.|爸爸在书房工作。
basement|/ˈbeɪsmənt/|地下室|We keep old things in the basement.|我们把旧东西放在地下室。`,
    "房屋结构": `
roof|/ruːf/|屋顶|There is a cat on the roof.|屋顶上有只猫。
wall|/wɔːl/|墙|Hang the photo on the wall.|把照片挂在墙上。
floor|/flɔːr/|地板；楼层|I live on the third floor.|我住在三楼。
ceiling|/ˈsiːlɪŋ/|天花板|The ceiling is very high.|天花板很高。
stairs|/sterz/|楼梯|Go up the stairs and turn left.|上楼后左转。
window|/ˈwɪndoʊ/|窗户|Open the window, please.|请打开窗户。
door|/dɔːr/|门|Someone is at the door.|有人在门口。
hallway|/ˈhɔːlweɪ/|走廊|Leave your shoes in the hallway.|把鞋放在走廊。`,
    "家居设施": `
light|/laɪt/|灯|Turn off the light when you leave.|离开时请关灯。
heater|/ˈhiːtər/|暖气；加热器|Turn on the heater, it's cold.|开暖气吧，好冷。
air conditioner|/ˈer kəndɪʃənər/|空调|The air conditioner is broken.|空调坏了。
shower|/ˈʃaʊər/|淋浴|I take a shower every morning.|我每天早上洗澡。
sink|/sɪŋk/|水槽|Put the dishes in the sink.|把碗放进水槽。
socket|/ˈsɑːkɪt/|插座|Is there a socket near the bed?|床边有插座吗？`,
    "户外区域": `
garden|/ˈɡɑːrdn/|花园|She grows roses in her garden.|她在花园里种玫瑰。
yard|/jɑːrd/|院子|The kids are playing in the yard.|孩子们在院子里玩。
balcony|/ˈbælkəni/|阳台|We have breakfast on the balcony.|我们在阳台上吃早餐。
garage|/ɡəˈrɑːʒ/|车库|The car is in the garage.|车在车库里。
fence|/fens/|篱笆；围栏|The dog jumped over the fence.|狗跳过了围栏。`,
  });

  add("drinks", "饮料", "Drinks", "🥤", "热饮、冷饮、酒类和饮品描述词", {
    "热饮": `
coffee|/ˈkɔːfi/|咖啡|I need a coffee to wake up.|我需要一杯咖啡提神。
tea|/tiː/|茶|Would you like some tea?|要来点茶吗？
hot chocolate|/ˌhɑːt ˈtʃɑːklət/|热巧克力|Hot chocolate is perfect in winter.|冬天喝热巧克力最棒了。
latte|/ˈlɑːteɪ/|拿铁|A large latte, please.|请给我一杯大杯拿铁。
green tea|/ˌɡriːn ˈtiː/|绿茶|Green tea is good for you.|绿茶对身体好。
soup|/suːp/|汤|This soup warms me up.|这汤让我暖和起来。`,
    "冷饮": `
water|/ˈwɔːtər/|水|Drink more water every day.|每天多喝水。
juice|/dʒuːs/|果汁|Apple juice or orange juice?|苹果汁还是橙汁？
milk|/mɪlk/|牛奶|The baby drinks milk.|宝宝喝牛奶。
soda|/ˈsoʊdə/|汽水|Too much soda is bad for your teeth.|喝太多汽水对牙齿不好。
lemonade|/ˌleməˈneɪd/|柠檬水|Let's make some lemonade.|我们来做点柠檬水吧。
milkshake|/ˈmɪlkʃeɪk/|奶昔|I'll have a chocolate milkshake.|我要一杯巧克力奶昔。
smoothie|/ˈsmuːði/|果昔|She makes a smoothie every morning.|她每天早上做一杯果昔。
iced tea|/ˌaɪst ˈtiː/|冰茶|Iced tea is refreshing.|冰茶很解渴。`,
    "酒类": `
beer|/bɪr/|啤酒|Two beers, please.|请来两杯啤酒。
wine|/waɪn/|葡萄酒|Red wine or white wine?|红葡萄酒还是白葡萄酒？
champagne|/ʃæmˈpeɪn/|香槟|We opened champagne to celebrate.|我们开香槟庆祝。
cocktail|/ˈkɑːkteɪl/|鸡尾酒|This bar makes great cocktails.|这家酒吧的鸡尾酒很棒。`,
    "描述饮品": `
sweet|/swiːt/|甜的|This juice is too sweet.|这果汁太甜了。
bitter|/ˈbɪtər/|苦的|Black coffee tastes bitter.|黑咖啡喝起来很苦。
sour|/ˈsaʊər/|酸的|Lemons are sour.|柠檬是酸的。
strong|/strɔːŋ/|浓的|I like my coffee strong.|我喜欢浓咖啡。
refreshing|/rɪˈfreʃɪŋ/|提神的；清爽的|A cold drink is refreshing.|一杯冷饮让人神清气爽。
thirsty|/ˈθɜːrsti/|口渴的|I'm thirsty. Is there any water?|我渴了，有水吗？`,
  });

  add("office", "办公室", "Office", "💼", "办公设备、办公用品、办公家具和工作场景词", {
    "办公设备": `
computer|/kəmˈpjuːtər/|电脑|My computer froze again.|我的电脑又卡死了。
printer|/ˈprɪntər/|打印机|The printer is out of paper.|打印机没纸了。
laptop|/ˈlæptɑːp/|笔记本电脑|I work on my laptop at home.|我在家用笔记本电脑工作。
keyboard|/ˈkiːbɔːrd/|键盘|This keyboard is very quiet.|这个键盘很安静。
monitor|/ˈmɑːnɪtər/|显示器|I use two monitors at work.|我工作时用两个显示器。
projector|/prəˈdʒektər/|投影仪|Turn on the projector for the meeting.|开会时把投影仪打开。`,
    "办公用品": `
stapler|/ˈsteɪplər/|订书机|Can I borrow your stapler?|能借用你的订书机吗？
folder|/ˈfoʊldər/|文件夹|Put the papers in this folder.|把文件放进这个文件夹。
notebook|/ˈnoʊtbʊk/|笔记本|I write my ideas in a notebook.|我把想法写在笔记本上。
sticky note|/ˈstɪki noʊt/|便利贴|She left a sticky note on my desk.|她在我桌上留了张便利贴。
envelope|/ˈenvəloʊp/|信封|Put the letter in the envelope.|把信装进信封。
marker|/ˈmɑːrkər/|记号笔|Write it on the board with a marker.|用记号笔写在白板上。`,
    "办公家具": `
desk|/desk/|办公桌|My desk is next to the window.|我的办公桌在窗边。
chair|/tʃer/|椅子|This chair is very comfortable.|这把椅子很舒服。
cabinet|/ˈkæbɪnət/|柜子|The files are in the cabinet.|文件在柜子里。
whiteboard|/ˈwaɪtbɔːrd/|白板|Let me draw it on the whiteboard.|我在白板上画出来。
shelf|/ʃelf/|架子|The books are on the top shelf.|书在最上面一层架子上。`,
    "工作场景": `
meeting|/ˈmiːtɪŋ/|会议|The meeting starts at ten.|会议十点开始。
colleague|/ˈkɑːliːɡ/|同事|I had lunch with my colleagues.|我和同事们一起吃了午饭。
boss|/bɔːs/|老板|My boss is very kind.|我的老板人很好。
deadline|/ˈdedlaɪn/|截止日期|We must meet the deadline.|我们必须赶上截止日期。
report|/rɪˈpɔːrt/|报告|I have to finish this report today.|我今天得完成这份报告。
schedule|/ˈskedʒuːl/|日程|Let me check my schedule.|我查一下我的日程。
overtime|/ˈoʊvərtaɪm/|加班|I worked overtime last night.|我昨晚加班了。`,
  });

  add("nature", "自然", "Nature", "🌿", "地形地貌、天体、自然现象和植物", {
    "地形地貌": `
mountain|/ˈmaʊntn/|山|We climbed the mountain.|我们爬了那座山。
river|/ˈrɪvər/|河流|The river flows into the sea.|这条河流入大海。
lake|/leɪk/|湖|We went boating on the lake.|我们在湖上划船。
forest|/ˈfɔːrɪst/|森林|Wolves live in the forest.|狼生活在森林里。
desert|/ˈdezərt/|沙漠|It rarely rains in the desert.|沙漠里很少下雨。
island|/ˈaɪlənd/|岛屿|They live on a small island.|他们住在一个小岛上。
valley|/ˈvæli/|山谷|There is a village in the valley.|山谷里有个村庄。
waterfall|/ˈwɔːtərfɔːl/|瀑布|The waterfall is 100 meters high.|这瀑布有 100 米高。`,
    "天体": `
sun|/sʌn/|太阳|The sun rises in the east.|太阳从东方升起。
moon|/muːn/|月亮|The moon is full tonight.|今晚是满月。
star|/stɑːr/|星星|I can see many stars tonight.|今晚我能看到很多星星。
planet|/ˈplænɪt/|行星|Mars is a red planet.|火星是一颗红色的行星。
sky|/skaɪ/|天空|The sky is so blue today.|今天的天空真蓝。
earth|/ɜːrθ/|地球|The earth goes around the sun.|地球绕着太阳转。`,
    "自然现象": `
rainbow|/ˈreɪnboʊ/|彩虹|Look, a rainbow!|看，彩虹！
thunder|/ˈθʌndər/|雷|The thunder woke me up.|雷声把我吵醒了。
lightning|/ˈlaɪtnɪŋ/|闪电|Lightning hit the tree.|闪电击中了那棵树。
earthquake|/ˈɜːrθkweɪk/|地震|The earthquake shook the city.|地震震动了整座城市。
sunrise|/ˈsʌnraɪz/|日出|We got up early to watch the sunrise.|我们早起看日出。
sunset|/ˈsʌnset/|日落|The sunset was beautiful.|日落真美。`,
    "植物": `
tree|/triː/|树|There is a big tree in front of my house.|我家门前有棵大树。
grass|/ɡræs/|草|Please keep off the grass.|请勿践踏草坪。
flower|/ˈflaʊər/|花|She picked some flowers.|她摘了一些花。
bush|/bʊʃ/|灌木|A rabbit hid in the bush.|一只兔子躲在灌木丛里。
root|/ruːt/|根|Trees have deep roots.|树的根扎得很深。
seed|/siːd/|种子|Plant the seeds in spring.|春天播种。`,
  });

  add("food", "食物", "Food", "🍜", "主食、肉类、调料、零食和甜点", {
    "主食": `
rice|/raɪs/|米饭|We eat rice every day.|我们每天吃米饭。
noodles|/ˈnuːdlz/|面条|I had beef noodles for lunch.|我午饭吃了牛肉面。
bread|/bred/|面包|I bought a loaf of bread.|我买了一条面包。
dumpling|/ˈdʌmplɪŋ/|饺子|We make dumplings at Spring Festival.|我们春节包饺子。
pasta|/ˈpɑːstə/|意大利面|This pasta is delicious.|这意大利面很好吃。
porridge|/ˈpɔːrɪdʒ/|粥|I had porridge for breakfast.|我早餐喝了粥。`,
    "肉类和海鲜": `
beef|/biːf/|牛肉|I'd like my beef well done.|我的牛肉要全熟。
pork|/pɔːrk/|猪肉|Sweet and sour pork is a famous dish.|糖醋里脊是道名菜。
chicken|/ˈtʃɪkɪn/|鸡肉|Fried chicken is not very healthy.|炸鸡不太健康。
lamb|/læm/|羊肉|We had lamb for dinner.|我们晚餐吃了羊肉。
fish|/fɪʃ/|鱼|Steamed fish is my favorite.|清蒸鱼是我的最爱。
shrimp|/ʃrɪmp/|虾|I'm allergic to shrimp.|我对虾过敏。
sausage|/ˈsɔːsɪdʒ/|香肠|He had eggs and sausages.|他吃了鸡蛋和香肠。`,
    "调料": `
salt|/sɔːlt/|盐|Could you pass the salt?|能把盐递给我吗？
sugar|/ˈʃʊɡər/|糖|No sugar in my coffee, please.|我的咖啡不要加糖。
pepper|/ˈpepər/|胡椒|Add a little pepper.|加一点胡椒。
soy sauce|/ˌsɔɪ ˈsɔːs/|酱油|Dip it in soy sauce.|蘸点酱油。
vinegar|/ˈvɪnɪɡər/|醋|Dumplings taste great with vinegar.|饺子蘸醋很好吃。
oil|/ɔɪl/|油|Heat the oil in the pan.|把锅里的油烧热。`,
    "零食和甜点": `
cake|/keɪk/|蛋糕|Happy birthday! Let's cut the cake.|生日快乐！我们来切蛋糕吧。
cookie|/ˈkʊki/|饼干|She baked some cookies.|她烤了一些饼干。
chocolate|/ˈtʃɑːklət/|巧克力|I can't stop eating chocolate.|我停不下来地吃巧克力。
ice cream|/ˌaɪs ˈkriːm/|冰淇淋|Let's get some ice cream.|我们去买点冰淇淋吧。
chips|/tʃɪps/|薯片；薯条|We ate chips while watching a movie.|我们边看电影边吃薯片。
candy|/ˈkændi/|糖果|Too much candy is bad for your teeth.|吃太多糖对牙齿不好。
pie|/paɪ/|馅饼|Grandma makes the best apple pie.|奶奶做的苹果派最好吃。`,
    "三餐与口味": `
breakfast|/ˈbrekfəst/|早餐|Don't skip breakfast.|不要不吃早餐。
lunch|/lʌntʃ/|午餐|Let's have lunch together.|我们一起吃午饭吧。
dinner|/ˈdɪnər/|晚餐|What's for dinner?|晚饭吃什么？
spicy|/ˈspaɪsi/|辣的|Sichuan food is very spicy.|川菜很辣。
salty|/ˈsɔːlti/|咸的|The soup is a bit salty.|汤有点咸。
delicious|/dɪˈlɪʃəs/|美味的|This is delicious!|这太好吃了！`,
  });
})();
