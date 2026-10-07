// 专业知识 · 计算机（二）：网络、安全与人工智能（原创文章）
(window.READING_EXTRA = window.READING_EXTRA || []).push(
  {
    id: "p_dns", category: "pro", title: "DNS: The Internet's Phone Book", level: "中级", topic: "计算机 · 网络", imgQuery: "network cables server rack",
    paragraphs: [
      ["Computers on the internet find each other using IP addresses, numbers such as 142.250.72.14. But people prefer names like www.example.com. The Domain Name System, or DNS, translates names into IP addresses, like a phone book.",
        "互联网上的计算机靠 IP 地址互相找到对方，比如 142.250.72.14 这样的数字。但人们更喜欢 www.example.com 这样的名字。域名系统（DNS）就像电话簿一样，把名字翻译成 IP 地址。"],
      ["When you type a web address, your computer asks a DNS server, \"What is the address of this name?\" If that server doesn't know, it asks others in a chain: first a root server, then a server for \".com\", and finally the server for the specific domain.",
        "你输入网址时，电脑会问 DNS 服务器：「这个名字的地址是多少？」如果那台服务器不知道，就沿着一条链去问别的服务器：先问根服务器，再问负责「.com」的服务器，最后问这个具体域名的服务器。"],
      ["The answer is saved, or cached, for a while so the next lookup is instant. This all usually happens in a few milliseconds. When DNS fails, websites seem to disappear even though they are still running, which is why a DNS problem can make \"the internet go down\".",
        "答案会被保存（缓存）一段时间，下次查询就能瞬间完成。整个过程通常只需几毫秒。DNS 出故障时，网站看起来就像消失了，尽管它们其实还在运行，所以 DNS 问题会让人觉得「网断了」。"],
    ],
    questions: [
      { q: "What does DNS do?", o: ["Stores web pages.", "Translates names into IP addresses.", "Blocks viruses.", "Speeds up computers."], a: 1, e: "第一段。" },
      { q: "Which server is asked first in the chain?", o: ["The root server.", "The .com server.", "Your friend's computer.", "The website itself."], a: 0, e: "第二段。" },
      { q: "Why can a DNS failure seem like the internet is down?", o: ["Cables are cut.", "Names can't be translated to addresses.", "Computers turn off.", "Websites are deleted."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_https", category: "pro", title: "HTTPS and Public-Key Encryption", level: "高级", topic: "计算机 · 安全", imgQuery: "padlock",
    paragraphs: [
      ["The small padlock in your browser's address bar means the website uses HTTPS. Data between you and the site is encrypted, so anyone listening in on the network, for example on public Wi-Fi, sees only scrambled nonsense.",
        "浏览器地址栏里的小锁头表示网站使用了 HTTPS。你和网站之间的数据是加密的，所以在网络上偷听的人——比如在公共 Wi-Fi 上——只能看到一堆乱码。"],
      ["But how can two strangers agree on a secret key without anyone overhearing? The answer is public-key cryptography. Each website has two keys: a public key that anyone can use to lock a message, and a private key, kept secret, that is the only way to unlock it.",
        "但两个陌生人怎么才能在不被偷听的情况下商定一把秘密钥匙呢？答案是公钥密码学。每个网站有两把钥匙：一把任何人都能用来「上锁」的公钥，以及一把保密的私钥，只有它能「开锁」。"],
      ["It is like a mailbox with a slot: anyone can drop a letter in, but only the owner has the key to open it. Your browser uses the site's public key to set up a shared secret, and then both sides switch to faster normal encryption. Certificates from trusted authorities prove the website is really who it says it is.",
        "这就像带投信口的信箱：谁都能把信投进去，但只有主人有钥匙打开。浏览器用网站的公钥建立一个共享密钥，然后双方切换到更快的普通加密方式。由可信机构颁发的证书则证明这个网站确实是它声称的那个网站。"],
    ],
    questions: [
      { q: "What does the padlock mean?", o: ["The site is free.", "The site uses HTTPS encryption.", "The site is closed.", "The site is slow."], a: 1, e: "第一段。" },
      { q: "Which key is kept secret?", o: ["The public key.", "The private key.", "Both.", "Neither."], a: 1, e: "第二段。" },
      { q: "What do certificates prove?", o: ["The site is fast.", "The website is really who it says it is.", "The user is an adult.", "The password is strong."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_hashing", category: "pro", title: "How Websites Store Your Password", level: "高级", topic: "计算机 · 安全", imgQuery: "password login screen",
    paragraphs: [
      ["A well-built website never stores your actual password. Instead, it stores a hash: the result of a one-way mathematical function that turns any text into a fixed-length string of characters. It is easy to calculate the hash from a password, but practically impossible to reverse it.",
        "一个设计良好的网站从不存储你真正的密码，而是存储一个「哈希值」：这是一种单向数学函数的结果，能把任何文本变成固定长度的字符串。从密码算出哈希值很容易，但反过来几乎不可能。"],
      ["When you log in, the site hashes what you typed and compares it with the stored hash. If they match, you are in. Even if hackers steal the database, they only get hashes, not passwords.",
        "你登录时，网站把你输入的内容算出哈希值，与存储的哈希值比较，一致就能登录。即使黑客偷走了数据库，拿到的也只是哈希值，而不是密码。"],
      ["Hackers can still guess common passwords like \"123456\" and check whether the hashes match, so sites add a random value called a salt to each password before hashing. For users, the best protection is a long, unique password for every site, a password manager, and two-factor authentication.",
        "黑客仍然可以猜「123456」这样的常见密码，再比对哈希值是否一致。所以网站会在哈希之前给每个密码加上一个叫「盐」的随机值。对用户来说，最好的保护是：每个网站用不同的长密码、使用密码管理器，并开启双重验证。"],
    ],
    questions: [
      { q: "What do good websites store?", o: ["Your password.", "A hash of your password.", "Your email only.", "Nothing."], a: 1, e: "第一段。" },
      { q: "What is a salt?", o: ["A random value added before hashing.", "A type of virus.", "A short password.", "A login page."], a: 0, e: "第三段。" },
      { q: "Which is NOT recommended for users?", o: ["Long passwords.", "A password manager.", "Using the same password everywhere.", "Two-factor authentication."], a: 2, e: "第三段。" },
    ],
  },
  {
    id: "p_malware", category: "pro", title: "Viruses, Worms and Ransomware", level: "中级", topic: "计算机 · 安全", imgQuery: "computer virus malware warning",
    paragraphs: [
      ["Malware means \"malicious software\": programs designed to cause harm. A virus attaches itself to other files and spreads when those files are shared. A worm can copy itself across networks without any help from people.",
        "恶意软件（malware）指「恶意的软件」，即为造成危害而设计的程序。病毒会附着在其他文件上，在文件被分享时传播；蠕虫则无需人的帮助就能在网络中自我复制。"],
      ["Ransomware is especially damaging. It locks a victim's files with encryption and demands payment, often in cryptocurrency, to unlock them. In 2017, the WannaCry ransomware infected over 200,000 computers in about 150 countries in a single weekend, including hospital systems.",
        "勒索软件危害尤其大。它用加密锁住受害者的文件，要求支付赎金（常常是加密货币）才解锁。2017 年，WannaCry 勒索软件在一个周末内感染了约 150 个国家的二十多万台电脑，其中包括医院系统。"],
      ["Most malware enters through a human mistake: opening a strange attachment, clicking a fake link or installing pirated software. Keeping systems updated, using antivirus software and making regular backups are the best defenses. With a backup, ransomware loses most of its power.",
        "大多数恶意软件是因人的失误进入的：打开奇怪的附件、点击虚假链接或安装盗版软件。及时更新系统、使用杀毒软件和定期备份是最好的防御。有了备份，勒索软件就失去了大部分威力。"],
    ],
    questions: [
      { q: "How is a worm different from a virus?", o: ["It spreads without help from people.", "It is harmless.", "It only affects phones.", "It is a type of hardware."], a: 0, e: "第一段。" },
      { q: "What does ransomware do?", o: ["Deletes the internet.", "Locks files and demands payment.", "Makes the computer faster.", "Sends free gifts."], a: 1, e: "第二段。" },
      { q: "Why do backups help against ransomware?", o: ["You can restore your files.", "They are encrypted.", "They block the internet.", "They delete malware."], a: 0, e: "第三段。" },
    ],
  },
  {
    id: "p_cloud", category: "pro", title: "What Is Cloud Computing?", level: "中级", topic: "计算机 · 网络", imgQuery: "data center servers",
    paragraphs: [
      ["\"The cloud\" sounds like something floating in the sky, but it is really someone else's computers. Cloud computing means renting computing power, storage and software over the internet instead of owning and running your own machines.",
        "「云」听起来像飘在天上的东西，但其实就是别人的计算机。云计算是指通过互联网租用计算能力、存储和软件，而不是自己拥有和运行机器。"],
      ["These computers sit in huge buildings called data centers, filled with thousands of servers, cooling systems and backup power. Companies such as Amazon, Microsoft, Google, Alibaba and Tencent run data centers all around the world.",
        "这些计算机放在叫「数据中心」的巨大建筑里，里面有成千上万台服务器、冷却系统和备用电源。亚马逊、微软、谷歌、阿里巴巴和腾讯等公司在世界各地运营数据中心。"],
      ["The main advantage is flexibility. A small start-up can use as much computing power as a big company, paying only for what it uses. When a shopping site gets huge traffic on a holiday, it can add servers in minutes and remove them afterwards.",
        "云计算的主要优势是灵活。一家小创业公司也能用上和大公司一样多的计算能力，并且只为实际用量付费。购物网站在节日迎来巨大流量时，可以在几分钟内增加服务器，之后再撤掉。"],
    ],
    questions: [
      { q: "What is \"the cloud\" really?", o: ["Water vapor.", "Someone else's computers.", "A new type of chip.", "A website."], a: 1, e: "第一段。" },
      { q: "Where do cloud servers sit?", o: ["In data centers.", "In satellites.", "In phones.", "In the sky."], a: 0, e: "第二段。" },
      { q: "What is the main advantage of the cloud?", o: ["It is always free.", "Flexibility: pay for what you use.", "It never breaks.", "It works without internet."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_gpu", category: "pro", title: "GPUs: From Games to AI", level: "高级", topic: "计算机 · 硬件", imgQuery: "graphics card GPU",
    paragraphs: [
      ["A GPU, or graphics processing unit, was originally designed to draw images for video games. A screen has millions of pixels, and each one needs to be calculated many times per second. These calculations are simple but extremely numerous.",
        "GPU（图形处理器）最初是为电子游戏绘制画面而设计的。屏幕上有数百万个像素，每个像素每秒都要计算很多次。这些计算很简单，但数量极其庞大。"],
      ["So instead of a few powerful cores like a CPU, a GPU has thousands of smaller cores that work in parallel, all doing similar calculations at the same time. A CPU is like a few brilliant professors; a GPU is like thousands of students each solving a simple sum.",
        "所以 GPU 不像 CPU 那样只有几个强大的核心，而是有成千上万个小核心并行工作，同时做类似的计算。CPU 像几位才华横溢的教授，GPU 则像几千名各自做一道简单算术的学生。"],
      ["In the 2010s, researchers discovered that training neural networks also requires huge numbers of simple calculations, mostly multiplying large tables of numbers called matrices. GPUs turned out to be perfect for this, and they became the engine of the modern AI boom.",
        "二十一世纪一十年代，研究人员发现训练神经网络也需要海量的简单计算，主要是对叫「矩阵」的大型数表做乘法。事实证明 GPU 非常适合这项工作，于是成了当代人工智能热潮的引擎。"],
    ],
    questions: [
      { q: "What were GPUs first designed for?", o: ["AI.", "Video game graphics.", "Banking.", "Email."], a: 1, e: "第一段。" },
      { q: "How is a GPU different from a CPU?", o: ["It has thousands of smaller cores working in parallel.", "It has only one core.", "It stores files.", "It is always slower."], a: 0, e: "第二段。" },
      { q: "Why are GPUs good for AI?", o: ["AI needs huge numbers of simple calculations.", "AI needs graphics.", "GPUs are cheap.", "AI only runs on games."], a: 0, e: "第三段。" },
    ],
  },
  {
    id: "p_neuralnet", category: "pro", title: "How Neural Networks Learn", level: "高级", topic: "计算机 · 人工智能", imgQuery: "artificial neural network diagram",
    paragraphs: [
      ["An artificial neural network is a computer model loosely inspired by the brain. It is made of layers of simple units called neurons. Each neuron receives numbers, multiplies them by weights, adds them up and passes the result to the next layer.",
        "人工神经网络是一种大致受大脑启发的计算机模型，由多层叫「神经元」的简单单元组成。每个神经元接收一些数字，乘以「权重」后相加，再把结果传给下一层。"],
      ["At first, the weights are random, so the network's answers are nonsense. During training, it is shown many examples, such as thousands of pictures labeled \"cat\" or \"dog\". Each time it makes a mistake, an algorithm called backpropagation adjusts the weights slightly to reduce the error.",
        "一开始权重是随机的，网络给出的答案毫无意义。训练时，给它看大量例子，比如几千张标着「猫」或「狗」的图片。每次它犯错，一种叫「反向传播」的算法就把权重稍微调整一下，以减小误差。"],
      ["After millions of small adjustments, the network learns patterns that no programmer wrote by hand: edges, then shapes, then whole objects. Networks with many layers are called deep neural networks, which is where the term \"deep learning\" comes from.",
        "经过数百万次微调，网络学会了没有任何程序员手写过的规律：先是边缘，再是形状，最后是整个物体。层数很多的网络叫「深度神经网络」，「深度学习」这个词就由此而来。"],
    ],
    questions: [
      { q: "What does each neuron do?", o: ["Stores a photo.", "Multiplies inputs by weights and adds them.", "Connects to the internet.", "Writes code."], a: 1, e: "第一段。" },
      { q: "What does backpropagation do?", o: ["Adjusts weights to reduce errors.", "Deletes wrong answers.", "Labels pictures.", "Adds new layers."], a: 0, e: "第二段。" },
      { q: "Where does the term \"deep learning\" come from?", o: ["Deep oceans.", "Networks with many layers.", "Learning for a long time.", "Difficult math."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_llm", category: "pro", title: "How Large Language Models Work", level: "高级", topic: "计算机 · 人工智能", imgQuery: "chatbot AI conversation",
    paragraphs: [
      ["Chatbots like ChatGPT, Claude and DeepSeek are built on large language models (LLMs). At their core, they do something surprisingly simple: given some text, they predict what piece of text, called a token, is likely to come next.",
        "ChatGPT、Claude、DeepSeek 等聊天机器人都建立在大语言模型（LLM）之上。说到底，它们做的事出奇地简单：给定一段文字，预测接下来最可能出现哪一小段文字（叫一个「词元」）。"],
      ["To learn this, the model is trained on enormous amounts of text from books, websites and code. It is based on an architecture called the Transformer, introduced by Google researchers in 2017, which uses \"attention\" to work out which earlier words matter most for predicting the next one.",
        "为了学会这一点，模型要用海量的书籍、网页和代码文本进行训练。它基于一种叫 Transformer 的架构，由谷歌研究人员于 2017 年提出，利用「注意力机制」判断前面哪些词对预测下一个词最重要。"],
      ["After this first training, models are further trained with human feedback to be helpful and safe. LLMs can write, translate and explain, but they can also make confident mistakes, sometimes called hallucinations, so important facts should always be checked.",
        "完成这一阶段的训练后，模型还会借助人类反馈进一步训练，变得有用且安全。大语言模型能写作、翻译和解释，但也可能信心满满地犯错，这有时被称为「幻觉」，所以重要的事实一定要核实。"],
    ],
    questions: [
      { q: "What does an LLM basically predict?", o: ["The weather.", "The next token of text.", "Stock prices.", "Your password."], a: 1, e: "第一段。" },
      { q: "What architecture are LLMs based on?", o: ["The Transformer.", "The CPU.", "Binary search.", "Bubble sort."], a: 0, e: "第二段。" },
      { q: "What are hallucinations?", o: ["Pictures made by AI.", "Confident mistakes.", "Dreams of computers.", "Viruses."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_moore", category: "pro", title: "Moore's Law", level: "中级", topic: "计算机 · 硬件", imgQuery: "silicon wafer microchips",
    paragraphs: [
      ["In 1965, Gordon Moore, who later co-founded Intel, noticed that the number of transistors on a computer chip was doubling about every year. In 1975 he revised this to every two years. This prediction became known as Moore's Law.",
        "1965 年，后来与人共同创立英特尔的戈登·摩尔注意到，计算机芯片上的晶体管数量大约每年翻一番。1975 年他把这个说法修正为每两年翻一番。这一预测被称为「摩尔定律」。"],
      ["For about fifty years, the industry kept up with it. The first Intel microprocessor in 1971 had about 2,300 transistors; some chips today have tens of billions. That is why a modern phone is far more powerful than the computers that guided Apollo astronauts to the moon.",
        "大约五十年里，整个行业一直跟上了这个节奏。1971 年英特尔的第一款微处理器约有 2300 个晶体管，如今一些芯片有几百亿个。所以今天的一部手机，远比当年引导阿波罗宇航员登月的计算机强大。"],
      ["Moore's Law is not a law of nature, and it is slowing down. Transistors are now only a few dozen atoms wide, and making them smaller is very hard and expensive. Engineers are looking for new ways forward, such as stacking chips in 3D and designing special chips for AI.",
        "摩尔定律并不是自然规律，而且正在放缓。如今晶体管只有几十个原子宽，再做小非常困难且昂贵。工程师们正在寻找新出路，比如把芯片三维堆叠，以及设计专用的 AI 芯片。"],
    ],
    questions: [
      { q: "What does Moore's Law describe?", o: ["Computer prices.", "Transistors on a chip doubling regularly.", "Internet speed.", "Battery life."], a: 1, e: "第一段。" },
      { q: "How many transistors did the first Intel microprocessor have?", o: ["About 23.", "About 2,300.", "About 2.3 million.", "Tens of billions."], a: 1, e: "第二段。" },
      { q: "Why is Moore's Law slowing down?", o: ["People don't need faster chips.", "Transistors are already tiny and hard to shrink.", "It was banned.", "Intel stopped making chips."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_turing", category: "pro", title: "Alan Turing and the Turing Test", level: "高级", topic: "计算机 · 人工智能", imgQuery: "Alan Turing statue Bletchley Park",
    paragraphs: [
      ["Alan Turing, a British mathematician, is often called the father of computer science. In 1936, before modern computers existed, he described a simple imaginary machine, now called a Turing machine, that could perform any calculation that can be written as a step-by-step procedure.",
        "英国数学家艾伦·图灵常被称为计算机科学之父。1936 年，在现代计算机诞生之前，他就描述了一种简单的假想机器——如今叫「图灵机」——它能完成任何可以写成分步过程的计算。"],
      ["During World War II, Turing worked at Bletchley Park, where he helped break the German Enigma code. Historians believe this work shortened the war and saved many lives.",
        "二战期间，图灵在布莱切利园工作，帮助破解了德国的恩尼格玛密码。历史学家认为，这项工作缩短了战争，挽救了许多生命。"],
      ["In 1950, he asked, \"Can machines think?\" He suggested a test: if a person chatting by text cannot tell whether they are talking to a human or a machine, the machine could be said to show intelligence. Today the highest prize in computer science, the Turing Award, is named after him.",
        "1950 年，他提出了「机器能思考吗？」这个问题，并设计了一个测试：如果一个人通过文字聊天，分辨不出对方是人还是机器，那这台机器就可以说表现出了智能。如今计算机科学的最高奖项「图灵奖」就以他的名字命名。"],
    ],
    questions: [
      { q: "What did Turing describe in 1936?", o: ["The internet.", "An imaginary calculating machine.", "The first phone.", "A robot."], a: 1, e: "第一段。" },
      { q: "What did Turing help do in World War II?", o: ["Build planes.", "Break the Enigma code.", "Invent radar.", "Design tanks."], a: 1, e: "第二段。" },
      { q: "What does the Turing test check?", o: ["Whether a machine can calculate fast.", "Whether a person can tell a machine from a human in chat.", "Whether a computer has a virus.", "Whether a robot can walk."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_quantum", category: "pro", title: "Quantum Computers", level: "高级", topic: "计算机 · 硬件", imgQuery: "IBM quantum computer",
    paragraphs: [
      ["A normal computer's bit is either 0 or 1. A quantum computer uses qubits, which, thanks to the strange rules of quantum physics, can be in a combination of 0 and 1 at the same time. This is called superposition.",
        "普通计算机的比特要么是 0，要么是 1。量子计算机使用量子比特，由于量子物理的奇特规律，它可以同时处于 0 和 1 的叠加状态，这叫「叠加态」。"],
      ["Qubits can also be entangled, so that the state of one is linked to another. By using superposition and entanglement cleverly, quantum computers could solve certain problems, such as simulating molecules or breaking some kinds of encryption, far faster than any normal computer.",
        "量子比特还可以「纠缠」，一个量子比特的状态与另一个相关联。巧妙利用叠加和纠缠，量子计算机在某些问题上——比如模拟分子、破解某些加密——可能比任何普通计算机都快得多。"],
      ["But building them is extremely hard. Qubits are fragile: heat and vibration easily destroy their quantum state, so many machines must be cooled to almost absolute zero, colder than outer space. Quantum computers will not replace laptops, but they may become powerful tools for science.",
        "但制造量子计算机极其困难。量子比特非常脆弱：热量和振动很容易破坏它们的量子态，所以很多机器必须冷却到接近绝对零度，比外太空还冷。量子计算机不会取代笔记本电脑，但可能成为强大的科研工具。"],
    ],
    questions: [
      { q: "What is superposition?", o: ["Being 0 and 1 at the same time.", "Being very fast.", "Being very small.", "Being connected to the internet."], a: 0, e: "第一段。" },
      { q: "Which task might quantum computers be good at?", o: ["Typing documents.", "Simulating molecules.", "Playing music.", "Browsing websites."], a: 1, e: "第二段。" },
      { q: "Why are many quantum computers cooled to near absolute zero?", o: ["To save energy.", "Qubits are fragile.", "To look impressive.", "To store more data."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_pagerank", category: "pro", title: "How Search Engines Rank Pages", level: "高级", topic: "计算机 · 网络", imgQuery: "search engine results screen",
    paragraphs: [
      ["Search engines send out programs called crawlers that visit billions of web pages, follow links and copy what they find. The text is stored in a giant index, which maps every word to the pages that contain it.",
        "搜索引擎会派出叫「爬虫」的程序，访问数十亿个网页，顺着链接爬行，并把找到的内容复制下来。这些文本存入一个巨大的索引，把每个词对应到包含它的网页。"],
      ["Finding pages that contain your words is the easy part. The hard part is deciding which ones are best. In 1998, Google's founders Larry Page and Sergey Brin introduced PageRank. Its idea: a page is important if many important pages link to it, like a scientific paper that is cited by many other good papers.",
        "找到包含你搜索词的网页是容易的部分，难的是决定哪些最好。1998 年，谷歌创始人拉里·佩奇和谢尔盖·布林提出了 PageRank 算法。它的思路是：如果许多重要网页链接到某个网页，那这个网页就重要——就像一篇被很多优秀论文引用的科学论文。"],
      ["Today's search engines use hundreds of signals, including how fresh a page is, whether it works well on phones, and AI models that understand the meaning of a question, not just its keywords.",
        "如今的搜索引擎会使用数百种信号，包括网页是否新鲜、在手机上显示效果好不好，以及能理解问题含义而不仅仅是关键词的 AI 模型。"],
    ],
    questions: [
      { q: "What do crawlers do?", o: ["Delete pages.", "Visit pages and follow links.", "Write articles.", "Block ads."], a: 1, e: "第一段。" },
      { q: "What is the main idea of PageRank?", o: ["Pages with more words are better.", "Pages linked by important pages are important.", "New pages are best.", "Short pages rank higher."], a: 1, e: "第二段。" },
      { q: "What can modern AI models understand?", o: ["Only keywords.", "The meaning of a question.", "Only images.", "Only English."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_compression", category: "pro", title: "How Data Compression Works", level: "高级", topic: "计算机 · 数据", imgQuery: "zip file archive compression",
    paragraphs: [
      ["Data compression makes files smaller so they take less space and travel faster. It works by finding patterns and repetition. For example, instead of storing \"AAAAAAAAAA\", you could store \"10×A\". This simple idea is called run-length encoding.",
        "数据压缩让文件变小，占用更少空间、传输更快。它的原理是寻找规律和重复。比如，与其存「AAAAAAAAAA」，不如存「10×A」。这个简单的想法叫「行程长度编码」。"],
      ["There are two kinds of compression. Lossless compression, used in ZIP files, keeps every bit of the original, so the file can be restored perfectly. This is essential for documents and programs, where one wrong letter could break everything.",
        "压缩分两种。无损压缩（ZIP 文件就用它）保留原始数据的每一个比特，文件可以完美还原。这对文档和程序至关重要，因为错一个字母就可能出大问题。"],
      ["Lossy compression, used in JPEG photos and MP3 music, throws away details that people are unlikely to notice, such as tiny color differences or very quiet sounds. It can make files ten times smaller, but the lost information can never be recovered.",
        "有损压缩（JPEG 照片和 MP3 音乐都用它）会丢掉人们不太可能察觉的细节，比如细微的颜色差别或很轻的声音。它能把文件缩小到十分之一，但丢掉的信息再也找不回来了。"],
    ],
    questions: [
      { q: "How does compression work?", o: ["By deleting files.", "By finding patterns and repetition.", "By adding color.", "By slowing the internet."], a: 1, e: "第一段。" },
      { q: "Which type keeps every bit of the original?", o: ["Lossy.", "Lossless.", "JPEG.", "MP3."], a: 1, e: "第二段。" },
      { q: "Which is an example of lossy compression?", o: ["ZIP.", "JPEG.", "A text document.", "A program."], a: 1, e: "第三段。" },
    ],
  },
);
