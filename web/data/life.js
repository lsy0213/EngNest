// 人生剧场：每个选择都是另一种人生。每本剧本一个文件（data/life_*.js），往 LIFE.stories 里登记
// 合租日记（data/sitcom.js）有自己的玩法和页面，在剧本架上也显示成一本
//
// 剧本格式：
//   { id, ico, title, zh, place, level, blurb, learnWhat,
//     cast: { 人物: { name, full, avatar, voice, color, role, bio, main } },   main = 记好感
//     stats: { 属性: { ico, name, init, max, unit } },
//     chapters: [{ id, title, zh, when, ending, learn, script }],   when = 条件满足才进这一章（路线章节）；ending = 演完算结局
//     endings: [{ id, ico, title, zh, desc, hint, when }],          按顺序第一个满足条件的就是结局，最后一个不写 when
//     more: true }                                                   后续章节还在写
// 台词格式见 data/sitcom.js 和 js/story_engine.js。fx 里数字是加减，字符串 / 标记直接记下来
// 条件写法："party"（有这个标记）、"!party"、"study>=60"、"route=study"，& 表示并且，| 表示或者
window.LIFE = {
  stories: {},
  order: ["campus"],
  upcoming: [
    { ico: "💼", title: "硅谷打工人", sub: "旧金山创业公司 · 面试、邮件、开会、谈薪", level: "B2" },
    { ico: "✈️", title: "背包环球", sub: "伦敦 → 都柏林 → 悉尼 → 多伦多 · 听不同口音", level: "A2–B1" },
    { ico: "🕵️", title: "雾港谜案", sub: "伦敦侦探 · 只听不看字，靠耳朵找线索", level: "B2" },
    { ico: "🎲", title: "人生重开", sub: "随机出生在一个英语国家 · 一局 15 分钟", level: "A2–B1" },
  ],
};
