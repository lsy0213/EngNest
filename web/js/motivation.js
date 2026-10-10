// ============================================================
// 学习动力：薄弱点本、每日任务、连胜保护、成就、每周回顾、练完一组的统一小结
// 数据都放成「带修改时间 t 的字典」或 days 里的数字计数，多台设备合并时不会互相覆盖（见 engnest/progress.py）
//   Store.data.weak    { id: 薄弱点记录 }        Store.data.quests { 日期: {ids, ns, done, bonus, t} }
//   Store.data.freeze  { n 剩几张, award 上次送的日期, t }   days[日期].frozen = 1 用保护卡补上的那天
//   Store.data.achv    { 成就 id: {lv 第几档, d 日期, t} }    days[日期].c_xxx 当天各项练习的次数（每日任务、周报用）
// ============================================================

// 当天某项练习的次数 +n（也可以用 addXP(n, "c_xxx") 顺便记一次）
function bump(key, n = 1) {
  const d = dayRec();
  d[key] = (d[key] || 0) + n;
  Store.save();
  Motivation.changed();
}

// 按日期固定的随机数（同一天在不同设备上抽到一样的任务）
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// 本周一的日期
function weekStart(date = today()) {
  const d = new Date(date + "T00:00:00");
  return addDays(date, -((d.getDay() + 6) % 7));
}

// ---------- 薄弱点本 ----------
// 各个练习里做错的东西收在一起，按记忆曲线复习。复习时能隔三周还记得（记忆稳定度 ≥ 21 天）就算攻克
// 记录：{id, k 类型, en 英文, zh 中文, note 说明, src 出处, q 语法题 {q, o, a, e}, said 原来说的, n 错了几次, last, box, due, seen, wrong, first, f, done 攻克的日期, t}
const WEAK_KINDS = {
  gram: ["🧩", "语法题"],
  sent: ["🎧", "听写句子"],
  sound: ["🗣️", "发音"],
  fix: ["✏️", "表达"],
  phrase: ["🧭", "短语"],
};
const WEAK_MASTER_DAYS = 21;

const Weak = {
  added: [], // 这次打开以来新加的（小结里显示「新进薄弱点本 N 条」）
  data() { return (Store.data.weak ||= {}); },
  id: (k, key) => `${k}:${recNorm(key).slice(0, 160)}`,
  // 同一条再错一次：次数 +1，明天就复习；已经攻克的重新拿出来
  add(k, key, rec = {}) {
    if (!WEAK_KINDS[k] || !String(key || "").trim()) return null;
    const id = this.id(k, key), d = this.data(), old = d[id];
    if (old) {
      old.n = (old.n || 1) + 1;
      old.last = today();
      for (const f in rec) if (rec[f] != null && rec[f] !== "") old[f] = rec[f];
      if (old.done || old.due > addDays(today(), 1)) old.due = addDays(today(), 1);
      delete old.done;
      old.t = Date.now();
    } else {
      d[id] = markAdded("weak", id, { id, k, en: "", zh: "", note: "", src: "", ...rec, n: 1, last: today(), box: 0, due: addDays(today(), 1), seen: 0, wrong: 0, first: today() });
    }
    if (!this.added.includes(id)) this.added.push(id);
    Store.save();
    return d[id];
  },
  remove(id) {
    delete this.data()[id];
    markDeleted("weak", id);
    Store.save();
  },
  list() { return Object.values(this.data()).filter((r) => r && r.k); },
  active() { return this.list().filter((r) => !r.done); },
  due() {
    const t = today();
    return this.active().filter((r) => r.due <= t).sort((a, b) => (b.n || 1) - (a.n || 1) || (a.due < b.due ? -1 : 1));
  },
  count() { return Store.data ? this.due().length : 0; },
  grade(r, g) {
    const days = Fsrs.schedule(r, g);
    r.seen++;
    if (g === 0) r.wrong++;
    if (g > 0 && r.f && r.f.s >= WEAK_MASTER_DAYS && r.seen >= 2) r.done = today();
    r.t = Date.now();
    logReview("w:" + r.id, g, days);
    bump("c_weak");
    return !!r.done;
  },
};

// AI 纠错的反馈（「**改好的句子** 说明」）→ 薄弱点本。学习者说的是中文、或者 AI 说没问题（👍）就不收
function weakFromFeedback(said, fb, src) {
  if (!fb || /^\s*👍/.test(fb) || !/[a-z]{2,}/i.test(said || "")) return;
  if ((said.match(/[一-鿿]/g) || []).length > said.length / 4) return;
  const better = (fb.match(/\*\*([^*]+)\*\*/) || [])[1];
  if (!better || !/[a-z]{2,}/i.test(better) || selNorm(better) === selNorm(said)) return;
  const why = fb.replace(/\*\*[^*]+\*\*/g, "").replace(/^[\s:：,，.。-]+/, "").trim();
  Weak.add("fix", better, { en: better.trim(), said: said.trim(), note: why.slice(0, 160), src });
}

// ---------- 连胜保护 ----------
// 每连续学满 7 天送一张，最多存 2 张；哪天忘了学，下次打开时自动用掉，连续天数不断
const Freeze = {
  MAX: 2,
  get rec() { return (Store.data.freeze ||= { n: 0, t: 0 }); },
  award() {
    const r = this.rec, st = streak();
    if (st > 0 && st % 7 === 0 && r.award !== today() && dayRec().xp > 0) {
      r.award = today();
      if (r.n < this.MAX) { r.n++; toast(`🧊 连续学习 ${st} 天，送你一张连胜保护（现在有 ${r.n} 张）`, "good", 4500); }
      r.t = Date.now();
      Store.save();
    }
  },
  // 昨天（和之前连着的几天）没学：保护卡够用就补上
  check() {
    const days = Store.data.days, r = this.rec;
    if (!r.n) return 0;
    const active = (d) => days[d]?.xp > 0 || days[d]?.frozen;
    const gap = [];
    let d = addDays(today(), -1);
    while (!active(d) && gap.length <= r.n && d >= (Store.data.created || "2000-01-01")) { gap.push(d); d = addDays(d, -1); }
    if (!gap.length || gap.length > r.n || !active(d)) return 0;
    gap.forEach((x) => { (days[x] ||= { xp: 0, new: 0, review: 0 }).frozen = 1; });
    r.n -= gap.length;
    r.t = Date.now();
    Store.save();
    setTimeout(() => toast(`🧊 ${gap.length === 1 ? "昨天" : `前 ${gap.length} 天`}没学，用掉 ${gap.length} 张连胜保护，连续 ${streak()} 天保住了`, "good", 6000), 1200);
    return gap.length;
  },
};

