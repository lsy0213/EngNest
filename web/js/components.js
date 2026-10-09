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
    if (!Store.bridge) { toast("语音输入需要在桌面版中使用，可以先打字"); return false; }
    if (Store.remote && !window.isSecureContext) { micUnavailable(); return false; }
    this.status = await pywebview.api.stt_status();
    if (!this.status.available) { toast("这个版本没有带语音识别组件，可以先打字", "bad", 4000); return false; }
    if (this.status.model) return true;
    // 局域网里的手机：识别在电脑上做，模型只能在电脑上下载
    if (Store.remote) { toast("电脑上还没有下载语音识别模型：请在电脑上的「设置」里下载", "bad", 5000); return false; }
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
  if (AI.settings?.lan_denied) return `<div class="card ai-lock">
    <div class="big">🤖</div>
    <h3 class="mt-s">${what}需要 AI</h3>
    <p class="muted">在「设置」里填你自己的 AI API Key 就能用（只用于你自己，保存在电脑上并加密）；或者请电脑主人给你开启 TA 的 AI。<br>其他功能都能正常使用。</p>
    <a class="btn primary" href="#/settings">去设置</a>
  </div>`;
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

// ---------- 学习者英英释义（data/simpledef.js，Simple English Wiktionary，CC BY-SA；第一次用时才加载） ----------
// 用简单英语写的整句释义：If you abandon something, you go away from it with no plan to return.
// 每个义项带着释义里「不太常见」的词和它的词频排名；按学习者认识多少词决定先给英文还是先给中文：
//   释义里不认识的词 ≤ 1 个 → 先显示英文（那个词标出来，点一下能查），中文点开再看
//   ≥ 2 个 → 先显示中文，英文放在下面作补充（读起来太累反而记不住）
// 「认识」= 在 App 里学过，或者在学习者词汇量范围内（做过水平测试按估计词汇量，没做过按 1200 个最常用词）
// 设置里可以改成：总是先中文 / 总是先英文 / 不显示
const SimpleDef = {
  words: null, easy: 1000, loading: null,
  async load() {
    if (this.words) return true;
    try {
      if (!window.SIMPLE_DEF) await (this.loading ||= loadScript("data/simpledef.js"));
      this.words = window.SIMPLE_DEF.words;
      this.easy = window.SIMPLE_DEF.easy || 1000;
      return true;
    } catch { this.loading = null; return false; }
  },
  get(w) { return this.words?.[String(w || "").toLowerCase()] || null; },
  basic() { return Math.max(this.easy, Math.min(Store.data?.level?.vocab || 1200, 12000)); },
  known(lemma, rank) {
    if (rank <= this.basic()) return true;
    const words = Store.data?.words || {};
    if (words[lemma]) return true;
    const hit = typeof lookupWord === "function" ? lookupWord(lemma) : null;
    return !!(hit && words[hit.w]);
  },
  // 一个义项里学习者还不认识的词（原形）
  unknown(sense) { return (sense[3] || []).filter(([w, r]) => !this.known(w, r)).map(([w]) => w); },
  // 卡片上怎么显示：{ mode: "en" 先英文 / "zh" 先中文, senses, unknown } 或 null（没有释义 / 设置里关了）
  view(word) {
    const pref = Store.prefs?.en_def || "auto", senses = this.get(word);
    if (pref === "off" || !senses) return null;
    const unknown = this.unknown(senses[0]);
    const mode = pref === "en" ? "en" : pref === "zh" ? "zh" : unknown.length <= 1 ? "en" : "zh";
    // 先英文时，第二个义项也要看得懂才放上来（不然一张卡上全是生词）
    const shown = mode === "en" && pref === "auto" ? senses.filter((s, i) => i === 0 || this.unknown(s).length <= 1) : senses;
    return { mode, senses: shown, unknown: new Set(shown.slice(0, 2).flatMap((s) => this.unknown(s))) };
  },
  // 释义原文：每个词都能点（查词浮层），还不认识的词标出来
  defHtml(text, unknown = new Set()) {
    return `<span class="sd-def" data-text="${esc(text)}">${text.split(/([A-Za-z][A-Za-z'’-]*)/).map((part, i) => {
      if (i % 2 === 0) return esc(part);
      const isNew = unknown.size && TechDict.forms(part.toLowerCase()).some((f) => unknown.has(f));
      return `<span class="w${isNew ? " sd-new" : ""}"${isNew ? ` title="这个词你可能还不认识，点一下看意思"` : ""}>${esc(part)}</span>`;
    }).join("")}</span>`;
  },
  sensesHtml(senses, unknown, { max = 2, examples = true } = {}) {
    return senses.slice(0, max).map(([pos, def, ex]) => `<div class="sd-sense"><span class="sd-pos">${esc(pos)}</span> ${this.defHtml(def, unknown)}
      ${examples && ex ? `<div class="sd-ex" data-text="${esc(ex)}">${esc(ex)} ${speakBtn(ex, "sm")}</div>` : ""}</div>`).join("");
  },
  credit: `<a class="sd-credit" href="https://simple.wiktionary.org" target="_blank" rel="noopener" title="释义来自 Simple English Wiktionary（CC BY-SA）">Simple English Wiktionary</a>`,
};

