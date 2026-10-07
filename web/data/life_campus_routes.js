// 人生剧场 · 留学一年：第 3–8 章。第 2 章结尾选的路线（route = study / drama / work）决定第 3、5、7 章走哪一条，
// 第 4、6、8 章大家都会经历，但会根据之前的选择说不同的话。第 8 章演完按属性和标记算结局（结局定义在 life_campus.js）
(() => {
  const S = LIFE.stories.campus;

  // ==================== 第 3 章：三条路线 ====================
  const C3_STUDY = {
    id: "c3s", when: "route=study", title: "The Study Group", zh: "第 3 章 · 学习小组",
    learn: [
      ["No hard feelings.", "我不介意 / 不记仇。", "化解之前的小冲突"],
      ["Let's divide and conquer.", "我们分头行动吧。", "分工合作"],
      ["I'm swamped.", "我忙得不可开交。", ""],
      ["pull your weight", "尽自己的那份力", "He's not pulling his weight."],
      ["Fair enough.", "有道理 / 行吧。", "接受对方的说法"],
    ],
    script: [
      ["", "周一早上九点，图书馆三楼的小组讨论室。Ananya 已经在白板上画好了一张表格，旁边坐着一个你认识的人。"],
      ["ananya", "Right. Group presentation for Dr. Fraser, three weeks from today. Four of us: me, you, Charlotte, and someone called Tom who hasn't replied to a single email.", "好了。给 Dr. Fraser 的小组展示，三周后。我们四个：我、你、Charlotte，还有一个叫 Tom 的，一封邮件都没回过。"],
      ["charlotte", "Hello again. I promise I'll be nicer than last time.", "又见面了。我保证这次会比上次友善。"],
      { who: "charlotte", ask: "上次说你「天真」的 Charlotte 主动跟你打招呼。", opts: [
        [2, "No hard feelings. You actually made me think, which was annoying but useful.", "没事，不记仇。你确实让我想了很多，虽然有点气人，但很有用。",
          "No hard feelings 是「我不介意、不记仇」；用一句幽默把上次的冲突化解掉，以后合作就轻松了。",
          [["charlotte", "Ha! Annoying but useful. That's going on my CV.", "哈！气人但有用。我要把这句写进简历。"]]],
        [1, "It's okay. I forgot already.", "没关系，我已经忘了。",
          "能懂，但 I forgot already 听起来有点像在赌气。说 No hard feelings 更大方。",
          [["charlotte", "Right. Good. Moving on, then.", "好吧。很好。那我们继续。"]]],
        [0, "You were very rude last time, but I forgive you.", "你上次很没礼貌，不过我原谅你。",
          "对方主动示好，你又翻旧账……英国人很少当面说别人 rude，这样说气氛会一下子僵住。",
          [["charlotte", "...Okay. Noted.", "……好吧。记住了。"]]],
      ] },
      ["ananya", "Let's divide and conquer. Someone does the research, someone does the slides, and someone presents.", "我们分头行动。一个人查资料，一个人做幻灯片，一个人上台讲。"],
      { decide: "你想负责哪部分？", id: "c3s_role", opts: [
        { en: "I'll take the research. I like digging through sources.", zh: "我负责查资料。我喜欢翻文献。", note: "学业", fx: { study: 6, role: "research" }, then: [
          ["ananya", "Perfect. I'll send you the reading list tonight. All forty items.", "完美。我今晚把书单发给你。一共四十项。"],
        ] },
        { en: "I'll present. I need the practice, to be honest.", zh: "我来上台讲。说实话，我需要练练。", note: "自信", fx: { confidence: 6, role: "present" }, then: [
          ["charlotte", "Brave. Dr. Fraser asks horrible questions at the end, you know.", "勇敢。你知道吧，Dr. Fraser 最后会问一些很要命的问题。"],
        ] },
        { en: "I'll do the slides, and I'll chase Tom.", zh: "我做幻灯片，顺便去催 Tom。", note: "人缘", fx: { social: 6, role: "slides" }, then: [
          ["ananya", "Thank you. Somebody has to, and it was going to be me, and I was going to be scary.", "谢谢你。总得有人去催，本来会是我，而且我会很吓人。"],
        ] },
      ] },
      ["", "晚上九点，你们还在讨论室里。头顶的喇叭响了。"],
      { listen: ["announce", "Attention, please. Due to maintenance work, the library will close at ten tonight instead of midnight. Group study rooms must be vacated by half past nine.", "请注意。由于维修，图书馆今晚十点闭馆，而不是午夜。小组讨论室须在九点半之前清空。"],
        ask: "广播说了什么？",
        opts: [
          [1, "今晚十点闭馆（不是午夜），讨论室九点半之前要清空", [["", "你们赶紧收拾东西，在九点二十九分走出了讨论室。"]]],
          [0, "今晚十二点闭馆，讨论室十点之前要清空", [["", "九点四十，管理员敲门把你们赶了出去。Ananya 的白板还没擦。"]]],
          [0, "明晚十点闭馆，因为要维修", [["", "九点四十，管理员敲门把你们赶了出去。"]]],
        ],
        tip: "instead of = 而不是；due to = 由于；vacate 是「腾出、清空」，公告里很常见。half past nine = 九点半。" },
      ["", "两周过去了。Tom 终于出现了一次，带着一个空白的 PPT 和一杯咖啡，然后又消失了。"],
      ["ananya", "I'm swamped. I've got two essays due on Friday, and Tom still hasn't done his part. I'm emailing Dr. Fraser. Right now.", "我忙疯了。周五要交两篇论文，Tom 还是没做他那部分。我要给 Dr. Fraser 发邮件。现在就发。"],
      { who: "ananya", ask: "Ananya 气坏了，要去找老师告状。", opts: [
        [2, "I get it, but maybe we should talk to Tom first. If he still doesn't pull his weight, then we go to Dr. Fraser.", "我理解，但也许我们应该先找 Tom 谈谈。如果他还是不出力，我们再去找 Dr. Fraser。",
          "I get it 先表示理解；pull his weight = 尽他那份力。先当面谈、再往上报，是英国团队合作里常见的做法。",
          [["ananya", "...Fine. Fair enough. But you're doing the talking.", "……好吧。有道理。但是你去说。"]]],
        [1, "Don't email. It is not good.", "别发邮件。这不好。",
          "有立场，但没说原因，也没给别的办法。可以说 Maybe we should talk to him first.",
          [["ananya", "Then what do you suggest? Doing his part for him?", "那你说怎么办？替他做吗？"]]],
        [0, "Tom is lazy. Let's just delete his name from the slides.", "Tom 很懒。我们直接把他的名字从幻灯片上删掉吧。",
          "背着他删名字比告状更激化矛盾，学校也可能把这当成学术问题来处理。",
          [["ananya", "Tempting. Very tempting. But no.", "很诱人。非常诱人。但是不行。"]]],
      ] },
      { decide: "怎么处理 Tom？", id: "c3s_tom", opts: [
        { en: "Let's message him together and set a clear deadline.", zh: "我们一起给他发消息，定一个明确的截止时间。", note: "沟通", fx: { social: 4, study: 3 }, then: [
          ["", "你们给 Tom 发了一条客气但坚定的消息。第二天早上，他交来了自己那部分，写得还不错。"],
          ["ananya", "Huh. He just needed someone to ask nicely. And firmly.", "嗯？他只是需要有人好好地、坚定地问他一下。"],
          { fx: { ananya: 4 } },
        ] },
        { en: "I'll just do his part myself. It's faster.", zh: "我直接替他做了吧，这样更快。", note: "自己扛", fx: { study: 5, confidence: -3 }, then: [
          ["", "你熬了两个通宵，把 Tom 的部分也做完了。你的黑眼圈快掉到下巴了。"],
          ["sam", "You look like you've pulled two all-nighters. ...You have, haven't you?", "你看起来像熬了两个通宵。……你真熬了，是吧？"],
          { fx: { sam: 3 } },
        ] },
        { en: "Fine, email Dr. Fraser. It's not fair on the rest of us.", zh: "好吧，给 Dr. Fraser 发邮件。这对我们其他人不公平。", note: "找老师", fx: { study: 3, fraser: 3 }, then: [
          ["", "Dr. Fraser 回得很快：He'll be marked separately. Thank you for letting me know."],
          ["", "后来 Tom 在走廊里看到你们，假装没看见。"],
        ] },
      ] },
      { if: "role=present", then: [["", "展示那天，你站在讲台上，手心全是汗。讲完最后一页，Dr. Fraser 抬起头。"]],
        else: [["", "展示那天，Charlotte 讲得很流畅。可讲完以后，Dr. Fraser 却把问题抛给了你。"]] },
      { mark: "pres" },
      ["fraser", "Interesting. But your main data is from 2015. Isn't it rather out of date?", "有意思。但你们的主要数据是 2015 年的。是不是有点过时了？"],
      { who: "fraser", ask: "Dr. Fraser 质疑你们的数据太旧。", opts: [
        [2, "That's a fair question. It's the most recent full data set, but we added a newer survey to check that the trend still holds.", "问得好。这是最新的完整数据，不过我们加了一份更新的调查，确认这个趋势依然成立。",
          "先肯定问题，再说明原因，最后补上你们怎么弥补，这是回答质疑的三步。the trend still holds = 趋势依然成立。",
          [["fraser", "Good. You anticipated that.", "很好。你们预料到了这个问题。"]]],
        [1, "Yes, it is old. Sorry.", "是的，有点旧。抱歉。",
          "承认没问题，但只道歉不解释，等于把分数让出去。说说为什么用它、怎么弥补。",
          [["fraser", "Hm. Something to fix for the final essay, then.", "嗯。那期末论文里要改进。"]]],
        [0, "All the data on the internet is old.", "网上所有的数据都很旧。",
          "以偏概全，听起来像在找借口。学术场合要具体：It's the most recent full data set we could find.",
          [["fraser", "All of it? I'm not sure that's true.", "全部？我不太确定是这样。"]]],
      ] },
      ["fraser", "One more. If you had to cut one of your three recommendations, which would it be?", "最后一个问题。如果你们三条建议必须删掉一条，删哪条？"],
      { who: "fraser", ask: "被追问，要做取舍。", opts: [
        [2, "I'd cut the third one. It's the most expensive, and the evidence behind it is the weakest.", "我会删掉第三条。它成本最高，背后的证据也最弱。",
          "直接给答案（I'd cut…），再给两个理由。被追问时先说结论再解释，最清楚。",
          [["fraser", "Decisive. I like that.", "果断。我喜欢。"]]],
        [1, "Maybe the third one? I'm not sure.", "也许是第三条？我不确定。",
          "有答案，但 I'm not sure 削弱了说服力。可以说 I'd probably cut the third one, because…",
          [["fraser", "Maybe? Alright.", "也许？好吧。"]]],
        [0, "All three are important, we cannot cut.", "三条都很重要，我们不能删。",
          "回避了问题，老师就是想看你会不会取舍。另外 cut 后面要有宾语：we can't cut any of them。",
          [["fraser", "That wasn't really the question.", "我问的不是这个。"]]],
      ] },
      { check: "pres", need: 3, label: "小组展示答辩", pass: [
        ["fraser", "Well done, all of you. A high mark, I suspect.", "大家都做得很好。我猜分数会很高。"],
        { fx: { study: 10, confidence: 6, fraser: 5 }, note: "展示拿了高分" },
      ], fail: [
        ["fraser", "Solid work, but you need to defend it more confidently. Come and see me at office hours.", "内容扎实，但答辩要更有底气。来我的答疑时间找我。"],
        { fx: { study: 4, office_hours: 1 }, note: "分数还行，Dr. Fraser 让你去答疑时间" },
      ] },
      ["", "那天晚上，Ananya 在小组群里发了一张图：一盒巧克力，配文 We survived."],
    ],
  };

  const C3_DRAMA = {
    id: "c3d", when: "route=drama", title: "The Audition", zh: "第 3 章 · 试镜",
    learn: [
      ["Break a leg!", "祝你好运！（演出前）", "演出前不说 good luck"],
      ["I'm a bundle of nerves.", "我紧张死了。", ""],
      ["Take it from the top.", "从头再来一遍。", "排练时常说"],
      ["give it a go", "试一试", ""],
      ["I'm chuffed!", "我太高兴了！", "英式口语"],
      ["skint", "穷得叮当响", "英式口语"],
    ],
    script: [
      ["", "周五傍晚，学生会剧场。三十多个人坐在台下，导演 Niamh 是个爱尔兰研究生，戴着一顶贝雷帽。"],
      ["ellie", "Break a leg! That means good luck, by the way. Don't actually break anything.", "Break a leg！顺便说一句，意思是祝你好运。别真摔断了什么。"],
      { who: "ellie", ask: "你紧张得手都在抖。", opts: [
        [2, "Thanks. I'm a bundle of nerves, honestly, but I'll give it a go.", "谢谢。说实话我紧张死了，不过我会试试的。",
          "a bundle of nerves = 紧张得要命；坦白自己紧张，再表示会试一试，很自然。",
          [["ellie", "That's the spirit. Nerves just mean you care!", "就是这个精神。紧张只说明你在乎！"]]],
        [1, "Thank you. I am very nervous.", "谢谢。我很紧张。",
          "完全可以，只是有点平。可以说 I'm a bundle of nerves，或者夸张一点：I'm so nervous I could be sick.",
          [["ellie", "Me too, every single time. You'll be fine.", "我也是，每次都是。你会没事的。"]]],
        [0, "Why you say break a leg? That's a bad thing.", "你为什么说摔断腿？这是坏事。",
          "疑问句缺了助动词：Why do you say…? 而且 Ellie 刚解释过了，break a leg 是剧场里的祝福。",
          [["ellie", "I literally just explained it! Oh, you're nervous. Okay. Breathe.", "我刚刚才解释过！哦，你是紧张了。好的。深呼吸。"]]],
      ] },
      ["niamh", "Next! Right, you're reading for the Stranger. Just one line.", "下一个！好，你试的是「陌生人」这个角色。只有一句台词。"],
      { listen: ["niamh", "Before you start: read it slowly, look at the back of the room, not at me, and pause after the word home.", "开始之前：慢慢读，看着最后一排，别看我，在 home 这个词后面停一下。"],
        ask: "导演给了你什么要求？",
        opts: [
          [1, "慢慢读，看着最后一排，在 home 后面停一下", [{ fx: { confidence: 3 } }]],
          [0, "读快一点，看着导演，在 home 前面停一下", [["", "你盯着 Niamh 读完了台词。她尴尬地指了指后排。"]]],
          [0, "慢慢读，看着导演，读完鞠一躬", [["", "你盯着 Niamh 读完，还鞠了一躬。台下有人笑出了声。"]]],
        ],
        tip: "the back of the room = 最后一排；pause after… = 在……之后停顿。导演给指令通常很快，抓住几个动词：read、look、pause。" },
      ["", "台词是：I came a long way to find a home, and I found it in a stranger's kitchen."],
      { decide: "怎么读这句台词？", id: "c3d_read", opts: [
        { en: "(Read it slowly and calmly, as if you really mean it.)", act: true, zh: "慢慢地、平静地读，就像真心这么想", fx: { confidence: 5 }, then: [
          ["niamh", "...Lovely. Very honest. Thank you.", "……很好。非常真诚。谢谢。"],
        ] },
        { en: "(Let a small smile creep in on the word kitchen.)", act: true, zh: "在 kitchen 那里带一点笑意", fx: { confidence: 5, social: 3 }, then: [
          ["", "台下有几个人笑了。"],
          ["niamh", "Ha! Interesting choice. I like it.", "哈！有意思的处理。我喜欢。"],
        ] },
        { en: "Sorry, could I take it from the top?", zh: "不好意思，我能从头再来一遍吗？", fx: { confidence: 3 }, then: [
          ["niamh", "Of course. Take your time.", "当然。慢慢来。"],
          ["", "第二遍，你的声音稳多了。"],
        ] },
      ] },
      ["", "三天后，演员表贴出来了。你的名字在上面：Stranger / Ensemble。"],
      ["ellie", "You're in! We're both in! And I'm the lead! Are you chuffed? You should be chuffed!", "你选上了！我们都选上了！我还是主角！你高兴吗？你应该超高兴！"],
      { who: "ellie", ask: "Ellie 激动得跳了起来。", opts: [
        [2, "I'm absolutely chuffed! And you got the lead. That's huge, Ellie. Congratulations!", "我太高兴了！而且你拿到了主角，太厉害了 Ellie。恭喜你！",
          "chuffed 是英式口语「超开心」，用她的词回应她；别忘了也祝贺她拿到主角。",
          [["ellie", "Ahh! Drinks on me. Well, squash. I'm skint.", "啊啊！我请你喝东西。呃，果汁吧。我穷得叮当响。"]]],
        [1, "Yes, I'm happy.", "是的，我很高兴。",
          "能懂。用 chuffed 呼应她会更好，再加一句恭喜她拿到主角。",
          [["ellie", "Happy? Just happy? We're going to be on STAGE!", "高兴？只是高兴？我们要上台了！"]]],
        [0, "Only ensemble. It's a small role, not very good.", "只是群演。角色很小，不太好。",
          "她正兴奋着，你泼了冷水。而且 ensemble（群演）在剧团里很重要。",
          [["ellie", "Hey. There are no small roles, only small... no, I can't remember how it ends.", "嘿。没有小角色，只有小……不行，我想不起后半句了。"]]],
      ] },
      ["niamh", "Rehearsals are Tuesdays and Thursdays, six till nine. Don't be late. I mean it. Oh, and does anyone want to help me write a new scene?", "排练是每周二和周四，六点到九点。别迟到，我是认真的。哦，还有，有人愿意帮我写一场新戏吗？"],
      { decide: "Niamh 在找人写新场景。", id: "c3d_write", opts: [
        { en: "I'd love to have a go at writing it.", zh: "我很想试着写写看。", note: "多一份责任", fx: { study: -2, confidence: 5, writer: 1 }, then: [
          ["niamh", "Brilliant. Something about being far from home, maybe? Write what you know.", "太好了。也许写写远离家乡的感觉？写你熟悉的东西。"],
        ] },
        { en: "(Stay quiet. You've got an essay due.)", act: true, zh: "没出声，还有论文要写", note: "顾好学业", fx: { study: 4 }, then: [
          ["", "你回去写论文。半夜，Ellie 敲门，给你带了一块剧组剩下的蛋糕。"],
          { fx: { ellie: 3 } },
        ] },
      ] },
      { fx: { money: -40 }, note: "交了剧组的服装费" },
    ],
  };

  const C3_WORK = {
    id: "c3w", when: "route=work", title: "First Shift", zh: "第 3 章 · 第一个班",
    learn: [
      ["To have in or take away?", "堂食还是外带？", "英式说法；美式说 For here or to go?"],
      ["Got it.", "明白了。", "比 I know 好得多"],
      ["My apologies.", "非常抱歉。", "比 sorry 更正式"],
      ["Leave it with me.", "交给我吧。", "让对方放心"],
      ["short-staffed", "人手不够", ""],
    ],
    script: [
      ["", "周一早上七点半，学校咖啡馆。Kate 递给你一条围裙。"],
      ["manager", "Morning! Quick tour: coffee machine, milk fridge, pastries. And in the UK we say to have in or take away, not for here or to go. Got it?", "早！快速参观一下：咖啡机、牛奶冰箱、点心。还有，在英国我们说 to have in or take away，不说 for here or to go。明白了吗？"],
      { who: "manager", ask: "Kate 问你记住了没有。", opts: [
        [2, "Got it. Have in or take away. Anything else I should know before the rush?", "明白了。堂食还是外带。高峰之前还有什么需要我知道的吗？",
          "复述一遍关键词，说明你听进去了；before the rush = 高峰之前。主动问问题，显得很靠谱。",
          [["manager", "Ooh, keen. I like it. The rush hits at ten past eight. Brace yourself.", "哦，挺积极。我喜欢。八点十分高峰就来了。做好准备。"]]],
        [1, "Yes. I know.", "是的。我知道。",
          "I know 听起来像「这我早就知道了」。说 Got it 或 Makes sense 更好。",
          [["manager", "Great. We'll see, won't we?", "很好。那我们走着瞧？"]]],
        [0, "OK. Have in or take out.", "好的。堂食或者外卖。",
          "take out 是美式说法，英国说 take away。差一个词，英国顾客可能会愣一下。",
          [["manager", "Take AWAY. Close enough. Sort of.", "是 take AWAY。差不多吧。勉强。"]]],
      ] },
      ["", "八点十分，队伍排到了门口。一个围着围巾的女生走到柜台前。"],
      { listen: ["customer", "Hiya, can I get a medium flat white with oat milk and an extra shot, and a cheese scone, warmed up? To take away, please.", "嗨，我要一杯中杯澳白，燕麦奶，加一份浓缩，再要一个芝士司康，加热一下。外带，谢谢。"],
        ask: "顾客点了什么？",
        opts: [
          [1, "中杯澳白，燕麦奶，加一份浓缩；芝士司康加热；外带", [{ fx: { money: 5 }, note: "顾客给了 £5 小费" }]],
          [0, "中杯拿铁，燕麦奶，加一份浓缩；芝士司康；堂食", [{ fx: { money: -5 }, note: "做错了，重做一杯（从工资里扣了 £5）" }]],
          [0, "大杯澳白，全脂奶，不加浓缩；芝士司康加热；外带", [{ fx: { money: -5 }, note: "做错了，重做一杯（从工资里扣了 £5）" }]],
        ],
        tip: "flat white = 澳白；an extra shot = 加一份浓缩；warmed up = 加热。听点单要抓住：大小、饮品、奶、加什么、堂食还是外带。" },
      ["", "十点，一个穿西装的美国游客皱着眉头走回柜台。"],
      ["tourist", "Excuse me. I asked for skimmed milk, and this is definitely full fat.", "不好意思。我要的是脱脂奶，这杯肯定是全脂的。"],
      { who: "tourist", ask: "顾客投诉你拿错了奶。", opts: [
        [2, "My apologies. I'll make you a fresh one with skimmed milk right away. Leave it with me.", "非常抱歉。我马上用脱脂奶给您重新做一杯。交给我吧。",
          "My apologies 比 sorry 更正式；马上给出解决办法（make a fresh one）是处理投诉的关键；Leave it with me 让对方放心。",
          [["tourist", "Thank you. Appreciate it.", "谢谢。感谢。"], { fx: { manager: 3 } }]],
        [1, "Sorry, sorry. I change it.", "抱歉抱歉。我换。",
          "态度对了，但时态不对：I'll change it。服务行业里道歉一次、说清楚怎么办就好。",
          [["tourist", "...Okay. Quickly, please.", "……好吧。快点。"]]],
        [0, "I'm sure I used skimmed milk. Maybe you are wrong.", "我确定我用的是脱脂奶。也许是你搞错了。",
          "就算你确定没错，跟顾客争只会让事情更糟。先换一杯，别的再说。",
          [["tourist", "Can I speak to the manager?", "我能跟你们经理谈谈吗？"], ["manager", "Coming! Sir, let me sort that out for you.", "来了！先生，我来帮您处理。"], { fx: { manager: -3 } }]],
      ] },
      ["", "下班的时候，Kate 叫住了你。"],
      ["manager", "Not bad for a first day. Listen, I'm short-staffed this term. Could you do three more shifts a week? More money, obviously.", "第一天表现不错。听着，这学期我人手不够。你能每周多上三个班吗？钱当然也会多。"],
      { decide: "Kate 想让你多上三个班。", id: "c3w_shifts", opts: [
        { en: "Sure, I could use the money. Count me in.", zh: "好啊，我正需要钱。算我一个。", note: "钱多，学习时间少", fx: { money: 240, study: -6, confidence: 4, manager: 6 }, then: [
          ["manager", "Legend! You've saved my life.", "传奇！你救了我的命。"],
        ] },
        { en: "I can do one more, but my studies come first.", zh: "我可以多上一个班，不过学业还是第一位。", note: "两边兼顾", fx: { money: 80, manager: 3 }, then: [
          ["manager", "Fair enough. One's better than none.", "行。一个总比没有好。"],
        ] },
        { en: "I'd rather not this term. My coursework has to be my priority right now.", zh: "这学期我还是算了。现在课业必须是我的首要任务。", note: "学业优先", key: "priority", fx: { study: 6, manager: -2 }, then: [
          ["manager", "No worries. The offer's open if you change your mind.", "没关系。你改主意的话，随时找我。"],
        ] },
      ] },
      { fx: { money: 120 }, note: "第一周的工资到账了" },
      ["", "第一份英国工资到账的时候，你截了个图发给妈妈。"],
    ],
  };

  // ==================== 第 4 章：篝火之夜（大家都会经历） ====================
  const C4 = {
    id: "c4", title: "Bonfire Night", zh: "第 4 章 · 篝火之夜",
    learn: [
      ["What's the story behind it?", "这背后有什么故事？", "问来历"],
      ["I'm a bit homesick.", "我有点想家。", ""],
      ["It's on me.", "我请客。", ""],
      ["It means a lot.", "这对我意义很大。", "回应真诚的感谢或夸奖"],
      ["I'm stuffed.", "我吃撑了。", ""],
    ],
    script: [
      ["", "十一月初，爱丁堡下午四点半就天黑了。公寓门上贴了一张纸：FLAT 12 · BONFIRE NIGHT · CALTON HILL · 7PM。"],
      { if: "route=drama", then: [["", "你刚从排练室跑回来，嗓子还是哑的。"]] },
      { if: "route=work", then: [["", "你刚下班，身上还是咖啡豆的味道。"]] },
      { if: "route=study", then: [["", "你刚从图书馆出来，脑子里还全是脚注。"]] },
      ["sam", "Bonfire Night. Fireworks, bonfires, and a lot of cold people saying ooh. It's tradition.", "篝火之夜。烟花、篝火，还有一大群冻得发抖的人在那儿「哦——」。这是传统。"],
      { who: "sam", ask: "你想知道这个节日是怎么来的。", opts: [
        [2, "Sounds brilliant. What's the story behind it, though?", "听起来很棒。不过，这背后有什么故事？",
          "What's the story behind it? 是问来历的自然说法；though 放句尾，表示话题小小地一转。",
          [["sam", "In 1605, a man called Guy Fawkes tried to blow up Parliament. He failed. So now we celebrate... with explosions. Very British.", "1605 年，一个叫盖伊·福克斯的人想炸掉议会。他失败了。所以现在我们用……爆炸来庆祝。非常英国。"]]],
        [1, "What is this festival meaning?", "这个节日是什么意思？",
          "语序乱了。可以说 What does this festival mean? 或者 What's the story behind it?",
          [["sam", "The meaning? Er, a man tried to blow up Parliament in 1605. He failed. We set off fireworks about it.", "意思？呃，1605 年有人想炸议会，失败了。我们为这件事放烟花。"]]],
        [0, "Fireworks are dangerous. And China invented them anyway.", "烟花很危险。而且烟花本来就是中国发明的。",
          "前半句扫兴，后半句像在比谁厉害（虽然是事实）。换个轻松的说法：Fun fact: fireworks were invented in China!",
          [["sam", "Fair enough. You can tell everyone that tonight.", "有道理。你今晚可以跟大家讲讲这个。"]]],
      ] },
      ["", "Calton Hill 上，烟花一朵接一朵。你的手机震了：家里的群里，爸爸发来一张照片，奶奶在包饺子，配文：「等你回来。」"],
      { if: "homesick", then: [["", "第一个晚上那种想家的感觉，又回来了。"]] },
      ["ellie", "Hey. You've gone quiet. You alright?", "嘿。你怎么不说话了。还好吗？"],
      { decide: "要不要告诉她？", id: "c4_tell", opts: [
        { en: "Honestly? I'm a bit homesick. My gran is making dumplings, and I'm not there.", zh: "说实话？我有点想家。我奶奶在包饺子，可我不在。", note: "说出来", fx: { ellie: 6, social: 4 }, then: [
          ["ellie", "Oh, love. Come here.", "哦，亲爱的。过来。"],
          ["", "她给了你一个大大的拥抱，然后突然松开。"],
          ["ellie", "Wait. Can YOU make dumplings? Because I have an idea.", "等等。你会包饺子吗？因为我有个主意。"],
        ] },
        { en: "I'm fine! Just cold. Look, that one's huge!", zh: "我没事！就是冷。看，那个好大！", note: "藏在心里", fx: { confidence: 2 }, then: [
          ["ellie", "It IS huge! Okay. But if you're not fine, you'll tell me. Deal?", "确实好大！好吧。但如果你不好，要告诉我。说定了？"],
          ["", "她挽住你的胳膊，没有再问。第二天，你决定给公寓做一顿中国菜。"],
        ] },
      ] },
      { decide: "给 Flat 12 做一顿中国菜。做什么？", id: "c4_dinner", opts: [
        { en: "Let's go all out. Hotpot for everyone, and it's on me.", zh: "来个大的。给大家做火锅，我请客。", note: "花 £80", req: "money>=100", reqText: "存款不到 £100，请不起",
          fx: { money: -80, social: 8, ellie: 4, sam: 4 }, then: [
            ["", "你在中国超市买了一大袋火锅底料、毛肚和粉丝。Sam 第一次吃毛肚，表情很复杂。"],
            ["sam", "It's... chewy. I like it? I think I like it.", "这个……很有嚼劲。我喜欢？我觉得我喜欢。"],
          ] },
        { en: "Dumplings. They're cheap, and everyone can help.", zh: "包饺子吧。便宜，而且大家都能帮忙。", note: "花 £20", fx: { money: -20, social: 6, ellie: 3, sam: 3 }, then: [
          ["", "大家挤在小厨房里包饺子。Ellie 包的每一个都像一个小拳头。"],
          ["ellie", "Mine have... character.", "我包的……很有个性。"],
        ] },
      ] },
      { if: "met_ananya", then: [["", "Ananya 也来了，还带了一大瓶芒果拉西。"], { fx: { ananya: 3 } }] },
      ["sam", "This is genuinely the best meal I've had since I got here. Thank you.", "这真的是我来这儿以后吃过最好的一顿。谢谢你。"],
      { who: "sam", ask: "Sam 很认真地向你道谢。", opts: [
        [2, "It means a lot to hear that. Cooking for you lot made it feel a bit like home.", "听你这么说我很开心。给你们做饭，让我有点在家的感觉。",
          "It means a lot 回应真诚的感谢；you lot 是英式口语「你们这帮人」，很亲切。",
          [["sam", "Same time next week? I'll bring the tea.", "下周同一时间？我带茶。"]]],
        [1, "You're welcome. Eat more.", "不客气。多吃点。",
          "很热情！不过英语里劝吃一般说 Help yourself 或 Have some more，Eat more 听起来像命令。",
          [["sam", "I literally can't. I'm stuffed.", "我真吃不下了。撑死了。"]]],
        [0, "It's normal food. In China everybody can cook this.", "这是很普通的菜。在中国每个人都会做。",
          "过分谦虚，会让夸你的人不知道怎么接。大方地接受：Thanks, I'm glad you liked it!",
          [["sam", "Well, I can't. So to me, it's magic.", "可是我不会。所以对我来说，这是魔法。"]]],
      ] },
      ["", "那晚之后，冰箱上多了一张纸：Flat 12 Family Dinner — Every Sunday."],
      { fx: { family_dinner: 1 } },
    ],
  };

  // ==================== 第 5 章：三条路线 ====================
  const C5_STUDY = {
    id: "c5s", when: "route=study", title: "The Deadline", zh: "第 5 章 · 截止日之前",
    learn: [
      ["I'm behind on ...", "……进度落后了", "I'm behind on my essay."],
      ["I've got your back.", "我挺你。", ""],
      ["It's not worth the risk.", "不值得冒这个险。", ""],
      ["an extension", "延期", "ask for an extension"],
      ["So what?", "那又怎样？（论证要回答的问题）", "写论文时每段之后问自己"],
    ],
    script: [
      ["", "十二月初，期末论文截止前三天。图书馆二十四小时开放，凌晨两点还坐满了人。"],
      ["ananya", "I'm so behind on my economics essay. Two thousand words, and I've written... a title.", "我的经济学论文进度落后太多了。两千字，我写了……一个标题。"],
      ["ananya", "You've finished yours already, right? Could I just look at it? Only for the structure, I promise.", "你的已经写完了吧？我能看一眼吗？只看结构，我保证。"],
      { who: "ananya", ask: "Ananya 想看你的论文。你知道这可能算抄袭。", opts: [
        [2, "I've got your back, but sharing my essay isn't worth the risk for either of us. How about I help you plan yours instead?", "我挺你，但把论文给你看，对我们俩都不值得冒这个险。要不我帮你列提纲？",
          "I've got your back 先表明你站在她这边；拒绝 + 替代方案，是最体面的说不。",
          [["ananya", "...You're right. Ugh, I hate that you're right. Okay. Outline. Go.", "……你说得对。唉，我讨厌你说得对。好吧。提纲。开始。"]]],
        [1, "Sorry, I can't. It's plagiarism.", "抱歉，不行。这是抄袭。",
          "立场清楚，规则也对，但对一个累到崩溃的朋友有点冷。再加一句你能怎么帮她。",
          [["ananya", "...Yeah. I know. Sorry I asked.", "……嗯。我知道。不该问的。"]]],
        [0, "OK, but don't copy too much.", "好吧，但别抄太多。",
          "这其实是在默许抄袭。英国大学查重很严，被查出来两个人都可能不及格。",
          [["", "你把文件发了过去。那一晚你都没睡好。"], { fx: { risk: 1 } }]],
      ] },
      ["", "第二天，Dr. Fraser 在课上提醒大家延期的规定。"],
      { listen: ["fraser", "A reminder: extensions are only granted for medical or personal emergencies, and you must apply at least forty-eight hours before the deadline, through the online form, not by email.", "提醒一下：只有生病或个人紧急情况才能批准延期，而且必须在截止前至少四十八小时，通过网上表格申请，不接受邮件。"],
        ask: "延期怎么申请？",
        opts: [
          [1, "只有生病或个人紧急情况才行，截止前至少 48 小时通过网上表格申请"],
          [0, "什么理由都可以，截止前 24 小时发邮件申请"],
          [0, "只有生病才行，截止后 48 小时内通过网上表格补申请"],
        ],
        tip: "granted = 批准；at least forty-eight hours before = 至少提前 48 小时；through the online form, not by email，not 后面的内容常常就是陷阱。" },
      { if: "risk", then: [
        ["", "一周后，你和 Ananya 都收到了 Dr. Fraser 的邮件：Please come to my office. Your essays are unusually similar."],
        { decide: "在 Dr. Fraser 的办公室里……", id: "c5s_confess", opts: [
          { en: "It was my fault. I shared my essay. Ananya was exhausted, and I wanted to help.", zh: "是我的错，是我把论文给她看的。她累坏了，我想帮她。", note: "承担责任", fx: { study: -10, fraser: -5, ananya: 8, honest: 1 }, then: [
            ["fraser", "Thank you for being honest. You'll both resubmit, and the marks will be capped at a pass. Don't let it happen again.", "谢谢你说实话。你们俩都要重交，分数最高只能是及格。别再有下次。"],
          ] },
          { en: "(Say nothing, and let Ananya explain.)", act: true, zh: "一言不发，让 Ananya 去解释", note: "沉默", fx: { study: -10, ananya: -10, fraser: -8 }, then: [
            ["fraser", "Both essays will be capped at a pass. I have to say, I'm disappointed.", "两篇论文最高都只能给及格。我不得不说，我很失望。"],
            ["", "回去的路上，Ananya 一句话也没跟你说。"],
          ] },
        ] },
      ], else: [
        ["", "你们一起熬了两个晚上。截止前一小时，Ananya 按下了提交键。"],
        ["ananya", "Submitted. I'm going to sleep for a week. Thank you. Seriously.", "交了。我要睡一个星期。谢谢你。说真的。"],
        { fx: { study: 6, ananya: 5 } },
        ["", "一月，成绩出来了：68 分。在英国，70 分以上就是一等，你只差两分。"],
        { decide: "差两分。怎么办？", id: "c5s_feedback", opts: [
          { en: "I'll go to his office hours and ask how to push it to a First.", zh: "我去他的答疑时间，问问怎么冲到一等。", note: "冲一等", fx: { study: 8, fraser: 5, confidence: 3 }, then: [
            ["fraser", "Sixty-eight. Close. Your argument is good, but you describe more than you analyse. After every paragraph, ask yourself: so what?", "68 分。很接近了。你的论点不错，但描述多于分析。每写完一段，问问自己：那又怎样？"],
            ["", "你把 So what? 写在便利贴上，贴在了电脑旁边。"],
          ] },
          { en: "Sixty-eight is fine. I need a break.", zh: "68 分挺好了。我需要休息一下。", note: "歇口气", fx: { confidence: 3, social: 4 }, then: [
            ["", "你和 Flat 12 的人去看了一场电影，整整三个小时没想论文。"],
          ] },
        ] },
      ] },
    ],
  };

  const C5_DRAMA = {
    id: "c5d", when: "route=drama", title: "Opening Night", zh: "第 5 章 · 首演之夜",
    learn: [
      ["burn the candle at both ends", "蜡烛两头烧（过度劳累）", ""],
      ["word-perfect", "台词一字不差", ""],
      ["I'm writing to ask whether I could possibly ...", "写信想问一下我是否可以……", "正式邮件里的请求"],
      ["stage left", "舞台左侧（演员面向观众时的左边）", ""],
      ["stay in character", "保持角色、不跳戏", ""],
    ],
    script: [
      ["", "演出在十二月十二日，论文截止在十二月十日。你已经连续三周每天只睡五个小时，蜡烛两头烧。"],
      ["niamh", "Everyone, we're adding a Saturday rehearsal. And I need you all word-perfect by Monday. No scripts on stage.", "各位，我们周六加一场排练。周一之前台词必须一字不差，台上不许拿剧本。"],
      { if: "writer", then: [["niamh", "Oh, and your scene. I love it. We're keeping it, and you're performing it.", "哦，还有你写的那场。我很喜欢。我们留下了，你来演。"], { fx: { confidence: 5 } }] },
      ["", "你看着日历：论文还差一千五百字。"],
      { decide: "怎么办？", id: "c5d_plan", opts: [
        { en: "Email Dr. Fraser and ask for an extension.", zh: "给 Dr. Fraser 发邮件申请延期。", note: "写一封正式邮件", then: [
          { who: "fraser", ask: "邮件怎么写？", opts: [
            [2, "Dear Dr. Fraser, I'm writing to ask whether I could possibly have a short extension. I've fallen behind because of rehearsals, and I'd rather submit something I'm proud of. I completely understand if this isn't possible.", "亲爱的 Fraser 博士：写信想问一下我是否可以稍微延期。因为排练，我的进度落后了，我希望交一篇自己满意的论文。如果不行，我完全理解。",
              "Dear + 头衔开头；I'm writing to ask whether I could possibly… 是正式请求的经典句型；坦诚说明原因，最后表示理解对方可能拒绝。",
              [["fraser", "Rehearsals aren't usually grounds for an extension. But you've been honest and polite. Three days. Not a minute more.", "排练通常不能作为延期的理由。不过你很坦诚，也很有礼貌。三天。一分钟都不能多。"], { fx: { study: 5 } }]],
            [1, "Hi, can I have more time for my essay? I'm very busy with drama. Thanks.", "嗨，我的论文能多给点时间吗？我忙着演戏。谢谢。",
              "意思有了，但对老师太随便：Hi 开头、没有称呼，理由听起来像「我有更重要的事」。",
              [["fraser", "I'm afraid drama rehearsals aren't grounds for an extension.", "恐怕排练不能作为延期的理由。"], { fx: { study: -3 } }]],
            [0, "Dear Sir, please give me one week more time because I am very busy. Waiting for your reply.", "亲爱的先生：请再给我一周时间，因为我很忙。等待您的回复。",
              "one week more time 要说 one more week；Waiting for your reply 是中式结尾，英文用 I look forward to hearing from you；please give me 读起来像命令。",
              [["fraser", "Please read the extension policy. Being busy doesn't qualify.", "请看一下延期规定。「很忙」不符合条件。"], { fx: { study: -4 } }]],
          ] },
        ] },
        { en: "Pull a couple of all-nighters and do both.", zh: "熬两个通宵，两边都顾上。", note: "硬扛", fx: { study: 3, confidence: -4 }, then: [
          ["", "第二个通宵的凌晨四点，你写着写着睡着了，脸上印着键盘的格子。"],
          ["sam", "Right. That's it. I'm making you toast, and then you're going to bed.", "好了。到此为止。我给你烤片面包，然后你去睡觉。"],
          { fx: { sam: 5 } },
        ] },
        { en: "Stop procrastinating, plan every hour, and do both properly.", zh: "不再拖延，每个小时都排好，两边都好好做。", key: "procrastinate", note: "做计划", fx: { study: 5, confidence: 3 }, then: [
          ["", "你把每天切成半小时一格的计划表，贴在墙上。居然真的做到了。"],
        ] },
      ] },
      ["", "首演前半小时，Niamh 把大家叫到后台。"],
      { listen: ["niamh", "Last notes. Enter from stage left on Ellie's line, Who's there? Count to three, then speak. And don't look at the audience until the final scene.", "最后几点提醒。听到 Ellie 说 Who's there? 时，从舞台左侧上场。数到三，再开口。最后一场之前不要看观众。"],
        ask: "Niamh 让你什么时候、怎么上场？",
        opts: [
          [1, "听到 Ellie 说 Who's there? 时从舞台左侧上场，数到三再说话", [{ fx: { confidence: 3 } }]],
          [0, "听到 Ellie 说 Who's there? 时从舞台右侧上场，马上说话", [["", "你从右边冲上了台，差点撞上布景。"]]],
          [0, "数到三以后从舞台左侧上场，一上场就看着观众", [["", "你一上场就盯着观众，第一排有个小孩冲你挥手。"]]],
        ],
        tip: "stage left 是演员面向观众时的左边（观众看过去是右边）。on Ellie's line = 听到 Ellie 那句台词的时候。" },
      ["", "第二幕，Ellie 要推开一扇门，门把手却掉了。台下一片安静。"],
      { mark: "improv" },
      ["ellie", "Oh no. The door's stuck. Stranger, can you help me?", "糟了。门卡住了。陌生人，你能帮帮我吗？"],
      { who: "ellie", ask: "道具坏了。Ellie 在台上即兴，把话头抛给了你。", opts: [
        [2, "Stand back. Where I come from, we say every door opens if you're patient enough. Or if you kick it.", "退后。在我的家乡，我们说只要够耐心，每扇门都会打开。或者踢一脚。",
          "即兴接戏的诀窍是 Yes, and…：接受对方的设定，再加一点东西。where I come from 也正好符合你「外乡人」的角色。",
          [["", "你轻轻踢了一脚，门开了。台下爆发出笑声。"]]],
        [1, "OK. I help you.", "好的。我帮你。",
          "接住了戏，但要说 I'll help you；台词也可以更有角色感。",
          [["", "你帮她把门推开了。没人发现出了问题。"]]],
        [0, "Sorry, the door is broken.", "抱歉，门坏了。",
          "在台上跳出角色、说出道具坏了，是演出大忌。观众其实不知道发生了什么，接着演就好。",
          [["", "台下有人笑了，但不是你想要的那种笑。"]]],
      ] },
      ["ellie", "Thank you, stranger. I don't even know your name.", "谢谢你，陌生人。我连你的名字都不知道。"],
      { who: "ellie", ask: "把即兴收回到剧情里。", opts: [
        [2, "Names don't matter much when you're far from home. But you can call me friend.", "离家很远的时候，名字没那么重要。不过你可以叫我朋友。",
          "顺着剧情把即兴收回主线，还呼应了整部戏「家」的主题。",
          [["ellie", "Friend. I like that.", "朋友。我喜欢这个名字。"]]],
        [1, "My name is not important.", "我的名字不重要。",
          "接住了，但有点冷。舞台上可以多给一点情感。",
          [["ellie", "Oh. Right. Well, thank you anyway.", "哦。好吧。总之谢谢你。"]]],
        [0, "Ellie, it's me! We live together!", "Ellie，是我啊！我们住一起的！",
          "叫出了演员的真名，跳戏了。stay in character：不管发生什么，都留在角色里。",
          [["", "台下哄堂大笑。Ellie 的嘴角抽了一下，硬是把戏接了下去。"]]],
      ] },
      { check: "improv", need: 3, label: "首演救场", pass: [
        ["", "谢幕时，Niamh 在侧台冲你竖起大拇指。一个围着丝巾的女人走过来，递给你一张名片：Fringe producer。"],
        { fx: { confidence: 10, fringe_scout: 1, ellie: 4 }, note: "艺术节的制作人注意到了你" },
      ], fail: [
        ["niamh", "We got through it. Next time, stay in character, whatever happens.", "总算演完了。下次不管发生什么，都要留在角色里。"],
        { fx: { confidence: 3 }, note: "演出顺利结束" },
      ] },
    ],
  };

  const C5_WORK = {
    id: "c5w", when: "route=work", title: "The Christmas Rush", zh: "第 5 章 · 圣诞高峰",
    learn: [
      ["We're rushed off our feet.", "忙得脚不沾地。", ""],
      ["cover a shift", "替班", "Could you cover my shift?"],
      ["I'm not comfortable with that.", "我觉得这样不妥。", "委婉而坚定地拒绝"],
      ["CV", "简历", "美式说 résumé"],
      ["reference", "推荐信", "求职时前雇主写的评价"],
    ],
    script: [
      ["", "十二月，王子街的圣诞市场开了，咖啡馆的队伍从早排到晚。"],
      ["manager", "We're rushed off our feet, and Josh just called in sick. Could you cover his shift tonight? I'll owe you one.", "我们忙得脚不沾地，Josh 又打电话请病假了。你今晚能替他的班吗？我欠你一个人情。"],
      { decide: "今晚替不替班？你明天有个作业要交。", id: "c5w_cover", opts: [
        { en: "No problem. I've got you.", zh: "没问题，交给我。", note: "多赚一点", fx: { money: 60, study: -4, manager: 5 }, then: [
          ["manager", "You're a star.", "你真是个大好人。"],
        ] },
        { en: "Sorry, I can't tonight. I've got a deadline tomorrow. Could I do Saturday instead?", zh: "抱歉，今晚不行，我明天有个截止。周六可以吗？", note: "换个时间", fx: { study: 3, manager: 1, confidence: 3 }, then: [
          ["manager", "Saturday works. Thanks for offering something.", "周六可以。谢谢你给了个替代方案。"],
        ] },
      ] },
      ["", "下午，一个熟悉的身影走进了咖啡馆。是 Dr. Fraser。"],
      { listen: ["fraser", "Large black coffee, please. You're in my seminar, aren't you? My brother-in-law runs a consultancy in town. They're looking for a part-time intern in the new year. Send your CV to the address on this card.", "一杯大杯黑咖啡，谢谢。你是我研讨课上的学生吧？我姐夫在城里开了一家咨询公司，新年过后要招一个兼职实习生。把简历发到这张名片上的地址。"],
        ask: "Dr. Fraser 告诉了你什么？",
        opts: [
          [1, "他姐夫在城里开咨询公司，新年后招兼职实习生，让你按名片上的地址发简历", [{ fx: { confidence: 3 }, note: "你当天晚上就把简历发了过去" }]],
          [0, "他姐夫开咖啡馆，新年后招全职咖啡师，让你给他打电话", [["", "你打了名片上的电话，对方说：Sorry, this is a consultancy… did you want to send a CV? 你脸一红，赶紧去发简历。"]]],
          [0, "他哥哥在城里开咨询公司，现在就缺人，让你今天去面试", [["", "你冲到公司，前台说实习生新年才开始招，请你先发简历。你只好回去补发了一封邮件。"]]],
        ],
        tip: "brother-in-law = 姐夫、妹夫、小舅子等；consultancy = 咨询公司；in the new year = 新年过后；CV = 简历。" },
      ["", "晚上快打烊的时候，Kate 把你拉到一边，压低了声音。"],
      ["manager", "Between you and me: could you put the leftover pastries in the bin and ring them up as sold? Head office counts waste, and it makes us look bad.", "就你知我知：你能把剩下的点心扔了，在收银机上记成卖掉了吗？总部会统计浪费，这样我们很难看。"],
      { who: "manager", ask: "Kate 让你在收银系统上作假。", opts: [
        [2, "I'm not comfortable with that, Kate. Could we donate them to the food bank instead? Then the waste figure goes down honestly.", "我觉得这样不太妥，Kate。我们把它们捐给食物银行怎么样？这样浪费的数字也能老老实实地降下来。",
          "I'm not comfortable with that 是委婉而坚定的拒绝；再给一个两全的办法，对方就有台阶下。",
          [["manager", "...Huh. That's actually a better idea. Food bank it is.", "……嗯。这其实是个更好的主意。那就送食物银行。"], { fx: { confidence: 4 } }]],
        [1, "No, that is not right.", "不，这样不对。",
          "态度对，但太直接，Kate 会下不来台。用 I'm not comfortable with that，再给个替代方案。",
          [["manager", "Alright, alright. Forget I said anything.", "好吧好吧。就当我没说过。"]]],
        [0, "OK, no problem.", "好的，没问题。",
          "这在很多公司算违规，出了事收银记录上是你的名字。遇到不合理的要求，要学会说 I'm not comfortable with that。",
          [["", "你照做了。之后每次看到收银机，心里都有点不舒服。"], { fx: { fiddled: 1 } }]],
      ] },
      { if: "manager>=10 & !fiddled", then: [
        ["manager", "By the way, you've been brilliant this term. If you ever need a reference, I'll write you a glowing one.", "对了，你这学期表现得太棒了。如果你需要推荐信，我给你写一封好到发光的。"],
        { fx: { reference: 1 }, note: "Kate 答应给你写推荐信" },
      ], else: [
        ["manager", "Thanks for this term. See you after Christmas.", "这学期谢谢你。圣诞后见。"],
      ] },
      { fx: { money: 200 }, note: "圣诞季的工资和小费" },
    ],
  };

  // ==================== 第 6 章：苏格兰新年（大家都会经历） ====================
  const HOGMANAY = [
    ["", "十二月三十一日，王子街挤满了人。午夜十二点，城堡上空的烟花炸开，所有人都在倒数。"],
    ["ellie", "Happy New Year! Now, everyone, hold hands and cross your arms. It's Auld Lang Syne!", "新年快乐！好了，大家手拉手，胳膊交叉。唱《友谊地久天长》！"],
    ["", "你跟着陌生人一起摇晃着唱歌，虽然只会唱副歌。手机上，国内已经是早上八点，妈妈发来一句：「新年快乐，别冻着。」"],
    ["ellie", "So, what's your New Year's resolution?", "那么，你的新年计划是什么？"],
    { who: "ellie", ask: "Ellie 问你的新年计划。", opts: [
      [2, "To say yes more often. Everything that scared me this year turned out to be the best bits.", "多说「好」。今年所有让我害怕的事，最后都成了最精彩的部分。",
        "New Year's resolution 就是新年计划；best bits 是英式口语「最精彩的部分」。真诚、具体的回答最打动人。",
        [["ellie", "That's the most beautiful thing anyone's said to me tonight. And someone proposed to me earlier. As a joke. I think.", "这是今晚别人对我说过最美的话。之前还有人跟我求婚了。开玩笑的。我觉得。"]]],
      [1, "My resolution is study hard.", "我的新年计划是努力学习。",
        "少了 to：My resolution is to study hard. 意思也比较普通，可以说得更具体一点。",
        [["ellie", "Boring! But fair.", "无聊！但也说得过去。"]]],
      [0, "I have no resolution. Resolutions are useless.", "我没有新年计划。新年计划都没用。",
        "也许是真心话，但在新年夜这么说有点扫兴。",
        [["ellie", "Grinch! The Grinch of Hogmanay!", "扫兴鬼！苏格兰新年的扫兴鬼！"]]],
    ] },
  ];

  const C6 = {
    id: "c6", title: "Hogmanay", zh: "第 6 章 · 苏格兰新年",
    learn: [
      ["Hogmanay", "苏格兰的新年夜", ""],
      ["Auld Lang Syne", "《友谊地久天长》", "新年夜手拉手唱的歌"],
      ["New Year's resolution", "新年计划", ""],
      ["catch up", "聊聊近况、叙叙旧", "Let's catch up over tea."],
      ["worth sixty percent", "占总成绩的百分之六十", ""],
    ],
    script: [
      ["", "圣诞假期到了，公寓里大家都在收拾行李。"],
      ["sam", "I'm off to London tomorrow. Mum's cooking enough food for forty people.", "我明天回伦敦。我妈做的饭够四十个人吃。"],
      ["ellie", "And I'm staying! My parents live twenty minutes away, and Hogmanay in Edinburgh is the best party on Earth.", "我留下来！我爸妈家就二十分钟远，而且爱丁堡的苏格兰新年是地球上最棒的派对。"],
      { decide: "这个假期你怎么过？", id: "c6_xmas", opts: [
        { en: "I'm flying home. I miss my family too much.", zh: "我要回国。太想家里人了。", note: "机票 £550", req: "money>=550", reqText: "机票要 £550，存款不够",
          fx: { money: -550, confidence: 3, flew_home: 1 }, then: [
            ["", "你在家待了两个星期。奶奶包了三次饺子，每次都多包一盘让你带走。"],
            ["", "在家的时候，你会不自觉地说 cheers 和 sorry。你妈说你「洋气了」。"],
            ["", "回爱丁堡那天，你给 Flat 12 带了一整箱零食。"],
            { fx: { social: 5, ellie: 3, sam: 3 } },
          ] },
        { en: "I'll stay and do Hogmanay with Ellie.", zh: "我留下来，跟 Ellie 一起过苏格兰新年。", note: "跟着 Ellie 疯一次", fx: { social: 6, ellie: 6 }, then: HOGMANAY },
        { en: "I'll stay and use the quiet weeks to get ahead.", zh: "我留下来，趁这几周安静先把进度赶上。", note: "安静地赶进度", fx: { study: 8, confidence: 2 }, then: [
          ["", "图书馆里只剩你和几个博士生。"],
          { if: "route=work", then: [["", "你还接了咖啡馆的几个假期班，多赚了一笔。"], { fx: { money: 150, manager: 3 } }] },
          { if: "route=drama", then: [["", "你把下学期的剧本背得滚瓜烂熟。"], { fx: { confidence: 3 } }] },
        ] },
      ] },
      ["", "一月，新学期开始。Sam 拖着一大箱约克郡茶回来了。"],
      ["sam", "Right, kettle's on. Let's catch up properly. I want to hear everything.", "好了，水烧上了。我们好好聊聊。我什么都想听。"],
      ["", "开学第一节课，Dr. Fraser 宣布了这学期最重要的作业。"],
      { listen: ["fraser", "This term, your final assessment is a research proposal. Three thousand words, due on the twenty-first of April, and worth sixty percent of the module.", "这学期的期末考核是一份研究计划。三千字，四月二十一日截止，占这门课总成绩的百分之六十。"],
        ask: "期末作业是什么要求？",
        opts: [
          [1, "研究计划，三千字，4 月 21 日截止，占 60%", [{ fx: { study: 3 } }]],
          [0, "研究计划，两千字，4 月 21 日截止，占 60%", [{ fx: { study: -2 }, note: "你按两千字写了提纲，后来才发现要三千字" }]],
          [0, "研究计划，三千字，4 月 1 日截止，占 16%", [{ fx: { study: -2 }, note: "你以为它只占 16%，前两个月都没怎么上心" }]],
        ],
        tip: "twenty-first 是 21 号，不是 1 号；sixty percent 和 sixteen percent 的重音不同：SIXty 重音在前，sixTEEN 重音在后。worth… of the module = 占这门课成绩的……" },
      ["", "离毕业，还有五个月。"],
    ],
  };

  // ==================== 第 7 章：三条路线的关键时刻 ====================
  const C7_STUDY = {
    id: "c7s", when: "route=study", title: "Going for a First", zh: "第 7 章 · 冲刺一等",
    learn: [
      ["burn out", "精疲力竭、倦怠", "I think I'm burning out."],
      ["I'd argue that ...", "我认为……（学术）", "提出论点"],
      ["To put it another way, ...", "换句话说……", ""],
      ["That's beyond the scope of ...", "那超出了……的范围", "说明研究边界"],
      ["You've got this.", "你可以的。", "鼓励别人"],
    ],
    script: [
      ["", "四月，离提交只剩两周。图书馆里，Ananya 盯着屏幕，一动不动。"],
      ["ananya", "I think I'm burning out. I got a sixty-two on my last essay, and my parents asked if I'm really trying.", "我觉得我快撑不住了。上一篇论文我只拿了 62 分，我爸妈问我是不是真的在努力。"],
      { who: "ananya", ask: "Ananya 快崩溃了。", opts: [
        [2, "Hey. A sixty-two while doing everything you do is impressive. You're burning out because you care too much, not too little. Let's take tonight off.", "嘿。你做了这么多事，还能拿 62 分，已经很厉害了。你累垮是因为太在乎了，不是不够在乎。今晚我们休息吧。",
          "先肯定，再换个角度解释她的处境（because you care too much），最后给一个具体的建议。",
          [["ananya", "...Tonight off? Is that allowed? ...Okay. Okay.", "……今晚休息？可以吗？……好吧。好吧。"]]],
        [1, "Don't worry, sixty-two is okay.", "别担心，62 分还行。",
          "安慰的方向对，但 don't worry 有点轻描淡写。先承认她的感受：That sounds really hard.",
          [["ananya", "It's not okay for me. But thanks.", "对我来说不行。不过谢谢。"]]],
        [0, "Maybe you should study more efficiently, like me.", "也许你应该学得更有效率一点，像我一样。",
          "朋友在倾诉时，你给建议还拿自己比，只会让她更难受。先听，再安慰。",
          [["ananya", "...Wow. Thanks.", "……哇。谢谢啊。"]]],
      ] },
      { decide: "今晚怎么过？", id: "c7s_night", opts: [
        { en: "Let's grab some chips and walk up Arthur's Seat for the sunset.", zh: "我们去买点薯条，爬亚瑟王座看日落吧。", note: "陪朋友", fx: { ananya: 6, social: 4, study: -2 }, then: [
          ["", "山顶的风很大。整个爱丁堡在脚下变成了金色。"],
          ["ananya", "Thank you. I needed this more than I knew.", "谢谢你。我比自己想象的更需要这个。"],
        ] },
        { en: "Let's take a short break, then get back to it.", zh: "我们休息一会儿，然后接着干。", note: "冲进度", fx: { study: 4, ananya: 2 }, then: [
          ["", "你们在图书馆门口喝了杯热巧克力，又回去写到了闭馆。"],
        ] },
      ] },
      ["", "五月，Dr. Fraser 推荐你去面试暑期研究助理的职位。面试官就是他自己，外加一位从伦敦来的教授。"],
      { mark: "ra" },
      ["fraser", "So. Tell us about your research idea in two sentences.", "那么。用两句话说说你的研究想法。"],
      { who: "fraser", ask: "用两句话说清你的研究。", opts: [
        [2, "I'd argue that free tuition mainly helps middle-income students, not the poorest. To put it another way, it's support for living costs that really makes the difference.", "我认为免学费主要帮助的是中等收入的学生，而不是最穷的学生。换句话说，真正起作用的是生活费资助。",
          "I'd argue that 提出论点；To put it another way 换个说法再讲一遍。两句话，层次很清楚。",
          [["fraser", "Clear and specific. Good.", "清楚、具体。很好。"]]],
        [1, "My idea is about free university. I think it is good for poor students.", "我的想法是关于免费大学的。我认为这对穷学生很好。",
          "太笼统。学术面试要有具体的论点，最好带一个对比。",
          [["fraser", "Hm. Could you be more specific?", "嗯。能更具体一点吗？"]]],
        [0, "It's difficult to explain in two sentences. Can I use ten?", "两句话很难说清楚。我能用十句吗？",
          "面试官要看的就是你的概括能力。拒绝这个限制，会显得没准备好。",
          [["fraser", "Two, please.", "两句，谢谢。"]]],
      ] },
      ["fraser", "And what about international students? Doesn't your argument ignore them?", "那国际学生呢？你的论点是不是忽略了他们？"],
      { who: "fraser", ask: "被指出研究有漏洞。", opts: [
        [2, "That's a fair point. International fees are beyond the scope of this project, but I'd love to look at them in a follow-up study.", "有道理。国际学生的学费超出了这个项目的范围，不过我很想在后续研究里看看。",
          "That's a fair point 先承认；beyond the scope of 说明研究边界；最后把漏洞变成以后的研究方向，非常地道的学术回应。",
          [["fraser", "A good answer. Know your limits.", "回答得好。清楚自己研究的边界。"]]],
        [1, "Yes, I forgot them. Sorry.", "是的，我忘了他们。抱歉。",
          "诚实，但说「忘了」会显得研究不严谨。用 beyond the scope 说明是有意不研究的。",
          [["fraser", "Something to think about, then.", "那就值得想一想了。"]]],
        [0, "International students are rich, so it doesn't matter.", "国际学生都很有钱，所以无所谓。",
          "以偏概全，也不太尊重人，包括你自己。",
          [["fraser", "That's quite a generalisation.", "这个概括有点太武断了。"]]],
      ] },
      ["fraser", "Last question. Why should we choose you?", "最后一个问题。我们为什么要选你？"],
      { who: "fraser", ask: "为什么选你？", opts: [
        [2, "Because I've learned to argue in a second language, and to change my mind when the evidence tells me to. I think that makes me a careful researcher.", "因为我学会了用第二语言去论证，也学会了在证据面前改变想法。我觉得这让我成为一个谨慎的研究者。",
          "用你自己真实的经历回答，而不是空泛的形容词，很有说服力。",
          [["fraser", "...That's a very good answer.", "……这是个非常好的回答。"]]],
        [1, "Because I am hard-working and I like research.", "因为我很努力，而且喜欢做研究。",
          "常见但空泛。用一个具体的经历来证明你努力、你喜欢。",
          [["fraser", "Everyone says that, I'm afraid.", "恐怕每个人都这么说。"]]],
        [0, "Because I need the money for the summer.", "因为我暑假需要钱。",
          "很诚实，但面试里这么说……",
          [["fraser", "Honest. I'll give you that.", "很诚实。这点我承认。"]]],
      ] },
      { check: "ra", need: 4, label: "研究助理面试", pass: [
        ["fraser", "We'd like to offer you the position. Congratulations.", "我们决定录用你。恭喜。"],
        { fx: { study: 12, confidence: 10, fraser: 5, ra: 1 }, note: "拿到了暑期研究助理的职位" },
      ], fail: [
        ["fraser", "It was close, but we've chosen another candidate. Don't be discouraged. Your proposal is going to be strong.", "很接近，但我们选了另一位候选人。别灰心，你的研究计划会写得很好的。"],
        { fx: { study: 5, confidence: -3 }, note: "没拿到职位，但 Dr. Fraser 的话让你又有了劲" },
      ] },
      ["", "六月，成绩公布的那天早上，Ananya 第一个打来电话。"],
      { listen: ["ananya", "I got it! A First! Seventy-one overall! And you? Open the email. Open it now!", "我拿到了！一等！总分 71！你呢？打开邮件。现在就打开！"],
        ask: "Ananya 考了多少？",
        opts: [
          [1, "一等，总分 71"],
          [0, "一等，总分 77"],
          [0, "二等一，总分 67"],
        ],
        tip: "seventy-one 和 seventy-seven 要听清后半；英国本科总分 70 以上是一等（First），60–69 是二等一（2:1）。" },
      { if: "study>=80", then: [["", "你打开邮件：Overall 72. First Class Honours. 你盯着屏幕看了整整一分钟。"]],
        else: [["", "你打开邮件：Overall 66. Upper Second Class. 离一等差一点，但这是你用第二语言拿到的成绩。"]] },
    ],
  };

  const C7_DRAMA = {
    id: "c7d", when: "route=drama", title: "The Fringe", zh: "第 7 章 · 艺术节",
    learn: [
      ["stage fright", "怯场", ""],
      ["Can I run it by you?", "能说给你听听、帮我把把关吗？", ""],
      ["I'm over the moon.", "我高兴坏了。", ""],
      ["You nailed it.", "你做得太棒了。", ""],
      ["a sell-out show", "票全卖光的演出", ""],
    ],
    script: [
      ["", "五月，戏剧社决定把这部戏带去八月的爱丁堡艺术节（the Fringe）。艺术节版本要重新选角，每个人都要再试一次。"],
      { if: "fringe_scout", then: [["", "那位递给你名片的制作人也会来看试镜。"]] },
      { if: "writer", then: [["niamh", "Your scene stays in. If you can perform it, it's yours.", "你写的那场会保留。你能演好，它就是你的。"]] },
      ["ellie", "You've gone white. Is it stage fright?", "你脸都白了。怯场了？"],
      { who: "ellie", ask: "你紧张得不行。", opts: [
        [2, "A bit. Can I run my monologue by you one more time? You're the toughest audience I know.", "有点。我能再给你演一遍独白吗？你是我知道的最挑剔的观众。",
          "run it by you = 说给你听听、让你把把关；后半句半开玩笑地夸她，把紧张变成了玩笑。",
          [["ellie", "Toughest? Flattery will get you everywhere. Go on, then.", "最挑剔？嘴这么甜，什么都好说。来吧。"]]],
        [1, "Yes, I'm afraid.", "是的，我害怕。",
          "能懂。不过 I'm afraid 单独用时常被理解成后面还有话（I'm afraid that…）。可以直接说 I've got stage fright.",
          [["ellie", "Totally normal. Breathe in for four, out for four.", "完全正常。吸气数四下，呼气数四下。"]]],
        [0, "No, I'm not nervous. Chinese students never nervous.", "不，我不紧张。中国学生从不紧张。",
          "少了动词：are never nervous；而且明显在嘴硬，也没必要代表所有中国学生。",
          [["ellie", "Your hands are literally shaking.", "你的手明明在抖。"]]],
      ] },
      { decide: "试镜演哪一段？", id: "c7d_piece", opts: [
        { en: "The stranger's monologue. The one I've lived all year.", zh: "陌生人的那段独白。我这一年就是这么过来的。", note: "真诚", fx: { confidence: 3 }, then: [] },
        { en: "Puck's speech from A Midsummer Night's Dream.", zh: "《仲夏夜之梦》里帕克的那段独白。", note: "挑战莎士比亚", fx: { confidence: 2, study: 2 }, then: [["", "莎士比亚的英语比你想的难十倍，你背了整整一周。"]] },
        { en: "A comedy piece about British queues.", zh: "一段讲英国人排队的喜剧小品。", note: "逗笑大家", fx: { confidence: 2, social: 3 }, then: [["", "你把在咖啡馆、超市、公交站看到的排队奇景全写了进去。"]] },
      ] },
      ["", "试镜结束，Niamh 放下笔。"],
      { mark: "fringe" },
      ["niamh", "Lovely. Now, why this piece?", "很好。为什么选这一段？"],
      { who: "niamh", ask: "Niamh 问你为什么选这段。", opts: [
        [2, "Because it's about being an outsider who slowly becomes part of something. That's been my whole year, so I didn't have to pretend.", "因为它讲的是一个外来者慢慢融入一个地方。这就是我这一整年，所以我不用假装。",
          "把选择和自己的经历连起来，导演最想听的就是这种回答。",
          [["niamh", "That came through. It really did.", "这一点演出来了。真的。"]]],
        [1, "Because I like it.", "因为我喜欢。",
          "太简单了。多说一句为什么喜欢，它和你有什么关系。",
          [["niamh", "Fair enough. Anything more?", "行。还有别的吗？"]]],
        [0, "Because it's short and easy to remember.", "因为它短，好记。",
          "也许是真的，但这样说会让导演觉得你不够投入。",
          [["niamh", "...Right.", "……好吧。"]]],
      ] },
      ["niamh", "Can you do it again, but angry this time?", "你能再演一遍吗？这次带着愤怒演。"],
      { who: "niamh", ask: "导演要你换一种方式演。", opts: [
        [2, "Absolutely. Give me a second to find it.", "当然。给我一秒钟找找感觉。",
          "导演让你换方式演，是在看你的可塑性。爽快答应，再要一点准备时间，很专业。",
          [["", "你闭上眼睛，想起第一晚那个关不上的行李箱。再睁开眼时，声音变了。"], ["niamh", "Yes! That's it!", "对！就是这样！"]]],
        [1, "Angry? OK, I try.", "愤怒？好，我试试。",
          "要用将来时：OK, I'll try. 犹豫一下也正常，不过语气可以更肯定。",
          [["niamh", "Go on, then.", "那来吧。"]]],
        [0, "But the character is not angry. It doesn't make sense.", "可是这个角色不生气啊。这说不通。",
          "导演不是要你辩论角色，是想看你能不能演出不同的东西。先试，之后再讨论。",
          [["niamh", "Humour me.", "就当满足我一下。"]]],
      ] },
      { check: "fringe", need: 3, label: "艺术节试镜", pass: [
        ["niamh", "You're in. All of August, eight shows a week. Welcome to the Fringe.", "你选上了。整个八月，每周八场。欢迎来到艺术节。"],
        { fx: { confidence: 12, fringe: 1 }, note: "拿到了艺术节的角色" },
      ], fail: [
        ["niamh", "You were good, but I need you somewhere else. You'll be our assistant director. Nobody knows this play better than you.", "你演得不错，但我需要你在别的位置。你来做我们的助理导演。没有人比你更懂这部戏。"],
        { fx: { confidence: 6, asst_dir: 1 }, note: "成了艺术节的助理导演" },
      ] },
      ["", "八月，艺术节第一场。后台，Niamh 把所有人叫到一起。"],
      { listen: ["niamh", "Fifteen minutes to curtain. The house is full. It's a sell-out. Phones off, water's backstage, and whatever happens, keep going.", "离开幕还有十五分钟。观众席满了，票全卖光了。手机关掉，水在后台，不管发生什么，都要演下去。"],
        ask: "Niamh 说了什么？",
        opts: [
          [1, "还有 15 分钟开幕，票全卖光了，关手机，不管发生什么都要演下去"],
          [0, "还有 50 分钟开幕，观众还没坐满，可以带手机上台"],
          [0, "还有 15 分钟开幕，票没卖完，出了问题就停下来"],
        ],
        tip: "fifteen 和 fifty 要听重音：fifTEEN 重音在后，FIFty 重音在前。curtain = 开幕；the house is full = 满座；a sell-out = 票全卖光了。" },
      { if: "fringe", then: [["", "谢幕时全场起立。你在台上找到了 Ellie 的手。"]],
        else: [["", "你在侧台盯着每一个换景。谢幕时，Niamh 把你推上台，让你和大家一起鞠躬。"]] },
      ["ellie", "You nailed it. I'm over the moon. We did it!", "你太棒了。我高兴坏了。我们做到了！"],
    ],
  };

  const C7_WORK = {
    id: "c7w", when: "route=work", title: "The Interview", zh: "第 7 章 · 面试",
    learn: [
      ["Tell me about a time when ...", "说说你……的一次经历", "行为面试题"],
      ["What would you say is your biggest weakness?", "你最大的缺点是什么？", "面试常见问题"],
      ["Do you have any questions for us?", "你有什么问题想问我们吗？", "面试结尾必问"],
      ["visa sponsorship", "工作签证担保", "国际生找工作必问"],
      ["We'll be in touch.", "我们会联系你的。", "面试结束时的客套话"],
    ],
    script: [
      ["", "一月到四月，你每周两天在那家咨询公司实习：做表格、整理会议记录，偶尔也在会上发言。"],
      ["", "五月，公司开放了一个毕业生岗位。面试官 Daniel 是从纽约总部调来的美国人。"],
      { if: "reference", then: [["", "Kate 写的推荐信放在你文件夹的最上面。"], { fx: { confidence: 4 } }] },
      { listen: ["daniel", "So here's how it'll work. I'll ask you three questions, then you'll have five minutes to ask me anything. The whole thing should take about forty minutes.", "流程是这样的：我问你三个问题，然后你有五分钟可以问我任何问题。整个面试大概四十分钟。"],
        ask: "面试流程是怎样的？",
        opts: [
          [1, "他问 3 个问题，你有 5 分钟提问，一共大约 40 分钟", [{ fx: { confidence: 3 } }]],
          [0, "他问 5 个问题，你有 3 分钟提问，一共大约 14 分钟"],
          [0, "他问 3 个问题，你有 5 分钟提问，一共大约 14 分钟"],
        ],
        tip: "forty 和 fourteen 要听重音：FORty 重音在前，fourTEEN 重音在后。The whole thing should take about… = 整个过程大约需要……" },
      { mark: "job" },
      ["daniel", "Tell me about a time when you dealt with a difficult situation at work.", "说说你在工作中处理困难情况的一次经历。"],
      { who: "daniel", ask: "行为面试题：讲一个具体的例子。", opts: [
        [2, "During the Christmas rush, a customer complained that we'd used the wrong milk. I apologised, made a fresh drink straight away, and then suggested we label the milk jugs, so it never happened again.", "圣诞高峰时，有位顾客投诉我们用错了奶。我道了歉，马上重新做了一杯，之后还建议给奶壶贴标签，这样就再没出过错。",
          "STAR 结构：情况（Situation）、任务（Task）、行动（Action）、结果（Result）。最后说你带来了什么改变，很加分。",
          [["daniel", "Nice. You fixed the problem and the system.", "不错。你不只解决了问题，还改进了流程。"]]],
        [1, "One time a customer was angry. I said sorry and gave him a new coffee.", "有一次一个顾客生气了。我道了歉，给他换了杯新咖啡。",
          "有情况、有行动，但太短，缺少结果和你从中学到了什么。",
          [["daniel", "Okay. And what did you learn from that?", "好的。你从中学到了什么？"]]],
        [0, "I never have difficult situations. I'm very good at my job.", "我从来没遇到过困难的情况。我工作很出色。",
          "面试官想看你怎么解决问题，说「从没遇到过」反而减分。",
          [["daniel", "Never? Not once?", "从来没有？一次都没有？"]]],
      ] },
      ["daniel", "What would you say is your biggest weakness?", "你觉得自己最大的缺点是什么？"],
      { who: "daniel", ask: "最难答的那道题。", opts: [
        [2, "I used to avoid speaking up in meetings, especially in English. So this year I made myself speak first whenever I could. I'm still working on it, but I'm far more confident now.", "我以前在会上不敢发言，尤其是用英语。所以这一年我逼自己尽量第一个发言。我还在努力，但现在自信多了。",
          "真实的缺点 + 你为改进做了什么 + 现在的进展，是回答这道题的标准结构。",
          [["daniel", "I can see that. You've been very clear today.", "看得出来。你今天表达得很清楚。"]]],
        [1, "I'm a perfectionist.", "我是个完美主义者。",
          "面试官听过一万遍了。用一个真实、可以改进的例子。",
          [["daniel", "Hm. Everyone's a perfectionist in interviews.", "嗯。面试里每个人都是完美主义者。"]]],
        [0, "My English is not good, so maybe I can't do this job.", "我的英语不好，所以也许我做不了这份工作。",
          "你直接说自己做不了，面试官会相信的。缺点要说成可以改进的事。",
          [["daniel", "Your English seems fine to me. But okay.", "我觉得你的英语没问题啊。不过好吧。"]]],
      ] },
      ["daniel", "Last thing. Do you have any questions for us?", "最后一件事。你有什么问题想问我们吗？"],
      { who: "daniel", ask: "轮到你提问了。", opts: [
        [2, "Yes, two. What does success look like in the first six months? And is the company able to offer visa sponsorship for international graduates?", "有两个。入职前六个月，怎样算做得好？另外，公司能为国际毕业生提供工作签证担保吗？",
          "先问工作本身，再问签证，两个问题都很专业。visa sponsorship 是国际生一定要问清楚的事。",
          [["daniel", "Great questions. And yes, we do sponsor visas.", "好问题。是的，我们提供签证担保。"]]],
        [1, "How much is the salary?", "工资多少？",
          "可以问，但第一个问题就问工资，会显得只关心钱。先问工作内容。",
          [["daniel", "It's in the job description. Anything else?", "职位描述里有写。还有别的吗？"]]],
        [0, "No, I don't have any questions.", "没有，我没有问题。",
          "不提问会让人觉得你不感兴趣。至少准备一两个问题。",
          [["daniel", "Okay. Well, thanks for coming in.", "好的。那谢谢你今天过来。"]]],
      ] },
      { check: "job", need: 4, label: "毕业生岗位面试", pass: [
        ["daniel", "I'll be honest: that was one of the best interviews I've had this week. Expect a call.", "说实话，这是我这周面过最好的之一。等我们电话吧。"],
        ["", "三天后，电话来了。你拿到了 offer。"],
        { fx: { confidence: 12, offer: 1 }, note: "拿到了毕业生岗位的 offer" },
      ], fail: [
        ["daniel", "Thanks for coming in. We'll be in touch.", "谢谢你过来。我们会联系你的。"],
        ["", "一周后，你收到一封邮件，第一句是：Unfortunately…"],
        { fx: { confidence: -5 } },
        { decide: "怎么回这封拒信？", id: "c7w_reply", opts: [
          { en: "Thank you for letting me know. Would you be willing to share any feedback on my interview?", zh: "谢谢您告知。您愿意给我一些面试的反馈吗？", note: "体面地追问", fx: { confidence: 8, second_chance: 1 }, then: [
            ["daniel", "Happy to. You were strong, just a little general in places. We're opening another role in September. I'd encourage you to apply.", "很乐意。你表现很好，只是有些地方说得太笼统。我们九月还会开一个岗位，我建议你申请。"],
          ] },
          { en: "(Close the email and don't reply.)", act: true, zh: "关掉邮件，不回了", note: "算了", fx: {}, then: [
            ["", "你关掉电脑，去咖啡馆上了最后一个班。"],
          ] },
        ] },
      ] },
    ],
  };

  // ==================== 第 8 章：毕业（大家都会经历，演完算结局） ====================
  const C8 = {
    id: "c8", ending: true, title: "Graduation", zh: "第 8 章 · 毕业",
    learn: [
      ["I owe you one.", "我欠你一个人情。", ""],
      ["It's been a pleasure.", "很荣幸（和你相处）。", "道别时说"],
      ["Let's keep in touch.", "我们保持联系吧。", ""],
      ["Take care of yourself.", "照顾好自己。", ""],
      ["See you around.", "回头见。", "轻松的道别"],
    ],
    script: [
      ["", "六月底，毕业典礼前一天。Flat 12 的人最后一次一起坐在厨房里。"],
      { if: "family_dinner", then: [["", "冰箱上那张 Every Sunday 的纸已经泛黄了，角上还有一块火锅底料的油渍。"]] },
      { listen: ["announce", "Graduates, please arrive at the hall by ten. Gowns can be collected from the room next to the main entrance. Guests are asked to take their seats by a quarter to eleven.", "毕业生请十点前到达礼堂。学位袍在正门旁边的房间领取。请来宾在十点四十五分之前就座。"],
        ask: "毕业典礼的通知说了什么？",
        opts: [
          [1, "毕业生十点前到，学位袍在正门旁边的房间领，来宾 10:45 前就座"],
          [0, "毕业生十点前到，学位袍在礼堂里领，来宾 11:15 前就座"],
          [0, "毕业生十一点前到，学位袍在正门旁边领，来宾 10:15 前就座"],
        ],
        tip: "a quarter to eleven = 差一刻十一点，也就是 10:45；a quarter past 是「过一刻」。gown = 学位袍。" },
      ["sam", "So. What happens now? Are you staying, or...?", "那么。接下来呢？你要留下来，还是……？"],
      { if: "offer | second_chance", then: [["", "你想起了那家公司，和九月的签证。"]] },
      { if: "route=drama", then: [["", "你想起了艺术节的舞台，和这一年在台上说过的每一句台词。"]] },
      { if: "route=study", then: [["", "你想起了图书馆三楼的白板，和 Ananya 的那盒巧克力。"]] },
      { who: "sam", ask: "跟 Sam 道别。", opts: [
        [2, "Wherever I end up, you've got a sofa in China. And I expect a lifetime supply of Yorkshire Tea in return.", "不管我最后去哪儿，你在中国都有一张沙发可以睡。作为交换，我要终身供应的约克郡茶。",
          "用一个具体的邀请 + 一个小玩笑告别，比一句 goodbye 温暖得多。in return = 作为回报。",
          [["sam", "Deal. I'll ship it in bulk.", "成交。我会一箱一箱地寄。"]]],
        [1, "I will miss you. Goodbye, Sam.", "我会想你的。再见，Sam。",
          "很真诚。英国朋友之间更常说 I'll miss you, mate. Let's keep in touch.",
          [["sam", "I'll miss you too. Keep in touch, yeah?", "我也会想你的。保持联系，好吗？"]]],
        [0, "Thank you for everything. I will never forget your kindness forever.", "谢谢你做的一切。我永远都不会永远忘记你的好。",
          "never 和 forever 意思重复了。说 I'll never forget it 或 I'll always remember it 就好。",
          [["sam", "Never forever? That's a long time. Thanks, though.", "永不永远？那可真久。不过谢谢。"]]],
      ] },
      ["ellie", "Don't look at me, I'm not crying. You're crying.", "别看我，我没哭。是你在哭。"],
      { who: "ellie", ask: "跟 Ellie 道别。", opts: [
        [2, "I owe you one, Ellie. You dragged me out of my room on the very first night, and you never stopped.", "我欠你一个人情，Ellie。第一个晚上你就把我从房间里拽了出来，而且一直没停过。",
          "I owe you one = 我欠你一个人情；提起一件具体的往事，告别就有了分量。",
          [["ellie", "And I never will. Even from Scotland. Especially from Scotland.", "我也永远不会停。就算在苏格兰。尤其是在苏格兰。"]]],
        [1, "Don't cry, Ellie. We can video call.", "别哭，Ellie。我们可以视频。",
          "很体贴。也可以借这个机会，说一句你真正想谢她的事。",
          [["ellie", "Every week. I'm putting it in my calendar.", "每周都要。我现在就写进日历。"]]],
        [0, "Why are you crying? It's not a big deal.", "你为什么哭？这没什么大不了的。",
          "她舍不得你，你说「没什么大不了」，有点伤人。",
          [["ellie", "It is to me.", "对我来说是。"]]],
      ] },
      { if: "met_ananya", then: [["ananya", "Don't forget me either. I have a spreadsheet of everyone's birthdays. You're on it.", "也别忘了我。我有一张表，记着所有人的生日。你在上面。"], { fx: { ananya: 3 } }] },
      { decide: "在爱丁堡的最后一个晚上：", id: "c8_last", opts: [
        { en: "Let's walk up Arthur's Seat one last time, all of us.", zh: "我们最后一次一起去爬亚瑟王座吧，所有人。", note: "一起看日落", fx: { social: 6, ellie: 3, sam: 3 }, then: [
          ["", "山顶上，四个人挤在一起拍了一张照片。Ellie 闭眼了，Sam 没看镜头。这是你最喜欢的一张。"],
        ] },
        { en: "(Write each of them a letter, in English.)", act: true, zh: "给每个人写一封英文信", note: "写下来", fx: { confidence: 4, ellie: 3, sam: 3 }, then: [
          ["", "你写到凌晨三点。每一封信都比你这一年写过的任何一篇论文都难。"],
          ["", "第二天，你把信塞进了他们的门缝里。"],
        ] },
      ] },
      ["", "毕业典礼上，礼堂里坐满了人。念到你的名字时，你走上台，和校长握了手。"],
      ["", "这一年，结束了。"],
    ],
  };

  S.chapters.push(C3_STUDY, C3_DRAMA, C3_WORK, C4, C5_STUDY, C5_DRAMA, C5_WORK, C6, C7_STUDY, C7_DRAMA, C7_WORK, C8);
})();
