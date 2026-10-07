// 设置：AI 接入、学习偏好、发音、数据
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
            <select class="select" id="daily-new">${[5, 10, 15, 20, 30, 50].map((n) => `<option ${n === p.daily_new ? "selected" : ""}>${n}</option>`).join("")}</select>
            <span class="help">刚开始建议 10–15 个，复习比学新词更重要。</span></div>
          <div class="field"><label>每日目标经验值</label>
            <select class="select" id="daily-goal">${[[30, "轻松（约 10 分钟）"], [50, "标准（约 20 分钟）"], [100, "认真（约 40 分钟）"], [150, "冲刺（1 小时以上）"]].map(([n, t]) => `<option value="${n}" ${n === p.daily_goal ? "selected" : ""}>${n} XP · ${t}</option>`).join("")}</select></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔊 发音</div>
        <div class="form-grid">
          <div class="field"><label>发音引擎</label>
            <select class="select" id="engine" ${Store.bridge ? "" : "disabled"}>
              <option value="neural" ${p.tts_engine === "neural" && Store.bridge ? "selected" : ""}>神经网络语音（推荐，更自然，需联网）</option>
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
          <p><b>系统语音</b>：使用 Windows 自带的语音，完全离线，但音色比较机械。如果列表里没有英文发音人：打开 Windows「设置 → 时间和语言 → 语音」，在「管理语音」里添加「English (United States)」，然后重启 EngNest。</p></details>
      </div>

      ${Store.bridge && !Store.remote ? `<div class="card" id="dict-card"></div><div class="card" id="stt-card"></div><div class="card" id="net-card"></div>` : ""}

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
    $("#daily-new", root).onchange = (e) => { p.daily_new = +e.target.value; Store.save(); toast("已保存", "good"); };
    $("#daily-goal", root).onchange = (e) => { p.daily_goal = +e.target.value; Store.save(); toast("已保存", "good"); };

    // 发音
    const vs = $("#voice", root);
    const neuralVoices = Store.bridge ? await pywebview.api.tts_voices() : {};
    const neural = () => Store.bridge && p.tts_engine === "neural";
    const fillVoices = async () => {
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
      if (neural()) p.neural_voice = vs.value;
      else p.tts_voice = vs.value;
      Store.save();
      TTS.speak("Hello! Welcome to EngNest.");
    };
    $("#rate", root).oninput = (e) => { p.tts_rate = +e.target.value; $("#rate-val", root).textContent = p.tts_rate; Store.save(); };
    $("#try", root).onclick = () => TTS.speak("Practice makes perfect. Let's learn English together!");

    // 数据
    if (Store.remote) $("#data-dir", root).textContent = "你正在通过局域网访问，学习进度保存在电脑上，和电脑共用一份进度。";
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

  // ---------- 局域网访问 ----------
  async lanCard(box) {
    const draw = (s) => {
      box.innerHTML = `
        <div class="card-title">📱 局域网访问 <span class="badge ${s.running ? "good" : ""}">${s.running ? "已开启" : "未开启"}</span></div>
        <p class="small muted" style="margin-top:-4px">开启后，和这台电脑连着同一个 Wi-Fi 的手机、平板或其他电脑，用浏览器就能打开 EngNest，和电脑共用同一份学习进度。</p>
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
              <div class="row mt"><button class="btn" id="lan-newcode">🔄 换一个访问码</button><button class="btn bad" id="lan-off">关闭局域网访问</button></div>
            </div>
          </div>
          <details class="mt small muted"><summary style="cursor:pointer">打不开？使用说明</summary>
            <ul>
              <li>手机和电脑必须连在<b>同一个 Wi-Fi / 路由器</b>下（手机不要用流量）。</li>
              <li>第一次开启时，Windows 可能弹出「防火墙」提示，请勾选<b>专用网络</b>并点「允许访问」。如果当时点了取消，需要到 Windows 安全中心的防火墙设置里允许 EngNest。</li>
              <li>公司、学校或酒店的 Wi-Fi 可能禁止设备之间互相访问，这种情况下连不上是正常的。</li>
              <li>AI 对话、神经语音在其他设备上都能用；但手机浏览器通过局域网访问时不允许录音（需要 HTTPS），跟读录音请在电脑上使用。</li>
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
      if (nc) nc.onclick = async () => { draw(await pywebview.api.lan_new_code()); toast("访问码已更换，旧的访问码立即失效"); };
      $$("[data-copy]", box).forEach((b) => (b.onclick = async () => {
        try { await navigator.clipboard.writeText(b.dataset.copy); toast("已复制", "good"); }
        catch { toast("复制失败，请手动选中复制"); }
      }));
    };
    box.innerHTML = `<div class="card-title">📱 局域网访问</div><div class="small muted">正在读取…</div>`;
    draw(await pywebview.api.lan_status());
  },

  async aiForm(box, root) {
    if (Store.remote) {
      box.innerHTML = `<p class="small muted">你正在通过局域网访问。AI ${AI.enabled ? "已在电脑上开启，这里可以直接使用" : "还没有开启"}；AI 设置只能在电脑上修改。</p>`;
      return;
    }
    if (!Store.bridge) {
      box.innerHTML = `<p class="small muted">当前是在浏览器里打开的预览版，AI 设置需要在桌面版（python main.py 或 EngNest.exe）中使用。</p>`;
      return;
    }
    const presets = await pywebview.api.get_presets();
    const cfg = await pywebview.api.get_ai_settings();
    box.innerHTML = `
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
    this.usageCard($("#ai-usage", box));
    const clr = $("#clear", box);
    if (clr) clr.onclick = async () => {
      await pywebview.api.save_ai_settings({ clear_key: true });
      await AI.refresh();
      Router.render();
    };
  },
};
