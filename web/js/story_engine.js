// 剧情对话引擎：合租日记和人生剧场共用（台词一句一句出，选回答马上讲解，可以按 V 说出来）
// 台词基本格式见 data/sitcom.js 开头。另外支持：
//   { decide: "提示", id, opts: [{ en, zh, act, note, fx, then, key, req, reqText }] }
//        做什么：分叉，不打分。act = 这是个动作不是一句话；key = 学过这个单词才能选；req = 条件（由页面判断）
//   { if: "条件", then: [...], else: [...] }               看标记 / 属性走不同的台词
//   { mark: "名字" } …… { check: "名字", need: 4, label, pass: [...], fail: [...] }
//        关键时刻：统计 mark 之后「怎么说」的得分（地道 2 分、能懂 1 分），够 need 走 pass
//   { listen: [说话人, 英文, 中文], ask, opts: [[1, "选项", [接下来的台词]], [0, ...]], tip }
//        只听不看字的理解题，答完才显示原文
const STORY_SCORE = [
  { label: "💬 不太对", cls: "bad", fr: -2 },
  { label: "⭐ 能听懂", cls: "warn", fr: 2 },
  { label: "⭐⭐ 很地道", cls: "good", fr: 6 },
];

function storyAvatar(a) { return `img/avatars/${a}.svg`; }

