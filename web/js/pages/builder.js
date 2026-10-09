// 连词成句：看中文打英文，句子一步步变长（参考句乐部）
// 两种输入模式：free = 空格换到下一个词、Enter 提交整句；auto = 每个词打对自动跳到下一个

const BD_ROLES = {
  S: { zh: "主语", en: "subject", desc: "句子的主体：动作的发出者，或被描述的人和事物。" },
  V: { zh: "谓语", en: "predicate", desc: "说明主语「做什么」或「怎么样」，由动词构成（包括助动词、情态动词）。" },
  O: { zh: "宾语", en: "object", desc: "动作的承受者，放在及物动词或介词后面。" },
  P: { zh: "表语", en: "predicative", desc: "跟在系动词（be、feel、look 等）后面，说明主语的身份、性质或状态。" },
  A: { zh: "状语", en: "adverbial", desc: "修饰动词、形容词或整个句子，说明时间、地点、方式、原因、程度等。" },
  C: { zh: "补语", en: "complement", desc: "补充说明宾语的状态或动作。" },
  T: { zh: "定语", en: "attributive", desc: "修饰名词，说明「什么样的」「哪一个」。" },
  J: { zh: "连接", en: "connective", desc: "连接词语或句子，表示并列、转折、因果等关系。" },
  X: { zh: "语气", en: "politeness", desc: "礼貌用语或插入成分，让语气更委婉。" },
};
const BD_POS = { 代: "代词", 名: "名词", 动: "动词", 形: "形容词", 副: "副词", 介: "介词", 冠: "冠词", 连: "连词", 数: "数词", 助: "助动词", 情: "情态动词", 限: "限定词", 不: "不定式" };
const bdNorm = (w) => w.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9'-]/g, "");

// 解析句子成分标注：key 是完整句的规范化单词序列
const BD_NOTES = {};
(window.BUILDER_NOTES_RAW || "").trim().split("\n").forEach((line) => {
  const words = [], groups = [];
  line.split(" | ").forEach((part) => {
    const m = part.match(/^([A-Z])(?:\(([^)]*)\))?: (.+)$/);
    if (!m) return;
    const gi = groups.push({ role: m[1], note: m[2] || "" }) - 1;
    m[3].trim().split(/\s+/).forEach((t) => {
      const mm = t.match(/^(.+?)=(.+)\/(.+)$/);
      if (mm) words.push({ key: bdNorm(mm[1]), gloss: mm[2], pos: BD_POS[mm[3]] || mm[3], g: gi });
    });
  });
  BD_NOTES[words.map((w) => w.key).join(" ")] = { words, groups };
});

// 把某一步的单词按顺序对应到完整句的标注上；对不上的词用词典兜底
function bdAnnotate(stepWords, finalEn) {
  const ann = BD_NOTES[finalEn.split(/\s+/).map(bdNorm).join(" ")];
  let p = 0;
  return stepWords.map((w) => {
    const k = bdNorm(w);
    if (ann) {
      for (let j = p; j < ann.words.length; j++) {
        if (ann.words[j].key === k) {
          p = j + 1;
          const a = ann.words[j];
          return { w, gloss: a.gloss, pos: a.pos, g: a.g, group: ann.groups[a.g] };
        }
      }
    }
    const d = lookupWord(w);
    return { w, gloss: d ? shortMeaning(d).replace(/^[a-z]+\.\s*/, "").split("；")[0] : "", pos: "", g: -1, group: null };
  });
}

