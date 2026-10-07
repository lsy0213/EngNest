// 主题词汇（已并入「单词」）：单词 → 主题词汇 → 词库里显示主题卡片，点进来是分组词表 → 卡片学习 / 打字练习
// 路由：#/topics/<主题 id>；#/topics 会跳到 单词 → 词库
App.pages.topics = {
  book() { return BOOK_MAP.topic; },

  render(root, params) {
    const idx = this.book().units.findIndex((u) => u.id === params[0]);
    if (idx >= 0) return this.detail(root, idx);
    Store.prefs.book = "topic";
    Store.save();
    location.replace("#/words/list");
  },

  // 主题卡片网格，在「单词 → 词库」里选中主题词汇时显示
  gridHtml() {
    const units = this.book().units;
    return `<div class="topic-grid">${units.map((u) => {
        const learned = u.items.filter((x) => Store.data.words[x.w]).length;
        return `<a class="card topic-card" href="#/topics/${u.id}">
          <div class="topic-title"><span class="topic-ico">${u.icon}</span>${esc(u.title)}英语单词<span class="faint small" style="font-weight:400">${esc(u.en)}</span></div>
          <p>学习 ${u.items.length} 个常见${esc(u.title)}相关的英语单词，包括${esc(u.desc)}。</p>
          <div class="row small faint"><span>${u.items.length} 个单词</span><span>${u.groups.length} 个分组</span><span class="spacer"></span>
            ${learned ? `<span class="${learned === u.items.length ? "badge good" : "muted"}">已学 ${learned}</span>` : ""}</div>
          ${learned ? `<div class="bar" style="height:4px"><i style="width:${(learned / u.items.length) * 100}%"></i></div>` : ""}
        </a>`;
      }).join("")}</div>`;
  },

  detail(root, idx) {
    const u = this.book().units[idx];
    const learned = u.items.filter((x) => Store.data.words[x.w]).length;
    let start = 0;
    const groups = u.groups.map((g) => {
      const items = u.items.slice(start, start + g.n);
      start += g.n;
      return { ...g, items };
    });
    root.innerHTML = `
      <a class="back-link" href="#/topics">‹ 返回单词 · 主题词汇</a>
      ${pageHead(`${u.icon} ${esc(u.title)}英语单词 <span class="faint" style="font-size:16px;font-weight:400">${esc(u.en)}</span>`,
        `${u.items.length} 个单词 · ${groups.length} 个分组 · 已学 ${learned} 个`,
        `<div class="row"><button class="btn primary" id="learn">🃏 卡片学习</button><a class="btn soft" href="#/typing/words/topic/${idx}">⌨️ 打字练习</a><button class="btn" id="play-all">🔊 连续播放</button></div>`)}
      ${groups.map((g) => `
        <div class="card">
          <div class="card-title">${esc(g.title)} <span class="badge">${g.items.length}</span></div>
          <div class="topic-words">${g.items.map((x) => `
            <div class="topic-word" data-w="${esc(x.w)}" data-shadow-host>
              <div class="row" style="gap:8px"><span class="dot ${wordStatus(x.w)}"></span><b class="tw">${esc(x.w)}</b><span class="ipa">${esc(x.ph)}</span>
                <span class="spacer"></span>${speakBtn(x.w, "sm")}${shadowBtn(x.w, { ph: x.ph, zh: x.m, label: "单词" })}<button class="star ${inNotebook(x.w) ? "on" : ""}" data-star="${esc(x.w)}">★</button></div>
              <div class="tz">${esc(x.m)}</div>
              ${x.ex ? `<div class="tex">${esc(x.ex)} ${speakBtn(x.ex, "sm")}${shadowBtn(x.ex, { zh: x.zh, label: "例句" })}<div class="faint">${esc(x.zh)}</div></div>` : ""}
            </div>`).join("")}</div>
        </div>`).join("")}
      <div class="row mt" style="justify-content:space-between">
        ${idx > 0 ? `<a class="btn ghost" href="#/topics/${this.book().units[idx - 1].id}">‹ ${esc(this.book().units[idx - 1].title)}</a>` : "<span></span>"}
        ${idx + 1 < this.book().units.length ? `<a class="btn ghost" href="#/topics/${this.book().units[idx + 1].id}">${esc(this.book().units[idx + 1].title)} ›</a>` : ""}
      </div>`;

    $("#learn", root).onclick = () => {
      Store.prefs.book = "topic";
      Store.save();
      if (!unlearnedWords(idx).length) { toast("这个主题的词都学过了，去复习或打字练习吧"); return; }
      Router.go(`words/new/${idx}`);
    };
    root.addEventListener("click", (e) => {
      const s = e.target.closest("[data-star]");
      if (s) s.classList.toggle("on", toggleNotebook(u.items.find((x) => x.w === s.dataset.star)));
    });

    // 连续播放：依次读单词（再读中文提示的话需要中文语音，这里只读英文）
    let playing = false;
    const btn = $("#play-all", root);
    btn.onclick = async () => {
      if (playing) { playing = false; TTS.stop(); btn.textContent = "🔊 连续播放"; return; }
      playing = true;
      btn.textContent = "⏹ 停止播放";
      for (const el of $$(".topic-word", root)) {
        if (!playing || !root.isConnected) break;
        $$(".topic-word.now", root).forEach((x) => x.classList.remove("now"));
        el.classList.add("now");
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        await TTS.speak(el.dataset.w);
        await new Promise((r) => setTimeout(r, 600));
      }
      playing = false;
      if (root.isConnected) { btn.textContent = "🔊 连续播放"; $$(".topic-word.now", root).forEach((x) => x.classList.remove("now")); }
    };
  },
};