// ---------- 每日任务 ----------
// 每天 3 个小任务：一个基本功（复习 / 新词），一个练最弱的那项能力，一个随机。全做完额外 +15 XP
// avail()：今天能不能做（有没有可复习的、开没开 AI）；n：今天的目标（可以按情况算）
const QUEST_POOL = [
  { id: "rev", skill: "词汇", ico: "🔁", key: "review", href: "#/words/review", avail: () => dueWords().length >= 8, n: () => Math.min(20, dueWords().length), t: (n) => `复习 ${n} 张单词卡` },
  { id: "new", skill: "词汇", ico: "🆕", key: "new", href: "#/words/new", avail: () => newWordsLeftToday() >= 5, n: () => Math.min(10, newWordsLeftToday()), t: (n) => `学 ${n} 个新词` },
  { id: "sent", skill: "词汇", ico: "💬", key: "c_sent", href: "#/course/review", avail: () => typeof SentSRS !== "undefined" && SentSRS.count() >= 5, n: () => Math.min(10, SentSRS.count()), t: (n) => `复习 ${n} 条短语句子` },
  { id: "weak", skill: "词汇", ico: "🩹", key: "c_weak", href: "#/weak/review", avail: () => Weak.count() >= 3, n: () => Math.min(8, Weak.count()), t: (n) => `攻克 ${n} 个薄弱点` },
  { id: "game", skill: "词汇", ico: "🎲", key: "c_game", href: "#/games", avail: () => !!App.pages.games, n: () => 1, t: () => "玩一局单词游戏" },
  { id: "gram", skill: "语法", ico: "🧩", key: "c_gram", href: "#/grammar", avail: () => true, n: () => 1, t: () => "做一课语法练习" },
  { id: "build", skill: "语法", ico: "🧱", key: "c_build", href: "#/builder", avail: () => !!App.pages.builder, n: () => 5, t: (n) => `连词成句 ${n} 句` },
  { id: "read", skill: "阅读", ico: "📖", key: "rs", href: "#/reading", avail: () => true, n: () => 600, t: () => "阅读 10 分钟", fmt: (v) => `${Math.floor(v / 60)} / 10 分钟` },
  { id: "story", skill: "阅读", ico: "📜", key: "c_story", href: "#/story", avail: () => !!App.pages.story, n: () => 1, t: () => "读一篇今日故事" },
  { id: "dict", skill: "听力", ico: "🎧", key: "c_dict", href: "#/listening/dictation", avail: () => true, n: () => 5, t: (n) => `听写 ${n} 句` },
  { id: "video", skill: "听力", ico: "🎬", key: "c_video", href: "#/video", avail: () => true, n: () => 5, t: (n) => `影视精听跟读 ${n} 句` },
  { id: "shadow", skill: "口语", ico: "🎙️", key: "c_shadow", href: "#/speaking", avail: () => Store.bridge, n: () => 5, t: (n) => `跟读评测 ${n} 次` },
  { id: "chat", skill: "口语", ico: "🤖", key: "c_chat", href: "#/tutor", avail: () => AI.enabled, n: () => 8, t: (n) => `和 AI 语伴说 ${n} 句` },
  { id: "course", skill: "口语", ico: "🧭", key: "c_course", href: "#/course", avail: () => true, n: () => 1, t: () => "完成一课场景短语" },
  { id: "diary", skill: "写作", ico: "📔", key: "c_diary", href: "#/writing/diary", avail: () => true, n: () => 1, t: () => "写今天的英语日记（15 词以上）" },
  { id: "use", skill: "写作", ico: "✍️", key: "c_use", href: "#/words/use", avail: () => Object.keys(Store.data.words).length >= 5, n: () => 3, t: (n) => `用学过的词造 ${n} 个句子` },
  { id: "type", skill: "写作", ico: "⌨️", key: "c_type", href: "#/typing", avail: () => !!App.pages.typing, n: () => 20, t: (n) => `跟打 ${n} 个词或句子` },
];
const QUEST_BONUS = 15;

const Quests = {
  _busy: false,
  get all() { return (Store.data.quests ||= {}); },
  def: (id) => QUEST_POOL.find((q) => q.id === id),
  // 今天的任务（第一次用到时抽，之后固定）
  today() {
    const t = today(), all = this.all;
    if (all[t]?.ids?.length) return all[t];
    const rnd = seededRandom("quest:" + t);
    const ok = QUEST_POOL.filter((q) => { try { return q.avail(); } catch { return false; } });
    const take = (list) => { const q = list[Math.floor(rnd() * list.length)]; if (q) ok.splice(ok.indexOf(q), 1); return q; };
    const ids = [];
    // 1. 基本功：有该复习的先复习，没有就学新词
    const core = ok.find((q) => q.id === "rev") || ok.find((q) => q.id === "new") || ok.find((q) => q.id === "weak") || ok.find((q) => q.id === "sent");
    if (core) { ok.splice(ok.indexOf(core), 1); ids.push(core.id); }
    // 2. 最弱的能力（没练过的当成 30 分，也算弱项）
    const sk = App.pages.stats ? App.pages.stats.skills() : [];
    const weakest = sk.map(([k, v]) => [k, v ?? 30]).sort((a, b) => a[1] - b[1]).map(([k]) => k);
    for (const k of weakest) { const q = take(ok.filter((x) => x.skill === k)); if (q) { ids.push(q.id); break; } }
    // 3. 随机一个，尽量和前两个不是同一项能力
    const used = new Set(ids.map((id) => this.def(id).skill));
    const third = take(ok.filter((x) => !used.has(x.skill))) || take(ok);
    if (third) ids.push(third.id);
    const ns = {};
    ids.forEach((id) => { ns[id] = Math.max(1, this.def(id).n()); });
    all[t] = { ids, ns, done: {}, bonus: 0, t: Date.now() };
    // 只留最近 60 天
    Object.keys(all).sort().slice(0, -60).forEach((k) => delete all[k]);
    Store.save();
    return all[t];
  },
  value(id) { const q = this.def(id); return q ? dayRec()[q.key] || 0 : 0; },
  items() {
    const rec = this.today();
    return rec.ids.filter((id) => this.def(id)).map((id) => {
      const q = this.def(id), n = rec.ns[id] || 1, v = Math.min(n, this.value(id));
      return { id, q, n, v, done: !!rec.done[id] || v >= n, title: q.t(n), prog: q.fmt ? q.fmt(v) : `${v} / ${n}` };
    });
  },
  check() {
    if (this._busy || !Store.data) return;
    this._busy = true;
    try {
      const rec = this.today();
      let changed = false;
      for (const it of this.items()) {
        if (it.done && !rec.done[it.id]) { rec.done[it.id] = 1; changed = true; toast(`✅ 每日任务完成：${it.title}`, "good", 3000); }
      }
      if (rec.ids.length && rec.ids.every((id) => rec.done[id]) && !rec.bonus) {
        rec.bonus = 1;
        changed = true;
        addXP(QUEST_BONUS);
        setTimeout(() => toast(`🎁 今天的 ${rec.ids.length} 个任务全部完成！额外 +${QUEST_BONUS} XP`, "good", 4500), 600);
      }
      if (changed) { rec.t = Date.now(); Store.save(); }
    } finally { this._busy = false; }
  },
  allDoneDays() { return Object.values(this.all).filter((r) => r?.bonus).length; },
};

