// ============================================================
// 「这句怎么说」：和 AI 聊天时想说的不会说，写中文或中英混合，AI 给出几种英文说法
// AI 语伴和合租日记的自由聊天都用这个。onUse(en) 把选中的说法交回给聊天（填进输入框）
// ============================================================
const HAS_ZH = /[㐀-鿿]/;

// 给角色扮演的 system prompt 加上这一段：学习者卡住时，先在角色里教他怎么说
const STUCK_RULE = `If the learner's message contains Chinese, or is unfinished because they don't know how to say something (e.g. "I want... uh..."), first help them in character in one short line, like: You can say "buy a coffee". Then continue the conversation naturally.`;

function howToSay({ text = "", context = "", onUse, onSendAnyway } = {}) {
  if (!AI.enabled) { toast("这个功能需要先在设置里接入 AI"); return; }
  const m = modal(`<div class="row"><h3 style="margin:0">🆘 这句话英语怎么说？</h3><span class="spacer"></span><button class="btn sm ghost" data-close>✕</button></div>
    <p class="small muted">用中文写下你想说的，中英混合也可以（比如「I want… 买杯咖啡，不要太甜」）。</p>
    <textarea class="textarea" id="hs-in" rows="2" placeholder="我想说……">${esc(text)}</textarea>
    <div class="row mt-s"><span class="small faint">Enter 查询 · Shift+Enter 换行</span><span class="spacer"></span>
      ${onSendAnyway ? `<button class="btn ghost" id="hs-raw" title="不查了，把原句发出去，AI 会在对话里教你">就这样发送</button>` : ""}<button class="btn primary" id="hs-go">告诉我怎么说</button></div>
    <div id="hs-out"></div>`);
  m.root.querySelector(".modal").style.maxWidth = "620px";
  const inp = $("#hs-in", m.root), out = $("#hs-out", m.root);
  const go = async () => {
    const q = inp.value.trim();
    if (!q) return;
    $("#hs-go", m.root).disabled = true;
    out.innerHTML = `<div class="explain"><span class="muted">正在想……</span></div>`;
    const r = await AI.json(`You are a friendly English speaking coach for Chinese learners. ${LEARNER_PROFILE}`,
      `${context ? `The learner is in this conversation:\n${context}\n\n` : ""}The learner wants to say this (Chinese or mixed Chinese/English): "${q}"
Give natural spoken English for it that fits the conversation.
Return JSON: {"options": [{"tag": "简单说法 / 更地道 / 更礼貌 之类的中文标签", "en": "the English sentence", "why": "中文：一句话说明用法或和其他说法的区别"}], "words": [["中文词", "English word or phrase"]]}
Give 2-3 options from simplest to most natural, and up to 4 key words or phrases the learner probably didn't know.`);
    if (!m.root.isConnected) return;
    $("#hs-go", m.root).disabled = false;
    if (!r.ok) { out.innerHTML = `<div class="explain bad">${esc(r.error)}</div>`; return; }
    const opts = r.data.options || [];
    out.innerHTML = `<div class="hs-list">${opts.map((o, i) => `<div class="hs-opt">
        <div class="row" style="gap:6px"><span class="badge brand">${esc(o.tag || `说法 ${i + 1}`)}</span><span class="spacer"></span>
          ${speakBtn(o.en, "sm")}<button class="speak sm" data-say="${esc(o.en)}" data-rate="0.6" title="慢速">🐢</button>${shadowBtn(o.en, { zh: q })}
          <button class="star ${inSentNb(o.en) ? "on" : ""}" data-star="${i}" title="收藏到生词本，之后会安排复习">★</button>
          ${onUse ? `<button class="btn sm primary" data-use="${i}">用这句</button>` : ""}</div>
        <div class="hs-en en">${esc(o.en)}</div><div class="small muted">${esc(o.why || "")}</div></div>`).join("")}</div>
      ${(r.data.words || []).length ? `<div class="hs-words small"><b>📌 关键词</b> ${r.data.words.map(([zh, en]) => `<span class="hs-word">${esc(zh)} = <span class="en">${esc(en)}</span> <button class="speak sm" data-say="${esc(en)}">🔊</button></span>`).join("")}</div>` : ""}
      <div class="small faint mt-s">先点 🎙️ 跟着读几遍，再「用这句」回到对话里自己说出来，记得更牢。</div>`;
    out.onclick = (e) => {
      const st = e.target.closest("[data-star]"), use = e.target.closest("[data-use]");
      if (st) st.classList.toggle("on", toggleSentNb({ en: opts[+st.dataset.star].en, zh: q, from: "这句怎么说" }));
      if (use) { m.close(); onUse(opts[+use.dataset.use].en); }
    };
    if (opts[0]) TTS.speak(opts[0].en);
  };
  $("#hs-go", m.root).onclick = go;
  const raw = $("#hs-raw", m.root);
  if (raw) raw.onclick = () => { m.close(); onSendAnyway(inp.value.trim()); };
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(); } });
  setTimeout(() => inp.focus(), 50);
  if (text) go();
}
