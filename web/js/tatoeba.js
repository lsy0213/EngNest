// ============================================================
// Tatoeba 英汉例句（data/tatoeba.js，约 3.6 万对，CC BY 2.0 FR）：用到时才加载
// 查词时给出包含这个词（含各种变形）的真实例句和中文翻译；挖词填空也可以用它当句子来源
// ============================================================
const Tatoeba = {
  idx: null,
  async ready() {
    if (!window.TATOEBA) await loadScript("data/tatoeba.js");
    if (!this.idx) {
      // 小写单词 → 句子下标（句子已经按长度排好，先出现的是短句）
      this.idx = new Map();
      TATOEBA.forEach(([en], i) => {
        for (const w of new Set(en.toLowerCase().replace(/[’]/g, "'").match(/[a-z][a-z'-]*/g) || [])) {
          const a = this.idx.get(w);
          if (a) { if (a.length < 400) a.push(i); } else this.idx.set(w, [i]);
        }
      });
    }
    return true;
  },
  // forms：这个词的各种形式（went、gone、going……），没给就按规则猜几个
  async find(word, forms = [], n = 6) {
    await this.ready();
    const w = word.toLowerCase();
    const all = new Set([w, ...forms.map((f) => f.toLowerCase()), w + "s", w + "es", w + "ed", w + "d", w + "ing", w.replace(/e$/, "") + "ing", w.replace(/y$/, "ies"), w.replace(/y$/, "ied")]);
    if (w.includes(" ")) {
      // 词组：找同时包含所有词、而且顺序挨着的句子
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`, "i");
      const first = this.idx.get(w.split(/\s+/).sort((a, b) => b.length - a.length)[0]) || [];
      return first.filter((i) => re.test(TATOEBA[i][0])).slice(0, n).map((i) => TATOEBA[i]);
    }
    const hits = new Set();
    for (const f of all) for (const i of this.idx.get(f) || []) hits.add(i);
    return [...hits].sort((a, b) => a - b).slice(0, n).map((i) => TATOEBA[i]);
  },
};

// 词典详情里的「真实例句」：d 是内置词典的查词结果（exchange 里有各种变形）
async function tatoebaHtml(box, word, exchange = "") {
  const forms = (exchange || "").split("/").map((x) => x.split(":")[1]).filter(Boolean);
  box.innerHTML = `<div class="small faint mt">📚 正在找例句……</div>`;
  let list;
  try { list = await Tatoeba.find(word, forms); } catch { box.innerHTML = ""; return; }
  if (!box.isConnected) return;
  if (!list.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="ds-tat"><div class="small muted"><b>📚 真实例句</b> · 来自 Tatoeba（CC BY 2.0 FR）</div>
    ${list.map(([en, zh]) => `<div class="ds-tat-row"><div style="flex:1;min-width:0"><div class="en">${esc(en)}</div><div class="small muted">${esc(zh)}</div></div>
      ${speakBtn(en, "sm")}<button class="star ${inSentNb(en) ? "on" : ""}" data-tat-en="${esc(en)}" data-tat-zh="${esc(zh)}" title="收藏到生词本（会安排复习）">★</button></div>`).join("")}</div>`;
  box.onclick = (e) => { const s = e.target.closest("[data-tat-en]"); if (s) s.classList.toggle("on", toggleSentNb({ en: s.dataset.tatEn, zh: s.dataset.tatZh, from: "Tatoeba 例句" })); };
}