// ---------- 成就 ----------
// 每个成就分几档（铜 / 银 / 金 / 钻），val() 是现在的数值。点亮过的档位记下来，以后数值变小（比如删了生词）也不会熄灭
const ACHV_TIERS = [["铜", "bronze"], ["银", "silver"], ["金", "gold"], ["钻", "diamond"], ["传奇", "legend"]];
function longestStreak() {
  const days = Store.data.days, dates = Object.keys(days).filter((d) => days[d]?.xp > 0 || days[d]?.frozen).sort();
  let best = 0, run = 0, prev = "";
  for (const d of dates) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}
function revHours(test) { return (Store.data.revlog || []).some(([, ts]) => test(new Date(ts).getHours())); }
function booksFinished() {
  if (typeof Docs === "undefined" || typeof Shelf === "undefined") return 0;
  return Object.keys(Store.data.books || {}).filter((id) => { const m = Docs.metaSync(id); return m && m.chapters?.length > 1 && Shelf.status(m) === "done"; }).length;
}
const CEFR_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const ACHIEVEMENTS = [
  { id: "words", ico: "📚", name: "词汇量", desc: "学过的单词", tiers: [50, 500, 2000, 5000, 10000], val: () => Object.keys(Store.data.words).length },
  { id: "mastered", ico: "💎", name: "过目不忘", desc: "已掌握的单词（复习间隔 ≥ 7 天）", tiers: [100, 1000, 3000, 6000], val: () => Object.values(Store.data.words).filter((s) => s.box >= MASTERED_BOX).length },
  { id: "reviews", ico: "🔁", name: "温故知新", desc: "累计复习次数", tiers: [100, 1000, 5000, 20000], val: () => (Store.data.revlog || []).length },
  { id: "streak", ico: "🔥", name: "坚持", desc: "最长连续学习天数", tiers: [3, 7, 30, 100, 365], val: longestStreak },
  { id: "xp", ico: "⭐", name: "经验值", desc: "累计经验值", tiers: [500, 5000, 20000, 60000], val: () => Store.data.xp || 0 },
  { id: "quests", ico: "🎯", name: "任务达人", desc: "每日任务全部完成的天数", tiers: [1, 7, 30, 100], val: () => Quests.allDoneDays() },
  { id: "weak", ico: "🩹", name: "查漏补缺", desc: "攻克的薄弱点", tiers: [10, 50, 200, 500], val: () => Weak.list().filter((r) => r.done).length },
  { id: "grammar", ico: "🧩", name: "语法通", desc: "学完的语法课", tiers: [6, 18, 36], val: () => Object.keys(Store.data.grammar || {}).length },
  { id: "grammar_full", ico: "💯", name: "满分答卷", desc: "全对的语法课", tiers: [1, 10, 30], val: () => Object.entries(Store.data.grammar || {}).filter(([id, r]) => { const l = typeof GRAMMAR_ORDER !== "undefined" && GRAMMAR_ORDER.find((x) => x.id === id); return l && r.best >= l.quiz.length; }).length },
  { id: "course", ico: "🧭", name: "场景通关", desc: "完成的场景短语课", tiers: [10, 48, 96], val: () => Object.keys(Store.data.course || {}).length },
  { id: "dict", ico: "🎧", name: "顺风耳", desc: "听写过的句子", tiers: [50, 300, 1000, 3000], val: () => Store.data.stats?.dictation || 0 },
  { id: "dict_ok", ico: "👂", name: "一字不差", desc: "全对的听写", tiers: [20, 200, 1000], val: () => Store.data.stats?.dictation_ok || 0 },
  { id: "pron", ico: "🎙️", name: "开口说", desc: "跟读评测过的句子", tiers: [20, 200, 1000], val: () => Object.keys(Store.data.pron || {}).length },
  { id: "pron90", ico: "🌟", name: "字正腔圆", desc: "跟读得到 90 分以上的句子", tiers: [10, 100, 500], val: () => Object.values(Store.data.pron || {}).filter((x) => x.best >= 90).length },
  { id: "chat", ico: "🤖", name: "健谈", desc: "和 AI 语伴说过的话", tiers: [50, 300, 1000, 3000], val: () => Store.data.stats?.chat || 0 },
  { id: "scenes", ico: "🎬", name: "情景大师", desc: "完成点评的场景口语", tiers: [5, 20, 60], val: () => Object.keys(Store.data.scenes || {}).length },
  { id: "read_min", ico: "⏳", name: "书虫", desc: "在阅读器里读书的分钟数", tiers: [60, 600, 3000, 10000], val: () => Math.floor(Object.values(Store.data.days).reduce((s, d) => s + (d?.rs || 0), 0) / 60) },
  { id: "books", ico: "📕", name: "读完一本书", desc: "读完的书", tiers: [1, 5, 20], val: booksFinished },
  { id: "articles", ico: "📰", name: "博览", desc: "做完题的短文", tiers: [10, 50, 200], val: () => Object.keys(Store.data.reading || {}).length },
  { id: "endings", ico: "🎭", name: "人生百态", desc: "人生剧场收集到的结局", tiers: [1, 3, 8], val: () => Object.values(Store.data.life || {}).reduce((s, x) => s + Object.keys(x?.endings || {}).length, 0) },
  { id: "notebook", ico: "⭐", name: "收藏家", desc: "生词本里的单词、短语和句子", tiers: [20, 200, 1000], val: () => (Store.data.notebook || []).length + (Store.data.sentence_nb || []).length },
  { id: "games", ico: "🎲", name: "玩中学", desc: "赢过的单词游戏", tiers: [1, 30, 100, 300], val: () => Object.values(Store.data.games || {}).reduce((s, g) => s + (g?.wins || 0), 0) },
  { id: "diary", ico: "📔", name: "日记本", desc: "写过的英语日记", tiers: [1, 7, 30, 100], val: () => Object.keys(Store.data.diary || {}).length },
  { id: "level", ico: "📏", name: "知己知彼", desc: "做过水平测试", tiers: [1], val: () => (Store.data.level ? 1 : 0) },
  { id: "b2", ico: "🎓", name: "中高级", desc: "水平测试达到 B2", tiers: [1], val: () => (CEFR_RANK[Store.data.level?.cefr] >= 4 ? 1 : 0) },
  { id: "early", ico: "🌅", name: "早起的鸟儿", desc: "早上 7 点前复习过单词", tiers: [1], val: () => (revHours((h) => h >= 4 && h < 7) ? 1 : 0) },
  { id: "night", ico: "🦉", name: "夜猫子", desc: "晚上 11 点以后复习过单词", tiers: [1], val: () => (revHours((h) => h >= 23 || h < 2) ? 1 : 0) },
  { id: "freeze", ico: "🧊", name: "有惊无险", desc: "用连胜保护保住了连续天数", tiers: [1], val: () => (Object.values(Store.data.days).some((d) => d?.frozen) ? 1 : 0) },
];

