// ============================================================
// 逐句精讲：一句英文，每个词上面标音标、下面标中文；重点词（当前词书里的、不太基础的）高亮
// 再加整句翻译；点「AI 精讲」得到按语境的逐词释义、核心词汇、核心短语和语法分析（结果存在 Store.data.line_notes）
// 影视精听播放时用，以后别的页面也可以直接调用 renderBreakdown(box, en, zh)
// ============================================================
const CONTRACT_ZH = {
  "i'm": "我是", "you're": "你是", "we're": "我们是", "they're": "他们是", "he's": "他是", "she's": "她是", "it's": "它是", "that's": "那是",
  "there's": "有", "what's": "什么是", "let's": "让我们", "i've": "我已", "you've": "你已", "we've": "我们已", "i'll": "我会", "you'll": "你会",
  "we'll": "我们会", "it'll": "它会", "i'd": "我会/我已", "you'd": "你会", "don't": "不", "doesn't": "不", "didn't": "没有", "can't": "不能",
  "won't": "不会", "isn't": "不是", "aren't": "不是", "wasn't": "不是", "weren't": "不是", "haven't": "没有", "hasn't": "没有",
  "couldn't": "不能", "wouldn't": "不会", "shouldn't": "不应该", "gonna": "将要", "wanna": "想要", "gotta": "必须",
};
// 最常用的功能词：词典里的第一个释义往往很怪（is 查到「[计] 加下标次」，It 匹配成缩写 IT），这里直接给日常意思
const FUNC_WORDS = {
  i: ["/aɪ/", "我"], me: ["/miː/", "我"], my: ["/maɪ/", "我的"], you: ["/juː/", "你"], your: ["/jɔː/", "你的"], he: ["/hiː/", "他"], him: ["/hɪm/", "他"],
  his: ["/hɪz/", "他的"], she: ["/ʃiː/", "她"], her: ["/hɜː/", "她（的）"], it: ["/ɪt/", "它"], its: ["/ɪts/", "它的"], we: ["/wiː/", "我们"], us: ["/ʌs/", "我们"],
  our: ["/ˈaʊə/", "我们的"], they: ["/ðeɪ/", "他们"], them: ["/ðem/", "他们"], their: ["/ðeə/", "他们的"], this: ["/ðɪs/", "这"], that: ["/ðæt/", "那"],
  these: ["/ðiːz/", "这些"], those: ["/ðəʊz/", "那些"], a: ["/ə/", "一个"], an: ["/ən/", "一个"], the: ["/ðə/", "这/那"],
  am: ["/æm/", "是"], is: ["/ɪz/", "是"], are: ["/ɑː/", "是"], was: ["/wɒz/", "是（过去）"], were: ["/wɜː/", "是（过去）"], be: ["/biː/", "是"], been: ["/biːn/", "是（完成）"],
  do: ["/duː/", "做；（助动词）"], does: ["/dʌz/", "做；（助动词）"], did: ["/dɪd/", "做了；（助动词）"], have: ["/hæv/", "有；已经"], has: ["/hæz/", "有；已经"], had: ["/hæd/", "有过；已经"],
  will: ["/wɪl/", "将会"], would: ["/wʊd/", "会；愿意"], can: ["/kæn/", "能"], could: ["/kʊd/", "能；可以"], should: ["/ʃʊd/", "应该"], must: ["/mʌst/", "必须"], may: ["/meɪ/", "可能；可以"],
  not: ["/nɒt/", "不"], no: ["/nəʊ/", "不；没有"], yes: ["/jes/", "是的"], to: ["/tuː/", "到；去"], of: ["/ɒv/", "……的"], in: ["/ɪn/", "在……里"], on: ["/ɒn/", "在……上"],
  at: ["/æt/", "在"], for: ["/fɔː/", "为了；给"], with: ["/wɪð/", "和；用"], from: ["/frɒm/", "从"], by: ["/baɪ/", "被；通过"], about: ["/əˈbaʊt/", "关于；大约"],
  and: ["/ænd/", "和"], or: ["/ɔː/", "或者"], but: ["/bʌt/", "但是"], so: ["/səʊ/", "所以；这么"], if: ["/ɪf/", "如果"], because: ["/bɪˈkɒz/", "因为"], than: ["/ðæn/", "比"],
  what: ["/wɒt/", "什么"], where: ["/weə/", "哪里"], when: ["/wen/", "什么时候"], who: ["/huː/", "谁"], why: ["/waɪ/", "为什么"], how: ["/haʊ/", "怎么"], which: ["/wɪtʃ/", "哪个"],
  there: ["/ðeə/", "那里；有"], here: ["/hɪə/", "这里"], now: ["/naʊ/", "现在"], then: ["/ðen/", "然后"], very: ["/ˈveri/", "非常"], too: ["/tuː/", "也；太"], also: ["/ˈɔːlsəʊ/", "也"],
  just: ["/dʒʌst/", "只是；刚刚"], all: ["/ɔːl/", "所有"], some: ["/sʌm/", "一些"], any: ["/ˈeni/", "任何"], up: ["/ʌp/", "向上"], out: ["/aʊt/", "出去"], down: ["/daʊn/", "向下"],
  oh: ["/əʊ/", "哦"], hi: ["/haɪ/", "嗨"], hey: ["/heɪ/", "嘿"], ok: ["/ˌəʊˈkeɪ/", "好"], okay: ["/ˌəʊˈkeɪ/", "好"], well: ["/wel/", "嗯；好"], please: ["/pliːz/", "请"], thanks: ["/θæŋks/", "谢谢"],
};
const BD_BASIC = () => (BD_BASIC._s ||= new Set((BOOK_MAP.core ? bookItems(BOOK_MAP.core) : []).map((x) => x.w.toLowerCase())));