// ---------- 计算机英语词典（data/techdict.js，由 tools/build_techdict.py 生成，第一次查词时才加载） ----------
// 每条 { w 术语, full 英文全称, zh 中文, note 解释, alias 别名, cat 分类, common 日常也常见的词, ext 来自 computerese }
// 查词浮层里显示「💻 计算机」释义：设置里可选 auto（默认）/ always / off。
// auto：本句里出现的多词术语（Display Filter、Modbus TCP）总是显示；单个词如果日常也很常见（set、frame、port），
//       只有这段话里还有别的术语、看起来是技术文章时才显示，读小说时不打扰
const TechDict = {
  items: null, cats: [], map: null, phrases: null, loading: null,
  async load() {
    if (this.items) return true;
    try {
      if (!window.TECH_DICT) await (this.loading ||= loadScript("data/techdict.js"));
      this.build(window.TECH_DICT);
      return true;
    } catch { this.loading = null; return false; }
  },
  build(d) {
    this.cats = d.cats;
    this.items = d.items.map(([w, full, zh, note, alias, cat, flags], i) => ({ i, w, full, zh, note, alias, cat: d.cats[cat], ci: cat, common: !!(flags & 1), ext: !!(flags & 2) }));
    this.map = new Map();
    this.phrases = new Map(); // 多词术语：按其中每个单词索引，查词时在上下文里找整个短语
    for (const it of this.items) {
      for (const key of new Set([it.w, ...it.alias])) {
        const lo = key.toLowerCase();
        if (!this.map.has(lo)) this.map.set(lo, []);
        this.map.get(lo).push({ it, key });
        const toks = lo.split(/[\s/]+/).filter(Boolean);
        if (toks.length < 2) continue;
        const re = new RegExp(`(?<![A-Za-z0-9])${toks.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s/]+")}(?![A-Za-z0-9])`, "i");
        for (const t of new Set(toks.map((t) => t.replace(/[^a-z0-9]/g, "")).filter(Boolean))) {
          if (!this.phrases.has(t)) this.phrases.set(t, []);
          this.phrases.get(t).push({ it, key, re });
        }
      }
    }
  },
  // 大小写：全大写的缩写（TCP、SIP、ARM）只匹配全大写，免得把 sip（啜饮）、arm（手臂）当成术语；
  // 带大写的专名（Python、Go、IPsec）不匹配全小写的词；全小写的术语不限
  caseOk(key, word) {
    if (key === key.toLowerCase()) return true;
    const letters = key.replace(/[^A-Za-z]/g, "");
    if (letters.length > 1 && letters === letters.toUpperCase()) return word === key;
    return word !== word.toLowerCase();
  },
  // 简单还原复数和动词变形：PDUs → PDU，packets → packet，encapsulated → encapsulate
  forms(word) {
    const w = word, out = [w];
    if (/[^s]s$/i.test(w)) out.push(w.slice(0, -1));
    if (/(ch|sh|x|ss)es$/i.test(w)) out.push(w.slice(0, -2));
    if (/ies$/i.test(w)) out.push(w.slice(0, -3) + "y");
    if (/ed$/i.test(w)) out.push(w.slice(0, -2), w.slice(0, -1));
    if (/ing$/i.test(w)) out.push(w.slice(0, -3), w.slice(0, -3) + "e");
    return out;
  },
  // 一个词（或选中的短语）的全部计算机释义，同一条只出现一次
  senses(word) {
    if (!this.map) return [];
    const w = (word || "").trim().replace(/\s+/g, " ");
    const seen = new Set(), out = [];
    for (const f of this.forms(w)) {
      for (const { it, key } of this.map.get(f.toLowerCase()) || []) {
        if (seen.has(it) || !this.caseOk(key, f)) continue;
        seen.add(it);
        out.push(it);
      }
    }
    return out.sort((a, b) => a.ext - b.ext); // 自编的（带解释）排前面
  },
  // 上下文里包含这个词的多词术语，比如在「OSI layer 7」里点 layer → OSI layer
  phrasesIn(word, context) {
    if (!this.phrases || !context) return [];
    const seen = new Set(), out = [];
    for (const f of this.forms(word.toLowerCase())) {
      for (const p of this.phrases.get(f) || []) {
        if (seen.has(p.it) || p.key.toLowerCase() === word.toLowerCase()) continue;
        if (p.re.test(context)) { seen.add(p.it); out.push(p.it); }
      }
    }
    return out.sort((a, b) => a.ext - b.ext || b.w.length - a.w.length).slice(0, 4);
  },
  // 这段话像不像技术文章：除了 word 自己，还出现了至少两个不常见的术语（或者任意一个多词术语）
  isTechContext(context, word = "") {
    if (!this.map || !context) return false;
    const self = word.toLowerCase(), hits = new Set();
    for (const m of context.matchAll(/[A-Za-z][A-Za-z0-9.+#-]*[A-Za-z0-9+#]|[A-Za-z]/g)) {
      const t = m[0];
      if (t.toLowerCase() === self) continue;
      for (const it of this.senses(t)) if (!it.common && !it.ext) hits.add(it.w.toLowerCase());
      if (hits.size >= 2) return true;
    }
    for (const t of context.toLowerCase().match(/[a-z0-9]+/g) || []) {
      if (t === self) continue;
      for (const p of this.phrases.get(t) || []) if (!p.it.ext && p.re.test(context)) return true;
    }
    return false;
  },
  // 查词浮层用：按设置挑出要显示的释义 { senses, phrases }
  pick(word, context = "", mode = "auto") {
    if (mode === "off") return { senses: [], phrases: [] };
    let senses = this.senses(word);
    const phrases = this.phrasesIn(word, context);
    if (mode === "auto" && senses.some((s) => s.common || s.ext) && !phrases.length && !this.isTechContext(context, word))
      senses = senses.filter((s) => !s.common && !s.ext);
    return { senses: senses.slice(0, 4), phrases };
  },
  // 搜索：英文按术语、别名、英文全称的前缀，中文按中文和解释
  search(q, limit = 40) {
    if (!this.items) return [];
    q = (q || "").trim();
    if (!q) return [];
    const scored = [];
    if (/[㐀-鿿]/.test(q)) {
      for (const it of this.items) {
        const s = it.zh.includes(q) ? (it.zh.split(/[；;，,（(]/)[0] === q ? 0 : 1) : it.note.includes(q) ? 3 : -1;
        if (s >= 0) scored.push([s + (it.ext ? 0.5 : 0), it]);
      }
    } else {
      const lo = q.toLowerCase();
      for (const it of this.items) {
        let best = 9;
        for (const k of [it.w, ...it.alias]) {
          const kl = k.toLowerCase();
          best = Math.min(best, kl === lo ? 0 : kl.startsWith(lo) ? 2 : kl.includes(" " + lo) ? 4 : 9);
        }
        const fl = it.full.toLowerCase();
        if (fl) best = Math.min(best, fl === lo ? 1 : fl.startsWith(lo) ? 3 : fl.includes(" " + lo) ? 5 : 9);
        if (best < 9) scored.push([best + (it.ext ? 0.5 : 0), it]);
      }
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1].w.length - b[1].w.length).slice(0, limit).map((x) => x[1]);
  },
  byCat(ci) { return (this.items || []).filter((it) => it.ci === ci); },
  // 和这个术语相关的多词术语（查 port 时列出 port number、well-known port……）
  related(word) {
    const lo = word.toLowerCase(), seen = new Set();
    return (this.phrases?.get(lo.replace(/[^a-z0-9]/g, "")) || []).map((p) => p.it)
      .filter((it) => it.w.toLowerCase() !== lo && !seen.has(it) && seen.add(it)).slice(0, 16);
  },
  senseHtml(it, big = false) {
    return `<div class="tech-sense">
      <div><b class="tech-w">${esc(it.w)}</b>${it.full ? ` <span class="tech-full">${esc(it.full)}</span>` : ""}</div>
      <div class="tech-zh"><b>${esc(it.zh)}</b> <span class="tech-cat">${esc(it.cat)}</span></div>
      ${it.note ? `<div class="tech-note">${esc(it.note)}</div>` : ""}
      ${big && it.alias.length ? `<div class="small faint">也写作：${it.alias.map(esc).join("、")}</div>` : ""}</div>`;
  },
  // 浮层里的「💻 计算机」一栏
  popupHtml({ senses, phrases }) {
    if (!senses.length && !phrases.length) return "";
    return `<div class="tech-box">
      <div class="tech-head">💻 计算机</div>
      ${senses.map((it) => this.senseHtml(it)).join("")}
      ${phrases.length ? `<div class="tech-sub">本句中的术语</div>${phrases.map((it) => this.senseHtml(it)).join("")}` : ""}</div>`;
  },
  // 「查单词」面板详情里的整张卡片：全部释义 + 相关术语（可以点）
  detailHtml(word) {
    const senses = this.senses(word), rel = this.related(word);
    if (!senses.length && !rel.length) return "";
    return `<div class="tech-box tech-detail">
      <div class="tech-head">💻 计算机词典</div>
      ${senses.map((it) => this.senseHtml(it, true)).join("")}
      ${rel.length ? `<div class="tech-sub">相关术语</div><div class="tech-rel">${rel.map((it) => `<a href="#" data-dict-q="${esc(it.w)}">${esc(it.w)}</a>`).join("")}</div>` : ""}</div>`;
  },
};

// ---------- 翻书效果：拖动卡片时像翻书页一样，页角被掀起来、折过去 ----------
// 几何和小说 App 的「仿真翻页」、StPageFlip 同一个思路：被抓的页角从 C 移到 P（跟着手指走），折线是 CP 的垂直平分线；
// 折线外侧从卡片上剪掉（clip-path），沿折线翻过来变成「纸的背面」，下面露出下一页（能看到下一个词），折线两边加阴影。
// 统一按「从右边掀起、往左翻」计算，往右翻时左右镜像。卡片内容不用复制，只动 clip-path 和几层装饰；每帧最多画一次。
const PageCurl = {
  on: () => Store.prefs.card_anim !== "slide" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  _turned: false,
  // 刚翻完一页：下一张卡片不用再弹进来（翻开的就是它），只淡入
  justTurned() { const v = this._turned; this._turned = false; return v; },

  // side：-1 往左翻（从右边掀起），+1 往右翻；grab：手指按在页面上部（掀上角）、下部（掀下角）还是中间（整页竖着翻）
  // peek：下一页上显示的内容（HTML，可以不给）
  start(card, side, grab = "bottom", peek = "") {
    this.drop(card);
    const W = card.offsetWidth, H = card.offsetHeight, D = Math.hypot(W, H);
    const mk = (cls, html = "") => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; };
    const under = mk("pc-under", peek ? `<div class="pc-peek">${peek}</div>` : ""), shadeBox = mk("pc-box"), shade = mk("pc-shade");
    const wrap = mk("pc-flap-wrap"), flap = mk("pc-flap");
    shadeBox.appendChild(shade);
    under.appendChild(shadeBox);
    wrap.appendChild(flap);
    for (const el of [under, wrap]) Object.assign(el.style, { left: card.offsetLeft + "px", top: card.offsetTop + "px", width: W + "px", height: H + "px" });
    // 往右翻时镜像：下一页上的字不能反过来，所以只镜像阴影层和翻过来的纸背面
    if (side > 0) shadeBox.style.transform = wrap.style.transform = "scaleX(-1)";
    for (const el of [shade, flap]) Object.assign(el.style, { width: D + "px", height: 2 * D + "px" });
    card.before(under);
    card.after(wrap);
    card.classList.add("curling");
    const top = grab === "top";
    return (card._curl = { card, under, shade, wrap, flap, W, H, D, side, flat: grab === "mid", cy: top ? 0 : H, px: W, py: top ? 0 : H, raf: 0 });
  },

  // 把页角放到 (x, y)（按右边掀起的坐标），画出这一帧
  set(c, x, y) {
    const { W, H, D, cy } = c;
    // 书页连着书脊（左边）：页角离书脊不能超过一页宽，离另一个书脊角不能超过对角线，不然纸就「撕下来」了
    const lim = (ax, ay, r) => { const d = Math.hypot(x - ax, y - ay); if (d > r) { x = ax + ((x - ax) * r) / d; y = ay + ((y - ay) * r) / d; } };
    lim(0, cy, W);
    lim(0, H - cy, D);
    c.px = x; c.py = y;
    const len = Math.hypot(W - x, cy - y);
    if (len < 0.5) { c.card.style.clipPath = ""; c.wrap.style.visibility = c.under.style.visibility = "hidden"; return; }
    c.wrap.style.visibility = c.under.style.visibility = "";
    const Mx = (W + x) / 2, My = (cy + y) / 2, nx = (W - x) / len, ny = (cy - y) / len; // n 指向被掀起的那边
    const side = (X, Y) => (X - Mx) * nx + (Y - My) * ny;
    // 多边形按折线切开（Sutherland–Hodgman）
    const cut = (pts, keep) => {
      const out = [];
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length], a = side(...p), b = side(...q);
        if (keep(a)) out.push(p);
        if (keep(a) !== keep(b)) { const t = a / (a - b); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
      });
      return out;
    };
    const pad = 40; // 外面留一圈，卡片自己的阴影不被剪掉
    const kept = cut([[-pad, -pad], [W + pad, -pad], [W + pad, H + pad], [-pad, H + pad]], (v) => v < 0);
    const lifted = cut([[0, 0], [W, 0], [W, H], [0, H]], (v) => v >= 0)
      .map(([X, Y]) => { const d = 2 * side(X, Y); return [X - d * nx, Y - d * ny]; }); // 沿折线翻到另一边
    const mirror = (X) => (c.side > 0 ? W - X : X);
    const NONE = "polygon(0 0,0 0,0 0)";
    c.card.style.clipPath = kept.length >= 3 ? `polygon(${kept.map(([X, Y]) => `${mirror(X).toFixed(1)}px ${Y.toFixed(1)}px`).join(",")})` : NONE;
    // 翻过来的纸和阴影放在「沿折线」的坐标系里：u 垂直折线（折线上是 0），v 沿着折线，渐变就自然和折线平行
    const ax = -nx, ay = -ny, ang = Math.atan2(ay, ax);
    const frame = (rot) => `translate(${Mx.toFixed(1)}px,${My.toFixed(1)}px) rotate(${rot.toFixed(4)}rad) translate(0,${-D}px)`;
    const local = ([X, Y]) => { const dx = X - Mx, dy = Y - My; return `${(dx * ax + dy * ay).toFixed(1)}px ${(-dx * ay + dy * ax + D).toFixed(1)}px`; };
    const reach = Math.max(1, ...lifted.map(([X, Y]) => (X - Mx) * ax + (Y - My) * ay)); // 翻过来那部分有多宽
    c.flap.style.transform = frame(ang);
    c.flap.style.clipPath = lifted.length >= 3 ? `polygon(${lifted.map(local).join(",")})` : NONE;
    c.flap.style.setProperty("--reach", reach.toFixed(1) + "px");
    c.shade.style.transform = frame(ang + Math.PI);
    c.shade.style.setProperty("--reach", Math.min(70, reach * 0.6).toFixed(1) + "px");
  },

  // 跟着手指（1:1，翻起的页边和手指一样快）：dx 是朝书脊拖了多少（负数），fy 是手指离页角那条边的高度
  // 从上下部翻：页角在前 60px 里慢慢「升」到手指的高度，折线斜过来；从中间翻：页角贴着底边，整页竖着翻
  drag(c, dx, fy) {
    const { W, cy } = c;
    const x = W + Math.min(0, dx);
    const y = c.flat ? cy : cy + (fy - cy) * Math.min(1, Math.abs(dx) / 60);
    c.tx = x; c.ty = y;
    // 手指一帧可能报好几次位置（120Hz 屏），只在下一帧画一次
    if (!c.raf) c.raf = requestAnimationFrame(() => { c.raf = 0; if (c.card._curl === c) this.set(c, c.tx, c.ty); });
  },

  _anim(ms, step) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      let done = false;
      const end = () => { if (done) return; done = true; step(1); resolve(); };
      const tick = (now) => {
        if (done) return;
        const t = Math.min(1, (now - t0) / ms);
        if (t >= 1) return end();
        step(t);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(end, ms + 120); // 页面在后台时 requestAnimationFrame 不跑，也要能结束
    });
  },

  // 把这一页翻过去：从手指松开的位置接着翻（一开始最快，越来越慢，和手指的速度接得上）；没在拖（按键、点按钮）就从下角翻
  async turn(card, side, peek = "") {
    let c = card._curl;
    if (!c || c.side !== side) c = this.start(card, side, "bottom", peek);
    cancelAnimationFrame(c.raf); c.raf = 0;
    if (c.tx !== undefined) this.set(c, c.tx, c.ty); // 最后一次手指位置还没画的话先画上
    const x0 = c.px, y0 = c.py, { W, H, cy } = c;
    const up = c.flat ? 0 : cy === 0 ? 1 : -1;
    const left = Math.min(1, (x0 + W) / (2 * W)); // 还剩多少没翻
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    await this._anim(Math.round(170 + 230 * left), (t) => {
      const e = ease(t);
      this.set(c, x0 + (-W - x0) * e, y0 + (cy - y0) * e + up * H * 0.1 * left * Math.sin(Math.PI * e));
    });
    c.wrap.classList.add("pc-gone");
    this._turned = true;
  },

  // 没翻过去：落回原样
  async back(card) {
    const c = card._curl;
    if (!c) return;
    cancelAnimationFrame(c.raf); c.raf = 0;
    const x0 = c.px, y0 = c.py;
    await this._anim(180, (t) => { const e = 1 - Math.pow(1 - t, 2); this.set(c, x0 + (c.W - x0) * e, y0 + (c.cy - y0) * e); });
    if (card._curl === c) this.drop(card);
  },

  drop(card) {
    const c = card._curl;
    if (!c) return;
    cancelAnimationFrame(c.raf);
    c.under.remove();
    c.wrap.remove();
    card.style.clipPath = "";
    card.classList.remove("curling");
    card._curl = null;
  },
};