const Achv = {
  _timer: 0,
  get got() { return (Store.data.achv ||= {}); },
  level(a) { return this.got[a.id]?.lv || 0; },
  // 第一次启用成就时，按已有的学习记录直接点亮，不一条条弹提示
  check() {
    if (!Store.data) return [];
    const first = !Store.data.achv, got = this.got, fresh = [];
    for (const a of ACHIEVEMENTS) {
      let v = 0;
      try { v = a.val(); } catch { continue; }
      const lv = a.tiers.filter((n) => v >= n).length;
      if (lv > (got[a.id]?.lv || 0)) { got[a.id] = { lv, d: today(), t: Date.now() }; fresh.push([a, lv]); }
    }
    if (fresh.length) {
      Store.save();
      if (first) setTimeout(() => toast(`🏆 按你之前的学习记录，点亮了 ${fresh.length} 个成就，去「成就」看看`, "good", 5000), 1500);
      else fresh.forEach(([a, lv], i) => setTimeout(() => this.celebrate(a, lv), 400 + i * 1600));
    }
    return fresh;
  },
  // 学习过程中频繁调用：攒一下再算
  soon() { clearTimeout(this._timer); this._timer = setTimeout(() => this.check(), 1500); },
  tierName(a, lv) { return a.tiers.length > 1 ? ACHV_TIERS[Math.min(lv, ACHV_TIERS.length) - 1][0] : ""; },
  celebrate(a, lv) {
    const box = el(`<a class="achv-pop tier-${a.tiers.length > 1 ? ACHV_TIERS[lv - 1][1] : "gold"}" href="#/achv"><span class="achv-pop-ico">${a.ico}</span>
      <span><small>🏆 解锁成就</small><b>${esc(a.name)}${a.tiers.length > 1 ? ` · ${this.tierName(a, lv)}` : ""}</b><small>${esc(a.desc)} ${a.tiers.length > 1 ? `≥ ${a.tiers[lv - 1]}` : ""}</small></span></a>`);
    document.body.appendChild(box);
    Sound.play("achv");
    setTimeout(() => box.classList.add("out"), 4200);
    setTimeout(() => box.remove(), 4800);
  },
};

// 简单的提示音（WebAudio 合成，不需要音频文件）；设置里关掉音效就不响
const Sound = {
  ctx: null,
  play(kind) {
    if (Store.prefs?.sfx === false) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const notes = { achv: [523, 659, 784, 1047], good: [660, 880], bad: [220, 180], tick: [880] }[kind] || [660];
      const t0 = this.ctx.currentTime;
      notes.forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.22);
        o.connect(g).connect(this.ctx.destination);
        o.start(t0 + i * 0.09);
        o.stop(t0 + i * 0.09 + 0.25);
      });
    } catch { /* 没有声卡也没关系 */ }
  },
};

// ---------- 每周回顾 ----------
const Weekly = {
  // 从 start（周一）开始 7 天的数据
  summary(start) {
    const days = Store.data.days, dates = Array.from({ length: 7 }, (_, i) => addDays(start, i)), end = addDays(start, 7);
    const sum = (k) => dates.reduce((s, d) => s + (days[d]?.[k] || 0), 0);
    const t0 = new Date(start + "T00:00:00").getTime(), t1 = new Date(end + "T00:00:00").getTime();
    const log = (Store.data.revlog || []).filter(([, ts]) => ts >= t0 && ts < t1);
    const reviewed = log.length, ok = log.filter(([, , g]) => g > 0).length;
    const pron = Object.values(Store.data.pron || {}).filter((x) => x.date >= start && x.date < end);
    return {
      start, end: addDays(start, 6),
      studyDays: dates.filter((d) => days[d]?.xp > 0).length,
      frozen: dates.filter((d) => days[d]?.frozen).length,
      xp: sum("xp"), new: sum("new"), review: sum("review"), readMin: Math.round(sum("rs") / 60),
      dict: sum("c_dict"), chat: sum("c_chat"), shadow: sum("c_shadow"), weak: sum("c_weak"), games: sum("c_game"),
      quests: dates.filter((d) => this.questDone(d)).length,
      retention: reviewed >= 10 ? ok / reviewed : null, reviewed,
      pron: pron.length ? Math.round(pron.reduce((s, x) => s + x.last, 0) / pron.length) : null,
      learned: Object.values(Store.data.words).filter((w) => w.first >= start && w.first < end).length,
      bestDay: dates.reduce((b, d) => ((days[d]?.xp || 0) > (days[b]?.xp || 0) ? d : b), dates[0]),
    };
  },
  questDone(d) { return !!Quests.all[d]?.bonus; },
  // 上周的总结（周一到周日都可以看）：没学过的周不显示
  lastWeek() { return this.summary(addDays(weekStart(), -7)); },
  arrow(a, b, unit = "") {
    if (b == null || a == null || a === b) return "";
    const up = a > b;
    return `<span class="wk-delta ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(Math.round((a - b) * (unit === "%" ? 100 : 1)))}${unit}</span>`;
  },
  html(start, { nav = false, dismiss = false } = {}) {
    const s = this.summary(start), p = this.summary(addDays(start, -7));
    const wd = "日一二三四五六", md = (d) => `${+d.slice(5, 7)}月${+d.slice(8)}日`;
    const tile = (v, label, prev, unit) => `<div class="wk-tile"><b>${v ?? "—"}${v != null && unit === "%" ? "" : ""}</b><span>${label}</span>${this.arrow(unit === "%" ? s.retention : v, unit === "%" ? p.retention : prev, unit)}</div>`;
    const lines = [];
    if (s.learned) lines.push(`认识了 <b>${s.learned}</b> 个新词`);
    if (s.readMin) lines.push(`读了 <b>${s.readMin}</b> 分钟`);
    if (s.dict) lines.push(`听写 <b>${s.dict}</b> 句`);
    if (s.chat) lines.push(`和 AI 说了 <b>${s.chat}</b> 句`);
    if (s.shadow) lines.push(`跟读 <b>${s.shadow}</b> 次${s.pron != null ? `，平均 ${s.pron} 分` : ""}`);
    if (s.weak) lines.push(`复习薄弱点 <b>${s.weak}</b> 次`);
    if (s.games) lines.push(`玩了 <b>${s.games}</b> 局游戏`);
    if (s.quests) lines.push(`<b>${s.quests}</b> 天完成了全部每日任务`);
    const cheer = !s.studyDays ? "这一周休息了，没关系，今天重新开始就好。"
      : s.studyDays >= 6 ? "几乎天天都在学，太稳了！" : s.xp > p.xp && p.xp ? "比上周学得更多，进步看得见。" : "保持节奏，慢慢来比较快。";
    return `<div class="card weekly-card">
      <div class="card-title">📅 周报 · ${md(s.start)} – ${md(s.end)} <span class="spacer"></span>
        ${nav ? `<button class="btn sm ghost" data-wk="${addDays(start, -7)}" title="上一周">‹</button><button class="btn sm ghost" data-wk="${addDays(start, 7)}" ${addDays(start, 7) > today() ? "disabled" : ""} title="下一周">›</button>` : ""}
        ${dismiss ? `<button class="btn sm ghost" data-wk-close title="收起这周的周报">✕</button>` : ""}</div>
      <div class="wk-tiles">
        ${tile(s.studyDays + (s.frozen ? `<small> +${s.frozen}🧊</small>` : ""), "学习天数", null)}
        ${tile(s.xp, "经验值", p.xp)}
        ${tile(s.review, "复习单词", p.review)}
        ${tile(s.retention == null ? null : Math.round(s.retention * 100) + "%", "复习记住率", null, "%")}
      </div>
      ${lines.length ? `<p class="small">这周你${lines.join("，")}。</p>` : ""}
      <p class="small muted">${cheer}${s.studyDays ? ` 学得最多的是周${wd[new Date(s.bestDay + "T00:00:00").getDay()]}。` : ""}</p>
    </div>`;
  },
  // 首页：周一到周日都可以看上周的；点 ✕ 后这一周不再显示
  homeHtml() {
    const ls = addDays(weekStart(), -7);
    if (Store.prefs.weekly_seen === ls || ls < (Store.data.created || "")) return "";
    const s = this.summary(ls);
    if (!s.xp) return "";
    return this.html(ls, { dismiss: true });
  },
  bind(root, rerender) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-wk]");
      if (b && !b.disabled) { rerender(b.dataset.wk); return; }
      if (e.target.closest("[data-wk-close]")) {
        Store.prefs.weekly_seen = addDays(weekStart(), -7);
        Store.save();
        e.target.closest(".weekly-card")?.remove();
        toast("周报随时可以在「学习统计」里看");
      }
    });
  },
};

