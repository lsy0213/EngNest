// ============================================================
// 图标：把页面上的彩色表情换成统一的细线图标（Lucide，ISC 协议，子集在 js/vendor/icons.js，用 tools/build_icons.py 生成）
// 页面、弹窗、提示里出现的表情，渲染出来以后自动换掉（MutationObserver），不用改各个页面的代码；
// 没有对应图标的表情显示成灰色的单色字形。→ ✓ ✕ ① ★ 这类排版符号不动；输入框、可编辑区域里的文字不动。
// ============================================================
const EMOJI_ICON = {
  // 学习
  "📚": "library", "📖": "book-open", "📘": "book", "📕": "book", "📗": "book", "📒": "notebook", "📔": "notebook-tabs", "📝": "notebook-pen",
  "✍️": "pen-line", "✏️": "pencil", "🖍": "highlighter", "📜": "scroll-text", "📄": "file-text", "📑": "bookmark", "📋": "clipboard-list",
  "🧩": "puzzle", "🧱": "brick-wall", "🔤": "a-large-small", "🔠": "type", "🔢": "hash", "🃏": "layers", "🧬": "dna", "🎓": "graduation-cap",
  "🧑‍🏫": "presentation", "🏫": "school", "🧠": "brain", "💡": "lightbulb", "🀄": "languages", "🆕": "circle-plus", "🔁": "repeat", "🔄": "refresh-cw",
  "🔀": "shuffle", "🩹": "bandage", "📌": "pin", "🔗": "link", "📏": "ruler", "📐": "ruler", "🔬": "microscope", "🧪": "flask-conical",
  // 听说
  "🔊": "volume-2", "🔉": "volume-1", "🔈": "volume", "🔇": "volume-x", "🎧": "headphones", "🎙️": "mic", "🎤": "mic", "👂": "ear", "🗣️": "speech",
  "💬": "message-circle", "💭": "message-circle-more", "👄": "message-circle", "📞": "phone", "📻": "radio", "🎵": "music", "🥁": "drum", "🐢": "turtle",
  // 播放
  "▶": "play", "▶️": "play", "⏸": "pause", "⏹": "square", "⏮": "skip-back", "⏮️": "skip-back", "⏭": "skip-forward", "⏪": "rewind", "⏩": "fast-forward",
  "🎬": "clapperboard", "🎞️": "film", "📺": "tv", "📷": "camera", "🖼️": "image", "⛶": "maximize",
  // 状态和反馈
  "✅": "circle-check", "❌": "circle-x", "❗": "circle-alert", "❓": "circle-question-mark", "❔": "circle-question-mark", "⚠️": "triangle-alert", "🚨": "siren",
  "🎉": "party-popper", "✨": "sparkles", "🌟": "sparkle", "⭐": "star", "🔥": "flame", "⚡": "zap", "💥": "zap", "🎯": "target", "🏆": "trophy",
  "🏅": "medal", "🥇": "medal", "🥈": "medal", "🥉": "medal", "💎": "gem", "💯": "badge-check", "👍": "thumbs-up", "💪": "biceps-flexed",
  "🎁": "gift", "🧊": "snowflake", "🔒": "lock", "🔑": "key-round", "🔔": "bell", "⏰": "alarm-clock", "⏳": "hourglass", "⏱️": "timer", "⏱": "timer",
  "⏲️": "timer", "🕘": "clock", "🕰️": "clock", "📅": "calendar", "🗓️": "calendar-days", "📊": "chart-column", "📈": "trending-up", "📉": "trending-down",
  "💹": "chart-line", "🔍": "search", "🔎": "search", "🧐": "search", "🕵️": "scan-search", "👀": "eye", "👁": "eye",
  // 工具和设置
  "⚙️": "settings", "🔧": "wrench", "🛠️": "hammer", "🧰": "briefcase", "💾": "save", "📦": "package", "🗂️": "folders", "📂": "folder-open",
  "🗑️": "trash", "🗑": "trash", "⬇": "download", "⬇️": "download", "⬆": "upload", "📱": "smartphone", "📲": "smartphone", "💻": "laptop",
  "🌐": "globe", "📡": "radio-tower", "☰": "menu", "✉️": "mail", "✂️": "scissors", "🧷": "paperclip", "🧲": "magnet", "🔦": "flashlight",
  "🏳️": "flag", "🏁": "flag", "♾️": "infinity", "🆘": "life-buoy", "🎨": "palette", "🧑‍🎨": "palette", "📍": "map-pin", "🗺️": "map",
  // 人
  "🤖": "bot", "👤": "user", "👥": "users", "🧑": "user", "🧑‍🦱": "user", "🧍": "user", "👩‍⚕️": "stethoscope", "👨‍👩‍👧": "users", "🎎": "users",
  "👋": "hand", "🙋": "hand", "🙏": "hand-heart", "🤝": "handshake", "👆": "pointer", "🚶": "footprints", "🏃": "footprints", "🚴": "bike",
  "🎭": "drama", "🎩": "drama", "🧚": "sparkles", "🧸": "face-slightly-smiling", "😊": "face-slightly-smiling", "😥": "face-slightly-frowning", "😕": "face-slightly-frowning", "😮": "face-slightly-smiling", "🤔": "circle-question-mark",
  "😶": "face-neutral", "🤐": "face-neutral", "🫥": "face-neutral", "😴": "moon", "💤": "moon",
  // 地点和生活
  "🏠": "house", "🏡": "house", "🪺": "egg", "🛋️": "sofa", "🏢": "building", "🏙️": "building", "🏗️": "construction", "🏦": "landmark", "🏛️": "landmark",
  "🏨": "hotel", "🚪": "door-open", "🍽️": "utensils", "☕": "coffee", "🍞": "croissant", "🍫": "candy", "🍩": "donut", "🍎": "apple", "🥤": "cup-soda",
  "🍜": "soup", "🍳": "chef-hat", "🥦": "salad", "🛍️": "shopping-bag", "👕": "shirt", "💼": "briefcase", "💵": "banknote", "💷": "banknote",
  "🩺": "stethoscope", "🫀": "heart-pulse", "✈️": "plane", "🚌": "bus", "🚀": "rocket", "🎢": "ferris-wheel", "⚽": "volleyball", "🎲": "dices",
  "👾": "ghost", "🧟": "ghost", "💀": "skull", "👹": "skull", "🐉": "flame", "🦖": "bone", "🐙": "fish", "🦂": "bug", "🐺": "moon-star", "🦈": "fish",
  "💢": "face-angry", "🪜": "trending-up", "🟩": "square", "🟡": "circle", "🎀": "ribbon", "🧵": "spool", "🪢": "spool", "🕯️": "flame",
  // 自然
  "🌍": "earth", "🌏": "earth", "🌋": "mountain", "🏔️": "mountain-snow", "🪐": "orbit", "🌊": "waves-horizontal", "🌳": "tree-deciduous", "🌱": "sprout",
  "🌿": "leaf", "🍂": "leaf", "🪴": "sprout", "🌸": "flower-2", "🌻": "flower", "🐾": "paw-print", "🐼": "paw-print", "🦉": "moon-star",
  "☀️": "sun", "🌅": "sunrise", "🌙": "moon", "🌗": "moon", "⛅": "cloud-sun", "☁️": "cloud", "🌫️": "cloud-fog", "🌀": "tornado",
  "❤️": "heart", "🤍": "heart", "💕": "heart", "♥": "heart",
  "🗞️": "newspaper", "📰": "newspaper",
  "⌨️": "keyboard", "🧭": "compass", "⚖️": "scale", "ℹ️": "info", "〰️": "spline", "🗽": "landmark",
};

