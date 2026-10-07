// 把主题词汇注册成一本词书：每个主题是一个单元，单元里保留分组信息
(window.WORD_BOOKS = window.WORD_BOOKS || []).push({
  id: "topic",
  title: "主题词汇",
  desc: "30 个生活主题，按场景分组，美式音标",
  topic: true,
  units: window.TOPICS.map((t) => ({
    id: t.id,
    title: t.title,
    en: t.en,
    icon: t.icon,
    desc: t.desc,
    groups: t.groups.map((g) => ({ title: g.title, n: g.words.length })),
    words: t.groups.flatMap((g) => g.words.map(([w, ph, zh, ex, exZh]) => [w, ph, zh, ex ? [[ex, exZh]] : [], [], "", []])),
  })),
});