// ---------- 练完一组的统一小结 ----------
// const s = Session.start(); …练习… container.innerHTML = Session.finishHtml(s, {...})
const Session = {
  start() { return { xp0: Store.data.xp, weak0: Weak.added.length, t0: Date.now() }; },
  // 用时、经验值、新进薄弱点本的、每日任务进度（练习自己的完成页里也可以单独放这一块）
  stripHtml(s) {
    const xp = Math.max(0, Store.data.xp - s.xp0), min = Math.max(1, Math.round((Date.now() - s.t0) / 60000));
    const weakNew = Weak.added.slice(s.weak0).map((id) => Weak.data()[id]).filter(Boolean);
    const quests = Quests.items();
    return `<div class="sd-strip">
        <span title="这一组用的时间">⏱ ${min} 分钟</span>
        <span title="这一组得到的经验值">⭐ +${xp} XP</span>
        <span title="今天的经验值">今日 ${dayRec().xp} / ${Store.prefs.daily_goal} XP</span>
        <span title="连续学习天数">🔥 ${streak()} 天</span>
      </div>
      ${weakNew.length ? `<div class="sd-weak"><a href="#/weak">🩹 ${weakNew.length} 条做错的已收进薄弱点本 ›</a><div class="small faint">${weakNew.slice(0, 3).map((r) => esc(r.en || r.q?.q || "")).join(" · ")}</div></div>` : ""}
      ${quests.length ? `<div class="sd-quests">${quests.map((q) => `<a class="sd-q ${q.done ? "done" : ""}" href="${q.q.href}" title="${esc(q.title)}">${q.done ? "✅" : q.q.ico} ${esc(q.title)} <small>${q.done ? "完成" : esc(q.prog)}</small></a>`).join("")}</div>` : ""}`;
  },
  // opts：emoji、title、lines（一行说明）、note（灰色小字）、exit（是否显示返回按钮）
  finishHtml(s, { emoji = "🎉", title = "完成啦！", lines = "", note = "", exit = true } = {}) {
    const next = App.pages.home?.plan?.().find((x) => !x.done && !location.hash.startsWith(x.href));
    return `<div class="flash-wrap">${exit ? `<div class="flash-progress">${STUDY_EXIT_BTN}</div>` : ""}<div class="card center fc-done session-done">
      <div class="sd-emoji">${emoji}</div>
      <h2 class="mt-s">${title}</h2>
      ${lines ? `<p class="muted">${lines}</p>` : ""}
      ${this.stripHtml(s)}
      ${note ? `<p class="small faint">${note}</p>` : ""}
      <div class="row" style="justify-content:center;margin-top:16px;flex-wrap:wrap" data-finish-actions></div>
      ${next ? `<div class="sd-next small"><span class="faint">下一步：</span><a href="${next.href}">${next.ico} ${esc(next.title)} ›</a></div>` : ""}
    </div></div>`;
  },
};

// ---------- 汇总：学习记录变了以后要做的事 ----------
const Motivation = {
  _day: "",
  changed() {
    if (!Store.data) return;
    Freeze.award();
    Quests.check();
    Achv.soon();
  },
  // 启动时、跨过零点时
  dayStart() {
    if (!Store.data || this._day === today()) return;
    this._day = today();
    Freeze.check();
    Quests.today();
    Achv.check();
  },
};