const Icons = {
  // 要换掉的：emoji 区段的字符（带变体选择符、零宽连接符的组合），加上几个在 iPhone 上会显示成彩色的 BMP 字符
  RE: /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|[\u25B6\u23F8\u23F9\u23EE\u23ED\u2665\u2764\u2630\u2328\u270D\u270F\u2702\u2708\u2709\u2600\u2601\u26A0\u2699\u2696\u267E\u2B07\u2B06\u2194])(?:\uFE0F|\u200D\p{Extended_Pictographic}\uFE0F?|[\u{1F3FB}-\u{1F3FF}])*/gu,
  SKIP: new Set(["SCRIPT", "STYLE", "TEXTAREA", "OPTION", "SELECT", "INPUT", "TITLE", "svg", "SVG", "CODE", "PRE"]),
  svg(name, e) {
    return `<svg class="ei" data-e="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${window.LUCIDE[name]}</svg>`;
  },
  html(e) {
    const key = e.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");
    const name = EMOJI_ICON[key] || EMOJI_ICON[key.replace(/️/g, "")] || EMOJI_ICON[key + "️"];
    if (name && window.LUCIDE?.[name]) return this.svg(name, key);
    return `<span class="ej" aria-hidden="true">${key}︎</span>`; // 没有对应图标：单色字形
  },
  // 把 root 下面文字里的表情换成图标
  run(root) {
    if (!root || !window.LUCIDE) return;
    if (root.nodeType === 3) { this.textNode(root); return; }
    if (root.nodeType !== 1 || this.skip(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (this.RE.test(n.data) && !this.skip(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => this.textNode(n));
  },
  skip(el) {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (this.SKIP.has(e.tagName) || e.isContentEditable || e.classList?.contains("no-icons") || e.classList?.contains("ej")) return true;
    }
    return false;
  },
  textNode(n) {
    this.RE.lastIndex = 0;
    if (!n.parentNode || !this.RE.test(n.data) || this.skip(n.parentElement)) return;
    this.RE.lastIndex = 0;
    const html = esc(n.data).replace(this.RE, (m) => this.html(m));
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    n.parentNode.replaceChild(tpl.content, n);
  },
  _pending: new Set(),
  _raf: 0,
  observe() {
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") this._pending.add(m.target);
        else m.addedNodes.forEach((n) => this._pending.add(n));
      }
      // 微任务里换：在浏览器画出来之前就换好，不会先闪一下彩色表情
      if (!this._raf) {
        this._raf = 1;
        queueMicrotask(() => {
          this._raf = 0;
          const batch = [...this._pending];
          this._pending.clear();
          batch.forEach((n) => { if (n.isConnected) this.run(n); });
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    this.run(document.body);
  },
};
// 正则带 g 标志，test 会记住位置：每次用前归零
Icons.RE.test = function (s) { this.lastIndex = 0; return RegExp.prototype.test.call(this, s); };