// 卡片评完分离开：翻书效果就把这一页翻过去，否则飞出去（记住了 / 没记住往两边，模糊往下）
// peek：翻页时下一页上显示的内容（单词卡显示下一个词）
function flyCard(card, g, peek = "") {
  const K = knownDir(), dir = g === 2 ? K : g === 0 ? -K : 0;
  card.classList.remove("dragging");
  const st = dir && $(`.fc-stamp.${dir === K ? "ok" : "no"}`, card);
  if (st) st.style.opacity = 1;
  if (typeof Sfx !== "undefined") {
    if (g === 2) Sfx.good();
    else if (g === 1) Sfx.ok();
    else Sfx.play([[330, 0.14, "sine", 0.05], [262, 0.18, "sine", 0.04, 0.08]]);
  }
  card.style.pointerEvents = "none";
  if (dir && PageCurl.on()) return PageCurl.turn(card, dir, peek);
  PageCurl.drop(card);
  card.classList.add("fly");
  card.style.transform = dir ? `translateX(${dir * 130}%) rotate(${dir * 24}deg)` : "translateY(40%) scale(.85)";
  card.style.opacity = 0;
  return new Promise((r) => setTimeout(r, 260));
}

// 拖动卡片（单词卡、短语和句子复习卡共用）：
// - 在卡片任何地方轻轻一滑就翻过去（像小说 App）：往一边拖了 24px 以上、松手时手指还在往这边走（或停住），
//   或者很快地一甩（10px 就够）；拖过去又往回拉就算取消，弹回原样
// - 几乎没动当作点击
// - skip 里的元素不能开始拖：电脑上要能在释义里选中文字（鼠标）
// - 手机上卡片的触摸全部自己处理（CSS touch-action: none，再加上 touchmove 里 preventDefault，iPhone 上整页也不会跟着上下动）：
//   只有背面的释义真的长得超出卡片、而且手指明显是竖着划（和水平夹角超过 63°）时才上下滚动释义，其他一律当成翻页
// - 手机上从按钮或可点的单词（touchSkip）开始：没动就是点它；动了照样算翻页 / 滚动
function bindSwipeCard(card, { busy, onSwipe, onTap, peek, skip = "button, a, .w", touchSkip = "button, a, .w" }) {
  let x0 = null, y0 = 0, dx = 0, axis = null, onSkip = false, trail = [], scroller = null, top0 = 0, glide = 0, dragged = false, curl = null, grab = "bottom", fy0 = 0;
  const stamps = () => [$(".fc-stamp.ok", card), $(".fc-stamp.no", card)];
  const MIN = 24, STAMP = 40; // 翻过去最少要拖多远；印章拖多远完全显示
  const LOCK = 6; // 动了这么多像素才判断方向
  // 能上下滚的只有卡片里面超出高度的区域（背面的释义），页面本身不滚
  const scrollerAt = (t) => {
    for (let n = t; n && n !== card.parentElement; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return null;
  };
  // iPhone Safari：光靠 touch-action 有时还是会整页上下动（回弹），触摸移动时直接拦下来，滚动和翻页都由下面自己做
  card.addEventListener("touchmove", (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  card.addEventListener("pointerdown", (e) => {
    cancelAnimationFrame(glide);
    dragged = false;
    const mouse = e.pointerType === "mouse";
    onSkip = !!e.target.closest(mouse ? skip : touchSkip);
    if (busy() || e.button !== 0 || (mouse && onSkip)) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; axis = null; curl = null;
    const r = card.getBoundingClientRect();
    const f = (e.clientY - r.top) / r.height;
    grab = f < 0.3 ? "top" : f > 0.7 ? "bottom" : "mid"; // 上部掀上角，下部掀下角，中间整页翻
    fy0 = e.clientY - r.top; // 手指按下时的高度（卡片坐标）
    trail = [[e.clientX, e.clientY, e.timeStamp]];
    scroller = mouse ? null : scrollerAt(e.target);
    top0 = scroller?.scrollTop || 0;
  });
  card.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!axis) {
      if (Math.hypot(mx, my) < LOCK) return;
      axis = scroller && Math.abs(my) > Math.abs(mx) * 2 ? "y" : "x";
      dragged = true;
      try { card.setPointerCapture(e.pointerId); } catch { /* 手指已经抬起 */ }
      if (axis === "x") card.classList.add("dragging");
    }
    trail.push([e.clientX, e.clientY, e.timeStamp]);
    while (trail.length > 2 && e.timeStamp - trail[0][2] > 100) trail.shift(); // 只看最近 0.1 秒的速度
    if (axis === "y") { scroller.scrollTop = top0 - my; return; }
    dx = mx;
    if (PageCurl.on()) {
      // 往哪边拖就往哪边翻；中途换了方向就换一边掀
      const side = dx < 0 ? -1 : 1;
      if (dx && (!curl || curl.side !== side)) curl = PageCurl.start(card, side, grab, peek?.() || "");
      if (curl) PageCurl.drag(curl, -Math.abs(dx), fy0 + my);
    } else card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const [ok, no] = stamps(), K = knownDir();
    if (ok) ok.style.opacity = Math.min(1, Math.max(0, (dx * K) / STAMP));
    if (no) no.style.opacity = Math.min(1, Math.max(0, (-dx * K) / STAMP));
  });
  const end = (e) => {
    if (x0 === null) return;
    x0 = null;
    const [x1, y1, t1] = trail[0], dt = e.timeStamp - t1;
    if (axis === "y") {
      // 松手后按速度再滑一段，慢慢停下（像浏览器自己的滚动）
      let v = dt > 0 ? (e.clientY - y1) / dt : 0;
      const s = scroller;
      let last = performance.now();
      const step = (now) => {
        const k = Math.min(3, (now - last) / 16.7); last = now;
        s.scrollTop -= v * 16.7 * k;
        v *= Math.pow(0.95, k);
        if (Math.abs(v) > 0.02) glide = requestAnimationFrame(step);
      };
      if (e.type !== "pointercancel" && Math.abs(v) > 0.1) glide = requestAnimationFrame(step);
      return;
    }
    if (axis === "x") {
      const K = knownDir();
      const v = dt > 0 ? (e.clientX - x1) / dt : 0; // 最近 0.1 秒的速度，像素 / 毫秒
      const toward = v * Math.sign(dx); // 正数：松手时还在往翻页方向走；负数：在往回拉
      const flick = Math.abs(dx) >= 10 && toward > 0.25;
      const swipe = Math.abs(dx) >= MIN && toward > -0.1;
      if (e.type !== "pointercancel" && (swipe || flick)) return onSwipe(dx * K > 0 ? 2 : 0, e);
      card.classList.remove("dragging");
      card.style.transform = "";
      if (curl) PageCurl.back(card);
      stamps().forEach((st) => st && (st.style.opacity = 0));
      return;
    }
    // 几乎没动：点卡片翻面；点在按钮、单词上的交给它们自己的点击
    if (e.type !== "pointercancel" && !onSkip) onTap?.();
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
  // 拖过、滚过之后不要再触发按钮或单词的点击
  card.addEventListener("click", (e) => { if (dragged) { dragged = false; e.stopPropagation(); e.preventDefault(); } }, true);
}

// 查单词面板：Ctrl+K 或侧栏的「查单词」打开；英文按前缀搜，中文按释义搜
// tech：只查计算机词典（没输入时按分类浏览）
function openDictSearch(initial = "", { tech = false } = {}) {
  closePopups();
  if ($(".ds-modal")) return;
  const { root, close } = modal(`
    <div class="ds">
      <div class="row ds-top"><input class="input ds-input" id="ds-q" autocomplete="off" spellcheck="false">
        <button class="btn sm ds-mode" id="ds-tech" title="只查计算机词典：网络、编程、系统、安全、工控、AI、技术文档常用词……">💻 计算机</button>
        <button class="btn ghost sm" data-close title="关闭 (Esc)">✕</button></div>
      <div class="ds-body"><div class="ds-list" id="ds-list"></div><div class="ds-detail" id="ds-detail"></div></div>
      <div class="small faint ds-foot" id="ds-foot"></div>
    </div>`);
  $(".modal", root).classList.add("ds-modal");
  const inp = $("#ds-q", root), list = $("#ds-list", root), detail = $("#ds-detail", root), modeBtn = $("#ds-tech", root);
  detail.addEventListener("click", (e) => { // 英文释义里的词：点了直接在面板里查
    const w = e.target.closest(".sd-box .w");
    if (w) { inp.value = w.textContent; browseCat = null; run(); }
  });
  // results 的每一项：英汉词典的 { word, trans, … }，计算机词典来的另带 tech: true
  let results = [], active = -1, seq = 0, techMode = tech, browseCat = null;
  const techLoaded = TechDict.load();
  const sdLoaded = SimpleDef.load();

  const empty = (html) => (detail.innerHTML = `<div class="ds-empty">${html}</div>`);
  const welcome = () => techMode
    ? empty(`<div class="big">💻</div>输入术语、缩写或中文，比如 TCP、encapsulation、封装<div class="small faint mt-s">也可以在左边按分类浏览</div>`)
    : empty(`<div class="big">🔍</div>输入单词、短语或中文开始搜索<div class="small faint mt-s">${Dict.ok ? "" : "当前只能搜索词书里的词，完整词典需要在桌面版中使用"}</div>`);
  const setMode = () => {
    modeBtn.classList.toggle("primary", techMode);
    modeBtn.classList.toggle("ghost", !techMode);
    inp.placeholder = techMode ? "搜索计算机术语，比如 PDU、Modbus、deprecated、协议" : "输入英文或中文，比如 happy、look forward、苹果";
    $("#ds-foot", root).textContent = techMode
      ? "↑ ↓ 选择 · Enter 朗读 · Esc 关闭 · 计算机词典由 EngNest 编写，另收 computerese-cross-references（MIT 协议）的术语对照"
      : "↑ ↓ 选择 · Enter 朗读 · Esc 关闭 · 英汉词典数据来自 ECDICT（MIT 协议）";
  };
  const techRow = (it) => ({ word: it.w, trans: it.zh, tech: true, phonetic: "", tag: "" });

  const drawList = () => {
    if (techMode && browseCat === null && !inp.value.trim()) {
      list.innerHTML = TechDict.cats.map((c, ci) => `<div class="ds-row" data-cat="${ci}"><div class="row"><b>${esc(c)}</b><span class="spacer"></span><span class="small faint">${TechDict.byCat(ci).length}</span></div></div>`).join("");
      return;
    }
    const back = techMode && browseCat !== null && !inp.value.trim() ? `<div class="ds-row ds-back" data-back>← ${esc(TechDict.cats[browseCat])}</div>` : "";
    list.innerHTML = back + (results.map((r, i) => `<div class="ds-row ${i === active ? "active" : ""}" data-i="${i}">
      <div class="row" style="gap:6px"><b class="ds-w">${esc(r.word)}</b>${inNotebook(r.word) ? `<span class="ds-star">★</span>` : ""}<span class="spacer"></span>${!techMode && (r.tech || TechDict.senses(r.word).length) ? `<span class="ds-tech" title="计算机词典里有">💻</span>` : ""}${Dict.tagsHtml(r, 2)}</div>
      <div class="ds-t">${esc(r.trans.split("\n")[0])}</div></div>`).join("")
      || (inp.value.trim() ? `<div class="ds-none small muted">没有找到「${esc(inp.value.trim())}」</div>` : ""));
  };

  const bindDetail = (word, item) => {
    $("#ds-star", detail).onclick = (e) => { e.currentTarget.classList.toggle("on", toggleNotebook(item)); drawList(); };
    $$("[data-dict-q]", detail).forEach((a) => (a.onclick = (e) => { e.preventDefault(); inp.value = a.dataset.dictQ; browseCat = null; run(); }));
    TTS.speak(word);
  };
  const headHtml = (word) => `<div class="row"><span class="ds-word">${esc(word)}</span>${speakBtn(word)}<button class="btn sm ghost" data-say="${esc(word)}" data-rate="0.6" title="慢速">🐢</button>
    <span class="spacer"></span><button class="star ${inNotebook(word) ? "on" : ""}" id="ds-star" title="加入生词本">★</button></div>`;

  const show = async (i) => {
    active = i;
    drawList();
    const r = results[i];
    if (!r) return;
    $(".ds-row.active", list)?.scrollIntoView({ block: "nearest" });
    const my = ++seq;
    await techLoaded;
    await sdLoaded;
    const found = await Dict.lookup(r.word);
    if (my !== seq) return;
    const techHtml = TechDict.detailHtml(r.word);
    // 只在计算机词典里有（Modbus TCP、Wireshark……）：只显示术语卡片
    if (!found && r.tech) {
      const it = TechDict.senses(r.word)[0];
      detail.innerHTML = headHtml(r.word) + techHtml;
      bindDetail(r.word, { w: r.word, ph: "", m: it ? [it.zh, it.note].filter(Boolean).join("  ") : r.trans });
      return;
    }
    const d = found || { ...r, defn: "", exchange: "", oxford: 0 };
    const local = WORD_MAP[d.word.toLowerCase()];
    const item = local || Dict.toItem(d);
    detail.innerHTML = `
      ${headHtml(d.word)}
      ${local?.ph || d.phonetic ? `<div class="pop-ipa">${esc(local?.ph || `/${d.phonetic}/`)}</div>` : ""}
      ${Dict.formNote(d)}
      <div class="row ds-badges">${Dict.tagsHtml(d)}${d.collins ? `<span class="badge brand" title="柯林斯星级，越多越常用">${"★".repeat(d.collins)}</span>` : ""}
        ${d.oxford ? `<span class="badge good" title="牛津 3000 核心词">牛津 3000</span>` : ""}${d.rank ? `<span class="small faint">词频第 ${d.rank} 位</span>` : ""}</div>
      ${techMode ? techHtml : ""}
      <div class="ds-trans">${d.trans.split("\n").map((l) => `<div>${esc(l)}</div>`).join("")}</div>
      ${techMode ? "" : techHtml}
      ${SimpleDef.get(d.word) && Store.prefs.en_def !== "off" ? `<div class="sd-box sd-detail"><div class="sd-label">📘 英文释义 · ${SimpleDef.credit}</div>${SimpleDef.sensesHtml(SimpleDef.get(d.word), new Set(SimpleDef.get(d.word).flatMap((s) => SimpleDef.unknown(s))), { max: 3 })}</div>` : ""}
      ${Dict.formsHtml(d) ? `<div class="ds-forms">${Dict.formsHtml(d)}</div>` : ""}
      ${local ? `<div class="small faint mt">📚 ${esc(unitLabel(local))}</div><div class="ds-local">${wordDetailHtml(local)}</div>` : ""}
      ${d.defn ? `<details class="mt-s"><summary class="small muted" style="cursor:pointer">英文释义</summary><div class="ds-defn">${esc(d.defn).replace(/\n/g, "<br>")}</div></details>` : ""}
      <div id="ds-tat"></div>`;
    tatoebaHtml($("#ds-tat", detail), d.word, d.exchange);
    bindDetail(d.word, item);
  };

  let timer = 0;
  const run = async () => {
    const q = inp.value.trim(), my = ++seq;
    await techLoaded;
    if (my !== seq) return;
    if (!q) {
      results = browseCat !== null && techMode ? TechDict.byCat(browseCat).map(techRow) : [];
      active = -1;
      drawList();
      if (results.length) show(0); else welcome();
      return;
    }
    if (techMode) {
      results = TechDict.search(q).map(techRow);
    } else {
      // 英汉词典的结果为主；计算机词典里完全对上的术语放最前面，其他前缀匹配的接在后面
      const res = await Dict.search(q);
      if (my !== seq) return;
      const have = new Set(res.map((r) => r.word.toLowerCase()));
      const tech = TechDict.search(q, 12).filter((it) => !have.has(it.w.toLowerCase()));
      const exact = tech.filter((it) => [it.w, ...it.alias].some((k) => k.toLowerCase() === q.toLowerCase()));
      results = [...exact.map(techRow), ...res, ...tech.filter((it) => !exact.includes(it)).slice(0, 8).map(techRow)];
    }
    active = -1;
    if (results.length) show(0);
    else { drawList(); empty(`没有找到「${esc(q)}」${!techMode && Dict.ok ? `<div class="small faint mt-s">可以在设置里下载完整词典（77 万条）</div>` : ""}`); }
  };
  inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) show((active + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (e.key === "Enter" && results[active]) TTS.speak(results[active].word);
  });
  list.onclick = (e) => {
    const c = e.target.closest("[data-cat]"), b = e.target.closest("[data-back]"), r = e.target.closest("[data-i]");
    if (c) { browseCat = +c.dataset.cat; run(); } else if (b) { browseCat = null; run(); } else if (r) show(+r.dataset.i);
    inp.focus();
  };
  modeBtn.onclick = () => { techMode = !techMode; browseCat = null; setMode(); run(); inp.focus(); };
  setMode();
  inp.value = initial;
  setTimeout(() => inp.focus(), 30);
  if (initial || techMode) run(); else welcome();
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

  // 计算机释义、英文释义（第一次用时要先加载数据）
  await Promise.all([TechDict.load(), SimpleDef.load()]);
  let tech = TechDict.pick(word, context, Store.prefs.tech_terms || "auto");

  const render = (item, fromAI = false) => {
    pop.innerHTML = `
      <div class="row"><span class="pop-word">${esc(item.w)}</span>${speakBtn(item.w, "sm")}${shadowBtn(item.w, { ph: item.ph || "" })}<span class="spacer"></span>
        <button class="star ${inNotebook(item.w) ? "on" : ""}" title="加入生词本">★</button></div>
      ${item.ph ? `<div class="pop-ipa">${esc(item.ph)}</div>` : ""}
      ${item.formNote || ""}
      ${item.tagsHtml ? `<div class="row ds-badges">${item.tagsHtml}</div>` : ""}
      ${item.m ? `<div class="pop-meaning">${esc(item.m).replace(/\s{2,}/g, "<br>")}</div>` : ""}
      ${!fromAI && Store.prefs.en_def !== "off" && SimpleDef.get(item.w) ? `<div class="pop-sd">📘 ${esc(SimpleDef.get(item.w)[0][1])}</div>` : ""}
      ${fromAI ? "" : TechDict.popupHtml(tech)}
      ${typeof morphHtml === "function" ? morphHtml(item.w) : ""}
      ${item.ex ? `<div class="pop-ex"><div class="en">${esc(item.ex)}</div><div class="zh">${esc(item.zh || "")}</div></div>` : ""}
      ${fromAI ? `<div class="small faint mt-s">由 AI 解释</div>` : ""}
      <div class="row mt-s"><a href="#" class="small" data-more>🔍 在词典里看详细</a></div>
      ${extra ? `<div class="pop-extra">${extra.html}</div>` : ""}`;
    $("[data-more]", pop).onclick = (e) => { e.preventDefault(); openDictSearch(item.w); };
    const also = $("[data-dict-q]", pop);
    if (also) also.onclick = (e) => { e.preventDefault(); openDictSearch(also.dataset.dictQ); };
    // 收进生词本时不带界面用的临时字段
    const save = { w: item.w, ph: item.ph, m: item.m || item.save, ex: item.ex, zh: item.zh };
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
  // 英汉词典里没有、计算机词典里有（Wireshark、Modbus、Logcat……）：不管设置，直接显示术语释义
  const only = TechDict.senses(word);
  if (only.length) {
    tech = TechDict.pick(word, context, "always");
    render({ w: only[0].w, ph: "", m: "", save: [only[0].zh, only[0].note].filter(Boolean).join("  ") });
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
    const it = lookupWord(part);
    const known = it ? ` known st-${wordStatus(it.w)}` : ""; // st-new 没学过 / st-learning 正在学 / st-mastered 掌握了
    const saved = inNotebook(part) ? " saved" : "";
    return `<span class="w${known}${saved}">${esc(part)}</span>`;
  }).join("");
}

