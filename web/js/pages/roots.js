// 单词 · 词根词缀：常用前缀、后缀、词根，每个配例词拆分；「拆词猜义」小测；单词卡片背面显示构词拆分
// 路由：#/words/roots[/prefix|suffix|root]；数据在 data/morphology.js
// 例词 → 它所在的词缀 / 词根（同一个词可能出现在好几处，取第一个）
const MORPH_INDEX = (() => {
  const idx = {};
  (window.MORPH || []).forEach((g) => g.items.forEach((it) => it.ex.forEach(([w, parts, zh]) => {
    (idx[w.toLowerCase()] ||= { parts, zh, items: [] }).items.push({ p: it.p, m: it.m, group: g.group });
  })));
  return idx;
})();

// 单词卡片、词库里用：这个词能拆的话返回一行说明
function morphHtml(w) {
  const x = MORPH_INDEX[(w || "").toLowerCase()];
  if (!x) return "";
  const why = x.items.map((i) => `<b>${esc(i.p)}</b> ${esc(i.m)}`).join("；");
  return `<div class="fc-extra fc-morph"><b>🧩 构词</b><div><span class="en">${esc(x.parts.replace(/\+/g, " + "))}</span> <span class="muted small">（${why}）</span></div></div>`;
}

App.pages.words.roots = function (body, signal, sub) {
  const M = Store.data.morph ||= { seen: {}, best: 0 };
  const group = ["prefix", "suffix", "root"].includes(sub) ? sub : "prefix";
  const G = MORPH.find((g) => g.group === group);
  const total = MORPH.reduce((n, g) => n + g.items.length, 0);
  body.innerHTML = `
    <div class="card" style="margin-bottom:14px"><div class="row" style="gap:12px;flex-wrap:wrap">
      <div style="flex:1;min-width:260px"><b>🧩 用词根词缀记单词</b>
        <div class="small muted">把长单词拆开：<span class="en">in + spect + ion</span> = 往里 + 看 + 名词 → 检查。研究发现，学会常见的词缀和词根比死记翻译记得更牢，还能猜出没见过的词。
        英语里最常用的 20 个前缀，覆盖了约 97% 带前缀的单词。</div>
        <div class="small faint mt-s">看过 ${Object.keys(M.seen).length} / ${total} 个 · 小测最好成绩 ${M.best ? Math.round(M.best * 100) + "%" : "还没做过"}</div></div>
      <button class="btn primary" id="mq">🎯 拆词猜义小测</button></div></div>
    <div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">
      <div class="chips">${MORPH.map((g) => `<button class="chip ${g.group === group ? "active" : ""}" data-g="${g.group}">${esc(g.title)} (${g.items.length})</button>`).join("")}</div>
      <span class="small muted">${esc(G.sub)}</span></div>
    <div class="morph-grid">${G.items.map((it, i) => `<button class="card morph-card ${M.seen[it.p] ? "seen" : ""}" data-i="${i}">
        <div class="row" style="gap:8px"><span class="morph-p">${esc(it.p)}</span>${it.t ? `<span class="badge brand">${esc(it.t)}</span>` : ""}<span class="spacer"></span><span class="small faint">${esc(it.o || "")}</span></div>
        <div class="morph-m">${esc(it.m)}</div>
        <div class="small muted en">${it.ex.slice(0, 3).map((e) => esc(e[0])).join(" · ")}</div></button>`).join("")}</div>`;
  $$("[data-g]", body).forEach((b) => (b.onclick = () => Router.go("words/roots/" + b.dataset.g)));
  $(".morph-grid", body).onclick = (e) => {
    const c = e.target.closest("[data-i]");
    if (!c) return;
    const it = G.items[+c.dataset.i];
    morphModal(it);
    if (!M.seen[it.p]) { M.seen[it.p] = today(); Store.save(); c.classList.add("seen"); }
  };
  $("#mq", body).onclick = () => morphQuiz(body, signal);
};

function morphModal(it) {
  const inBook = (w) => !!WORD_MAP[w.toLowerCase()];
  const m = modal(`<div class="row"><span class="morph-p" style="font-size:28px">${esc(it.p)}</span>${it.t ? `<span class="badge brand">${esc(it.t)}</span>` : ""}<span class="spacer"></span><button class="btn sm ghost" data-close>✕</button></div>
    <div class="morph-m" style="font-size:18px">${esc(it.m)}</div>
    <div class="small faint">来自${esc(it.o || "")}${it.note ? ` · ${esc(it.note)}` : ""}</div>
    <div class="morph-ex">${it.ex.map(([w, parts, zh]) => `<div class="morph-ex-row">
      <button class="morph-w en" data-look="${esc(w)}">${esc(w)}</button>
      <span class="morph-parts">${parts.split("+").map((p) => `<span class="morph-part">${esc(p)}</span>`).join('<span class="faint">+</span>')}</span>
      <span class="muted">${esc(zh)}</span>${inBook(w) ? `<span class="badge" title="你的词书里有这个词">词书</span>` : ""}
      <span class="spacer"></span>${speakBtn(w, "sm")}</div>`).join("")}</div>
    <p class="small faint mt-s">点单词看详细释义。拆分是为了帮助记忆，有些词的来历比这里写的更复杂。</p>`);
  m.root.querySelector(".modal").style.maxWidth = "600px";
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-look]"); if (b) showWordPopup(b.dataset.look, b); });
}

