// 现代名著书单：英语学习书单里推荐最多、但还在版权期内的书（软件里不能内置全文）。
// 买正版电子书（epub）后，可以用阅读页的「导入你自己的读物」打开，和原著全文一样查词、高亮、朗读。
// level 和原著书架一致：较易 ≈ A2–B1，中等 ≈ B1–B2，较难 ≈ B2–C1
window.MODERN_BOOKS = [
  // 入门
  { title: "The Little Prince", zh: "小王子", author: "Antoine de Saint-Exupéry", year: 1943, level: "较易", cat: "fairy", why: "句子短而美，全球最畅销的书之一。英译本有版权，建议买 Richard Howard 译本。" },
  { title: "Charlotte's Web", zh: "夏洛的网", author: "E. B. White", year: 1952, level: "较易", cat: "kids", why: "小猪威尔伯和蜘蛛夏洛的友谊。几乎每份入门书单都会推荐，词汇简单、情感真挚。" },
  { title: "Stuart Little", zh: "精灵鼠小弟", author: "E. B. White", year: 1945, level: "较易", cat: "kids", why: "纽约一家人生了一只老鼠儿子。篇幅短，适合 500–2000 词汇量入门。" },
  { title: "Matilda", zh: "玛蒂尔达", author: "Roald Dahl", year: 1988, level: "较易", cat: "kids", why: "爱读书的天才小女孩对付恶劣的父母和校长。达尔的语言幽默夸张，读起来停不下来。" },
  { title: "Charlie and the Chocolate Factory", zh: "查理和巧克力工厂", author: "Roald Dahl", year: 1964, level: "较易", cat: "kids", why: "穷孩子查理拿到金奖券，走进威利·旺卡的奇幻巧克力工厂。" },
  { title: "Holes", zh: "洞", author: "Louis Sachar", year: 1998, level: "较易", cat: "kids", why: "被冤枉的少年在沙漠营地天天挖洞，三代人的故事最后严丝合缝地连在一起。美国中学生必读。" },
  { title: "Wonder", zh: "奇迹男孩", author: "R. J. Palacio", year: 2012, level: "较易", cat: "kids", why: "面部畸形的男孩第一次去学校上学。多个角色轮流叙述，口语化，非常适合入门。" },
  { title: "Flipped", zh: "怦然心动", author: "Wendelin Van Draanen", year: 2001, level: "较易", cat: "kids", why: "男孩女孩轮流讲述同一段初恋，校园口语地道。" },
  { title: "The Giver", zh: "记忆传授人", author: "Lois Lowry", year: 1993, level: "较易", cat: "scifi", why: "没有痛苦也没有色彩的完美社区。语言简单的反乌托邦小说，适合过渡到《1984》。" },
  { title: "The House on Mango Street", zh: "芒果街上的小屋", author: "Sandra Cisneros", year: 1984, level: "较易", cat: "short", why: "四十多个一两页的小片段，语言清澈如诗，适合初学者。" },
  { title: "The Lion, the Witch and the Wardrobe", zh: "纳尼亚传奇：狮子、女巫和魔衣橱", author: "C. S. Lewis", year: 1950, level: "较易", cat: "fairy", why: "四个孩子穿过衣橱走进魔法王国纳尼亚。经典入门奇幻。" },
  { title: "Harry Potter and the Philosopher's Stone", zh: "哈利·波特与魔法石", author: "J. K. Rowling", year: 1997, level: "中等", cat: "fairy", why: "熟悉的故事是读原著最好的动力，第一部最简单，读完可以一路读下去。" },
  // 中级
  { title: "Animal Farm", zh: "动物庄园", author: "George Orwell", year: 1945, level: "中等", cat: "classic", why: "动物们赶走农场主后建立的「平等」社会。只有三万词，奥威尔的文字清楚直接。" },
  { title: "The Old Man and the Sea", zh: "老人与海", author: "Ernest Hemingway", year: 1952, level: "中等", cat: "classic", why: "老渔夫和大马林鱼搏斗三天三夜。海明威式短句，词汇不难，篇幅也短。" },
  { title: "Of Mice and Men", zh: "人鼠之间", author: "John Steinbeck", year: 1937, level: "中等", cat: "classic", why: "大萧条时期两个流浪农工的梦想。中篇，对话多，美国口语地道。" },
  { title: "The Hobbit", zh: "霍比特人", author: "J. R. R. Tolkien", year: 1937, level: "中等", cat: "fairy", why: "比尔博跟着矮人们去夺回被恶龙占领的宝藏。很多书单推荐给中级读者。" },
  { title: "To Kill a Mockingbird", zh: "杀死一只知更鸟", author: "Harper Lee", year: 1960, level: "中等", cat: "classic", why: "小女孩斯库特眼中的种族偏见和父亲的正直。美国中学必读书。" },
  { title: "Tuesdays with Morrie", zh: "相约星期二", author: "Mitch Albom", year: 1997, level: "中等", cat: "nonfic", why: "学生每周二去看望患绝症的老教授，聊人生。语言平实，非常适合中级读者。" },
  { title: "The Alchemist", zh: "牧羊少年奇幻之旅", author: "Paulo Coelho", year: 1988, level: "中等", cat: "fairy", why: "牧羊少年追寻梦中的宝藏。英译本句子简单，很多书单把它列为中级入门。" },
  { title: "The Curious Incident of the Dog in the Night-Time", zh: "深夜小狗离奇事件", author: "Mark Haddon", year: 2003, level: "中等", cat: "mystery", why: "患自闭症的数学天才少年调查邻居家的狗被杀案。第一人称、句子很短。" },
  { title: "And Then There Were None", zh: "无人生还", author: "Agatha Christie", year: 1939, level: "中等", cat: "mystery", why: "十个陌生人被邀请到孤岛，一个接一个死去。克里斯蒂最畅销的作品。" },
  { title: "Lord of the Flies", zh: "蝇王", author: "William Golding", year: 1954, level: "中等", cat: "classic", why: "一群男孩流落荒岛，文明一点点崩塌。" },
  // 高级
  { title: "Nineteen Eighty-Four", zh: "1984", author: "George Orwell", year: 1949, level: "较难", cat: "scifi", why: "老大哥在看着你。写作风格清楚直接，是从中级迈向高级的常见选择。" },
  { title: "Brave New World", zh: "美丽新世界", author: "Aldous Huxley", year: 1932, level: "较难", cat: "scifi", why: "用快乐和药物控制人的「完美」社会，和《1984》《我们》并称三大反乌托邦。" },
  { title: "The Catcher in the Rye", zh: "麦田里的守望者", author: "J. D. Salinger", year: 1951, level: "较难", cat: "classic", why: "叛逆少年霍尔顿在纽约游荡的三天。满篇青少年俚语，适合学习非正式口语。" },
  { title: "Never Let Me Go", zh: "别让我走", author: "Kazuo Ishiguro", year: 2005, level: "较难", cat: "scifi", why: "诺贝尔奖得主石黑一雄的代表作，平静克制的叙述下藏着巨大的悲伤。" },
  { title: "Life of Pi", zh: "少年派的奇幻漂流", author: "Yann Martel", year: 2001, level: "较难", cat: "adventure", why: "少年派和一只孟加拉虎在救生艇上漂流 227 天。" },
  { title: "The Kite Runner", zh: "追风筝的人", author: "Khaled Hosseini", year: 2003, level: "较难", cat: "classic", why: "阿富汗少年阿米尔的背叛与救赎。语言流畅，情节抓人。" },
];