// o: {
//   root, signal, scene: { title, zh, script, learn, bonus },
//   cast(sp) → { name, avatar, color, voice }     说话人
//   from                                          收藏到生词本时的来源
//   chip(k, v) → "💵 +$10" 或 null                数值变化的小标签（null 不显示）
//   sayFx(node, s) → { 人物: 好感 }               「怎么说」选完的影响
//   test(cond, delta) → bool                       if / req 条件
//   knows(word) → bool                             词汇钥匙
//   seen(id, i) → bool                             这个决定以前选过（人生树）
//   nodes: { rent(node, ctx) }                     页面自己的特殊节点
//   onFx(node), onFinish({ delta, score, picks }) → { ico, button, html }, onDone(), onExit(), exitText
// }
function storyStage(o) {
  const { root, signal, scene } = o;
  const P = Store.prefs;
  P.sc_zh ||= "click"; // 中文：always 一直显示 / click 点一下显示 / never 不显示
  const from = o.from || "人生剧场";
  const queue = [...scene.script];
  const delta = {};
  const score = { best: 0, total: 0, spoke: 0, heard: 0, listens: 0 };
  const marks = {}, picks = [];
  let waiting = null; // 当前在等什么："next" 点继续 / "choice" 选答案 / "end"
  let curLine = null, curChoice = null;
  const addFx = (fx) => { for (const [k, v] of Object.entries(fx || {})) delta[k] = typeof v === "number" ? (delta[k] || 0) + v : v; };
  addFx(scene.bonus);

  root.innerHTML = `<div class="sc-stage card">
      <div class="sc-stage-head"><b>${esc(scene.zh || scene.title)}</b><span class="small faint en">${esc(scene.title)}</span><span class="spacer"></span>
        <div class="tabs sc-zh-tabs">${[["always", "中文"], ["click", "点击看中文"], ["never", "纯英文"]].map(([k, l]) => `<button class="tab ${P.sc_zh === k ? "active" : ""}" data-zh="${k}">${l}</button>`).join("")}</div>
        <button class="btn sm ghost" id="sc-exit" title="离开这段对话">✕</button></div>
      <div class="sc-scene sc-zh-${P.sc_zh}" id="sc-scene"></div>
      <div class="sc-foot" id="sc-foot"></div>
      <div class="kbd-hint">空格 / Enter 继续 · 1–4 选回答 · V 说出来 · R 重听 · T 中文 · S 收藏这句 · Ctrl+M 跟读评测</div>
    </div>`;
  const sceneBox = $("#sc-scene", root), foot = $("#sc-foot", root);
  bindWordClicks(sceneBox);
  $$("[data-zh]", root).forEach((b) => (b.onclick = () => {
    P.sc_zh = b.dataset.zh;
    Store.save();
    $$("[data-zh]", root).forEach((x) => x.classList.toggle("active", x === b));
    sceneBox.className = `sc-scene sc-zh-${P.sc_zh}`;
  }));
  $("#sc-exit", root).onclick = async () => {
    if (waiting === "end" || await confirmBox("离开这段对话？", o.exitText || "这段对话的进度不会保存，也不会花掉时间。", "离开")) { TTS.stop(); Mic.cancel(); o.onExit(); }
  };
  sceneBox.addEventListener("click", (e) => { const z = e.target.closest(".sc-zh"); if (z) z.classList.add("show"); });

  const who = (sp) => (sp === "me" ? { name: "你", avatar: "", color: "var(--brand)", voice: "" } : o.cast(sp) || { name: sp, color: "#888" });
  const scroll = () => sceneBox.scrollTo({ top: sceneBox.scrollHeight, behavior: "smooth" });
  const say = (en, sp) => TTS.speak(en, undefined, who(sp)?.voice || undefined);
  const tools = (en, zh, sp) => `<div class="sc-tools"><button class="speak sm" data-sc-say="${esc(en)}" data-sp="${sp}" title="重听（R）">🔊</button><button class="speak sm" data-say="${esc(en)}" data-rate="0.6" title="慢速">🐢</button>${shadowBtn(en, { zh })}<button class="star ${inSentNb(en) ? "on" : ""}" data-star="${esc(en)}" data-zh-text="${esc(zh || "")}" title="收藏到生词本（S）">★</button></div>`;
  const ava = (sp) => (sp === "me" ? `<div class="sc-ava sc-ava-me">你</div>` : `<img class="sc-ava" src="${storyAvatar(who(sp).avatar)}" alt="">`);
  const lineHtml = (sp, en, zh) => {
    const c = who(sp);
    return `<div class="sc-line ${sp === "me" ? "me" : ""}">${ava(sp)}
      <div class="sc-bubble"><div class="sc-name" style="color:${c.color}">${esc(c.name)}</div>
        <div class="sc-en" data-text="${esc(en)}">${wrapWords(en)}</div>
        ${zh ? `<div class="sc-zh">${esc(zh)}</div>` : ""}${tools(en, zh, sp)}
      </div></div>`;
  };
  sceneBox.addEventListener("click", (e) => {
    const s = e.target.closest("[data-sc-say]");
    if (s) { e.stopPropagation(); say(s.dataset.scSay, s.dataset.sp); return; }
    const star = e.target.closest("[data-star]");
    if (star) star.classList.toggle("on", toggleSentNb({ en: star.dataset.star, zh: star.dataset.zhText, from }));
  });
  const fxChips = (fx) => Object.entries(fx).filter(([, v]) => typeof v === "number" && v).map(([k, v]) => {
    const t = o.chip(k, v);
    return t ? `<span class="sc-chip ${v > 0 ? "up" : "down"}">${esc(t)}</span>` : "";
  }).join("");
  const goOn = () => {
    waiting = "next";
    foot.innerHTML = `<button class="btn primary" id="sc-go">继续 <span class="kbd">空格</span></button>`;
    $("#sc-go", foot).onclick = step;
    scroll();
  };

  const step = () => {
    foot.innerHTML = "";
    const node = queue.shift();
    if (!node) return finish();
    if (Array.isArray(node)) {
      const [sp, a, b] = node;
      if (!sp) { // 旁白
        sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-narr">${esc(a)}</div>`);
      } else {
        sceneBox.insertAdjacentHTML("beforeend", lineHtml(sp, a, b));
        curLine = { en: a, zh: b, sp };
        App.shadowTarget = () => [{ en: a, zh: b, label: who(sp).name }];
        if (P.sc_voice !== false) say(a, sp);
      }
      return goOn();
    }
    for (const [k, h] of Object.entries(o.nodes || {})) if (node[k] !== undefined) return h(node, ctx);
    if (node.fx) {
      addFx(node.fx);
      o.onFx?.(node);
      const chips = fxChips(node.fx);
      if (node.note || chips) sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-note">📌 ${esc(node.note || "")} ${chips}</div>`);
      scroll();
      return step();
    }
    if (node.if !== undefined) {
      queue.unshift(...((o.test?.(node.if, delta) ? node.then : node.else) || []));
      return step();
    }
    if (node.mark) { marks[node.mark] = { pts: 0, max: 0 }; return step(); }
    if (node.check) return check(node);
    if (node.listen) return listen(node);
    if (node.decide) return decide(node);
    if (node.opts) return choice(node);
    step();
  };
  const ctx = { queue, delta, step, addFx, sceneBox };

  // ---------- 怎么说：三档回答 ----------
  const choice = (node) => {
    const opts = shuffle(node.opts.map(([s, en, zh, tip, then]) => ({ s, en, zh, tip, then: then || [] })));
    App.shadowTarget = () => opts.map((x, i) => ({ en: x.en, zh: x.zh, label: `回答 ${i + 1}` }));
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-choice">
      <div class="sc-ask">💭 ${esc(node.ask || "你怎么回答？")}</div>
      ${opts.map((x, i) => `<button class="sc-opt" data-i="${i}"><span class="kbd">${i + 1}</span><span class="sc-opt-text"><span class="en">${esc(x.en)}</span><span class="sc-zh">${esc(x.zh)}</span></span><span class="speak sm" data-sc-say="${esc(x.en)}" data-sp="me" title="听一听">🔊</span></button>`).join("")}
    </div>`);
    ask({ opts, speakable: true, pick: (i, spoken, box) => answer(node, opts, i, spoken, box) });
  };
  const ask = (c) => {
    curChoice = c;
    const box = sceneBox.lastElementChild;
    box.addEventListener("click", (e) => { const b = e.target.closest(".sc-opt"); if (b && !b.disabled && !e.target.closest("[data-sc-say]") && waiting === "choice") pickOpt(+b.dataset.i); });
    waiting = "choice";
    foot.innerHTML = c.speakable ? `<button class="btn soft" id="sc-say">🎤 说出来 <span class="kbd">V</span></button><span class="small muted" id="sc-heard">挑一个回答，或者把它说出来</span>`
      : `<span class="small muted">${esc(c.hint || "按数字键或点一下选择")}</span>`;
    if (c.speakable) $("#sc-say", foot).onclick = speak;
    scroll();
  };
  const pickOpt = (i, spoken = null) => {
    if (waiting !== "choice" || !curChoice.opts[i] || curChoice.opts[i].lock) return;
    waiting = "busy";
    Mic.cancel();
    const box = sceneBox.lastElementChild;
    $$(".sc-opt", box).forEach((b, k) => { b.disabled = true; b.classList.add(k === i ? "picked" : "dim"); });
    box.classList.add("answered");
    curChoice.pick(i, spoken, box);
  };
  const answer = (node, opts, i, spoken, box) => {
    const x = opts[i], best = opts.find((y) => y.s === 2);
    $$(".sc-opt", box).forEach((b, k) => { if (opts[k].s === 2) b.classList.add("best"); });
    score.total++;
    if (x.s === 2) score.best++;
    for (const m of Object.values(marks)) { m.pts += x.s; m.max += 2; }
    const fr = o.sayFx?.(node, x.s) || {};
    addFx(fr);
    let spokeHtml = "";
    if (spoken) {
      const good = spoken.sim >= 0.75;
      if (good) { score.spoke++; addXP(1); }
      spokeHtml = `<div class="small">🎤 你说的是：<span class="en">${esc(spoken.text)}</span> ${good ? "<b>· 说得很清楚 +1 XP</b>" : "· 有几个词没听清，再多练练"}</div>`;
    }
    sceneBox.insertAdjacentHTML("beforeend", lineHtml("me", x.en, x.zh)
      + `<div class="sc-fb ${STORY_SCORE[x.s].cls}"><div class="row" style="gap:8px"><b>${STORY_SCORE[x.s].label}</b>${fxChips(fr)}</div>
          <div class="small">${esc(x.tip)}</div>${spokeHtml}
          ${x.s < 2 ? `<div class="small mt-s">更地道的说法：<span class="en">${esc(best.en)}</span> <button class="speak sm" data-sc-say="${esc(best.en)}" data-sp="me">🔊</button>${shadowBtn(best.en, { zh: best.zh })}</div>` : ""}</div>`);
    if (x.s === 2) addXP(1);
    App.shadowTarget = () => [{ en: x.en, zh: x.zh, label: "你的回答" }, ...(x.s < 2 ? [{ en: best.en, zh: best.zh, label: "更地道" }] : [])];
    queue.unshift(...x.then);
    goOn();
  };

  // ---------- 做什么：分叉 ----------
  const decide = (node) => {
    const opts = node.opts.map((x, i) => {
      let lock = "";
      if (x.key && !o.knows?.(x.key)) lock = `🔒 在「单词」里学过 ${x.key} 就能选`;
      else if (x.req && !o.test?.(x.req, delta)) lock = `🔒 ${x.reqText || "条件还不够"}`;
      return { ...x, i, lock, speak: !x.act };
    });
    const shown = opts.filter((x) => !x.lock || x.key); // 条件不够的选项不显示，词汇钥匙显示出来鼓励去学
    App.shadowTarget = () => shown.filter((x) => !x.act && !x.lock).map((x) => ({ en: x.en, zh: x.zh, label: "选项" }));
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-choice sc-decide">
      <div class="sc-ask">🔀 <b>你的决定</b> · ${esc(node.decide)}</div>
      ${shown.map((x, k) => `<button class="sc-opt ${x.lock ? "locked" : ""}" data-i="${k}" ${x.lock ? "disabled" : ""}><span class="kbd">${x.lock ? "🔒" : k + 1}</span>
        <span class="sc-opt-text"><span class="en ${x.act ? "sc-act-text" : ""}">${esc(x.en)}</span><span class="sc-zh">${esc(x.zh)}</span>
          ${x.lock ? `<span class="small sc-lock">${esc(x.lock)}</span>` : x.note ? `<span class="small faint">${esc(x.note)}</span>` : ""}</span>
        ${o.seen?.(node.id, x.i) ? `<span class="badge" title="上一段人生选过这个">走过</span>` : ""}
        ${x.act ? "" : `<span class="speak sm" data-sc-say="${esc(x.en)}" data-sp="me" title="听一听">🔊</span>`}</button>`).join("")}
    </div>`);
    ask({ opts: shown, speakable: shown.some((x) => x.speak && !x.lock), pick: (k, spoken) => {
      const x = shown[k];
      picks.push([node.id, x.i]);
      if (spoken && spoken.sim >= 0.75) { score.spoke++; addXP(1); }
      sceneBox.insertAdjacentHTML("beforeend", x.act ? `<div class="sc-narr">（你${esc(x.zh.replace(/^你/, ""))}）</div>` : lineHtml("me", x.en, x.zh));
      addFx(x.fx);
      const chips = fxChips(x.fx || {});
      if (chips) sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-note">🔀 ${chips}</div>`);
      if (!x.act && P.sc_voice !== false) say(x.en, "me");
      queue.unshift(...(x.then || []));
      goOn();
    } });
  };

  // ---------- 只听不看字 ----------
  const listen = (node) => {
    const [sp, en, zh] = node.listen, c = who(sp);
    curLine = { en, zh, sp };
    App.shadowTarget = null;
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-line">${ava(sp)}
      <div class="sc-bubble"><div class="sc-name" style="color:${c.color}">${esc(c.name)}</div>
        <div class="sc-listen">🎧 只听，不看字 <button class="btn sm soft" data-sc-say="${esc(en)}" data-sp="${sp}">🔊 再听一遍 <span class="kbd">R</span></button><button class="btn sm ghost" data-say="${esc(en)}" data-rate="0.7">🐢 慢速</button></div>
        <div class="sc-reveal" hidden><div class="sc-en" data-text="${esc(en)}">${wrapWords(en)}</div><div class="sc-zh">${esc(zh)}</div>${tools(en, zh, sp)}</div>
      </div></div>`);
    const bubble = sceneBox.lastElementChild;
    say(en, sp);
    const opts = shuffle(node.opts.map(([ok, text, then]) => ({ ok, text, then: then || [] })));
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-choice">
      <div class="sc-ask">🎧 ${esc(node.ask || "你听到了什么？")}</div>
      ${opts.map((x, i) => `<button class="sc-opt" data-i="${i}"><span class="kbd">${i + 1}</span><span class="sc-opt-text">${esc(x.text)}</span></button>`).join("")}
    </div>`);
    ask({ opts, hint: "听不清可以按 R 再听，或者点 🐢 慢速", pick: (i, _s, box) => {
      const x = opts[i];
      score.listens++;
      if (x.ok) { score.heard++; addXP(1); }
      $$(".sc-opt", box).forEach((b, k) => { if (opts[k].ok) b.classList.add("best"); });
      $(".sc-listen", bubble).remove();
      $(".sc-reveal", bubble).hidden = false;
      App.shadowTarget = () => [{ en, zh, label: c.name }];
      sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-fb ${x.ok ? "good" : "bad"}"><b>${x.ok ? "✅ 听懂了" : "❌ 没听对"}</b>${x.ok ? "" : ` · 正确的是：${esc(opts.find((y) => y.ok).text)}`}
        ${node.tip ? `<div class="small">${esc(node.tip)}</div>` : ""}</div>`);
      queue.unshift(...x.then);
      goOn();
    } });
  };

  // ---------- 关键时刻 ----------
  const check = (node) => {
    const m = marks[node.check] || { pts: 0, max: 0 };
    const pass = m.pts >= node.need;
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-check ${pass ? "good" : "bad"}">🎯 ${esc(node.label || "关键时刻")}：${m.pts} / ${m.max} 分 · <b>${pass ? "过关了" : "没过关"}</b>
      <span class="small muted">（需要 ${node.need} 分，地道的回答 2 分、能听懂 1 分）</span></div>`);
    queue.unshift(...((pass ? node.pass : node.fail) || []));
    step();
  };

  // 把回答说出来：识别后和选项比，挑最像的那个
  const speak = async () => {
    if (waiting !== "choice" || !curChoice.speakable) return;
    const heard = $("#sc-heard", foot), btn = $("#sc-say", foot);
    if (Mic.active) { btn.disabled = true; return finishSpeak(); }
    if (!(await Stt.ready())) return;
    if (!navigator.mediaDevices?.getUserMedia) return micUnavailable();
    TTS.stop();
    try {
      await Mic.start({ onSilence: () => finishSpeak(), silenceMs: 1300, maxMs: 15000 });
    } catch (e) { toast(`打不开麦克风：${e.message || e}`, "bad", 4000); return; }
    btn.innerHTML = `<span class="rec-dot"></span> 说完了 <span class="kbd">V</span>`;
    heard.textContent = "在听……说完停一下会自动结束";
  };
  const finishSpeak = async () => {
    if (!Mic.active) return;
    const heard = $("#sc-heard", foot), btn = $("#sc-say", foot);
    const rec = await Mic.stop();
    if (btn) { btn.innerHTML = `🎤 说出来 <span class="kbd">V</span>`; btn.disabled = false; }
    if (!rec?.heard) { if (heard) heard.textContent = "没听到声音，再试一次"; return; }
    if (heard) heard.textContent = "正在识别…";
    const text = await Stt.transcribe(rec.pcm);
    if (waiting !== "choice" || !heard?.isConnected) return;
    if (!text) { heard.textContent = "没听清，再说一次吧"; return; }
    const sims = curChoice.opts.map((x) => (x.lock || x.act ? 0 : textSim(x.en, text)));
    const k = sims.indexOf(Math.max(...sims));
    if (sims[k] < 0.45) { heard.innerHTML = `听到：<span class="en">${esc(text)}</span> · 和哪个回答都不太像，再试一次或者按数字键选`; return; }
    pickOpt(k, { text, sim: sims[k] });
  };

  const finish = () => {
    waiting = "end";
    App.shadowTarget = null;
    const r = o.onFinish({ delta, score, picks }) || {};
    const chips = fxChips(delta);
    const learn = scene.learn || [];
    sceneBox.insertAdjacentHTML("beforeend", `<div class="sc-end">
      <div class="center"><div style="font-size:34px">${r.ico || "✨"}</div><b>${esc(scene.zh || scene.title)} · 完</b>
        ${score.total || score.listens ? `<div class="small muted">${[score.total ? `最地道的回答 ${score.best} / ${score.total}` : "", score.listens ? `听懂 ${score.heard} / ${score.listens}` : "", score.spoke ? `开口说对 ${score.spoke} 次` : ""].filter(Boolean).join(" · ")}</div>` : ""}
        ${chips ? `<div class="mt-s">${chips}</div>` : ""}${r.html || ""}</div>
      ${learn.length ? `<div class="sc-learn"><div class="small muted">📒 这段学到的表达（点 ★ 收进生词本）</div>
        ${learn.map(([en, zh, note]) => `<div class="sc-learn-row"><span class="en">${esc(en)}</span><span class="muted">${esc(zh)}</span>${note ? `<span class="small faint">${esc(note)}</span>` : ""}<span class="spacer"></span><button class="speak sm" data-say="${esc(en.replace(/\.\.\./g, ""))}">🔊</button><button class="star ${inSentNb(en) ? "on" : ""}" data-star="${esc(en)}" data-zh-text="${esc(zh)}">★</button></div>`).join("")}</div>` : ""}
    </div>`);
    foot.innerHTML = `<button class="btn primary" id="sc-go">${esc(r.button || "继续")} <span class="kbd">Enter</span></button>`;
    $("#sc-go", foot).onclick = () => o.onDone();
    scroll();
  };

  onKey(signal, (e) => {
    const k = e.key.toLowerCase();
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (waiting === "next") step();
      else if (waiting === "end") o.onDone();
    } else if (/^[1-4]$/.test(e.key) && waiting === "choice") pickOpt(+e.key - 1);
    else if (k === "v" && !e.ctrlKey && waiting === "choice") speak();
    else if (k === "r" && curLine) say(curLine.en, curLine.sp);
    else if (k === "t") $$(".sc-zh", sceneBox).slice(-4).forEach((z) => z.classList.toggle("show"));
    else if (k === "s" && curLine) { toggleSentNb({ en: curLine.en, zh: curLine.zh, from }); $$(`[data-star]`, sceneBox).forEach((b) => b.classList.toggle("on", inSentNb(b.dataset.star))); }
  });
  signal.addEventListener("abort", () => Mic.cancel());
  step();
}

// 两句英文有多像（按词，0~1）：用来判断「说出来」的是哪个回答
function textSim(a, b) {
  const A = pronNorm(a), B = pronNorm(b);
  if (!A.length || !B.length) return 0;
  const { common } = lcsMatch(A, B);
  return (2 * common) / (A.length + B.length);
}
