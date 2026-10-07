// 合租日记：原创情景喜剧 + 生活模拟。你刚到纽约，和邻居们过日子，在对话里学地道口语
// 每天三个时段（上午 / 下午 / 晚上），每个行动花一个时段；到了日子主线剧情自动开始
// 对话里每次选择有三种回答：地道 / 能懂但不自然 / 中式英语或不合适，选完马上讲解；也可以按 V 把回答说出来
// 剧情数据在 data/sitcom.js、data/sitcom_chats.js；进度存在 Store.data.sitcom
const SC_SLOTS = ["上午", "下午", "晚上"];
const SC_SLOT_ICO = ["🌅", "☀️", "🌙"];
const SC_SCORE = STORY_SCORE;
// 在哪里、什么时段能找到谁（Mia 上午在咖啡馆上班，Leo 上午上班，Priya 晚上上夜班）
const SC_WHERE = {
  mia: { home: [1, 2], cafe: [0] }, jake: { "4a": [0, 1, 2] }, priya: { "4a": [0, 1] },
  leo: { "3b": [1, 2] }, rosa: { "1a": [0, 1, 2] },
};
// 没有新剧情时「一起待一会儿」随机说的话
const SC_HANG = {
  mia: [["Want to watch a cooking show with me? I promise I won't judge the contestants. Much.", "想和我一起看烹饪节目吗？我保证不怎么吐槽选手。"],
    ["I reorganized the spice rack. Alphabetically. Don't tell Jake, he'll make fun of me.", "我把调料架重新整理了，按字母顺序。别告诉 Jake，他会笑话我的。"],
    ["Long day at the café. Want some leftover muffins? They're only a little squished.", "咖啡馆忙了一天。想吃剩下的松饼吗？只是有一点点压扁了。"]],
  jake: [["Okay, rate this face. Is it 'funny guy' or 'guy who forgot his keys'?", "来，给这个表情打分。是「搞笑的人」还是「忘带钥匙的人」？"],
    ["I've been thinking about opening a food truck. Just tacos. And jokes. Taco jokes.", "我在考虑开个餐车。只卖墨西哥卷饼。还有笑话。卷饼笑话。"],
    ["You want half of my sandwich? It's mostly lettuce. I'm on a budget.", "想吃我一半三明治吗？大部分是生菜。我在省钱。"]],
  priya: [["Fancy a cup of tea? Proper tea, not that bag-in-a-mug nonsense.", "想喝杯茶吗？正经的茶，不是那种茶包泡马克杯的玩意儿。"],
    ["Quick health tip: you're not drinking enough water. Nobody is. Drink some water.", "健康小贴士：你喝水不够。没人喝够。去喝点水。"],
    ["I found Jake asleep in the hallway again. I put a blanket on him. Don't tell him.", "我又发现 Jake 睡在走廊里了。我给他盖了条毯子。别告诉他。"]],
  leo: [["I'm designing my own board game. It's about pigeons running a bank. It makes sense, I promise.", "我在设计自己的桌游。讲的是鸽子开银行。我保证这说得通。"],
    ["Did you know the Wi-Fi in this building is named after my cat? Her name is Router.", "你知道这栋楼的 Wi-Fi 是用我的猫命名的吗？她叫 Router。"],
    ["I practiced saying 'good morning' to Mia today. I said 'good mo-hi'. Progress.", "我今天练了跟 Mia 说「早上好」。我说成了「早上嗨」。有进步。"]],
  rosa: [["Sit, sit. Have you eaten? You look hungry. You always look hungry.", "坐，坐。吃了吗？你看起来很饿。你总是看起来很饿。"],
    ["The man in 2C plays the trumpet at six in the morning. I'm writing him a very polite letter.", "2C 那个人早上六点吹小号。我正在给他写一封非常客气的信。"],
    ["In my day, we didn't have phones. We had neighbors. Much better.", "我们那个年代没有手机。我们有邻居。好多了。"]],
};
const SC_PERSONA = {
  mia: "a warm, organized café manager in her late twenties who grew up with five brothers, loves cooking, and dreams of opening her own café",
  jake: "a broke, funny aspiring stand-up comedian in his twenties who delivers food by day, loves food and makes jokes all the time",
  priya: "a sarcastic but kind ER nurse from London in her late twenties who works night shifts and drinks a lot of tea",
  leo: "a shy, nerdy software engineer who loves board games, has a cat named Router, and is dating Mia (or has a crush on her)",
  rosa: "a warm, nosy landlady in her seventies who has lived in the building for forty years, is a widow, and makes famous lasagna",
};

