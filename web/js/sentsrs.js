// ============================================================
// 短语和句子的间隔复习：短语课学过的短语 + 生词本里的短语和句子，按记忆曲线安排复习
// 复习卡片：看中文说英文（没有中文的看英文想意思），← 记住了 / → 没记住 / ↓ 有点模糊，和单词卡片一样可以拖动
// 进度存在 Store.data.sent_srs：{ 规范化的英文: {en, zh, src, box, due, seen, wrong, first} }
// ============================================================

// 拖动卡片：超过 110px 松手就滑走，不到就弹回；没怎么动当作点击。skip 里的元素不能拖（要能选中文字）
function bindSwipeCard(card, { busy, onSwipe, onTap, skip = "button, a, .w" }) {
  let x0 = null, dx = 0, moved = false;
  const stamps = () => [$(".fc-stamp.ok", card), $(".fc-stamp.no", card)];
  card.addEventListener("pointerdown", (e) => {
    if (busy() || e.button !== 0 || e.target.closest(skip)) return;
    x0 = e.clientX; dx = 0; moved = false;
    card.setPointerCapture(e.pointerId);
    card.classList.add("dragging");
  });
  card.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 6) moved = true;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const [ok, no] = stamps();
    if (ok) ok.style.opacity = Math.min(1, Math.max(0, -dx / 110));
    if (no) no.style.opacity = Math.min(1, Math.max(0, dx / 110));
  });
  const end = (e) => {
    if (x0 === null) return;
    x0 = null;
    if (dx < -110) return onSwipe(2, e);
    if (dx > 110) return onSwipe(0, e);
    card.classList.remove("dragging");
    card.style.transform = "";
    stamps().forEach((s) => s && (s.style.opacity = 0));
    if (!moved) onTap?.();
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
}
// 卡片飞出去：记住了往左，没记住往右，模糊往下。返回动画结束的 Promise
function flyCard(card, g) {
  const dir = g === 2 ? -1 : g === 0 ? 1 : 0;
  card.classList.remove("dragging");
  card.classList.add("fly");
  const st = dir && $(`.fc-stamp.${dir < 0 ? "ok" : "no"}`, card);
  if (st) st.style.opacity = 1;
  card.style.transform = dir ? `translateX(${dir * 130}%) rotate(${dir * 24}deg)` : "translateY(40%) scale(.85)";
  card.style.opacity = 0;
  if (typeof Sfx !== "undefined") {
    if (g === 2) Sfx.good();
    else if (g === 1) Sfx.ok();
    else Sfx.play([[330, 0.14, "sine", 0.05], [262, 0.18, "sine", 0.04, 0.08]]);
  }
  return new Promise((r) => setTimeout(r, 260));
}

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
    x.seen++;
    x.t = Date.now();
    if (g === 0) { x.box = 0; x.wrong++; }
    else if (g === 1) x.box = Math.max(1, x.box - 1);
    else x.box = Math.min(x.box + 1, SRS_INTERVALS.length - 1);
    x.due = addDays(today(), g === 1 ? 1 : SRS_INTERVALS[x.box] || 1);
    Store.save();
  },
};

// 复习卡片
function runSentenceCards(container, queue, signal, onFinish) {
  const total = queue.length, q = [...queue], retry = {};
  const stats = { known: 0, fuzzy: 0, unknown: 0 };
  let cur = null, revealed = false, done = 0, busy = false;
  const zh2en = () => !!cur.zh;

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
        <div class="flash-progress"><span>${done} / ${total}</span><div class="bar"><i style="width:${pct}%"></i></div><span>短语句子复习</span></div>
        <div class="fc-stack ${enter ? "enter" : ""} ${q.length ? "" : "last"}">
        <div class="card flashcard sent-card" id="fc">
          <div class="fc-stamp ok">记住了 ✓</div><div class="fc-stamp no">没记住 ✗</div>
          <div class="fc-top"><span class="fc-tag">${esc(cur.src || "")}${cur.box ? ` · 第 ${cur.seen + 1} 次复习` : ""}</span></div>
          ${front}
          ${revealed ? back + `<div class="fc-actions">
              <button class="btn good lg" data-g="2">← 记住了</button>
              <button class="btn warn lg" data-g="1">有点模糊 <span class="kbd">↓</span></button>
              <button class="btn bad lg" data-g="0">没记住 →</button></div>`
            : `<div class="fc-actions"><button class="btn primary lg" data-reveal>${zh2en() ? "先说出来，再看答案" : "看意思"} <span class="kbd">空格</span></button></div>`}
        </div></div>
        <div class="kbd-hint">${zh2en() ? "先试着把英文说出来（可以按 Ctrl+M 跟读评测），" : ""}空格看答案 · ← 记住了 · → 没记住 · ↓ 有点模糊 · R 听发音</div>
      </div>`;
    bindWordClicks(container);
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
    SentSRS.grade(cur, g);
    if (!retry[cur.en]) { stats[["unknown", "fuzzy", "known"][g]]++; addXP(1, undefined, evt); }
    if (g === 0 && !retry[cur.en]) { retry[cur.en] = 1; q.push(cur); } else done++;
    next();
  };
  const finish = () => {
    App.shadowTarget = null;
    renderNav();
    container.innerHTML = `<div class="flash-wrap"><div class="card center" style="padding:40px">
        <div style="font-size:48px">🎉</div><h2 class="mt-s">复习完啦！</h2>
        <p class="muted">共 ${total} 条：记住了 ${stats.known} · 模糊 ${stats.fuzzy} · 没记住 ${stats.unknown}</p>
        <p class="small faint">没记住的明天还会出现；记住的会隔得越来越久再复习。</p>
        <div class="row" style="justify-content:center;margin-top:18px" data-finish-actions></div></div></div>`;
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };
  onKey(signal, (e) => {
    if (!cur || busy) return;
    if (e.key === "r" || e.key === "R") TTS.speak(cur.en);
    else if (e.key === "ArrowLeft") { e.preventDefault(); swipe(2); }
    else if (e.key === "ArrowRight") { e.preventDefault(); swipe(0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); swipe(1); }
    else if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
  });
  next();
}