// ---------- 薄弱点复习卡片 ----------
// 语法题、听写句子：自己作答，系统判分；发音、表达、短语：想好了翻开，自己评
function runWeakCards(container, queue, signal, onFinish, { exitTo } = {}) {
  enterStudyFocus(container, signal, exitTo);
  const total = queue.length, q = [...queue], stats = { known: 0, fuzzy: 0, unknown: 0, mastered: 0 }, session = Session.start();
  const K = knownDir(), L = K < 0 ? "←" : "→", R = K < 0 ? "→" : "←";
  let cur = null, revealed = false, done = 0, answered = null;

  const next = () => {
    cur = q.shift();
    revealed = false;
    answered = null;
    if (!cur) return finish();
    draw();
    if (cur.k === "sent") setTimeout(() => TTS.speak(cur.en), 250);
  };
  App.shadowTarget = () => (cur && cur.en && (revealed || cur.k === "sound") ? [{ en: cur.en, zh: cur.zh, label: WEAK_KINDS[cur.k][1] }] : null);

  const front = () => {
    const r = cur;
    if (r.k === "gram") {
      return `<div class="sc-front-ask small muted">选出正确答案（按 1–4）</div><div class="wk-q en">${esc(r.q?.q || r.en)}</div>
        <div class="options two">${(r.q?.o || []).map((o, i) => `<button class="option" data-opt="${i}"><span class="letter">${"ABCD"[i]}</span><span style="font-family:var(--font-en)">${esc(o)}</span></button>`).join("")}</div>`;
    }
    if (r.k === "sent") {
      return `<div class="sc-front-ask small muted">再听写一遍（以前在「${esc(r.src || "听写")}」里没写对）</div>
        <div class="row" style="justify-content:center;gap:8px">${speakBtn(r.en)}<button class="speak" data-say="${esc(r.en)}" data-rate="0.6" title="慢速">🐢</button></div>
        <textarea class="textarea en mt-s" id="wk-in" rows="2" placeholder="把听到的句子写下来，Enter 检查" spellcheck="false"></textarea>`;
    }
    if (r.k === "sound") return `<div class="sc-front-ask small muted">读准它（按 Ctrl+M 跟读评测）</div><div class="sc-front-en en">${esc(r.en)}</div>
      <div class="row" style="justify-content:center;gap:6px">${speakBtn(r.en)}<button class="speak" data-say="${esc(r.en)}" data-rate="0.6" title="慢速">🐢</button>${shadowBtn(r.en, { zh: r.zh })}</div>`;
    if (r.k === "fix") return `<div class="sc-front-ask small muted">你曾经这样说，怎么说更好？</div><div class="sc-front-zh wk-said en">${esc(r.said || "")}</div>`;
    return `<div class="sc-front-ask small muted">用英语怎么说？</div><div class="sc-front-zh">${esc(r.zh || r.en)}</div>`;
  };
  const back = () => {
    const r = cur;
    if (r.k === "gram") return `<div class="explain ${answered?.ok ? "good" : "bad"}">${answered?.ok ? "✅" : "❌"} ${esc(r.q?.e || r.note || "")}</div>`;
    if (r.k === "sent") return `<div class="diff">${answered?.diff || esc(r.en)}</div><div class="muted small">${esc(r.zh || "")}</div>`;
    return `<div class="fc-back reveal">
      ${r.k === "phrase" || r.k === "fix" ? `<div class="sc-front-en en">${esc(r.en)}</div><div class="row" style="justify-content:center;gap:6px;margin-top:6px">${speakBtn(r.en)}${shadowBtn(r.en, { zh: r.zh })}</div>` : ""}
      ${r.zh && r.k !== "phrase" ? `<div class="muted">${esc(r.zh)}</div>` : ""}
      ${r.note ? `<div class="small muted mt-s">💡 ${esc(r.note)}</div>` : ""}</div>`;
  };
  const selfGrade = () => !["gram", "sent"].includes(cur.k);

  const draw = () => {
    const [ico, kind] = WEAK_KINDS[cur.k];
    container.innerHTML = `<div class="flash-wrap">
      <div class="flash-progress">${STUDY_EXIT_BTN}<span>${done} / ${total}</span><div class="bar"><i style="width:${Math.round((done / total) * 100)}%"></i></div><span>薄弱点复习</span></div>
      <div class="card flashcard sent-card weak-card" id="fc">
        <div class="fc-top"><span class="fc-tag">${ico} ${kind}${cur.n > 1 ? ` · 错过 ${cur.n} 次` : ""}</span><span class="fc-tag faint">${esc(cur.src || "")}</span></div>
        ${front()}
        ${revealed ? back() : ""}
        <div class="fc-actions" id="wk-act">${actions()}</div>
      </div>
      <div class="kbd-hint">${selfGrade() ? `空格翻开 · ${L} 记住了 · ${R} 没记住 · ↓ 有点模糊` : cur.k === "gram" ? "按 1–4 选答案 · Enter 继续" : "Enter 检查 / 继续 · Tab 重听"} · R 听一遍</div>
    </div>`;
    bindWordClicks(container);
    $$("[data-g]", container).forEach((b) => (b.onclick = (e) => grade(+b.dataset.g, e)));
    $("[data-reveal]", container)?.addEventListener("click", reveal);
    $("[data-next]", container)?.addEventListener("click", advance);
    $$("[data-opt]", container).forEach((b) => (b.onclick = () => answerGram(+b.dataset.opt)));
    const inp = $("#wk-in", container);
    if (inp) {
      if (answered) inp.value = answered.typed, inp.readOnly = true;
      else setTimeout(() => inp.focus(), 30);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Tab") { e.preventDefault(); TTS.speak(cur.en, e.shiftKey ? 0.6 : undefined); }
        else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); answered ? advance() : answerSent(); }
      });
    }
    if (answered && cur.k === "gram") {
      $$("[data-opt]", container).forEach((b) => { b.disabled = true; if (+b.dataset.opt === cur.q.a) b.classList.add("right"); else if (+b.dataset.opt === answered.pick) b.classList.add("wrong"); });
    }
  };
  const actions = () => {
    if (answered) return `<button class="btn primary lg" data-next>继续 <span class="kbd">Enter</span></button>`;
    if (cur.k === "sent") return `<button class="btn ghost" data-reveal>看答案</button><button class="btn primary lg" id="wk-chk">检查 <span class="kbd">Enter</span></button>`;
    if (cur.k === "gram") return "";
    if (!revealed) return `<button class="btn primary lg" data-reveal>想好了，翻开 <span class="kbd">空格</span></button>`;
    const ok = cur.k === "sound" ? ["读得好", "还行", "还不行"] : ["记住了", "有点模糊", "没记住"];
    return `<button class="btn good lg" data-g="2">${L} ${ok[0]}</button><button class="btn warn lg" data-g="1">${ok[1]} <span class="kbd">↓</span></button><button class="btn bad lg" data-g="0">${ok[2]} ${R}</button>`;
  };
  const reveal = () => {
    if (revealed) return;
    if (cur.k === "sent" && !answered) return answerSent(true);
    revealed = true;
    draw();
    if (cur.en) TTS.speak(cur.en);
  };
  const answerGram = (i) => {
    if (answered) return;
    const ok = i === cur.q?.a;
    answered = { ok, pick: i };
    revealed = true;
    Sound.play(ok ? "good" : "bad");
    record(ok ? 2 : 0);
    draw();
  };
  const answerSent = (peek = false) => {
    if (answered) return;
    const typed = peek ? "" : ($("#wk-in", container)?.value || "");
    if (!peek && !typed.trim()) return;
    const d = wordDiff(cur.en, typed);
    const op = (o) => o.t === "ok" ? `<span class="d-ok">${esc(o.w)}</span>` : o.t === "miss" ? `<span class="d-miss">${esc(o.w)}</span>`
      : o.t === "wrong" ? `<span class="d-wrong"><s>${esc(o.y)}</s> ${esc(o.w)}</span>` : `<span class="d-extra">${esc(o.y)}</span>`;
    answered = { typed, diff: peek ? esc(cur.en) : d.ops.map(op).join(" ") };
    revealed = true;
    const g = peek ? 0 : d.score === 1 ? 2 : d.score >= 0.8 ? 1 : 0;
    Sound.play(g ? "good" : "bad");
    record(g);
    draw();
    TTS.speak(cur.en);
  };
  const record = (g) => {
    const mastered = Weak.grade(cur, g);
    stats[["unknown", "fuzzy", "known"][g]]++;
    if (mastered) { stats.mastered++; toast("💪 攻克了一个薄弱点！", "good"); }
    addXP(g ? 2 : 1);
    Store.save();
  };
  const grade = (g) => { record(g); done++; next(); };
  const advance = () => { done++; next(); };
  const finish = () => {
    App.shadowTarget = null;
    renderNav();
    container.innerHTML = Session.finishHtml(session, {
      emoji: stats.mastered ? "💪" : "🩹", title: "薄弱点复习完啦！",
      lines: `共 ${total} 条：记住了 ${stats.known} · 模糊 ${stats.fuzzy} · 还不会 ${stats.unknown}${stats.mastered ? ` · 攻克 ${stats.mastered} 条` : ""}`,
      note: "还不会的明天再来；能隔三周还记得就算攻克。",
    });
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };
  container.addEventListener("click", (e) => { if (e.target.closest("#wk-chk")) answerSent(); });
  onKey(signal, (e) => {
    if (!cur) return;
    if (e.key === "r" || e.key === "R") { if (cur.en) TTS.speak(cur.en); return; }
    if (answered && e.key === "Enter") { e.preventDefault(); advance(); return; }
    if (cur.k === "gram" && !answered && ["1", "2", "3", "4"].includes(e.key)) { answerGram(+e.key - 1); return; }
    if (!selfGrade()) return;
    if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
    else if (revealed && e.key === "ArrowLeft") { e.preventDefault(); grade(K < 0 ? 2 : 0); }
    else if (revealed && e.key === "ArrowRight") { e.preventDefault(); grade(K < 0 ? 0 : 2); }
    else if (revealed && e.key === "ArrowDown") { e.preventDefault(); grade(1); }
  });
  next();
}

