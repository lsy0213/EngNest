// 生词本：学习和阅读中收藏的词，以及在任何页面划词收藏的短语和句子
// 路由：#/notebook 单词 · #/notebook/sentences 短语和句子
App.pages.notebook = {
  render(root, params, signal) {
    const tab = params[0] === "sentences" ? "sentences" : "words";
    const nb = Store.data.notebook, sn = sentNb();
    root.innerHTML = pageHead("生词本", "",
      `<div class="row">${tabsHtml([["words", `单词 (${nb.length})`], ["sentences", `短语和句子 (${sn.length})`]], tab)}
        <button class="btn ghost" id="nb-io" title="导出到 Anki / Excel，或从文件导入单词表">⇅ 导入 / 导出</button></div>`) + `<div id="nb-body"></div>`;
    $("#nb-io", root).onclick = () => WordIO.openMenu();
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go(b.dataset.tab === "words" ? "notebook" : "notebook/sentences")));
    const body = $("#nb-body", root);
    if (tab === "sentences") return this.sentences(root, body);

    if (!nb.length) {
      body.innerHTML = `<div class="card empty"><div class="big">⭐</div><h3>还没有收藏单词</h3><p>遇到记不住的词，点一下 ★，或者用鼠标选中它。也可以从文件导入单词表（右上角「导入 / 导出」）。</p><a class="btn primary" href="#/reading">去阅读找生词</a></div>`;
      return;
    }
    body.innerHTML = `<div class="row" style="margin-bottom:12px"><button class="btn primary" id="study">🃏 过一遍</button>
        <button class="btn soft" id="spell">⌨️ 拼写练习</button><a class="btn" href="#/typing/words/notebook">打字练习</a></div>
      <div class="card"><table class="word-table" style="margin-top:0">${nb.map((x, i) => `
      <tr><td class="w">${esc(x.w)}</td><td class="ipa">${esc(x.ph)}</td><td>${esc(x.m)}${x.ex ? `<div class="small faint" style="font-family:var(--font-en)">${esc(x.ex)}</div>` : ""}</td>
        <td class="small faint" style="white-space:nowrap">${x.added || ""}</td>
        <td style="width:80px;text-align:right">${speakBtn(x.w, "sm")}<button class="btn sm ghost" data-del="${i}" title="移除">✕</button></td></tr>`).join("")}</table></div>`;
    body.onclick = (e) => {
      const d = e.target.closest("[data-del]");
      if (!d) return;
      markDeleted("notebook", RECORD_ID.notebook(nb[+d.dataset.del]));
      nb.splice(+d.dataset.del, 1);
      Store.save();
      Router.render();
    };
    const queue = () => shuffle(nb).map((x) => WORD_MAP[x.w.toLowerCase()] || x);
    const back = (actions) => {
      actions.innerHTML = `<a class="btn primary" href="#/home">回首页</a><button class="btn" data-back>返回生词本</button>`;
      $("[data-back]", actions).onclick = () => Router.render();
    };
    $("#study", root).onclick = () => { $(".page-head", root).remove(); runFlashcards(body, queue(), "notebook", signal, back); };
    $("#spell", root).onclick = () => { $(".page-head", root).remove(); runSpelling(body, queue(), signal, back, { grade: false }); };
  },

  sentences(root, body) {
    const sn = sentNb();
    if (!sn.length) {
      body.innerHTML = `<div class="card empty"><div class="big">📝</div><h3>还没有收藏短语和句子</h3>
        <p>在任何页面用鼠标选中一段英文，浮层里点 ★ 就能收藏；阅读文章里的高亮也可以一键收藏。</p><a class="btn primary" href="#/reading">去阅读</a></div>`;
      return;
    }
    body.innerHTML = `<div class="row" style="margin-bottom:12px">
        <a class="btn primary" href="#/course/review">🔁 间隔复习${SentSRS.count() ? ` (${SentSRS.count()})` : ""}</a><a class="btn soft" href="#/typing/sentence/saved">⌨️ 跟打练习</a><a class="btn soft" href="#/typing/dictation/saved">🎧 听写练习</a>
        <span class="spacer"></span><label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="hide-zh"> 遮住中文（自测）</label></div>
      <div class="card" id="sn-list">${sn.map((x, i) => `
        <div class="sn-item" data-shadow-host>
          <div class="sn-main"><div class="sn-en">${esc(x.en)}</div>
            <div class="sn-zh">${x.zh ? esc(x.zh) : `<span class="faint">还没有翻译</span>${AI.enabled ? ` <button class="btn sm soft" data-tr="${i}">🤖 翻译</button>` : ""}`}</div>
            <div class="small faint">${esc(x.from || "")}${x.from ? " · " : ""}${x.added || ""}</div></div>
          <div class="row" style="gap:4px">${speakBtn(x.en, "sm")}${shadowBtn(x.en, { zh: x.zh })}<button class="btn sm ghost" data-del="${i}" title="移除">✕</button></div>
        </div>`).join("")}</div>`;
    $("#hide-zh", body).onchange = (e) => $("#sn-list", body).classList.toggle("hide-zh", e.target.checked);
    body.onclick = async (e) => {
      const d = e.target.closest("[data-del]"), tr = e.target.closest("[data-tr]");
      if (d) { markDeleted("sentence_nb", RECORD_ID.sentence_nb(sn[+d.dataset.del])); sn.splice(+d.dataset.del, 1); Store.save(); Router.render(); return; }
      if (tr) {
        tr.disabled = true;
        tr.textContent = "翻译中…";
        const x = sn[+tr.dataset.tr];
        const r = await AI.ask("You are an English-Chinese translator for Chinese learners. Reply with only a natural Chinese translation, nothing else.", x.en);
        if (!r.ok) { tr.disabled = false; tr.textContent = "重试"; toast(r.error, "bad", 4000); return; }
        x.zh = r.text.trim();
        x.t = Date.now();
        Store.save();
        Router.render();
      }
    };
  },
};
