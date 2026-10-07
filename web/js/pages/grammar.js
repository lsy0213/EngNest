// 语法：课程列表 → 讲解 + 例句 + 练习题 + 问 AI
// 按章节排好的课程顺序
const GRAMMAR_ORDER = GRAMMAR_CHAPTERS.flatMap((c) => c.ids).map((id) => GRAMMAR_LESSONS.find((l) => l.id === id)).filter(Boolean);

// 思维导图数据：语法 → 章 → 课 → 知识点（知识点见 data/grammar_mindmap.js）
const grammarPoints = (l) => {
  const toNode = (x) => (typeof x === "string" ? { text: x } : { text: x[0], children: x[1].map(toNode) });
  const m = (window.GRAMMAR_MINDMAP || {})[l.id];
  if (m) return m.map(toNode);
  // 还没写导图的课：用讲解里的小标题兜底
  return [...l.content.matchAll(/<h3>(.*?)<\/h3>/g)].map((x) => ({ text: x[1].replace(/<[^>]+>/g, "") }));
};
const grammarChapterNode = (c, ci) => ({
  text: c.title,
  href: `#/grammar/map/${ci + 1}`,
  children: c.ids.map((id) => GRAMMAR_ORDER.find((l) => l.id === id)).filter(Boolean).map((l) => ({
    text: `${GRAMMAR_ORDER.indexOf(l) + 1}. ${l.title}`,
    href: `#/grammar/${l.id}`,
    done: !!Store.data.grammar[l.id],
    children: grammarPoints(l),
  })),
});
const grammarTabs = (active) => tabsHtml([["list", "📋 课程列表"], ["map", "🧠 思维导图"]], active);
const bindGrammarTabs = (root) => $$("[data-tab]", root).forEach((b) => (b.onclick = () => (location.hash = b.dataset.tab === "map" ? "#/grammar/map" : "#/grammar")));

