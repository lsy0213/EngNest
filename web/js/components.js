// ============================================================
// 通用组件：弹窗、查词浮层、选择题、单词卡片、AI 未开启提示
// ============================================================

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function pageHead(title, sub = "", right = "") {
  return `<div class="page-head"><div><div class="page-title">${title}</div>${sub ? `<div class="page-sub">${sub}</div>` : ""}</div>${right}</div>`;
}

function speakBtn(text, cls = "") {
  return `<button class="speak ${cls}" data-say="${esc(text)}" title="朗读">🔊</button>`;
}
// 全局：任何带 data-say 的按钮点一下就朗读
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-say]");
  if (b) { e.stopPropagation(); TTS.speak(b.dataset.say, b.dataset.rate ? +b.dataset.rate : undefined); }
});

function tabsHtml(items, active) {
  return `<div class="tabs">${items.map(([id, label]) => `<button class="tab ${id === active ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}</div>`;
}

// ---------- 弹窗 ----------
function modal(html, { onClose } = {}) {
  const mask = el(`<div class="modal-mask"><div class="modal">${html}</div></div>`);
  const close = () => { mask.remove(); document.removeEventListener("keydown", esc_); onClose && onClose(); };
  const esc_ = (e) => { if (e.key === "Escape") close(); };
  mask.addEventListener("click", (e) => { if (e.target === mask || e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", esc_);
  document.body.appendChild(mask);
  return { root: mask, close };
}
function confirmBox(title, text, okText = "确定", danger = false) {
  return new Promise((resolve) => {
    let ok = false;
    const m = modal(`<h3>${title}</h3><div class="muted">${text}</div>
      <div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn ${danger ? "bad" : "primary"}" data-ok>${okText}</button></div>`,
      { onClose: () => resolve(ok) });
    $("[data-ok]", m.root).onclick = () => { ok = true; m.close(); };
  });
}

// ---------- AI 未开启 ----------
// ---------- 录音（给离线语音识别用）----------
// start() 开始录；onSilence：说过话之后安静了 silenceMs 就回调（自动模式用）；stop() 返回 16 kHz 单声道 16 位 PCM 的 base64
const Mic = {
  ctx: null,
  get active() { return !!this.ctx; },
  async start({ onLevel, onSilence, silenceMs = 1300, maxMs = 30000 } = {}) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.proc = this.ctx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.heard = false;
    const t0 = performance.now();
    let lastLoud = t0;
    this.proc.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(d));
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] * d[i];
      const rms = Math.sqrt(s / (d.length / 4));
      onLevel?.(rms);
      const now = performance.now();
      if (rms > 0.02) { this.heard = true; lastLoud = now; }
      if (onSilence && ((this.heard && now - lastLoud > silenceMs) || now - t0 > maxMs)) { const f = onSilence; onSilence = null; f(); }
    };
    src.connect(this.proc);
    this.proc.connect(this.ctx.destination);
  },
  async stop() {
    if (!this.ctx) return null;
    this.proc.disconnect();
    this.stream.getTracks().forEach((t) => t.stop());
    const rate = this.ctx.sampleRate;
    await this.ctx.close();
    this.ctx = null;
    const len = this.chunks.reduce((n, c) => n + c.length, 0), all = new Float32Array(len);
    let o = 0;
    for (const c of this.chunks) { all.set(c, o); o += c.length; }
    // 降采样到 16 kHz：每个输出点取对应区间的平均值（简单的低通，避免混叠）
    const ratio = rate / 16000, out = new Int16Array(Math.floor(len / ratio));
    for (let i = 0; i < out.length; i++) {
      const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio));
      let s = 0;
      for (let j = a; j < b; j++) s += all[j];
      out[i] = Math.max(-1, Math.min(1, s / (b - a))) * 0x7fff;
    }
    const bytes = new Uint8Array(out.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { pcm: btoa(bin), heard: this.heard, seconds: len / rate, wav: () => pcmWav(bytes) };
  },
  cancel() { if (this.ctx) this.stop(); },
};
// 16 kHz 单声道 16 位 PCM → 可以直接播放的 WAV
function pcmWav(bytes) {
  const h = new DataView(new ArrayBuffer(44));
  const str = (o, s) => [...s].forEach((c, i) => h.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); h.setUint32(4, 36 + bytes.length, true); str(8, "WAVE");
  str(12, "fmt "); h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true);
  h.setUint32(24, 16000, true); h.setUint32(28, 32000, true); h.setUint16(32, 2, true); h.setUint16(34, 16, true);
  str(36, "data"); h.setUint32(40, bytes.length, true);
  return new Blob([h.buffer, bytes], { type: "audio/wav" });
}

// 离线语音识别：录好的音频 → 英文。模型没下载时弹窗引导下载
const Stt = {
  status: null,
  async ready() {
    if (!Store.bridge || Store.remote) { toast("语音输入只能在电脑上使用，可以先打字"); return false; }
    this.status = await pywebview.api.stt_status();
    if (!this.status.available) { toast("这个版本没有带语音识别组件，可以先打字", "bad", 4000); return false; }
    if (this.status.model) return true;
    return this.askDownload();
  },
  askDownload() {
    return new Promise((resolve) => {
      const m = modal(`<h3>🎙️ 下载语音识别模型</h3>
        <p class="muted">「点击说话」用的是离线语音识别（Whisper 英语模型），只在你的电脑上运行，不联网、不花钱。第一次使用需要下载模型（约 145 MB）。</p>
        <div id="stt-dl"></div>
        <div class="modal-actions"><button class="btn" data-close>以后再说</button><button class="btn primary" id="stt-go">下载</button></div>`, { onClose: () => resolve(!!this.status?.model) });
      $("#stt-go", m.root).onclick = async () => {
        $("#stt-go", m.root).disabled = true;
        await pywebview.api.stt_download();
        const poll = async () => {
          const s = (this.status = await pywebview.api.stt_status());
          if (!m.root.isConnected) return;
          $("#stt-dl", m.root).innerHTML = s.stage === "error" ? `<div class="explain bad">下载失败：${esc(s.error)}</div>`
            : `<div class="small">${s.model ? "下载完成 🎉" : `下载中 ${Math.round(s.progress * 100)}%`}</div><div class="bar mt-s"><i style="width:${s.progress * 100}%"></i></div>`;
          if (s.model) { toast("语音识别已就绪，可以开口说了", "good"); m.close(); }
          else if (s.running) setTimeout(poll, 700);
          else $("#stt-go", m.root).disabled = false;
        };
        poll();
      };
    });
  },
  async transcribe(pcm) {
    const r = await pywebview.api.stt_transcribe(pcm);
    if (!r.ok) toast(r.error, "bad", 4000);
    return r.ok ? r.text : "";
  },
};

