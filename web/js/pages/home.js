// 首页：今日目标、今日学习计划（按学习目标和水平安排）、学习统计、打卡日历；第一次打开时有新手引导
const GOALS = [
  ["general", "🪺", "把英语重新捡起来", "单词、短语、语法、阅读都练一点"],
  ["cet4", "📘", "考四级", "四级词汇、语法、阅读和听写"],
  ["cet6", "📗", "考六级", "六级词汇、长难句阅读和听写"],
  ["ielts", "🎓", "考雅思", "雅思词汇、四科专项练习"],
  ["speak", "🗣️", "开口说英语", "场景短语、跟读、和 AI 聊天"],
];

App.pages.home = {
  // 今天的学习计划：[{href, ico, title, sub, min（分钟）, done}]
  plan() {
    const d = Store.data, P = Store.prefs, goal = P.goal || "general", t = today();
    const due = dueWords().length, sdue = Object.keys(SentSRS.data()).length ? SentSRS.count() : 0, newLeft = newWordsLeftToday();
    const didToday = (obj) => Object.values(obj || {}).some((x) => x?.date === t);
    const nextLesson = GRAMMAR_ORDER.find((l) => !d.grammar[l.id]) || GRAMMAR_ORDER[0];
    const items = [];
    if (due) items.push({ href: "#/words/review", ico: "🔁", title: "复习单词", sub: `有 ${due} 个词快忘了，先复习`, min: Math.ceil(due / 6), done: false });
    if (sdue) items.push({ href: "#/course/review", ico: "🔁", title: "复习短语句子", sub: `${sdue} 条`, min: Math.ceil(sdue / 4), done: false });
    items.push({ href: "#/words/new", ico: "🆕", title: "学新词", sub: newLeft ? `今天还能学 ${newLeft} 个（${curBook().title}）` : "今天的新词学完了", min: Math.ceil(newLeft / 3), done: !newLeft });
    const daily = { href: "#/course/daily", ico: "☀️", title: "每日一课", sub: "场景短语，约 5 分钟", min: 5, done: !!(d.course_daily || {})[t] };
    const grammar = { href: `#/grammar/${nextLesson.id}`, ico: "🧩", title: "语法一课", sub: nextLesson.title, min: 8, done: didToday(d.grammar) };
    const reading = { href: "#/reading", ico: "📖", title: "读一篇文章", sub: `难度 ${CEFR[P.read_level || 2] || "B1"}，打开「标出生词」看看生词率`, min: 10, done: didToday(d.reading) };
    const dict = { href: "#/listening/dictation", ico: "🎧", title: "听写 5 句", sub: "边听边写，练耳朵也练拼写", min: 8, done: false };
    const talk = AI.enabled ? { href: "#/tutor", ico: "🤖", title: "和 AI 语伴聊几句", sub: "开口说最重要", min: 10, done: false }
      : { href: "#/speaking", ico: "🎙️", title: "跟读练习", sub: "模仿发音，录下来对比", min: 8, done: false };
    const wd = new Date().getDay();
    const ieltsPart = [["#/ilisten", "🎧", "雅思听力"], ["#/ireading", "📖", "雅思阅读"], ["#/iwrite", "✍️", "雅思写作"], ["#/ispeak", "🎙️", "雅思口语"]][wd % 4];
    const plans = {
      general: [daily, grammar, reading, talk],
      cet4: [grammar, reading, dict],
      cet6: [reading, dict, grammar],
      ielts: [{ href: ieltsPart[0], ico: ieltsPart[1], title: `今天练：${ieltsPart[2]}`, sub: "四科轮着练", min: 20, done: false }, reading, talk],
      speak: [daily, talk, { href: "#/video", ico: "🎬", title: "影视精听一段", sub: "逐句跟读，练语调", min: 10, done: false }],
    };
    return [...items, ...(plans[goal] || plans.general)];
  },

  goalOpts() {
    const cur = Store.prefs.goal || "";
    return `<div class="goal-opts">${GOALS.map(([id, ico, t, s]) => `<button class="goal-opt ${cur === id ? "active" : ""}" data-goal="${id}"><span>${ico}</span><b>${t}</b><small>${s}</small></button>`).join("")}</div>`;
  },

  // 第一次打开：选学习目标 → 做水平测试 → （可选）接入 AI
  onboarding() {
    return `<div class="card onboard">
      <div class="card-title">👋 第一次来？三步开始</div>
      <div class="onboard-step"><b>1. 你学英语主要是为了？</b>${this.goalOpts()}</div>
      <div class="onboard-step"><b>2. 测一下现在的水平</b>（约 8 分钟）：推荐词书、阅读难度，AI 也会按你的水平说话。
        <div class="row mt-s"><a class="btn primary" href="#/level">开始水平测试</a></div></div>
      <div class="onboard-step"><b>3. （可选）接入 AI</b>：AI 语伴、作文批改、逐句精讲都需要。DeepSeek、通义千问等国内服务就能用。
        <div class="row mt-s"><a class="btn" href="#/settings">去设置</a></div></div>
      <div class="row mt"><span class="spacer"></span><button class="btn ghost sm" id="onboard-skip">先不用，直接开始</button></div></div>`;
  },

  // 水平相关的建议：没测过 / 很久没测 / 最近复习记得特别好或特别差
  advice() {
    const lv = Store.data.level;
    if (!lv) return Object.keys(Store.data.words).length > 30 ? { text: "还没做过水平测试：测一下，词书、阅读难度和 AI 讲解都能更合适。", href: "#/level", btn: "去测试" } : null;
    const age = (new Date(today()) - new Date(lv.date)) / 864e5;
    const ret = App.pages.stats.retention(14);
    if (ret.n >= 60 && ret.overall >= 0.94) return { text: `最近两周复习记住率 ${Math.round(ret.overall * 100)}%，比目标高不少：可以每天多学几个新词，或者重新测一下水平。`, href: "#/level", btn: "重新测试" };
    if (ret.n >= 60 && ret.overall < 0.75) return { text: `最近两周复习记住率只有 ${Math.round(ret.overall * 100)}%：新词学得有点快，可以在设置里把每天的新词减少一些。`, href: "#/settings", btn: "去调整" };
    if (age > 60) return { text: `上次水平测试是 ${lv.date}（${lv.cefr}），两个月过去了，再测一下看看进步？`, href: "#/level", btn: "重新测试" };
    return null;
  },


  render(root) {
    const d = Store.data;
    const t = dayRec();
    const goal = Store.prefs.daily_goal;
    const pct = Math.min(1, t.xp / goal);
    const due = dueWords().length;
    const learned = Object.keys(d.words).length;
    const bookLearned = bookItems().filter((x) => d.words[x.w]).length;
    const mastered = Object.values(d.words).filter((s) => s.box >= MASTERED_BOX).length;
    const grammarDone = Object.keys(d.grammar).length;
    const readingDone = App.pages.reading.all().filter((p) => d.reading[p.id]).length;
    const hour = new Date().getHours();
    const hello = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
    const st = streak();
    const [en, zh] = pick(SENTENCE_SCENES.flatMap((s) => s.sentences));

    const plan = this.plan();
    const C = 2 * Math.PI * 46;
    root.innerHTML = `
      <div class="hero">
        <div class="ring">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--surface-3)" stroke-width="10"/>
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--brand)" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset .6s"/>
          </svg>
          <div class="ring-label"><div><b>${t.xp}</b><span>/ ${goal} XP</span></div></div>
        </div>
        <div class="hero-copy">
          <div class="hero-kicker">英语小窝 · 今日手札</div>
          <h1>${hello}！欢迎回到小窝</h1>
          <div class="muted">${st > 0 ? `已经连续学习 <b>${st}</b> 天，继续保持！` : "今天是重新出发的好日子，从几个单词开始吧。"}
            ${pct >= 1 ? " 🎯 今日目标已完成！" : ""}</div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <img class="hero-flower" src="img/skin/flower-ornament.png" alt="">
          <img class="hero-yarn" src="img/skin/yarn-ornament.png" alt="">
          <img class="hero-cat" src="img/companions/flower-cat-kitten.png" alt="">
        </div>
      </div>

      ${!Store.prefs.onboarded && !Store.data.level ? this.onboarding() : ""}
      ${(() => { const a = this.advice(); return a ? `<div class="explain row" style="margin-bottom:14px"><span style="flex:1">💡 ${esc(a.text)}</span><a class="btn sm soft" href="${a.href}">${a.btn}</a></div>` : ""; })()}
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">📋 今日学习计划 <span class="spacer"></span>
            <button class="btn sm ghost" id="goal-btn" title="换个学习目标" aria-label="换个学习目标">🎯 换目标</button></div>
          <div class="small muted" style="margin:-6px 0 10px">目标：${(GOALS.find((g) => g[0] === (Store.prefs.goal || "general")) || GOALS[0])[2]} · 剩下的大约 ${plan.filter((x) => !x.done).reduce((s, x) => s + x.min, 0)} 分钟</div>
          <div class="stack" style="gap:10px">
            ${plan.map((x) => task(x.href, x.ico, x.title, x.done ? "今天已完成" : x.sub, x.done)).join("")}
          </div>
        </div>
        <div class="stack">
          <div class="card">
            <div class="card-title">📊 学习统计 <span class="spacer"></span><a class="small" href="#/stats">更多统计 ›</a></div>
            <div class="grid grid-2" style="gap:10px">
              <div class="stat"><b>${bookLearned}<small class="faint" style="font-size:14px"> / ${curBook().count}</small></b><span>${curBook().title} · 共学过 ${learned} 词</span></div>
              <div class="stat"><b>${mastered}</b><span>已掌握单词</span></div>
              <div class="stat"><b>${grammarDone}<small class="faint" style="font-size:14px"> / ${GRAMMAR_ORDER.length}</small></b><span>语法课</span></div>
              <div class="stat"><b>${d.xp}</b><span>累计经验值</span></div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">🗓️ 最近 5 周 <span class="spacer"></span><span class="small muted">阅读完成 ${readingDone} 篇</span></div>
            <div class="heat">${heat()}</div>
          </div>
        </div>
      </div>

      <div id="home-shelf"></div>
      <div class="card mt">
        <div class="card-title">💬 每日一句</div>
        <div class="row"><span class="daily-sentence">${esc(en)}</span>${speakBtn(en)}</div>
        <div class="muted mt-s">${esc(zh)}</div>
      </div>`;

    // 继续阅读：导入的读物的书目要先从 Python 端取
    Docs.library().then(() => { const el = $("#home-shelf", root); if (el) el.innerHTML = Shelf.homeHtml(); });

    // 新手引导和学习目标
    root.onclick = (e) => {
      const g = e.target.closest("[data-goal]");
      if (g && !e.target.closest(".modal")) { Store.prefs.goal = g.dataset.goal; Store.save(); this.render(root); toast("已设置学习目标", "good"); return; }
      if (e.target.closest("#onboard-skip")) { Store.prefs.onboarded = true; Store.save(); this.render(root); return; }
      if (e.target.closest("#goal-btn")) {
        const m = modal(`<h3>学习目标</h3><p class="muted small">首页的「今日学习计划」会按目标安排。</p>${this.goalOpts()}
          <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
        m.root.addEventListener("click", (ev) => { const b = ev.target.closest("[data-goal]"); if (b) { Store.prefs.goal = b.dataset.goal; Store.save(); m.close(); this.render(root); } });
      }
    };

    function task(href, ico, title, sub, done) {
      return `<a class="task ${done ? "done" : ""}" href="${href}">
        <div class="task-ico">${done ? "✅" : ico}</div>
        <div class="task-body"><div class="task-title">${title}</div><div class="task-sub">${esc(sub)}</div></div>
        <span class="faint">›</span></a>`;
    }

    function heat() {
      // 5 周 × 7 天，最后一格是今天
      const cells = [];
      for (let i = 34; i >= 0; i--) {
        const date = addDays(today(), -i);
        const xp = d.days[date]?.xp || 0;
        const lv = xp === 0 ? "" : xp < goal / 2 ? "l1" : xp < goal ? "l2" : "l3";
        cells.push(`<i class="${lv} ${i === 0 ? "today" : ""}" title="${date}：${xp} XP"></i>`);
      }
      return cells.join("");
    }
  },
};
