// 情景句库：听写、跟读、中译英都用这里的句子
// 每句：[英文, 中文]
window.SENTENCE_SCENES = [
  {
    id: "greet", title: "寒暄问候", icon: "👋", sentences: [
      ["How's it going?", "最近怎么样？"],
      ["Long time no see. You look great!", "好久不见，你气色真好！"],
      ["What do you do for a living?", "你是做什么工作的？"],
      ["Nice to meet you. I've heard a lot about you.", "很高兴认识你，久仰大名。"],
      ["Where are you from originally?", "你老家是哪里的？"],
      ["I'm sorry, could you say that again?", "抱歉，你能再说一遍吗？"],
      ["Could you speak a little more slowly, please?", "你能说慢一点吗？"],
      ["Thanks for having me. I had a great time.", "谢谢款待，我玩得很开心。"],
      ["Let's keep in touch.", "我们保持联系吧。"],
      ["Have a nice weekend!", "周末愉快！"],
    ],
  },
  {
    id: "shop", title: "购物消费", icon: "🛍️", sentences: [
      ["How much is this jacket?", "这件夹克多少钱？"],
      ["Do you have this in a smaller size?", "这个有小一号的吗？"],
      ["Can I try it on?", "我可以试穿吗？"],
      ["I'm just looking, thanks.", "我只是看看，谢谢。"],
      ["Is there any discount on this?", "这个有折扣吗？"],
      ["Can I pay by card?", "可以刷卡吗？"],
      ["I'd like to return this, please.", "我想退掉这个。"],
      ["Where is the fitting room?", "试衣间在哪里？"],
      ["It's a bit too expensive for me.", "这对我来说有点太贵了。"],
      ["Could you wrap it up as a gift?", "能帮我包装成礼物吗？"],
    ],
  },
  {
    id: "food", title: "餐厅点餐", icon: "🍽️", sentences: [
      ["A table for two, please.", "请给我们一张两人桌。"],
      ["Could we see the menu, please?", "能给我们看看菜单吗？"],
      ["What would you recommend?", "你有什么推荐的吗？"],
      ["I'll have the chicken salad.", "我要鸡肉沙拉。"],
      ["Could I have some water, please?", "能给我一些水吗？"],
      ["I'm allergic to peanuts.", "我对花生过敏。"],
      ["Excuse me, this isn't what I ordered.", "不好意思，这不是我点的。"],
      ["Can we have the bill, please?", "请给我们结账。"],
      ["Let's split the bill.", "我们 AA 吧。"],
      ["Everything was delicious, thank you.", "一切都很美味，谢谢。"],
    ],
  },
  {
    id: "travel", title: "出行住宿", icon: "✈️", sentences: [
      ["Excuse me, how do I get to the train station?", "打扰一下，去火车站怎么走？"],
      ["Is it within walking distance?", "走路能到吗？"],
      ["Which platform does the train leave from?", "火车从哪个站台出发？"],
      ["I'd like to check in, please. I have a reservation.", "我要办理入住，我有预订。"],
      ["What time is checkout?", "几点退房？"],
      ["Could you call a taxi for me?", "你能帮我叫辆出租车吗？"],
      ["I think I'm lost. Can you help me?", "我好像迷路了，你能帮帮我吗？"],
      ["How long does it take to get there?", "到那里要多长时间？"],
      ["My flight has been cancelled.", "我的航班被取消了。"],
      ["Is breakfast included?", "含早餐吗？"],
    ],
  },
  {
    id: "work", title: "职场办公", icon: "💼", sentences: [
      ["Let's schedule a meeting for next Monday.", "我们下周一安排个会议吧。"],
      ["I'll send you the report by the end of the day.", "我今天下班前把报告发给你。"],
      ["Could you give me a hand with this?", "你能帮我一下吗？"],
      ["I'm afraid I can't make it to the meeting.", "恐怕我去不了会议了。"],
      ["Let me check and get back to you.", "我查一下再回复你。"],
      ["What's the deadline for this project?", "这个项目的截止日期是什么时候？"],
      ["I'm working from home today.", "我今天在家办公。"],
      ["Thanks for your hard work.", "辛苦了，谢谢你的付出。"],
      ["Can we discuss this later?", "我们晚点再讨论这个可以吗？"],
      ["I'd like to take a day off tomorrow.", "我明天想请一天假。"],
    ],
  },
  {
    id: "daily", title: "日常闲聊", icon: "☕", sentences: [
      ["I usually get up at seven.", "我通常七点起床。"],
      ["What are you up to this weekend?", "你这周末打算做什么？"],
      ["I'm running a bit late.", "我要晚一点到。"],
      ["It looks like it's going to rain.", "看起来要下雨了。"],
      ["I'm not feeling very well today.", "我今天有点不舒服。"],
      ["Would you like to grab a coffee?", "要不要一起去喝杯咖啡？"],
      ["I've been learning English for a month.", "我已经学了一个月英语了。"],
      ["Don't worry, it's not a big deal.", "别担心，没什么大不了的。"],
      ["That sounds like a great idea!", "听起来是个好主意！"],
      ["I can't wait to see you.", "我等不及要见你了。"],
    ],
  },
];