// 一段文字的生词率：词书里有、但还没学过的词，占全文词数的比例（2% 以下读起来轻松，5% 以上就偏难了）
function textWordStats(texts) {
  let total = 0, fresh = 0, learning = 0;
  const freshSet = new Set();
  for (const t of texts) {
    for (const m of t.matchAll(/[A-Za-z][A-Za-z'’-]*/g)) {
      total++;
      const it = lookupWord(m[0]);
      if (!it) continue;
      const st = wordStatus(it.w);
      if (st === "new") { fresh++; freshSet.add(it.w.toLowerCase()); } else if (st === "learning") learning++;
    }
  }
  const rate = total ? fresh / total : 0;
  return { total, fresh, unique: freshSet.size, learning, rate, verdict: rate <= 0.02 ? "轻松" : rate <= 0.05 ? "合适" : "偏难" };
}
// 阅读页头部：生词率 + 「标出生词」开关
function wordMarkHtml(stats) {
  const pct = (stats.rate * 100).toFixed(1);
  return `<span class="mark-info" title="词书里还没学过的词占全文的比例：2% 以下轻松，2–5% 正合适，5% 以上偏难">生词率 ${pct}% · ${stats.verdict}（${stats.unique} 个没学过的词）</span>
    ${switchHtml("mark-switch", "标出生词", Store.prefs.mark_words, "浅色底 = 词书里还没学过的词，虚线 = 正在学的词")}`;
}
function bindWordMark(root, reader) {
  reader.classList.toggle("mark-words", !!Store.prefs.mark_words);
  const sw = $("#mark-switch", root);
  if (sw) sw.onchange = (e) => { Store.prefs.mark_words = e.target.checked; Store.save(); reader.classList.toggle("mark-words", e.target.checked); };
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
// opt.endef：单词卡片上按学习者水平先给英文释义或先给中文（见 SimpleDef）
function wordDetailHtml(item, opt = {}) {
  const exs = item.exs?.length ? item.exs : item.ex ? [[item.ex, item.zh]] : [];
  const zh = `<div class="fc-meaning">${esc(item.m).replace(/\s{2,}/g, "<br>")}</div>`;
  const sd = opt.endef ? SimpleDef.view(item.w) : null;
  const top = !sd ? zh
    : sd.mode === "en"
      ? `<div class="sd-box sd-main">${SimpleDef.sensesHtml(sd.senses, sd.unknown, { examples: false })}</div>
         <details class="sd-zh"><summary>看中文</summary>${zh}</details>`
      : `${zh}<div class="sd-box sd-sub"><div class="sd-label">📘 English · ${SimpleDef.credit}</div>${SimpleDef.sensesHtml(sd.senses, sd.unknown, { examples: false })}</div>`;
  return `
    ${top}
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
// 学习专注模式：卡片单独占一屏，页面上别的东西（标题、标签页、词书……）先藏起来，页面本身也不滚动，
// 左右滑卡片时不会误触成上下滚动。卡片上方的 ← 回到原来的页面（已经评过分的都已保存）；离开页面时自动退出
// exitTo：← 去哪个地址（复习一打开就开始的页面要回到别处，否则重新渲染又会直接进入卡片）；不给就重新渲染当前页面
function enterStudyFocus(container, signal, exitTo) {
  const hidden = [];
  for (let el = container; el && el.id !== "view" && el.parentElement; el = el.parentElement) {
    for (const sib of el.parentElement.children) {
      if (sib !== el && !sib.classList.contains("study-hidden")) { sib.classList.add("study-hidden"); hidden.push(sib); }
    }
  }
  document.body.classList.add("study-focus");
  $("#view")?.scrollTo(0, 0);
  // 学习界面整页固定，手机上手指怎么划页面都不上下动（iPhone 会整页回弹，CSS 拦不全）；查词浮层、弹窗里照常滚动
  document.addEventListener("touchmove", (e) => {
    if (e.cancelable && !e.target.closest?.(".modal-mask, .pop")) e.preventDefault();
  }, { passive: false, signal });
  // ← 按钮（卡片和完成页上都有 data-exit）：重新渲染当前页面，signal 被中止，这里恢复原样
  container.addEventListener("click", (e) => {
    if (!e.target.closest("[data-exit]")) return;
    if (exitTo && location.hash !== exitTo) location.hash = exitTo;
    else Router.render();
  });
  signal.addEventListener("abort", () => {
    document.body.classList.remove("study-focus");
    hidden.forEach((el) => el.classList.remove("study-hidden"));
  }, { once: true });
}
const STUDY_EXIT_BTN = `<button class="btn sm ghost fc-exit" data-exit title="返回（已经评过分的都已保存）" aria-label="返回">←</button>`;

function runFlashcards(container, queue, mode, signal, onFinish, { exitTo } = {}) {
  enterStudyFocus(container, signal, exitTo);
  SimpleDef.load(); // 英文释义：翻开之前一般就加载好了；没加载好就先只显示中文
  bindWordClicks(container); // 英文释义里的词可以点着查
  const total = queue.length;
  const q = [...queue];
  const retry = {};            // 答错的词回到队尾再来一次（最多 2 次）
  const stats = { known: 0, fuzzy: 0, unknown: 0 };
  let cur = null, revealed = false, done = 0;
  const history = []; // 每次评分前的状态，撤销时恢复
  const K = knownDir(), L = K < 0 ? "←" : "→", R = K < 0 ? "→" : "←";

  const next = () => {
    cur = q.shift();
    revealed = false;
    if (!cur) return finish();
    draw();
    TTS.speak(cur.w);
  };
  // 撤销上一次评分：恢复单词的记忆记录、经验值和这一组的进度，回到那张卡
  const undo = () => {
    const h = history.pop();
    if (!h || busy) return;
    if (h.graded) Undo.pop();
    if (h.xp) takeXP(h.xp, h.kind);
    q.splice(0, q.length, ...h.q);
    Object.assign(stats, h.stats);
    Object.keys(retry).forEach((k) => delete retry[k]);
    Object.assign(retry, h.retry);
    done = h.done;
    cur = h.cur;
    revealed = true;
    draw();
    toast(`已撤销「${cur.w}」的评分`);
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
        <div class="flash-progress">${STUDY_EXIT_BTN}<span>${done} / ${total}</span><div class="bar"><i style="width:${pct}%"></i></div><span>${tag}</span>
          ${history.length ? `<button class="btn sm ghost" data-undo title="撤销上一次评分（Ctrl+Z）">↶ 撤销</button>` : ""}</div>
        <div class="fc-stack ${enter ? (PageCurl.justTurned() ? "turned" : "enter") : ""} ${q.length ? "" : "last"} ${K > 0 ? "swap-dir" : ""}">
        <div class="card flashcard" id="fc">
          <div class="fc-stamp ok">记住了 ✓</div><div class="fc-stamp no">没记住 ✗</div>
          <div class="fc-top"><span class="fc-tag">${esc(unitLabel(cur))}</span>
            <button class="star ${inNotebook(cur.w) ? "on" : ""}" title="加入生词本">★</button></div>
          <div class="fc-word">${esc(cur.w)}</div>
          <div class="fc-ipa">${esc(cur.ph || "")} ${speakBtn(cur.w)}<button class="speak" data-shadow-cur title="跟读评测（Ctrl+M）">🎙️</button></div>
          ${revealed ? `
            <div class="fc-back ${enter ? "" : "reveal"}">${wordDetailHtml(cur, { endef: true })}</div>
            <div class="fc-actions">
              <button class="btn good lg" data-g="2">${L} 认识 <span class="kbd">3</span></button>
              <button class="btn warn lg" data-g="1">有点模糊 <span class="kbd">↓</span></button>
              <button class="btn bad lg" data-g="0">不认识 ${R} <span class="kbd">1</span></button>
            </div>` : `
            <div class="fc-actions"><button class="btn primary lg" data-reveal>${mode === "new" ? "看释义" : "想好了，看答案"} <span class="kbd">空格</span></button></div>
            <div class="small faint center fc-swipe-hint">认识的话不用翻开：${L} 记住了 · ${R} 没记住</div>`}
        </div></div>
        <div class="kbd-hint">${revealed ? `${L} 记住了 · ${R} 没记住 · ↓ 有点模糊（1 / 2 / 3 也可以）` : "先试着回忆词义，再按空格翻开"} · 也可以拖动卡片 · R 重听 · Ctrl+Z 撤销 · Ctrl+M 跟读评测</div>
      </div>`;
    const ub = $("[data-undo]", container);
    if (ub) ub.onclick = undo;
    $(".star", container).onclick = (e) => e.currentTarget.classList.toggle("on", toggleNotebook(cur));
    const rv = $("[data-reveal]", container);
    if (rv) rv.onclick = reveal;
    $$("[data-g]", container).forEach((b) => (b.onclick = (e) => swipe(+b.dataset.g, e)));
    bindDrag();
  };

  const reveal = () => { if (busy || revealed) return; revealed = true; draw(false); };

  // 卡片飞出去再进入下一张：记住了往左，没记住往右，模糊往下
  const swipe = async (g, evt) => {
    const card = $("#fc", container);
    if (busy || !card) return;
    busy = true;
    await flyCard(card, g, peekNext());
    busy = false;
    if (!signal.aborted) grade(g, evt);
  };

  // 拖动或轻轻一甩就算滑走（见 bindSwipeCard）；电脑上释义和例句区域不能拖（那里要能选中文字查词）
  // 翻页时下一页上露出下一个词（和翻过去以后卡片上的位置一样）
  const peekNext = () => (q[0] ? `<div class="fc-word">${esc(q[0].w)}</div><div class="fc-ipa">${esc(q[0].ph || "")}</div>` : "");
  const bindDrag = () => bindSwipeCard($("#fc", container), { busy: () => busy, onSwipe: swipe, onTap: () => { if (!revealed) reveal(); }, peek: peekNext, skip: "button, a, .fc-back, .w" });

  const grade = (g, evt) => {
    const h = { cur, q: [...q], stats: { ...stats }, retry: { ...retry }, done, graded: false, xp: 0, kind: null };
    history.push(h);
    if (WORD_MAP[cur.w.toLowerCase()]) {
      const isNew = gradeWord(cur.w, g);
      h.graded = true;
      if (!retry[cur.w]) { h.xp = isNew ? 2 : 1; h.kind = isNew ? "new" : "review"; addXP(h.xp, h.kind, evt); }
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
      <div class="flash-wrap"><div class="flash-progress">${STUDY_EXIT_BTN}</div><div class="card center fc-done" style="padding:40px">
        <div style="font-size:48px">🎉</div>
        <h2 class="mt-s">这一组完成啦！</h2>
        <p class="muted">共 ${total} 个词：认识 ${stats.known} · 模糊 ${stats.fuzzy} · 不认识 ${stats.unknown}</p>
        <p class="small faint">不认识和模糊的词会按记忆曲线安排在之后复习。</p>
        <div class="row" style="justify-content:center;margin-top:18px" data-finish-actions></div>
      </div></div>`;
    onFinish && onFinish($("[data-finish-actions]", container), stats);
  };

  onKey(signal, (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); return; }
    if (!cur || busy) return;
    if (e.key === "r" || e.key === "R") TTS.speak(cur.w);
    else if (e.key === "ArrowLeft") { e.preventDefault(); swipe(K < 0 ? 2 : 0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); swipe(K < 0 ? 0 : 2); }
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