App.pages.sitcom = {
  get st() { return Store.data.sitcom; },

  newGame() {
    Store.data.sitcom = {
      v: 1, day: 1, slot: 0, money: 300, energy: 100,
      fr: { mia: 0, jake: 0, priya: 0, leo: 0, rosa: 0 },
      done: {}, inv: {}, met: [], best: 0, total: 0, spoke: 0, ai: {}, learned: [],
    };
    Store.save();
  },

  render(root, params, signal) {
    root.classList.add("page-wide");
    this.root = root;
    this.signal = signal;
    if (!this.st) return this.title();
    const ep = this.dueEpisode();
    if (ep) return this.play({ ...ep, kind: "ep" });
    this.hub(params[0]);
  },
  // 回到主界面：先注销正在进行的对话 / 打工的快捷键
  refresh() {
    if (this._ctl) this._ctl.abort();
    if (this.root?.isConnected) this.render(this.root, [], this.signal);
  },

  dueEpisode() {
    const st = this.st;
    return SITCOM.episodes.filter((e) => !st.done[e.id] && (e.day < st.day || (e.day === st.day && e.slot <= st.slot)))
      .sort((a, b) => a.day - b.day || a.slot - b.slot)[0];
  },
  nextEpisode() {
    const st = this.st;
    return SITCOM.episodes.filter((e) => !st.done[e.id] && !e.id.startsWith("rent")).sort((a, b) => a.day - b.day || a.slot - b.slot)[0];
  },
  frLevel(v) { return v >= 70 ? "好朋友" : v >= 40 ? "朋友" : v >= 20 ? "熟人" : "新邻居"; },
  avatar(a) { return `img/avatars/${a}.svg`; },

  // ---------- 开始画面 ----------
  title() {
    const C = SITCOM.chars;
    this.root.innerHTML = `<div class="sc-title card">
        <a class="btn sm ghost" href="#/life">← 人生剧场</a>
        <div class="sc-title-top mt-s"><div style="font-size:54px">🛋️</div>
          <div><h1>合租日记 <span class="faint en" style="font-weight:400">Maple Street</span></h1>
          <p class="muted">一部原创的情景喜剧，你是主角。你刚到纽约，搬进布鲁克林 Maple Street 23 号的 4B 公寓。
          接下来的十二天里，你要打工赚房租、和五个性格各异的邻居交朋友，还会卷进生日惊喜、停电之夜和一场烤糊的感恩节晚餐。</p></div></div>
        <div class="sc-cast">${Object.entries(C).map(([, c]) => `<div class="sc-cast-item"><img src="${this.avatar(c.avatar)}" alt=""><b>${esc(c.name)}</b><div class="small muted">${esc(c.role)}</div><div class="small faint">${esc(c.bio)}</div></div>`).join("")}</div>
        <div class="grid grid-3 small muted sc-how">
          <div><b style="color:var(--ink)">💬 在对话里学</b><br>每次选择都有地道、能懂、中式英语三种回答，选完马上告诉你为什么。点单词查意思，句子能收藏、能跟读。</div>
          <div><b style="color:var(--ink)">🎤 开口说</b><br>按 V 把你的回答说出来，离线语音识别帮你选，说得准还有额外奖励。</div>
          <div><b style="color:var(--ink)">🏢 过日子</b><br>每天三个时段：去咖啡馆打工（练听力点单）、找邻居聊天、去公园散步、买礼物，好感够了解锁新故事。</div>
        </div>
        <div class="center mt"><button class="btn primary lg" id="sc-start">搬进 Maple Street →</button></div>
      </div>`;
    $("#sc-start", this.root).onclick = () => { this.newGame(); this.refresh(); };
  },

  // ---------- 主界面：地图 + 地点里能做的事 ----------
  hub(placeId) {
    const st = this.st, root = this.root;
    App.shadowTarget = null;
    const next = this.nextEpisode();
    root.innerHTML = `
      <div class="sc-top card">
        <a class="btn sm ghost" href="#/life" title="回到人生剧场的剧本架">← 剧本架</a>
        <div class="sc-day">${SC_SLOT_ICO[st.slot]} <b>第 ${st.day} 天</b> · ${SC_SLOTS[st.slot]}</div>
        <div class="sc-stat" title="现金">💵 <b class="${st.money < 0 ? "bad-text" : ""}">$${st.money}</b></div>
        <div class="sc-stat" title="精力：打工、聊天会消耗，睡觉和休息恢复">⚡ <span class="bar sc-bar"><i style="width:${st.energy}%"></i></span> ${st.energy}</div>
        <div class="sc-stat" title="选到最地道的回答次数">⭐⭐ ${st.best} / ${st.total}</div>
        <span class="spacer"></span>
        <button class="btn sm ghost" id="sc-cast">👥 邻居</button>
        <button class="btn sm ghost" id="sc-learned">📒 学到的表达 (${st.learned.length})</button>
        <button class="btn sm ghost" id="sc-menu" title="设置 / 重新开始">⚙️</button>
      </div>
      ${next ? `<div class="small muted" style="margin:-6px 0 12px">📺 下一集：${esc(next.zh)}（第 ${next.day} 天${SC_SLOTS[next.slot]}）</div>`
        : `<div class="small muted" style="margin:-6px 0 12px">🎉 第一季已经看完了，继续在 Maple Street 生活吧。</div>`}
      <div class="sc-hub">
        <div class="sc-map">${SITCOM.places.map((p) => {
          const here = Object.entries(SC_WHERE).filter(([, w]) => w[p.id]?.includes(st.slot)).map(([c]) => SITCOM.chars[c]);
          return `<button class="sc-place ${placeId === p.id ? "active" : ""}" data-place="${p.id}">
            <span class="sc-place-ico">${p.ico}</span><span class="sc-place-name">${esc(p.name)}</span>
            <span class="sc-place-who">${here.map((c) => `<img src="${this.avatar(c.avatar)}" title="${esc(c.name)}" alt="">`).join("")}</span></button>`;
        }).join("")}</div>
        <div class="card sc-side" id="sc-side"></div>
      </div>`;
    $("#sc-cast", root).onclick = () => this.castModal();
    $("#sc-learned", root).onclick = () => this.learnedModal();
    $("#sc-menu", root).onclick = () => this.menuModal();
    $(".sc-map", root).onclick = (e) => { const b = e.target.closest("[data-place]"); if (b) this.hub(b.dataset.place); };
    this.side($("#sc-side", root), placeId);
  },

  side(box, placeId) {
    const st = this.st, p = SITCOM.places.find((x) => x.id === placeId);
    if (!p) {
      box.innerHTML = `<div class="center muted" style="padding:30px 10px"><div style="font-size:40px">🗺️</div>
        <p>${SC_SLOT_ICO[st.slot]} 现在是第 ${st.day} 天${SC_SLOTS[st.slot]}，去哪儿？</p>
        <p class="small faint">每个行动花一个时段。${st.energy < 30 ? "精力不多了，可以回公寓休息一下。" : "头像表示现在谁在那里。"}</p></div>`;
      return;
    }
    const acts = [];
    const tired = (n) => st.energy < n;
    for (const [cid, w] of Object.entries(SC_WHERE)) {
      const c = SITCOM.chars[cid];
      if (!w[p.id]) continue;
      if (!w[p.id].includes(st.slot)) {
        if (Object.keys(w)[0] !== p.id) continue; // 只在常待的地方说明不在
        acts.push({ ico: "💤", label: `${c.name} 现在不在`, sub: { priya: "晚上去医院上夜班了", leo: "上午在公司上班", mia: "上午在楼下咖啡馆上班" }[cid] || "", off: true });
        continue;
      }
      const chat = (SITCOM.chats[cid] || []).find((x) => !st.done[x.id]);
      const open = chat && st.fr[cid] >= chat.min;
      acts.push({ ico: "💬", label: `找 ${c.name} 聊天`, need: 10,
        sub: open ? `新故事：${chat.zh}` : chat ? `好感到 ${chat.min} 解锁「${chat.zh}」· 先一起待一会儿` : "一起待一会儿（好感 +3）",
        go: () => (open ? this.play({ ...chat, kind: "chat", who: cid }) : this.hangout(cid)) });
      const gifts = Object.entries(st.inv).filter(([, n]) => n > 0);
      if (gifts.length) acts.push({ ico: "🎁", label: `送礼物给 ${c.name}`, sub: "不花时间", go: () => this.giftModal(cid) });
      if (AI.enabled) acts.push({ ico: "🤖", label: `和 ${c.name} 自由聊天`, need: 10, sub: st.ai[cid] === st.day ? "今天已经聊过了" : "AI 扮演角色，你随便说，说错了会帮你改", off: st.ai[cid] === st.day, go: () => this.aiChat(cid) });
    }
    if (p.id === "home") acts.push({ ico: "😴", label: st.slot === 2 ? "早点睡觉" : "睡个午觉", sub: "精力 +40", go: () => this.rest() });
    if (p.id === "cafe") acts.push({ ico: "☕", label: "打工一班", need: 30, sub: "听顾客点单，选对订单。工资 + 小费，精力 -30", go: () => this.cafe() });
    if (p.id === "park") acts.push({ ico: "🚶", label: "散步", need: 10, sub: "精力 +10，可能遇到需要帮忙的人", go: () => this.walk() });
    if (p.id === "shop") acts.push({ ico: "🛍️", label: "买礼物", sub: "不花时间", go: () => this.shopModal() });
    box.innerHTML = `<div class="row" style="gap:10px"><span style="font-size:30px">${p.ico}</span><div><b>${esc(p.name)}</b><div class="small muted">${esc(p.desc)}</div></div></div>
      <div class="sc-acts">${acts.map((a, i) => {
        const off = a.off || (a.need && tired(a.need));
        return `<button class="sc-act" data-i="${i}" ${off ? "disabled" : ""}><span class="sc-act-ico">${a.ico}</span><span><b>${esc(a.label)}</b><span class="small muted">${esc(a.need && tired(a.need) && !a.off ? `精力不够（需要 ${a.need}）` : a.sub || "")}</span></span></button>`;
      }).join("")}</div>`;
    box.onclick = (e) => { const b = e.target.closest(".sc-act"); if (b && !b.disabled) acts[+b.dataset.i].go(); };
  },

  // ---------- 时间和数值 ----------
  advance() {
    const st = this.st;
    st.slot++;
    if (st.slot > 2) {
      st.day++;
      st.slot = 0;
      st.energy = Math.min(100, st.energy + 60);
      st.money -= 10;
      toast(`🌙 一天结束了（生活费 -$10）。第 ${st.day} 天开始`, "", 3000);
    }
    Store.save();
  },
  commit(delta) {
    const st = this.st;
    for (const [k, v] of Object.entries(delta)) {
      if (k === "money") st.money += v;
      else if (k === "energy") st.energy = Math.max(0, Math.min(100, st.energy + v));
      else if (k in st.fr) st.fr[k] = Math.max(0, Math.min(100, st.fr[k] + v));
    }
  },
  rest() {
    if (this.st.slot < 2) { this.commit({ energy: 40 }); toast("睡了一觉，精力 +40", "good"); }
    this.advance(); // 晚上睡觉直接进入第二天（睡一晚精力 +60）
    this.refresh();
  },
  walk() {
    const st = this.st;
    const fresh = SITCOM.encounters.filter((x) => !st.met.includes(x.id));
    const enc = fresh.length ? fresh[0] : pick(SITCOM.encounters);
    this.play({ ...enc, kind: "enc", stranger: SITCOM.strangers[enc.who], bonus: { energy: 10 } });
  },
  hangout(cid) {
    const c = SITCOM.chars[cid], [en, zh] = pick(SC_HANG[cid]);
    this.play({ id: "hang", kind: "hang", title: `Hanging out with ${c.name}`, zh: `和 ${c.name} 待了一会儿`, learn: [],
      script: [[cid, en, zh], { fx: { [cid]: 3, energy: -10 } }] });
  },

  // ---------- 对话（引擎在 js/story_engine.js，和人生剧场共用） ----------
  // scene: { id, title, zh, learn, script, kind: ep / chat / enc / hang / gift, stranger, bonus }
  play(scene) {
    const st = this.st;
    storyStage({
      root: this.root, signal: freshSignal(this, this.signal), scene, from: "合租日记",
      cast: (sp) => (sp === "s" ? { ...scene.stranger, color: "#888" } : SITCOM.chars[sp]),
      chip: (k, v) => `${k === "money" ? "💵" : k === "energy" ? "⚡" : `${SITCOM.chars[k]?.name || k} ❤️`} ${v > 0 ? "+" : ""}${k === "money" ? "$" : ""}${v}`,
      sayFx: (node, s) => (node.who && SITCOM.chars[node.who] ? { [node.who]: SC_SCORE[s].fr } : {}),
      onFx: (node) => { if (node.end) st.season = true; },
      // 交房租：钱够就交，不够要跟房东商量
      nodes: { rent: (node, { queue, delta, step }) => {
        const have = st.money + (delta.money || 0);
        if (have >= node.rent) {
          queue.unshift(["me", "Here's the rent, Mrs. Delgado. Right on time!", "这是房租，Delgado 太太。准时交！"],
            ["rosa", "Right on time. I like that in a tenant.", "很准时。我就喜欢这样的房客。"], { fx: { money: -node.rent }, note: `交了 $${node.rent} 房租` });
          return step();
        }
        queue.unshift({ who: "rosa", ask: `房租 $${node.rent}，可你只有 $${have}……`, opts: [
          [2, "I'm a little short this month. Could I pay you the rest next week?", "这个月手头有点紧。剩下的我能下周给您吗？",
            "I'm a little short 委婉地说钱不够；先说明情况再提出具体的方案（next week），房东更容易答应。",
            [["rosa", "Hmm. Next week. Not a day later.", "嗯。下周。一天都不能晚。"]]],
          [1, "Sorry, I don't have enough money now.", "抱歉，我现在钱不够。",
            "说清楚了，但最好再提一个什么时候能给的方案。",
            [["rosa", "Then when? I need a date, dear.", "那什么时候？我需要个日子，亲爱的。"]]],
          [0, "Can you make the rent cheaper?", "您能把房租降低点吗？",
            "钱不够的时候直接要求降租……房东不会高兴的。",
            [["rosa", "Cheaper? Ha! In this economy?", "更便宜？哈！就现在这个经济？"]]],
        ] }, { fx: { money: -node.rent, rosa: -3 }, note: "先欠着房租（现金变成负数了，记得去咖啡馆打工）" });
        step();
      } },
      onFinish: ({ delta, score }) => {
        this.commit(delta);
        if (scene.kind === "ep" || scene.kind === "chat") st.done[scene.id] = true;
        if (scene.kind === "enc" && !st.met.includes(scene.id)) st.met.push(scene.id);
        st.best += score.best;
        st.total += score.total;
        st.spoke += score.spoke;
        for (const [en] of scene.learn || []) if (!st.learned.includes(en)) st.learned.push(en);
        const free = scene.kind === "gift" || String(scene.id).startsWith("rent");
        addXP(scene.kind === "ep" ? 5 : 2);
        if (!free) this.advance(); else Store.save();
        renderSidebarFoot();
        return { ico: scene.kind === "ep" ? "🎬" : "✨", button: st.season && scene.kind === "ep" && scene.id === "ep7" ? "🎉 第一季完结！继续生活" : "回到 Maple Street" };
      },
      onDone: () => this.refresh(),
      onExit: () => this.refresh(),
    });
  },

  // ---------- 咖啡馆打工：听点单，选订单 ----------
  cafe() {
    const C = SITCOM.cafe, root = this.root, signal = freshSignal(this, this.signal);
    const N = 5;
    const voice = () => pick(SITCOM.strangers).voice;
    const make = () => ({ s: pick(C.sizes), t: pick(C.temps), d: pick(C.drinks), m: pick(C.milks), x: pick(C.extras) });
    const text = (o, tpl) => tpl.replace("{s}", o.s).replace("{t}", o.t).replace("{d}", o.d).replace("{m}", o.m).replace("{x}", o.x ? ` and ${o.x}` : "").replace(/\ba (?=[aeiou])/gi, "an ");
    const ticket = (o) => [o.s, o.t, o.d, o.m, o.x].filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" · ");
    const key = (o) => ticket(o);
    const vary = (o) => {
      const f = pick(["s", "t", "d", "m", "x"]), list = { s: C.sizes, t: C.temps, d: C.drinks, m: C.milks, x: C.extras }[f];
      return { ...o, [f]: pick(list.filter((v) => v !== o[f])) };
    };
    let i = 0, earned = 0, right = 0, order, opts, plays, v, answered;

    root.innerHTML = `<div class="sc-stage card">
        <div class="sc-stage-head"><b>☕ The Daily Grind · 打工</b><span class="small muted" id="cf-prog"></span><span class="spacer"></span><span class="small">💵 <b id="cf-earn">$0</b></span></div>
        <div class="sc-cafe" id="cf"></div>
        <div class="kbd-hint">R 再听一遍 · 1–4 选订单 · 空格 / Enter 下一位顾客</div></div>`;
    const box = $("#cf", root);
    const listen = (rate) => { plays++; TTS.speak(order.say, rate, v); };
    const next = () => {
      if (i >= N) return done();
      order = make();
      order.say = text(order, pick(C.asks));
      const set = new Map([[key(order), order]]);
      while (set.size < 4) { const w = vary(order); set.set(key(w), w); }
      opts = shuffle([...set.values()]);
      plays = 0; v = voice(); answered = false;
      $("#cf-prog", root).textContent = `第 ${i + 1} / ${N} 位顾客`;
      box.innerHTML = `<div class="center"><div style="font-size:44px">🧑‍🦱</div><div class="muted">一位顾客走到柜台前……</div>
          <div class="row mt-s" style="justify-content:center"><button class="btn soft" id="cf-again">🔊 再听一遍 <span class="kbd">R</span></button><button class="btn ghost" id="cf-slow">🐢 慢速</button></div></div>
        <div class="options mt">${opts.map((o, k) => `<button class="option" data-k="${k}"><span class="letter">${k + 1}</span><span class="en">${esc(ticket(o))}</span></button>`).join("")}</div>
        <div id="cf-after"></div>`;
      $("#cf-again", box).onclick = () => listen();
      $("#cf-slow", box).onclick = () => listen(0.7);
      $$(".option", box).forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
      listen();
    };
    const answer = (k) => {
      if (answered) return;
      answered = true;
      const ok = key(opts[k]) === key(order);
      const pay = ok ? 10 + (plays <= 1 ? 4 : plays === 2 ? 2 : 0) : 0;
      earned += pay;
      if (ok) right++;
      $$(".option", box).forEach((b, j) => { b.disabled = true; if (key(opts[j]) === key(order)) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
      $("#cf-earn", root).textContent = `$${earned}`;
      $("#cf-after", box).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? `✅ 做对了！+$${pay}${plays <= 1 ? "（一次听懂，小费 $4）" : ""}` : "❌ 做错了，顾客皱了皱眉。"}
          <div class="mt-s"><span class="en">${esc(order.say)}</span> ${speakBtn(order.say, "sm")}${shadowBtn(order.say)}</div>
          <div class="small muted mt-s">${esc([order.s === "small" ? "小杯" : order.s === "medium" ? "中杯" : "大杯", order.t === "hot" ? "热" : "冰", { latte: "拿铁", cappuccino: "卡布奇诺", Americano: "美式", mocha: "摩卡", "chai latte": "印度香料奶茶", "flat white": "澳白" }[order.d], { "whole milk": "全脂奶", "oat milk": "燕麦奶", "almond milk": "杏仁奶", "skim milk": "脱脂奶" }[order.m], { "an extra shot": "加一份浓缩", "no sugar": "不加糖", "whipped cream": "加奶油", "a pump of vanilla": "加一泵香草糖浆", "": "" }[order.x]].filter(Boolean).join(" · "))}</div></div>
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary" id="cf-next">${i + 1 < N ? "下一位" : "下班"} <span class="kbd">空格</span></button></div>`;
      App.shadowTarget = () => [{ en: order.say, label: "顾客" }];
      $("#cf-next", box).onclick = () => { i++; next(); };
    };
    const done = () => {
      App.shadowTarget = null;
      const tips = right === N ? 15 : 0;
      this.commit({ money: earned + tips, energy: -30, ...(right >= 4 ? { mia: 2 } : {}) });
      this.advance();
      addXP(2 + right);
      box.innerHTML = `<div class="center" style="padding:20px"><div style="font-size:44px">☕</div><h3>下班啦！</h3>
        <p class="muted">做对 ${right} / ${N} 单，赚了 <b>$${earned + tips}</b>${tips ? `（全对，Mia 多给了 $${tips} 奖金）` : ""} · 精力 -30</p>
        <p class="small faint">常用点单句型：Can I get…? / I'd like… / Could I have…? / I'll have… · to go = 外带</p>
        <button class="btn primary" id="cf-back">回到 Maple Street <span class="kbd">Enter</span></button></div>`;
      $("#cf-back", box).onclick = () => this.refresh();
      i = N + 1;
    };
    onKey(signal, (e) => {
      const k = e.key.toLowerCase();
      if (k === "r" && i < N && !answered) listen();
      else if (/^[1-4]$/.test(e.key) && i < N && !answered) answer(+e.key - 1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (i > N) this.refresh();
        else if (answered) { i++; next(); }
      }
    });
    next();
  },

  // ---------- 礼物 ----------
  shopModal() {
    const st = this.st, G = SITCOM.gifts;
    const m = modal(`<h3>🛍️ 街角小店</h3><p class="small muted">送礼物能提升好感。每个人都有自己特别喜欢的东西（好感到 20 后在「👥 邻居」里能看到）。</p>
      <div id="shop">${Object.entries(G).map(([id, g]) => `<div class="row sc-shop-row"><span style="font-size:24px">${g.ico}</span><div style="flex:1"><div class="en">${esc(g.en)}</div><div class="small muted">${esc(g.zh)} · 已有 ${st.inv[id] || 0}</div></div>
        <button class="btn sm primary" data-buy="${id}" ${st.money < g.price ? "disabled" : ""}>$${g.price}</button></div>`).join("")}</div>
      <p class="small faint">现金 $<b id="shop-money">${st.money}</b>。店员会说：<span class="en">That'll be ... / Would you like a bag?</span></p>
      <div class="modal-actions"><button class="btn" data-close>好了</button></div>`, { onClose: () => this.refresh() });
    $("#shop", m.root).onclick = (e) => {
      const b = e.target.closest("[data-buy]");
      if (!b) return;
      const g = G[b.dataset.buy];
      if (st.money < g.price) return;
      st.money -= g.price;
      st.inv[b.dataset.buy] = (st.inv[b.dataset.buy] || 0) + 1;
      Store.save();
      TTS.speak(`That'll be ${g.price} dollars. Would you like a bag?`, undefined, "en-GB-RyanNeural");
      toast(`买了 ${g.zh}`, "good");
      m.close();
      this.shopModal();
    };
  },
  giftModal(cid) {
    const st = this.st, c = SITCOM.chars[cid];
    const own = Object.entries(st.inv).filter(([, n]) => n > 0);
    const m = modal(`<h3>🎁 送给 ${esc(c.name)} 什么？</h3>
      ${own.map(([id]) => { const g = SITCOM.gifts[id]; return `<button class="sc-act" data-g="${id}"><span class="sc-act-ico">${g.ico}</span><span><b class="en">${esc(g.en)}</b><span class="small muted">${esc(g.zh)}</span></span></button>`; }).join("")}
      <div class="modal-actions"><button class="btn" data-close>算了</button></div>`);
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]");
      if (!b) return;
      m.close();
      const id = b.dataset.g, g = SITCOM.gifts[id], liked = c.likes === id;
      st.inv[id]--;
      this.play({ id: "gift", kind: "gift", title: "A Little Gift", zh: `送 ${c.name} 礼物`,
        learn: [["I got you something.", "我给你带了个小礼物。", "送礼物时的开场白"], ["You didn't have to!", "你不用这么客气的！", "收礼物时说"]],
        script: [
          ["me", `I got you something. It's ${g.en}.`, `我给你带了个小礼物。是${g.zh}。`],
          liked ? [cid, "No way! How did you know? I love it. Thank you so much!", "不会吧！你怎么知道的？我太喜欢了。太谢谢你了！"]
            : [cid, "Aw, you didn't have to! That's really sweet. Thank you.", "哇，你不用这么客气的！真贴心。谢谢你。"],
          { fx: { [cid]: liked ? 12 : 5 } },
        ] });
    });
  },

  // ---------- AI 自由聊天：AI 扮演角色，顺便纠错 ----------
  aiChat(cid) {
    const st = this.st, c = SITCOM.chars[cid], root = this.root, signal = freshSignal(this, this.signal);
    const msgs = [];
    const MAX = 6;
    let busy = false, turns = 0;
    root.innerHTML = `<div class="sc-stage card">
        <div class="sc-stage-head"><img class="sc-ava" src="${this.avatar(c.avatar)}" alt="" style="width:32px;height:32px"><b>和 ${esc(c.name)} 自由聊天</b><span class="small muted" id="ai-left"></span><span class="spacer"></span><button class="btn sm ghost" id="ai-end">结束聊天</button></div>
        <div class="sc-scene sc-zh-always" id="ai-log"></div>
        <div class="sc-foot"><input class="input en" id="ai-in" placeholder="Say something in English…" autocomplete="off" style="flex:1">
          <button class="btn soft" id="ai-mic" title="说英文">🎤</button><button class="btn ghost" id="ai-how" title="想说的不会说？写中文，告诉你英语怎么说">🆘</button><button class="btn primary" id="ai-send">发送</button></div>
        <div class="kbd-hint">打字或者点 🎤 说话 · 说错了 ${esc(c.name)} 不会在意，下面会有小提示帮你改</div></div>`;
    const log = $("#ai-log", root), inp = $("#ai-in", root);
    bindWordClicks(log);
    const left = () => { $("#ai-left", root).textContent = `· 还能聊 ${MAX - turns} 句`; };
    const add = (html) => { log.insertAdjacentHTML("beforeend", html); log.scrollTo({ top: log.scrollHeight, behavior: "smooth" }); };
    const theirLine = (en) => `<div class="sc-line"><img class="sc-ava" src="${this.avatar(c.avatar)}" alt=""><div class="sc-bubble"><div class="sc-name" style="color:${c.color}">${esc(c.name)}</div><div class="sc-en" data-text="${esc(en)}">${wrapWords(en)}</div><div class="sc-tools">${speakBtn(en, "sm")}${shadowBtn(en)}</div></div></div>`;
    const system = `You are ${c.full}, ${SC_PERSONA[cid]}. You live at 23 Maple Street in Brooklyn, New York. The learner is your new neighbor who just moved from China. ${LEARNER_PROFILE}
Stay in character, be friendly and natural, keep each reply to 1-3 short sentences of simple, everyday spoken English (CEFR B1), and usually end with a question to keep the chat going.
${STUCK_RULE}`;
    const askHow = (t = "", fromSend = false) => howToSay({
      text: t, context: msgs.slice(-6).map((x) => `${x.role === "user" ? "Learner" : c.name}: ${x.content}`).join("\n"),
      onUse: (en) => { inp.value = en; inp.focus(); },
      onSendAnyway: fromSend ? (raw) => send(raw, true) : null,
    });
    const send = async (text, raw = false) => {
      text = text.trim();
      if (!text || busy || turns >= MAX) return;
      if (!raw && HAS_ZH.test(text)) { inp.value = ""; return askHow(text, true); }
      busy = true;
      turns++;
      left();
      inp.value = "";
      add(`<div class="sc-line me"><div class="sc-ava sc-ava-me">你</div><div class="sc-bubble"><div class="sc-name" style="color:var(--brand)">你</div><div class="sc-en">${esc(text)}</div></div></div><div class="small faint" id="ai-wait">${esc(c.name)} 正在输入…</div>`);
      msgs.push({ role: "user", content: text });
      const r = await AI.json(system + `\nReturn JSON: {"reply": "your in-character reply", "fix": "如果学习者最后一句话有语法或用词错误，用中文简短指出（一句话）；没有错误就留空", "better": "a more natural way to say the learner's last message, or empty if it was already natural"}`,
        msgs.map((x) => `${x.role === "user" ? "Learner" : c.name}: ${x.content}`).join("\n"));
      $("#ai-wait", root)?.remove();
      busy = false;
      if (signal.aborted) return;
      if (!r.ok) { toast(r.error, "bad", 4000); turns--; left(); msgs.pop(); return; }
      const { reply = "", fix = "", better = "" } = r.data;
      if (fix || better) add(`<div class="sc-fb warn small">${fix ? esc(fix) : ""}${better ? `<div>更自然：<span class="en">${esc(better)}</span> ${speakBtn(better, "sm")}</div>` : ""}</div>`);
      msgs.push({ role: "assistant", content: reply });
      add(theirLine(reply));
      TTS.speak(reply, undefined, c.voice);
      App.shadowTarget = () => [{ en: reply, label: c.name }];
      if (turns >= MAX) end();
      else inp.focus();
    };
    const end = () => {
      if (signal.aborted) return;
      if (turns > 0) {
        st.ai[cid] = st.day;
        this.commit({ [cid]: Math.min(6, 2 + turns), energy: -10 });
        this.advance();
        addXP(2 + turns);
        toast(`和 ${c.name} 聊了 ${turns} 句，好感 +${Math.min(6, 2 + turns)}`, "good");
      }
      this.refresh();
    };
    $("#ai-send", root).onclick = () => send(inp.value);
    $("#ai-how", root).onclick = () => askHow(inp.value.trim());
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); send(inp.value); } });
    $("#ai-end", root).onclick = end;
    const mic = $("#ai-mic", root);
    mic.onclick = async () => {
      if (Mic.active) {
        const rec = await Mic.stop();
        mic.textContent = "🎤";
        if (!rec?.heard) return;
        const t = await Stt.transcribe(rec.pcm);
        if (t) inp.value = (inp.value ? inp.value + " " : "") + t;
        inp.focus();
        return;
      }
      if (!(await Stt.ready())) return;
      try { await Mic.start({ onSilence: () => mic.click(), silenceMs: 1400 }); } catch (e) { toast(`打不开麦克风：${e.message || e}`, "bad"); return; }
      mic.innerHTML = `<span class="rec-dot"></span>`;
    };
    signal.addEventListener("abort", () => Mic.cancel());
    const hello = { mia: "Hey you! Perfect timing, I just made coffee. So, how's New York treating you?", jake: "Buddy! Come in, come in. Tell me something funny that happened to you today. I need material.",
      priya: "Oh, hello. I've got about ten minutes before I need to sleep. What's new with you?", leo: "Oh, hi! I was just, um, organizing my dice. By color. How's your day going?",
      rosa: "Come in, sit down, dear. Tell me everything. How are you settling in?" }[cid];
    msgs.push({ role: "assistant", content: hello });
    add(theirLine(hello));
    TTS.speak(hello, undefined, c.voice);
    left();
    setTimeout(() => inp.focus(), 50);
  },

  // ---------- 弹窗：邻居、学到的表达、设置 ----------
  castModal() {
    const st = this.st;
    const m = modal(`<h3>👥 Maple Street 的邻居</h3>${Object.entries(SITCOM.chars).map(([cid, c]) => {
      const v = st.fr[cid], chat = (SITCOM.chats[cid] || []).find((x) => !st.done[x.id]);
      return `<div class="sc-cast-row"><img src="${this.avatar(c.avatar)}" alt="">
        <div style="flex:1;min-width:0"><div class="row" style="gap:8px"><b>${esc(c.full)}</b><span class="badge">${this.frLevel(v)}</span></div>
          <div class="small muted">${esc(c.role)} · ${esc(c.bio)}</div>
          <div class="row" style="gap:8px;margin-top:4px"><span class="bar" style="flex:1"><i style="width:${v}%"></i></span><span class="small">❤️ ${v}</span></div>
          <div class="small faint">${chat ? (v >= chat.min ? `有新故事：${esc(chat.zh)}` : `好感到 ${chat.min} 解锁「${esc(chat.zh)}」`) : "所有故事都看完了"}${v >= 20 ? ` · 好像很喜欢 ${SITCOM.gifts[c.likes].ico}` : ""}</div></div></div>`;
    }).join("")}<div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    m.root.querySelector(".modal").style.maxWidth = "620px";
  },
  learnedModal() {
    const st = this.st;
    const all = new Map();
    [...SITCOM.episodes, ...Object.values(SITCOM.chats).flat(), ...SITCOM.encounters].forEach((s) => (s.learn || []).forEach(([en, zh, note]) => all.set(en, [zh, note])));
    const list = st.learned.filter((en) => all.has(en));
    const m = modal(`<h3>📒 学到的表达（${list.length}）</h3>
      ${list.length ? `<div style="max-height:60vh;overflow:auto">${list.map((en) => { const [zh, note] = all.get(en); return `<div class="sc-learn-row"><span class="en">${esc(en)}</span><span class="muted">${esc(zh)}</span>${note ? `<span class="small faint">${esc(note)}</span>` : ""}<span class="spacer"></span><button class="speak sm" data-say="${esc(en.replace(/\.\.\./g, ""))}">🔊</button><button class="star ${inSentNb(en) ? "on" : ""}" data-en="${esc(en)}" data-zh="${esc(zh)}">★</button></div>`; }).join("")}</div>
        <div class="modal-actions"><button class="btn" data-close>关闭</button><button class="btn primary" id="all-nb">全部收进生词本</button></div>`
        : `<p class="muted">看完一段剧情或对话，里面的重点表达会收在这里。</p><div class="modal-actions"><button class="btn" data-close>关闭</button></div>`}`);
    m.root.querySelector(".modal").style.maxWidth = "640px";
    m.root.addEventListener("click", (e) => {
      const s = e.target.closest(".star[data-en]");
      if (s) s.classList.toggle("on", toggleSentNb({ en: s.dataset.en, zh: s.dataset.zh, from: "合租日记" }));
      if (e.target.closest("#all-nb")) {
        let n = 0;
        list.forEach((en) => { if (!inSentNb(en)) { sentNb().unshift(markAdded("sentence_nb", recNorm(en), { en, zh: all.get(en)[0], from: "合租日记", added: today() })); n++; } });
        Store.save();
        renderNav();
        toast(n ? `收进了 ${n} 条` : "都已经在生词本里了", "good");
        m.close();
      }
    });
  },
  menuModal() {
    const P = Store.prefs;
    const m = modal(`<h3>⚙️ 设置</h3>
      <label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" id="sc-v" ${P.sc_voice !== false ? "checked" : ""}> 自动朗读台词（每个角色有自己的声音）</label>
      <p class="small muted mt-s">中文显示可以在对话框右上角切换：一直显示 / 点一下才显示 / 纯英文。</p>
      <div class="modal-actions"><button class="btn bad" id="sc-reset">重新开始游戏</button><span class="spacer"></span><button class="btn" data-close>关闭</button></div>`);
    $("#sc-v", m.root).onchange = (e) => { P.sc_voice = e.target.checked; Store.save(); };
    $("#sc-reset", m.root).onclick = async () => {
      m.close();
      if (await confirmBox("重新开始？", "天数、好感、金钱都会清零（已经收进生词本的句子不受影响）。", "重新开始", true)) {
        delete Store.data.sitcom;
        Store.save();
        this.refresh();
      }
    };
  },
};
