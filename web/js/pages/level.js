// 水平测试：词汇量（分四档抽词）+ 语法（基础 / 进阶 / 提高）+ 听力（听例句选意思），大约 8 分钟
// 结果存在 Store.data.level：{cefr, idx, vocab, parts, date}，AI 的提示词（learnerProfile）、阅读难度、推荐词书都按它调整
const CEFR_NAMES = ["A1", "A2", "B1", "B2", "C1"];
const LEVEL_BOOK = ["core", "core", "cet4", "cet6", "ielts"];
const LEVEL_DESC = [
  "入门：能看懂和说出最常用的词和短句。",
  "基础：日常生活的简单交流没问题，长句和抽象话题还吃力。",
  "中级：能应付大部分日常和工作场景，能读懂简单的文章（大约四级水平）。",
  "中高级：能比较流利地讨论熟悉的话题，读懂一般的英文文章（大约六级 / 雅思 6 分）。",
  "高级：能读懂较难的文章，表达比较地道（大约雅思 7 分以上）。",
];

// 给 AI 看的学习者情况（所有 AI 功能的提示词里都会带上）
function learnerProfile() {
  const lv = Store.data?.level;
  if (!lv?.cefr) {
    return "The learner is a Chinese adult who passed CET-4 (College English Test Band 4) several years ago but has become rusty; their current level is roughly CEFR A2-B1.";
  }
  const hint = [
    "Use very simple words and short sentences.",
    "Use simple, common words and short sentences; explain anything harder.",
    "Use everyday vocabulary; avoid rare words and long complex sentences.",
    "You can use natural, moderately advanced English, but explain idioms and rare words.",
    "You can use rich, natural English, including idioms.",
  ][lv.idx] || "";
  return `The learner is a Chinese adult English learner. A placement test on ${lv.date} put their level at about CEFR ${lv.cefr} (estimated vocabulary about ${lv.vocab} words). ${hint}`;
}
Object.defineProperty(window, "LEARNER_PROFILE", { get: learnerProfile, configurable: true });

