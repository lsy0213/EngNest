// 单词 · 练习 ·「挖词填空」：一句话里把当前词书的重点词挖空，下面给中文提示，把词填回去
// 句子来源：词书例句和真题原句（优先含有你在学的词）；开了 AI 还可以「用我的词造句」，一句话串起 3–4 个在学的词
// 工具栏：挖空重点词（关掉就是阅读模式，重点词高亮）、美音 / 英音、首字母提示、显示翻译
const FILL_VOICE = { us: "en-US-AriaNeural", uk: "en-GB-SoniaNeural" };

App.pages.words.fillin = function (box, pageSignal) {
  const signal = freshSignal(this, pageSignal);
  const P = Store.prefs;
  P.fill_src ||= "book";
  P.fill_voice ||= "us";
  if (P.fill_blank === undefined) P.fill_blank = true;
  const book = curBook(), inBook = new Set(bookItems(book).map((x) => x.w.toLowerCase()));
  // 太基础的词（入门词书里的、4 个字母以下的）不挖：挖了没意义，而且词典第一个释义常常和句子里的意思对不上
  const basic = new Set((BOOK_MAP.core ? bookItems(BOOK_MAP.core) : []).map((x) => x.w.toLowerCase()));
  const learning = (w) => !!Store.data.words[w];

  // 一句话里哪些词是当前词书的词（按原形判断，跳过太短的和虚词）
  const keysOf = (sentence) => sentence.split(/([A-Za-z][A-Za-z'’-]*)/).map((part, i) => {
    if (i % 2 === 0) return null;
    const lo = part.toLowerCase();
    if (lo.length < 4 || GLOSS_SKIP.has(lo)) return null;
    const hit = lookupWord(part);
    return hit && inBook.has(hit.w.toLowerCase()) && !basic.has(hit.w.toLowerCase()) ? { i, form: part, item: hit } : null;
  }).filter(Boolean);

  // 从词书例句里挑句子：8–35 个词、含 2 个以上重点词，含在学的词越多越优先
  const pickBookSentences = (n) => {
    const seen = new Set(), cands = [];
    for (const it of bookItems(book)) {
      const sents = [...(it.exs || []), ...(it.exam?.[0] ? [[it.exam[0], ""]] : [])];
      for (const [en, zh] of sents) {
        const len = en.split(/\s+/).length;
        if (len < 8 || len > 35 || seen.has(en)) continue;
        seen.add(en);
        // 挖哪些：这条例句所属的词一定挖，再加最多 2 个（在学的、长的优先），一句最多 3 个空
        const all = [...new Map(keysOf(en).map((k) => [k.item.w, k])).values()];
        const own = all.find((k) => k.item.w === it.w);
        if (!own) continue;
        const others = all.filter((k) => k !== own).sort((a, b) => learning(b.item.w) - learning(a.item.w) || b.form.length - a.form.length).slice(0, 2);
        const keys = [own, ...others];
        const score = keys.filter((k) => learning(k.item.w)).length * 3 + keys.length * 2 + Math.random() * 2;
        cands.push({ en, zh, keys, score });
      }
      if (cands.length > 400) break;
    }
    return cands.sort((a, b) => b.score - a.score).slice(0, n * 3).sort(() => Math.random() - 0.5).slice(0, n);
  };

  box.innerHTML = `
    <div class="card fill-bar">
      <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="f-blank" ${P.fill_blank ? "checked" : ""}> 挖空重点词</label>
      <div class="tabs fill-acc">${[["us", "美音"], ["uk", "英音"]].map(([v, l]) => `<button class="tab ${P.fill_voice === v ? "active" : ""}" data-acc="${v}">▶ ${l}</button>`).join("")}</div>
      <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="f-first" ${P.fill_first ? "checked" : ""}> 首字母提示</label>
      <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="f-zh" ${P.fill_zh ? "checked" : ""}> 显示翻译</label>
      <span class="spacer"></span>
      <div class="tabs">${[["book", "📘 词书例句"], ["tatoeba", "📚 Tatoeba 短句"], ...(AI.enabled ? [["ai", "🤖 AI 用我的词造句"]] : [])].map(([v, l]) => `<button class="tab ${P.fill_src === v ? "active" : ""}" data-src="${v}">${l}</button>`).join("")}</div>
    </div>
    <div id="fill"></div>`;
  const stage = $("#fill", box);
  let queue = [], cur = null, checked = false, right = 0, total = 0, idx = 0;

  // 中文提示：词形有变化时挑对应词性的释义（faced → 取 v. 而不是 n. 脸）
  const hintOf = (k) => {
    const form = k.form.toLowerCase(), base = k.item.w.toLowerCase();
    const want = form === base ? "" : /(ed|ing)$/.test(form) ? "v." : /ly$/.test(form) && !/ly$/.test(base) ? "adv." : /s$/.test(form) ? "" : "";
    const senses = k.item.m.split(/\s{2,}/);
    const hit = want && senses.find((x) => x.trim().startsWith(want));
    if (hit) return shortMeaning({ m: hit });
    return shortMeaning(k.item) + (want ? `（这里作${want === "v." ? "动词" : "副词"}）` : "");
  };
  const speak = (rate) => cur && TTS.speak(cur.en, rate, FILL_VOICE[P.fill_voice]);

  // AI 造句：从在学 / 待复习的词里挑 3–4 个，让 AI 写一个自然的句子
  const aiSentence = async () => {
    const pool = [...dueWords(), ...bookItems(book).filter((x) => learning(x.w))].filter((x, i, a) => a.indexOf(x) === i);
    const words = sample(pool.length >= 3 ? pool : bookItems(book).slice(0, 200), 4);
    const r = await AI.json(`You write example sentences for Chinese English learners. ${LEARNER_PROFILE}`,
      `Write ONE natural, vivid English sentence (15-30 words, everyday or ${book.title} topic) that uses ALL of these words (inflected forms are fine): ${words.map((w) => w.w).join(", ")}.
Return JSON: {"en": "the sentence", "zh": "natural Chinese translation", "used": [{"base": "word from the list", "form": "exact form as it appears in the sentence"}]}`);
    if (!r.ok) { toast(r.error, "bad", 4000); return null; }
    const { en = "", zh = "", used = [] } = r.data;
    const keys = [];
    const parts = en.split(/([A-Za-z][A-Za-z'’-]*)/);
    for (const u of used) {
      const i = parts.findIndex((p, k) => k % 2 === 1 && p.toLowerCase() === String(u.form || "").toLowerCase() && !keys.some((x) => x.i === k));
      const item = WORD_MAP[String(u.base || "").toLowerCase()] || lookupWord(u.form || "");
      if (i > 0 && item) keys.push({ i, form: parts[i], item });
    }
    return keys.length ? { en, zh, keys, ai: true } : null;
  };

  // Tatoeba 短句：随机抽一批，挑含有词书重点词的（在学的词优先），一句最多挖 3 个
  const pickTatoeba = async (n) => {
    await Tatoeba.ready();
    const cands = [];
    for (const i of sample([...TATOEBA.keys()], 3000)) {
      const [en, zh] = TATOEBA[i];
      const keys = [...new Map(keysOf(en).map((k) => [k.item.w, k])).values()];
      if (!keys.length) continue;
      keys.sort((a, b) => learning(b.item.w) - learning(a.item.w) || b.form.length - a.form.length);
      cands.push({ en, zh, keys: keys.slice(0, 3), score: keys.filter((k) => learning(k.item.w)).length * 3 + Math.min(3, keys.length) + Math.random() * 2 });
    }
    return cands.sort((a, b) => b.score - a.score).slice(0, n);
  };

  const next = async () => {
    checked = false;
    if (P.fill_src === "tatoeba") {
      if (!queue.length) { stage.innerHTML = `<div class="card center muted" style="padding:40px">📚 正在挑句子……</div>`; queue = await pickTatoeba(10); }
      if (signal.aborted) return;
      cur = queue.shift();
      if (!cur) { stage.innerHTML = `<div class="card empty"><div class="big">📚</div><h3>没找到合适的句子</h3><p>换一本词书试试。</p></div>`; return; }
      cur.src = "📚 Tatoeba 例句";
    } else if (P.fill_src === "ai") {
      stage.innerHTML = `<div class="card center muted" style="padding:40px">🤖 AI 正在用你在学的词造句……</div>`;
      cur = await aiSentence();
      if (signal.aborted) return;
      if (!cur) { stage.innerHTML = `<div class="card center"><p class="muted">没造出来，再试一次吧。</p><button class="btn primary" id="retry">再试一次</button></div>`; $("#retry", stage).onclick = next; return; }
    } else {
      if (!queue.length) queue = pickBookSentences(10);
      cur = queue.shift();
      if (!cur) { stage.innerHTML = `<div class="card empty"><div class="big">📘</div><h3>这本词书的例句不够</h3><p>换一本例句多的词书（四六级、雅思、托福）试试${AI.enabled ? "，或者用「AI 用我的词造句」" : ""}。</p></div>`; return; }
    }
    idx++;
    draw();
    speak();
  };

  const draw = () => {
    const parts = cur.en.split(/([A-Za-z][A-Za-z'’-]*)/);
    const keyAt = new Map(cur.keys.map((k) => [k.i, k]));
    const html = parts.map((p, i) => {
      if (i % 2 === 0) return esc(p);
      const k = keyAt.get(i);
      if (!k) return `<span class="w">${esc(p)}</span>`;
      const hint = esc(hintOf(k));
      if (!P.fill_blank) return `<span class="fill-key"><span class="fill-word w">${esc(p)}</span><span class="fill-hint">${hint}</span></span>`;
      return `<span class="fill-key"><input class="fill-in en" data-i="${i}" style="width:${Math.max(3, p.length + 1)}ch" autocomplete="off" spellcheck="false" placeholder="${P.fill_first ? esc(p[0]) : ""}"><span class="fill-hint">${hint}</span><span class="fill-ans"></span></span>`;
    }).join("");
    stage.innerHTML = `<div class="card fill-card">
        <div class="small muted">${cur.ai ? "🤖 AI 造句" : cur.src || `📘 ${esc(book.title)}例句`} · 第 ${idx} 句${total ? ` · 已填对 ${right} / ${total} 个` : ""}</div>
        <div class="fill-sent en" data-text="${esc(cur.en)}">${html}</div>
        <div class="fill-zh ${P.fill_zh ? "" : "hidden"}">${esc(cur.zh || "（这句没有翻译）")}</div>
        <div class="row mt" style="gap:8px">
          <button class="btn soft" id="f-say">🔊 听整句</button><button class="btn ghost" id="f-slow">🐢 慢速</button>${shadowBtn(cur.en, { zh: cur.zh })}
          <span class="spacer"></span>
          ${P.fill_blank ? `<button class="btn ghost" id="f-show">看答案</button><button class="btn primary" id="f-check">检查 <span class="kbd">Enter</span></button>` : `<button class="btn primary" id="f-next">下一句 <span class="kbd">Enter</span></button>`}
        </div>
        <div id="f-after"></div></div>
      <div class="kbd-hint">Tab 跳到下一个空 · Enter 检查 / 下一句 · Ctrl+M 跟读评测 · 点没挖空的词可以查义</div>`;
    bindWordClicks($(".fill-sent", stage));
    App.shadowTarget = () => [{ en: cur.en, zh: cur.zh, label: "整句" }];
    $("#f-say", stage).onclick = () => speak();
    $("#f-slow", stage).onclick = () => speak(0.65);
    const ins = $$(".fill-in", stage);
    ins.forEach((inp) => inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); checked ? next() : check(); }
    }));
    if (ins[0]) setTimeout(() => ins[0].focus(), 60);
    const ck = $("#f-check", stage);
    if (ck) ck.onclick = () => (checked ? next() : check());
    const sh = $("#f-show", stage);
    if (sh) sh.onclick = () => check(true);
    const nx = $("#f-next", stage);
    if (nx) nx.onclick = next;
  };

  // 检查：大小写、弯引号不算错
  const norm = (s) => s.trim().toLowerCase().replace(/[’‘]/g, "'");
  const check = (giveUp = false) => {
    if (checked) return;
    checked = true;
    let ok = 0;
    const missed = [];
    $$(".fill-in", stage).forEach((inp) => {
      const k = cur.keys.find((x) => x.i === +inp.dataset.i);
      const good = !giveUp && norm(inp.value) === norm(k.form);
      if (good) ok++; else missed.push(k);
      inp.readOnly = true;
      inp.classList.add(good ? "ok" : "bad");
      if (!good) inp.parentElement.querySelector(".fill-ans").textContent = k.form;
    });
    right += ok;
    total += cur.keys.length;
    addXP(ok);
    $(".fill-zh", stage).classList.remove("hidden");
    $("#f-check", stage).innerHTML = `下一句 <span class="kbd">Enter</span>`;
    $("#f-show", stage)?.remove();
    const uniq = [...new Map(cur.keys.map((k) => [k.item.w, k.item])).values()];
    $("#f-after", stage).innerHTML = `<div class="explain ${missed.length ? "bad" : "good"}">${missed.length ? `填对 ${ok} / ${cur.keys.length} 个，红色的是正确答案。` : "✅ 全部填对！"}
      <div class="fill-words">${uniq.map((it) => `<span class="fill-wd"><b class="en">${esc(it.w)}</b> <span class="faint">${esc(it.ph || "")}</span> ${esc(shortMeaning(it))} ${speakBtn(it.w, "sm")}<button class="star ${inNotebook(it.w) ? "on" : ""}" data-nb="${esc(it.w)}" title="加入生词本">★</button></span>`).join("")}</div></div>`;
    $("#f-after", stage).onclick = (e) => { const s = e.target.closest("[data-nb]"); if (s) s.classList.toggle("on", toggleNotebook(WORD_MAP[s.dataset.nb.toLowerCase()])); };
    (document.activeElement)?.blur?.();
    speak();
  };

  onKey(signal, (e) => {
    if (e.key === "Enter" && cur) { e.preventDefault(); if (!P.fill_blank || checked) next(); else check(); }
  });
  $("#f-blank", box).onchange = (e) => { P.fill_blank = e.target.checked; Store.save(); if (cur) { checked = false; draw(); } };
  $("#f-first", box).onchange = (e) => { P.fill_first = e.target.checked; Store.save(); if (cur && !checked) draw(); };
  $("#f-zh", box).onchange = (e) => { P.fill_zh = e.target.checked; Store.save(); $(".fill-zh", stage)?.classList.toggle("hidden", !P.fill_zh && !checked); };
  $$("[data-acc]", box).forEach((b) => (b.onclick = () => { P.fill_voice = b.dataset.acc; Store.save(); $$("[data-acc]", box).forEach((x) => x.classList.toggle("active", x === b)); speak(); }));
  $$("[data-src]", box).forEach((b) => (b.onclick = () => { P.fill_src = b.dataset.src; Store.save(); $$("[data-src]", box).forEach((x) => x.classList.toggle("active", x === b)); queue = []; next(); }));
  next();
};
