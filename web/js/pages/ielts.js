// 雅思专区：考试介绍（本项目编写）、软件里已有的雅思功能入口、免费的官方练习和学习网站链接
// 剑桥真题、机经、《词汇真经》等受版权保护，软件里不提供，只放到官方和公开网站的链接
const IELTS_PARTS = [
  ["🎧 听力 Listening", "约 30 分钟（纸笔考试另有 10 分钟誊写）", "4 个部分、40 题：日常对话、日常独白、学术讨论、学术讲座，只放一遍", "边听边写的能力；数字、拼写、同义替换（题目和原文说法不同）"],
  ["📖 阅读 Reading", "60 分钟", "3 篇文章、40 题：判断（T/F/NG）、段落标题配对、填空、选择", "快速定位、同义替换、长难句；学术类文章来自书刊，培训类偏日常和职场"],
  ["✍️ 写作 Writing", "60 分钟", "Task 1（≥150 词，学术类描述图表，培训类写信）+ Task 2（≥250 词，议论文，占分更多）", "按四项评分：任务回应、连贯与衔接、词汇丰富度、语法多样性和准确性"],
  ["🗣️ 口语 Speaking", "11–14 分钟，和考官面对面", "Part 1 日常问答 → Part 2 话题卡（准备 1 分钟、说 1–2 分钟）→ Part 3 深入讨论", "按四项评分：流利与连贯、词汇、语法、发音"],
];
const IELTS_LINKS = [
  { title: "官方免费练习", items: [
    ["IELTS 官网 · 样题", "https://ielts.org/take-a-test/preparation-resources/sample-test-questions", "官方各科样题和答案，题型最权威"],
    ["剑桥英语 · 雅思备考", "https://www.cambridgeenglish.org/exams-and-tests/ielts/preparation/", "剑桥大学出版的免费备考资料和样题"],
    ["British Council · Take IELTS", "https://takeielts.britishcouncil.org/", "英国文化协会：免费模考和备考课程（国内可能打开较慢）"],
    ["IDP · 备考资源", "https://ielts.idp.com/prepare", "IDP 雅思的免费练习和备考文章"],
    ["中国教育考试网 · 雅思", "https://ielts.neea.cn/", "国内报名、考位查询、成绩查询"],
  ] },
  { title: "免费学习网站", items: [
    ["IELTS Liz", "https://ieltsliz.com/", "前考官的免费课程，口语和写作的思路讲得很清楚"],
    ["IELTS Buddy", "https://www.ieltsbuddy.com/", "各题型的方法讲解和范例"],
    ["Mini IELTS", "https://mini-ielts.com/", "免费的在线听力、阅读练习"],
    ["IELTS-up", "https://ielts-up.com/", "各科练习题和口语话题"],
    ["Writing9", "https://writing9.com/", "提交作文用 AI 估分（软件里的写作批改也能做）"],
  ] },
  { title: "GitHub 上的备考资料（别人整理的，请自行判断，只用于个人学习）", items: [
    ["awesome-IELTS", "https://github.com/shah0150/awesome-IELTS", "雅思资源链接合集（英文）"],
    ["my-ielts", "https://hefengxian.github.io/my-ielts/", "一位考生的雅思备考笔记网站（词汇、语法、听力、阅读同义替换）"],
    ["IELTS-practice", "https://github.com/sallowayma-git/IELTS-practice", "开源的阅读 / 听力练习系统（题源版权归原权利人，作者要求只个人使用）"],
    ["zeeklog/IELTS", "https://zeeklog.github.io/IELTS/", "雅思资料汇总网站"],
  ] },
];