// ---------- 朗读控制条 ----------
// 逐段朗读 reader 里的 .para：暂停 / 继续、上一段 / 下一段、调速、关闭（空格键也能暂停）。朗读时点某段的 🔊 就从那段接着读
const READ_RATES = [[0.7, "慢速"], [0.85, "稍慢"], [1, "正常"], [1.15, "稍快"]];
function readAloud(reader, btn, signal, startAt = () => 0) {
  const P = Store.prefs, label = btn.textContent;
  const rate = () => P.read_rate ?? P.tts_rate;
  const bar = el(`<div class="readbar hidden">
    <span class="readbar-state"><span class="rb-dot"></span><span class="rb-pos"></span></span>
    <button class="btn sm ghost" data-rb="prev" title="上一段">⏮</button>
    <button class="btn sm primary" data-rb="toggle" title="暂停 / 继续（空格键）">⏸ 暂停</button>
    <button class="btn sm ghost" data-rb="next" title="下一段">⏭</button>
    <select class="select" data-rb="rate" title="语速">${READ_RATES.map(([v, l]) => `<option value="${v}" ${v === rate() ? "selected" : ""}>${l}</option>`).join("")}</select>
    <button class="btn sm ghost" data-rb="close" title="关闭朗读">✕ 关闭</button></div>`);
  reader.after(bar);
  let idx = 0, run = 0, active = false;
  const paras = () => $$(".para", reader);
  const update = () => {
    bar.classList.toggle("hidden", !active);
    bar.classList.toggle("paused", TTS.paused);
    btn.textContent = active ? "⏹ 停止朗读" : label;
    $(".rb-pos", bar).textContent = `${TTS.paused ? "已暂停" : "正在朗读"} · 第 ${idx + 1} / ${paras().length} 段`;
    $('[data-rb="toggle"]', bar).textContent = TTS.paused ? "▶ 继续" : "⏸ 暂停";
    paras().forEach((p, i) => p.classList.toggle("reading-now", active && i === idx));
  };
  const close = () => { run++; active = false; TTS.stop(); update(); };
  const playFrom = async (i) => {
    const my = ++run, list = paras();
    active = true;
    for (idx = Math.max(0, i); idx < list.length; idx++) {
      update();
      list[idx].scrollIntoView({ block: "center", behavior: "smooth" });
      const p = TTS.speak(list[idx].dataset.text, rate());
      const seq = TTS.seq;
      await p;
      if (my !== run || signal.aborted) return;
      if (TTS.seq !== seq) { close(); return; } // 被别的发音打断了（比如点了查词浮层里的 🔊）
    }
    close();
  };
  const toggle = () => { if (TTS.paused) TTS.resume(); else TTS.pause(); update(); };
  btn.onclick = () => (active ? close() : playFrom(startAt()));
  bar.addEventListener("click", (e) => {
    const k = e.target.closest("[data-rb]")?.dataset.rb;
    if (k === "toggle") toggle();
    else if (k === "prev") playFrom(idx - 1);
    else if (k === "next") { if (idx + 1 < paras().length) playFrom(idx + 1); else close(); }
    else if (k === "close") close();
  });
  $('[data-rb="rate"]', bar).onchange = (e) => { P.read_rate = +e.target.value; Store.save(); if (active) playFrom(idx); };
  // 朗读时点段落的 🔊：从这一段接着读，而不是只读这一段
  reader.addEventListener("click", (e) => {
    const b = e.target.closest(".para-tools [data-say]");
    if (!b || !active) return;
    e.stopPropagation();
    playFrom(paras().indexOf(b.closest(".para")));
  }, { capture: true, signal });
  document.addEventListener("keydown", (e) => {
    if (!active || e.code !== "Space" || e.target.closest("input, textarea, select, button, [contenteditable]")) return;
    e.preventDefault();
    toggle();
  }, { signal });
  signal.addEventListener("abort", () => { run++; });
  return { close };
}

// 开关样式的复选框
function switchHtml(id, label, on, title = "") {
  return `<label class="switch" ${title ? `title="${esc(title)}"` : ""}><input type="checkbox" id="${id}" ${on ? "checked" : ""}><span class="slider"></span>${label}</label>`;
}

function aiLockHtml(what = "这个功能") {
  return `<div class="card ai-lock">
    <div class="big">🤖</div>
    <h3 class="mt-s">${what}需要接入 AI</h3>
    <p class="muted">在「设置」里填写任意一家 AI 服务的 API Key 即可开启（DeepSeek、通义千问、Kimi、Claude 等都可以）。<br>不接入也没关系，其他离线功能都能正常使用。</p>
    <a class="btn primary" href="#/settings">去设置</a>
  </div>`;
}
function aiLoading(text = "AI 正在思考…") {
  return `<div class="ai-box"><span class="typing" style="padding:4px 8px;background:none"><i></i><i></i><i></i></span> ${text}</div>`;
}
function aiError(err) {
  return `<div class="ai-box" style="background:var(--bad-soft)">😥 ${esc(err)}</div>`;
}

