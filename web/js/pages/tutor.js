// AI 语伴：自由聊天 / 场景口语（60 个角色扮演场景）/ 伙伴设置（性格、音色、形象）
// 路由：#/tutor 自由聊天 · #/tutor/scenes 场景列表 · #/tutor/scene/<id> 场景对话 · #/tutor/partner 伙伴设置
// 说话：点「点击说话」录音 → 离线语音识别（Whisper）→ 发给 AI；自动模式下 AI 说完会自动开始听，安静一会儿就自动发送
const SCENES = SCENE_CATS.flatMap((c) => c.scenes.map((s) => ({ ...s, cat: c })));

App.pages.tutor = {
  sessions: {}, // 每段对话的记录（只在内存里）：{ history: [给 AI 的消息], view: [显示的消息], done: [完成的任务序号] }

  partner() {
    const p = (Store.prefs.partner ||= { persona: "buddy", voice: "en-US-AriaNeural", avatar: "" });
    const persona = PARTNER_PERSONAS.find((x) => x.id === p.persona) || PARTNER_PERSONAS[0];
    const voice = PARTNER_VOICES.find((x) => x.id === p.voice) || PARTNER_VOICES[0];
    return { persona, voice, avatar: p.avatar || voice.avatar };
  },
  avatarSrc(id) {
    if (id === "flower-cat") return FlowerCat.file("front");
    return PartnerFigures.file(id) || `img/avatars/${id}.svg`;
  },

  render(root, params, signal) {
    Mic.cancel();
    const tab = { scenes: "scenes", scene: "scenes", partner: "partner" }[params[0]] || "chat";
    root.innerHTML = pageHead("AI 语伴", "",
      tabsHtml([["chat", "💬 自由聊天"], ["scenes", "🎭 场景口语"], ["partner", "🧑‍🎨 伙伴设置"]], tab)) + `<div id="tt-body"></div>`;
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go(b.dataset.tab === "chat" ? "tutor" : `tutor/${b.dataset.tab}`)));
    const body = $("#tt-body", root);
    signal.addEventListener("abort", () => Mic.cancel());
    if (tab === "partner") return this.partnerSettings(body);
    if (tab === "scenes" && params[0] === "scene") {
      const sc = SCENES.find((s) => s.id === params[1]);
      if (sc) return AI.enabled ? this.talk(body, signal, sc) : (body.innerHTML = aiLockHtml("场景口语"));
    }
    if (tab === "scenes") return this.sceneList(body);
    if (!AI.enabled) { body.innerHTML = aiLockHtml("AI 语伴"); return; }
    this.talk(body, signal, null);
  },

  // ---------- 场景列表 ----------
  sceneList(body) {
    const rec = Store.data.scenes || {};
    const n = SCENES.filter((s) => rec[s.id]).length;
    const img = (s) => (window.SCENE_IMAGES || {})[s.id];
    body.innerHTML = `
      <div class="card scene-progress"><div class="row"><b>练习进度</b><span class="spacer"></span><span><b class="big-num">${n}</b> / ${SCENES.length} 个场景</span></div>
        <div class="bar mt-s"><i style="width:${(n / SCENES.length) * 100}%"></i></div>
        <div class="small muted mt-s">每个场景你都扮演一个角色，AI 扮演对方。完成三个小任务，结束后 AI 会给你打分和点评。${AI.enabled ? "" : "（需要先在设置里接入 AI）"}</div></div>
      ${SCENE_CATS.map((c) => `
        <div class="scene-cat">
          <div class="scene-cat-head"><div><h3>${c.icon} ${esc(c.title)}</h3><div class="small muted">${esc(c.desc)}</div></div></div>
          <div class="scene-row">${c.scenes.map((s) => `
            <a class="scene-card" href="#/tutor/scene/${s.id}">
              <div class="scene-pic ${img(s) ? "" : "plain"}">${img(s) ? `<img src="${img(s).src}" alt="" loading="lazy" title="${esc(img(s).credit)}">` : `<span>${c.icon}</span>`}
                ${rec[s.id] ? `<span class="scene-done">✓ ${rec[s.id].score}分</span>` : ""}</div>
              <div class="scene-info"><b>${esc(s.title)}</b><div class="small muted">${esc(s.user)} × ${esc(s.ai)}</div><div class="small faint">${s.level}</div></div>
            </a>`).join("")}</div>
        </div>`).join("")}
      <p class="small faint mt">场景图片来自 Wikimedia Commons（公有领域或 CC 授权），鼠标停在图片上可以看到作者和授权。</p>`;
  },

  // ---------- 对话（自由聊天和场景共用）----------
  key(sc) { return sc ? sc.id : `free-${this.partner().persona.id}`; },

  session(sc) {
    const { persona } = this.partner();
    const opener = sc ? sc.opener : {
      warm: "Hi there! It's so nice to see you. How has your day been so far?",
      buddy: "Hey hey! Finally! So, tell me — what's the best thing that happened to you this week?",
      tease: "Oh look who's here. Let me guess, you want to practise English again? Fine, fine. How are you doing?",
      mentor: "Good to see you. Let's have a relaxed chat. What are you working on these days?",
      traveler: "Hello, my friend! I just got back from a trip. Have you been anywhere interesting lately?",
      examiner: "Good afternoon. Let's do some speaking practice. First, could you tell me a little about your hometown?",
    }[persona.id];
    const key = this.key(sc);
    if (!this.sessions[key]) {
      // 上次没聊完的对话（存在 AI 缓存里），重启软件也接着聊
      const saved = KV.peek("tutor", key);
      this.sessions[key] = saved?.view?.length
        ? { history: saved.history || [], view: saved.view, done: saved.done || [], busy: false, fresh: false }
        : { history: [{ role: "assistant", content: opener }], view: [{ role: "ai", text: opener }], done: [], busy: false, fresh: true };
    }
    return this.sessions[key];
  },

  // 保存对话：只留最近的（发给 AI 的上下文后端还会再截短）
  saveSession(sc, s) {
    KV.set("tutor", this.key(sc), { history: s.history.slice(-60), view: s.view.filter((m) => !m.streaming).slice(-200), done: s.done });
  },

  systemPrompt(sc) {
    const { persona } = this.partner();
    const fb = `After your reply, output a line containing only "###", then give feedback on the learner's LAST message, written in Chinese:
- If it has grammar or word errors, or sounds unnatural: give the corrected sentence in **bold** and a one-line explanation.
- If the learner wrote in Chinese (or mixed), show how to say it in English in **bold**.
- If it is already correct and natural: start with "👍" and optionally offer a more natural alternative.
Keep feedback under 80 Chinese characters.`;
    if (!sc) {
      return `${persona.prompt} You are chatting with an English learner as a friend, not as a teacher. ${LEARNER_PROFILE}
Rules: reply in natural spoken English, 1-3 short sentences, simple words, and usually end with a question to keep the conversation going. Never break character.
${STUCK_RULE}
${fb}`;
    }
    return `Role-play: you are the ${sc.ai}. The learner is the ${sc.user}. Situation: ${sc.setting}
${LEARNER_PROFILE} Stay in character. Reply in natural spoken English, 1-3 short sentences, and react to what the learner says. Gently guide the conversation so the learner can complete these tasks:
${sc.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}
${STUCK_RULE}
${fb}
Then output another line containing only "###", then "done:" followed by the numbers of ALL tasks the learner has completed so far in the whole conversation (e.g. "done: 1,3"), or "done:" if none.`;
  },

  talk(body, signal, sc) {
    const { persona, voice, avatar } = this.partner();
    const s = this.session(sc);
    const P = Store.prefs;
    P.talk_mode ||= "manual";
    body.innerHTML = `
      <div class="talk ${sc ? "with-panel" : ""}">
        <div class="talk-main card">
          <div class="talk-stage">
            ${sc ? `<a class="btn sm ghost talk-back" href="#/tutor/scenes">‹ 场景</a>` : ""}
            <div class="tabs talk-mode">${[["auto", "自动"], ["manual", "手动"]].map(([m, l]) => `<button class="tab ${P.talk_mode === m ? "active" : ""}" data-mode="${m}" title="${m === "auto" ? "AI 说完自动开始听，你说完停顿一下就自动发送" : "点一下开始说，再点一下发送"}">${l}</button>`).join("")}</div>
            ${avatar === "flower-cat" ? FlowerCat.actor() : PartnerFigures.has(avatar) ? PartnerFigures.actor(avatar) : `<img class="talk-avatar" id="avatar" src="${this.avatarSrc(avatar)}" alt="">`}
            <div class="talk-name">${sc ? `${esc(sc.ai)} <span class="small muted">· ${esc(sc.title)}</span>` : `${esc(persona.name)} <span class="small muted">· ${esc(voice.name)}</span>`}</div>
            <div class="talk-status" id="status">准备好了，就点击说话</div>
          </div>
          <div class="chat-body" id="body"></div>
          <div class="suggest-box hidden" id="suggest"></div>
          <div class="talk-input hidden" id="kbrow"><textarea class="textarea en" id="input" rows="1" placeholder="Type in English… 不会说的打中文，会告诉你英语怎么说（Enter 发送）"></textarea><button class="btn primary" id="send">发送</button></div>
          <div class="talk-bar">
            <button class="btn ghost talk-side" id="kb" title="打字">Aa</button>
            <button class="btn ghost talk-side" id="help" title="不知道怎么回？给我几个参考">💡</button>
            <button class="btn ghost talk-side" id="howto" title="想说的不会说？写中文，告诉你英语怎么说">🆘</button>
            <button class="mic-btn" id="mic"><span class="mic-ring" id="ring"></span><span id="mic-label">🎤 点击说话</span></button>
            <button class="btn ghost talk-side" id="reset" title="重新开始">↺</button>
            ${sc ? `<button class="btn soft talk-side" id="finish" title="结束对话，让 AI 点评">结束点评</button>` : ""}
          </div>
        </div>
        ${sc ? `<div class="talk-panel card">
          <div class="card-title">🎯 ${esc(sc.goal)}</div>
          <div class="small muted">你是 <b>${esc(sc.user)}</b>，AI 是 <b>${esc(sc.ai)}</b> · ${sc.level}</div>
          <div class="task-list" id="tasks"></div>
          <div class="card-title mt">💬 可以用的表达</div>
          ${sc.phrases.map(([en, zh]) => `<div class="phrase-row"><span class="en">${esc(en)}</span> ${speakBtn(en.replace(/…/g, ""), "sm")}<div class="small muted">${esc(zh)}</div></div>`).join("")}
        </div>` : ""}
      </div>`;

    const $b = (sel) => $(sel, body);
    const status = (t) => { $b("#status").textContent = t; };
    const drawTasks = () => {
      if (!sc) return;
      $b("#tasks").innerHTML = sc.tasks.map((t, i) => `<div class="task ${s.done.includes(i + 1) ? "done" : ""}"><span>${s.done.includes(i + 1) ? "✓" : i + 1}</span>${esc(t)}</div>`).join("");
    };
    const draw = () => {
      const box = $b("#body");
      const typing = s.busy && !s.view.some((m) => m.streaming && m.text);
      box.innerHTML = s.view.map((m, i) => m.role === "ai"
        ? m.streaming ? (m.text ? `<div class="msg ai"><div class="bubble">${esc(m.text)}<span class="stream-caret"></span></div></div>` : "")
        : `<div class="msg ai"><div class="bubble">${esc(m.text)}</div><div class="meta"><button class="btn sm ghost" data-say-i="${i}">🔊</button><button class="btn sm ghost" data-tr="${i}">译</button></div>${m.zh ? `<div class="feedback">${esc(m.zh)}</div>` : ""}</div>`
        : `<div class="msg me"><div class="bubble">${esc(m.text)}${m.voice ? ` <span class="small faint" title="语音输入">🎙️</span>` : ""}</div>${m.fb ? `<div class="feedback ${/^👍/.test(m.fb) ? "good" : ""}">${mdLite(m.fb)}</div>` : ""}${m.err ? `<div class="feedback" style="background:var(--bad-soft)">😥 ${esc(m.err)}</div>` : ""}</div>`
      ).join("") + (typing ? `<div class="typing"><i></i><i></i><i></i></div>` : "");
      box.scrollTop = box.scrollHeight;
      drawTasks();
    };
    const say = async (text) => {
      $b("#avatar, .flower-cat-stage-figure, .partner-figure-stage-figure")?.classList.add("speaking");
      status("正在说…");
      await TTS.speak(text, undefined, voice.id);
      if (!body.isConnected) return;
      $b("#avatar, .flower-cat-stage-figure, .partner-figure-stage-figure")?.classList.remove("speaking");
      status(P.talk_mode === "auto" ? "轮到你了，直接说吧" : "准备好了，就点击说话");
    };

    // ---------- 发消息 ----------
    const recentCtx = () => s.view.slice(-6).map((m) => `${m.role === "ai" ? "Partner" : "Learner"}: ${m.text}`).join("\n");
    // 想说的不会说：写中文或中英混合，AI 给几种英文说法，选一个填回输入框
    const askHow = (text = "", fromSend = false) => howToSay({
      text, context: recentCtx(),
      onUse: (en) => { $b("#kbrow").classList.remove("hidden"); input.value = en; input.focus(); },
      onSendAnyway: fromSend ? (t) => send(t, false, true) : null,
    });
    const send = async (text, viaVoice, raw = false) => {
      text = text.trim();
      if (!text || s.busy) return;
      // 打了中文：先帮你把这句话变成英文（也可以选择原样发送）
      if (!viaVoice && !raw && HAS_ZH.test(text) && AI.enabled) { input.value = ""; return askHow(text, true); }
      $b("#suggest").classList.add("hidden");
      const mine = { role: "me", text, voice: viaVoice };
      s.view.push(mine);
      s.history.push({ role: "user", content: text });
      s.busy = true;
      s.fresh = false;
      draw();
      status("AI 正在想…");
      // 边生成边显示：「###」后面是给学习者的点评和任务进度，生成时先不显示
      const live = { role: "ai", text: "", streaming: true };
      s.view.push(live);
      const r = await AI.chat(this.systemPrompt(sc), s.history, {
        onDelta: (t) => {
          const head = t.split(/\n?\s*###/)[0].trim();
          if (head === live.text || !body.isConnected) return;
          live.text = head;
          draw();
        },
      });
      s.view.splice(s.view.indexOf(live), 1);
      s.busy = false;
      if (!body.isConnected) return;
      if (!r.ok) {
        s.history.pop(); // 失败的这句不计入上下文，保证 user / assistant 交替
        mine.err = r.error;
        draw();
        status("出错了，可以再试一次");
        return;
      }
      const [reply, fbText, doneText] = r.text.split(/\n?\s*###\s*\n?/);
      const clean = (reply || "").trim() || r.text.trim();
      mine.fb = (fbText || "").trim();
      if (sc && doneText) {
        const nums = (doneText.match(/\d/g) || []).map(Number).filter((x) => x >= 1 && x <= sc.tasks.length);
        const fresh = nums.filter((x) => !s.done.includes(x));
        s.done = [...new Set([...s.done, ...nums])].sort();
        if (fresh.length) toast(`✓ 完成任务：${sc.tasks[fresh[0] - 1]}`, "good");
      }
      s.history.push({ role: "assistant", content: clean });
      s.view.push({ role: "ai", text: clean });
      Store.data.stats.chat = (Store.data.stats.chat || 0) + 1;
      addXP(2);
      this.saveSession(sc, s);
      draw();
      await say(clean);
      if (body.isConnected && P.talk_mode === "auto" && !signal.aborted) listen();
    };

    // ---------- 说话 ----------
    const micBtn = $b("#mic"), ring = $b("#ring"), label = $b("#mic-label");
    const setMic = (on) => { micBtn.classList.toggle("on", on); label.textContent = on ? (P.talk_mode === "auto" ? "🎧 正在听…" : "⏹ 说完了，发送") : "🎤 点击说话"; };
    const finishListening = async () => {
      const rec = await Mic.stop();
      setMic(false);
      ring.style.transform = "";
      if (!rec || !rec.heard || rec.seconds < 0.5) { status("没听到声音，再说一次吧"); return; }
      status("正在识别…");
      const text = await Stt.transcribe(rec.pcm);
      if (!body.isConnected) return;
      if (!text) { status("没听清，再说一次吧（或者点 Aa 打字）"); return; }
      send(text, true);
    };
    const listen = async () => {
      if (Mic.active || s.busy) return;
      if (!(await Stt.ready())) return;
      TTS.stop();
      try {
        await Mic.start({
          onLevel: (v) => { ring.style.transform = `scale(${1 + Math.min(0.6, v * 8)})`; },
          onSilence: P.talk_mode === "auto" ? () => finishListening() : null,
        });
      } catch (e) {
        toast(`打不开麦克风：${e.message || e}`, "bad", 4000);
        return;
      }
      setMic(true);
      status(P.talk_mode === "auto" ? "在听，说完停一下就会自动发送" : "在听，说完再点一下按钮");
    };
    micBtn.onclick = () => (Mic.active ? finishListening() : listen());

    // ---------- 打字、提示、模式 ----------
    const input = $b("#input");
    $b("#kb").onclick = () => { $b("#kbrow").classList.toggle("hidden"); input.focus(); };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); const t = input.value; input.value = ""; send(t, false); }
    });
    $b("#send").onclick = () => { const t = input.value; input.value = ""; send(t, false); };
    $$("[data-mode]", body).forEach((b) => (b.onclick = () => {
      P.talk_mode = b.dataset.mode;
      Store.save();
      $$("[data-mode]", body).forEach((x) => x.classList.toggle("active", x === b));
      status(P.talk_mode === "auto" ? "自动模式：AI 说完会自动开始听" : "手动模式：点一下开始说，再点一下发送");
    }));
    $b("#reset").onclick = () => { Mic.cancel(); delete this.sessions[this.key(sc)]; KV.set("tutor", this.key(sc), null); this.talk(body, signal, sc); };
    $b("#help").onclick = () => this.suggest(body, s, sc);
    $b("#howto").onclick = () => askHow(input.value.trim());
    const fin = $b("#finish");
    if (fin) fin.onclick = () => this.review(body, s, sc);
    body.addEventListener("click", async (e) => {
      const sp = e.target.closest("[data-say-i]"), tr = e.target.closest("[data-tr]");
      if (sp) TTS.speak(s.view[+sp.dataset.sayI].text, undefined, voice.id);
      if (tr) {
        const m = s.view[+tr.dataset.tr];
        if (m.zh) { m.zh = ""; draw(); return; }
        tr.disabled = true;
        const r = await AI.ask("Translate the English into natural Chinese. Output only the translation.", m.text);
        if (r.ok) { m.zh = r.text.trim(); this.saveSession(sc, s); } else toast(r.error, "bad", 4000);
        if (body.isConnected) draw();
      }
    });

    draw();
    if (s.fresh && s.view.length === 1) say(s.view[0].text);
  },

  async suggest(body, s, sc) {
    const box = $("#suggest", body);
    box.classList.remove("hidden");
    box.innerHTML = `<span class="muted">正在想几种回答…</span>`;
    const recent = s.view.slice(-6).map((m) => `${m.role === "ai" ? "Partner" : "Learner"}: ${m.text}`).join("\n");
    const r = await AI.json(`You help an English learner continue a conversation. ${LEARNER_PROFILE}`,
      `${sc ? `Role-play: the learner is the ${sc.user}, talking to the ${sc.ai}. Tasks: ${sc.tasks.join("; ")}` : "A casual chat with a friend."}
Recent conversation:\n${recent}\n\nSuggest 3 different natural replies the learner could say next (simple A2-B1 English, one sentence each).
Return JSON: {"replies": [{"en": "...", "zh": "中文意思"}]}`);
    if (!body.isConnected) return;
    if (!r.ok) { box.innerHTML = `<span style="color:var(--bad)">${esc(r.error)}</span>`; return; }
    box.innerHTML = `<div class="small muted" style="margin-bottom:4px">可以照着说，或者点一下填进输入框：</div>` + (r.data.replies || []).map((x) =>
      `<div class="suggest-item" data-en="${esc(x.en)}"><span class="en">${esc(x.en)}</span> ${speakBtn(x.en, "sm")} <span class="small muted">${esc(x.zh)}</span></div>`).join("");
    $$(".suggest-item", box).forEach((it) => (it.onclick = (e) => {
      if (e.target.closest("[data-say]")) return;
      $("#kbrow", body).classList.remove("hidden");
      const input = $("#input", body);
      input.value = it.dataset.en;
      input.focus();
      box.classList.add("hidden");
    }));
  },

  // 场景结束：AI 打分点评
  async review(body, s, sc) {
    if (s.view.filter((m) => m.role === "me").length < 2) { toast("再多说几句再结束吧"); return; }
    Mic.cancel();
    const m = modal(`<h3>📝 场景点评：${esc(sc.title)}</h3><div id="rv">${aiLoading("AI 正在看你的对话…")}</div>
      <div class="modal-actions"><a class="btn" href="#/tutor/scenes" data-close>回到场景列表</a><button class="btn primary" data-close>继续练</button></div>`);
    $(".modal", m.root).classList.add("review-modal");
    const transcript = s.view.map((x) => `${x.role === "ai" ? sc.ai : "Learner"}: ${x.text}`).join("\n");
    const r = await AI.json(`You are a supportive English speaking coach. ${LEARNER_PROFILE}`,
      `The learner role-played as the ${sc.user} with the ${sc.ai}. Situation: ${sc.setting}
Tasks: ${sc.tasks.map((t, i) => `${i + 1}. ${t}`).join(" ")}
Transcript:\n${transcript}\n
Evaluate the learner's English. Return JSON:
{"score": 1-10, "summary": "两三句中文总评", "good": ["中文：做得好的地方", ...最多3条],
 "fix": [{"said": "learner's original sentence", "better": "more natural version", "why": "中文说明"}, ...最多3条],
 "learn": [{"en": "a useful phrase for this situation", "zh": "中文"}, ...3条]}`);
    const box = $("#rv", m.root);
    if (!box) return;
    if (!r.ok) { box.innerHTML = aiError(r.error); return; }
    const d = r.data, score = Math.max(1, Math.min(10, +d.score || 6));
    (Store.data.scenes ||= {})[sc.id] = { score: Math.max(score, Store.data.scenes[sc.id]?.score || 0), date: today(), tasks: s.done.length };
    addXP(8 + score);
    Store.save();
    box.innerHTML = `<div class="review-score">${score}<span>/10</span></div><p>${esc(d.summary || "")}</p>
      <div class="small muted">完成任务 ${s.done.length} / ${sc.tasks.length}</div>
      ${(d.good || []).length ? `<div class="card-title mt">👍 做得好</div>${d.good.map((x) => `<div class="small">· ${esc(x)}</div>`).join("")}` : ""}
      ${(d.fix || []).length ? `<div class="card-title mt">✏️ 可以说得更好</div>${d.fix.map((x) => `<div class="fix-row"><div class="small faint">你说：${esc(x.said)}</div><div class="en"><b>${esc(x.better)}</b> ${speakBtn(x.better, "sm")}</div><div class="small muted">${esc(x.why)}</div></div>`).join("")}` : ""}
      ${(d.learn || []).length ? `<div class="card-title mt">📌 记住这几句</div>${d.learn.map((x) => `<div class="phrase-row"><span class="en">${esc(x.en)}</span> ${speakBtn(x.en, "sm")}<button class="star" data-sn="${esc(x.en)}" data-zh="${esc(x.zh)}" title="加入生词本">★</button><div class="small muted">${esc(x.zh)}</div></div>`).join("")}` : ""}`;
    box.addEventListener("click", (e) => {
      const st = e.target.closest("[data-sn]");
      if (st) st.classList.toggle("on", toggleSentNb({ en: st.dataset.sn, zh: st.dataset.zh, from: "场景口语" }));
    });
  },

  // ---------- 伙伴设置 ----------
  partnerSettings(body) {
    const P = Store.prefs, cur = this.partner();
    this._ptab ||= "persona";
    const t = this._ptab;
    body.innerHTML = `<div class="card partner-set">
        <div class="tabs">${[["persona", "角色"], ["voice", "音色"], ["avatar", "形象"]].map(([k, l]) => `<button class="tab ${k === t ? "active" : ""}" data-pt="${k}">${l}</button>`).join("")}</div>
        <h3 class="mt">${{ persona: "你想和怎样的伙伴聊天？", voice: "挑一个喜欢的声音", avatar: "选一个形象" }[t]}</h3>
        <p class="small muted">${{ persona: "只决定性格和说话风格，声音和形象另选。", voice: "头像帮你认出声音，不改变性格。音色用的是微软神经网络语音，需要联网。", avatar: "两位新伙伴使用单张正面透明立绘，可在聊天页轻动，也可在其他页面拖动；原画猫耳角色另有三视角。普通头像由 DiceBear「Lorelei」风格生成（CC0 公有领域）。" }[t]}</p>
        <div class="partner-grid">${
          t === "persona" ? PARTNER_PERSONAS.map((x) => `<button class="partner-card ${x.id === cur.persona.id ? "on" : ""}" data-pick="persona" data-v="${x.id}">
              <b>${esc(x.name)}</b><span class="small brand-text">${esc(x.tags)}</span><span class="small muted">“${esc(x.quote)}”</span></button>`).join("")
          : t === "voice" ? PARTNER_VOICES.map((x) => `<button class="partner-card ${x.id === cur.voice.id ? "on" : ""}" data-pick="voice" data-v="${x.id}">
              <img src="img/avatars/${x.avatar}.svg" alt=""><b>${esc(x.name)}</b><span class="small muted">${x.accent} · ${esc(x.desc)}</span>
              <span class="btn sm soft" data-try="${x.id}">▶ 试听</span></button>`).join("")
          : PARTNER_AVATARS.map((a) => `<button class="partner-card avatar-only ${a === cur.avatar ? "on" : ""} ${a === "flower-cat" ? "flower-cat-choice" : PartnerFigures.has(a) ? "partner-figure-choice" : ""}" data-pick="avatar" data-v="${a}"><img src="${this.avatarSrc(a)}" alt="${a === "flower-cat" ? "原画猫耳角色" : PartnerFigures.name(a)}">${a === "flower-cat" ? "<b>原画猫耳角色 · 三视角</b>" : PartnerFigures.has(a) ? `<b>${PartnerFigures.name(a)}</b>` : ""}</button>`).join("")
        }</div>
        ${t === "avatar" && cur.avatar === "flower-cat" ? `<div class="flower-cat-preview" aria-label="猫耳角色三视角">
          ${FlowerCat.views.map((v) => `<button type="button" data-flower-view="${v}" class="${FlowerCat.view() === v ? "on" : ""}"><img src="${FlowerCat.file(v)}" alt="${FlowerCat.labels[v]}立绘"><span>${FlowerCat.labels[v]}</span></button>`).join("")}
        </div>` : ""}
        ${t === "avatar" && PartnerFigures.has(cur.avatar) ? `<div class="partner-figure-preview"><img src="${this.avatarSrc(cur.avatar)}" alt="${PartnerFigures.name(cur.avatar)}全身立绘"><span>正面立绘 · 聊天时轻动，点击悬浮角色可进入聊天</span></div>` : ""}
        ${t === "avatar" && (cur.avatar === "flower-cat" || PartnerFigures.has(cur.avatar)) ? `<label class="flower-cat-setting"><input type="checkbox" id="companion-visible" ${P.companion_visible ? "checked" : ""}> 在其他页面显示悬浮陪伴角色（可拖动）</label>` : ""}
        <div class="partner-foot">当前：<b>${esc(cur.persona.name)}</b> · ${esc(cur.voice.name)}（${cur.voice.accent}） <img src="${this.avatarSrc(cur.avatar)}" alt="" ${PartnerFigures.has(cur.avatar) ? "data-figure" : ""}>
          <span class="spacer"></span><a class="btn primary" href="#/tutor">去聊天 →</a></div>
      </div>`;
    $$("[data-pt]", body).forEach((b) => (b.onclick = () => { this._ptab = b.dataset.pt; this.partnerSettings(body); }));
    const visible = $("#companion-visible", body);
    if (visible) visible.onchange = () => { P.companion_visible = visible.checked; Store.save(); FlowerCat.refresh(); PartnerFigures.refresh(); ThemeCharacter.refresh(); };
    body.querySelector(".partner-grid").onclick = (e) => {
      const tr = e.target.closest("[data-try]");
      if (tr) { e.stopPropagation(); TTS.speak("Hi! I'm your English partner. What would you like to talk about today?", undefined, tr.dataset.try); return; }
      const c = e.target.closest("[data-pick]");
      if (!c) return;
      const p = P.partner;
      if (c.dataset.pick === "voice") { p.voice = c.dataset.v; if (p.avatar !== "flower-cat" && !PartnerFigures.has(p.avatar)) p.avatar = ""; }
      else {
        p[c.dataset.pick] = c.dataset.v;
        if (c.dataset.pick === "avatar" && (c.dataset.v === "flower-cat" || PartnerFigures.has(c.dataset.v))) P.companion_visible = true;
      }
      Store.save();
      FlowerCat.refresh();
      PartnerFigures.refresh();
      ThemeCharacter.refresh();
      this.partnerSettings(body);
    };
  },
};