App.pages.level = {
  // 四档词：入门精选 → 四级 → 六级 → 托福里更难的
  bands() {
    const words = (id) => (BOOK_MAP[id] ? bookItems(BOOK_MAP[id]) : []).filter((x) => x.m && x.w.length > 2 && !/\s/.test(x.w));
    const seen = new Set();
    const take = (list) => list.filter((x) => { const k = x.w.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return [
      { cefr: 1, width: 1500, items: take(words("core")) },
      { cefr: 2, width: 2500, items: take(words("cet4")) },
      { cefr: 3, width: 2000, items: take(words("cet6")) },
      { cefr: 4, width: 3000, items: take([...words("ielts"), ...words("toefl")]) },
    ].filter((b) => b.items.length >= 10);
  },

  build() {
    const qs = [];
    for (const b of this.bands()) {
      for (const it of sample(b.items, 6)) {
        const opts = shuffle([shortMeaning(it), ...sample(b.items.filter((x) => x !== it), 3).map(shortMeaning)]);
        qs.push({ part: "vocab", band: b.cefr, prompt: it.w, ph: it.ph, opts, a: opts.indexOf(shortMeaning(it)), dunno: true });
      }
    }
    const byLevel = (lv) => GRAMMAR_LESSONS.filter((l) => l.level === lv).flatMap((l) => l.quiz || []);
    [["基础", 4], ["进阶", 4], ["提高", 4]].forEach(([lv, n], i) => {
      for (const g of sample(byLevel(lv), n)) qs.push({ part: "grammar", band: i, prompt: g.q, opts: g.o, a: g.a, explain: g.e });
    });
    const withEx = (id) => (BOOK_MAP[id] ? bookItems(BOOK_MAP[id]) : []).filter((x) => x.ex && x.zh && x.ex.split(" ").length >= 6 && x.ex.split(" ").length <= 16);
    [["cet4", 3, 2], ["cet6", 3, 3]].forEach(([id, n, band]) => {
      const pool = withEx(id);
      for (const it of sample(pool, n)) {
        const opts = shuffle([it.zh, ...sample(pool.filter((x) => x !== it), 3).map((x) => x.zh)]);
        qs.push({ part: "listen", band, prompt: it.ex, opts, a: opts.indexOf(it.zh) });
      }
    });
    return qs;
  },

  render(root, params, signal) {
    const lv = Store.data.level;
    root.innerHTML = pageHead("水平测试", "大约 8 分钟：词汇、语法、听力三部分。测完会推荐词书、阅读难度，AI 也会按你的水平说话。") + `
      <div class="card">
        ${lv ? `<div class="explain">上次测试（${esc(lv.date)}）：<b>${esc(lv.cefr)}</b>，词汇量约 ${lv.vocab} 词。可以随时重测。</div>` : ""}
        <ol class="small muted">
          <li><b>词汇</b> 24 题：看单词选意思。不认识就选「不认识」，别猜，结果才准。</li>
          <li><b>语法</b> 12 题：选择正确的一项。</li>
          <li><b>听力</b> 6 题：听一句话（可以重听），选意思。</li>
        </ol>
        <button class="btn primary lg" id="start">开始测试</button>
      </div>`;
    $("#start", root).onclick = async (e) => {
      // 测试要从四六级、雅思、托福里抽词，没加载的先加载
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "正在载入词书…";
      try { await Books.ensure(["cet4", "cet6", "ielts", "toefl"]); } catch (err) { toast(err.message || String(err), "bad", 5000); btn.disabled = false; btn.textContent = "开始测试"; return; }
      if (!signal.aborted) this.run(root, signal);
    };
  },

  run(root, signal) {
    const qs = this.build();
    const ans = [];
    let i = 0;
    const partName = { vocab: "词汇", grammar: "语法", listen: "听力" };
    const draw = () => {
      const q = qs[i];
      if (!q) return this.finish(root, qs, ans);
      root.innerHTML = pageHead("水平测试", `${partName[q.part]} · 第 ${i + 1} / ${qs.length} 题`) + `
        <div class="card level-q">
          <div class="bar"><i style="width:${Math.round((i / qs.length) * 100)}%"></i></div>
          ${q.part === "vocab" ? `<div class="fc-word center mt">${esc(q.prompt)}</div><div class="center fc-ipa">${esc(q.ph || "")} ${speakBtn(q.prompt)}</div>`
            : q.part === "grammar" ? `<div class="level-prompt en mt">${esc(q.prompt)}</div>`
            : `<div class="center mt"><button class="btn soft lg" id="play">🔊 再听一遍</button></div>`}
          <div class="level-opts mt">${q.opts.map((o, k) => `<button class="btn level-opt" data-k="${k}">${esc(o)}</button>`).join("")}
            ${q.dunno ? `<button class="btn ghost level-opt" data-k="-1">不认识</button>` : ""}</div>
          <div class="small faint center mt-s">按 1–${q.opts.length} 选择${q.dunno ? "，0 = 不认识" : ""}</div>
        </div>`;
      if (q.part === "listen") {
        const play = () => TTS.speak(q.prompt, 0.95);
        $("#play", root).onclick = play;
        play();
      }
      $$(".level-opt", root).forEach((b) => (b.onclick = () => pick(+b.dataset.k)));
    };
    const pick = (k) => {
      ans[i] = k === qs[i].a;
      i++;
      TTS.stop();
      draw();
    };
    onKey(signal, (e) => {
      const q = qs[i];
      if (!q) return;
      if (/^[1-9]$/.test(e.key) && +e.key <= q.opts.length) pick(+e.key - 1);
      else if (e.key === "0" && q.dunno) pick(-1);
    });
    draw();
  },

  finish(root, qs, ans) {
    const acc = (part, band) => {
      const idx = qs.map((q, k) => k).filter((k) => qs[k].part === part && (band === undefined || qs[k].band === band));
      return idx.length ? idx.filter((k) => ans[k]).length / idx.length : 0;
    };
    // 词汇：从低到高，每档答对 60% 以上才算过；词汇量按各档正确率加权估算
    const bands = this.bands();
    let vIdx = 0;
    for (const b of bands) { if (acc("vocab", b.cefr) >= 0.6) vIdx = b.cefr; else break; }
    const vocab = Math.round(bands.reduce((s, b) => s + b.width * acc("vocab", b.cefr), 0) / 100) * 100;
    const g = acc("grammar"), l = acc("listen");
    const gIdx = g < 0.35 ? 0 : g < 0.55 ? 1 : g < 0.75 ? 2 : g < 0.9 ? 3 : 4;
    const lIdx = l < 0.34 ? 1 : l < 0.67 ? 2 : l < 1 ? 3 : 4;
    const idx = Math.round((vIdx * 2 + gIdx + lIdx) / 4); // 词汇量权重大一些
    const level = { cefr: CEFR_NAMES[idx], idx, vocab, date: today(), parts: { vocab: CEFR_NAMES[vIdx], grammar: Math.round(g * 100), listen: Math.round(l * 100) } };
    Store.data.level = level;
    Store.prefs.read_level = Math.min(4, Math.max(1, idx));
    Store.save();
    addXP(10);
    const book = BOOK_MAP[LEVEL_BOOK[idx]];
    const wrongs = qs.map((q, k) => (!ans[k] && q.part === "grammar" ? q : null)).filter(Boolean);
    root.innerHTML = pageHead("测试结果", "") + `
      <div class="card center">
        <div class="level-badge">${level.cefr}</div>
        <p>${esc(LEVEL_DESC[idx])}</p>
        <div class="row" style="justify-content:center;gap:24px;flex-wrap:wrap">
          <div><b>${vocab.toLocaleString()}</b><div class="small muted">估计词汇量</div></div>
          <div><b>${level.parts.vocab}</b><div class="small muted">词汇水平</div></div>
          <div><b>${level.parts.grammar}%</b><div class="small muted">语法正确率</div></div>
          <div><b>${level.parts.listen}%</b><div class="small muted">听力正确率</div></div>
        </div>
        <p class="small muted mt">阅读难度已经调成 ${esc(CEFR[Store.prefs.read_level] || "")}，AI 语伴和各种 AI 讲解也会按 ${level.cefr} 的水平说话。</p>
        <div class="row mt" style="justify-content:center;flex-wrap:wrap">
          ${book && Store.prefs.book !== book.id ? `<button class="btn primary" id="use-book">用推荐的词书：${esc(book.title)}</button>` : ""}
          <a class="btn" href="#/home">回首页</a><a class="btn ghost" href="#/level">重新测</a></div>
      </div>
      ${wrongs.length ? `<div class="card"><div class="card-title">语法错题</div>${wrongs.map((q) => `<div class="mt-s"><div class="en">${esc(q.prompt)}</div>
        <div class="small"><b>${esc(q.opts[q.a])}</b> · ${esc(q.explain || "")}</div></div>`).join("")}</div>` : ""}`;
    const ub = $("#use-book", root);
    if (ub) ub.onclick = () => { Store.prefs.book = book.id; Store.save(); toast(`已换成「${book.title}」`, "good"); Router.go("words"); };
  },
};
