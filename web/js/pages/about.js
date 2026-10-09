// 关于：内容来源、开源协议和署名（CC BY / CC BY-SA 要求注明作者和协议）
const ABOUT_SOURCES = [
  ["词库与词典", [
    ["四六级、雅思、托福词库", "KyleBing/english-vocabulary", "https://github.com/KyleBing/english-vocabulary", "BSD-3-Clause；原始数据来自有道词典词书，仅供个人学习使用"],
    ["英汉词典", "skywind3000/ECDICT", "https://github.com/skywind3000/ECDICT", "MIT"],
    ["计算机词典（软件工程术语对照部分）", "EarsEyesMouth/computerese-cross-references", "https://github.com/EarsEyesMouth/computerese-cross-references", "MIT"],
    ["词频排序", "rspeer/wordfreq", "https://github.com/rspeer/wordfreq", "Apache-2.0（数据 CC BY-SA 4.0）"],
    ["Tatoeba 例句", "tatoeba.org", "https://tatoeba.org", "CC BY 2.0 FR"],
  ]],
  ["阅读与听力", [
    ["VOA 慢速英语（文字、音频、视频）", "VOA Learning English", "https://learningenglish.voanews.com", "美国政府作品，公有领域"],
    ["维基百科文章", "Simple English Wikipedia", "https://simple.wikipedia.org", "CC BY-SA 4.0；每篇文章末尾注明标题和链接，作者见页面编辑历史"],
    ["原著全文", "Project Gutenberg（公有领域作品）", "https://www.gutenberg.org", "公有领域"],
    ["名著插画", "Project Gutenberg 插图版（Tenniel、Denslow、Hugh Thomson、Sidney Paget 等）", "https://www.gutenberg.org", "公有领域"],
    ["阅读配图、场景图片", "Wikimedia Commons", "https://commons.wikimedia.org", "公有领域 / CC0 / CC BY / CC BY-SA，作者和协议写在每张图的说明里"],
    ["音标录音", "Wikimedia Commons 国际音标表录音", "https://commons.wikimedia.org", "大多为 CC BY-SA 3.0，文件和作者见 data/ipa_audio.js"],
  ]],
  ["影视", [
    ["TED 演讲", "TED", "https://www.ted.com", "CC BY-NC-ND 4.0（非商业、不修改），在线播放官方地址，字幕为官方字幕"],
    ["Tears of Steel", "© Blender Foundation | mango.blender.org", "https://mango.blender.org", "CC BY 3.0"],
  ]],
  ["语音与识别", [
    ["离线语音识别", "SYSTRAN/faster-whisper + OpenAI Whisper base.en", "https://github.com/SYSTRAN/faster-whisper", "MIT"],
    ["神经网络语音", "微软 Edge「大声朗读」在线语音（通过 rany2/edge-tts）", "https://github.com/rany2/edge-tts", "edge-tts 为 LGPL-3.0；语音服务归微软所有"],
  ]],
  ["界面与形象", [
    ["AI 语伴头像", "DiceBear「Lorelei」（Lisa Wischofsky）", "https://www.dicebear.com", "CC0 1.0"],
    ["皮肤里的油画、花纹、撕边", "本项目原创 SVG（tools/ 下的生成脚本）", "", "参考了 Aprde/renaissance-rococo-web-design 的版式关系，未使用其作品图片"],
    ["猫耳角色立绘", "根据用户提供的原画生成", "", "公开分发前需确认原画的使用授权"],
  ]],
  ["可选下载（不随软件分发）", [
    ["雅思阅读练习题库", "sallowayma-git/IELTS-practice", "https://github.com/sallowayma-git/IELTS-practice", "代码 GPL-3.0；题源版权归原权利人，仅供个人学习"],
    ["雅思资料包（词汇真经、179、538、写作 100 句、语法讲义）", "hefengxian/my-ielts", "https://github.com/hefengxian/my-ielts", "个人备考笔记，未声明协议：在软件里下载到本机，仅供个人学习，请勿再分发"],
  ]],
  ["软件组件", [
    ["桌面窗口", "r0x0r/pywebview", "https://github.com/r0x0r/pywebview", "BSD-3-Clause"],
    ["Claude API", "anthropics/anthropic-sdk-python", "https://github.com/anthropics/anthropic-sdk-python", "MIT"],
    ["二维码", "lincolnloop/python-qrcode", "https://github.com/lincolnloop/python-qrcode", "BSD"],
    ["打包", "PyInstaller", "https://pyinstaller.org", "GPL-2.0 with bootloader exception"],
  ]],
];

App.pages.about = {
  render(root) {
    root.innerHTML = `<a class="back-link" href="#/settings">‹ 返回设置</a>` + pageHead("内容来源与开源许可", "EngNest 里的内容和组件来自下面这些地方，感谢它们的作者。") + `
      <div class="card"><p class="small muted" style="margin:0">语法、短语、连词成句、主题词汇、发音课、辨音训练、连读与语调、流利度话题、词根词缀、场景口语、
        常识 / 专业 / 新闻 / 文化 / 地理 / 历史短文、原创小说、合租日记和人生剧场的剧本、雅思口语和写作模考题，都是本项目编写的。
        「正版剧集与频道」只提供链接和介绍，不提供任何受版权保护的视频。</p></div>
      ${ABOUT_SOURCES.map(([group, items]) => `<div class="card"><div class="card-title">${esc(group)}</div>
        <table class="word-table about-table" style="margin-top:0">${items.map(([what, who, url, lic]) => `<tr>
          <td style="width:28%"><b>${esc(what)}</b></td>
          <td>${url ? `<a href="#" data-url="${esc(url)}">${esc(who)}</a>` : esc(who)}</td>
          <td class="small muted" style="width:38%">${esc(lic)}</td></tr>`).join("")}</table></div>`).join("")}`;
    root.onclick = (e) => {
      const a = e.target.closest("[data-url]");
      if (!a) return;
      e.preventDefault();
      if (Store.bridge && !Store.remote) pywebview.api.open_url(a.dataset.url);
      else window.open(a.dataset.url, "_blank", "noopener");
    };
  },
};
