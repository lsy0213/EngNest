// 单词表导入导出：和 Anki、Excel、其他背单词软件互通
// 导出：生词本单词 / 短语句子 → Anki（制表符分隔，Anki「导入」直接认）；学过的全部单词 → CSV（Excel 能打开）
// 导入：一行一个词（或「词,释义」「词<Tab>释义」，Anki 导出的笔记也行），单词进生词本，句子进短语句子生词本
const WordIO = {
  // 下载 / 保存文字文件：桌面版弹保存对话框，浏览器里直接下载
  async save(name, text) {
    if (Store.bridge && !Store.remote) {
      const p = await pywebview.api.save_text_file(name, text);
      if (p) toast("已导出到 " + p, "good", 5000);
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
  async open() {
    if (Store.bridge && !Store.remote) return pywebview.api.open_text_file();
    return new Promise((resolve) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".txt,.csv,.tsv";
      inp.onchange = async () => {
        const f = inp.files[0];
        resolve(f ? { name: f.name, text: await f.text() } : null);
      };
      inp.click();
    });
  },

  tsvCell: (s) => String(s ?? "").replace(/[\t\r\n]+/g, " ").trim(),
  csvCell: (s) => { const v = String(s ?? ""); return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; },

  exportNotebookAnki() {
    const nb = Store.data.notebook;
    if (!nb.length) return toast("生词本里还没有单词");
    const lines = nb.map((x) => {
      const it = WORD_MAP[x.w.toLowerCase()] || x;
      const back = [it.ph, it.m, it.ex ? `<i>${esc(it.ex)}</i>` : "", it.zh].filter(Boolean).map((s) => esc(String(s)).replace(/&lt;(\/?i)&gt;/g, "<$1>")).join("<br>");
      return [this.tsvCell(x.w), this.tsvCell(back), "EngNest 生词本"].join("\t");
    });
    this.save(`EngNest-生词本-${today()}.txt`, "#separator:tab\n#html:true\n#tags column:3\n" + lines.join("\n") + "\n");
  },
  exportSentencesAnki() {
    const sn = sentNb();
    if (!sn.length) return toast("生词本里还没有短语和句子");
    const lines = sn.map((x) => [this.tsvCell(x.zh || "（没有翻译）"), this.tsvCell(x.en), "EngNest 短语句子"].join("\t"));
    this.save(`EngNest-短语句子-${today()}.txt`, "#separator:tab\n#html:false\n#tags column:3\n" + lines.join("\n") + "\n");
  },
  exportLearnedCsv() {
    const rows = Object.entries(Store.data.words);
    if (!rows.length) return toast("还没有学过的单词");
    const head = ["单词", "音标", "释义", "状态", "下次复习", "复习次数", "忘记次数", "记忆稳定度(天)", "第一次学"];
    const body = rows.map(([w, s]) => {
      const it = WORD_MAP[w.toLowerCase()] || {};
      return [w, it.ph || "", it.m || "", wordStatus(w) === "mastered" ? "已掌握" : "学习中", s.due, s.seen, s.wrong || 0, s.f?.s ?? "", s.first || ""].map(this.csvCell).join(",");
    });
    this.save(`EngNest-学过的单词-${today()}.csv`, head.join(",") + "\n" + body.join("\n") + "\n");
  },

  // 解析导入的文字：返回 [{front, back}]
  parse(text) {
    const strip = (s) => String(s).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
    const out = [];
    for (let line of text.split(/\r?\n/)) {
      if (!line.trim() || line.startsWith("#")) continue;
      let cols;
      if (line.includes("\t")) cols = line.split("\t");
      else if (/^"/.test(line) || line.includes(",")) cols = this.splitCsv(line);
      else cols = [line];
      const front = strip(cols[0] || ""), back = strip(cols[1] || "");
      if (front && /[A-Za-z]/.test(front)) out.push({ front, back });
      else if (back && /[A-Za-z]/.test(back)) out.push({ front: back, back: front }); // 中文在前、英文在后的卡片
    }
    return out;
  },
  splitCsv(line) {
    const cols = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { cols.push(cur); cur = ""; }
      else cur += c;
    }
    cols.push(cur);
    return cols;
  },

  async importFile() {
    const f = await this.open();
    if (!f) return;
    if (f.error) return toast(f.error, "bad", 4000);
    const items = this.parse(f.text);
    if (!items.length) return toast("没有在文件里找到英文单词或句子", "bad", 4000);
    let words = 0, sents = 0, skipped = 0;
    const m = modal(`<h3>正在导入 ${esc(f.name)}</h3><p class="muted" id="imp-prog">0 / ${items.length}</p>`);
    for (let i = 0; i < items.length; i++) {
      const { front, back } = items[i];
      const isSentence = front.trim().split(/\s+/).length > 3;
      if (isSentence) {
        if (inSentNb(front)) skipped++;
        else { const rec = { en: front, zh: back, from: "导入", added: today() }; sentNb().push(markAdded("sentence_nb", recNorm(front), rec)); sents++; }
      } else if (inNotebook(front)) skipped++;
      else {
        let it = WORD_MAP[front.toLowerCase()] || lookupWord(front);
        if (!it && Store.bridge) {
          try { const d = await Dict.lookup(front); if (d) it = Dict.toItem ? Dict.toItem(d) : { w: d.word, ph: d.phonetic ? `/${d.phonetic}/` : "", m: (d.trans || "").split("\n").join("  ") }; } catch { /* 查不到就用文件里的释义 */ }
        }
        const rec = { w: it?.w || front, ph: it?.ph || "", m: back || it?.m || "", ex: it?.ex || "", zh: it?.zh || "", added: today() };
        if (inNotebook(rec.w)) { skipped++; continue; }
        Store.data.notebook.push(markAdded("notebook", RECORD_ID.notebook(rec), rec));
        words++;
      }
      if (i % 20 === 0) { const p = $("#imp-prog", m.root); if (p) p.textContent = `${i + 1} / ${items.length}`; await new Promise((r) => setTimeout(r)); }
    }
    m.close();
    Store.save();
    renderNav();
    toast(`导入了 ${words} 个单词、${sents} 条短语句子${skipped ? `，${skipped} 条已经在生词本里` : ""}`, "good", 5000);
    Router.render();
  },

  // 生词本页上的「导入 / 导出」
  openMenu() {
    const m = modal(`<h3>导入 / 导出</h3>
      <div class="field"><label>导出到 Anki</label>
        <div class="row" style="flex-wrap:wrap"><button class="btn" data-x="anki-w">生词本单词</button><button class="btn" data-x="anki-s">短语和句子</button></div>
        <span class="help">导出的 .txt 在 Anki 里用「文件 → 导入」打开就行（已经写好了分隔符和标签）。</span></div>
      <div class="field mt"><label>导出到 Excel</label>
        <div class="row"><button class="btn" data-x="csv">学过的全部单词（CSV，带复习记录）</button></div></div>
      <div class="field mt"><label>导入</label>
        <div class="row"><button class="btn primary" data-x="imp">⬇ 导入单词表…</button></div>
        <span class="help">支持 .txt / .csv / .tsv：一行一个词，或者「单词,释义」「单词&lt;Tab&gt;释义」，Anki 导出的笔记（纯文本）也可以。单词进生词本，超过 3 个词的进「短语和句子」。</span></div>
      <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-x]");
      if (!b) return;
      const x = b.dataset.x;
      if (x === "imp") { m.close(); this.importFile(); }
      else if (x === "anki-w") this.exportNotebookAnki();
      else if (x === "anki-s") this.exportSentencesAnki();
      else if (x === "csv") this.exportLearnedCsv();
    });
  },
};