// 词典释义的第一个意思（不带词性），放在单词下面用
function firstSense(m) {
  const first = (m || "").split(/\s{2,}/)[0].replace(/^[a-z]+\.\s*/i, "");
  return first.split(/[；;，,]/)[0].trim().slice(0, 8);
}

async function renderBreakdown(box, en, zh = "", opt = {}) {
  const my = (box._bdRun = (box._bdRun || 0) + 1);
  const parts = en.split(/([A-Za-z][A-Za-z'’-]*)/);
  const book = new Set(bookItems(curBook()).map((x) => x.w.toLowerCase()));
  const words = [];
  parts.forEach((p, i) => {
    if (i % 2 === 0) return;
    const lo = p.toLowerCase().replace(/’/g, "'");
    const fw = FUNC_WORDS[lo];
    const it = fw ? null : lookupWord(p);
    words.push({
      i, w: p, ph: fw?.[0] || it?.ph || "", zh: fw?.[1] || CONTRACT_ZH[lo] || (it ? firstSense(it.m) : ""),
      base: it?.w || "", core: !!it && book.has(it.w.toLowerCase()) && !BD_BASIC().has(it.w.toLowerCase()) && it.w.length >= 4,
    });
  });
  const notes = () => (Store.data.line_notes || {})[en];

  const draw = () => {
    if (box._bdRun !== my) return;
    const n = notes();
    const gloss = n?.gloss || [];
    const byIndex = new Map(words.map((w, k) => [w.i, { ...w, zh: gloss[k] || w.zh }]));
    box.innerHTML = `
      <div class="bd-line">${parts.map((p, i) => {
        if (i % 2 === 0) return p.trim() ? `<span class="bd-punct">${esc(p.trim())}</span>` : "";
        const w = byIndex.get(i);
        return `<span class="bd-tok ${w.core ? "core" : ""}" data-say="${esc(w.w)}" title="点一下听发音"><span class="bd-ph">${esc(w.ph.replace(/^\/|\/$/g, "") ? `/${w.ph.replace(/^\/|\/$/g, "")}/` : "")}</span><span class="bd-w">${esc(w.w)}</span><span class="bd-zh">${esc(w.zh)}</span></span>`;
      }).join("")}</div>
      <div class="bd-trans">${esc(n?.zh || zh || "")}${!(n?.zh || zh) ? `<span class="faint">（没有中文翻译${AI.enabled ? "，点「AI 精讲」会一起翻译" : ""}）</span>` : ""}</div>
      ${n ? `
        ${(n.words || []).length ? `<div class="bd-sec"><div class="bd-h">💡 核心词汇</div>${n.words.map((x) => `<div class="bd-item"><b class="en">${esc(x.w)}</b> <span class="faint">${esc(x.ph || "")}</span> ${esc(x.zh || "")} ${speakBtn(x.w, "sm")}<button class="star ${inNotebook(x.w) ? "on" : ""}" data-bd-w="${esc(x.w)}" data-zh="${esc(x.zh || "")}" title="加入生词本">★</button></div>`).join("")}</div>` : ""}
        ${(n.phrases || []).length ? `<div class="bd-sec"><div class="bd-h">💡 核心短语</div>${n.phrases.map((x) => `<div class="bd-item"><b class="en">${esc(x.en)}</b> ${esc(x.zh || "")} ${speakBtn(x.en, "sm")}<button class="star ${inSentNb(x.en) ? "on" : ""}" data-bd-p="${esc(x.en)}" data-zh="${esc(x.zh || "")}" title="加入生词本（短语会安排复习）">★</button></div>`).join("")}</div>` : ""}
        ${n.grammar ? `<div class="bd-sec"><div class="bd-h">💡 语法分析</div><div class="bd-grammar">${esc(n.grammar)}</div></div>` : ""}`
      : AI.enabled ? `<div class="row mt-s"><button class="btn sm soft" data-bd-ai>🤖 AI 精讲：按语境的释义、核心词汇、短语和语法</button></div>` : ""}`;
    const ai = $("[data-bd-ai]", box);
    if (ai) ai.onclick = askAI;
  };

  const askAI = async () => {
    const btn = $("[data-bd-ai]", box);
    if (btn) { btn.disabled = true; btn.textContent = "🤖 AI 正在分析这句话……"; }
    const r = await AI.json(`You are an English teacher explaining movie and TV lines to Chinese learners. ${LEARNER_PROFILE}`,
      `Line: "${en}"${zh ? `\nExisting Chinese subtitle: "${zh}"` : ""}
Tokens (in order): ${JSON.stringify(words.map((w) => w.w))}
Return JSON: {"zh": "natural Chinese translation of the line", "gloss": ["the Chinese meaning of each token IN THIS CONTEXT, 1-4 characters, same order and same count as the tokens"], "words": [{"w": "base form", "ph": "IPA like /ɪmˈbærəst/", "zh": "词性 + 中文意思"}], "phrases": [{"en": "phrase or chunk from the line", "zh": "中文"}], "grammar": "中文：这句话的句子结构和语法要点，2-3 句"}
Pick at most 3 core words (skip very basic words) and at most 2 useful phrases; empty lists if none.`);
    if (box._bdRun !== my) return;
    if (!r.ok) { toast(r.error, "bad", 4000); if (btn) { btn.disabled = false; btn.textContent = "🤖 重试 AI 精讲"; } return; }
    const d = r.data;
    if (!Array.isArray(d.gloss) || d.gloss.length !== words.length) d.gloss = []; // 对不上就不用，免得释义错位
    const all = (Store.data.line_notes ||= {});
    all[en] = d;
    const keys = Object.keys(all);
    if (keys.length > 300) delete all[keys[0]];
    Store.save();
    opt.onZh?.(d.zh);
    draw();
  };

  box.onclick = (e) => {
    const w = e.target.closest("[data-bd-w]"), p = e.target.closest("[data-bd-p]");
    if (w) w.classList.toggle("on", toggleNotebook(WORD_MAP[w.dataset.bdW.toLowerCase()] || { w: w.dataset.bdW, m: w.dataset.zh }));
    if (p) p.classList.toggle("on", toggleSentNb({ en: p.dataset.bdP, zh: p.dataset.zh, from: opt.from || "逐句精讲" }));
  };
  draw();
  // 词书里没有的词去内置词典查音标和释义（异步，查到一个更新一次就太闪了，查完一起更新）
  const missing = words.filter((w) => !w.ph || !w.zh);
  if (missing.length && Dict.ok) {
    await Promise.all(missing.map(async (w) => {
      const d = await Dict.lookup(w.w.toLowerCase().replace(/’/g, "'"));
      if (!d) return;
      if (!w.ph && d.phonetic) w.ph = `/${d.phonetic}/`;
      if (!w.zh) w.zh = firstSense(d.trans.split("\n")[0]);
    }));
    draw();
  }
}
