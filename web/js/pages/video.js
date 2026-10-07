// 影视精听：播放视频 + 字幕，右侧字幕实时滚动，支持双语/沉浸、逐句跟读、单句循环、点词查义
// 路由：#/video 片库首页 · #/video/guide 正版观看 · #/video/series/<系列> 剧集列表 · #/video/play/<集> 播放片库视频 · #/video/local 打开本地视频
// 片库只收公有领域和开放授权的视频（VOA 学英语视频和 Blender 开放电影，见 tools/fetch_videos.py），在线播放或下载到本机；
// 受版权保护的剧（老友记等）只放正版平台的跳转链接（data/watch_guide.js）

// ---------- 字幕解析 ----------
const Subs = {
  time(s) {
    const m = s.trim().replace(",", ".").match(/(?:(\d+):)?(\d+):(\d+)(?:\.(\d+))?/);
    if (!m) return 0;
    const frac = m[4] ? +("0." + m[4]) : 0;
    return (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + frac;
  },
  clean(t) {
    return t.replace(/\{[^}]*\}/g, "").replace(/<[^>]+>/g, "").replace(/\\N/gi, "\n").replace(/&nbsp;/g, " ").trim();
  },
  // SRT / VTT
  parseSrt(text) {
    const cues = [];
    for (const block of text.replace(/\r/g, "").split(/\n\s*\n/)) {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      const ti = lines.findIndex((l) => l.includes("-->"));
      if (ti < 0) continue;
      const [a, b] = lines[ti].split("-->");
      const body = this.clean(lines.slice(ti + 1).join("\n"));
      if (body) cues.push({ start: this.time(a), end: this.time(b.split(" ").filter(Boolean)[0]), text: body });
    }
    return cues;
  },
  // ASS / SSA
  parseAss(text) {
    const cues = [];
    let fmt = null;
    for (const line of text.replace(/\r/g, "").split("\n")) {
      if (/^Format:/i.test(line) && fmt === null && /Start/i.test(line) && /Text/i.test(line)) {
        fmt = line.slice(7).split(",").map((s) => s.trim().toLowerCase());
      } else if (/^Dialogue:/i.test(line) && fmt) {
        const parts = line.slice(9).split(",");
        const get = (k) => parts[fmt.indexOf(k)];
        const body = this.clean(parts.slice(fmt.indexOf("text")).join(","));
        if (body) cues.push({ start: this.time(get("start")), end: this.time(get("end")), text: body });
      }
    }
    return cues;
  },
  parse(text, name) {
    const cues = /\.(ass|ssa)$/i.test(name) ? this.parseAss(text) : this.parseSrt(text);
    return cues.sort((a, b) => a.start - b.start);
  },
  hasZh: (s) => /[一-鿿]/.test(s),
  // 一个字幕文件里同时有中英文：按行拆开
  split(cues) {
    return cues.map((c) => {
      const lines = c.text.split("\n");
      const zh = lines.filter((l) => this.hasZh(l)).join(" ");
      const en = lines.filter((l) => !this.hasZh(l)).join(" ");
      return { start: c.start, end: c.end, en: en.trim(), zh: zh.trim() };
    });
  },
  // 英文和中文分别来自两个文件：按时间重叠最多的配对
  merge(enCues, zhCues) {
    return enCues.map((e) => {
      let best = null, bestOv = 0;
      for (const z of zhCues) {
        if (z.start > e.end) break;
        const ov = Math.min(e.end, z.end) - Math.max(e.start, z.start);
        if (ov > bestOv) { bestOv = ov; best = z; }
      }
      return { start: e.start, end: e.end, en: e.text.replace(/\n/g, " "), zh: best ? best.text.replace(/\n/g, " ") : "" };
    });
  },
};