// ---------- 页面：薄弱点本 ----------
App.pages.weak = {
  render(root, params, signal) {
    const [mode] = params;
    if (mode === "review" || mode === "all") {
      const queue = mode === "review" ? Weak.due() : shuffle(Weak.active()).slice(0, 30);
      if (!queue.length) { root.innerHTML = `<div class="card empty">${mode === "review" ? "今天没有要复习的薄弱点 🎉" : "薄弱点本是空的"}<div class="mt"><a class="btn" href="#/weak">返回</a></div></div>`; return; }
      runWeakCards(root, queue, signal, (box) => {
        box.innerHTML = `<a class="btn" href="#/weak">回到薄弱点本</a>${Weak.count() ? `<button class="btn primary" data-more>继续复习（${Weak.count()}）</button>` : ""}`;
        $("[data-more]", box)?.addEventListener("click", () => Router.render());
      }, { exitTo: "#/weak" });
      return;
    }
    const tab = mode && WEAK_KINDS[mode] ? mode : "all";
    const all = Weak.list(), active = all.filter((r) => !r.done), done = all.filter((r) => r.done), due = Weak.due();
    const shown = (tab === "all" ? all : all.filter((r) => r.k === tab)).sort((a, b) => !!a.done - !!b.done || (b.n || 1) - (a.n || 1) || (a.last < b.last ? 1 : -1));
    const row = (r) => {
      const [ico, kind] = WEAK_KINDS[r.k] || ["•", ""];
      const main = r.k === "gram" ? r.q?.q || r.en : r.k === "fix" ? r.en : r.en || r.zh;
      const sub = r.k === "fix" ? `你说：${r.said || ""}` : r.k === "gram" ? `答案：${r.q?.o?.[r.q.a] ?? ""}` : r.zh || r.note || "";
      return `<div class="weak-row ${r.done ? "done" : ""}">
        <span class="weak-ico" title="${kind}">${r.done ? "💪" : ico}</span>
        <div class="weak-main"><div class="en">${esc(main)}</div><div class="small muted">${esc(sub)}</div>
          <div class="small faint">${esc(r.src || "")} · 错过 ${r.n || 1} 次 · ${r.done ? `${r.done} 攻克` : r.due <= today() ? "今天复习" : `${r.due} 复习`}</div></div>
        ${r.en && r.k !== "gram" ? speakBtn(r.en, "sm") : ""}<button class="btn sm ghost" data-del="${esc(r.id)}" title="不用再练这条了" aria-label="删除">✕</button></div>`;
    };
    root.innerHTML = pageHead("🩹 薄弱点本", "各个练习里做错的语法题、没写对的听写、读不准的句子、被 AI 纠正过的说法，都收在这里，按记忆曲线安排复习。能隔三周还记得就算攻克。") + `
      <div class="grid grid-4 stats-tiles">
        <div class="card stat"><b>${due.length}</b><span>今天要复习</span></div>
        <div class="card stat"><b>${active.length}</b><span>还没攻克</span></div>
        <div class="card stat"><b>${done.length}</b><span>已经攻克 💪</span></div>
        <div class="card stat"><b>${Weak.list().reduce((s, r) => s + (r.n || 1), 0)}</b><span>一共记下的错误</span></div>
      </div>
      <div class="row mt" style="flex-wrap:wrap;gap:8px">
        <a class="btn primary ${due.length ? "" : "disabled"}" href="#/weak/review">开始复习（${due.length}）</a>
        <a class="btn ${active.length ? "" : "disabled"}" href="#/weak/all" title="不管有没有到复习时间，随机抽 30 条练一遍">全部练一遍</a>
      </div>
      <div class="mt">${tabsHtml([["all", `全部 ${all.length}`], ...Object.entries(WEAK_KINDS).map(([k, [ico, l]]) => [k, `${ico} ${l} ${all.filter((r) => r.k === k).length}`])], tab)}</div>
      <div class="card mt weak-list">${shown.length ? shown.slice(0, 300).map(row).join("") : emptyGuide("🩹", "这里还是空的", "做练习时答错的题、听写没写对的句子、跟读低于 60 分的句子、AI 语伴纠正过的说法，都会自动收进来。", [["#/grammar", "🧩 做一课语法"], ["#/listening/dictation", "🎧 听写几句"]])}</div>`;
    root.querySelector(".tabs").onclick = (e) => { const b = e.target.closest("[data-tab]"); if (b) Router.go("weak/" + (b.dataset.tab === "all" ? "" : b.dataset.tab)); };
    root.addEventListener("click", async (e) => {
      const d = e.target.closest("[data-del]");
      if (!d) return;
      Weak.remove(d.dataset.del);
      d.closest(".weak-row").remove();
      renderNav();
    }, { signal });
  },
};

// ---------- 页面：成就墙 ----------
App.pages.achv = {
  render(root) {
    Achv.check();
    const lit = ACHIEVEMENTS.filter((a) => Achv.level(a) > 0).length;
    const card = (a) => {
      const lv = Achv.level(a);
      let v = 0;
      try { v = a.val(); } catch { /* 没数据 */ }
      const nextN = a.tiers[lv], prevN = a.tiers[lv - 1] || 0;
      const pct = nextN ? Math.max(0, Math.min(100, ((v - prevN) / (nextN - prevN)) * 100)) : 100;
      const tier = lv ? (a.tiers.length > 1 ? ACHV_TIERS[lv - 1][1] : "gold") : "locked";
      return `<div class="achv-card tier-${tier}" title="${esc(a.desc)}">
        <div class="achv-medal"><span>${a.ico}</span></div>
        <b>${esc(a.name)}${lv && a.tiers.length > 1 ? ` · ${Achv.tierName(a, lv)}` : ""}</b>
        <div class="small muted">${esc(a.desc)}</div>
        ${nextN ? `<div class="bar mt-s"><i style="width:${pct}%"></i></div><div class="small faint">${v} / ${nextN}${a.tiers.length > 1 ? `　→ ${ACHV_TIERS[lv][0]}` : ""}</div>`
          : `<div class="small faint mt-s">✓ ${Store.data.achv[a.id]?.d || ""}${a.tiers.length > 1 ? ` · 最高档` : ""}</div>`}
        ${a.tiers.length > 1 ? `<div class="achv-pips">${a.tiers.map((n, i) => `<i class="${i < lv ? "on" : ""}" title="${ACHV_TIERS[i][0]}：${n}"></i>`).join("")}</div>` : ""}
      </div>`;
    };
    root.innerHTML = pageHead("🏆 成就", `已点亮 ${lit} / ${ACHIEVEMENTS.length} 个。成就只是记录你走过的路，按自己的节奏来就好。`, `<a class="btn ghost sm" href="#/stats">学习统计 ›</a>`) + `
      <div class="achv-grid">${ACHIEVEMENTS.slice().sort((a, b) => (Achv.level(b) > 0) - (Achv.level(a) > 0)).map(card).join("")}</div>`;
  },
};