// ---------- 英汉词典（ECDICT，Python 端的 SQLite，约 31 万条；设置里可以下载 77 万条的完整版） ----------
// 词书里的词信息更全（例句、短语、记忆方法），先查词书；词书里没有的再查词典
const DICT_TAGS = { zk: "中考", gk: "高考", cet4: "四级", cet6: "六级", ky: "考研", ielts: "雅思", toefl: "托福", gre: "GRE" };
const DICT_FORMS = { p: "过去式", d: "过去分词", i: "现在分词", 3: "三单", s: "复数", r: "比较级", t: "最高级" };
const Dict = {
  cache: new Map(),
  get ok() { return !!Store.bridge; },
  async lookup(word) {
    const k = word.toLowerCase();
    if (this.cache.has(k)) return this.cache.get(k);
    let r = null;
    if (this.ok) try { r = await pywebview.api.dict_lookup(word); } catch { r = null; }
    this.cache.set(k, r);
    return r;
  },
  async search(q) {
    if (this.ok) try { return await pywebview.api.dict_search(q, 40); } catch { /* 退回到词书里搜 */ }
    // 没有 Python 端（在普通浏览器里调试）时，只在词书里搜
    const cjk = /[㐀-鿿]/.test(q), lo = q.toLowerCase();
    return WORDS.filter((x) => (cjk ? x.m.includes(q) : x.w.toLowerCase().startsWith(lo))).slice(0, 40)
      .map((x) => ({ word: x.w, phonetic: (x.ph || "").replace(/^\/|\/$/g, ""), trans: x.m, tag: "", collins: 0, rank: 0 }));
  },
  // 转成词书词条的形状，查词浮层、生词本、卡片复习都能直接用
  toItem(d) {
    return { w: d.word, ph: d.phonetic ? `/${d.phonetic}/` : "", m: d.trans.split("\n").map((s) => s.trim()).filter(Boolean).join("  ") };
  },
  tagsHtml(d, max = 9) {
    return (d.tag || "").split(" ").filter((t) => DICT_TAGS[t]).slice(0, max).map((t) => `<span class="badge">${DICT_TAGS[t]}</span>`).join("");
  },
  // 变形说明：查 went 得到 go 时「went 是 go 的过去式」；saw 本身也是词时「saw 也是 see 的过去式」（点一下去查原形）
  formNote(d) {
    const kind = DICT_FORMS[d.form] || "变形";
    if (d.lemma_of) return `<div class="small muted">「${esc(d.lemma_of)}」是 ${esc(d.word)} 的${kind}</div>`;
    if (d.also_form_of) return `<div class="small muted">也是 <a href="#" data-dict-q="${esc(d.also_form_of)}">${esc(d.also_form_of)}</a> 的${kind}</div>`;
    return "";
  },
  formsHtml(d) {
    const fs = (d.exchange || "").split("/").map((x) => x.split(":")).filter(([k, v]) => DICT_FORMS[k] && v);
    return fs.length ? fs.map(([k, v]) => `<span class="ds-form"><span class="faint">${DICT_FORMS[k]}</span> <b>${esc(v)}</b></span>`).join("") : "";
  },
};

// 查单词面板：Ctrl+K 或侧栏的「查单词」打开；英文按前缀搜，中文按释义搜
function openDictSearch(initial = "") {
  closePopups();
  if ($(".ds-modal")) return;
  const { root, close } = modal(`
    <div class="ds">
      <div class="row ds-top"><input class="input ds-input" id="ds-q" placeholder="输入英文或中文，比如 happy、look forward、苹果" autocomplete="off" spellcheck="false">
        <button class="btn ghost sm" data-close title="关闭 (Esc)">✕</button></div>
      <div class="ds-body"><div class="ds-list" id="ds-list"></div><div class="ds-detail" id="ds-detail"></div></div>
      <div class="small faint ds-foot">↑ ↓ 选择 · Enter 朗读 · Esc 关闭 · 英汉词典数据来自 ECDICT（MIT 协议）</div>
    </div>`);
  $(".modal", root).classList.add("ds-modal");
  const inp = $("#ds-q", root), list = $("#ds-list", root), detail = $("#ds-detail", root);
  let results = [], active = -1, seq = 0;

  const empty = (html) => (detail.innerHTML = `<div class="ds-empty">${html}</div>`);
  empty(`<div class="big">🔍</div>输入单词、短语或中文开始搜索<div class="small faint mt-s">${Dict.ok ? "" : "当前只能搜索词书里的词，完整词典需要在桌面版中使用"}</div>`);

  const drawList = () => {
    list.innerHTML = results.map((r, i) => `<div class="ds-row ${i === active ? "active" : ""}" data-i="${i}">
      <div class="row" style="gap:6px"><b class="ds-w">${esc(r.word)}</b>${inNotebook(r.word) ? `<span class="ds-star">★</span>` : ""}<span class="spacer"></span>${Dict.tagsHtml(r, 2)}</div>
      <div class="ds-t">${esc(r.trans.split("\n")[0])}</div></div>`).join("")
      || (inp.value.trim() ? `<div class="ds-none small muted">没有找到「${esc(inp.value.trim())}」</div>` : "");
  };

  const show = async (i) => {
    active = i;
    drawList();
    const r = results[i];
    if (!r) return;
    $(".ds-row.active", list)?.scrollIntoView({ block: "nearest" });
    const my = ++seq;
    const d = (await Dict.lookup(r.word)) || { ...r, defn: "", exchange: "", oxford: 0 };
    if (my !== seq) return;
    const local = WORD_MAP[d.word.toLowerCase()];
    const item = local || Dict.toItem(d);
    detail.innerHTML = `
      <div class="row"><span class="ds-word">${esc(d.word)}</span>${speakBtn(d.word)}<button class="btn sm ghost" data-say="${esc(d.word)}" data-rate="0.6" title="慢速">🐢</button>
        <span class="spacer"></span><button class="star ${inNotebook(d.word) ? "on" : ""}" id="ds-star" title="加入生词本">★</button></div>
      ${local?.ph || d.phonetic ? `<div class="pop-ipa">${esc(local?.ph || `/${d.phonetic}/`)}</div>` : ""}
      ${Dict.formNote(d)}
      <div class="row ds-badges">${Dict.tagsHtml(d)}${d.collins ? `<span class="badge brand" title="柯林斯星级，越多越常用">${"★".repeat(d.collins)}</span>` : ""}
        ${d.oxford ? `<span class="badge good" title="牛津 3000 核心词">牛津 3000</span>` : ""}${d.rank ? `<span class="small faint">词频第 ${d.rank} 位</span>` : ""}</div>
      <div class="ds-trans">${d.trans.split("\n").map((l) => `<div>${esc(l)}</div>`).join("")}</div>
      ${Dict.formsHtml(d) ? `<div class="ds-forms">${Dict.formsHtml(d)}</div>` : ""}
      ${local ? `<div class="small faint mt">📚 ${esc(unitLabel(local))}</div><div class="ds-local">${wordDetailHtml(local)}</div>` : ""}
      ${d.defn ? `<details class="mt-s"><summary class="small muted" style="cursor:pointer">英文释义</summary><div class="ds-defn">${esc(d.defn).replace(/\n/g, "<br>")}</div></details>` : ""}
      <div id="ds-tat"></div>`;
    tatoebaHtml($("#ds-tat", detail), d.word, d.exchange);
    $("#ds-star", detail).onclick = (e) => { e.currentTarget.classList.toggle("on", toggleNotebook(item)); drawList(); };
    const also = $("[data-dict-q]", detail);
    if (also) also.onclick = (e) => { e.preventDefault(); inp.value = also.dataset.dictQ; run(); };
    TTS.speak(d.word);
  };

  let timer = 0;
  const run = async () => {
    const q = inp.value.trim(), my = ++seq;
    if (!q) { results = []; drawList(); return; }
    const res = await Dict.search(q);
    if (my !== seq) return;
    results = res;
    if (results.length) show(0);
    else { drawList(); empty(`没有找到「${esc(q)}」${Dict.ok ? `<div class="small faint mt-s">可以在设置里下载完整词典（77 万条）</div>` : ""}`); }
  };
  inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) show((active + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (e.key === "Enter" && results[active]) TTS.speak(results[active].word);
  });
  list.onclick = (e) => { const r = e.target.closest("[data-i]"); if (r) { show(+r.dataset.i); inp.focus(); } };
  inp.value = initial;
  setTimeout(() => inp.focus(), 30);
  if (initial) run();
  return close;
}

