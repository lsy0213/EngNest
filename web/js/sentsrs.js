// ============================================================
// 短语和句子的间隔复习：短语课学过的短语 + 生词本里的短语和句子，按记忆曲线安排复习
// 复习卡片：看中文说英文（没有中文的看英文想意思），← 记住了 / → 没记住 / ↓ 有点模糊，和单词卡片一样可以拖动
// 进度存在 Store.data.sent_srs：{ 规范化的英文: {en, zh, src, box, due, seen, wrong, first} }
// ============================================================

const SentSRS = {
  data() { return (Store.data.sent_srs ||= {}); },
  key: (en) => selNorm(en || ""),
  add(en, zh, src, due = addDays(today(), 1)) {
    const k = this.key(en), d = this.data();
    if (!k) return;
    if (!d[k]) d[k] = markAdded("sent_srs", k, { en, zh: zh || "", src: src || "", box: 0, due, seen: 0, wrong: 0, first: today() });
    else if (zh && !d[k].zh) d[k].zh = zh;
  },
  remove(en) {
    const k = this.key(en);
    delete this.data()[k];
    markDeleted("sent_srs", k);
  },
  // 把学过的东西补进来：生词本里的短语句子、短语课里学过的短语（第二天开始复习）
  sync() {
    const before = Object.keys(this.data()).length;
    sentNb().forEach((x) => this.add(x.en, x.zh, x.from || "生词本", addDays(x.added || today(), 1)));
    const seen = Store.data.phrases || {};
    if (typeof ALL_PHRASES !== "undefined") ALL_PHRASES.forEach((p) => { if (seen[p.en]) this.add(p.en, p.zh, "短语课", addDays(seen[p.en].last, 1)); });
    if (Object.keys(this.data()).length !== before) Store.save();
  },
  due() {
    this.sync();
    const t = today();
    return Object.values(this.data()).filter((x) => x.due <= t).sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : 1));
  },
  count() { return this.due().length; },
  grade(x, g) {
    const prev = JSON.stringify(x);
    const days = Fsrs.schedule(x, g);
    x.seen++;
    x.t = Date.now();
    if (g === 0) x.wrong++;
    logReview("s:" + this.key(x.en), g, days);
    Undo.push("这句的评分", () => {
      Object.assign(x, JSON.parse(prev));
      if (!("f" in JSON.parse(prev))) delete x.f;
      const log = Store.data.revlog || [];
      const i = log.findLastIndex((r) => r[0] === "s:" + this.key(x.en));
      if (i >= 0) log.splice(i, 1);
    });
    Store.save();
  },
};