// 写作题目（AI 批改用）
window.WRITING_TOPICS = [
  { title: "介绍你自己", prompt: "Introduce yourself: your name, job or study, hobbies, and why you want to learn English.", hint: "80–120 词，用一般现在时" },
  { title: "我的周末", prompt: "Describe what you did last weekend and how you felt about it.", hint: "80–120 词，注意用过去时" },
  { title: "一个难忘的旅行", prompt: "Write about a trip you will never forget.", hint: "100–150 词，过去时 + 感受描写" },
  { title: "手机的利与弊", prompt: "What are the advantages and disadvantages of smartphones?", hint: "120–150 词，用 however / therefore 等连接词" },
  { title: "给朋友的一封信", prompt: "Write an email to a friend inviting them to your birthday party.", hint: "80–120 词，注意书信格式" },
  { title: "我的理想工作", prompt: "Describe your dream job and explain why you want it.", hint: "100–150 词，可以用 would / want to" },
  { title: "如何保持健康", prompt: "Give some advice on how to stay healthy.", hint: "100–150 词，用 should / had better" },
  { title: "网购还是实体店", prompt: "Do you prefer shopping online or in stores? Why?", hint: "120–150 词，用比较级表达观点" },
];

// AI 情景对话
window.CHAT_SCENARIOS = [
  { id: "free", icon: "💬", title: "自由聊天", role: "a friendly English-speaking friend", opening: "Hi there! How's your day going?" },
  { id: "coffee", icon: "☕", title: "咖啡店点单", role: "a barista at a coffee shop, taking the learner's order", opening: "Hi! Welcome to Nest Café. What can I get for you today?" },
  { id: "hotel", icon: "🏨", title: "酒店入住", role: "a hotel front desk receptionist helping the learner check in", opening: "Good evening, welcome to the Grand Hotel. Do you have a reservation?" },
  { id: "interview", icon: "💼", title: "求职面试", role: "a friendly job interviewer for an office job, asking one question at a time", opening: "Thanks for coming in today. Could you start by telling me a little about yourself?" },
  { id: "direction", icon: "🗺️", title: "问路", role: "a local person on the street. The learner is a tourist asking for directions", opening: "Hi, you look a little lost. Can I help you?" },
  { id: "doctor", icon: "🩺", title: "看医生", role: "a doctor at a clinic asking about the learner's symptoms", opening: "Hello, please have a seat. What seems to be the problem today?" },
  { id: "friend", icon: "🤝", title: "结交新朋友", role: "a new classmate meeting the learner for the first time at a party", opening: "Hey, I don't think we've met. I'm Alex. What's your name?" },
  { id: "movie", icon: "🎬", title: "聊电影", role: "a friend who loves movies and wants to talk about favorite films", opening: "Have you seen any good movies lately?" },
];