// 两种题：看拆分猜整个词的意思；看词缀选意思
function morphQuiz(body, signal) {
  const all = MORPH.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group })));
  const words = all.flatMap((it) => it.ex.map(([w, parts, zh]) => ({ w, parts, zh, it })));
  const N = 10;
  const qs = Array.from({ length: N }, (_, i) => {
    if (i % 3 === 2) {
      const it = pick(all);
      return { kind: "affix", it, a: it.m, o: shuffle([it.m, ...sample([...new Set(all.filter((x) => x.m !== it.m).map((x) => x.m))], 3)]) };
    }
    const x = pick(words);
    return { kind: "word", x, a: x.zh, o: shuffle([x.zh, ...sample([...new Set(words.filter((y) => y.zh !== x.zh).map((y) => y.zh))], 3)]) };
  });
  let i = 0, right = 0;
  const back = () => Router.render();
  const draw = () => {
    if (i >= N) {
      const M = Store.data.morph;
      M.best = Math.max(M.best || 0, right / N);
      Store.save();
      addXP(2 + right);
      body.innerHTML = `<div class="card center" style="padding:30px"><div style="font-size:44px">🧩</div><h3>答对 ${right} / ${N}</h3>
        <p class="muted">${right >= 8 ? "拆词高手！以后遇到长单词先拆一拆。" : "多看几遍词缀卡片，再来一次会更好。"}</p>
        <div class="row" style="justify-content:center"><button class="btn primary" id="again">再来一次</button><button class="btn" id="bk">返回</button></div></div>`;
      $("#again", body).onclick = () => morphQuiz(body, signal);
      $("#bk", body).onclick = back;
      return;
    }
    const q = qs[i];
    const head = q.kind === "word"
      ? `<div class="small muted">🧩 拆开看看，猜猜这个词的意思</div><div class="morph-quiz-w en">${esc(q.x.w)}</div>
         <div class="morph-parts center">${q.x.parts.split("+").map((p) => `<span class="morph-part">${esc(p)}</span>`).join('<span class="faint">+</span>')}</div>
         <div class="small faint center">提示：${esc(q.x.it.p)} = ${esc(q.x.it.m)}</div>`
      : `<div class="small muted">🔤 这个${q.it.group === "prefix" ? "前缀" : q.it.group === "suffix" ? "后缀" : "词根"}是什么意思？</div><div class="morph-quiz-w en">${esc(q.it.p)}</div>
         <div class="small faint center">例如：${esc(q.it.ex.slice(0, 2).map((e) => e[0]).join("、"))}</div>`;
    body.innerHTML = `<div class="flash-wrap"><div class="flash-progress"><span>${i + 1} / ${N}</span><div class="bar"><i style="width:${(i / N) * 100}%"></i></div><span>拆词猜义</span></div>
      <div class="card" style="padding:28px">${head}<div class="options mt">${q.o.map((o, j) => `<button class="option" data-j="${j}"><span class="letter">${j + 1}</span><span>${esc(o)}</span></button>`).join("")}</div><div id="ex"></div></div>
      <div class="kbd-hint">1–4 选择 · Enter 下一题</div></div>`;
    if (q.kind === "word") TTS.speak(q.x.w);
    $$(".option", body).forEach((b) => (b.onclick = () => answer(+b.dataset.j)));
  };
  let answered = false;
  const answer = (j) => {
    if (answered) return;
    answered = true;
    const q = qs[i], ok = q.o[j] === q.a;
    if (ok) right++;
    $$(".option", body).forEach((b, k) => { b.disabled = true; if (q.o[k] === q.a) b.classList.add("right"); else if (k === j) b.classList.add("wrong"); });
    $("#ex", body).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 对了！" : "❌ 正确答案已标出。"}
      ${q.kind === "word" ? `<span class="en">${esc(q.x.w)}</span> = ${esc(q.x.parts.replace(/\+/g, " + "))} → ${esc(q.x.zh)}` : `${esc(q.it.p)}：${esc(q.it.m)}，比如 ${esc(q.it.ex.slice(0, 3).map((e) => `${e[0]}（${e[2]}）`).join("、"))}`}
      <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary sm" id="nx">${i + 1 < N ? "下一题" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
    $("#nx", body).onclick = () => { i++; answered = false; draw(); };
  };
  onKey(freshSignal(morphQuiz, signal), (e) => {
    if (i >= N) return;
    if (!answered && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
    else if (answered && e.key === "Enter") { e.preventDefault(); i++; answered = false; draw(); }
  });
  draw();
}