// 复习卡片
function runSentenceCards(container, queue, signal, onFinish, { exitTo } = {}) {
  enterStudyFocus(container, signal, exitTo);
  const total = queue.length, q = [...queue], retry = {};
  const stats = { known: 0, fuzzy: 0, unknown: 0 };
  let cur = null, revealed = false, done = 0, busy = false;
  const zh2en = () => !!cur.zh;
  const history = [];
  const K = knownDir(), L = K < 0 ? "←" : "→", R = K < 0 ? "→" : "←";
  const undo = () => {
    const h = history.pop();
    if (!h || busy) return;
    Undo.pop();
    if (h.xp) takeXP(h.xp);
    q.splice(0, q.length, ...h.q);
    Object.assign(stats, h.stats);
    Object.keys(retry).forEach((k) => delete retry[k]);
    Object.assign(retry, h.retry);
    done = h.done;
    cur = h.cur;
    revealed = true;
    draw();
    toast("已撤销上一次评分");
  };

  const next = () => {
    cur = q.shift();
    revealed = false;
    if (!cur) return finish();
    draw();
    if (!zh2en()) TTS.speak(cur.en);
  };
  App.shadowTarget = () => (cur && (revealed || !zh2en()) ? [{ en: cur.en, zh: cur.zh, label: "句子" }] : null);

  const draw = (enter = true) => {
    const pct = Math.round((done / total) * 100);
    const front = zh2en()
      ? `<div class="sc-front-ask small muted">用英语怎么说？</div><div class="sc-front-zh">${esc(cur.zh)}</div>`
      : `<div class="sc-front-ask small muted">是什么意思？</div><div class="sc-front-en en">${esc(cur.en)}</div>`;
    const back = `<div class="fc-back ${enter ? "" : "reveal"}">
        ${zh2en() ? `<div class="sc-front-en en" data-text="${esc(cur.en)}">${wrapWords(cur.en)}</div>` : `<div class="sc-front-zh">${esc(cur.zh || "（还没有翻译）")}</div>`}
        <div class="row" style="justify-content:center;gap:6px;margin-top:8px">${speakBtn(cur.en)}<button class="speak" data-say="${esc(cur.en)}" data-rate="0.6" title="慢速">🐢</button>${shadowBtn(cur.en, { zh: cur.zh })}</div></div>`;
    container.innerHTML = `
      <div class="flash-wrap">
        <div class="flash-progress">${STUDY_EXIT_BTN}<span>${done} / ${total}</span><div class="bar"><i style="width:${pct}%"></i></div><span>短语句子复习</span>
          ${history.length ? `<button class="btn sm ghost" data-undo title="撤销上一次评分（Ctrl+Z）">↶ 撤销</button>` : ""}</div>
        <div class="fc-stack ${enter ? (PageCurl.justTurned() ? "turned" : "enter") : ""} ${q.length ? "" : "last"} ${K > 0 ? "swap-dir" : ""}">
        <div class="card flashcard sent-card" id="fc">
          <div class="fc-stamp ok">记住了 ✓</div><div class="fc-stamp no">没记住 ✗</div>
          <div class="fc-top"><span class="fc-tag">${esc(cur.src || "")}${cur.box ? ` · 第 ${cur.seen + 1} 次复习` : ""}</span></div>
          ${front}
          ${revealed ? back + `<div class="fc-actions">
              <button class="btn good lg" data-g="2">${L} 记住了</button>
              <button class="btn warn lg" data-g="1">有点模糊 <span class="kbd">↓</span></button>
              <button class="btn bad lg" data-g="0">没记住 ${R}</button></div>`
            : `<div class="fc-actions"><button class="btn primary lg" data-reveal>${zh2en() ? "先说出来，再看答案" : "看意思"} <span class="kbd">空格</span></button></div>`}
        </div></div>
        <div class="kbd-hint">${zh2en() ? "先试着把英文说出来（可以按 Ctrl+M 跟读评测），" : ""}空格看答案 · ${L} 记住了 · ${R} 没记住 · ↓ 有点模糊 · R 听发音 · Ctrl+Z 撤销</div>
      </div>`;
    bindWordClicks(container);
    const ub = $("[data-undo]", container);
    if (ub) ub.onclick = undo;
    const rv = $("[data-reveal]", container);
    if (rv) rv.onclick = reveal;
    $$("[data-g]", container).forEach((b) => (b.onclick = (e) => swipe(+b.dataset.g, e)));
    bindSwipeCard($("#fc", container), { busy: () => busy, onSwipe: swipe, onTap: () => { if (!revealed) reveal(); }, skip: "button, a, .w, .fc-back" });
  };
  const reveal = () => {
    if (busy || revealed) return;
    revealed = true;
    draw(false);
    TTS.speak(cur.en);
  };
  const swipe = async (g, evt) => {
    const card = $("#fc", container);
    if (busy || !card) return;
    busy = true;
    await flyCard(card, g);
    busy = false;
    if (signal.aborted) return;
    const h = { cur, q: [...q], stats: { ...stats }, retry: { ...retry }, done, xp: 0 };
    history.push(h);
    SentSRS.grade(cur, g);
    if (!retry[cur.en]) { stats[["unknown", "fuzzy", "known"][g]]++; addXP(1, undefined, evt); h.xp = 1; }
    if (g === 0 && !retry[cur.en]) { retry[cur.en] = 1; q.push(cur); } else done++;
    next();
  };
  const finish = () => {
    App.shadowTarget = null;
    renderNav();
    container.innerHTML = `<div class="flash-wrap"><div class="flash-progress">${STUDY_EXIT_BTN}</div><div class="card center fc-done" style="padding:40px">
        <div style="font-size:48px">🎉</div><h2 class="mt-s">复习完啦！</h2>
        <p class="muted">共 ${total} 条：记住了 ${stats.known} · 模糊 ${stats.fuzzy} · 没记住 ${stats.unknown}</p>
        <p class="small faint">没记住的明天还会出现；记住的会隔得越来越久再复习。</p>
        <div class="row" style="justify-content:center;margin-top:18px" data-finish-actions></div></div></div>`;
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };
  onKey(signal, (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); return; }
    if (!cur || busy) return;
    if (e.key === "r" || e.key === "R") TTS.speak(cur.en);
    else if (e.key === "ArrowLeft") { e.preventDefault(); swipe(K < 0 ? 2 : 0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); swipe(K < 0 ? 0 : 2); }
    else if (e.key === "ArrowDown") { e.preventDefault(); swipe(1); }
    else if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
  });
  next();
}