App.pages.video = {
  // 本次打开期间保留（blob 地址无法持久化）
  state: { videoUrl: "", videoName: "", lines: [], enCues: null, zhCues: null },
  mode: "both",     // both 双语 / en / zh / none 沉浸
  loop: false,      // 单句循环
  autoPause: false, // 逐句暂停（跟读模式）

  render(root, params, signal) {
    if (params[0] === "local") return this.player(root, signal, this.state, { local: true });
    if (params[0] === "play") return this.playFilm(root, params[1], signal);
    if (params[0] === "series") return this.series(root, params[1], signal);
    return this.library(root, params[0] === "guide" ? "guide" : "lib");
  },

  // opt.local：自己打开的本地文件；否则是片库视频，opt.head 是页头
  player(root, signal, s, opt) {
    root.classList.add("page-wide");
    root.innerHTML = (opt.local ? `<a class="back-link" href="#/video">‹ 返回片库</a>` + pageHead("打开本地视频", "",
      `<div class="row"><label class="btn primary">🎬 打开视频<input type="file" id="f-video" accept="video/*,.mkv" hidden></label>
       <label class="btn">📝 英文/双语字幕<input type="file" id="f-en" accept=".srt,.vtt,.ass,.ssa" hidden></label>
       <label class="btn">🀄 中文字幕<input type="file" id="f-zh" accept=".srt,.vtt,.ass,.ssa" hidden></label></div>`) : opt.head)
      + `<div class="video-layout">
          <div class="video-left">
            <div class="video-box" id="vbox">
              <video id="vid" preload="metadata"></video>
              <div class="v-sub" id="vsub"></div>
              <div class="v-empty" id="vempty"><div style="font-size:44px">🎬</div><div>点击右上角「打开视频」，或把视频和字幕文件拖到这里</div>
                <div class="small faint mt-s">推荐 MP4 格式（H.264）。字幕支持 SRT / VTT / ASS，可以是中英双语字幕，也可以分别加载英文和中文字幕。</div></div>
            </div>
            <div class="v-controls">
              <button class="btn sm" id="b-prev" title="上一句（←）">⏮</button>
              <button class="btn sm primary" id="b-play" title="播放/暂停（空格）">▶</button>
              <button class="btn sm" id="b-next" title="下一句（→）">⏭</button>
              <button class="btn sm" id="b-rep" title="重播本句（R）">🔁 本句</button>
              <span class="v-time" id="vtime">00:00 / 00:00</span>
              <span class="spacer"></span>
              <select class="select" id="rate" style="width:auto;padding:5px 8px">${[0.5, 0.75, 0.9, 1, 1.25, 1.5].map((r) => `<option value="${r}" ${r === 1 ? "selected" : ""}>${r}x</option>`).join("")}</select>
            </div>
            <div class="v-controls">
              <div class="tabs" id="modes">${[["both", "双语"], ["en", "英文"], ["zh", "中文"], ["none", "沉浸（无字幕）"]].map(([m, l]) => `<button class="tab ${m === this.mode ? "active" : ""}" data-mode="${m}">${l}</button>`).join("")}</div>
              <span class="spacer"></span>
              <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="c-loop" ${this.loop ? "checked" : ""}> 单句循环 (L)</label>
              <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="c-pause" ${this.autoPause ? "checked" : ""}> 逐句暂停 (P)</label>
              <button class="btn sm soft" id="b-cont" title="每句播完自动录下你的跟读、打分，再接着下一句">🔁 连续跟读</button>
            </div>
            <div class="card v-shadow" id="shadow"></div>
            <div class="card v-bd">
              <div class="row"><b>📖 逐句精讲</b><span class="small muted">当前这句：每个词的音标和意思，重点词标橙色</span><span class="spacer"></span>
                <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="c-bd" ${Store.prefs.v_bd !== false ? "checked" : ""}> 显示</label></div>
              <div id="bd" class="${Store.prefs.v_bd !== false ? "" : "hidden"}"></div>
            </div>
          </div>
          <div class="video-right card">
            <div class="row" style="margin-bottom:8px"><b>字幕</b><span class="small muted" id="lcount"></span><span class="spacer"></span>
              <button class="btn sm ghost" id="b-ai" title="用 AI 把英文字幕翻译成中文">🤖 AI 翻译</button>
              <button class="btn sm ghost" id="b-clips">★ 收藏 (${(Store.data.clips || []).length})</button></div>
            <div class="v-lines ${this.mode === "none" ? "blur" : ""}" id="lines"></div>
          </div>
        </div>`;

    const vid = $("#vid", root), vsub = $("#vsub", root), linesBox = $("#lines", root);
    if (opt.subTop) $("#vbox", root).classList.add("sub-top");
    let cur = -1;          // 当前句下标
    // Ctrl+M 跟读评测：跟读当前这句字幕，视频先暂停
    App.shadowTarget = () => {
      const l = s.lines[Math.max(cur, 0)];
      if (!l?.en) return null;
      vid.pause();
      return [{ en: l.en, zh: l.zh, label: "当前句" }];
    };
    let stopAt = null;     // 逐句暂停 / 单句播放的结束时间

    // ---------- 载入文件 ----------
    const loadVideo = (file) => {
      if (s.videoUrl) URL.revokeObjectURL(s.videoUrl);
      s.videoUrl = URL.createObjectURL(file);
      s.videoName = file.name;
      setupVideo(true);
    };
    const setupVideo = (fresh) => {
      if (!s.videoUrl) return;
      vid.src = s.videoUrl;
      $("#vempty", root).classList.add("hidden");
      vid.addEventListener("loadedmetadata", () => {
        const pos = (Store.data.video_pos || {})[s.videoName];
        if (fresh && pos > 10 && pos < vid.duration - 10) {
          toast(`已从上次的位置 ${fmt(pos)} 继续`, "", 3000);
          vid.currentTime = pos;
        }
      }, { once: true });
      vid.addEventListener("error", () => toast(opt.local ? "这个视频格式无法播放，请换成 MP4（H.264 编码）"
        : "视频加载失败：在线播放需要联网，可以联网时先「下载到本机」", "bad", 5000), { once: true });
    };
    const loadSub = async (file, which) => {
      const text = await readText(file);
      const cues = Subs.parse(text, file.name);
      if (!cues.length) { toast("没有从字幕文件里读到内容，请确认是 SRT / VTT / ASS 格式", "bad", 4000); return; }
      if (which === "en") s.enCues = cues; else s.zhCues = cues;
      rebuild();
      toast(`已加载 ${cues.length} 条字幕`, "good");
    };
    const readText = (file) => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => {
        let t = r.result;
        // 字幕文件可能是 GBK 编码（中文字幕常见），UTF-8 解码出乱码时再试一次
        if (/�/.test(t)) {
          const r2 = new FileReader();
          r2.onload = () => res(r2.result);
          r2.readAsText(file, "gbk");
        } else res(t);
      };
      r.readAsText(file, "utf-8");
    });
    const rebuild = () => {
      if (s.enCues && s.zhCues) s.lines = Subs.merge(s.enCues, s.zhCues);
      else if (s.enCues) s.lines = Subs.split(s.enCues);
      else if (s.zhCues) s.lines = Subs.split(s.zhCues);
      cur = -1;
      drawLines();
    };

    if (opt.local) {
      $("#f-video", root).onchange = (e) => e.target.files[0] && loadVideo(e.target.files[0]);
      $("#f-en", root).onchange = (e) => e.target.files[0] && loadSub(e.target.files[0], "en");
      $("#f-zh", root).onchange = (e) => e.target.files[0] && loadSub(e.target.files[0], "zh");
    }
    // 拖放：视频和字幕一起拖进来也可以（片库视频只能拖字幕进来）
    const box = $("#vbox", root);
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("drag"));
    box.addEventListener("drop", (e) => {
      e.preventDefault();
      box.classList.remove("drag");
      for (const f of e.dataTransfer.files) {
        if (/\.(srt|vtt|ass|ssa)$/i.test(f.name)) loadSub(f, /\.(zh|chs|cht|sc|tc|chi|cn)\b|中文|简体|繁体/i.test(f.name) ? "zh" : "en");
        else if (opt.local) loadVideo(f);
      }
    });

    // ---------- 字幕列表 ----------
    const lineHtml = (l, i) => `
      <div class="v-line" data-i="${i}">
        <div class="row" style="gap:6px"><span class="v-t">${fmt(l.start)}</span><span class="spacer"></span>
          <button class="star ${isClip(l) ? "on" : ""}" data-clip="${i}" title="收藏这句">★</button></div>
        ${l.en ? `<div class="v-en" data-text="${esc(l.en)}">${wrapWords(l.en)}</div>` : ""}
        ${l.zh ? `<div class="v-zh">${esc(l.zh)}</div>` : ""}
      </div>`;
    const drawLines = () => {
      $("#lcount", root).textContent = s.lines.length ? `${s.lines.length} 句` : "";
      linesBox.innerHTML = s.lines.length ? s.lines.map(lineHtml).join("")
        : `<div class="empty small">加载字幕后，这里会实时显示台词。<br>点击任意一句可跳转，点击单词可查词。</div>`;
      drawShadow();
    };
    const isClip = (l) => (Store.data.clips || []).some((c) => c.en === l.en && c.video === s.videoName);
    bindWordClicks(linesBox);
    linesBox.addEventListener("click", (e) => {
      const c = e.target.closest("[data-clip]");
      if (c) { toggleClip(+c.dataset.clip, c); return; }
      if (e.target.closest(".w")) return; // 点词查义，不跳转
      const row = e.target.closest(".v-line");
      if (row) playLine(+row.dataset.i);
    });
    const toggleClip = (i, btn) => {
      const l = s.lines[i];
      const clips = (Store.data.clips ||= []);
      const k = clips.findIndex((c) => c.en === l.en && c.video === s.videoName);
      if (k >= 0) { markDeleted("clips", RECORD_ID.clips(clips[k])); clips.splice(k, 1); }
      else {
        const rec = { en: l.en, zh: l.zh, video: s.videoName, time: l.start, date: today() };
        clips.unshift(markAdded("clips", RECORD_ID.clips(rec), rec));
      }
      btn.classList.toggle("on", k < 0);
      $("#b-clips", root).textContent = `★ 收藏 (${clips.length})`;
      toast(k < 0 ? "已收藏这句" : "已取消收藏", k < 0 ? "good" : "");
      Store.save();
    };

    // ---------- 播放控制 ----------
    const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
    const indexAt = (t) => {
      // 取开始时间 <= t 的最后一句（在两句之间时仍显示上一句的位置）
      let lo = 0, hi = s.lines.length - 1, ans = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (s.lines[mid].start <= t + 0.05) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
      return ans;
    };
    const playLine = (i, once = false) => {
      if (!s.lines[i] || !s.videoUrl) return;
      vid.currentTime = s.lines[i].start;
      stopAt = once || this.loop || this.autoPause ? s.lines[i].end : null;
      vid.play();
    };
    const showSub = (l) => {
      if (!l || this.mode === "none") { vsub.innerHTML = ""; return; }
      const en = this.mode !== "zh" && l.en ? `<div class="en" data-text="${esc(l.en)}">${wrapWords(l.en)}</div>` : "";
      const zh = this.mode !== "en" && l.zh ? `<div class="zh">${esc(l.zh)}</div>` : "";
      vsub.innerHTML = en + zh;
    };
    bindWordClicks(vsub);
    vsub.addEventListener("mousedown", () => vid.pause()); // 点字幕查词时先暂停

    const savePos = () => {
      if (!s.videoName || !(vid.currentTime > 0)) return;
      s._posSaved = vid.currentTime;
      (Store.data.video_pos ||= {})[s.videoName] = vid.currentTime;
      Store.save();
    };
    signal.addEventListener("abort", savePos); // 离开页面时记一下
    vid.addEventListener("timeupdate", () => {
      const t = vid.currentTime;
      $("#vtime", root).textContent = `${fmt(t)} / ${fmt(vid.duration || 0)}`;
      if (stopAt !== null && t >= stopAt) {
        const i = cur;
        if (this.loop && s.lines[i]) { vid.currentTime = s.lines[i].start; return; }
        vid.pause();
        stopAt = null;
        drawShadow(true);
      }
      const i = indexAt(t);
      const active = i >= 0 && t <= s.lines[i].end + 0.3 ? i : -1;
      showSub(active >= 0 ? s.lines[active] : null);
      if (i !== cur) {
        cur = i;
        $$(".v-line.now", linesBox).forEach((x) => x.classList.remove("now"));
        const row = $(`.v-line[data-i="${i}"]`, linesBox);
        if (row) {
          row.classList.add("now");
          linesBox.scrollTo({ top: row.offsetTop - linesBox.clientHeight / 3, behavior: "smooth" });
        }
        if (this.autoPause && i >= 0 && !vid.paused && stopAt === null) stopAt = s.lines[i].end;
        drawShadow();
      }
      // 播放位置：每走过 15 秒记一次（timeupdate 一秒触发好几次，按时间差判断，不按取整）
      if (s.videoName && Math.abs(t - (s._posSaved ?? -99)) >= 15) savePos();
    });
    vid.addEventListener("play", () => { $("#b-play", root).textContent = "⏸"; });
    vid.addEventListener("pause", () => { $("#b-play", root).textContent = "▶"; savePos(); });

    const toggle = () => { if (!s.videoUrl) return; if (vid.paused) { if (this.autoPause && s.lines[cur]) stopAt = s.lines[cur].end; vid.play(); } else vid.pause(); };
    const step = (d) => {
      if (!s.lines.length) { vid.currentTime = Math.max(0, vid.currentTime + d * 5); return; }
      const base = cur < 0 ? 0 : cur + d;
      playLine(Math.min(Math.max(base, 0), s.lines.length - 1));
    };
    $("#b-play", root).onclick = toggle;
    $("#b-prev", root).onclick = () => step(-1);
    $("#b-next", root).onclick = () => step(1);
    $("#b-rep", root).onclick = () => playLine(Math.max(cur, 0), true);
    $("#rate", root).onchange = (e) => { vid.playbackRate = +e.target.value; e.target.blur(); };
    vid.onclick = toggle;
    $("#modes", root).onclick = (e) => {
      const b = e.target.closest("[data-mode]");
      if (!b) return;
      this.mode = b.dataset.mode;
      $$("[data-mode]", root).forEach((x) => x.classList.toggle("active", x === b));
      linesBox.classList.toggle("blur", this.mode === "none");
      showSub(s.lines[cur]);
    };
    $("#c-loop", root).onchange = (e) => { this.loop = e.target.checked; if (this.loop && s.lines[cur]) stopAt = s.lines[cur].end; };
    $("#c-pause", root).onchange = (e) => { this.autoPause = e.target.checked; };

    // ---------- 跟读 ----------
    let recUrl = null;
    // 逐句精讲跟着当前句走（换句时才重画，避免播放中反复查词）
    let bdFor = null;
    const drawBreakdown = () => {
      const l = s.lines[Math.max(cur, 0)], box = $("#bd", root);
      if (Store.prefs.v_bd === false || !box) return;
      if (!l?.en) { box.innerHTML = `<div class="small muted">加载字幕后，这里会逐词显示音标和中文意思。</div>`; bdFor = null; return; }
      if (bdFor === l) return;
      bdFor = l;
      renderBreakdown(box, l.en, l.zh, { from: "影视精听", onZh: (zh) => { if (!l.zh) { l.zh = zh; opt.onZh?.(s.lines); } } });
    };
    $("#c-bd", root).onchange = (e) => {
      Store.prefs.v_bd = e.target.checked;
      Store.save();
      $("#bd", root).classList.toggle("hidden", !e.target.checked);
      bdFor = null;
      drawBreakdown();
    };
    const drawShadow = (justPaused = false) => {
      drawBreakdown();
      const l = s.lines[cur];
      const sh = $("#shadow", root);
      if (!l || !l.en) { sh.innerHTML = `<div class="small muted">🎙️ 跟读区：勾选「逐句暂停」，每句播完会自动暂停，你可以在这里跟读录音、和原声对比。</div>`; return; }
      sh.innerHTML = `<div class="row"><b>🎙️ 跟读</b><span class="small muted">${justPaused ? "这句播完了，跟着读一遍吧" : "当前句"}</span><span class="spacer"></span>
          <button class="btn sm" id="sh-orig">▶ 原声</button><button class="btn sm soft" id="sh-rec">● 录音</button><button class="btn sm" id="sh-mine" ${recUrl ? "" : "disabled"}>▶ 我的</button>
          <button class="btn sm ghost" id="sh-tts" title="用语音合成慢速朗读">🐢 慢速</button></div>
        <div class="v-shadow-text">${esc(l.en)}</div>`;
      $("#sh-orig", root).onclick = () => playLine(cur, true);
      $("#sh-tts", root).onclick = () => TTS.speak(l.en, 0.7);
      $("#sh-mine", root).onclick = () => recUrl && new Audio(recUrl).play();
      $("#sh-rec", root).onclick = (e) => record(e.currentTarget, l);
    };
    let recorder = null;
    const record = async (btn, l) => {
      if (recorder) { recorder.stop(); return; }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return micUnavailable();
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch { toast("无法使用麦克风，请检查麦克风和系统隐私设置", "bad", 4000); return; }
      vid.pause();
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => chunks.push(ev.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorder = null;
        if (recUrl) URL.revokeObjectURL(recUrl);
        recUrl = URL.createObjectURL(new Blob(chunks));
        Store.data.stats.speaking++;
        addXP(2);
        drawShadow();
        // 先放原声，再放自己的录音
        playLine(cur, true);
        const after = () => { if (vid.paused) { vid.removeEventListener("pause", after); new Audio(recUrl).play(); } };
        vid.addEventListener("pause", after);
      };
      recorder.start();
      btn.innerHTML = `<span class="rec-dot"></span> 停止`;
      const dur = Math.min(15000, Math.max(3000, (l.end - l.start) * 1000 * 2 + 1500));
      setTimeout(() => { if (recorder && recorder.state === "recording") recorder.stop(); }, dur);
    };
    signal.addEventListener("abort", () => { if (recorder) recorder.stop(); vid.pause(); });
    // ---------- 连续跟读：每句播完自动录你的跟读、离线识别打分，然后接着下一句 ----------
    let contRun = 0, contOn = false;
    const contScores = [];
    const contBtn = $("#b-cont", root);
    const contStop = (summary = true) => {
      contRun++;
      contOn = false;
      Mic.cancel();
      contBtn.textContent = "🔁 连续跟读";
      contBtn.classList.remove("bad");
      if (summary && contScores.length) {
        const avg = Math.round(contScores.reduce((a, b) => a + b, 0) / contScores.length);
        $("#shadow", root).innerHTML = `<div class="row"><b>🔁 连续跟读结束</b><span class="spacer"></span><span class="small muted">读了 ${contScores.length} 句 · 平均 ${avg} 分</span></div>
          <div class="small faint mt-s">字幕列表里每句旁边的分数是这次的得分，点句子可以回去重听、重读。</div>`;
        addXP(Math.min(10, contScores.length));
        Store.data.stats.speaking += contScores.length;
        Store.save();
      }
    };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitPause = () => new Promise((res) => { if (vid.paused) res(); else vid.addEventListener("pause", res, { once: true }); });
    const contShadow = async () => {
      if (contOn) return contStop();
      if (!s.lines.length || !s.videoUrl) return toast("先打开视频和字幕");
      if (!(await Stt.ready())) return;
      if (!navigator.mediaDevices?.getUserMedia) return micUnavailable();
      const my = ++contRun;
      contOn = true;
      contScores.length = 0;
      contBtn.textContent = "⏹ 停止跟读";
      contBtn.classList.add("bad");
      for (let i = Math.max(cur, 0); i < s.lines.length; i++) {
        if (my !== contRun || signal.aborted) return;
        const l = s.lines[i];
        if (!l.en || l.en.split(/\s+/).length < 2) continue; // 太短的句子（Yes. / Hi.）跳过
        const sh = $("#shadow", root);
        const status = (html) => { const el = $(".cont-st", sh); if (el) el.innerHTML = html; };
        sh.innerHTML = `<div class="row"><b>🔁 连续跟读 · 第 ${i + 1} 句</b><span class="small muted cont-st">先听原声</span><span class="spacer"></span><span class="small faint">再点「停止跟读」结束</span></div><div class="v-shadow-text">${esc(l.en)}</div>`;
        playLine(i, true);
        await waitPause();
        if (my !== contRun) return;
        await sleep(150);
        // 开始录音：读完安静 1.1 秒或者到时间就自动停
        const limit = Math.max(3000, (l.end - l.start) * 2000 + 2500);
        const rec = await new Promise((res) => {
          Mic.start({ onSilence: async () => res(await Mic.stop()), silenceMs: 1100, maxMs: limit })
            .catch((e) => { toast(`打不开麦克风：${e.message || e}`, "bad"); res(null); });
        });
        if (my !== contRun) return;
        if (!rec) return contStop(false);
        if (!rec.heard) { status("没听到声音，跳到下一句"); await sleep(900); continue; }
        status("打分中…");
        let r;
        try { r = await pywebview.api.stt_assess(rec.pcm); } catch { r = { ok: false }; }
        if (my !== contRun) return;
        if (!r.ok) { status("识别失败，跳到下一句"); await sleep(900); continue; }
        const res = alignPron(l.en, r.words || []);
        contScores.push(res.score);
        const t = $(`.v-line[data-i="${i}"] .v-t`, linesBox);
        if (t) { t.parentElement.querySelector(".cont-score")?.remove(); t.insertAdjacentHTML("afterend", `<span class="badge cont-score ${res.score >= 80 ? "brand" : ""}">${res.score} 分</span>`); }
        sh.innerHTML = `<div class="row"><b>🔁 第 ${i + 1} 句：${res.score} 分</b><span class="spacer"></span><span class="small faint">马上下一句…</span></div>
          <div class="sh-words">${res.words.map((x) => `<span class="sh-w ${x.state}" data-say="${esc(x.w.replace(/^[^\w']+|[^\w']+$/g, ""))}">${esc(x.w)}</span>`).join(" ")}</div>
          <div class="small muted mt-s">识别到：<span class="en">${esc(r.text || "")}</span></div>`;
        await sleep(1500);
      }
      if (my === contRun) contStop();
    };
    contBtn.onclick = contShadow;
    signal.addEventListener("abort", () => contStop(false));


    // ---------- AI 翻译字幕 ----------
    $("#b-ai", root).onclick = async (e) => {
      if (!AI.enabled) { toast("需要先在设置里接入 AI"); return; }
      const todo = s.lines.map((l, i) => [i, l]).filter(([, l]) => l.en && !l.zh);
      if (!todo.length) { toast(s.lines.length ? "所有字幕都已经有中文了" : "请先加载英文字幕"); return; }
      const btn = e.currentTarget;
      btn.disabled = true;
      for (let k = 0; k < todo.length; k += 40) {
        if (signal.aborted) return;
        btn.textContent = `翻译中 ${Math.min(k + 40, todo.length)}/${todo.length}`;
        const chunk = todo.slice(k, k + 40);
        const r = await AI.json("You translate English TV/movie subtitles into natural, colloquial Simplified Chinese.",
          `Translate each line. Keep the same ids. Return JSON: {"t": {"id": "中文翻译", ...}}\n` + JSON.stringify(Object.fromEntries(chunk.map(([i, l]) => [i, l.en]))));
        if (!r.ok) { toast(r.error, "bad", 5000); break; }
        for (const [i] of chunk) if (r.data.t?.[i]) s.lines[i].zh = r.data.t[i];
        drawLines();
        opt.onZh?.(s.lines);
      }
      btn.disabled = false;
      btn.textContent = "🤖 AI 翻译";
    };

    // ---------- 收藏句子 ----------
    $("#b-clips", root).onclick = () => {
      const clips = Store.data.clips || [];
      const m = modal(`<h3>★ 收藏的句子（${clips.length}）</h3>
        <div style="max-height:60vh;overflow:auto">${clips.length ? clips.map((c, i) => `
          <div class="v-line" style="cursor:default"><div class="row"><span class="v-t">${esc(this.filmIndex()[c.video]?.it.t || c.video)} · ${fmt(c.time)}</span><span class="spacer"></span>
            ${speakBtn(c.en, "sm")}<button class="btn sm ghost" data-del="${i}">✕</button></div>
            <div class="v-en">${esc(c.en)}</div><div class="v-zh">${esc(c.zh || "")}</div></div>`).join("") : `<p class="muted">看视频时点击字幕旁边的 ★ 就能收藏好句子。</p>`}</div>
        <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
      m.root.querySelector(".modal").style.maxWidth = "640px";
      m.root.addEventListener("click", (ev) => {
        const d = ev.target.closest("[data-del]");
        if (!d) return;
        markDeleted("clips", RECORD_ID.clips(clips[+d.dataset.del]));
        clips.splice(+d.dataset.del, 1);
        Store.save();
        m.close();
        $("#b-clips", root).textContent = `★ 收藏 (${clips.length})`;
      });
    };

    // ---------- 快捷键 ----------
    onKey(signal, (e) => {
      const k = e.key.toLowerCase();
      if (e.key === " ") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowLeft" || k === "a") { e.preventDefault(); step(-1); }
      else if (e.key === "ArrowRight" || k === "d") { e.preventDefault(); step(1); }
      else if (k === "r") playLine(Math.max(cur, 0), true);
      else if (k === "l") { const c = $("#c-loop", root); c.checked = !c.checked; c.onchange({ target: c }); toast(c.checked ? "单句循环：开" : "单句循环：关"); }
      else if (k === "p") { const c = $("#c-pause", root); c.checked = !c.checked; c.onchange({ target: c }); toast(c.checked ? "逐句暂停：开" : "逐句暂停：关"); }
    });

    // 回到这个页面时恢复上次打开的视频和字幕
    drawLines();
    if (s.videoUrl) setupVideo(!opt.local);
  },

  // ---------- 片库 ----------
  filmIndex() { // 集 id → { it: 这一集, sr: 所属系列, i: 第几集 }
    if (this._idx) return this._idx;
    this._idx = {};
    (window.FILM_SERIES || []).forEach((sr) => sr.items.forEach((it, i) => (this._idx[it.id] = { it, sr, i })));
    return this._idx;
  },
  watched(it) {
    const p = (Store.data.video_pos || {})[it.id] || 0;
    return it.d ? Math.min(1, p / (it.d * 0.9)) : 0; // 看到 90% 就算看完
  },
  dur(sec) {
    return sec >= 3600 ? `${Math.floor(sec / 3600)} 小时 ${Math.round((sec % 3600) / 60)} 分` : sec >= 60 ? `${Math.round(sec / 60)} 分钟` : `${sec} 秒`;
  },
  // 外部链接：桌面版用系统浏览器打开，局域网设备直接开新标签页
  openUrl(url) {
    if (Store.bridge && !Store.remote) pywebview.api.open_url(url);
    else window.open(url, "_blank", "noopener");
  },

  library(root, tab) {
    root.innerHTML = pageHead("影视精听", "看视频学英语：逐句精听、跟读、点词查义、AI 翻译字幕",
      `<a class="btn" href="#/video/local">📂 打开本地视频</a>`)
      + tabsHtml([["lib", "📚 片库"], ["guide", "🔗 正版剧集与频道"]], tab) + `<div id="vbody" style="margin-top:16px"></div>`;
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go(b.dataset.tab === "guide" ? "video/guide" : "video")));
    const body = $("#vbody", root);
    if (tab === "guide") return this.guide(body);

    const series = (window.FILM_SERIES || []).filter((x) => x.items.length);
    if (!series.length) {
      body.innerHTML = `<div class="card empty"><div class="big">🎬</div><h3>片库还是空的</h3><p>运行 <code>tools/fetch_videos.py</code> 生成片单和字幕，或者先「打开本地视频」。</p></div>`;
      return;
    }
    const GROUPS = [
      ["voa", "📺 学英语情景剧和小课", "美国之音（VOA）专门给英语学习者拍的，发音清楚、语速慢，从这里开始"],
      ["ted", "🎤 TED 演讲", "官方中英双语字幕，真实语速，话题贴近生活。CC BY-NC-ND 4.0，个人学习使用"],
      ["open", "🎬 开放电影", "创作者以 CC 协议免费开放的电影"],
    ];
    const last = this.filmIndex()[Store.data.video_last];
    const card = (sr) => {
      const done = sr.items.filter((it) => this.watched(it) >= 1).length;
      return `<a class="card film-card" href="#/video/series/${sr.id}">
        <div class="film-ico">${sr.icon}</div>
        <div style="min-width:0">
          <div class="film-title">${esc(sr.zh)}</div>
          <div class="small faint en">${esc(sr.title)}</div>
          <div class="row mt-s" style="gap:6px"><span class="badge brand">${esc(sr.level)}</span><span class="small muted">${sr.items.length} 集${done ? ` · 看完 ${done} 集` : ""}</span></div>
          <div class="small muted mt-s film-desc">${esc(sr.desc)}</div>
        </div></a>`;
    };
    body.innerHTML = (last ? `<a class="card film-continue" href="#/video/play/${last.it.id}">
          <span style="font-size:28px">${last.sr.icon}</span><div style="flex:1;min-width:0"><div class="small muted">继续看 · ${esc(last.sr.zh)}</div><b>${esc(last.it.t)}</b>
          <div class="bar mt-s"><i style="width:${Math.round(this.watched(last.it) * 100)}%"></i></div></div><span class="btn primary">▶ 继续</span></a>` : "")
      + GROUPS.map(([g, title, sub]) => {
        const list = series.filter((x) => x.group === g);
        return list.length ? `<div class="film-group"><div class="card-title">${title}</div><div class="small muted" style="margin:-6px 0 12px">${sub}</div>
          <div class="film-grid">${list.map(card).join("")}</div></div>` : "";
      }).join("")
      + `<p class="small faint mt">视频在线播放（来自 VOA、TED 和 Blender），也可以在播放页「下载到本机」离线看。英文字幕由语音识别生成，个别词可能不准；中文可以用 AI 翻译。</p>`;
  },

  async series(root, sid) {
    const sr = (window.FILM_SERIES || []).find((x) => x.id === sid);
    if (!sr) return Router.go("video");
    let have = {};
    if (Store.bridge && !Store.remote) try { have = (await pywebview.api.film_status()).downloaded || {}; } catch { /* 下载状态拿不到不影响看 */ }
    const next = sr.items.find((it) => this.watched(it) < 1) || sr.items[0];
    const started = sr.items.some((it) => this.watched(it) > 0);
    root.innerHTML = `<a class="back-link" href="#/video">‹ 返回片库</a>`
      + pageHead(`${sr.icon} ${esc(sr.zh)}`, `${esc(sr.title)} · ${esc(sr.level)} · ${sr.items.length} 集`,
        `<a class="btn primary" href="#/video/play/${next.id}">▶ ${started ? "继续看" : "开始看"}</a>`)
      + `<div class="card" style="margin-bottom:16px"><div class="muted">${esc(sr.desc)}</div><div class="small faint mt-s">来源和授权：${esc(sr.license)}</div></div>
        <div class="card film-list">${sr.items.map((it, i) => {
          const w = this.watched(it);
          return `<a class="film-row ${w >= 1 ? "done" : ""}" href="#/video/play/${it.id}">
            <span class="film-no">${w >= 1 ? "✓" : i + 1}</span>
            <div class="film-row-main"><div class="film-row-t">${esc(it.t)}</div>${it.desc ? `<div class="small faint film-desc">${esc(it.desc)}</div>` : ""}</div>
            ${have[it.id] ? `<span class="small" title="已下载到本机">💾</span>` : ""}
            <span class="small muted" style="white-space:nowrap">${this.dur(it.d)}</span>
            <span class="film-prog"><i style="width:${Math.round(w * 100)}%"></i></span></a>`;
        }).join("")}</div>`;
  },

  async playFilm(root, id, signal) {
    const hit = this.filmIndex()[id];
    if (!hit) return Router.go("video");
    const { it, sr, i } = hit;
    Store.data.video_last = id;
    Store.save();
    const s = ((this.libState ||= {})[id] ||= { videoUrl: "", videoName: id, lines: [], enCues: null, zhCues: null });
    if (!s.enCues) {
      try { await loadScript(`data/films/${id}.js`); }
      catch { root.innerHTML = `<div class="card"><b>没有找到这一集的字幕文件</b></div>`; return; }
      // 识别出的时间卡得很紧：句尾留一点余量，太短的句子至少显示 1 秒（不压到下一句）
      const raw = window.FILM_SUBS[id] || [];
      s.enCues = raw.map(([a, b, text], k) => {
        const nx = raw[k + 1] ? raw[k + 1][0] - 0.05 : b + 2;
        return { start: a, end: Math.max(b, Math.min(Math.max(b + 0.3, a + 1), nx)), text };
      });
      // 有官方中文字幕的（TED）按时间和英文配对成双语；其他的只有英文，可以用 AI 翻译
      const rawZh = (window.FILM_SUBS_ZH || {})[id];
      s.lines = rawZh?.length ? Subs.merge(s.enCues, rawZh.map(([a, b, text]) => ({ start: a, end: b, text }))) : Subs.split(s.enCues);
      const zh = KV.peek("film_zh", id);
      if (zh) s.lines.forEach((l, k) => { if (zh[k] && !l.zh) l.zh = zh[k]; });
    }
    let local = "";
    if (Store.bridge && !Store.remote) try { local = await pywebview.api.film_local(id); } catch { local = ""; }
    if (signal.aborted) return;
    s.videoUrl = local || it.url;
    const prev = sr.items[i - 1], next = sr.items[i + 1];
    const head = `<a class="back-link" href="#/video/series/${sr.id}">‹ ${esc(sr.zh)}</a>`
      + pageHead(esc(it.t), `${esc(sr.zh)} · 第 ${i + 1} / ${sr.items.length} 集 · ${this.dur(it.d)}${local ? " · 💾 本机播放" : ""}`,
        `<div class="row">${prev ? `<a class="btn ghost" href="#/video/play/${prev.id}">‹ 上一集</a>` : ""}${next ? `<a class="btn ghost" href="#/video/play/${next.id}">下一集 ›</a>` : ""}
          <span id="dl-slot"></span><button class="btn ghost" id="b-src" title="${esc(sr.license)}">🔗 来源</button></div>`);
    this.player(root, signal, s, {
      head,
      subTop: sr.group === "voa", // VOA 的视频画面里自带字幕，我们的字幕挪到画面上方，免得叠在一起
      onZh: (lines) => KV.set("film_zh", id, lines.map((l) => l.zh || "")),
    });
    $("#b-src", root).onclick = () => this.openUrl(it.page);
    this.dlButton($("#dl-slot", root), it, !!local, signal);
  },

  // 下载到本机：一次一个，轮询进度
  dlButton(slot, it, have, signal) {
    if (!Store.bridge || Store.remote) return;
    const draw = (html) => { if (slot.isConnected) slot.innerHTML = html; };
    const poll = async () => {
      if (signal.aborted) return;
      const st = await pywebview.api.film_status();
      if (st.running && st.id === it.id) {
        draw(`<button class="btn ghost" data-dl="cancel" title="点一下取消">⬇ 下载中 ${Math.round(st.progress * 100)}%</button>`);
        setTimeout(poll, 800);
      } else if (st.downloaded[it.id]) {
        draw(`<button class="btn ghost" data-dl="del" title="${st.downloaded[it.id]} MB，点一下删除">💾 已下载</button>`);
        if (st.id === it.id && !have) { have = true; toast("下载好了，下次打开这一集会直接从本机播放", "good", 3500); }
      } else {
        if (st.id === it.id && st.error) toast(`下载失败：${st.error}`, "bad", 4000);
        draw(st.running ? `<button class="btn ghost" disabled title="正在下载别的视频">⬇ 下载到本机</button>`
          : `<button class="btn ghost" data-dl="go" title="下载后断网也能看">⬇ 下载到本机</button>`);
      }
    };
    slot.onclick = async (e) => {
      const k = e.target.closest("[data-dl]")?.dataset.dl;
      if (k === "go") { await pywebview.api.film_download(it.id, it.url); poll(); }
      else if (k === "cancel") { await pywebview.api.film_cancel(); setTimeout(poll, 500); }
      else if (k === "del" && await confirmBox("删除下载的视频", "删除后还可以在线播放，或者重新下载。", "删除", true)) {
        await pywebview.api.film_remove(it.id);
        have = false;
        poll();
      }
    };
    poll();
  },

  // ---------- 正版剧集与频道：只放链接 ----------
  guide(body) {
    const link = (x, item) => Array.isArray(x) ? x
      : x === "douban" ? ["豆瓣 · 简介和国内哪里能看", `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(item.zh)}`]
      : ["JustWatch · 海外正版平台", `https://www.justwatch.com/us/search?q=${encodeURIComponent(item.t)}`];
    body.innerHTML = `<div class="explain" style="margin:0 0 16px">这些剧和频道受版权保护，EngNest 不提供视频，点链接去正版平台看。
        有正版的视频和字幕文件的话，可以用「📂 打开本地视频」逐句精听；看到好句子选中收进生词本，回来用 Ctrl+M 跟读评测。</div>`
      + (window.WATCH_GUIDE || []).map((g) => `<div class="film-group"><div class="card-title">${esc(g.group)} <span class="small muted" style="font-weight:400">${esc(g.note)}</span></div>
        <div class="film-grid">${g.items.map((x) => `<div class="card watch-card">
          <div class="row" style="gap:8px;align-items:baseline"><b class="film-title">${esc(x.zh)}</b><span class="small faint en">${esc(x.t)}</span></div>
          <div class="row mt-s" style="gap:6px;flex-wrap:wrap"><span class="badge">${esc(x.accent)}</span>${x.years ? `<span class="small muted">${esc(x.years)}</span>` : ""}<span class="small muted">${esc(x.ep)}</span></div>
          <div class="small mt-s">${esc(x.why)}</div>
          <div class="small muted mt-s">能学到：${esc(x.learn)}</div>
          <div class="row mt-s" style="gap:6px;flex-wrap:wrap">${x.links.map((l) => { const [label, url] = link(l, x); return `<button class="btn sm soft" data-url="${esc(url)}">${esc(label)} ↗</button>`; }).join("")}</div>
        </div>`).join("")}</div></div>`).join("")
      + `<p class="small faint mt">YouTube 链接需要能访问外网。</p>`;
    body.onclick = (e) => { const b = e.target.closest("[data-url]"); if (b) this.openUrl(b.dataset.url); };
  },
};

