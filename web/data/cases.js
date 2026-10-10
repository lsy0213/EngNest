// 听力侦探 · 每周一案（本项目原创）：证词只放声音，原文要答完题才显示；关键线索藏在细节里
// cast：角色 → [名字, 神经语音]；clips：[角色, 英文, 中文]；questions：听力理解题；verdict：最后的推理题
window.DETECTIVE_CASES = [
  {
    id: "cake", title: "生日蛋糕失踪案", en: "The Missing Birthday Cake", level: "A2–B1",
    intro: "周五下午，同事们给 Anna 准备的生日蛋糕在会议室的冰箱里不见了。下午有三个人进过会议室。听听大家怎么说，找出拿走蛋糕的人。",
    cast: { det: ["侦探", "en-US-GuyNeural"], lisa: ["Lisa（同事）", "en-US-JennyNeural"], tom: ["Tom（同事）", "en-GB-RyanNeural"], brown: ["Brown 先生（经理）", "en-US-BrianNeural"], rosa: ["Rosa（保洁）", "en-AU-NatashaNeural"] },
    clips: [
      ["det", "The cake was put in the fridge at two o'clock, still in its closed white box. At four, when we opened the fridge, it was gone. Three people went into the meeting room between two and four.", "两点的时候蛋糕放进了冰箱，装在盖着的白盒子里。四点打开冰箱时，蛋糕不见了。两点到四点之间有三个人进过会议室。"],
      ["lisa", "I went in at about half past two to get my water bottle. The box was still there, I saw it. But I didn't touch it. I'm on a diet. I don't even eat bread these days.", "我大概两点半进去拿水杯。盒子还在，我看到了。但我没碰它。我在节食，最近连面包都不吃。"],
      ["tom", "I was in the meeting room from three to a quarter past three. I had a phone call. I didn't open the fridge. And honestly, I don't even like chocolate cake.", "我三点到三点一刻在会议室，打了个电话。我没开冰箱。说实话，我根本不喜欢巧克力蛋糕。"],
      ["brown", "I had a meeting there at half past three. When I came in, the fridge door was open a little, so I closed it. I didn't look inside.", "我三点半在那里开会。进去的时候冰箱门开着一点，我就把它关上了。我没往里看。"],
      ["rosa", "I cleaned the kitchen at about twenty past three. I saw Tom in the hallway. He had something brown on his sleeve. He said it was coffee.", "我大概三点二十打扫厨房。我在走廊看到 Tom，他袖子上有棕色的东西。他说是咖啡。"],
    ],
    questions: [
      { q: "蛋糕是几点放进冰箱的？", o: ["两点", "两点半", "三点", "四点"], a: 0, why: "侦探说：The cake was put in the fridge at two o'clock." },
      { q: "Lisa 说她为什么没碰蛋糕？", o: ["她在节食", "她不喜欢巧克力", "她在开会", "她两点半不在公司"], a: 0, why: "Lisa：I'm on a diet." },
      { q: "Brown 先生进会议室时发现了什么？", o: ["冰箱门开着一点", "蛋糕盒在桌上", "Tom 在打电话", "地上有蛋糕屑"], a: 0, why: "Brown：the fridge door was open a little." },
      { q: "Rosa 在 Tom 身上看到了什么？", o: ["袖子上有棕色的东西", "手里拿着盒子", "他在吃面包", "他在打电话"], a: 0, why: "Rosa：He had something brown on his sleeve." },
    ],
    verdict: { q: "谁拿走了蛋糕？", o: ["Tom", "Lisa", "Brown 先生", "Rosa"], a: 0,
      why: "蛋糕一直装在盖着的白盒子里，没有人说过是什么口味。Tom 却说「我根本不喜欢巧克力蛋糕」：他怎么知道是巧克力的？再加上袖子上的棕色痕迹，就是他。" },
  },
  {
    id: "laptop", title: "咖啡馆电脑失踪案", en: "The Café Laptop", level: "B1",
    intro: "大学生 Mia 在咖啡馆写论文，去了一趟洗手间，回来时电脑不见了。咖啡师、邻桌的男人和 Mia 的朋友都在场。谁在说谎？",
    cast: { mia: ["Mia（学生）", "en-US-AvaNeural"], barista: ["Sam（咖啡师）", "en-GB-LibbyNeural"], man: ["Mr. Hill（邻桌）", "en-US-AndrewNeural"], friend: ["Leo（Mia 的朋友）", "en-IE-ConnorNeural"] },
    clips: [
      ["mia", "I went to the restroom at five past three. I was gone for about seven minutes. My laptop was on the table, in a black bag. When I came back, the bag was gone.", "我三点零五分去了洗手间，大约走开了七分钟。我的电脑在桌上，装在一个黑色的包里。回来的时候包不见了。"],
      ["man", "I got here at three and I never left my seat. I was reading the whole time. I didn't see anyone take a bag. I'm sorry, I was really into my book.", "我三点到的，一直没离开座位，一直在看书。我没看到有人拿包。抱歉，我看书看得太投入了。"],
      ["barista", "That gentleman ordered a tea at a quarter to three, not three. Then around ten past three he went outside with a black bag. He said he needed to answer a phone call.", "那位先生是两点四十五点的茶，不是三点。三点十分左右，他拿着一个黑包出去了，说要接个电话。"],
      ["friend", "I arrived at twenty past three to meet Mia. When I walked in, that man was coming back inside. He wasn't carrying anything at all.", "我三点二十到的，来找 Mia。我进门时，那个男人正好从外面回来，手里什么都没拿。"],
    ],
    questions: [
      { q: "Mia 几点去的洗手间？", o: ["三点零五分", "三点", "三点十分", "两点四十五"], a: 0, why: "Mia：I went to the restroom at five past three." },
      { q: "电脑装在什么颜色的包里？", o: ["黑色", "灰色", "棕色", "银色"], a: 0, why: "Mia：in a black bag." },
      { q: "咖啡师说 Mr. Hill 三点十分左右做了什么？", o: ["拿着黑包出去接电话", "去了洗手间", "又点了一杯茶", "一直在看书"], a: 0, why: "Sam：he went outside with a black bag… to answer a phone call." },
      { q: "Leo 进门时看到 Mr. Hill 怎么样？", o: ["从外面回来，手里什么都没拿", "坐在座位上看书", "在打电话", "拿着一个黑包"], a: 0, why: "Leo：that man was coming back inside. He wasn't carrying anything." },
    ],
    verdict: { q: "谁的话有问题？电脑最可能在哪里？", o: ["Mr. Hill 说谎，电脑被他拿到外面藏起来了", "咖啡师说谎", "Leo 拿走了电脑", "Mia 把电脑落在家里了"], a: 0,
      why: "Mr. Hill 说「三点到、一直没离开座位」，可咖啡师说他两点四十五就点了茶，三点十分拿着黑包出去了；Leo 又看到他空着手回来。包被他拿出去交给了别人或者藏在了外面。" },
  },
  {
    id: "window", title: "教室窗户破碎案", en: "The Broken Window", level: "B1",
    intro: "放学后，三楼一间教室的窗户碎了。有人怀疑是在楼下踢球的两个男孩。听完证词，你能还原真相吗？",
    cast: { teacher: ["Ms. Clark（老师）", "en-GB-SoniaNeural"], ben: ["Ben（学生）", "en-US-BrianNeural"], janitor: ["Mr. Lopez（校工）", "en-US-GuyNeural"], radio: ["天气预报", "en-US-EmmaNeural"] },
    clips: [
      ["radio", "Good afternoon. Strong winds are expected this evening. Gusts may reach sixty kilometres an hour from around five o'clock. Please close your windows and doors.", "下午好。今晚预计有大风，大约五点开始阵风可能达到每小时六十公里。请关好门窗。"],
      ["teacher", "I left the classroom at a quarter to five. I closed the window but I forgot to close the door. I heard the glass break at about ten past five from the office downstairs.", "我四点四十五离开教室。我关了窗，但忘了关门。大约五点十分，我在楼下办公室听到玻璃碎的声音。"],
      ["ben", "Yes, we were playing football below the window. But our ball never went that high. And look, our ball is right here. It's not in the classroom.", "对，我们在窗户下面踢球。但球从来没踢那么高。你看，球就在这儿，不在教室里。"],
      ["janitor", "When I went in, papers were all over the floor and the door was banging. The strange thing is, almost all the broken glass was outside, on the ground below the window.", "我进去的时候，纸撒了一地，门在砰砰地响。奇怪的是，碎玻璃几乎都在外面，掉在窗户下面的地上。"],
    ],
    questions: [
      { q: "天气预报说大风大约几点开始？", o: ["五点左右", "四点四十五", "五点十分", "晚上八点"], a: 0, why: "天气预报：from around five o'clock." },
      { q: "Ms. Clark 离开教室时忘了做什么？", o: ["关门", "关窗", "关灯", "锁抽屉"], a: 0, why: "Ms. Clark：I forgot to close the door." },
      { q: "Ben 怎么证明不是他们？", o: ["球还在他们手里，不在教室里", "他们五点前就回家了", "他们在另一边踢球", "老师可以作证"], a: 0, why: "Ben：our ball is right here. It's not in the classroom." },
      { q: "校工觉得奇怪的是什么？", o: ["碎玻璃几乎都在窗外的地上", "窗户是开着的", "教室里有一个球", "门是锁着的"], a: 0, why: "Mr. Lopez：almost all the broken glass was outside." },
    ],
    verdict: { q: "窗户是怎么碎的？", o: ["没人干的：门开着，大风吹得窗户从里面撞碎了", "男孩们的球打碎的", "校工打碎的", "Ms. Clark 打碎的"], a: 0,
      why: "如果是楼下的球打碎的，玻璃应该掉进教室里；玻璃却几乎都在外面，说明是从里面被冲开的。门没关，五点起了大风，屋里纸被吹得满地都是，窗户被风撞碎了。" },
  },
  {
    id: "necklace", title: "酒店项链失踪案", en: "The Hotel Necklace", level: "B1–B2",
    intro: "Grant 太太说，她晚上去吃饭的时候，放在 305 房间的金项链被偷了。酒店的员工们各自说了看到的情况。项链真的被偷了吗？",
    cast: { grant: ["Grant 太太", "en-GB-SoniaNeural"], waiter: ["Paul（餐厅服务员）", "en-GB-ThomasNeural"], house: ["Nina（客房服务）", "en-IN-NeerjaNeural"], spa: ["Kate（水疗中心）", "en-AU-NatashaNeural"] },
    clips: [
      ["grant", "I wore my gold necklace all day. I took it off in my room before dinner, at about seven, and put it on the table. When I came back at nine, it was gone. Someone stole it!", "我一整天都戴着金项链。晚饭前大概七点，我在房间里把它摘下来放在桌上。九点回来的时候它不见了。有人偷了它！"],
      ["house", "I cleaned room 305 at six o'clock. Mrs. Grant wasn't there. I didn't see any jewellery on the table, only a book and some glasses.", "我六点打扫的 305 房间。Grant 太太不在。我在桌上没看到任何首饰，只有一本书和一副眼镜。"],
      ["waiter", "Mrs. Grant had dinner from seven to nine. I remember her well because I said I loved her earrings. I noticed she wasn't wearing a necklace, which was a bit unusual for her.", "Grant 太太七点到九点在吃晚饭。我记得很清楚，因为我说我很喜欢她的耳环。我注意到她没戴项链，这对她来说有点少见。"],
      ["spa", "A lady from the third floor had a massage at about five this afternoon. After she left, we found a gold necklace in locker twelve. Nobody has asked for it yet.", "今天下午五点左右，一位住在三楼的女士来做了按摩。她走后，我们在 12 号柜子里发现了一条金项链，到现在还没人来认领。"],
    ],
    questions: [
      { q: "Grant 太太说她几点把项链摘下来的？", o: ["七点左右", "五点左右", "六点", "九点"], a: 0, why: "Grant 太太：I took it off in my room before dinner, at about seven." },
      { q: "Nina 六点打扫房间时桌上有什么？", o: ["一本书和一副眼镜", "一条金项链", "一副耳环", "什么都没有"], a: 0, why: "Nina：only a book and some glasses." },
      { q: "服务员为什么记得 Grant 太太？", o: ["他夸了她的耳环", "她点了很贵的菜", "她丢了东西", "她吃得很晚"], a: 0, why: "Paul：I said I loved her earrings." },
      { q: "水疗中心在几号柜子里发现了项链？", o: ["12 号", "2 号", "20 号", "305 号"], a: 0, why: "Kate：in locker twelve." },
    ],
    verdict: { q: "项链到底去哪了？", o: ["没被偷：下午五点按摩时落在了水疗中心的柜子里", "被客房服务员偷了", "被服务员偷了", "被水疗中心的员工偷了"], a: 0,
      why: "六点打扫时桌上就没有项链，七点吃饭时她也没戴，说明七点前项链就不在她身上了。她下午五点去做了按摩，水疗中心正好在柜子里捡到一条金项链。她记错了，项链落在了那里。" },
  },
];