// 考纲例句：从四级 / 六级 / 雅思 / 托福词书的例句自动生成连词成句课
// 每个词挑一个最合适的例句，步骤是「单词 → 例句里的固定搭配（有的话）→ 整句」；按词书单元分组，每组 8 个词
// 课程 id 形如 x-cet4-3-1（词书 cet4 第 4 单元第 2 组，从 0 数），词书数据不变 id 就不变
const BD_EXAM_BOOKS = [["cet4", "四级"], ["cet6", "六级"], ["ielts", "雅思"], ["toefl", "托福"]];
const ExamBuilder = {
  per: 8,
  _books: null,
  _map: null,
  // 「v. 接触  n. 接触；联络」→「接触」：去掉词性，最多留两个义项
  gloss(s, n = 2) {
    const pos = /^\s*(?:[a-z]+\.?(?:\s*[&\/]\s*[a-z]+\.?)*\s*)+(?=[一-龥(（])/i;
    const seg = String(s || "").trim().replace(/["“”]/g, "").split(/\s{2,}/)[0]
      .replace(/\[[^\]]*\]|【[^】]*】|〈[^〉]*〉|[(（][^)）]*[a-z][^)）]*[)）]/gi, "");
    const senses = seg.split(/[；;]/).map((x) => x.replace(pos, "").split(/\s*[a-z]+[.&a-z]*\s*(?=[一-龥])|\s+[a-z]/i)[0].trim());
    return [...new Set(senses.filter((x) => /[一-龥]/.test(x)))].slice(0, n).join("；");
  },
  clean(en) {
    return en.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+([.,?!;:])/g, "$1").replace(/\s+/g, " ").trim();
  },
  // 挑例句：完整的句子、5–14 个词、有中文；优先包含词条短语的、包含这个词本身的、长度适中的
  pick(w) {
    const head = w[0].toLowerCase(), stem = head.slice(0, Math.max(3, head.length - 2));
    let best = null;
    (w[3] || []).forEach(([en0, zh]) => {
      const en = this.clean(en0 || "");
      if (!zh || !/[一-龥]/.test(zh) || zh.length > 60) return;
      if (!/^[A-Z][A-Za-z0-9 ,.'?!;:"-]*[.?!]"?$/.test(en) || /\bi\b/.test(en)) return;
      const toks = en.split(" ");
      if (toks.length < 5 || toks.length > 14) return;
      const low = ` ${en.toLowerCase().replace(/[^a-z0-9' -]/g, " ").replace(/\s+/g, " ")} `;
      const phrase = (w[4] || []).find(([p, pz]) => {
        const pl = (p || "").toLowerCase().trim();
        const n = pl.split(/\s+/).length;
        return pz && n >= 2 && n <= toks.length - 2 && /^[a-z' -]+$/.test(pl) && !/\b(sb|sth|one's|oneself)\b/.test(pl) && low.includes(` ${pl} `);
      });
      const hasHead = low.split(" ").some((t) => t.startsWith(stem));
      const score = (phrase ? 3 : 0) + (hasHead ? 2 : 0) - Math.abs(toks.length - 9) * 0.3;
      if (!best || score > best.score) best = { en, zh: zh.trim(), phrase, score };
    });
    return best;
  },
  build(bookId, name) {
    const book = BOOK_MAP[bookId];
    if (!book || book.stub) return null; // 还没加载的词书先不算（要用时页面会先加载，见 books(params)）
    const seen = new Set();
    const out = { id: bookId, name, title: book.title, units: [], lessons: [], sentences: 0 };
    book.units.forEach((u, ui) => {
      const items = [];
      u.words.forEach((w) => {
        const ex = this.pick(w);
        if (!ex || seen.has(ex.en)) return;
        seen.add(ex.en);
        const steps = [];
        if (/^[A-Za-z][A-Za-z' -]*$/.test(w[0]) && this.gloss(w[2])) steps.push([w[0], this.gloss(w[2])]);
        if (ex.phrase) {
          // 用例句里的原样大小写
          const m = ex.en.match(new RegExp(`\\b${ex.phrase[0].trim().replace(/[-']/g, "\\$&").replace(/\s+/g, "\\s+")}\\b`, "i"));
          if (m) steps.push([m[0], this.gloss(ex.phrase[1], 1)]);
        }
        steps.push([ex.en, ex.zh]);
        items.push({ word: w[0], steps });
      });
      if (!items.length) return;
      const chunks = [];
      for (let i = 0; i < items.length; i += this.per) chunks.push(items.slice(i, i + this.per));
      // 最后一组太少就并进前一组
      if (chunks.length > 1 && chunks[chunks.length - 1].length < this.per / 2) chunks[chunks.length - 2].push(...chunks.pop());
      const unit = { title: u.title, words: items.length, lessons: [] };
      chunks.forEach((c, k) => {
        const l = {
          id: `x-${bookId}-${ui}-${k}`, exam: bookId, unit: unit.title, k,
          title: `${name} · ${u.title} · 第 ${k + 1} 组`, icon: "📚",
          desc: c.map((x) => x.word).join(" · "), sentences: c.map((x) => x.steps),
        };
        unit.lessons.push(l);
        out.lessons.push(l);
      });
      out.units.push(unit);
      out.sentences += items.length;
    });
    return out;
  },
  books() {
    const key = BD_EXAM_BOOKS.filter(([id]) => BOOK_MAP[id] && !BOOK_MAP[id].stub).join();
    if (!this._books || this._key !== key) {
      this._key = key;
      this._books = BD_EXAM_BOOKS.map(([id, name]) => this.build(id, name)).filter(Boolean);
      this._map = new Map(this._books.flatMap((b) => b.lessons.map((l) => [l.id, l])));
    }
    return this._books;
  },
  book(id) { return this.books().find((b) => b.id === id); },
  get(id) { return /^x-/.test(id || "") ? (this.books(), this._map.get(id)) : null; },
};

// 小音效：用 Web Audio 合成，不需要音频文件
const Sfx = {
  ctx: null,
  play(notes) {
    if (Store.prefs.sfx === false) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t0 = this.ctx.currentTime;
      notes.forEach(([f, d, type = "sine", vol = 0.07, at = 0]) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(vol, t0 + at);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + d);
        o.connect(g).connect(this.ctx.destination);
        o.start(t0 + at);
        o.stop(t0 + at + d + 0.03);
      });
    } catch { /* 没有音频设备时静默 */ }
  },
  ok() { this.play([[988, 0.07, "sine", 0.05]]); },
  bad() { this.play([[220, 0.18, "triangle", 0.1], [175, 0.22, "triangle", 0.08, 0.09]]); },
  perfect(combo) {
    const k = 1 + Math.min(combo, 12) * 0.025; // 连击越高音调越高
    this.play([523, 659, 784, 1047].map((f, i) => [f * k, 0.16, "sine", 0.07, i * 0.065]));
  },
  good() { this.play([[587, 0.12, "sine", 0.06], [784, 0.2, "sine", 0.06, 0.09]]); },
};