document.addEventListener("click", (e) => { if (e.target.closest("#dict-open")) openDictSearch(); });
// Ctrl+K 打开查单词；有选中的英文就直接搜它
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K") && Store.data) {
    e.preventDefault();
    const sel = window.getSelection().toString().trim();
    openDictSearch(/^[A-Za-z][A-Za-z '’-]{0,40}$/.test(sel) ? sel : "");
  }
});

// ---------- 查词浮层 ----------
function closePopups() { $$(".pop").forEach((p) => p.remove()); }
document.addEventListener("mousedown", (e) => { if (!e.target.closest(".pop, .w")) closePopups(); });

// anchor：被点的元素，或者选区的矩形；extra：附加在浮层底部的操作 { html, bind(pop) }
async function showWordPopup(rawWord, anchor, context = "", extra = null) {
  closePopups();
  const word = rawWord.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
  const hit = lookupWord(word);
  const pop = el(`<div class="pop"></div>`);
  document.body.appendChild(pop);

  const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
  const place = () => {
    const w = pop.offsetWidth, hgt = pop.offsetHeight;
    let left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
    let top = r.bottom + 8;
    if (top + hgt > window.innerHeight - 12) top = Math.max(12, r.top - hgt - 8);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  };

  const render = (item, fromAI = false) => {
    pop.innerHTML = `
      <div class="row"><span class="pop-word">${esc(item.w)}</span>${speakBtn(item.w, "sm")}${shadowBtn(item.w, { ph: item.ph || "" })}<span class="spacer"></span>
        <button class="star ${inNotebook(item.w) ? "on" : ""}" title="加入生词本">★</button></div>
      ${item.ph ? `<div class="pop-ipa">${esc(item.ph)}</div>` : ""}
      ${item.formNote || ""}
      ${item.tagsHtml ? `<div class="row ds-badges">${item.tagsHtml}</div>` : ""}
      <div class="pop-meaning">${esc(item.m).replace(/\s{2,}/g, "<br>")}</div>
      ${typeof morphHtml === "function" ? morphHtml(item.w) : ""}
      ${item.ex ? `<div class="pop-ex"><div class="en">${esc(item.ex)}</div><div class="zh">${esc(item.zh || "")}</div></div>` : ""}
      ${fromAI ? `<div class="small faint mt-s">由 AI 解释</div>` : ""}
      <div class="row mt-s"><a href="#" class="small" data-more>🔍 在词典里看详细</a></div>
      ${extra ? `<div class="pop-extra">${extra.html}</div>` : ""}`;
    $("[data-more]", pop).onclick = (e) => { e.preventDefault(); openDictSearch(item.w); };
    const also = $("[data-dict-q]", pop);
    if (also) also.onclick = (e) => { e.preventDefault(); openDictSearch(also.dataset.dictQ); };
    // 收进生词本时不带界面用的临时字段
    const save = { w: item.w, ph: item.ph, m: item.m, ex: item.ex, zh: item.zh };
    $(".star", pop).onclick = (e) => { e.currentTarget.classList.toggle("on", toggleNotebook(WORD_MAP[item.w.toLowerCase()] || save)); anchor.classList?.toggle("saved", inNotebook(item.w)); };
    if (extra) extra.bind(pop);
    place();
  };

  if (hit) { render(hit); TTS.speak(hit.w); return; }

  TTS.speak(word);
  // 词书里没有：查内置词典（异步，先显示「查询中」）
  pop.innerHTML = `<div class="row"><span class="pop-word">${esc(word)}</span>${speakBtn(word, "sm")}</div><div class="muted small mt-s">查询中…</div>`;
  place();
  const d = await Dict.lookup(word);
  if (!pop.isConnected) return;
  if (d) {
    render({ ...Dict.toItem(d), formNote: Dict.formNote(d), tagsHtml: Dict.tagsHtml(d, 4) });
    return;
  }
  pop.innerHTML = `<div class="row"><span class="pop-word">${esc(word)}</span>${speakBtn(word, "sm")}</div>
    <div class="muted small mt-s">词典里没有这个词。</div>
    <div class="mt-s">${AI.enabled ? `<button class="btn soft sm" data-ai>🤖 让 AI 解释</button>` : `<span class="small faint">开启 AI 后可以查询任意单词。</span>`}</div>
    ${extra ? `<div class="pop-extra">${extra.html}</div>` : ""}`;
  if (extra) extra.bind(pop);
  place();
  const btn = $("[data-ai]", pop);
  if (btn) btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "查询中…";
    const res = await AI.json(
      "You are a concise English-Chinese dictionary for Chinese learners.",
      `Explain the English word "${word}"${context ? ` as used in this sentence: "${context}"` : ""}.
Return JSON: {"w": base form of the word, "ph": British IPA like /ˈwɜːd/, "m": part of speech + Chinese meaning(s) fitting the context, e.g. "v. 放弃；抛弃", "ex": a simple example sentence, "zh": Chinese translation of the example}`);
    if (!pop.isConnected) return;
    if (res.ok) render({ w: res.data.w || word, ph: res.data.ph, m: res.data.m, ex: res.data.ex, zh: res.data.zh }, true);
    else { btn.disabled = false; btn.textContent = "重试"; toast(res.error, "bad", 4000); }
  };
}