App.pages.ielts = {
  async extRow(row) {
    if (!Store.bridge || Store.remote) { row.innerHTML = `<span class="small faint">只能在电脑上下载和打开。</span>`; return; }
    const st = await pywebview.api.ext_status();
    const e = st.exts["ielts-practice"];
    if (st.running && st.id === "ielts-practice") {
      row.innerHTML = `<span class="small">${st.stage === "extract" ? "解压中…" : `下载中 ${Math.round(st.progress * 100)}%`}</span><div class="bar" style="flex:1;max-width:240px"><i style="width:${st.progress * 100}%"></i></div>`;
      setTimeout(() => row.isConnected && this.extRow(row), 800);
      return;
    }
    row.innerHTML = e.installed
      ? `<a class="btn primary" href="#/ireading">🧪 开始做题</a><button class="btn ghost" data-x="install">重新下载（更新题库）</button><button class="btn ghost" data-x="open" title="原版网页还有听力扩展、成就系统等">原版网页 ↗</button><span class="small good-text">✓ 已下载</span>`
      : `<button class="btn primary" data-x="install">⬇ 下载到本机</button>${st.error && st.id === "ielts-practice" ? `<span class="small bad-text">上次下载失败：${esc(st.error)}</span>` : ""}`;
    row.onclick = async (ev) => {
      const k = ev.target.closest("[data-x]")?.dataset.x;
      if (k === "open") { if (!(await pywebview.api.ext_open("ielts-practice"))) toast("没找到，重新下载一下吧", "bad"); }
      if (k === "install") { await pywebview.api.ext_install("ielts-practice"); this.extRow(row); }
    };
  },

  render(root) {
    const ib = BOOK_MAP.ielts, it = BOOK_MAP.ielts_topic;
    const learned = (b) => (b ? bookItems(b).filter((x) => Store.data.words[x.w]).length : 0);
    const exam = (Store.prefs.exams || {}).ielts;
    root.innerHTML = pageHead("🎓 雅思", "雅思考什么、软件里怎么练、去哪里找免费的官方练习") + `
      <div class="card"><div class="card-title">📋 雅思考什么</div>
        <div class="small muted" style="margin-bottom:8px">分学术类（出国读书）和培训类（移民、工作）：听力和口语两类一样，阅读和写作题目不同。每科 0–9 分，总分是四科平均（四舍五入到 0.5）。</div>
        <div class="link-table-wrap"><table class="link-table"><thead><tr><th>科目</th><th>时间</th><th>题目</th><th>考的是什么</th></tr></thead>
          <tbody>${IELTS_PARTS.map((r) => `<tr>${r.map((c, i) => `<td>${i ? esc(c) : `<b>${esc(c)}</b>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      </div>
      <div class="card"><div class="card-title">🧰 在软件里练</div>
        <div class="ielts-grid">
          ${[
            ["#/words", "📗", "雅思词汇真经", BOOK_MAP.ielts_zj ? `${BOOK_MAP.ielts_zj.count} 词 · 22 个话题 · 已学 ${learned(BOOK_MAP.ielts_zj)}` : ""],
            ["#/words", "🎧", "听力 179 考点词", BOOK_MAP.ielts_l179 ? `听力最常考的同义替换 · 已学 ${learned(BOOK_MAP.ielts_l179)}` : ""],
            ["#/words", "📖", "阅读 538 考点词", BOOK_MAP.ielts_r538 ? `按考察概率分三类 · 已学 ${learned(BOOK_MAP.ielts_r538)}` : ""],
            ["#/writing", "✍️", "写作 100 句", window.IELTS_W100 ? `中译英，按顺序练 · 做到第 ${(Store.prefs.w100_i || 0) % IELTS_W100.length + 1} 句` : ""],
            ["#/words", "📚", "雅思词汇", ib ? `${ib.count} 词 · 已学 ${learned(ib)}${exam?.date ? ` · 考试日 ${esc(exam.date)}` : ""}` : "单词页选「雅思词汇」"],
            ["#/words", "🗂️", "雅思主题词汇", it ? `按话题分章 · 已学 ${learned(it)}` : ""],
            ["#/words/practice", "🧩", "挖词填空", "雅思例句里挖掉重点词，填回去"],
            ["#/words/roots", "🧱", "词根词缀", "学术词汇大多能拆开记"],
            ["#/listening", "🎧", "听力：逐句听写", "VOA 原声和生成的听力，一句一句听写"],
            ["#/reading", "📖", "阅读", "按难度分级的文章、原著，点词查义"],
            ["#/speaking/fluency", "🗣️", "口语：4/3/2 复述", "选话题限时说，统计语速和停顿，AI 改错"],
            ["#/tutor", "🤖", "口语考官（AI 语伴）", "选「口语考官」性格，按雅思口语的方式追问"],
            ["#/writing", "✍️", "写作批改", "提交作文，AI 打分、逐句纠错、给范文"],
            ["#/speaking/linking", "🔗", "连读与语调", "听力听不懂、口语不自然，问题多半在这里"],
          ].map(([href, ico, t, sub], k) => `<a class="ielts-go" href="${href}" data-k="${k}"><span class="ielts-ico">${ico}</span><span><b>${esc(t)}</b><span class="small muted">${esc(sub)}</span></span></a>`).join("")}
        </div>
      </div>
      <div class="card"><div class="card-title">🎧 雅思听力训练</div>
        <div class="small muted">Section 1 专项（名字拼写、电话号码、日期、价格、时间、邮编、地址，离线随机生成，英音澳音美音轮流读）、179 考点词听写，以及开了 AI 后按雅思格式生成的 Section 1–4 模拟套题（多人多口音、可以只放一遍、交卷看原文和答案出处）。</div>
        <div class="row mt-s" style="gap:8px"><a class="btn primary" href="#/ilisten">🎧 开始练听力</a></div></div>
      <div class="card"><div class="card-title">🗣️ 雅思口语模考</div>
        <div class="small muted">考官用英音提问，你直接开口回答：Part 1 日常问答、Part 2 话题卡（1 分钟准备 + 最多 2 分钟独白）、Part 3 深入讨论，可以整套考也可以单练一部分。考完看每题的转写、语速、停顿和发音不清的词；接入 AI 后按四项标准估分，并给 Band 7 版本的回答。</div>
        <div class="row mt-s" style="gap:8px"><a class="btn primary" href="#/ispeak">🗣️ 开始口语模考</a></div></div>
      <div class="card"><div class="card-title">✍️ 雅思写作模考</div>
        <div class="small muted">Task 2 议论文（40 分钟 / 250 词）、Task 1 学术类图表（软件画图，20 分钟 / 150 词）、Task 1 培训类书信。计时、实时字数、草稿自动保存；交卷后自动检查分段、句长和连接词，AI 按四项标准估分、在原文里标出错误、给词汇升级和高分范文。</div>
        <div class="row mt-s" style="gap:8px"><a class="btn primary" href="#/iwrite">✍️ 开始写作模考</a></div></div>
      <div class="card"><div class="card-title">🧪 雅思阅读练习（题库来自 IELTS-practice）</div>
        <div class="small muted">238 篇真题风格的阅读文章（P1 / P2 / P3，按高频、中频、低频分），14 种题型，左边文章右边做题、限时 20 分钟、交卷判分、逐题中文解析和段落翻译。题库下载到本机（约 35 MB）后就在软件里做题，不用开浏览器。
          <span class="faint">题源版权归原权利人，作者要求只用于个人学习，不要再公开分发。</span></div>
        <div class="row mt-s" id="ext-row" style="gap:8px"></div></div>
      <div class="card"><div class="card-title">🧩 雅思语法（来自 my-ielts 备考笔记）</div>
        <div class="small muted">「学完这个就会分析长难句了」：一份基础语法课程的思维导图和讲义。</div>
        <div class="row mt-s" style="gap:8px;flex-wrap:wrap">
          <button class="btn soft" id="g-map">🗺️ 看思维导图</button>
          <button class="btn soft" id="g-pdf">📄 打开讲义 PDF</button>
          <button class="btn ghost" data-url="https://www.youtube.com/watch?v=bxvyZwACfNk">▶ 配套视频（YouTube）↗</button></div></div>
      ${window.IELTS_SPELLING ? `<div class="card"><div class="card-title">🔤 英美拼写对照 <span class="small muted" style="font-weight:400">听力填空拼写要统一，英式美式都算对</span></div>
        ${IELTS_SPELLING.map((t) => `<details class="ielts-spell"><summary><b>${esc(t.title)}</b> <span class="small muted">${esc(t.desc)}（${t.rows.length} 个）</span></summary>
          <div class="link-table-wrap"><table class="link-table"><thead><tr>${t.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
          <tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i < 2 ? "en" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`).join("")}</div>` : ""}
      ${IELTS_LINKS.map((g) => `<div class="card"><div class="card-title">🔗 ${esc(g.title)}</div>
        ${g.items.map(([t, url, note]) => `<div class="ielts-link"><button class="btn sm soft" data-url="${esc(url)}">${esc(t)} ↗</button><span class="small muted">${esc(note)}</span></div>`).join("")}</div>`).join("")}
      <p class="small faint">剑桥雅思真题、机经、《雅思词汇真经》等资料受版权保护，软件里不提供；有正版书和音频的话，音频可以用「影视精听 → 打开本地视频」逐句精听（支持 mp3 和字幕文件）。</p>`;
    // 进词书相关的入口前先切好词书
    const pre = [() => { Store.prefs.book = "ielts_zj"; }, () => { Store.prefs.book = "ielts_l179"; }, () => { Store.prefs.book = "ielts_r538"; }, () => { Store.prefs.tr_src = "w100"; },
      () => { Store.prefs.book = "ielts"; }, () => { Store.prefs.book = "ielts_topic"; }, () => { Store.prefs.book = "ielts"; Store.prefs.word_practice = "fillin"; }];
    this.extRow($("#ext-row", root));
    $("#g-map", root).onclick = () => {
      const m = modal(`<div class="row"><h3 style="margin:0">🗺️ 雅思语法思维导图</h3><span class="spacer"></span>
          <button class="btn sm ghost" data-z="-1">－</button><button class="btn sm ghost" data-z="1">＋</button><button class="btn sm ghost" data-close>✕</button></div>
        <div class="g-map-box"><img src="ext/my-ielts/grammar-mindmap.svg" id="g-img" alt="雅思语法思维导图" style="width:100%"></div>`);
      m.root.querySelector(".modal").style.maxWidth = "1100px";
      let z = 100;
      m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-z]"); if (b) { z = Math.max(50, Math.min(300, z + 25 * +b.dataset.z)); $("#g-img", m.root).style.width = z + "%"; } });
    };
    $("#g-pdf", root).onclick = async () => {
      if (Store.bridge && !Store.remote && await pywebview.api.open_file("ext/my-ielts/grammar-notes.pdf")) return;
      window.open("ext/my-ielts/grammar-notes.pdf", "_blank");
    };
    root.addEventListener("click", (e) => {
      const go = e.target.closest(".ielts-go");
      if (go && pre[+go.dataset.k]) { pre[+go.dataset.k](); Store.save(); }
      const b = e.target.closest("[data-url]");
      if (b) App.pages.video.openUrl(b.dataset.url);
    });
  },
};