// 课程列表已并入「短语与句子」：场景类的课挂在各单元最后，其余在「句型专项」里
App.pages.builder = {
  books: (params) => [/^x-([^-]+)-/.exec(params[0] || "")?.[1]].filter(Boolean),
  render(root, params, signal) {
    const lesson = BUILDER_LESSONS.find((l) => l.id === params[0]) || ExamBuilder.get(params[0]);
    if (lesson) this.play(root, lesson, signal);
    else location.replace("#/course/patterns");
  },

  rec(id) { return (Store.data.builder ||= {})[id]; },

  // 这一课从哪里来、做完去哪里：单元挑战回到场景路径，句型专项和考纲例句在同一分类里按顺序往下
  context(lesson) {
    const ui = PHRASE_UNITS.findIndex((u) => u.builder === lesson.id);
    if (ui >= 0) {
      const nu = PHRASE_UNITS[ui + 1];
      return { back: "#/course", next: nu && { href: `#/course/${nu.id}/0`, label: `下一单元：${nu.icon} ${nu.title}` } };
    }
    if (lesson.exam) {
      const list = ExamBuilder.book(lesson.exam).lessons;
      const nl = list[list.indexOf(lesson) + 1];
      return { back: `#/course/patterns/exam/${lesson.exam}`, next: nl && { href: `#/builder/${nl.id}`, label: `下一组：${nl.unit} · 第 ${nl.k + 1} 组` } };
    }
    const nl = PATTERN_LESSONS[PATTERN_LESSONS.indexOf(lesson) + 1];
    return { back: `#/course/patterns/${lesson.cat || ""}`, next: nl && nl.cat === lesson.cat && { href: `#/builder/${nl.id}`, label: `下一课：${nl.title}` } };
  },

  play(root, lesson, signal) {
    const ctx = this.context(lesson);
    const P = Store.prefs;
    P.builder_mode ||= "free";
    const steps = lesson.sentences.flatMap((s, si) => s.map(([en, zh], sj) => ({
      si, sj, en, zh, last: sj === s.length - 1, words: en.split(/\s+/), final: s[s.length - 1][0],
    })));
    const st = { i: 0, typed: 0, errors: 0, hints: 0, combo: 0, maxCombo: 0, perfects: 0 };
    let slots, status, fails, cur, phase, stepErr, stepHints;

    root.innerHTML = `
      <div class="lesson-wrap" style="max-width:860px">
        <div class="lesson-top"><a class="btn ghost sm" href="${ctx.back}" title="退出">✕</a><div class="bar bd-bar" style="flex:1"><i id="bp"></i></div><span class="small muted" id="bc"></span></div>
        <div class="row small muted" style="margin:8px 0 12px;gap:8px"><span>${lesson.icon} ${esc(lesson.title)}</span><span class="spacer"></span>
          <div class="tabs bd-mode">${[["free", "空格换词 · Enter 提交"], ["auto", "逐词自动判定"]].map(([m, l]) => `<button class="tab ${P.builder_mode === m ? "active" : ""}" data-mode="${m}">${l}</button>`).join("")}</div>
          <button class="btn sm ghost" id="b-sfx" title="音效">${P.sfx === false ? "🔇" : "🔔"}</button>
          <label class="small row" style="gap:4px;cursor:pointer" title="解析显示后自动进入下一步"><input type="checkbox" id="b-auto" ${P.builder_autonext ? "checked" : ""}> 自动下一步</label></div>
        <div class="card bd-card" id="card">
          <div class="bd-pop-layer" id="pops"></div>
          <div class="row small muted"><span id="bstep"></span><span class="spacer"></span><span id="bstat"></span></div>
          <div class="bd-zh" id="bzh"></div>
          <div id="stage"></div>
          <div class="bd-hint" id="bhint"></div>
          <input class="bd-input" id="bin" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
        </div>
        <div class="bd-keys" id="bkeys"></div>
        <div class="bd-ladder" id="ladder"></div>
        <div class="an-tip hidden" id="antip"></div>
      </div>`;
    const inp = $("#bin", root), card = $("#card", root), stage = $("#stage", root), tip = $("#antip", root);
    const focus = () => inp.focus();
    card.addEventListener("click", (e) => { if (!e.target.closest("button, .an-group, [data-say]")) focus(); });

    const cur_ = () => steps[st.i];
    // Ctrl+M 跟读：这一步完成后跟读刚拼出的句子
    App.shadowTarget = () => (phase === "done" && cur_() ? [{ en: cur_().en, zh: cur_().zh, label: "句子" }] : null);
    const target = (k) => cur_().words[k];
    const editable = (k) => status[k] !== "ok" && status[k] !== "revealed";

    // ---------- 界面 ----------
    const keysHtml = () => {
      const free = P.builder_mode === "free";
      const k = (keys, label) => `<span class="bd-key">${keys.map((x) => `<span class="kbd">${x}</span>`).join("")}<span>${label}</span></span>`;
      return phase === "done"
        ? k(["空格"], "继续") + k(["Enter"], "继续") + k(["Ctrl", "'"], "再听一遍") + k(["Ctrl", "M"], "跟读评测")
        : (free ? k(["空格"], "下一个词") + k(["Enter"], "提交") : k(["空格"], "确认这个词"))
          + k(["Ctrl", "'"], "播放发音") + k(["Ctrl", ";"], "显示答案") + k(["/"], "提示字母");
    };
    const slotsHtml = () => `<div class="bd-slots">${cur_().words.map((w, k) => {
      const width = `min-width:${Math.max(1.2, bdNorm(w).length * 0.62 + 0.4)}em`;
      const isCur = k === cur;
      let text = slots[k];
      if (status[k] === "revealed" || status[k] === "ok") text = w;
      const cls = ["bd-slot", status[k] || "todo", isCur ? "cur" : ""].join(" ");
      return `<span class="${cls}" style="${width}" data-k="${k}">${esc(text)}${isCur ? `<i class="caret"></i>` : ""}</span>`;
    }).join("")}</div>`;
    const drawSlots = () => { stage.innerHTML = slotsHtml(); };
    const drawStatus = () => {
      const acc = st.typed ? Math.round(((st.typed - st.errors) / st.typed) * 100) : 100;
      $("#bstat", root).innerHTML = `正确率 <b>${Math.max(0, acc)}%</b>${st.combo >= 2 ? ` · <span class="combo">🔥 连击 ${st.combo}</span>` : ""}`;
    };
    const drawLadder = () => {
      const s = cur_();
      const prev = steps.filter((x) => x.si === s.si && x.sj < s.sj);
      $("#ladder", root).innerHTML = prev.map((x) => `
        <div class="bd-rung"><span class="en">${esc(x.en)}</span><span class="zh">${esc(x.zh)}</span>${speakBtn(x.en, "sm")}</div>`).reverse().join("");
    };

    // 句子成分解析：逐词显示下划线颜色、中文和词性，同一成分用框圈起来
    const analysisHtml = (s) => {
      const items = bdAnnotate(s.words, s.final);
      const boxes = [];
      items.forEach((it) => {
        const last = boxes[boxes.length - 1];
        if (last && it.g >= 0 && last.g === it.g) last.items.push(it);
        else boxes.push({ g: it.g, group: it.group, items: [it] });
      });
      return `<div class="an-line">${boxes.map((b) => {
        const role = b.group ? b.group.role : "";
        const words = b.items.map((it) => `
          <div class="an-word" data-say="${esc(it.w)}" title="点击听发音">
            <span class="an-w">${esc(it.w)}</span><i class="an-bar"></i>
            <span class="an-g">${esc(it.gloss || " ")}</span><span class="an-p">${esc(it.pos || " ")}</span></div>`).join("");
        return b.group
          ? `<div class="an-group role-${role}" data-role="${role}" data-note="${esc(b.group.note)}"><span class="an-tag">${BD_ROLES[role]?.zh || ""}</span>${words}</div>`
          : `<div class="an-group none">${words}</div>`;
      }).join("")}</div>`;
    };
    const showTip = (g) => {
      const role = BD_ROLES[g.dataset.role];
      if (!role) return;
      tip.innerHTML = `<div class="row"><span class="an-dot role-${g.dataset.role}"></span><b>${role.zh}</b><span class="spacer"></span><i class="faint">${role.en}</i></div>
        <div class="small muted mt-s">${esc(g.dataset.note || role.desc)}</div>`;
      tip.classList.remove("hidden");
      const r = g.getBoundingClientRect();
      const w = Math.min(340, window.innerWidth - 24);
      tip.style.width = w + "px";
      tip.style.left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12)) + "px";
      tip.style.top = Math.max(12, r.top - tip.offsetHeight - 12) + "px";
    };
    stage.addEventListener("mouseover", (e) => { const g = e.target.closest(".an-group[data-role]"); if (g) showTip(g); });
    stage.addEventListener("mouseout", (e) => { if (!e.relatedTarget?.closest?.(".an-group[data-role]")) tip.classList.add("hidden"); });
    stage.addEventListener("click", (e) => { const g = e.target.closest(".an-group[data-role]"); if (g && !e.target.closest("[data-say]")) showTip(g); });

    // 激励动效：Perfect × N 大字 + 火花
    const pop = (text, kind) => {
      const layer = $("#pops", root);
      const el = document.createElement("div");
      el.className = `bd-pop ${kind}`;
      el.textContent = text;
      layer.appendChild(el);
      if (kind === "perfect") {
        for (let n = 0; n < 16; n++) {
          const s = document.createElement("i");
          s.className = "bd-spark";
          const a = (Math.PI * 2 * n) / 16 + Math.random() * 0.3;
          const d = 70 + Math.random() * 70;
          s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
          s.style.setProperty("--dy", `${Math.sin(a) * d * 0.6}px`);
          s.style.background = ["#F97316", "#FACC15", "#22C55E", "#3B82F6", "#EC4899"][n % 5];
          layer.appendChild(s);
          setTimeout(() => s.remove(), 800);
        }
      }
      setTimeout(() => el.remove(), 1500);
    };
    const shake = () => { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); };

    // ---------- 流程 ----------
    const load = () => {
      const s = cur_();
      slots = s.words.map(() => "");
      status = s.words.map(() => "");
      fails = s.words.map(() => 0);
      cur = 0;
      phase = "typing";
      stepErr = 0;
      stepHints = 0;
      inp.value = "";
      card.classList.remove("ok", "shake");
      tip.classList.add("hidden");
      $("#bp", root).style.width = `${(st.i / steps.length) * 100}%`;
      $("#bc", root).textContent = `${st.i + 1} / ${steps.length}`;
      const total = lesson.sentences[s.si].length;
      $("#bstep", root).innerHTML = `第 ${s.si + 1} 句 · 第 ${s.sj + 1}/${total} 步 ${"●".repeat(s.sj + 1)}${"○".repeat(total - s.sj - 1)}`;
      $("#bzh", root).textContent = s.zh;
      $("#bhint", root).textContent = "";
      $("#bkeys", root).innerHTML = keysHtml();
      drawSlots();
      drawLadder();
      drawStatus();
      focus();
    };

    const moveTo = (k) => {
      if (k < 0 || k >= slots.length) return;
      cur = k;
      inp.value = status[k] === "wrong" ? "" : slots[k];
      drawSlots();
    };
    const nextEditable = (from, dir = 1) => {
      for (let k = from + dir; k >= 0 && k < slots.length; k += dir) if (editable(k)) return k;
      return -1;
    };

    const markOk = (k) => { status[k] = "ok"; st.typed++; };
    const markWrong = (k) => {
      status[k] = "wrong";
      fails[k]++;
      st.typed++;
      st.errors++;
      stepErr++;
      if (fails[k] >= 3) { status[k] = "revealed"; slots[k] = target(k); }
    };

    // auto 模式：当前词打对就跳到下一个；按空格 / Enter 时判定当前词
    const acceptCur = () => {
      markOk(cur);
      Sfx.ok();
      const n = nextEditable(cur);
      if (n < 0) complete();
      else moveTo(n);
    };
    const rejectCur = () => {
      markWrong(cur);
      Sfx.bad();
      shake();
      drawStatus();
      if (status[cur] === "revealed") {
        $("#bhint", root).innerHTML = `答案是 <b>${esc(target(cur))}</b>`;
        const n = nextEditable(cur);
        if (n < 0) complete();
        else moveTo(n);
        return;
      }
      slots[cur] = "";
      inp.value = "";
      $("#bhint", root).textContent = `不对哦，再试一次（${fails[cur]}/3）`;
      drawSlots();
    };
    const checkCur = () => {
      if (!slots[cur]) return;
      if (bdNorm(slots[cur]) === bdNorm(target(cur))) acceptCur();
      else rejectCur();
    };

    const submit = () => {
      if (phase !== "typing") return;
      if (slots.every((x, k) => !x && editable(k))) return;
      let wrong = 0;
      slots.forEach((x, k) => {
        if (!editable(k)) return;
        if (bdNorm(x) === bdNorm(target(k))) markOk(k);
        else { markWrong(k); wrong++; }
      });
      drawStatus();
      if (status.every((x) => x === "ok" || x === "revealed")) return complete();
      Sfx.bad();
      shake();
      const revealedNow = status.some((x, k) => x === "revealed" && fails[k] >= 3);
      $("#bhint", root).innerHTML = `红色的 ${wrong} 个词不对，改一改再按 Enter` + (revealedNow ? "（错了 3 次的词已经帮你填上）" : "");
      moveTo(status.findIndex((x) => x === "wrong") >= 0 ? status.findIndex((x) => x === "wrong") : nextEditable(-1));
    };

    const reveal = () => {
      if (phase !== "typing") return;
      const k = editable(cur) ? cur : nextEditable(-1);
      if (k < 0) return;
      status[k] = "revealed";
      slots[k] = target(k);
      st.typed++;
      st.errors++;
      stepErr++;
      $("#bhint", root).innerHTML = `这个词是 <b>${esc(target(k))}</b>`;
      const n = nextEditable(k);
      if (n < 0 && status.every((x) => x === "ok" || x === "revealed")) return complete();
      if (n < 0) return submit();
      moveTo(n);
    };

    const hint = () => {
      if (phase !== "typing" || !editable(cur)) return;
      const t = bdNorm(target(cur));
      const typed = status[cur] === "wrong" ? "" : bdNorm(slots[cur]);
      let k = 0;
      while (k < typed.length && typed[k] === t[k]) k++;
      slots[cur] = t.slice(0, k + 1);
      status[cur] = "";
      inp.value = slots[cur];
      st.hints++;
      stepHints++;
      if (P.builder_mode === "auto" && bdNorm(slots[cur]) === t) return acceptCur();
      drawSlots();
    };

    const complete = async () => {
      phase = "done";
      const s = cur_();
      const perfect = stepErr === 0 && stepHints === 0;
      card.classList.add("ok");
      if (perfect) {
        st.combo++;
        st.perfects++;
        st.maxCombo = Math.max(st.maxCombo, st.combo);
        addXP(1);
        pop(`Perfect × ${st.combo}`, "perfect");
        Sfx.perfect(st.combo);
        if ([5, 10, 20, 30, 50].includes(st.combo)) {
          addXP(st.combo >= 10 ? 5 : 2);
          toast(st.combo >= 20 ? `🔥 ${st.combo} 连击！势不可挡！` : st.combo >= 10 ? `🔥 ${st.combo} 连击！太强了！` : `🔥 ${st.combo} 连击！继续保持！`, "good");
        }
      } else {
        st.combo = 0;
        pop(stepErr <= 1 ? "Great!" : "Good", "good");
        Sfx.good();
      }
      drawStatus();
      stage.innerHTML = analysisHtml(s);
      $("#bhint", root).innerHTML = s.last ? `✅ 整句完成！<span class="faint">鼠标移到彩色框上可以看句子成分说明</span>` : `<span class="faint">鼠标移到彩色框上可以看句子成分说明</span>`;
      $("#bkeys", root).innerHTML = keysHtml();
      inp.value = "";
      focus();
      const my = st.i;
      await Promise.race([TTS.speak(s.en), new Promise((r) => setTimeout(r, 5000))]);
      if (P.builder_autonext && !signal.aborted && phase === "done" && st.i === my) setTimeout(() => { if (phase === "done" && st.i === my && !Shadow.isOpen) next(); }, 1200);
    };

    const next = () => {
      if (phase !== "done") return;
      st.i++;
      if (st.i >= steps.length) finish();
      else load();
    };

    // ---------- 输入 ----------
    inp.addEventListener("input", () => {
      if (phase !== "typing") { inp.value = ""; return; }
      let v = inp.value;
      // 手机输入法、粘贴等可能一次带空格输入多个词：按空格拆开依次填
      const parts = v.split(/\s+/);
      for (let n = 0; n < parts.length; n++) {
        if (phase !== "typing") return;
        if (!editable(cur)) { const k = nextEditable(cur); if (k < 0) break; cur = k; }
        slots[cur] = parts[n].replace(/[^A-Za-z0-9'’-]/g, "");
        status[cur] = "";
        if (P.builder_mode === "auto") {
          // 开头能匹配当前词就吃掉，剩下的继续匹配下一个词（一次输入多个字母时也能正确分词）
          let rest = bdNorm(slots[cur]);
          while (phase === "typing" && rest && rest.startsWith(bdNorm(target(cur)))) {
            rest = rest.slice(bdNorm(target(cur)).length);
            acceptCur();
          }
          if (phase !== "typing") return;
          slots[cur] = rest;
        }
        if (n < parts.length - 1) { const k = nextEditable(cur); if (k >= 0) cur = k; }
      }
      inp.value = slots[cur];
      drawSlots();
    });
    inp.addEventListener("compositionstart", () => toast("检测到中文输入法，请按 Shift 切换到英文", "bad", 3000));
    inp.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if ((ctrl && (e.key === "'" || e.code === "Quote")) || e.key === "Tab") { e.preventDefault(); TTS.speak(cur_().en, e.shiftKey ? 0.6 : undefined); return; }
      if (phase === "done") {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
        return;
      }
      if ((ctrl && (e.key === ";" || e.code === "Semicolon")) || e.key === "Escape") { e.preventDefault(); reveal(); return; }
      if (e.key === "/" || e.key === "?" || e.code === "Slash") { e.preventDefault(); hint(); return; }
      if (e.isComposing) return;
      if (e.key === " ") {
        e.preventDefault();
        if (P.builder_mode === "auto") return checkCur();
        if (!slots[cur]) return;
        const n = nextEditable(cur);
        if (n < 0) submit(); else moveTo(n);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (P.builder_mode === "auto") checkCur();
        else submit();
      } else if (e.key === "Backspace" && !inp.value) {
        e.preventDefault();
        const p = nextEditable(cur, -1);
        if (p >= 0) moveTo(p);
      } else if (e.key === "ArrowLeft" && inp.selectionStart === 0) {
        const p = nextEditable(cur, -1);
        if (p >= 0) { e.preventDefault(); moveTo(p); }
      } else if (e.key === "ArrowRight" && inp.selectionStart === inp.value.length) {
        const n = nextEditable(cur);
        if (n >= 0) { e.preventDefault(); moveTo(n); }
      }
    });
    stage.addEventListener("click", (e) => {
      const s = e.target.closest(".bd-slot[data-k]");
      if (s && phase === "typing" && editable(+s.dataset.k)) moveTo(+s.dataset.k);
      focus();
    });

    // ---------- 设置 ----------
    $$("[data-mode]", root).forEach((b) => (b.onclick = () => {
      P.builder_mode = b.dataset.mode;
      Store.save();
      $$("[data-mode]", root).forEach((x) => x.classList.toggle("active", x === b));
      toast(P.builder_mode === "free" ? "空格换到下一个词，打完按 Enter 提交" : "每个词打对会自动跳到下一个");
      if (phase === "typing") { $("#bkeys", root).innerHTML = keysHtml(); }
      focus();
    }));
    $("#b-sfx", root).onclick = (e) => { P.sfx = P.sfx === false; e.currentTarget.textContent = P.sfx === false ? "🔇" : "🔔"; Store.save(); focus(); };
    $("#b-auto", root).onchange = (e) => { P.builder_autonext = e.target.checked; Store.save(); focus(); };
    signal.addEventListener("abort", () => tip.remove());

    // ---------- 结束 ----------
    const finish = () => {
      const words = steps.reduce((n, s) => n + s.words.length, 0);
      const rate = (st.errors + st.hints * 0.5) / words;
      const stars = rate <= 0.05 ? 3 : rate <= 0.15 ? 2 : 1;
      const old = this.rec(lesson.id);
      Store.data.builder[lesson.id] = { stars: Math.max(stars, old?.stars || 0), date: today(), count: (old?.count || 0) + 1 };
      Store.data.stats.builder_steps = (Store.data.stats.builder_steps || 0) + steps.length;
      addXP(10 + stars * 2);
      Store.save();
      Sfx.perfect(12);
      root.innerHTML = `<div class="lesson-wrap"><div class="card center bd-finish" style="padding:36px">
        <div class="stars-big">${"★".repeat(stars)}<span class="faint">${"☆".repeat(3 - stars)}</span></div>
        <h2 class="mt-s">${esc(lesson.title)} 完成！</h2>
        <div class="grid grid-4 mt">
          <div class="stat"><b>${steps.length}</b><span>完成步数</span></div>
          <div class="stat"><b>${st.perfects}</b><span>Perfect 次数</span></div>
          <div class="stat"><b>${Math.max(0, Math.round((1 - rate) * 100))}%</b><span>正确率</span></div>
          <div class="stat"><b>${st.maxCombo}</b><span>最高连击</span></div></div>
        <div class="mt" style="text-align:left">${lesson.sentences.map((s) => {
          const [en, zh] = s[s.length - 1];
          return `<div class="bd-rung"><span class="en">${esc(en)}</span><span class="zh">${esc(zh)}</span>${speakBtn(en, "sm")}</div>`;
        }).join("")}</div>
        <div class="row mt" style="justify-content:center">
          <button class="btn lg" id="again">再练一次</button>
          ${ctx.next ? `<a class="btn primary lg" href="${ctx.next.href}">${esc(ctx.next.label)} →</a>` : ""}
          <a class="btn lg" href="${ctx.back}">返回课程</a></div>
      </div></div>`;
      $("#again", root).onclick = () => this.play(root, lesson, signal);
    };

    load();
  },
};
