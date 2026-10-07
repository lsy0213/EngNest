// ============================================================
// EngNest 核心：工具函数、存储、发音、AI、路由、记忆曲线
// ============================================================

const App = { pages: {}, abort: null };

// ---------- 小工具 ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sample = (arr, n) => shuffle(arr).slice(0, n);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const today = () => fmtDate(new Date());
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

function toast(msg, type = "", ms = 2200) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  $("#toast-root").appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// 把 AI 回复里常见的 markdown 转成简单 HTML（加粗、代码、列表、换行）
function mdLite(text) {
  const lines = esc(text).split(/\r?\n/);
  let html = "", inList = false;
  for (const raw of lines) {
    const line = raw
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^#{1,6}\s*/, "");
    const li = line.match(/^\s*(?:[-*•]|\d+[.、)])\s+(.*)$/);
    if (li) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${li[1]}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim()) html += `<p>${line}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

// 句子规范化后切成单词，用于听写 / 翻译比对
function tokens(s) {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
}
// 最长公共子序列，返回 target 中每个词是否被匹配到
function lcsMatch(target, input) {
  const n = target.length, m = input.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = target[i] === input[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hitT = new Array(n).fill(false), hitI = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (target[i] === input[j]) { hitT[i] = hitI[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { hitT, hitI, common: dp[0][0] };
}

// 听写对照：把原文和自己写的逐词对齐。返回 [{t: "ok"|"miss"|"wrong"|"extra", w: 原文的词, y: 写的词}]
// miss = 漏写，wrong = 写错（y 是写的、w 是正确的），extra = 多写
function wordDiff(target, input) {
  const T = target.split(/\s+/).filter(Boolean), I = input.split(/\s+/).filter(Boolean);
  const norm = (w) => tokens(w).join(" ");
  const tn = T.map(norm), inn = I.map(norm);
  const n = T.length, m = I.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = tn[i] && tn[i] === inn[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && tn[i] && tn[i] === inn[j]) { ops.push({ t: "ok", w: T[i], y: I[j] }); i++; j++; }
    else if (j < m && (i >= n || dp[i][j + 1] > dp[i + 1][j])) { ops.push({ t: "extra", y: I[j] }); j++; }
    else if (i < n) { ops.push({ t: tn[i] ? "miss" : "ok", w: T[i] }); i++; }
    else { ops.push({ t: "extra", y: I[j] }); j++; }
  }
  // 相邻的「多写 + 漏写」合成「写错」
  const out = [];
  for (let k = 0; k < ops.length; k++) {
    const a = ops[k], b = ops[k + 1];
    if (b && ((a.t === "extra" && b.t === "miss") || (a.t === "miss" && b.t === "extra"))) {
      out.push({ t: "wrong", w: a.t === "miss" ? a.w : b.w, y: a.t === "extra" ? a.y : b.y });
      k++;
    } else out.push(a);
  }
  const words = tn.filter(Boolean).length;
  return { ops: out, score: words ? out.filter((x) => x.t === "ok" && norm(x.w)).length / words : 1 };
}

// 把一段英文切成句子（避开 Mr. / U.S. / 3.5 这类缩写和小数）
function splitSentences(text) {
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?]["”’)]?)\s+(?=["“‘(]?[A-Z0-9])/);
  const out = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    if (prev && (/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|No|Prof|Gen|Gov|Sen|Rep|Lt|Col|Capt|Mt)\.$/.test(prev) || /\b[A-Z]\.$/.test(prev))) out[out.length - 1] = prev + " " + p;
    else out.push(p);
  }
  return out.filter((s) => s.trim());
}

// ---------- 词典 ----------
// 词书：入门精选 / 四级 / 六级 / 雅思 / 托福 / 主题词汇。同一个词可能出现在多本词书里，学习进度按单词共享。
const BOOKS = window.WORD_BOOKS;
const BOOK_MAP = {};
const WORDS = [];    // 去重后的全部单词（查词、出题干扰项用）
const WORD_MAP = {}; // 小写单词 → 词条（优先用信息最丰富的四级 > 六级 > 雅思 > 托福 > 入门）
// 同一个词在多本词书里时，查词用信息最全的那本；行业词书只有词典释义，排在后面
const BOOK_PRIORITY = { cet4: 5, cet6: 4, ielts: 3, ielts_topic: 2.9, ielts_zj: 2.5, ielts_l179: 2.4, ielts_r538: 2.4, toefl: 2, core: 1, topic: 0.5, med: 0.2, tech: 0.2, law: 0.2, fin: 0.2 };

const WORD_POS = {}; // 小写单词 → 在 WORDS 里的位置（替换成信息更全的词条时用，避免每次 indexOf 全表扫描）
BOOKS.forEach((b) => {
  BOOK_MAP[b.id] = b;
  b.count = 0;
  b.units.forEach((u, ui) => {
    u.items = u.words.map(([w, ph, m, exs, phrases, mem, exam]) => {
      const item = { w, ph, m, exs, phrases, mem, exam, ex: exs[0]?.[0] || "", zh: exs[0]?.[1] || "", book: b.id, unit: ui };
      const key = w.toLowerCase();
      const old = WORD_MAP[key];
      if (!old) WORD_POS[key] = WORDS.push(item) - 1;
      if (!old || BOOK_PRIORITY[b.id] > BOOK_PRIORITY[old.book]) {
        if (old) WORDS[WORD_POS[key]] = item;
        WORD_MAP[key] = item;
      }
      return item;
    });
    b.count += u.items.length;
  });
});

const curBook = () => BOOK_MAP[Store.prefs.book] || BOOKS[0];
const bookItems = (b = curBook()) => b.units.flatMap((u) => u.items);
const unitLabel = (item) => {
  const b = BOOK_MAP[item.book];
  const u = b?.units[item.unit];
  return b && u ? `${b.title} · ${u.title}${u.en ? " " + u.en : ""}` : "";
};
// 选择题选项用的简短释义：只取第一个词性的前两个意思
function shortMeaning(item) {
  const first = item.m.split(/\s{2,}/)[0];
  const [pos, rest] = first.includes(". ") ? [first.slice(0, first.indexOf(". ") + 2), first.slice(first.indexOf(". ") + 2)] : ["", first];
  return pos + rest.split("；").slice(0, 2).join("；");
}

// 简单的词形还原：goes → go, studied → study, making → make ...
function lookupWord(raw) {
  const w = raw.toLowerCase().replace(/[’']s$/, "").replace(/[^a-z-]/g, "");
  if (!w) return null;
  if (WORD_MAP[w]) return WORD_MAP[w];
  const tries = [];
  if (w.endsWith("ies")) tries.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) tries.push(w.slice(0, -2));
  if (w.endsWith("s")) tries.push(w.slice(0, -1));
  if (w.endsWith("ied")) tries.push(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) tries.push(w.slice(0, -2), w.slice(0, -1), w.slice(0, -3));
  if (w.endsWith("ing")) tries.push(w.slice(0, -3), w.slice(0, -3) + "e", w.slice(0, -4));
  if (w.endsWith("ly")) tries.push(w.slice(0, -2));
  if (w.endsWith("iest") || w.endsWith("ier")) tries.push(w.replace(/i(est|er)$/, "y")); // happiest → happy
  if (w.endsWith("est")) tries.push(w.slice(0, -3), w.slice(0, -2), w.slice(0, -4)); // oldest → old, nicest → nice, biggest → big
  if (w.endsWith("er")) tries.push(w.slice(0, -2), w.slice(0, -1), w.slice(0, -3));
  for (const t of tries) if (WORD_MAP[t]) return WORD_MAP[t];
  return null;
}

// ---------- 存储 ----------
const DEFAULT_PROGRESS = () => ({
  version: 1,
  created: today(),
  xp: 0,
  words: {},          // 单词记忆状态 { word: {box, due, seen, wrong, first} }
  notebook: [],       // 生词本（单词）
  sentence_nb: [],    // 生词本里的短语和句子 [{en, zh, from, added}]
  highlights: {},     // 阅读高亮 { passageId: [{id, p: 段落序号, s, e: 字符位置, c: 颜色}] }
  grammar: {},        // { lessonId: {best, last, date} }
  reading: {},        // { passageId: {score, date} }
  custom_reading: [], // AI 生成的文章
  essays: [],         // 作文批改记录
  pron: {},           // 跟读评测成绩 { 规范化的英文: {best, last, n, date} }
  stats: { dictation: 0, dictation_ok: 0, speaking: 0, translate: 0, essay: 0, chat: 0 },
  days: {},           // { "2026-09-30": {xp, new, review} }
  prefs: {
    daily_new: 15, daily_goal: 50, auto_speak: true, book: "cet4",
    tts_engine: "neural", neural_voice: "en-US-AriaNeural", tts_voice: "", tts_rate: 0.9,
    shadow_listen: true, // 跟读评测时先听一遍原音再录
    companion_visible: false, companion_view: "front",
    skin: "cabinet", theme_mode: "auto", theme_character_positions: {}, // 每套角色主题独立保存悬浮位置
  },
});

function fillDefaults(target, defaults) {
  for (const k in defaults) {
    if (!(k in target)) target[k] = defaults[k];
    else if (defaults[k] && typeof defaults[k] === "object" && !Array.isArray(defaults[k]) && typeof target[k] === "object")
      fillDefaults(target[k], defaults[k]);
  }
  return target;
}

// ---------- 局域网访问：通过 HTTP 调用电脑上的 EngNest，接口形状和 pywebview.api 完全一样 ----------
const LAN_KEY = "engnest-lan-key";

function askLanCode(wrong) {
  return new Promise((resolve) => {
    $("#view").innerHTML = `<div class="page"><div class="card lan-login">
      <div style="font-size:44px">🪺</div><h2>EngNest · 局域网访问</h2>
      <p class="muted">${wrong ? esc(wrong === true ? "访问码不对，请再试一次。" : wrong) : "请输入电脑上「设置 → 局域网访问」里显示的 8 位访问码。"}</p>
      <input class="input" id="lan-code" maxlength="12" placeholder="8 位访问码（不分大小写）" autocomplete="off" autocapitalize="characters" spellcheck="false">
      <button class="btn primary lg" id="lan-go" style="width:100%;margin-top:12px">进入</button></div></div>`;
    const inp = $("#lan-code"), go = () => { if (inp.value.trim()) resolve(inp.value.trim()); };
    $("#lan-go").onclick = go;
    inp.onkeydown = (e) => { if (e.key === "Enter") go(); };
    inp.focus();
  });
}

async function tryHttpBridge() {
  const url = new URL(location.href);
  let key = url.searchParams.get("key");
  if (key) {
    // 扫码进来的链接带着访问码：记住后从地址栏去掉
    url.searchParams.delete("key");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  } else {
    try { key = localStorage.getItem(LAN_KEY) || ""; } catch { key = ""; }
  }
  const call = async (name, args = []) => {
    const r = await fetch("/api/" + name, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EngNest-Key": key },
      body: JSON.stringify({ args }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const err = new Error(d.error || `HTTP ${r.status}`); err.status = r.status; throw err; }
    return d.result;
  };
  for (let wrong = false; ;) {
    try {
      await call("ping");
      break;
    } catch (e) {
      if (e.status === 429) { key = await askLanCode(e.message); continue; } // 输错太多次被锁住了
      if (e.status !== 401) return false; // 不是 EngNest 的局域网服务（比如开发用的静态服务器）
      key = await askLanCode(wrong || !!key);
      wrong = true;
    }
  }
  try { localStorage.setItem(LAN_KEY, key); } catch { /* 隐私模式下存不了，下次再输一次 */ }
  window.pywebview = { api: new Proxy({}, { get: (_, name) => (...args) => call(String(name), args) }) };
  Store.remote = true;
  $("#view").innerHTML = `<div class="loading">正在打开小窝…</div>`;
  return true;
}

async function waitForBridge() {
  if (window.pywebview && window.pywebview.api) return true;
  // 桌面版用 file:// 打开；通过 http 打开说明是局域网访问或开发预览
  if (location.protocol.startsWith("http")) return tryHttpBridge();
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    window.addEventListener("pywebviewready", () => finish(true), { once: true });
    setTimeout(() => finish(!!(window.pywebview && window.pywebview.api)), 2500);
  });
}

// 列表里怎么认出「同一条记录」：删除时按它留墓碑，多设备合并时按它对齐（必须和 engnest/progress.py 的 LIST_ID 一致）
const recNorm = (s) => String(s ?? "").toLowerCase().split(/\s+/).filter(Boolean).join(" ");
const RECORD_ID = {
  notebook: (x) => recNorm(x.w),
  sentence_nb: (x) => recNorm(x.en),
  clips: (x) => `${x.video || ""}|${recNorm(x.en)}`,
};
// 删除一条记录：留一个墓碑，另一台设备上的旧数据合并时不会把它带回来
function markDeleted(kind, id) {
  ((Store.data.deleted ||= {})[kind] ||= {})[id] = Date.now();
}
// 重新加回来的记录：去掉墓碑，并打上修改时间
function markAdded(kind, id, rec) {
  const d = Store.data.deleted?.[kind];
  if (d) delete d[id];
  if (rec) rec.t = Date.now();
  return rec;
}

const Store = {
  bridge: false,
  remote: false, // 是否是局域网里的其他设备
  data: null,
  rev: 0,        // 电脑上进度的版本号，每写一次加一
  stale: false,  // 保存时发现别的设备写过
  _sent: {},     // 每个字段上次保存时的 JSON，用来找出改动过的字段
  _timer: null,
  _flushing: null,
  _drop: new Set(), // 要从进度里删掉的顶层字段
  async init() {
    this.bridge = await waitForBridge();
    let saved = null, notice = "";
    try {
      if (this.bridge) {
        const r = await pywebview.api.progress_load();
        saved = r.data;
        this.rev = r.rev;
        notice = r.notice;
      } else saved = JSON.parse(localStorage.getItem("engnest-progress") || "null");
    } catch (e) {
      console.error("读取进度失败", e);
    }
    this._adopt(saved || {});
    if (notice) setTimeout(() => toast(notice, "bad", 10000), 800);
  },
  // 换成一份新读到的进度（补上默认值；默认值算「没保存过」，下次保存时写进去）
  _adopt(saved) {
    this._sent = {};
    for (const k in saved) this._sent[k] = JSON.stringify(saved[k]);
    this.data = fillDefaults(saved, DEFAULT_PROGRESS());
  },
  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), 300);
  },
  // 改动过的字段：{字段: JSON 字符串}
  _changes() {
    const out = {};
    for (const k in this.data) {
      const j = JSON.stringify(this.data[k]);
      if (j !== this._sent[k]) out[k] = j;
    }
    return out;
  },
  async flush() {
    clearTimeout(this._timer);
    this._timer = null;
    if (!this.bridge) {
      try { localStorage.setItem("engnest-progress", JSON.stringify(this.data)); }
      catch (e) { console.error("保存进度失败", e); toast("保存进度失败", "bad"); }
      return;
    }
    while (this._flushing) await this._flushing; // 一次只发一个保存请求
    const strs = this._changes(), keys = Object.keys(strs), drop = [...this._drop];
    if (!keys.length && !drop.length) return;
    const patch = {};
    keys.forEach((k) => (patch[k] = JSON.parse(strs[k])));
    if (drop.length) patch.__drop = drop;
    this._flushing = (async () => {
      try {
        const r = await pywebview.api.progress_save(patch);
        keys.forEach((k) => (this._sent[k] = strs[k]));
        drop.forEach((k) => { this._drop.delete(k); delete this._sent[k]; });
        if (r.prev !== this.rev) this.stale = true;
        this.rev = r.rev;
        let merged = 0;
        for (const [k, v] of Object.entries(r.changed || {})) {
          // 合并后和本机不一样（另一台设备也改过）：本机在这段时间没再改这个字段，就换成合并后的
          if (!(k in this.data) || JSON.stringify(this.data[k]) === strs[k]) {
            this.data[k] = v;
            this._sent[k] = JSON.stringify(v);
            merged++;
          }
        }
        if (merged) { renderSidebarFoot(); renderNav(); }
      } catch (e) {
        console.error("保存进度失败", e);
        toast("保存进度失败：" + (e.message || e), "bad", 4000);
      }
    })();
    try { await this._flushing; } finally { this._flushing = null; }
  },
  // 电脑和手机共用一份进度：切回这个窗口时，如果别的设备写过，就拉最新的过来
  async syncFromOther(rerender = true) {
    if (!this.bridge || this._timer || this._flushing) return;
    try {
      const rev = await pywebview.api.progress_rev();
      if (rev === this.rev && !this.stale) return;
      if (Object.keys(this._changes()).length) { this.save(); return; } // 本机还有没保存的：先保存，合并结果会带回来
      const r = await pywebview.api.progress_load();
      if (this._timer || this._flushing) return;
      this._adopt(r.data);
      this.rev = r.rev;
      this.stale = false;
      renderSidebarFoot();
      if (rerender) Router.render();
      toast("已同步其他设备上的学习进度", "good");
    } catch (e) {
      console.warn("同步进度失败", e);
    }
  },
  // 重新读一遍（导入、恢复备份、重置之后）
  async reload() {
    if (!this.bridge) return;
    const r = await pywebview.api.progress_load();
    this._adopt(r.data);
    this.rev = r.rev;
    this.stale = false;
  },
  // 把一个顶层字段从进度里删掉（搬到别处存了）
  drop(key) {
    delete this.data[key];
    this._drop.add(key);
    this.save();
  },
  get prefs() { return this.data.prefs; },
};
window.addEventListener("beforeunload", () => Store.flush());
document.addEventListener("visibilitychange", () => {
  if (!Store.data) return;
  if (document.visibilityState === "visible") Store.syncFromOther();
  else Store.flush(); // 切到后台（手机锁屏、切应用）时马上保存
});
window.addEventListener("focus", () => { if (Store.data) Store.syncFromOther(); });

// ---------- 经验值 & 打卡 ----------
function dayRec(date = today()) {
  return (Store.data.days[date] ||= { xp: 0, new: 0, review: 0 });
}
function addXP(n, kind, evt) {
  const d = dayRec();
  d.xp += n;
  if (kind) d[kind] = (d[kind] || 0) + 1;
  Store.data.xp += n;
  Store.save();
  renderSidebarFoot();
  if (evt && evt.clientX) {
    const el = document.createElement("div");
    el.className = "xp-float";
    el.textContent = `+${n} XP`;
    el.style.left = evt.clientX + "px";
    el.style.top = evt.clientY - 20 + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}
// 撤回经验值（撤销评分时用）
function takeXP(n, kind) {
  const d = dayRec();
  d.xp = Math.max(0, d.xp - n);
  if (kind) d[kind] = Math.max(0, (d[kind] || 0) - 1);
  Store.data.xp = Math.max(0, Store.data.xp - n);
  Store.save();
  renderSidebarFoot();
}
// 卡片滑动方向：默认 ← 记住了；设置里可以改成 → 记住了。返回「记住了」的方向（-1 左 / 1 右）
const knownDir = () => (Store.prefs.swipe_right_known ? 1 : -1);
function streak() {
  const days = Store.data.days;
  let d = today(), n = 0;
  if (!(days[d]?.xp > 0)) d = addDays(d, -1);
  while (days[d]?.xp > 0) { n++; d = addDays(d, -1); }
  return n;
}

// ---------- 记忆曲线：FSRS（开源的现代间隔重复算法，ts-fsrs，比固定间隔准得多） ----------
// 每条记录：{box, due: 下次复习日期, seen, wrong, first, t, f: {s 记忆稳定度(天), d 难度(1–10), st 状态, r 复习次数, l 遗忘次数, lr 上次复习, sd 这次排的间隔}}
// box 是旧版 Leitner 的盒子号：现在由间隔换算出来，只用于「已掌握」等显示（间隔 ≥ 7 天算掌握）
const SRS_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60];
const MASTERED_BOX = 4;

const Fsrs = {
  _f: null,
  _key: "",
  f() {
    if (!window.FSRS) return null;
    const retention = Store.prefs.retention || 0.9;
    const key = String(retention);
    if (!this._f || this._key !== key) {
      // 这个软件按「天」安排复习，不用 FSRS 的分钟级短期学习步骤
      this._f = FSRS.fsrs(FSRS.generatorParameters({ request_retention: retention, enable_fuzz: true, enable_short_term: false, maximum_interval: 3650 }));
      this._key = key;
    }
    return this._f;
  },
  // 记录 → ts-fsrs 的卡片。旧版的 Leitner 记录按当时的间隔换算成记忆稳定度
  toCard(rec, now) {
    const F = window.FSRS, f = rec.f;
    const day = (d, h = 12) => new Date(`${d}T${String(h).padStart(2, "0")}:00:00`);
    if (f) {
      return { due: day(rec.due, 4), stability: f.s, difficulty: f.d, elapsed_days: 0, scheduled_days: f.sd || 0, learning_steps: 0,
        reps: f.r || 0, lapses: f.l || 0, state: f.st, last_review: f.lr ? day(f.lr) : undefined };
    }
    if (!rec.seen) return F.createEmptyCard(now);
    const ivl = Math.max(1, SRS_INTERVALS[rec.box] || 1);
    return { due: day(rec.due, 4), stability: ivl, difficulty: rec.wrong > rec.seen / 2 ? 7 : 5, elapsed_days: 0, scheduled_days: ivl,
      learning_steps: 0, reps: rec.seen, lapses: rec.wrong || 0, state: rec.box > 0 ? F.State.Review : F.State.Relearning,
      last_review: day(addDays(rec.due, -ivl)) };
  },
  // grade: 0 不认识 / 1 模糊 / 2 认识 / 3 太简单。更新 rec.due、rec.f、rec.box，返回间隔天数
  schedule(rec, grade) {
    const f = this.f();
    if (!f) { // 万一 ts-fsrs 没加载：退回旧的固定间隔
      rec.box = grade === 0 ? 0 : grade === 1 ? Math.max(1, rec.box - 1) : Math.min(rec.box + 1, SRS_INTERVALS.length - 1);
      const d = grade === 1 ? 1 : SRS_INTERVALS[rec.box];
      rec.due = addDays(today(), d);
      return d;
    }
    const F = window.FSRS, now = new Date();
    const rating = [F.Rating.Again, F.Rating.Hard, F.Rating.Good, F.Rating.Easy][grade] ?? F.Rating.Good;
    const { card } = f.next(this.toCard(rec, now), now, rating);
    const days = grade === 0 ? 0 : Math.max(1, Math.round(card.scheduled_days));
    rec.due = addDays(today(), days);
    rec.f = { s: Math.round(card.stability * 1000) / 1000, d: Math.round(card.difficulty * 1000) / 1000, st: card.state,
      r: card.reps, l: card.lapses, lr: today(), sd: days };
    let box = 0;
    if (grade !== 0) { box = 1; SRS_INTERVALS.forEach((x, i) => { if (x <= days) box = Math.max(box, i); }); }
    rec.box = box;
    return days;
  },
  // 照现在的状态，过 n 天还记得的概率（统计页用）
  retrievability(rec, daysLater = 0) {
    const s = rec.f?.s || Math.max(1, SRS_INTERVALS[rec.box] || 1);
    const last = rec.f?.lr || addDays(rec.due, -(rec.f?.sd || SRS_INTERVALS[rec.box] || 1));
    const elapsed = (new Date(today()) - new Date(last)) / 864e5 + daysLater;
    return window.FSRS ? FSRS.forgetting_curve(FSRS.FSRS6_DEFAULT_DECAY, Math.max(0, elapsed), s) : Math.pow(0.9, elapsed / s);
  },
};

// 复习记录（以后可以用自己的数据优化 FSRS 参数，也用于统计页）：[id, 时间戳, 评分, 间隔天数]
function logReview(id, grade, days) {
  const log = (Store.data.revlog ||= []);
  log.push([id, Date.now(), grade, days]);
  if (log.length > 30000) log.splice(0, log.length - 30000);
}

// grade: 0 不认识, 1 模糊, 2 认识, 3 太简单
function gradeWord(w, grade) {
  const isNew = !Store.data.words[w];
  const s = Store.data.words[w] || { box: 0, due: today(), seen: 0, wrong: 0, first: today() };
  const prev = JSON.stringify(s); // 撤销用
  const days = Fsrs.schedule(s, grade);
  s.seen++;
  s.t = Date.now();
  if (grade === 0) s.wrong++;
  Store.data.words[w] = s;
  logReview(w, grade, days);
  Undo.push(`「${w}」的评分`, () => {
    if (isNew) delete Store.data.words[w];
    else Store.data.words[w] = JSON.parse(prev);
    const log = Store.data.revlog || [];
    const i = log.findLastIndex((x) => x[0] === w);
    if (i >= 0) log.splice(i, 1);
    if (isNew) { const d = dayRec(); d.new = Math.max(0, (d.new || 0) - 1); }
  });
  Store.save();
  return isNew;
}

// ---------- 撤销：评错了可以撤回最近一次评分（Ctrl+Z 或卡片上的「撤销」） ----------
const Undo = {
  stack: [],
  push(label, fn) {
    this.stack.push({ label, fn, at: Date.now() });
    if (this.stack.length > 20) this.stack.shift();
  },
  // 撤销最近一次；返回描述，没有可撤销的返回空
  pop() {
    const it = this.stack.pop();
    if (!it) return "";
    it.fn();
    Store.save();
    renderNav();
    renderSidebarFoot();
    return it.label;
  },
  clear() { this.stack = []; },
};
function wordStatus(w) {
  const s = Store.data.words[w];
  if (!s) return "new";
  return s.box >= MASTERED_BOX ? "mastered" : "learning";
}
function dueWords() {
  const t = today();
  return Object.entries(Store.data.words)
    .filter(([w, s]) => s.due <= t && WORD_MAP[w.toLowerCase()])
    .sort((a, b) => a[1].box - b[1].box)
    .map(([w]) => WORD_MAP[w.toLowerCase()]);
}
function newWordsLeftToday() {
  return Math.max(0, Store.prefs.daily_new - (dayRec().new || 0));
}
function unlearnedWords(unit) {
  const b = curBook();
  const items = unit === undefined ? bookItems(b) : b.units[unit]?.items || [];
  return items.filter((x) => !Store.data.words[x.w]);
}

// ---------- 生词本 ----------
function inNotebook(w) {
  return Store.data.notebook.some((x) => x.w.toLowerCase() === w.toLowerCase());
}
function toggleNotebook(item) {
  const nb = Store.data.notebook;
  const i = nb.findIndex((x) => x.w.toLowerCase() === item.w.toLowerCase());
  if (i >= 0) { markDeleted("notebook", RECORD_ID.notebook(nb[i])); nb.splice(i, 1); toast("已从生词本移除"); }
  else {
    const rec = { w: item.w, ph: item.ph || "", m: item.m || "", ex: item.ex || "", zh: item.zh || "", added: today() };
    nb.unshift(markAdded("notebook", RECORD_ID.notebook(rec), rec));
    toast("已加入生词本 ⭐", "good");
  }
  Store.save();
  renderNav();
  return i < 0;
}

// ---------- 发音 ----------
// 优先用 Python 端的在线神经语音（更自然），失败时退回系统自带语音
const TTS = {
  voices: [],
  warned: false,
  audio: null,
  _resolve: null,
  seq: 0,
  neuralFailedAt: 0,
  offline: false, // 离线神经语音（Piper）下载好了没有
  init() {
    this.refreshOffline();
    if (!("speechSynthesis" in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang)); };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  async refreshOffline() {
    if (!Store.bridge) return;
    try { const s = await pywebview.api.offline_tts_status(); this.offline = !!(s.engine && s.voices.length); } catch { this.offline = false; }
  },
  voice() {
    const pref = Store.prefs.tts_voice;
    return this.voices.find((v) => v.name === pref)
      || this.voices.find((v) => /en[-_]US/i.test(v.lang))
      || this.voices[0];
  },
  useNeural() {
    // 在线语音失败后 1 分钟内不再尝试，避免断网时每次都要等超时
    return Store.bridge && (Store.prefs.tts_engine || "neural") === "neural" && Date.now() - this.neuralFailedAt > 60000;
  },
  paused: false,
  stop() {
    this.seq++;
    this.paused = false;
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this._resolve) { this._resolve(); this._resolve = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  },
  // 暂停 / 继续当前这一句（在线语音还在生成时暂停，生成好了也先不播）
  pause() {
    this.paused = true;
    if (this.audio) this.audio.pause();
    else if ("speechSynthesis" in window) speechSynthesis.pause();
  },
  resume() {
    this.paused = false;
    if (this.audio) this.audio.play().catch(() => {});
    else if ("speechSynthesis" in window) speechSynthesis.resume();
  },
  // voice：指定发音人（比如 AI 语伴用自己的声音），不传就用设置里选的
  async speak(text, rate, voice) {
    this.stop();
    const my = this.seq;
    rate = rate ?? Store.prefs.tts_rate;
    // 顺序：微软在线神经语音 → 离线神经语音（下载了的话）→ Windows 系统语音
    let fellBack = false;
    if (this.useNeural()) {
      let r;
      try { r = await pywebview.api.tts(text, voice || Store.prefs.neural_voice, rate); }
      catch (e) { r = { ok: false, error: String(e) }; }
      if (my !== this.seq) return; // 等待期间被新的朗读打断了
      if (r.ok) return this.play(r.audio);
      console.warn("在线语音失败：", r.error);
      this.neuralFailedAt = Date.now();
      fellBack = true;
    }
    if (Store.bridge && this.offline && Store.prefs.tts_engine !== "system") {
      let r;
      try { r = await pywebview.api.tts_offline(text, Store.prefs.offline_voice || "", rate); }
      catch (e) { r = { ok: false, error: String(e) }; }
      if (my !== this.seq) return;
      if (r.ok) {
        if (fellBack) toast("在线语音暂时连不上，已临时改用离线神经语音", "", 3500);
        return this.play(r.audio);
      }
      console.warn("离线语音失败：", r.error);
    }
    if (fellBack) toast("在线语音暂时不可用（可能没联网），已临时改用系统语音。可以在设置里下载离线神经语音，断网也自然。", "", 5000);
    return this.speakSystem(text, rate);
  },
  play(src) {
    return new Promise((res) => {
      const a = new Audio(src);
      this.audio = a;
      this._resolve = res;
      const done = () => { if (this.audio === a) { this.audio = null; this._resolve = null; } res(); };
      a.onended = done;
      a.onerror = done;
      if (!this.paused) a.play().catch(done);
    });
  },
  speakSystem(text, rate) {
    if (!("speechSynthesis" in window)) { toast("当前环境不支持语音朗读", "bad"); return Promise.resolve(); }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.voice();
    if (v) { u.voice = v; u.lang = v.lang; }
    else {
      u.lang = "en-US";
      if (!this.warned) { this.warned = true; toast("没有找到英文语音包，发音可能不标准。可在「设置」页查看安装方法。", "", 5000); }
    }
    u.rate = rate;
    return new Promise((res) => {
      this._resolve = res;
      u.onend = res;
      u.onerror = res;
      speechSynthesis.speak(u);
    });
  },
};

// ---------- AI ----------
const AI = {
  enabled: false,
  settings: null,
  async refresh() {
    if (!Store.bridge) { this.enabled = false; return; }
    try {
      this.settings = await pywebview.api.get_ai_settings();
      this.enabled = !!this.settings.enabled;
    } catch { this.enabled = false; }
    renderNav();
  },
  // opts.onDelta(到目前为止的全文, 新的一段)：边生成边显示（流式输出）；opts.json：让后端按 JSON 解析
  async chat(system, messages, opts = {}) {
    if (!Store.bridge) return { ok: false, error: "AI 功能需要在桌面版中使用。" };
    try {
      if (opts.onDelta) return await this._stream(system, messages, opts.onDelta);
      return await pywebview.api.ai_chat(system, messages, opts.json ? { json: true } : null);
    } catch (e) { return { ok: false, error: String(e) }; }
  },
  async _stream(system, messages, onDelta) {
    const sid = await pywebview.api.ai_stream_start(system, messages);
    let n = 0, text = "";
    for (;;) {
      const r = await pywebview.api.ai_stream_poll(sid, n);
      n = r.n;
      if (r.text) {
        text += r.text;
        try { onDelta(text, r.text); } catch (e) { console.warn(e); }
      }
      if (r.done) return r.result || { ok: false, error: "AI 没有返回结果，请重试" };
      await new Promise((res) => setTimeout(res, 120));
    }
  },
  ask(system, prompt, opts) {
    return this.chat(system, [{ role: "user", content: prompt }], opts);
  },
  // 让 AI 返回 JSON：后端从回复里稳妥地抠出 JSON；格式不对时把原回复给它看，再要一次
  async json(system, prompt) {
    const sys = system + "\nRespond with a single valid JSON object only. No markdown code fences, no extra text.";
    const msgs = [{ role: "user", content: prompt }];
    let r = await this.chat(sys, msgs, { json: true });
    if (!r.ok && r.bad_json) {
      r = await this.chat(sys, [...msgs, { role: "assistant", content: r.text || "" },
        { role: "user", content: "That was not a valid JSON object. Reply again with ONLY the JSON object, nothing else." }], { json: true });
    }
    if (!r.ok) return r.bad_json ? { ok: false, error: "AI 返回的格式有误，请重试一次。" } : r;
    return { ok: true, data: r.data };
  },
};
// AI 的回答边生成边显示在 box 里（简单 markdown 排版），返回最终结果
async function aiAnswer(box, system, prompt, loadingText) {
  box.innerHTML = aiLoading(loadingText);
  const r = await AI.ask(system, prompt, {
    onDelta: (t) => { if (box.isConnected) box.innerHTML = `<div class="ai-box streaming">${mdLite(t)}</div>`; },
  });
  if (box.isConnected) box.innerHTML = r.ok ? `<div class="ai-box">${mdLite(r.text)}</div>` : aiError(r.error);
  return r;
}

// ---------- AI 结果缓存（翻译、精讲）：存在电脑上的 ai_cache.db；浏览器预览时退回 localStorage ----------
const KV = {
  mem: {}, // ns → Map，读过的都留在内存里
  _m(ns) { return (this.mem[ns] ||= new Map()); },
  peek(ns, key) { return this._m(ns).get(String(key)); },
  async preload(ns) {
    if (!Store.bridge) return;
    try {
      const all = await pywebview.api.kv_all(ns);
      for (const k in all) this._m(ns).set(k, all[k]);
    } catch (e) { console.warn("读取缓存失败", e); }
  },
  async get(ns, key) {
    key = String(key);
    const m = this._m(ns);
    if (m.has(key)) return m.get(key);
    let v = null;
    if (Store.bridge) {
      try { v = (await pywebview.api.kv_get(ns, [key]))[key] ?? null; } catch { v = null; }
    } else {
      try { const s = localStorage.getItem(`engnest-kv:${ns}:${key}`); v = s ? JSON.parse(s) : null; } catch { v = null; }
    }
    if (v != null) m.set(key, v);
    return v;
  },
  async set(ns, key, value) {
    key = String(key);
    this._m(ns).set(key, value);
    if (Store.bridge) {
      try { await pywebview.api.kv_set(ns, key, value); } catch (e) { console.warn("缓存保存失败", e); }
    } else {
      try { localStorage.setItem(`engnest-kv:${ns}:${key}`, JSON.stringify(value)); } catch { /* 存不下就只留在内存里 */ }
    }
  },
  // 旧版本把这些存在学习进度里：搬过来
  async migrate() {
    if (!Store.bridge) return;
    for (const ns of ["line_notes", "film_zh"]) {
      const old = Store.data[ns];
      if (!old || typeof old !== "object") continue;
      try { await pywebview.api.kv_set_many(ns, old); Store.drop(ns); } catch (e) { console.warn("搬迁缓存失败", e); }
    }
    await Promise.all([this.preload("line_notes"), this.preload("film_zh"), this.preload("tutor")]);
  },
};

// LEARNER_PROFILE（给 AI 看的学习者水平）按水平测试结果变化，定义在 pages/level.js

// ---------- 导航 & 路由 ----------
const NAV = [
  { id: "home", ico: "🏠", label: "首页" },
  { id: "words", ico: "📚", label: "单词" },
  { id: "course", ico: "🧭", label: "短语与句子" },
  { id: "grammar", ico: "🧩", label: "语法" },
  { id: "listening", ico: "🎧", label: "听力" },
  { id: "speaking", ico: "🎙️", label: "口语" },
  { id: "reading", ico: "📖", label: "阅读" },
  { id: "video", ico: "🎬", label: "影视精听" },
  { id: "writing", ico: "✍️", label: "写作" },
  { id: "ielts", ico: "🎓", label: "雅思" },
  { id: "tutor", ico: "🤖", label: "AI 语伴" },
  { id: "life", ico: "🎭", label: "人生剧场" },
  { sep: true },
  { id: "notebook", ico: "⭐", label: "生词本" },
  { id: "settings", ico: "⚙️", label: "设置", foot: true }, // 放在侧边栏最底部，和收起按钮同一行
];

function renderNav() {
  const nav = $("#nav");
  if (!nav || !Store.data) return;
  // 连词成句、句子跟打听写并入了短语与句子，主题词汇和单词打字并入了单词
  const cur = { about: "settings", stats: "home", level: "home", sitcom: "life", builder: "course", topics: "words", book: "reading", ireading: "ielts", ilisten: "ielts", ispeak: "ielts", iwrite: "ielts" }[Router.current().page] || Router.current().page;
  const due = dueWords().length;
  const item = (n) => {
    if (n.sep) return `<div class="nav-sep"></div>`;
    let badge = "";
    if (n.id === "words" && due) badge = `<span class="badge brand" title="待复习">${due}</span>`;
    const sdue = n.id === "course" && typeof SentSRS !== "undefined" ? SentSRS.count() : 0;
    if (sdue) badge = `<span class="badge brand" title="短语和句子待复习">${sdue}</span>`;
    const nbN = Store.data.notebook.length + (Store.data.sentence_nb || []).length;
    if (n.id === "notebook" && nbN) badge = `<span class="badge">${nbN}</span>`;
    if (n.id === "tutor" && !AI.enabled) badge = `<span class="badge" title="未配置 AI">未开启</span>`;
    return `<a class="nav-item ${cur === n.id ? "active" : ""}" href="#/${n.id}" title="${n.label}"><span class="ico">${n.ico}</span><span class="label">${n.label}</span>${badge}</a>`;
  };
  nav.innerHTML = NAV.filter((n) => !n.foot).map(item).join("");
  const foot = $("#nav-foot");
  if (foot) foot.innerHTML = NAV.filter((n) => n.foot).map(item).join("");
}

// 界面风格和深浅色（记在设置里）
const SKINS = [
  ["yarn", "🌸 复古花线手札", "原画取色 · 耳边花饰、毛线球、飘带与小猫", ["#EDE6DC", "#D6DAE3", "#B27F7C"]],
  ["garden", "🎀 月桂蔷薇", "缎带剪贴簿 · 旧报撕纸 · 珍珠蕾丝 · 邮票压花", ["#E3DCCF", "#86C9BF", "#865C4F"], "img/skin/garden-ribbon.jpg"],
  ["glass", "🤍 银雾流光", "白纸手账 · 尤加利与洋甘菊 · 浅蓝蝴蝶 · 虹彩光碟", ["#F4F4F1", "#A9BEB6", "#B6DCE2"], "img/skin/glass-character.png"],
  ["starry", "✦ 星河晚歌", "蕾丝珍珠 · 新月星坠 · 丁香格纹 · 叶星", ["#294C4C", "#A88D9F", "#9CC0A8"], "img/skin/star-character.png"],
  ["mintchoco", "🍫 薄荷可可", "薄荷可可配色 · 波点蝴蝶结 · 蕾丝马卡龙 · 猫耳少女", ["#B6D5C0", "#8E7F72", "#A9CEDA"], "img/skin/mintchoco-character.jpg"],
  ["cabinet", "🏛️ 珍藏手稿", "象牙纸 · 油画撕边 · 洛可可卷草 · 酒红批注", ["#ECE6DB", "#6E7C6B", "#8A2232"], "css/skin/cabinet-landscape.svg"],
  ["classic", "🍂 暖橙经典", "原来的米白配暖橙", ["#FBF7F0", "#F8E7D6", "#C2702C"]],
];
function applySkin() {
  const d = document.documentElement, p = Store.prefs;
  d.dataset.skin = SKINS.some(([id]) => id === p.skin) ? p.skin : "cabinet";
  if (p.theme_mode === "light" || p.theme_mode === "dark") d.dataset.theme = p.theme_mode;
  else delete d.dataset.theme;
}

// 侧边栏收起 / 展开（记在设置里）
function applyNavCollapsed() {
  const on = !!Store.prefs.nav_collapsed;
  document.body.classList.toggle("nav-collapsed", on);
  const b = $("#nav-toggle");
  if (b) {
    b.title = on ? "展开侧边栏" : "收起侧边栏";
    b.setAttribute("aria-label", b.title);
    b.querySelector(".ico").textContent = on ? "»" : "«";
  }
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#nav-toggle")) return;
  Store.prefs.nav_collapsed = !Store.prefs.nav_collapsed;
  Store.save();
  applyNavCollapsed();
});

function renderSidebarFoot() {
  const el = $("#streak-mini");
  if (!el) return;
  el.innerHTML = `<span>🔥 连续 <b>${streak()}</b> 天</span><span>今日 <b>${dayRec().xp}</b> XP</span>`;
}

const Router = {
  current() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, ...params] = h.split("/").map(decodeURIComponent);
    return { page: App.pages[page] ? page : "home", params };
  },
  go(path) { location.hash = "#/" + path; },
  async render() {
    const { page, params } = this.current();
    if (App.abort) App.abort.abort();
    App.abort = new AbortController();
    TTS.stop();
    closePopups();
    App.selectionExtra = null;
    App.shadowTarget = null;
    renderNav();
    const view = $("#view");
    view.innerHTML = "";
    view.scrollTop = 0;
    const root = document.createElement("div");
    root.className = "page";
    view.appendChild(root);
    try {
      await App.pages[page].render(root, params, App.abort.signal);
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="card"><b>页面出错了</b><pre class="small muted">${esc(e.stack || e)}</pre></div>`;
    }
  },
};
window.addEventListener("hashchange", () => Router.render());

// 录音不可用时的提示：http 访问（局域网）时浏览器不开放麦克风
function micUnavailable() {
  const msg = !window.isSecureContext
    ? "通过 http 访问时，浏览器不允许录音。请在电脑上的「设置 → 局域网访问」打开 HTTPS，然后用 https:// 开头的地址打开。"
    : "当前环境不支持录音";
  toast(msg, "bad", 5000);
}

// 同一页面里重新开始一轮练习时，先注销上一轮的事件监听，避免一次按键触发多次
function freshSignal(owner, pageSignal) {
  if (owner._ctl) owner._ctl.abort();
  const ctl = (owner._ctl = new AbortController());
  pageSignal.addEventListener("abort", () => ctl.abort(), { once: true });
  return ctl.signal;
}

// 页面内的键盘快捷键（输入框里不触发）
function onKey(signal, handler) {
  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea, select") || $(".modal-mask")) return;
    handler(e);
  }, { signal });
}
