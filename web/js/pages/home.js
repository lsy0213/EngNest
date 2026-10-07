// 首页：今日目标、今日任务、学习统计、打卡日历
App.pages.home = {
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
    const nextLesson = GRAMMAR_ORDER.find((l) => !d.grammar[l.id]) || GRAMMAR_ORDER[0];
    const newLeft = newWordsLeftToday();
    const hour = new Date().getHours();
    const hello = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
    const st = streak();
    const [en, zh] = pick(SENTENCE_SCENES.flatMap((s) => s.sentences));

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

      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">📋 今日任务</div>
          <div class="stack" style="gap:10px">
            ${task("#/course/daily", "☀️", "每日一课", (d.course_daily || {})[today()] ? "今天已完成" : "场景短语，约 5 分钟", !!(d.course_daily || {})[today()])}
            ${task("#/words/review", "🔁", "复习单词", due ? `有 ${due} 个词到了复习时间` : "暂时没有要复习的词", due === 0)}
            ${(() => { const n = SentSRS.count(); return Object.keys(SentSRS.data()).length ? task("#/course/review", "🔁", "复习短语句子", n ? `有 ${n} 条到了复习时间` : "今天的都复习完了", n === 0) : ""; })()}
            ${task("#/words/new", "🆕", "学习新词", newLeft ? `今天还可以学 ${newLeft} 个新词` : "今天的新词已学完", newLeft === 0)}
            ${task(`#/grammar/${nextLesson.id}`, "🧩", "语法一课", nextLesson.title, !!d.grammar[nextLesson.id])}
            ${task("#/listening", "🎧", "听写 5 句", "边听边写，练耳朵也练拼写", false)}
            ${AI.enabled
              ? task("#/tutor", "🤖", "和 AI 老师聊几句", "开口说英语最重要", false)
              : task("#/speaking", "🎙️", "跟读练习", "模仿发音，录下来对比", false)}
          </div>
        </div>
        <div class="stack">
          <div class="card">
            <div class="card-title">📊 学习统计</div>
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

      <div class="card mt">
        <div class="card-title">💬 每日一句</div>
        <div class="row"><span class="daily-sentence">${esc(en)}</span>${speakBtn(en)}</div>
        <div class="muted mt-s">${esc(zh)}</div>
      </div>`;

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