// 空状态：说明这里会出现什么，给一两个按钮直接过去
function emptyGuide(ico, title, text, links = []) {
  return `<div class="empty-guide"><div class="eg-ico">${ico}</div><b>${title}</b><p class="small muted">${text}</p>
    ${links.length ? `<div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">${links.map(([href, label]) => `<a class="btn sm" href="${href}">${label}</a>`).join("")}</div>` : ""}</div>`;
}

// 首页的「今日任务」卡片
function questCardHtml() {
  const items = Quests.items(), rec = Quests.today(), fr = Freeze.rec.n;
  if (!items.length) return "";
  const doneN = items.filter((x) => x.done).length;
  return `<div class="card quest-card">
    <div class="card-title">🎯 今日任务 <span class="small muted" style="font-weight:400">${doneN} / ${items.length}</span><span class="spacer"></span>
      <span class="small faint" title="每连续学满 7 天送一张，最多 2 张；哪天忘了学会自动用掉">🧊 连胜保护 × ${fr}</span></div>
    <div class="stack" style="gap:8px">${items.map((x) => `<a class="quest ${x.done ? "done" : ""}" href="${x.q.href}">
      <span class="quest-ico">${x.done ? "✅" : x.q.ico}</span>
      <span class="quest-body"><span class="quest-title">${esc(x.title)}</span><span class="bar"><i style="width:${Math.round((x.v / x.n) * 100)}%"></i></span></span>
      <span class="small ${x.done ? "good-text" : "faint"}">${x.done ? "完成" : esc(x.prog)}</span></a>`).join("")}</div>
    <div class="small ${rec.bonus ? "good-text" : "muted"} mt-s">${rec.bonus ? `🎁 全部完成，已领取 +${QUEST_BONUS} XP` : `🎁 三个都完成再得 +${QUEST_BONUS} XP`}</div>
  </div>`;
}

// ---------- 好友本周排行（局域网里的朋友 / 服务器上的账号）：自己打开「参加排行」才会被别人看到 ----------
const Board = {
  async html() {
    if (!Store.bridge) return "";
    let rows;
    try { rows = await pywebview.api.board_get(); } catch { return ""; }
    if (!Array.isArray(rows)) return "";
    const P = Store.prefs, others = rows.filter((r) => !r.me);
    const medal = (i) => ["🥇", "🥈", "🥉"][i] || `${i + 1}`;
    return `<div class="card board-card"><div class="card-title">👥 好友本周排行 <span class="spacer"></span>
        ${switchHtml("board-on", "参加排行", !!P.board, "打开后，同一台电脑（局域网）或同一个服务器上参加排行的人能看到你本周的经验值和连续天数")}</div>
      ${P.board ? `<div class="row small" style="gap:6px;margin-bottom:8px"><span class="muted">排行里显示的名字</span><input class="input" id="board-name" maxlength="20" value="${esc(P.board_name || "")}" placeholder="不填就用账号名" style="max-width:180px"></div>` : ""}
      ${others.length ? `<div class="board-list">${rows.map((r, i) => `<div class="board-row ${r.me ? "me" : ""}"><span class="board-rank">${medal(i)}</span><b>${esc(r.name)}${r.me ? "（我）" : ""}</b>${r.me && !r.on ? `<span class="small faint">没参加，别人看不到</span>` : ""}<span class="spacer"></span>
          <span class="small muted">🔥 ${r.streak} 天 · 本周学 ${r.days} 天</span><b class="board-xp">${r.xp} XP</b></div>`).join("")}</div>`
        : `<p class="small muted">${Store.server ? "服务器上还没有别人参加排行。" : "还没有朋友参加排行。"}在「设置 → 局域网访问 → 给其他人用」加上朋友（或者部署到服务器、各自注册账号），大家都打开「参加排行」，就能每周比一比经验值了。只看本周，周一清零，不比总量。</p>`}
    </div>`;
  },
  bind(box, rerender) {
    box.addEventListener("change", async (e) => {
      if (e.target.id === "board-on") { Store.prefs.board = e.target.checked; Store.save(); await Store.flush(); rerender(); }
      if (e.target.id === "board-name") { Store.prefs.board_name = e.target.value.trim(); Store.save(); await Store.flush(); rerender(); }
    });
  },
};

// ---------- 学习提醒 ----------
// 网页开着时：到了设置的时间（Store.prefs.remind，比如 "21:00"）今天还没学，就提醒一次
//   电脑上弹 Windows 系统通知（engnest/notify.py）；手机浏览器里允许了通知就弹浏览器通知；网页里也有一条提示
// 服务器模式还可以订阅推送（engnest/push.py）：关掉网页也能收到
const Reminder = {
  KEY: "engnest-reminded",
  text() {
    const st = streak();
    return st ? `已经连续学了 ${st} 天，今天学几分钟就能续上 🔥` : "今天还没学英语，花 5 分钟复习几个单词吧";
  },
  tick() {
    const t = Store.prefs?.remind;
    if (!t || !Store.data) return;
    const [h, m] = t.split(":").map(Number), now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    let last = "";
    try { last = localStorage.getItem(this.KEY) || ""; } catch { /* 隐私模式 */ }
    if (last === today()) return;
    try { localStorage.setItem(this.KEY, today()); } catch { /* 存不了就算了 */ }
    if (dayRec().xp > 0) return;
    this.notify(this.text());
  },
  async notify(body, title = "EngNest · 英语小窝") {
    toast(`⏰ ${body}`, "", 8000);
    if (Store.bridge && !Store.remote) { try { await pywebview.api.notify(title, body); } catch { /* 弹不出来就只有网页里的提示 */ } return; }
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg) await reg.showNotification(title, { body, icon: "img/icon-192.png", tag: "engnest-remind" });
      else new Notification(title, { body, icon: "img/icon-192.png" });
    } catch { /* 有的浏览器不让网页直接弹 */ }
  },
  // 服务器模式：订阅推送
  async subscribe() {
    const k = await pywebview.api.push_key();
    if (!k.ok) throw new Error(k.error);
    if ((await Notification.requestPermission()) !== "granted") throw new Error("没有允许通知：在浏览器设置里允许这个网站发通知后再试");
    const reg = await navigator.serviceWorker.ready;
    const key = Uint8Array.from(atob(k.key.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((k.key.length + 3) % 4)), (c) => c.charCodeAt(0));
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const r = await pywebview.api.push_subscribe(sub.toJSON(), Store.prefs.remind || "21:00", new Date().getTimezoneOffset());
    if (!r.ok) throw new Error(r.error);
  },
  async unsubscribe() {
    try { const reg = await navigator.serviceWorker?.getRegistration?.(); const s = await reg?.pushManager?.getSubscription(); await s?.unsubscribe(); } catch { /* 浏览器那边已经没了 */ }
    await pywebview.api.push_unsubscribe();
  },
};