App.pages.grammar = {
  render(root, params) {
    if (params[0] === "map") return this.map(root, +params[1] || 0);
    const lesson = GRAMMAR_ORDER.find((l) => l.id === params[0]);
    if (lesson) this.lesson(root, lesson);
    else this.list(root);
  },

  // 思维导图：ci = 0 是总图，1~6 是各章的知识点图
  map(root, ci) {
    const c = GRAMMAR_CHAPTERS[ci - 1];
    root.innerHTML = pageHead("语法", c ? "本章所有课程和知识点：点小节旁的数字圆点展开要点，点课程节点进入学习" : "整套语法课的全貌：点课程旁的数字圆点展开知识点，点课程节点进入学习", grammarTabs("map"))
      + `<div class="chips mm-chips">${["🗺️ 总览", ...GRAMMAR_CHAPTERS.map((x) => x.title)].map((t, i) =>
        `<a class="chip ${i === ci ? "active" : ""}" href="#/grammar/map${i ? `/${i}` : ""}" style="text-decoration:none">${t}</a>`).join("")}</div>
      <div class="card" id="mm"></div>`;
    bindGrammarTabs(root);
    let tree;
    if (c) {
      tree = grammarChapterNode(c, ci - 1);
      delete tree.href;
    } else {
      tree = { text: "英语语法", children: GRAMMAR_CHAPTERS.map(grammarChapterNode) };
    }
    // 总图展开到课程，章节图展开到小节；更细的要点点数字圆点再展开
    MindMap.mount($("#mm", root), tree, { expandDepth: 2 });
  },

  list(root) {
    const g = Store.data.grammar;
    const done = GRAMMAR_ORDER.filter((l) => g[l.id]).length;
    root.innerHTML = pageHead("语法", "", grammarTabs("list"))
      + GRAMMAR_CHAPTERS.map((c) => {
        const lessons = c.ids.map((id) => GRAMMAR_ORDER.find((l) => l.id === id)).filter(Boolean);
        const cDone = lessons.filter((l) => g[l.id]).length;
        return `<div class="chapter-head"><h3>${c.title}</h3><span class="small muted">${cDone} / ${lessons.length}</span></div>
          <div class="grid grid-3">${lessons.map((l) => {
            const r = g[l.id];
            return `<a class="card lesson-card" href="#/grammar/${l.id}" style="text-decoration:none;color:inherit">
              <div class="row"><span class="num">第 ${GRAMMAR_ORDER.indexOf(l) + 1} 课</span><span class="spacer"></span>
                <span class="badge ${l.level === "基础" ? "" : l.level === "进阶" ? "info" : "warn"}">${l.level}</span></div>
              <h3>${l.title}</h3><p>${l.summary}</p>
              ${r ? `<div class="row small"><span class="badge good">✓ 已完成</span><span class="muted">最高 ${r.best}/${l.quiz.length}</span></div>` : `<div class="small faint">未开始</div>`}
            </a>`;
          }).join("")}</div>`;
      }).join("");
    bindGrammarTabs(root);
  },

  lesson(root, l) {
    const idx = GRAMMAR_ORDER.indexOf(l);
    const nextL = GRAMMAR_ORDER[idx + 1];
    root.innerHTML = `
      <a class="back-link" href="#/grammar">‹ 返回语法列表</a>
      ${pageHead(`第 ${idx + 1} 课 · ${l.title}`, l.summary)}
      <details class="card mm-card" id="mm-card" ${Store.prefs.grammar_map_closed ? "" : "open"}>
        <summary class="card-title">🧠 本课知识导图</summary><div id="mm"></div>
      </details>
      <div class="card lesson-body">${l.content}</div>
      <div class="card">
        <div class="card-title">✏️ 练一练</div>
        <div id="quiz"></div>
        <div class="row mt"><button class="btn primary" id="submit">提交答案</button><span id="score" class="muted"></span><span class="spacer"></span>
          ${nextL ? `<a class="btn soft hidden" id="next" href="#/grammar/${nextL.id}">下一课：${nextL.title} ›</a>` : ""}</div>
      </div>
      <div class="card">
        <div class="card-title">🤖 有疑问？问问 AI 老师</div>
        <div id="ask"></div>
      </div>`;

    // 本课知识导图（收起状态记在设置里）
    const mmCard = $("#mm-card", root);
    const mm = MindMap.mount($("#mm", root), { text: l.title, children: grammarPoints(l) }, { maxHeight: "60vh" });
    mmCard.addEventListener("toggle", () => {
      Store.prefs.grammar_map_closed = !mmCard.open;
      Store.save();
      if (mmCard.open) mm.show();
    });

    // 例句加朗读按钮
    $$(".ex", root).forEach((ex) => {
      const en = $(".en", ex).textContent;
      const zh = $(".zh", ex).outerHTML;
      ex.innerHTML = `<div class="txt"><span class="en">${esc(en)}</span>${zh}</div>${speakBtn(en)}`;
    });

    // 练习题：先全部作答，再统一提交
    const letters = "ABCD";
    const picks = new Array(l.quiz.length).fill(-1);
    const quiz = $("#quiz", root);
    quiz.innerHTML = l.quiz.map((q, qi) => `
      <div class="quiz-item" data-q="${qi}">
        <div class="quiz-q en"><span class="qnum">${qi + 1}.</span>${esc(q.q)}</div>
        <div class="options two">${q.o.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${letters[i]}</span><span style="font-family:var(--font-en)">${esc(o)}</span></button>`).join("")}</div>
        <div class="explain-slot"></div>
      </div>`).join("");
    quiz.addEventListener("click", (e) => {
      const b = e.target.closest(".option");
      if (!b || b.disabled) return;
      const item = b.closest("[data-q]");
      $$(".option", item).forEach((x) => x.classList.remove("picked"));
      b.classList.add("picked");
      picks[+item.dataset.q] = +b.dataset.i;
    });

    $("#submit", root).onclick = (evt) => {
      if (picks.includes(-1)) { toast(`还有 ${picks.filter((p) => p < 0).length} 题没做`); return; }
      let right = 0;
      l.quiz.forEach((q, qi) => {
        const item = $(`[data-q="${qi}"]`, quiz);
        const btns = $$(".option", item);
        btns.forEach((b) => { b.disabled = true; b.classList.remove("picked"); });
        btns[q.a].classList.add("right");
        const ok = picks[qi] === q.a;
        if (ok) right++;
        else btns[picks[qi]].classList.add("wrong");
        $(".explain-slot", item).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅" : "❌"} ${esc(q.e)}</div>`;
      });
      const prev = Store.data.grammar[l.id];
      Store.data.grammar[l.id] = { best: Math.max(right, prev?.best || 0), last: right, date: today() };
      addXP(prev ? right : 10 + right, null, evt);
      $("#score", root).innerHTML = `得分 <b>${right} / ${l.quiz.length}</b> ${right === l.quiz.length ? "🎉 全对！" : "，看看解析吧"}`;
      const sb = $("#submit", root);
      sb.textContent = "再做一次";
      sb.onclick = () => this.lesson(root, l);
      const nb = $("#next", root);
      if (nb) nb.classList.remove("hidden");
    };

    // 问 AI
    const ask = $("#ask", root);
    if (!AI.enabled) {
      ask.innerHTML = `<p class="muted small">开启 AI 后，可以针对这一课随时提问，比如「现在完成时和一般过去时到底怎么区分？」。<a href="#/settings">去设置</a></p>`;
      return;
    }
    ask.innerHTML = `<div class="row"><input class="input" id="q" placeholder="比如：这个语法点在口语里常用吗？能再举几个例子吗？" style="flex:1"><button class="btn primary" id="go">提问</button></div>
      <div class="chips mt-s">${["再举 5 个生活中的例子", "出 3 道练习题考考我", "我最容易犯的错误是什么？"].map((s) => `<button class="chip" data-s="${s}">${s}</button>`).join("")}</div>
      <div id="ans" class="mt"></div>`;
    const go = async (question) => {
      if (!question.trim()) return;
      await aiAnswer($("#ans", root),
        `You are a patient English grammar teacher. ${LEARNER_PROFILE} Answer in Chinese, with English examples. Keep it clear and concise (under 250 Chinese characters plus examples). Use simple markdown (bold, lists).`,
        `当前在学习的语法课：「${l.title}」—— ${l.summary}\n\n我的问题：${question}`);
    };
    $("#go", root).onclick = () => go($("#q", root).value);
    $("#q", root).addEventListener("keydown", (e) => { if (e.key === "Enter") go(e.target.value); });
    $$("[data-s]", root).forEach((c) => (c.onclick = () => go(c.dataset.s)));
  },
};
