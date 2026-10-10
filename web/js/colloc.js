// ============================================================
// 常见搭配：单词卡片上显示这个词的常见搭配；「单词 → 练习 → 搭配」做选择题（数据在 data/collocations.js）
// 做错的搭配收进薄弱点本（短语类）
// ============================================================
const Colloc = {
  _all: null,
  all() {
    if (this._all) return this._all;
    const out = [];
    for (const [g, grp] of Object.entries(window.COLLOCATIONS || {})) {
      for (const line of grp.items.split("\n")) {
        const [pat, ans, wrong, zh, note] = line.split("|").map((s) => (s || "").trim());
        if (!pat || !ans || !wrong) continue;
        out.push({ g, pat, ans, wrong: wrong.split(",").map((s) => s.trim()).filter(Boolean), zh, note: note || "", full: pat.replace("___", ans) });
      }
    }
    return (this._all = out);
  },
  // 搭配里出现了这个词（整个词匹配，也认原形：mistakes → mistake）
  forWord(w) {
    const k = String(w || "").toLowerCase();
    if (!k || k.length < 2) return [];
    const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return this.all().filter((c) => re.test(c.full));
  },
};

// 单词卡片背面：🔗 常见搭配（顺便提醒不能怎么说）
function collocHtml(w) {
  const list = Colloc.forWord(w).slice(0, 3);
  if (!list.length) return "";
  return `<div class="fc-extra"><b>🔗 常见搭配</b>${list.map((c) => `<div><span class="en">${esc(c.full)}</span> <span class="muted">${esc(c.zh)}</span>
    <span class="small faint">（不说 ${c.wrong.map((x) => esc(c.pat.replace("___", x))).slice(0, 1).join("")}）</span></div>`).join("")}</div>`;
}

// 练习：10 道搭配选择题。group 为空时三类混在一起
function runCollocQuiz(box, pageSignal, { group = "", onDone } = {}) {
  const signal = freshSignal(runCollocQuiz, pageSignal);
  const pool = Colloc.all().filter((c) => !group || c.g === group);
  const qs = sample(pool, Math.min(10, pool.length));
  const session = Session.start();
  let i = 0, right = 0;
  const wrongs = [];
  const show = () => {
    if (i >= qs.length) return finish();
    const c = qs[i], opts = shuffle([c.ans, ...c.wrong]);
    box.innerHTML = `<div class="card colloc-card" style="max-width:640px;margin:0 auto">
      <div class="row small muted"><span>${esc(COLLOCATIONS[c.g].title)}</span><span class="spacer"></span><span>${i + 1} / ${qs.length}</span></div>
      <div class="bar mt-s"><i style="width:${(i / qs.length) * 100}%"></i></div>
      <div class="colloc-zh">${esc(c.zh)}</div>
      <div class="colloc-pat en">${esc(c.pat).replace("___", `<span class="colloc-blank">______</span>`)}</div>
      <div id="cq"></div>
      <div class="row mt hidden" id="after"><span class="spacer"></span><button class="btn primary" id="nx">${i + 1 < qs.length ? "下一题" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
    renderChoice($("#cq", box), { q: "", o: opts, a: opts.indexOf(c.ans), e: `${c.full}${c.note ? "：" + c.note : ""}` }, {
      onAnswer: (ok, evt) => {
        if (ok) { right++; addXP(1, null, evt); }
        else { wrongs.push(c); Weak.add("phrase", c.full, { en: c.full, zh: c.zh, note: `不说 ${c.wrong.map((x) => c.pat.replace("___", x)).join(" / ")}${c.note ? "。" + c.note : ""}`, src: "搭配练习" }); }
        $(".colloc-blank", box).textContent = c.ans;
        $(".colloc-blank", box).classList.add(ok ? "ok" : "bad");
        $("#after", box).classList.remove("hidden");
        TTS.speak(c.full);
      },
    });
    $("#nx", box).onclick = () => { i++; show(); };
  };
  const finish = () => {
    bump("c_colloc");
    box.innerHTML = Session.finishHtml(session, {
      emoji: right === qs.length ? "🏅" : "🔗", title: "搭配练习完成！", exit: false,
      lines: `答对 ${right} / ${qs.length}`,
      note: wrongs.length ? `答错的 ${wrongs.length} 个搭配已收进薄弱点本：${wrongs.map((c) => esc(c.full)).join("、")}` : "全对！这些搭配已经很熟了。",
    });
    $("[data-finish-actions]", box).innerHTML = `<button class="btn primary" data-again>再来 10 题</button>`;
    $("[data-again]", box).onclick = () => runCollocQuiz(box, pageSignal, { group, onDone });
    onDone && onDone(right, qs.length);
  };
  onKey(signal, (e) => {
    if (["1", "2", "3"].includes(e.key)) { const b = $$(".option", box)[+e.key - 1]; if (b && !b.disabled) b.click(); }
    else if (e.key === "Enter" && $("#nx", box) && !$("#after", box).classList.contains("hidden")) $("#nx", box).click();
  });
  show();
}