// 把一段英文里的单词包成可点击的 span
// 先切出单词再分别转义：直接在转义后的文本里找单词，会把 &quot; 里的 quot 也包起来，页面上就显示成 &quot;
function wrapWords(text) {
  return text.split(/([A-Za-z][A-Za-z'’-]*)/).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    const known = lookupWord(part) ? " known" : "";
    const saved = inNotebook(part) ? " saved" : "";
    return `<span class="w${known}${saved}">${esc(part)}</span>`;
  }).join("");
}
function bindWordClicks(root) {
  root.addEventListener("click", (e) => {
    const w = e.target.closest(".w");
    if (!w) return;
    const para = w.closest("[data-text]");
    showWordPopup(w.textContent, w, para ? para.dataset.text : "");
  });
}

// ---------- 划词：在任何页面选中英文，显示释义，可以收进生词本 ----------
// 选中一个词 → 查词浮层（收进生词本的「单词」）；选中短语或句子 → 句子浮层（收进生词本的「短语和句子」）
// 页面可以设置 App.selectionExtra = (range, text) => ({ html, bind(pop) }) 往浮层里加自己的操作（比如阅读的高亮），切换页面时自动清掉
const selNorm = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9'\s-]/g, " ").replace(/\s+/g, " ").trim();
let SEL_INDEX = null;
const GLOSS_SKIP = new Set("a an the and or but so to of in on at by for with from as is am are was were be been being do does did have has had i you he she it we they me him her us them my your his its our their this that these those not no if then than there here what who which when where how can could will would shall should may might must very too also just".split(" "));
// 内置内容里已有的中文翻译：短语课程、连词成句、情景句子、词书例句和词组、阅读段落
function sentenceIndex() {
  if (SEL_INDEX) return SEL_INDEX;
  SEL_INDEX = new Map();
  const add = (en, zh) => { if (en && zh) { const k = selNorm(en); if (k && !SEL_INDEX.has(k)) SEL_INDEX.set(k, zh); } };
  (window.PHRASE_UNITS || []).forEach((u) => u.lessons.forEach((l) => l.phrases.forEach(([en, zh]) => add(en, zh))));
  (window.BUILDER_LESSONS || []).forEach((l) => l.sentences.forEach((s) => s.forEach(([en, zh]) => add(en, zh))));
  (window.SENTENCE_SCENES || []).forEach((s) => s.sentences.forEach(([en, zh]) => add(en, zh)));
  [...(window.READING_PASSAGES || []), ...(window.READING_EXTRA || []).flat()].forEach((p) => p.paragraphs?.forEach(([en, zh]) => add(en, zh)));
  WORDS.forEach((x) => { (x.exs || []).forEach(([en, zh]) => add(en, zh)); (x.phrases || []).forEach(([en, zh]) => add(en, zh)); });
  return SEL_INDEX;
}

function sentNb() { return (Store.data.sentence_nb ||= []); }
function inSentNb(en) { const k = selNorm(en); return sentNb().some((x) => selNorm(x.en) === k); }
function toggleSentNb(item) {
  const nb = sentNb(), k = selNorm(item.en);
  const i = nb.findIndex((x) => selNorm(x.en) === k);
  if (i >= 0) {
    markDeleted("sentence_nb", RECORD_ID.sentence_nb(nb[i]));
    nb.splice(i, 1);
    if (SentSRS.data()[k]?.src !== "短语课") SentSRS.remove(item.en); // 短语课里学过的短语还留在复习计划里
    toast("已从生词本移除");
  } else {
    const rec = { en: item.en, zh: item.zh || "", from: item.from || "", added: today() };
    nb.unshift(markAdded("sentence_nb", RECORD_ID.sentence_nb(rec), rec));
    SentSRS.add(item.en, item.zh, item.from || "生词本");
    toast("已加入生词本 ⭐，明天开始安排复习", "good");
  }
  Store.save();
  renderNav();
  return i < 0;
}

function showSentencePopup(text, rect, extra = null) {
  closePopups();
  const pop = el(`<div class="pop pop-wide"></div>`);
  document.body.appendChild(pop);
  const from = NAV.find((n) => n.id === Router.current().page)?.label || "";
  const item = { en: text, zh: sentenceIndex().get(selNorm(text)) || "", from };
  // 没有现成翻译时，列出句子里认识的词作参考（跳过冠词、代词、介词这类虚词）
  const gloss = () => {
    const seen = new Set();
    return tokens(text).filter((w) => !GLOSS_SKIP.has(w)).map((w) => lookupWord(w)).filter((d) => d && !seen.has(d.w) && seen.add(d.w)).slice(0, 8)
      .map((d) => `<div><span class="en">${esc(d.w)}</span> <span class="muted">${esc(shortMeaning(d))}</span></div>`).join("");
  };
  const render = (fromAI = false) => {
    const g = item.zh ? "" : gloss();
    pop.innerHTML = `
      <div class="pop-sent">${esc(text)}</div>
      <div class="row mt-s">${speakBtn(text, "sm")}<button class="btn sm ghost" data-say="${esc(text)}" data-rate="0.6">🐢</button>${shadowBtn(text, { zh: item.zh })}<span class="spacer"></span>
        <button class="star ${inSentNb(text) ? "on" : ""}" title="加入生词本">★</button></div>
      ${item.zh ? `<div class="pop-meaning">${esc(item.zh)}</div>${fromAI ? `<div class="small faint">由 AI 翻译</div>` : ""}`
        : `${g ? `<div class="pop-gloss"><div class="small faint">逐词释义</div>${g}</div>` : ""}
           <div class="mt-s">${AI.enabled ? `<button class="btn soft sm" data-ai>🤖 翻译这句话</button>` : `<span class="small faint">开启 AI 后可以翻译任意句子。</span>`}</div>`}
      ${extra ? `<div class="pop-extra">${extra.html}</div>` : ""}`;
    $(".star", pop).onclick = (e) => e.currentTarget.classList.toggle("on", toggleSentNb(item));
    const btn = $("[data-ai]", pop);
    if (btn) btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = "翻译中…";
      const r = await AI.ask("You are an English-Chinese translator for Chinese learners. Reply with only a natural Chinese translation, nothing else.", text);
      if (!pop.isConnected) return;
      if (!r.ok) { btn.disabled = false; btn.textContent = "重试"; toast(r.error, "bad", 4000); return; }
      item.zh = r.text.trim();
      // 已经收藏过的话，把翻译补进生词本
      const saved = sentNb().find((x) => selNorm(x.en) === selNorm(text));
      if (saved && !saved.zh) { saved.zh = item.zh; Store.save(); }
      render(true);
    };
    if (extra) extra.bind(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), window.innerWidth - w - 12) + "px";
    pop.style.top = (rect.bottom + 8 + h > window.innerHeight - 12 ? Math.max(12, rect.top - h - 8) : rect.bottom + 8) + "px";
  };
  render();
  if (!item.zh && text.split(" ").length <= 4) {
    Dict.lookup(text).then((d) => {
      if (d && pop.isConnected && !item.zh) { item.zh = d.trans.split("\n").join("；"); render(); }
    });
  }
}

