// 设置：AI 接入、学习偏好、发音、数据
const DAILY_NEW_PRESETS = [5, 10, 15, 20, 30, 50];

App.pages.settings = {
  // 英汉词典：内置精简版；可以下载完整版（在本机生成，下载和生成期间每秒刷新一次进度）
  async dictCard(box) {
    const s = await pywebview.api.dict_status();
    const pct = Math.round(s.progress * 100);
    box.innerHTML = `<div class="card-title">📖 英汉词典 <span class="badge ${s.full ? "good" : ""}">${s.full ? "完整版" : "内置精简版"}</span></div>
      <p class="small muted" style="margin-top:-4px">查单词（Ctrl+K）和划词释义用的词典，共 ${s.count.toLocaleString()} 条。数据来自开源的 <b>ECDICT</b> 英汉词典（MIT 协议），带音标、中文释义、考试标签、柯林斯星级和词形变化。</p>
      ${s.running ? `<div class="small">${s.stage === "download" ? "正在下载" : "正在生成词典"} ${pct}%</div><div class="bar mt-s"><i style="width:${pct}%"></i></div>`
        : s.full ? `<div class="row"><span class="small muted">已使用完整版（77 万条，包括专业术语和生僻词）。</span><span class="spacer"></span><button class="btn sm" id="dict-rm">改回精简版</button></div>`
        : `<div class="row"><span class="small muted">内置的是精简版：常用词、考试词、真实语料里出现过的词和常用短语。需要查专业术语和生僻词的话，可以下载完整版（约 66 MB，生成后占用约 100 MB）。</span>
            <button class="btn soft" id="dict-dl">⬇ 下载完整词典</button></div>`}
      ${s.stage === "error" ? `<div class="explain bad">下载失败：${esc(s.error)}<br>可能是网络连不上 GitHub，稍后再试一次。</div>` : ""}
      ${s.stage === "done" && !s.running ? `<div class="explain good">完整词典已经可以用了 🎉</div>` : ""}`;
    const dl = $("#dict-dl", box), rm = $("#dict-rm", box);
    if (dl) dl.onclick = async () => { await pywebview.api.dict_download_full(); this.dictCard(box); };
    if (rm) rm.onclick = async () => {
      if (!(await confirmBox("改回精简版", "删除本机上的完整词典，改用内置的精简版？以后可以再下载。"))) return;
      await pywebview.api.dict_remove_full();
      Dict.cache.clear();
      this.dictCard(box);
    };
    if (s.running) setTimeout(() => { if (box.isConnected) { Dict.cache.clear(); this.dictCard(box); } }, 1000);
  },

  // 离线神经语音（Piper）：在线语音连不上时的备用
  async piperCard(box) {
    const s = await pywebview.api.offline_tts_status();
    const pct = Math.round(s.progress * 100);
    const ready = s.engine && s.voices.length;
    box.innerHTML = `<div class="card-title">🔈 离线神经语音 <span class="badge ${ready ? "good" : ""}">${ready ? "已就绪" : "未下载"}</span></div>
      <p class="small muted" style="margin-top:-4px">开源的 Piper 语音（MIT 协议），只在你的电脑上运行。在线语音连不上（断网、在国内被限速）时自动用它，比 Windows 系统语音自然得多。</p>
      ${!s.available ? `<div class="small faint">这个系统不支持。</div>`
        : s.running ? `<div class="small">下载中 ${pct}%</div><div class="bar mt-s"><i style="width:${pct}%"></i></div>`
        : `<div class="pp-voices">${Object.entries(s.all_voices).map(([id, name]) => `<div class="row"><span>${esc(name)}</span><span class="spacer"></span>
            ${s.voices.includes(id) ? `<span class="badge good">已下载</span> <button class="btn sm ghost" data-try="${id}">▶ 试听</button>`
              : `<button class="btn sm soft" data-dl="${id}">⬇ 下载${s.engine ? "（约 63 MB）" : "（含引擎约 85 MB）"}</button>`}</div>`).join("")}</div>
          ${s.engine ? `<div class="row mt-s"><span class="spacer"></span><button class="btn sm ghost" id="pp-rm">全部删除</button></div>` : ""}`}
      ${s.stage === "error" ? `<div class="explain bad">下载失败：${esc(s.error)}</div>` : ""}`;
    box.onclick = async (e) => {
      const dl = e.target.closest("[data-dl]"), tr = e.target.closest("[data-try]"), rm = e.target.closest("#pp-rm");
      if (dl) { await pywebview.api.offline_tts_install(dl.dataset.dl); this.piperCard(box); }
      if (tr) {
        const r = await pywebview.api.tts_offline("Hello! This voice works offline. Let's practise English together.", tr.dataset.try, Store.prefs.tts_rate);
        if (r.ok) TTS.play(r.audio); else toast(r.error, "bad", 4000);
      }
      if (rm && (await confirmBox("删除离线神经语音", "删除下载的 Piper 引擎和声音？以后可以再下载。"))) {
        await pywebview.api.offline_tts_remove();
        await TTS.refreshOffline();
        this.piperCard(box);
      }
    };
    if (s.running) setTimeout(() => { if (box.isConnected) this.piperCard(box); }, 1000);
    else if (s.stage === "done") TTS.refreshOffline();
  },

  // 离线语音识别：AI 语伴「点击说话」用的 Whisper 模型
  async sttCard(box) {
    const s = await pywebview.api.stt_status();
    const pct = Math.round(s.progress * 100);
    box.innerHTML = `<div class="card-title">🎙️ 语音识别（离线） <span class="badge ${s.model ? "good" : ""}">${s.model ? "已就绪" : "未下载"}</span></div>
      <p class="small muted" style="margin-top:-4px">AI 语伴的「点击说话」用 Whisper 英语模型把你的话变成文字，只在你的电脑上运行，不联网、不花钱。</p>
      ${!s.available ? `<div class="small faint">这个版本没有带语音识别组件。</div>`
        : s.running ? `<div class="small">下载中 ${pct}%</div><div class="bar mt-s"><i style="width:${pct}%"></i></div>`
        : s.model ? `<div class="row"><span class="small muted">模型已下载（约 145 MB）。</span><span class="spacer"></span><button class="btn sm" id="stt-rm">删除模型</button></div>`
        : `<div class="row"><span class="small muted">第一次使用需要下载模型，约 145 MB。</span><span class="spacer"></span><button class="btn soft" id="stt-dl">⬇ 下载模型</button></div>`}
      ${s.stage === "error" ? `<div class="explain bad">下载失败：${esc(s.error)}</div>` : ""}`;
    const dl = $("#stt-dl", box), rm = $("#stt-rm", box);
    if (dl) dl.onclick = async () => { await pywebview.api.stt_download(); this.sttCard(box); };
    if (rm) rm.onclick = async () => {
      if (!(await confirmBox("删除语音识别模型", "删除后「点击说话」不能用，以后可以再下载。"))) return;
      await pywebview.api.stt_remove();
      this.sttCard(box);
    };
    if (s.running) setTimeout(() => { if (box.isConnected) this.sttCard(box); }, 1000);
  },

  async render(root) {
    const p = Store.prefs;
    root.innerHTML = pageHead("设置") + `
      <div class="card">
        <div class="card-title">🤖 AI 接入 <span class="badge ${AI.enabled ? "good" : ""}" id="ai-state">${AI.enabled ? "已开启" : "未开启"}</span></div>
        <p class="small muted" style="margin-top:-4px">可选功能。接入后可以使用 AI 对话、作文批改、翻译点评、任意查词、生成文章等功能。API Key 只保存在你自己的电脑上。</p>
        <div id="ai-form"></div>
      </div>

      ${Store.bridge && !Store.remote ? `<div class="card" id="lan-card"></div>` : ""}
      ${Store.server ? `<div class="card" id="acc-card">
        <div class="card-title">👤 我的账号 ${Store.who?.admin ? `<span class="badge brand">管理员</span>` : ""}</div>
        <p class="small muted" style="margin-top:-4px">你登录的是 <b>${esc(Store.who?.name || "")}</b>。学习进度、生词本、设置和 AI Key 都按账号保存在服务器上，换手机、换电脑登录同一个账号就能接着学。</p>
        <div class="row" style="flex-wrap:wrap"><button class="btn" id="acc-pw">🔒 修改密码</button><button class="btn ghost" id="acc-out">退出登录</button></div></div>
        ${Store.who?.admin ? `<div class="card" id="admin-card"></div>` : ""}` : ""}
      ${Store.remote && !Store.server ? `<div class="card">
        <div class="card-title">📱 局域网访问</div>
        <p class="small muted" style="margin-top:-4px">${Store.who
          ? `你是 <b>${esc(Store.who.name)}</b>：你的学习进度、生词本和设置单独保存在电脑上，和电脑主人的分开，互不影响。`
          : "你用的是电脑主人的访问码：学习进度和电脑上的是同一份。"}</p>
        <button class="btn" id="lan-logout">🔑 换一个访问码 / 退出</button></div>` : ""}

      <div class="card">
        <div class="card-title">🎨 界面风格</div>
        <div class="skin-opts" id="skins">${SKINS.map(([id, name, desc, dots, portrait]) => `<button class="skin-opt ${(p.skin || "cabinet") === id ? "active" : ""} ${portrait ? "has-portrait" : ""}" data-sk="${id}">
          ${portrait ? `<span class="skin-portrait"><img src="${portrait}" alt=""></span>` : ""}<span class="skin-opt-copy"><span class="skin-dots">${dots.map((c) => `<i style="background:${c}"></i>`).join("")}</span><b>${name}</b><span class="small muted">${desc}</span></span></button>`).join("")}</div>
        <div class="row mt" style="gap:10px;flex-wrap:wrap"><span class="small muted">深浅色</span>
          <div class="tabs" id="theme-mode">${[["auto", "跟随系统"], ["light", "☀️ 浅色"], ["dark", "🌙 深色"]].map(([v, l]) => `<button class="tab ${(p.theme_mode || "auto") === v ? "active" : ""}" data-mode="${v}">${l}</button>`).join("")}</div></div>
      </div>

      <div class="card">
        <div class="card-title">📅 学习计划</div>
        <div class="form-grid">
          <div class="field"><label>每天学几个新词</label>
            <div class="row" style="gap:8px">
              <select class="select" id="daily-new" style="flex:1">${DAILY_NEW_PRESETS.map((n) => `<option ${n === p.daily_new ? "selected" : ""}>${n}</option>`).join("")}
                <option value="custom" ${DAILY_NEW_PRESETS.includes(p.daily_new) ? "" : "selected"}>自定义…</option></select>
              <input class="input" type="number" id="daily-new-n" min="1" max="500" step="1" value="${p.daily_new}" inputmode="numeric" style="width:90px;${DAILY_NEW_PRESETS.includes(p.daily_new) ? "display:none" : ""}" title="1–500 个"></div>
            <span class="help">刚开始建议 10–15 个，复习比学新词更重要。想要别的数量选「自定义」，填 1–500。</span></div>
          <div class="field"><label>每日目标经验值</label>
            <select class="select" id="daily-goal">${[[30, "轻松（约 10 分钟）"], [50, "标准（约 20 分钟）"], [100, "认真（约 40 分钟）"], [150, "冲刺（1 小时以上）"]].map(([n, t]) => `<option value="${n}" ${n === p.daily_goal ? "selected" : ""}>${n} XP · ${t}</option>`).join("")}</select></div>
          <div class="field"><label>复习时希望记得多少</label>
            <select class="select" id="retention">${[[0.85, "85%（复习少一些）"], [0.9, "90%（推荐）"], [0.95, "95%（记得更牢，复习更多）"]].map(([n, t]) => `<option value="${n}" ${n === (p.retention || 0.9) ? "selected" : ""}>${t}</option>`).join("")}</select>
            <span class="help">复习安排用 FSRS 记忆算法：按每个词你记得牢不牢，算出它快要忘掉的那天再让你复习。</span></div>
          <div class="field"><label>英文释义（英英）</label>
            <select class="select" id="en-def">${[["auto", "自动：看得懂就先显示英文（推荐）"], ["zh", "总是先中文，英文放下面"], ["en", "总是先英文（挑战）"], ["off", "不显示"]].map(([v, t]) => `<option value="${v}" ${(p.en_def || "auto") === v ? "selected" : ""}>${t}</option>`).join("")}</select>
            <span class="help">用简单英语写的释义（来自 Simple English Wiktionary）。自动：释义里你不认识的词不超过 1 个才先显示英文，不然先显示中文，学的词越多，英文出现得越多。</span></div>
          <div class="field"><label>卡片滑动方向</label>
            <select class="select" id="swipe-dir"><option value="left" ${p.swipe_right_known ? "" : "selected"}>← 往左是「记住了」</option><option value="right" ${p.swipe_right_known ? "selected" : ""}>→ 往右是「记住了」（和多数 App 一样）</option></select></div>
          <div class="field"><label>卡片翻过去的样子</label>
            <select class="select" id="card-anim"><option value="page" ${p.card_anim === "slide" ? "" : "selected"}>📖 像翻书一样翻页</option><option value="slide" ${p.card_anim === "slide" ? "selected" : ""}>🃏 滑出去</option></select>
            <span class="help">手机比较卡的话可以换成「滑出去」。</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔊 发音</div>
        <div class="form-grid">
          <div class="field"><label>发音引擎</label>
            <select class="select" id="engine" ${Store.bridge ? "" : "disabled"}>
              <option value="neural" ${p.tts_engine === "neural" && Store.bridge ? "selected" : ""}>神经网络语音（推荐，更自然，需联网）</option>
              <option value="offline" ${p.tts_engine === "offline" && Store.bridge ? "selected" : ""}>离线神经语音（Piper，需先在下面下载）</option>
              <option value="system" ${p.tts_engine === "system" || !Store.bridge ? "selected" : ""}>Windows 系统语音（离线可用）</option>
            </select>
            <span class="help" id="engine-help"></span></div>
          <div class="field"><label>发音人</label><select class="select" id="voice"></select><span class="help" id="voice-help"></span></div>
          <div class="field"><label>语速：<span id="rate-val">${p.tts_rate}</span></label>
            <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${p.tts_rate}">
            <span class="help">初学建议 0.8–0.9，熟练后调到 1.0。</span></div>
        </div>
        <div class="row mt"><button class="btn soft" id="try">▶ 试听</button></div>
        <details class="mt small muted"><summary style="cursor:pointer">关于两种发音引擎</summary>
          <p><b>神经网络语音</b>：和 Edge 浏览器「大声朗读」是同一套微软语音，非常接近真人。每句话第一次播放时需要联网生成（约 1 秒），之后会缓存在本地，再播放就不用联网了。断网时会自动改用系统语音。</p>
          <p><b>离线神经语音</b>：开源的 Piper 语音，下载一次（约 85 MB）以后完全不联网，比系统语音自然得多。在线语音连不上时也会自动用它。</p>
          <p><b>系统语音</b>：使用 Windows 自带的语音，完全离线，但音色比较机械。如果列表里没有英文发音人：打开 Windows「设置 → 时间和语言 → 语音」，在「管理语音」里添加「English (United States)」，然后重启 EngNest。</p></details>
      </div>

      <div class="card">
        <div class="card-title">💻 计算机词典</div>
        <p class="small muted" style="margin-top:-4px">读技术文档、协议手册、GitHub 时用：<span id="tech-count">两千多</span>条计算机术语和缩写（网络协议、工业控制、编程、操作系统、数据库、安全、云与运维、AI、硬件），每条有英文全称、中文和一句话解释，还收了文档里常见的 optionally、deprecated、respectively 这类词。查词浮层和「查单词」（Ctrl+K）里都能查到。</p>
        <div class="form-grid">
          <div class="field"><label>查词时显示计算机释义</label>
            <select class="select" id="tech-terms">${[["auto", "智能（推荐）"], ["always", "总是显示"], ["off", "不显示"]].map(([v, t]) => `<option value="${v}" ${(p.tech_terms || "auto") === v ? "selected" : ""}>${t}</option>`).join("")}</select>
            <span class="help">智能：TCP、encapsulation 这类专业词总会显示；set、frame、port 这类日常也常见的词，只在技术文章里才显示计算机义，读小说时不打扰。</span></div>
        </div>
        <div class="row mt"><button class="btn soft" id="tech-browse">📚 浏览计算机词典</button></div>
      </div>

      ${Store.bridge && (!Store.remote || Store.who?.admin) ? `<div class="card" id="piper-card"></div><div class="card" id="dict-card"></div><div class="card" id="stt-card"></div><div class="card" id="net-card"></div>` : ""}

      ${Store.bridge && !Store.remote ? `<div class="card" id="dav-card"></div>` : ""}
      <div class="card" id="data-card">
        <div class="card-title">💾 数据与备份</div>
        <p class="small muted" id="data-dir">学习进度自动保存在本机。</p>
        ${Store.remote ? "" : `<div class="row"><button class="btn bad" id="reset">重置学习进度</button></div>`}
      </div>

      <div class="card" id="about-card">
        <div class="card-title">ℹ️ 关于</div>
        <div class="row" style="flex-wrap:wrap"><span>EngNest 英语小窝 <b id="app-ver"></b></span><span class="spacer"></span>
          ${Store.bridge && !Store.remote ? `<button class="btn soft" id="upd">检查更新</button>` : ""}<a class="btn ghost" href="#/about">📜 内容来源与开源许可</a></div>
        <div id="upd-res" class="mt-s"></div>
      </div>

      <p class="center small faint mt">EngNest 英语小窝 · 每天进步一点点 🪺</p>`;

    if ($("#dict-card", root)) this.dictCard($("#dict-card", root));
    if ($("#stt-card", root)) this.sttCard($("#stt-card", root));
    if ($("#net-card", root)) this.netCard($("#net-card", root));
    if ($("#piper-card", root)) this.piperCard($("#piper-card", root));
    if ($("#dav-card", root)) this.davCard($("#dav-card", root));
    if (Store.bridge) pywebview.api.app_info().then((i) => { $("#app-ver", root).textContent = "v" + i.version; }).catch(() => {});
    const upd = $("#upd", root);
    if (upd) upd.onclick = async () => {
      upd.disabled = true;
      $("#upd-res", root).innerHTML = aiLoading("正在检查…");
      const r = await pywebview.api.update_check();
      upd.disabled = false;
      $("#upd-res", root).innerHTML = !r.ok ? `<span class="small muted">${esc(r.error)}</span>`
        : r.newer ? `<div class="explain good">有新版本 <b>v${esc(r.latest)}</b>（现在是 v${esc(r.current)}）。<a href="#" id="upd-go">去下载页</a>
            ${r.notes ? `<details class="small mt-s"><summary style="cursor:pointer">更新内容</summary><div>${mdLite(r.notes)}</div></details>` : ""}</div>`
        : `<span class="small muted">已经是最新版本（v${esc(r.current)}）。</span>`;
      const go = $("#upd-go", root);
      if (go) go.onclick = (e) => { e.preventDefault(); pywebview.api.open_url(r.url); };
    };

    // 界面风格
    $("#skins", root).onclick = (e) => {
      const b = e.target.closest("[data-sk]");
      if (!b) return;
      p.skin = b.dataset.sk;
      Store.save();
      applySkin();
        ThemeCharacter.refresh();
      $$("#skins .skin-opt", root).forEach((x) => x.classList.toggle("active", x === b));
    };
    $("#theme-mode", root).onclick = (e) => {
      const b = e.target.closest("[data-mode]");
      if (!b) return;
      p.theme_mode = b.dataset.mode;
      Store.save();
      applySkin();
      $$("#theme-mode .tab", root).forEach((x) => x.classList.toggle("active", x === b));
    };

    // 学习计划
    const dn = $("#daily-new", root), dnN = $("#daily-new-n", root);
    dn.onchange = () => {
      if (dn.value === "custom") { dnN.style.display = ""; dnN.focus(); dnN.select(); return; }
      dnN.style.display = "none";
      p.daily_new = dnN.value = +dn.value;
      Store.save();
      renderNav();
      toast("已保存", "good");
    };
    dnN.onchange = () => {
      const n = Math.round(+dnN.value);
      if (!(n >= 1 && n <= 500)) { dnN.value = p.daily_new; return toast("请填 1 到 500 之间的数", "bad"); }
      p.daily_new = dnN.value = n;
      Store.save();
      renderNav();
      toast(`已保存：每天学 ${n} 个新词${n > 50 ? "（新词多了复习量也会跟着变大，记得每天复习）" : ""}`, "good", 4000);
    };
    $("#daily-goal", root).onchange = (e) => { p.daily_goal = +e.target.value; Store.save(); toast("已保存", "good"); };
    $("#retention", root).onchange = (e) => { p.retention = +e.target.value; Store.save(); toast("已保存，之后的复习按新的目标安排", "good"); };
    $("#swipe-dir", root).onchange = (e) => { p.swipe_right_known = e.target.value === "right"; Store.save(); toast("已保存", "good"); };
    $("#card-anim", root).onchange = (e) => { p.card_anim = e.target.value; Store.save(); toast("已保存", "good"); };
    if ($("#acc-card", root)) this.accountCard(root);
    if ($("#admin-card", root)) this.adminCard($("#admin-card", root));
    const lo = $("#lan-logout", root);
    if (lo) lo.onclick = async () => {
      if (!(await confirmBox("换一个访问码", "退出后要重新输入访问码。你的学习记录都保存在电脑上，不会丢。", "退出"))) return;
      await Store.flush();
      lanLogout();
    };
    $("#en-def", root).onchange = (e) => { p.en_def = e.target.value; Store.save(); toast("已保存", "good"); };
    $("#tech-terms", root).onchange = (e) => { p.tech_terms = e.target.value; Store.save(); toast("已保存", "good"); };
    $("#tech-browse", root).onclick = () => openDictSearch("", { tech: true });
    TechDict.load().then((ok) => { if (ok && $("#tech-count", root)) $("#tech-count", root).textContent = TechDict.items.length.toLocaleString() + " "; });

    // 发音
    const vs = $("#voice", root);
    const neuralVoices = Store.bridge ? await pywebview.api.tts_voices() : {};
    const neural = () => Store.bridge && (p.tts_engine || "neural") === "neural";
    const fillVoices = async () => {
      if (Store.bridge && p.tts_engine === "offline") {
        const st = await pywebview.api.offline_tts_status();
        vs.innerHTML = st.voices.length ? st.voices.map((v) => `<option value="${v}" ${v === p.offline_voice ? "selected" : ""}>${esc(st.all_voices[v])}</option>`).join("")
          : `<option>还没有下载离线声音</option>`;
        $("#voice-help", root).textContent = st.voices.length ? "" : "请先在下面「离线神经语音」里下载。";
        $("#engine-help", root).textContent = "";
        return;
      }
      if (neural()) {
        vs.innerHTML = Object.entries(neuralVoices).map(([k, v]) => `<option value="${k}" ${k === p.neural_voice ? "selected" : ""}>${esc(v)}</option>`).join("");
        const mb = await pywebview.api.tts_cache_info();
        $("#voice-help", root).innerHTML = `已缓存 ${mb} MB 语音` + (Store.remote ? "" : ` <a href="#" id="clear-cache">清空缓存</a>`);
        const cc = $("#clear-cache", root);
        if (cc) cc.onclick = async (e) => { e.preventDefault(); await pywebview.api.tts_clear_cache(); fillVoices(); toast("缓存已清空"); };
        $("#engine-help", root).textContent = "";
      } else {
        const list = TTS.voices;
        vs.innerHTML = list.length
          ? list.map((v) => `<option value="${esc(v.name)}" ${TTS.voice() === v ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")
          : `<option>未找到英文发音人</option>`;
        $("#voice-help", root).textContent = list.length ? `找到 ${list.length} 个英文发音人。` : "未找到英文发音人，请看下方说明。";
        $("#engine-help", root).textContent = Store.bridge ? "" : "浏览器预览版只能使用系统语音。";
      }
    };
    await fillVoices();
    setTimeout(() => { if (!neural()) fillVoices(); }, 800); // 系统语音列表有时是异步加载的
    $("#engine", root).onchange = (e) => { p.tts_engine = e.target.value; TTS.neuralFailedAt = 0; Store.save(); fillVoices(); };
    vs.onchange = () => {
      if (p.tts_engine === "offline") p.offline_voice = vs.value;
      else if (neural()) p.neural_voice = vs.value;
      else p.tts_voice = vs.value;
      Store.save();
      TTS.speak("Hello! Welcome to EngNest.");
    };
    $("#rate", root).oninput = (e) => { p.tts_rate = +e.target.value; $("#rate-val", root).textContent = p.tts_rate; Store.save(); };
    $("#try", root).onclick = () => TTS.speak("Practice makes perfect. Let's learn English together!");

    // 数据
    if (Store.server) $("#data-dir", root).textContent = "学习进度保存在服务器上，按账号分开，服务器每天自动备份。";
    else if (Store.remote) $("#data-dir", root).textContent = "你正在通过局域网访问，学习进度保存在电脑上，和电脑共用一份进度。";
    else if (Store.bridge) this.dataCard($("#data-card", root));
    else {
      const rs = $("#reset", root);
      rs.onclick = async () => {
        if (!(await confirmBox("重置学习进度", "所有单词记录、经验值、打卡记录都会被清空。确定吗？", "确定重置", true))) return;
        const prefs = Store.data.prefs;
        Store.data = DEFAULT_PROGRESS();
        Store.data.prefs = prefs;
        await Store.flush();
        toast("进度已重置");
        Router.go("home");
      };
    }

    await this.aiForm($("#ai-form", root), root);
    const lc = $("#lan-card", root);
    if (lc) this.lanCard(lc);
  },

  // ---------- AI 用量和每月上限 ----------
  async usageCard(box) {
    const u = await pywebview.api.ai_usage();
    const L = u.limit || {}, cur = u.months[0];
    const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + " M" : n >= 1e3 ? (n / 1e3).toFixed(1) + " K" : String(n));
    box.innerHTML = `<details ${L.monthly_tokens ? "open" : ""}><summary class="card-title" style="cursor:pointer;margin:0">📊 AI 用量
        <span class="small muted" style="font-weight:normal">本月 ${fmt(u.this_month)} token${L.monthly_tokens ? ` / 上限 ${fmt(L.monthly_tokens)}` : ""}${cur?.cost != null ? ` · 约 ¥${cur.cost}` : ""}</span></summary>
      ${u.months.length ? `<table class="word-table mt-s"><tr><th>月份</th><th>模型</th><th>次数</th><th>输入</th><th>输出</th><th>缓存命中</th></tr>
        ${u.months.flatMap((m) => m.models.map((x, i) => `<tr><td>${i ? "" : esc(m.month)}</td><td>${esc(x.model)}</td><td>${x.calls}</td>
          <td>${fmt(x.input)}</td><td>${fmt(x.output)}</td><td>${fmt(x.cache_read || 0)}</td></tr>`)).join("")}</table>` : `<p class="small faint">还没有用过 AI。</p>`}
      <div class="form-grid mt-s">
        <div class="field"><label>每月上限（token，0 表示不限）</label><input class="input" id="lim" type="number" min="0" step="100000" value="${L.monthly_tokens || 0}">
          <span class="help">到了上限就不再调用 AI，下个月自动恢复。聊天一轮大约几百到两千 token。</span></div>
        <div class="field"><label>单价（元 / 百万 token，用来估算费用）</label>
          <div class="row" style="gap:6px"><input class="input" id="pin" type="number" min="0" step="0.1" value="${L.price_in || 0}" placeholder="输入"><input class="input" id="pout" type="number" min="0" step="0.1" value="${L.price_out || 0}" placeholder="输出"></div>
          <span class="help">左边输入、右边输出，按服务商的价目表填。</span></div>
      </div>
      <div class="row"><button class="btn sm" id="lim-save">保存</button></div></details>`;
    $("#lim-save", box).onclick = async () => {
      await pywebview.api.ai_set_limit({ monthly_tokens: $("#lim", box).value, price_in: $("#pin", box).value, price_out: $("#pout", box).value });
      toast("已保存", "good");
      this.usageCard(box);
    };
  },

  // ---------- 网络：代理和连通性检查 ----------
  async netCard(box) {
    const n = await pywebview.api.net_get();
    box.innerHTML = `<div class="card-title">🌐 网络</div>
      <p class="small muted" style="margin-top:-4px">神经语音、AI、下载词典和模型、维基百科都要联网。在中国大陆，GitHub、维基百科、VOA、TED 经常连不上：下载会自动换国内镜像，其他的需要代理。</p>
      <div class="field"><label>代理地址（可选）</label>
        <div class="row"><input class="input" id="proxy" value="${esc(n.proxy)}" placeholder="${n.system_proxy ? `留空使用系统代理：${esc(n.system_proxy)}` : "如 http://127.0.0.1:7890，留空表示不用代理"}" style="flex:1">
          <button class="btn" id="proxy-save">保存</button></div>
        <span class="help">填你的代理软件提供的 HTTP 代理地址，AI、发音、下载马上生效；VOA 原声、在线视频这类网页里直接播放的要重启 EngNest 才生效。留空时自动使用 Windows 系统代理（如果开着）。</span></div>
      <div class="row mt"><button class="btn soft" id="net-test">🔍 检查网络</button><span class="small faint" id="net-test-tip">看看哪些服务现在能连上</span></div>
      <div id="net-res" class="net-res"></div>`;
    $("#proxy-save", box).onclick = async () => {
      await pywebview.api.net_set($("#proxy", box).value);
      TTS.neuralFailedAt = 0;
      toast("已保存", "good");
      this.netCard(box);
    };
    $("#net-test", box).onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      $("#net-res", box).innerHTML = aiLoading("正在检查，最多 10 秒…");
      const rs = await pywebview.api.net_test();
      btn.disabled = false;
      $("#net-res", box).innerHTML = rs.map((r) => `<div class="net-row"><span>${r.ok ? "✅" : "❌"}</span><span>${esc(r.name)}</span>
        <span class="small faint">${r.ok ? `${r.ms} ms` : esc(r.error)}</span></div>`).join("")
        + (rs.some((r) => !r.ok) ? `<p class="small muted mt-s">连不上的服务：下载类会自动换镜像；维基百科、VOA、TED 视频需要代理。AI 服务商（DeepSeek、通义千问等）国内能直接用。</p>` : "");
    };
  },

  // ---------- 多台电脑同步（WebDAV） ----------
  async davCard(box) {
    const c = await pywebview.api.webdav_get();
    box.innerHTML = `<div class="card-title">☁️ 多台电脑同步（WebDAV） <span class="badge ${c.url && c.has_password ? "good" : ""}">${c.url && c.has_password ? "已设置" : "未设置"}</span></div>
      <p class="small muted" style="margin-top:-4px">家里和公司的电脑都装了 EngNest？通过支持 WebDAV 的网盘（坚果云、Nextcloud 等）同步学习进度：
        每台电脑的学习记录会合在一起，不会互相覆盖。只同步学习进度，不同步设置和 API Key。</p>
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1"><label>WebDAV 地址</label><input class="input" id="dav-url" value="${esc(c.url)}" placeholder="https://dav.jianguoyun.com/dav/"></div>
        <div class="field"><label>用户名</label><input class="input" id="dav-user" value="${esc(c.user)}" placeholder="坚果云填登录邮箱" autocomplete="off"></div>
        <div class="field"><label>密码</label><input class="input" id="dav-pass" type="password" autocomplete="off" placeholder="${c.has_password ? "已保存，留空表示不修改" : "坚果云要用「应用密码」"}"></div>
        <div class="field"><label>网盘里的文件夹</label><input class="input" id="dav-folder" value="${esc(c.folder)}"></div>
        <div class="field"><label>自动同步</label><label class="small row" style="gap:6px;cursor:pointer;margin-top:8px"><input type="checkbox" id="dav-auto" ${c.auto ? "checked" : ""}> 打开、关闭软件时和每 15 分钟同步一次</label></div>
      </div>
      <div class="row mt" style="flex-wrap:wrap"><button class="btn" id="dav-save">保存</button><button class="btn primary" id="dav-sync">🔄 立即同步</button>
        ${c.url ? `<button class="btn ghost" id="dav-clear">清除设置</button>` : ""}
        <span class="small muted" id="dav-state">${c.running ? "正在同步…" : c.error ? `<span class="bad-text">${esc(c.error)}</span>` : c.last ? `上次同步：${esc(c.last)}` : ""}</span></div>
      <details class="mt small muted"><summary style="cursor:pointer">坚果云怎么设置？</summary>
        <ol><li>登录坚果云网页版 → 右上角账户名 →「账户信息」→「安全选项」。</li>
          <li>「第三方应用管理」里点「添加应用」，名字填 EngNest，生成一个<b>应用密码</b>。</li>
          <li>这里填：地址 <code>https://dav.jianguoyun.com/dav/</code>，用户名是坚果云的登录邮箱，密码填刚生成的应用密码。</li>
          <li>每台电脑都这样设置一次，同步的文件夹名要一样。</li></ol>
        <p>密码在这台电脑上加密保存。学习进度会存成网盘里的 EngNest/progress.json。</p></details>`;
    const val = () => ({ url: $("#dav-url", box).value, user: $("#dav-user", box).value, password: $("#dav-pass", box).value,
      folder: $("#dav-folder", box).value, auto: $("#dav-auto", box).checked });
    $("#dav-save", box).onclick = async () => { await pywebview.api.webdav_set(val()); toast("已保存", "good"); this.davCard(box); };
    $("#dav-sync", box).onclick = async (e) => {
      e.currentTarget.disabled = true;
      $("#dav-state", box).textContent = "正在同步…";
      await pywebview.api.webdav_set(val());
      await Store.flush();
      const r = await pywebview.api.webdav_sync();
      if (r.ok) {
        if (r.changed_local) { await Store.reload(); renderSidebarFoot(); renderNav(); }
        toast(r.changed_local ? "同步完成，已合并其他电脑上的学习记录" : "同步完成", "good");
      } else toast(r.error, "bad", 6000);
      this.davCard(box);
    };
    const clr = $("#dav-clear", box);
    if (clr) clr.onclick = async () => {
      if (!(await confirmBox("清除 WebDAV 设置", "以后不再同步（网盘里已经同步的文件不会删除）。"))) return;
      await pywebview.api.webdav_set({ clear: true });
      this.davCard(box);
    };
  },

  // ---------- 数据位置、备份、导入导出 ----------
  async dataCard(box) {
    const [loc, bk] = await Promise.all([pywebview.api.data_location(), pywebview.api.progress_backups()]);
    const list = bk.items;
    const item = (b) => `<div class="bk-item"><span>${esc(b.date)}</span><span class="small faint">${esc(b.name.replace(/^progress-|\.json$/g, ""))} · ${b.kb} KB</span>
      <span class="spacer"></span><button class="btn sm ghost" data-restore="${esc(b.name)}">恢复到这份</button></div>`;
    box.innerHTML = `<div class="card-title">💾 数据与备份</div>
      <div class="field"><label>数据位置</label>
        <div class="lan-url"><code>${esc(loc.dir)}</code><button class="btn sm ghost" id="open-dir">📂 打开</button><button class="btn sm ghost" id="move-dir">更改位置…</button></div>
        <span class="help">学习进度、设置、导入的读物、下载的模型和语音缓存都在这里（缓存在 cache 子文件夹）。更改后重启 EngNest 生效，现有数据会自动搬过去。</span></div>
      <div class="field mt"><label>备份</label>
        <span class="help" style="margin-top:0">每天打开和关闭时自动备份一次，保留最近 7 天；导入、恢复、重置之前也会先备份。</span>
        <div class="bk-list">${list.length ? list.slice(0, 4).map(item).join("") : `<span class="small faint">还没有备份</span>`}
          ${list.length > 4 ? `<details class="small"><summary style="cursor:pointer">更早的备份（${list.length - 4} 份）</summary>${list.slice(4).map(item).join("")}</details>` : ""}</div>
        <div class="row mt-s" style="flex-wrap:wrap">
          <button class="btn soft" id="bk-now">立即备份</button>
          <button class="btn" id="bk-export">⬆ 导出进度…</button>
          <button class="btn" id="bk-import">⬇ 导入并合并…</button>
          <button class="btn ghost" id="bk-replace">导入并替换…</button></div>
        <span class="help">导出的 JSON 文件可以拷到另一台电脑上导入。「合并」会把两边的学习记录合在一起；「替换」用文件里的进度覆盖现在的。</span></div>
      <div class="row mt" style="flex-wrap:wrap"><button class="btn ghost" id="open-logs">📄 打开日志文件夹</button><button class="btn ghost" id="diag">🩺 导出诊断信息…</button>
        <span class="spacer"></span><button class="btn bad" id="reset">重置学习进度</button></div>`;
    const refresh = () => this.dataCard(box);
    const reloadAll = async (msg) => { await Store.reload(); renderSidebarFoot(); renderNav(); toast(msg, "good"); Router.render(); };
    $("#open-dir", box).onclick = () => pywebview.api.open_data_dir();
    $("#open-logs", box).onclick = () => pywebview.api.open_logs();
    $("#diag", box).onclick = async () => {
      const p = await pywebview.api.export_diagnostics();
      if (p) toast("已导出到 " + p + "（不含 API Key 和学习内容）", "good", 6000);
    };
    $("#move-dir", box).onclick = async () => {
      const dir = await pywebview.api.pick_folder();
      if (!dir) return;
      const target = /engnest$/i.test(dir) ? dir : dir.replace(/[\\/]+$/, "") + "\\EngNest";
      if (!(await confirmBox("更改数据位置", `以后把数据放在 ${target}？重启 EngNest 后生效，现有的数据会自动搬过去。`, "确定"))) return;
      const r = await pywebview.api.set_data_location(target);
      if (r.error) return toast(r.error, "bad", 5000);
      toast("已设置，重启 EngNest 后生效", "good", 5000);
    };
    $("#bk-now", box).onclick = async () => { await Store.flush(); await pywebview.api.progress_backup_now(); toast("已备份", "good"); refresh(); };
    $("#bk-export", box).onclick = async () => {
      await Store.flush();
      const path = await pywebview.api.progress_export();
      if (path) toast("已导出到 " + path, "good", 5000);
    };
    const imp = async (mode) => {
      if (mode === "replace" && !(await confirmBox("导入并替换", "用文件里的进度覆盖现在的进度？现在的进度会先自动备份。", "选择文件", true))) return;
      await Store.flush();
      const r = await pywebview.api.progress_import(mode);
      if (!r) return;
      if (r.error) return toast(r.error, "bad", 5000);
      await reloadAll(mode === "replace" ? "已导入" : "已导入并合并");
    };
    $("#bk-import", box).onclick = () => imp("merge");
    $("#bk-replace", box).onclick = () => imp("replace");
    box.onclick = async (e) => {
      const b = e.target.closest("[data-restore]");
      if (!b) return;
      if (!(await confirmBox("恢复备份", `把学习进度恢复到这份备份（${b.dataset.restore}）？现在的进度会先自动备份。`, "恢复", true))) return;
      await Store.flush();
      if (await pywebview.api.progress_restore(b.dataset.restore)) await reloadAll("已恢复");
      else toast("恢复失败：找不到这份备份", "bad");
    };
    $("#reset", box).onclick = async () => {
      if (!(await confirmBox("重置学习进度", "所有单词记录、经验值、打卡记录都会被清空（会先自动备份一份，可以在上面恢复）。确定吗？", "确定重置", true))) return;
      if (!(await confirmBox("再确认一次", "真的要清空全部学习进度吗？", "清空", true))) return;
      await Store.flush();
      await pywebview.api.reset_progress();
      await Store.reload();
      renderSidebarFoot();
      toast("进度已重置");
      Router.go("home");
    };
  },

  // ---------- 服务器模式：我的账号 ----------
  accountCard(root) {
    $("#acc-out", root).onclick = async () => { if (await confirmBox("退出登录", "退出后要重新输入用户名和密码。学习记录都保存在服务器上，不会丢。", "退出")) accountLogout(); };
    $("#acc-pw", root).onclick = () => {
      const m = modal(`<h3>🔒 修改密码</h3>
        <form id="pw-form" class="acc-login" style="margin:0;max-width:none">
          <input class="input" name="old" type="password" placeholder="原密码" autocomplete="current-password">
          <input class="input" name="new" type="password" placeholder="新密码（至少 8 位）" autocomplete="new-password">
          <input class="input" name="new2" type="password" placeholder="再输一遍新密码" autocomplete="new-password">
          <div class="small bad-text" id="pw-msg"></div>
          <div class="modal-actions"><button class="btn" type="button" data-close>取消</button><button class="btn primary" type="submit">修改</button></div></form>
        <p class="small faint">改完以后，其他手机、电脑上的登录会退出，要用新密码重新登录。</p>`);
      $("#pw-form", m.root).onsubmit = async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        if (f.new !== f.new2) return ($("#pw-msg", m.root).textContent = "两次输入的新密码不一样");
        const r = await pywebview.api.account_change_password(f.old, f.new);
        if (!r.ok) return ($("#pw-msg", m.root).textContent = r.error);
        m.close();
        toast("密码已修改", "good");
      };
    };
  },

  // ---------- 服务器模式：管理员管理账号和邀请码 ----------
  async adminCard(box) {
    const ago = (t) => { if (!t) return "还没用过"; const d = Math.floor((Date.now() / 1000 - t) / 86400); return d < 1 ? "今天用过" : `${d} 天前用过`; };
    const draw = async () => {
      const [users, invites] = await Promise.all([pywebview.api.admin_users(), pywebview.api.admin_invites()]);
      const unused = invites.filter((i) => !i.used_by && !i.admin);
      box.innerHTML = `<div class="card-title">👥 账号和邀请码</div>
        <p class="small muted" style="margin-top:-4px">别人要注册，必须先有你发的邀请码（一个码只能注册一个账号）。每个账号的学习进度、设置和 AI Key 互不影响。</p>
        <div class="row" style="flex-wrap:wrap;gap:8px"><input class="input" id="inv-note" maxlength="40" placeholder="备注，比如：给小明" style="max-width:220px"><button class="btn soft" id="inv-new">＋ 生成邀请码</button></div>
        ${unused.length ? `<div class="small muted mt">还没用的邀请码：</div>${unused.map((i) => `<div class="row acc-inv"><span class="lan-code sm">${esc(i.code.slice(0, 4))} ${esc(i.code.slice(4))}</span>
          <span class="small faint">${esc(i.note || "")} · ${esc(i.created)}</span><span class="spacer"></span>
          <button class="btn sm ghost" data-copy="${esc(i.code)}">复制</button><button class="btn sm ghost bad-text" data-revoke="${esc(i.code)}">作废</button></div>`).join("")}` : ""}
        <div class="small muted mt">账号（${users.length}）：</div>
        ${users.map((u) => `<div class="lan-user" data-uid="${esc(u.id)}" data-name="${esc(u.username)}">
          <div class="lan-user-name"><b>${esc(u.username)}${u.admin ? ` <span class="badge brand">管理员</span>` : ""}</b>
            <span class="small faint">${esc(u.created)} 注册 · ${ago(u.last_seen)}${!u.admin && u.own_ai ? " · 🔑 用自己的 AI Key" : ""}</span></div>
          ${u.admin ? "" : `<div class="row lan-user-ops">
            ${switchHtml(`acc-ai-${esc(u.id)}`, "可以用我的 AI", u.ai, "TA 没填自己的 Key 时，用你的 Key 调 AI，费用算你的")}
            <button class="btn sm ghost" data-reset>重置密码</button>
            <button class="btn sm ghost bad-text" data-del>删除</button></div>`}</div>`).join("")}`;
      $("#inv-new", box).onclick = async () => {
        const code = await pywebview.api.admin_invite_new($("#inv-note", box).value);
        modal(`<div class="center"><h3>新的邀请码</h3><div class="lan-code">${esc(code.slice(0, 4))} ${esc(code.slice(4))}</div>
          <p class="small muted">发给要注册的人：打开网站 → 注册 → 填这个邀请码，自己设用户名和密码。只能用一次。</p>
          <div class="modal-actions" style="justify-content:center"><button class="btn" data-copy="${esc(code)}">复制</button><button class="btn primary" data-close>好</button></div></div>`)
          .root.addEventListener("click", copyHandler);
        draw();
      };
      $$("[data-revoke]", box).forEach((b) => (b.onclick = async () => { await pywebview.api.admin_invite_revoke(b.dataset.revoke); draw(); }));
      $$(".lan-user", box).forEach((row) => {
        const uid = row.dataset.uid, name = row.dataset.name;
        const sw = $(`#acc-ai-${uid}`, row);
        if (sw) sw.onchange = async (e) => { await pywebview.api.admin_user_ai(uid, e.target.checked); toast(e.target.checked ? `「${name}」现在可以用你的 AI 了` : `已关闭「${name}」用你的 AI`, "good"); };
        const rs = $("[data-reset]", row);
        if (rs) rs.onclick = async () => {
          const code = await pywebview.api.admin_user_reset(uid);
          modal(`<div class="center"><h3>「${esc(name)}」的重置码</h3><div class="lan-code">${esc(code.slice(0, 4))} ${esc(code.slice(4))}</div>
            <p class="small muted">发给 TA：在登录页点「忘记密码」，填这个重置码、用户名和新密码。24 小时内有效，用一次就失效。</p>
            <div class="modal-actions" style="justify-content:center"><button class="btn" data-copy="${esc(code)}">复制</button><button class="btn primary" data-close>好</button></div></div>`)
            .root.addEventListener("click", copyHandler);
        };
        const del = $("[data-del]", row);
        if (del) del.onclick = async () => {
          if (!(await confirmBox("删除账号", `删除「${name}」：TA 马上不能再登录，TA 的学习进度、生词本、设置、AI Key 和聊天记录都会从服务器上删除，不能恢复。`, "删除", true))) return;
          await pywebview.api.admin_user_remove(uid);
          toast(`已删除「${name}」`);
          draw();
        };
      });
    };
    const copyHandler = async (e) => {
      const b = e.target.closest("[data-copy]");
      if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); toast("已复制", "good"); } catch { toast("复制失败，请手动抄下来"); }
    };
    box.addEventListener("click", copyHandler);
    box.innerHTML = `<div class="card-title">👥 账号和邀请码</div><div class="small muted">正在读取…</div>`;
    draw();
  },

  // ---------- 局域网访问 ----------
  async lanCard(box) {
    const draw = (s) => {
      box.innerHTML = `
        <div class="card-title">📱 局域网访问 <span class="badge ${s.running ? "good" : ""}">${s.running ? "已开启" : "未开启"}</span></div>
        <p class="small muted" style="margin-top:-4px">开启后，和这台电脑连着同一个 Wi-Fi 的手机、平板或其他电脑，用浏览器就能打开 EngNest。用你的访问码进来和电脑共用同一份学习进度；给别人用的话在下面「给其他人用」里单独加人。</p>
        ${s.running ? `
          <div class="lan-grid">
            <div class="lan-qr">${s.qr || ""}<div class="small faint center">手机扫码直接进入</div></div>
            <div>
              <div class="field"><label>在其他设备的浏览器地址栏输入</label>
                <div class="lan-url"><code>${esc(s.urls[0])}</code><button class="btn sm ghost" data-copy="${esc(s.urls[0])}">复制</button></div>
                ${s.urls.length > 1 ? `<details class="small muted"><summary style="cursor:pointer">上面的打不开？试试其他地址（${s.urls.length - 1} 个）</summary>
                  ${s.urls.slice(1).map((u) => `<div class="lan-url"><code>${esc(u)}</code><button class="btn sm ghost" data-copy="${esc(u)}">复制</button></div>`).join("")}
                  <div class="faint">这台电脑装了虚拟机或代理软件，所以有多个网络地址。</div></details>` : ""}</div>
              <div class="field mt-s"><label>访问码</label><div class="lan-code">${esc(s.code.slice(0, 4))} ${esc(s.code.slice(4))}</div>
                <span class="help">在其他设备上第一次打开时需要输入（不分大小写）；扫码进入会自动带上访问码。同一台设备输错 5 次会被锁 10 分钟。</span></div>
              <div class="row mt" style="flex-wrap:wrap"><button class="btn" id="lan-newcode">🔄 换一个访问码</button><button class="btn bad" id="lan-off">关闭局域网访问</button>
                ${switchHtml("lan-https", "HTTPS（手机可以录音）", s.https, "用这台电脑自己签的证书加密；手机第一次打开要点「继续访问」")}</div>
            </div>
          </div>
          <div class="lan-users mt">
            <div class="card-title" style="font-size:15px">👥 给其他人用</div>
            <p class="small muted" style="margin-top:-6px">上面的访问码是<b>你自己的</b>，进来用的是你的学习进度。给朋友、家人单独加一个人，TA 会拿到自己的访问码：学习进度、生词本、设置和 AI 语伴聊天记录都单独保存，不会影响你的。AI：TA 可以在自己的设置里填自己的 Key（不算你的用量）；没填的话，可以在这里给 TA 开「可以用我的 AI」（用你的 Key，默认关闭）。</p>
            ${(s.users || []).map((u) => `<div class="lan-user" data-uid="${esc(u.id)}">
              <div class="lan-user-name"><b>${esc(u.name)}</b><span class="small faint">${esc(u.created || "")} 添加${u.own_ai ? " · 🔑 用自己的 AI Key" : ""}</span></div>
              <div class="lan-code sm">${esc(u.code.slice(0, 4))} ${esc(u.code.slice(4))}</div>
              <div class="row lan-user-ops">
                ${switchHtml(`lan-ai-${esc(u.id)}`, "可以用我的 AI", u.ai, "TA 没填自己的 Key 时，用你的 Key 调 AI，费用算你的；TA 填了自己的 Key 就用 TA 自己的")}
                <button class="btn sm ghost" data-uqr title="显示 TA 的扫码二维码">二维码</button>
                <button class="btn sm ghost" data-ucode title="换一个访问码，TA 要用新码重新进来">换码</button>
                <button class="btn sm ghost bad-text" data-udel title="删除这个人和 TA 的学习记录">删除</button>
              </div></div>`).join("") || `<div class="small faint">还没有添加其他人。</div>`}
            <div class="row mt-s"><input class="input" id="lan-uname" maxlength="20" placeholder="名字，比如 小明" style="max-width:200px"><button class="btn soft" id="lan-uadd">＋ 添加</button></div>
          </div>
          <details class="mt small muted"><summary style="cursor:pointer">打不开？使用说明</summary>
            <ul>
              <li>手机和电脑必须连在<b>同一个 Wi-Fi / 路由器</b>下（手机不要用流量）。</li>
              <li>第一次开启时，Windows 可能弹出「防火墙」提示，请勾选<b>专用网络</b>并点「允许访问」。如果当时点了取消，需要到 Windows 安全中心的防火墙设置里允许 EngNest。</li>
              <li>公司、学校或酒店的 Wi-Fi 可能禁止设备之间互相访问，这种情况下连不上是正常的。</li>
              <li>AI 对话、神经语音在其他设备上都能用。${s.https_on ? "开着 HTTPS，手机上也能录音（跟读评测、和 AI 语伴说话）：第一次打开时浏览器会提示「不安全 / 证书无效」，这是因为证书是这台电脑自己签的，点「高级 → 继续访问」就行。" : "现在用的是 http：手机浏览器不允许录音。打开下面的 HTTPS 开关后就能录音了。"}</li>
              <li>AI Key 等设置只能在电脑上修改。EngNest 关闭后，局域网访问也会停止；下次打开 EngNest 会自动重新开启。</li>
            </ul></details>`
        : `<div class="row"><span class="small muted">端口</span><input class="input" id="lan-port" value="${s.port}" style="width:100px">
             <button class="btn primary" id="lan-on">开启局域网访问</button></div>
           ${s.error ? `<div class="ai-box mt-s" style="background:var(--bad-soft)">😥 ${esc(s.error)}</div>` : ""}`}`;
      const on = $("#lan-on", box), off = $("#lan-off", box), nc = $("#lan-newcode", box);
      if (on) on.onclick = async () => {
        on.disabled = true;
        on.textContent = "正在开启…";
        const st = await pywebview.api.lan_set(true, +$("#lan-port", box).value || 8766);
        draw(st);
        if (st.running) toast("局域网访问已开启", "good");
      };
      if (off) off.onclick = async () => draw(await pywebview.api.lan_set(false));
      const hs = $("#lan-https", box);
      if (hs) hs.onchange = async (e) => { draw(await pywebview.api.lan_set(true, s.port, e.target.checked)); toast(e.target.checked ? "已改用 HTTPS，手机上要用新的地址（https://）" : "已改用 http", "good", 5000); };
      if (nc) nc.onclick = async () => { draw(await pywebview.api.lan_new_code()); toast("访问码已更换，旧的访问码立即失效"); };
      // 给其他人用：添加、AI 开关、二维码、换码、删除
      const ua = $("#lan-uadd", box), un = $("#lan-uname", box);
      if (ua) {
        const add = async () => {
          const r = await pywebview.api.lan_user_add(un.value);
          if (!r.ok) return toast(r.error, "bad");
          draw(r.status);
          toast(`已添加「${un.value.trim()}」，把 TA 的访问码或二维码发给 TA`, "good", 5000);
        };
        ua.onclick = add;
        un.onkeydown = (e) => { if (e.key === "Enter") add(); };
      }
      $$(".lan-user", box).forEach((row) => {
        const uid = row.dataset.uid, name = $(".lan-user-name b", row).textContent;
        $(`#lan-ai-${uid}`, row).onchange = async (e) => {
          draw(await pywebview.api.lan_user_update(uid, { ai: e.target.checked }));
          toast(e.target.checked ? `「${name}」现在可以用 AI 了` : `已关闭「${name}」的 AI`, "good");
        };
        $("[data-uqr]", row).onclick = async () => {
          const svg = await pywebview.api.lan_user_qr(uid);
          modal(`<div class="center"><div class="card-title">「${esc(name)}」扫码进入</div><div class="lan-qr" style="margin:0 auto">${svg}</div>
            <p class="small muted">用 TA 的手机扫，会自动带上 TA 的访问码。</p><button class="btn" data-close>关闭</button></div>`);
        };
        $("[data-ucode]", row).onclick = async () => {
          if (!(await confirmBox("换一个访问码", `「${name}」的旧访问码会立即失效，TA 要用新码重新进来（学习记录不受影响）。`, "换码"))) return;
          draw(await pywebview.api.lan_user_new_code(uid));
        };
        $("[data-udel]", row).onclick = async () => {
          if (!(await confirmBox("删除这个人", `删除「${name}」：TA 的访问码立即失效，TA 的学习进度、生词本、设置和 AI 语伴聊天记录都会从这台电脑上删除，不能恢复。你自己的进度不受影响。`, "删除", true))) return;
          draw(await pywebview.api.lan_user_remove(uid));
          toast(`已删除「${name}」`);
        };
      });
      $$("[data-copy]", box).forEach((b) => (b.onclick = async () => {
        try { await navigator.clipboard.writeText(b.dataset.copy); toast("已复制", "good"); }
        catch { toast("复制失败，请手动选中复制"); }
      }));
    };
    box.innerHTML = `<div class="card-title">📱 局域网访问</div><div class="small muted">正在读取…</div>`;
    draw(await pywebview.api.lan_status());
  },

  async aiForm(box, root) {
    // 用主人的访问码进来的：AI 设置只能在电脑上改
    if (Store.remote && !Store.who) {
      box.innerHTML = `<p class="small muted">你正在通过局域网访问。AI ${AI.enabled ? "已在电脑上开启，这里可以直接使用" : "还没有开启"}；AI 设置只能在电脑上修改。</p>`;
      return;
    }
    if (!Store.bridge) {
      box.innerHTML = `<p class="small muted">当前是在浏览器里打开的预览版，AI 设置需要在桌面版（python main.py 或 EngNest.exe）中使用。</p>`;
      return;
    }
    const presets = await pywebview.api.get_presets();
    const cfg = await pywebview.api.get_ai_settings();
    // 局域网里的其他人：填的是 TA 自己的 Key
    const whoNote = () => !Store.who ? "" : Store.who.admin
      ? `<div class="ai-box small" id="ai-who" style="margin-bottom:12px">这是你（管理员）的 AI 设置。其他账号可以填自己的 Key；也可以在下面的「账号和邀请码」里给某个人打开「可以用我的 AI」，那样 TA 用的是这里的 Key，费用算你的。</div>`
      : `<div class="ai-box small" id="ai-who" style="margin-bottom:12px">${AI.settings?.own
      ? "✅ 正在用<b>你自己的</b> API Key。它只用于你的账号，加密保存在电脑上，电脑主人也看不到完整的 Key。"
      : AI.settings?.shared
        ? "现在用的是<b>电脑主人的</b> AI（主人给你开了）。填上你自己的 Key 以后就改用你自己的。"
        : "电脑主人没有给你开 AI。填上<b>你自己的</b> API Key 就能用（只用于你的账号，加密保存在电脑上）。"}</div>`;
    box.innerHTML = whoNote() + `
      <div class="form-grid">
        <div class="field"><label>AI 服务商</label>
          <select class="select" id="provider">${Object.entries(presets).map(([k, v]) => `<option value="${k}" ${k === cfg.provider ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select></div>
        <div class="field"><label>模型名称</label>
          <div class="row" style="gap:6px"><input class="input" id="model" list="model-list" value="${esc(cfg.model)}" placeholder="如 deepseek-flash" style="flex:1">
            <button class="btn sm ghost" id="models" title="保存设置后，从服务商那里获取可用的模型名">获取列表</button></div>
          <datalist id="model-list"></datalist></div>
        <div class="field" style="grid-column:1/-1"><label>接口地址（Base URL）</label><input class="input" id="base" value="${esc(cfg.base_url)}" placeholder="https://…">
          <span class="help" id="base-help"></span></div>
        <div class="field" style="grid-column:1/-1"><label>API Key</label>
          <input class="input" id="key" type="password" autocomplete="off" placeholder="${cfg.has_key ? `已保存（${esc(cfg.key_hint)}），留空表示不修改` : "粘贴你的 API Key"}"></div>
      </div>
      <div class="row mt"><button class="btn primary" id="save">保存</button><button class="btn" id="test">测试连接</button>
        ${cfg.has_key ? `<button class="btn ghost" id="clear">清除 Key</button>` : ""}<span class="spacer"></span></div>
      <div id="test-res" class="mt-s"></div>
      <details class="mt small muted"><summary style="cursor:pointer">怎么获取 API Key？</summary>
        <ul>
          <li><b>DeepSeek</b>：platform.deepseek.com → API Keys（便宜、中文好，推荐）</li>
          <li><b>通义千问</b>：阿里云百炼控制台 bailian.console.aliyun.com → API-KEY</li>
          <li><b>Kimi</b>：platform.moonshot.cn → API Key 管理</li>
          <li><b>智谱 GLM</b>：open.bigmodel.cn → API Keys（glm-4.7-flash 免费调用）</li>
          <li><b>Claude</b>：console.anthropic.com → API Keys（需海外网络；接口地址留空即可，用中转服务时填中转地址）</li>
          <li>其他兼容 OpenAI 接口的服务选「自定义」，填接口地址和模型名。</li>
        </ul>
        <p>模型名称可以改成服务商提供的其他模型；各家模型名会更新，填好 Key 后点「获取列表」可以看到服务商现在提供的模型。</p></details>
      <div class="ai-usage mt" id="ai-usage"></div>`;

    const prov = $("#provider", box), base = $("#base", box), model = $("#model", box);
    const syncHelp = () => {
      const pr = presets[prov.value];
      const isNone = pr.type === "none";
      $$(".field", box).slice(1).forEach((f) => f.classList.toggle("hidden", isNone));
      $("#base-help", box).textContent = pr.type === "anthropic" ? "官方接口留空即可；使用中转服务时填写中转地址。" : "";
    };
    prov.onchange = () => {
      const pr = presets[prov.value];
      base.value = pr.base_url;
      model.value = pr.model;
      syncHelp();
    };
    syncHelp();

    const save = async () => {
      const newCfg = { provider: prov.value, base_url: base.value, model: model.value, api_key: $("#key", box).value };
      const r = await pywebview.api.save_ai_settings(newCfg);
      $("#key", box).value = "";
      $("#key", box).placeholder = r.has_key ? `已保存（${r.key_hint}），留空表示不修改` : "粘贴你的 API Key";
      await AI.refresh();
      const wn = $("#ai-who", box);
      if (wn) wn.outerHTML = whoNote();
      const st = $("#ai-state", root);
      st.textContent = AI.enabled ? "已开启" : "未开启";
      st.className = `badge ${AI.enabled ? "good" : ""}`;
      return r;
    };
    $("#save", box).onclick = async () => {
      await save();
      toast(AI.enabled ? "已保存，AI 功能已开启 🎉" : prov.value === "none" ? "已保存，AI 功能已关闭" : "已保存，但还缺少 Key 或模型名", AI.enabled ? "good" : "");
    };
    $("#test", box).onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      await save();
      const res = $("#test-res", box);
      res.innerHTML = aiLoading("正在连接…");
      const r = await pywebview.api.test_ai();
      btn.disabled = false;
      res.innerHTML = r.ok
        ? `<div class="ai-box" style="background:var(--good-soft)">✅ 连接成功！AI 回复：${esc(r.text.slice(0, 100))}</div>`
        : aiError(r.error);
    };
    $("#models", box).onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      await save();
      const r = await pywebview.api.ai_models();
      btn.disabled = false;
      if (!r.ok) return toast(r.error, "bad", 5000);
      $("#model-list", box).innerHTML = r.models.map((m) => `<option value="${esc(m)}">`).join("");
      toast(`获取到 ${r.models.length} 个模型，点模型名称输入框就能选`, "good", 4000);
      model.focus();
    };
    if (!Store.remote || Store.who?.admin) this.usageCard($("#ai-usage", box)); // 用量和每月上限是主人的，只在电脑上（或管理员）显示
    const clr = $("#clear", box);
    if (clr) clr.onclick = async () => {
      await pywebview.api.save_ai_settings({ clear_key: true });
      await AI.refresh();
      Router.render();
    };
  },
};