document.addEventListener("mouseup", (e) => {
  if (e.button !== 0 || e.target.closest?.(".pop, input, textarea, select, button, .modal-mask")) return;
  setTimeout(() => { // 等浏览器更新完选区
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const text = sel.toString().replace(/\s+/g, " ").trim().replace(/^[^A-Za-z0-9'"(]+|[^A-Za-z0-9.!?'")]+$/g, "");
    // 只处理纯英文的选区：夹着中文的一般是在复制界面上的文字
    if (!text || text.length > 400 || !/[A-Za-z]/.test(text) || /[　-鿿＀-￯]/.test(text)) return;
    const range = sel.getRangeAt(0), rect = range.getBoundingClientRect();
    const extra = App.selectionExtra ? App.selectionExtra(range, text) : null;
    if (/^[A-Za-z][A-Za-z'’-]*$/.test(text)) {
      const ctx = range.startContainer.parentElement?.closest("[data-text]");
      showWordPopup(text, rect, ctx ? ctx.dataset.text : "", extra);
    } else showSentencePopup(text, rect, extra);
  }, 0);
});

// ---------- 单题选择题 ----------
// q: {q, o, a, e}；onAnswer(correct, event)
function renderChoice(container, q, { onAnswer, qClass = "" } = {}) {
  const letters = "ABCD";
  container.innerHTML = `
    <div class="quiz-q ${qClass}">${q.qHtml || esc(q.q)}</div>
    <div class="options">${q.o.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${letters[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>
    <div class="explain-slot"></div>`;
  let answered = false;
  const choose = (i, evt) => {
    if (answered) return;
    answered = true;
    const btns = $$(".option", container);
    btns.forEach((b) => (b.disabled = true));
    btns[q.a].classList.add("right");
    const ok = i === q.a;
    if (!ok) btns[i].classList.add("wrong");
    if (q.e) $(".explain-slot", container).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 答对了！" : "❌ 答错了。"} ${esc(q.e)}</div>`;
    onAnswer && onAnswer(ok, evt);
  };
  $$(".option", container).forEach((b) => (b.onclick = (e) => choose(+b.dataset.i, e)));
  return { choose, get answered() { return answered; } };
}

// ---------- 单词详情（卡片背面 / 词库展开）----------
function wordDetailHtml(item) {
  const exs = item.exs?.length ? item.exs : item.ex ? [[item.ex, item.zh]] : [];
  return `
    <div class="fc-meaning">${esc(item.m).replace(/\s{2,}/g, "<br>")}</div>
    ${exs.slice(0, 2).map(([en, zh]) => `<div class="fc-example">${esc(en)} ${speakBtn(en, "sm")}</div><div class="fc-example-zh">${esc(zh)}</div>`).join("")}
    ${item.phrases?.length ? (item.phrases.every((x) => x[1] === "同义替换")
      ? `<div class="fc-extra"><b>同义替换（考试里常换成这些说法）</b><div class="en">${item.phrases.map(([p]) => esc(p)).join(" · ")}</div></div>`
      : `<div class="fc-extra"><b>常用短语</b>${item.phrases.slice(0, 3).map(([p, c]) => `<div><span class="en">${esc(p)}</span> <span class="muted">${esc(c)}</span></div>`).join("")}</div>`) : ""}
    ${typeof morphHtml === "function" ? morphHtml(item.w) : ""}
    ${item.mem ? `<div class="fc-extra"><b>记忆</b><div class="muted">${esc(item.mem)}</div></div>` : ""}
    ${item.exam?.length ? `<div class="fc-extra"><b>真题原句</b><div><span class="en">${esc(item.exam[0])}</span> <span class="faint small">${esc(item.exam[1])}</span></div></div>` : ""}`;
}

// ---------- 单词卡片学习 ----------
// queue: 词条数组；mode: "new" 学新词 / "review" 复习 / "notebook" 生词本
function runFlashcards(container, queue, mode, signal, onFinish) {
  const total = queue.length;
  const q = [...queue];
  const retry = {};            // 答错的词回到队尾再来一次（最多 2 次）
  const stats = { known: 0, fuzzy: 0, unknown: 0 };
  let cur = null, revealed = false, done = 0;

  const next = () => {
    cur = q.shift();
    revealed = false;
    if (!cur) return finish();
    draw();
    TTS.speak(cur.w);
  };
  // Ctrl+M 跟读：翻开前只读单词（不显示中文，免得提前看到释义），翻开后还可以读例句
  App.shadowTarget = () => {
    if (!cur) return null;
    const exs = cur.exs?.length ? cur.exs : cur.ex ? [[cur.ex, cur.zh]] : [];
    return [{ en: cur.w, ph: cur.ph, zh: revealed ? shortMeaning(cur) : "", label: "单词" },
      ...(revealed ? exs.slice(0, 2).map(([en, zh], i) => ({ en, zh, label: `例句${exs.length > 1 ? i + 1 : ""}` })) : [])];
  };

  // 滑动卡片：空格或点一下卡片翻开；← 或往左拖 = 记住了，→ 或往右拖 = 没记住，↓ = 有点模糊
  let busy = false; // 卡片正在飞出去
  const draw = (enter = true) => {
    const pct = Math.round((done / total) * 100);
    const tag = { new: "新词", review: "复习", notebook: "生词本" }[mode];
    container.innerHTML = `
      <div class="flash-wrap">
        <div class="flash-progress"><span>${done} / ${total}</span><div class="bar"><i style="width:${pct}%"></i></div><span>${tag}</span></div>
        <div class="fc-stack ${enter ? "enter" : ""} ${q.length ? "" : "last"}">
        <div class="card flashcard" id="fc">
          <div class="fc-stamp ok">记住了 ✓</div><div class="fc-stamp no">没记住 ✗</div>
          <div class="fc-top"><span class="fc-tag">${esc(unitLabel(cur))}</span>
            <button class="star ${inNotebook(cur.w) ? "on" : ""}" title="加入生词本">★</button></div>
          <div class="fc-word">${esc(cur.w)}</div>
          <div class="fc-ipa">${esc(cur.ph || "")} ${speakBtn(cur.w)}<button class="speak" data-shadow-cur title="跟读评测（Ctrl+M）">🎙️</button></div>
          ${revealed ? `
            <div class="fc-back ${enter ? "" : "reveal"}">${wordDetailHtml(cur)}</div>
            <div class="fc-actions">
              <button class="btn good lg" data-g="2">← 认识 <span class="kbd">3</span></button>
              <button class="btn warn lg" data-g="1">有点模糊 <span class="kbd">↓</span></button>
              <button class="btn bad lg" data-g="0">不认识 → <span class="kbd">1</span></button>
            </div>` : `
            <div class="fc-actions"><button class="btn primary lg" data-reveal>${mode === "new" ? "看释义" : "想好了，看答案"} <span class="kbd">空格</span></button></div>
            <div class="small faint center fc-swipe-hint">认识的话不用翻开：← 记住了 · → 没记住</div>`}
        </div></div>
        <div class="kbd-hint">${revealed ? "← 记住了 · → 没记住 · ↓ 有点模糊（1 / 2 / 3 也可以）" : "先试着回忆词义，再按空格翻开"} · 也可以拖动卡片 · R 重听 · Ctrl+M 跟读评测</div>
      </div>`;
    $(".star", container).onclick = (e) => e.currentTarget.classList.toggle("on", toggleNotebook(cur));
    const rv = $("[data-reveal]", container);
    if (rv) rv.onclick = reveal;
    $$("[data-g]", container).forEach((b) => (b.onclick = (e) => swipe(+b.dataset.g, e)));
    bindDrag();
  };

  const reveal = () => { if (busy || revealed) return; revealed = true; draw(false); };

  // 卡片飞出去再进入下一张：记住了往左，没记住往右，模糊往下
  const swipe = (g, evt) => {
    const card = $("#fc", container);
    if (busy || !card) return;
    busy = true;
    const dir = g === 2 ? -1 : g === 0 ? 1 : 0;
    card.classList.remove("dragging");
    card.classList.add("fly");
    if (dir) $(`.fc-stamp.${dir < 0 ? "ok" : "no"}`, card).style.opacity = 1;
    card.style.transform = dir ? `translateX(${dir * 130}%) rotate(${dir * 24}deg)` : "translateY(40%) scale(.85)";
    card.style.opacity = 0;
    if (typeof Sfx !== "undefined") {
      if (g === 2) Sfx.good();
      else if (g === 1) Sfx.ok();
      else Sfx.play([[330, 0.14, "sine", 0.05], [262, 0.18, "sine", 0.04, 0.08]]);
    }
    setTimeout(() => { busy = false; if (!signal.aborted) grade(g, evt); }, 260);
  };

  // 拖动：超过 110px 松手就算滑走，不到就弹回来；没怎么动就当作点击翻开
  // 释义和例句区域不能拖（那里要能选中文字查词）
  const bindDrag = () => {
    const card = $("#fc", container);
    let x0 = null, dx = 0, moved = false;
    const stamps = () => [$(".fc-stamp.ok", card), $(".fc-stamp.no", card)];
    card.addEventListener("pointerdown", (e) => {
      if (busy || e.button !== 0 || e.target.closest("button, a, .fc-back, .w")) return;
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
      ok.style.opacity = Math.min(1, Math.max(0, -dx / 110));
      no.style.opacity = Math.min(1, Math.max(0, dx / 110));
    });
    const end = (e) => {
      if (x0 === null) return;
      x0 = null;
      if (dx < -110) return swipe(2, e);
      if (dx > 110) return swipe(0, e);
      card.classList.remove("dragging");
      card.style.transform = "";
      stamps().forEach((s) => (s.style.opacity = 0));
      if (!moved && !revealed) reveal();
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  };

  const grade = (g, evt) => {
    if (WORD_MAP[cur.w.toLowerCase()]) {
      const isNew = gradeWord(cur.w, g);
      if (!retry[cur.w]) addXP(isNew ? 2 : 1, isNew ? "new" : "review", evt);
    }
    if (!retry[cur.w]) stats[["unknown", "fuzzy", "known"][g]]++;
    if (g === 0 && (retry[cur.w] || 0) < 2) {
      retry[cur.w] = (retry[cur.w] || 0) + 1;
      q.push(cur);
    } else {
      done++;
    }
    next();
  };

  const finish = () => {
    renderNav();
    container.innerHTML = `
      <div class="flash-wrap"><div class="card center" style="padding:40px">
        <div style="font-size:48px">🎉</div>
        <h2 class="mt-s">这一组完成啦！</h2>
        <p class="muted">共 ${total} 个词：认识 ${stats.known} · 模糊 ${stats.fuzzy} · 不认识 ${stats.unknown}</p>
        <p class="small faint">不认识和模糊的词会按记忆曲线安排在之后复习。</p>
        <div class="row" style="justify-content:center;margin-top:18px" data-finish-actions></div>
      </div></div>`;
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };

  onKey(signal, (e) => {
    if (!cur || busy) return;
    if (e.key === "r" || e.key === "R") TTS.speak(cur.w);
    else if (e.key === "ArrowLeft") { e.preventDefault(); swipe(2); }
    else if (e.key === "ArrowRight") { e.preventDefault(); swipe(0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); swipe(1); }
    else if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
    else if (revealed && ["1", "2", "3"].includes(e.key)) swipe(+e.key - 1);
  });

  next();
}

// ---------- 拼写复习：看中文、音标和挖空的例句，打出单词 ----------
// 一次拼对 → 认识；提示过或第二次才拼对 → 模糊；两次都错或看了答案 → 不认识，照着打一遍，本组最后再来一次
// opt.grade === false 时只是练习，不改变复习安排
const spellNorm = (s) => s.trim().toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ");
// 把打错的拼写逐个字母标出来：按最长公共子序列对齐，多打或打错的字母标红，漏掉的字母位置标一个红色下划线
// （schedule 打成 shedule 时只会标出漏掉的 c，而不是把后面全部标红）
function spellDiffHtml(typed, answer) {
  const t = [...typed.trim().toLowerCase()], a = [...answer.toLowerCase()], raw = [...typed.trim()];
  const { hitT, hitI } = lcsMatch(a, t);
  let html = "", i = 0, j = 0;
  while (i < a.length || j < t.length) {
    if (i < a.length && !hitT[i]) { i++; if (j >= t.length || hitI[j]) { html += `<span class="sp-bad">_</span>`; continue; } }
    if (j < t.length) { html += `<span class="${hitI[j] ? "sp-ok" : "sp-bad"}">${esc(raw[j])}</span>`; if (hitI[j]) i++; j++; }
  }
  return html;
}
// 例句里把目标词（含 -s / -ed / -ing 等词尾）挖掉；例句里找不到这个词就返回空
function maskWord(sentence, w) {
  const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*`, "gi");
  return re.test(sentence) ? sentence.replace(re, "_____") : "";
}

function runSpelling(container, queue, signal, onFinish, opt = {}) {
  const total = queue.length;
  const q = [...queue];
  const retry = {};
  const stats = { known: 0, fuzzy: 0, unknown: 0 };
  let cur = null, st = null, done = 0;

  const next = () => {
    cur = q.shift();
    if (!cur) return finish();
    st = { tries: 0, hint: 0, gaveUp: false, ok: false, requeue: false };
    draw();
    TTS.speak(cur.w);
  };

  // 字母格：提示过的字母和空格、连字符直接显示，其余是下划线
  const pattern = (all) => [...cur.w].map((c, i) => (all || i < st.hint || /[^a-z]/i.test(c) ? c : "_")).join(" ");

  const draw = () => {
    const ex = cur.exs?.[0] || (cur.ex ? [cur.ex, cur.zh] : null);
    const masked = ex ? maskWord(ex[0], cur.w) : "";
    container.innerHTML = `
      <div class="flash-wrap">
        <div class="flash-progress"><span>${done} / ${total}</span><div class="bar"><i style="width:${Math.round((done / total) * 100)}%"></i></div><span>${opt.grade === false ? "拼写练习" : "拼写复习"}</span></div>
        <div class="card flashcard spell-card" id="sp-card">
          <div class="fc-top"><span class="fc-tag">${esc(unitLabel(cur))}</span>
            <button class="star ${inNotebook(cur.w) ? "on" : ""}" title="加入生词本">★</button></div>
          <div class="fc-meaning">${esc(cur.m).replace(/\s{2,}/g, "<br>")}</div>
          <div class="fc-ipa">${esc(cur.ph || "")} ${speakBtn(cur.w)}</div>
          ${masked ? `<div class="fc-example">${esc(masked)}</div><div class="fc-example-zh">${esc(ex[1])}</div>` : ""}
          <div class="sp-pattern" id="sp-pat"></div>
          <input class="input en sp-input" id="sp-in" placeholder="拼出这个单词，按 Enter" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div id="sp-msg"></div>
          <div class="fc-back hidden" id="sp-detail">${wordDetailHtml(cur)}</div>
          <div class="fc-actions" id="sp-act"></div>
        </div>
        <div class="kbd-hint">Enter 提交 · / 提示一个字母 · Tab 重听（Shift+Tab 慢速）· Esc 看答案</div>
      </div>`;
    const inp = $("#sp-in", container);
    $("#sp-pat", container).textContent = pattern();
    $(".star", container).onclick = (e) => { e.currentTarget.classList.toggle("on", toggleNotebook(cur)); inp.focus(); };
    $("#sp-card", container).addEventListener("click", (e) => { if (!e.target.closest("button, a, input")) inp.focus(); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); TTS.speak(cur.w, e.shiftKey ? 0.6 : undefined); }
      else if (e.key === "/") { e.preventDefault(); if (!st.ok && !st.gaveUp) hint(); }
      else if (e.key === "Escape") { e.preventDefault(); if (!st.ok && !st.gaveUp) giveUp(); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (st.ok) advance(); else submit(); }
    });
    setTimeout(() => inp.focus(), 30);
  };

  const el_ = (id) => $(`#${id}`, container);
  const msg = (html) => (el_("sp-msg").innerHTML = html);
  const shake = () => { const c = el_("sp-card"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); };

  const hint = () => {
    st.hint++;
    if (st.hint >= cur.w.length) return giveUp();
    el_("sp-in").value = cur.w.slice(0, st.hint);
    el_("sp-pat").textContent = pattern();
  };

  const giveUp = (typed) => {
    st.gaveUp = true;
    const inp = el_("sp-in");
    msg(`<div class="explain bad">${typed ? `你的拼写：<span class="sp-diff">${spellDiffHtml(typed, cur.w)}</span><br>` : ""}正确答案：<b class="sp-answer">${esc(cur.w)}</b>　照着打一遍再继续</div>`);
    el_("sp-pat").textContent = pattern(true);
    el_("sp-detail").classList.remove("hidden");
    inp.value = "";
    inp.focus();
    TTS.speak(cur.w);
  };

  const submit = () => {
    const inp = el_("sp-in"), v = inp.value;
    if (!v.trim()) return;
    if (spellNorm(v) === spellNorm(cur.w)) return success();
    shake();
    if (st.gaveUp) { msg(`<div class="explain bad">还不对，照着答案 <b class="sp-answer">${esc(cur.w)}</b> 再打一遍</div>`); inp.select(); return; }
    st.tries++;
    if (st.tries >= 2) return giveUp(v);
    st.hint = Math.max(st.hint, 1);
    el_("sp-pat").textContent = pattern();
    msg(`<div class="explain bad">不对哦：<span class="sp-diff">${spellDiffHtml(v, cur.w)}</span>　再试一次，已提示首字母</div>`);
    inp.value = cur.w.slice(0, st.hint);
    TTS.speak(cur.w);
  };

  const success = () => {
    st.ok = true;
    const g = st.gaveUp ? 0 : st.tries === 0 && st.hint === 0 ? 2 : 1;
    if (opt.grade !== false && WORD_MAP[cur.w.toLowerCase()]) {
      const isNew = gradeWord(cur.w, g);
      if (!retry[cur.w]) addXP(isNew ? 2 : 1, isNew ? "new" : "review");
    }
    if (!retry[cur.w]) stats[["unknown", "fuzzy", "known"][g]]++;
    st.requeue = g === 0 && (retry[cur.w] || 0) < 2;
    const inp = el_("sp-in");
    inp.readOnly = true;
    inp.classList.add("ok");
    el_("sp-pat").textContent = pattern(true);
    el_("sp-detail").classList.remove("hidden");
    msg(`<div class="explain ${g === 0 ? "" : "good"}">${[
      "✍️ 记住它了吗？这一组最后会再考一次",
      "👍 拼对了，不过还不太熟，会安排得早一点复习",
      pick(["✅ 一次拼对！", "✅ 完美！", "✅ Great!"]),
    ][g]}</div>`);
    el_("sp-act").innerHTML = `<button class="btn primary lg" id="sp-next">下一个 <span class="kbd">Enter</span></button>`;
    el_("sp-next").onclick = advance;
    TTS.speak(cur.w);
  };

  const advance = () => {
    if (st.requeue) {
      retry[cur.w] = (retry[cur.w] || 0) + 1;
      q.push(cur);
    } else done++;
    next();
  };

  const finish = () => {
    renderNav();
    container.innerHTML = `
      <div class="flash-wrap"><div class="card center" style="padding:40px">
        <div style="font-size:48px">⌨️</div>
        <h2 class="mt-s">这一组拼完啦！</h2>
        <p class="muted">共 ${total} 个词：一次拼对 ${stats.known} · 提示后拼对 ${stats.fuzzy} · 没拼出来 ${stats.unknown}</p>
        <p class="small faint">${opt.grade === false ? "这是练习，不改变复习安排。" : "没拼出来和提示后才拼对的词，会按记忆曲线更早安排复习。"}</p>
        <div class="row" style="justify-content:center;margin-top:18px" data-finish-actions></div>
      </div></div>`;
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };

  // 焦点不在输入框时（比如点了别处），按 Enter 继续下一个
  onKey(signal, (e) => { if (e.key === "Enter" && st?.ok) { e.preventDefault(); advance(); } });

  next();
}
