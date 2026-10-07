// 专业知识 · 计算机（一）：计算机基础（原创文章）
(window.READING_EXTRA = window.READING_EXTRA || []).push(
  {
    id: "p_binary", category: "pro", title: "Binary: The Language of Computers", level: "中级", topic: "计算机 · 基础", imgQuery: "binary code",
    paragraphs: [
      ["Computers store everything as binary, a number system with only two digits: 0 and 1. Each 0 or 1 is called a bit. This is because computer chips are made of billions of tiny switches called transistors, which can only be off (0) or on (1).",
        "计算机用二进制存储一切信息，二进制只有两个数字：0 和 1。每个 0 或 1 叫一个「比特（bit）」。这是因为计算机芯片由数十亿个叫晶体管的小开关组成，它们只有关（0）和开（1）两种状态。"],
      ["In our normal decimal system, each place is worth ten times more than the one to its right: ones, tens, hundreds. In binary, each place is worth twice as much: 1, 2, 4, 8, 16 and so on. So the binary number 1011 means 8 + 0 + 2 + 1 = 11.",
        "在我们常用的十进制中，每一位的值是右边一位的十倍：个、十、百。在二进制中，每一位的值是右边一位的两倍：1、2、4、8、16……所以二进制数 1011 表示 8 + 0 + 2 + 1 = 11。"],
      ["Eight bits make one byte, which can store 256 different values, enough for one English letter. Text, photos, music and videos are all just very long patterns of 0s and 1s, interpreted by software in different ways.",
        "8 个比特组成 1 个字节（byte），可以表示 256 种不同的值，足够存一个英文字母。文字、照片、音乐和视频，说到底都是一长串 0 和 1，由软件以不同方式解读。"],
    ],
    questions: [
      { q: "Why do computers use binary?", o: ["It is faster to write.", "Transistors can only be on or off.", "It was invented in China.", "It uses less paper."], a: 1, e: "第一段。" },
      { q: "What is binary 1011 in decimal?", o: ["4.", "10.", "11.", "1,011."], a: 2, e: "第二段：8 + 0 + 2 + 1。" },
      { q: "How many bits are in a byte?", o: ["2.", "8.", "10.", "256."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_cpu", category: "pro", title: "How a CPU Works", level: "高级", topic: "计算机 · 基础", imgQuery: "CPU processor chip",
    paragraphs: [
      ["The CPU (central processing unit) is the \"brain\" of a computer. It follows instructions from programs, one tiny step at a time, in a cycle called fetch, decode, execute: it fetches an instruction from memory, works out what it means, and carries it out.",
        "CPU（中央处理器）是计算机的「大脑」。它按照程序的指令，一小步一小步地执行，这个循环叫「取指、译码、执行」：从内存中取出一条指令，弄清它的含义，然后执行它。"],
      ["The instructions are very simple: add two numbers, compare them, move data, or jump to another instruction. But a modern CPU can perform billions of these steps every second. Its speed is measured in gigahertz; 3 GHz means about three billion cycles per second.",
        "这些指令非常简单：两个数相加、比较大小、移动数据，或跳转到另一条指令。但现代 CPU 每秒能执行数十亿步。它的速度用吉赫（GHz）衡量，3 GHz 意味着每秒约 30 亿个时钟周期。"],
      ["Modern CPUs have several cores, which are like separate processors on one chip, so they can do many tasks at once. They also have a small, very fast memory called cache, which keeps frequently used data close by so the CPU doesn't have to wait.",
        "现代 CPU 有多个核心，相当于一块芯片上的多个独立处理器，所以能同时处理多项任务。它们还有一种又小又快的存储器叫「缓存」，把常用数据放在手边，免得 CPU 等待。"],
    ],
    questions: [
      { q: "What is the CPU's basic cycle?", o: ["Read, write, delete.", "Fetch, decode, execute.", "Start, stop, restart.", "Input, output, save."], a: 1, e: "第一段。" },
      { q: "What does 3 GHz mean?", o: ["3 cores.", "About three billion cycles per second.", "3 gigabytes of memory.", "3 programs at once."], a: 1, e: "第二段。" },
      { q: "What is cache for?", o: ["Storing files permanently.", "Keeping frequently used data close by.", "Cooling the CPU.", "Connecting to the internet."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_ramstorage", category: "pro", title: "Memory vs. Storage", level: "中级", topic: "计算机 · 基础", imgQuery: "RAM memory module",
    paragraphs: [
      ["People often confuse memory and storage. Memory, or RAM (random-access memory), is the computer's short-term workspace. It holds the programs and data you are using right now, and it is very fast. But it is volatile: everything in it disappears when the power is turned off.",
        "人们常把内存和存储混淆。内存（RAM，随机存取存储器）是计算机的短期工作台，存放你正在使用的程序和数据，速度非常快。但它是易失性的：一断电，里面的东西就全没了。"],
      ["Storage, such as a hard disk drive (HDD) or solid-state drive (SSD), is long-term. It keeps your files, photos and installed programs even when the computer is off. It is much bigger and cheaper than RAM, but slower.",
        "存储，比如机械硬盘（HDD）或固态硬盘（SSD），是长期的。即使关机，它也能保存你的文件、照片和已安装的程序。它的容量比内存大得多、也便宜得多，但速度更慢。"],
      ["A useful comparison is a desk and a filing cabinet. RAM is your desk: small, but everything on it is within easy reach. Storage is the cabinet: it holds much more, but it takes time to fetch things. If your desk is too small, you waste time going back and forth, which is why low RAM makes a computer slow.",
        "一个贴切的比喻是书桌和文件柜。内存是书桌：不大，但上面的东西触手可及；存储是文件柜：能装得多，但取东西要花时间。书桌太小，你就得来回跑，浪费时间——这就是内存不足会让电脑变慢的原因。"],
    ],
    questions: [
      { q: "What happens to RAM when the power is off?", o: ["It keeps everything.", "Everything disappears.", "It becomes storage.", "It gets faster."], a: 1, e: "第一段。" },
      { q: "Which is an example of storage?", o: ["RAM.", "An SSD.", "A CPU.", "Cache."], a: 1, e: "第二段。" },
      { q: "In the comparison, RAM is like…", o: ["a filing cabinet.", "a desk.", "a library.", "a bin."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_os", category: "pro", title: "What Does an Operating System Do?", level: "中级", topic: "计算机 · 基础", imgQuery: "Linux desktop terminal",
    paragraphs: [
      ["An operating system (OS), such as Windows, macOS, Linux, Android or iOS, is the main software that manages a computer. Without it, every program would have to control the hardware by itself.",
        "操作系统（OS），比如 Windows、macOS、Linux、Android 或 iOS，是管理计算机的核心软件。没有它，每个程序都得自己去控制硬件。"],
      ["The OS shares the CPU between programs, switching between them so quickly that they seem to run at the same time. It gives each program its own memory, controls files on the disk, and talks to devices like keyboards, screens and printers through small programs called drivers.",
        "操作系统在各个程序之间分配 CPU，切换得非常快，看起来好像它们在同时运行。它给每个程序分配独立的内存，管理磁盘上的文件，并通过叫「驱动程序」的小程序与键盘、屏幕、打印机等设备通信。"],
      ["The OS also protects the system. It stops one program from reading another program's memory and asks for permission before apps use your camera or location. The core part of an OS is called the kernel.",
        "操作系统还负责保护系统：它阻止一个程序读取另一个程序的内存，并在应用使用摄像头或定位之前征求你的许可。操作系统最核心的部分叫「内核」。"],
    ],
    questions: [
      { q: "Which is an operating system?", o: ["Word.", "Android.", "Chrome.", "Photoshop."], a: 1, e: "第一段。" },
      { q: "What are drivers?", o: ["People who fix computers.", "Small programs that talk to devices.", "Types of CPU.", "Files on the disk."], a: 1, e: "第二段。" },
      { q: "What is the core part of an OS called?", o: ["The shell.", "The kernel.", "The cache.", "The driver."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_algorithm", category: "pro", title: "What Is an Algorithm?", level: "初级", topic: "计算机 · 算法", imgQuery: "flowchart algorithm diagram",
    paragraphs: [
      ["An algorithm is a set of clear, step-by-step instructions for solving a problem. A cooking recipe is a kind of algorithm: it tells you exactly what to do, in what order, to get the result you want.",
        "算法是一组清晰的、按步骤解决问题的指令。菜谱就是一种算法：它准确地告诉你按什么顺序做什么，才能得到想要的结果。"],
      ["Computers need algorithms for everything: finding the shortest route on a map, sorting a list of names, recommending videos, or recognizing your face. A good algorithm must be correct, and it should also be efficient, using as little time and memory as possible.",
        "计算机做任何事都需要算法：在地图上找最短路线、给名单排序、推荐视频、识别人脸。好的算法必须正确，还应该高效，尽可能少用时间和内存。"],
      ["Consider finding a word in a dictionary. You could check every page from the beginning, but that is slow. A better algorithm is to open the book in the middle, see whether the word comes before or after, and repeat with the correct half. This is called binary search, and it can find a word among a million in about 20 steps.",
        "想想在词典里查一个词。你可以从第一页一页页翻，但太慢了。更好的算法是从中间翻开，看这个词在前半还是后半，再在对应的那一半里重复这个过程。这叫「二分查找」，在一百万个词中找一个，大约只需 20 步。"],
    ],
    questions: [
      { q: "What everyday thing is like an algorithm?", o: ["A recipe.", "A photo.", "A song.", "A map."], a: 0, e: "第一段。" },
      { q: "Besides being correct, a good algorithm should be…", o: ["long.", "efficient.", "secret.", "colorful."], a: 1, e: "第二段。" },
      { q: "About how many steps does binary search need for a million words?", o: ["About 20.", "About 1,000.", "About 500,000.", "A million."], a: 0, e: "第三段。" },
    ],
  },
  {
    id: "p_bigO", category: "pro", title: "Sorting and Big O", level: "高级", topic: "计算机 · 算法", imgQuery: "sorting algorithm visualization bars",
    paragraphs: [
      ["Sorting means putting things in order, like numbers from smallest to largest. One simple method, bubble sort, repeatedly compares neighboring items and swaps them if they are in the wrong order. It is easy to understand but slow for large lists.",
        "排序就是把东西按顺序排好，比如把数字从小到大排列。一种简单的方法叫冒泡排序：反复比较相邻的元素，顺序不对就交换。它很好理解，但处理大列表时很慢。"],
      ["Computer scientists describe speed using Big O notation, which shows how the work grows as the input grows. Bubble sort is O(n²): if the list becomes 10 times longer, the work becomes about 100 times larger. Faster methods such as merge sort and quicksort are O(n log n).",
        "计算机科学家用「大 O 表示法」描述速度，表示输入规模增大时工作量如何增长。冒泡排序是 O(n²)：列表长 10 倍，工作量大约增加 100 倍。归并排序、快速排序等更快的方法是 O(n log n)。"],
      ["For a million items, the difference is enormous: about a trillion steps compared with about 20 million. Choosing the right algorithm often matters far more than buying a faster computer.",
        "对一百万个元素来说，差距巨大：约一万亿步对约两千万步。选对算法往往比买一台更快的电脑重要得多。"],
    ],
    questions: [
      { q: "How does bubble sort work?", o: ["It splits the list in half.", "It swaps neighboring items in the wrong order.", "It picks random items.", "It deletes duplicates."], a: 1, e: "第一段。" },
      { q: "If a list is 10 times longer, an O(n²) algorithm does about…", o: ["10 times more work.", "100 times more work.", "the same work.", "half the work."], a: 1, e: "第二段。" },
      { q: "What is the writer's main point?", o: ["Computers are too slow.", "Choosing the right algorithm matters a lot.", "Bubble sort is the best.", "Sorting is not important."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_compiler", category: "pro", title: "Programming Languages and Compilers", level: "中级", topic: "计算机 · 编程", imgQuery: "source code screen programming",
    paragraphs: [
      ["A CPU only understands machine code, long lists of binary instructions. Writing programs this way is extremely difficult, so programmers use programming languages such as Python, Java, C and JavaScript, which look closer to human language and math.",
        "CPU 只懂机器码，也就是一长串二进制指令。用这种方式写程序极其困难，所以程序员使用 Python、Java、C、JavaScript 等编程语言，它们更接近人类语言和数学。"],
      ["A compiler is a program that translates the whole program into machine code before it runs. An interpreter translates and runs the code line by line. Compiled programs usually run faster, while interpreted languages are often easier to test and change quickly.",
        "编译器是一种在程序运行之前把整个程序翻译成机器码的程序；解释器则一行一行地翻译并执行代码。编译型程序通常运行更快，解释型语言往往更便于快速测试和修改。"],
      ["Grace Hopper, an American computer scientist and navy officer, created one of the first compilers in the 1950s. Many people then believed computers could only understand numbers, but she proved that programs could be written in words, an idea that changed computing forever.",
        "美国计算机科学家、海军军官格蕾丝·霍珀在二十世纪五十年代编写了最早的编译器之一。当时很多人认为计算机只能理解数字，但她证明了可以用单词写程序，这个想法永远改变了计算机领域。"],
    ],
    questions: [
      { q: "What does a CPU understand directly?", o: ["Python.", "Machine code.", "English.", "JavaScript."], a: 1, e: "第一段。" },
      { q: "What is the difference between a compiler and an interpreter?", o: ["A compiler translates everything first; an interpreter goes line by line.", "They are the same.", "An interpreter is hardware.", "A compiler only works with Python."], a: 0, e: "第二段。" },
      { q: "What did Grace Hopper prove?", o: ["Computers can think.", "Programs could be written in words.", "Binary is useless.", "CPUs need no software."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_firstbug", category: "pro", title: "Bugs and Debugging", level: "中级", topic: "计算机 · 编程", imgQuery: "first computer bug moth 1947",
    paragraphs: [
      ["In programming, a bug is a mistake in the code that makes a program behave wrongly. The word has a famous story: in 1947, engineers working on the Harvard Mark II computer found a real moth stuck in a relay. They taped it into their logbook with the note \"First actual case of bug being found.\"",
        "在编程中，bug 指代码中导致程序出错的错误。这个词有个著名的故事：1947 年，研究哈佛 Mark II 计算机的工程师在一个继电器里发现了一只真的飞蛾。他们把它贴在工作日志里，注明「第一次真正发现了虫子」。"],
      ["Engineers had actually used \"bug\" for technical problems since Thomas Edison's time, but the moth made the story famous. The process of finding and fixing bugs is called debugging.",
        "其实早在爱迪生的年代，工程师就用 bug 表示技术故障了，但这只飞蛾让这个说法出了名。查找并修复错误的过程叫「调试（debugging）」。"],
      ["Bugs can be very costly. In 1996, the European rocket Ariane 5 exploded about 40 seconds after launch because a number became too large for the space the software had for it. Programmers now use testing, code reviews and tools to catch bugs early. One popular trick is \"rubber duck debugging\": explaining your code line by line to a toy duck often helps you spot the mistake.",
        "bug 的代价可能非常高。1996 年，欧洲的阿丽亚娜 5 号火箭在发射约 40 秒后爆炸，原因是一个数字太大，超出了软件为它预留的空间。如今程序员用测试、代码审查和各种工具尽早发现 bug。一个流行的小窍门叫「小黄鸭调试法」：对着玩具鸭子一行一行地解释代码，往往能帮你发现错误。"],
    ],
    questions: [
      { q: "What was found in the Harvard Mark II?", o: ["A mouse.", "A moth.", "A spider.", "A fly."], a: 1, e: "第一段。" },
      { q: "What caused the Ariane 5 explosion?", o: ["A storm.", "A number too large for the software.", "A moth.", "Bad fuel."], a: 1, e: "第三段。" },
      { q: "What is rubber duck debugging?", o: ["Testing in water.", "Explaining code line by line to a toy duck.", "Deleting all code.", "Asking a duck for answers."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_git", category: "pro", title: "Version Control and Git", level: "高级", topic: "计算机 · 编程", imgQuery: "git branches diagram",
    paragraphs: [
      ["Imagine writing an essay and saving files called \"final\", \"final2\" and \"final_really_final\". Version control systems solve this problem for programmers. They record every change to a project, who made it and why, so you can always go back to an earlier version.",
        "想象一下写论文时保存的文件叫「最终版」「最终版2」「真的最终版」。版本控制系统为程序员解决了这个问题：它记录项目的每一处修改、谁改的、为什么改，所以你随时可以回到之前的版本。"],
      ["The most popular system is Git, created in 2005 by Linus Torvalds, who also created Linux. In Git, each saved snapshot is called a commit. Programmers can create branches to try new ideas without breaking the main code, and later merge the branches back together.",
        "最流行的系统是 Git，由 Linux 的创造者林纳斯·托瓦兹在 2005 年开发。在 Git 中，每次保存的快照叫一个「提交（commit）」。程序员可以创建「分支」尝试新想法而不破坏主代码，之后再把分支「合并」回来。"],
      ["Git lets thousands of people work on the same project at the same time. Websites like GitHub and GitLab host millions of projects, making it easy to share code, review each other's changes and contribute to open-source software.",
        "Git 让成千上万的人能同时开发同一个项目。GitHub、GitLab 等网站托管着数百万个项目，让分享代码、互相审查修改、为开源软件做贡献变得很容易。"],
    ],
    questions: [
      { q: "What problem does version control solve?", o: ["Slow computers.", "Keeping track of changes and versions.", "Viruses.", "Typing errors only."], a: 1, e: "第一段。" },
      { q: "Who created Git?", o: ["Bill Gates.", "Linus Torvalds.", "Steve Jobs.", "Grace Hopper."], a: 1, e: "第二段。" },
      { q: "What is a branch for?", o: ["Deleting code.", "Trying new ideas without breaking the main code.", "Backing up photos.", "Running faster."], a: 1, e: "第二段。" },
    ],
  },
  {
    id: "p_opensource", category: "pro", title: "Open Source Software", level: "中级", topic: "计算机 · 编程", imgQuery: "Tux Linux penguin",
    paragraphs: [
      ["Open-source software is software whose source code anyone can read, change and share. This is different from closed, or proprietary, software, where the code is kept secret by the company that owns it.",
        "开源软件是指任何人都可以阅读、修改和分享其源代码的软件。这与闭源（专有）软件不同，后者的代码由拥有它的公司保密。"],
      ["Much of the modern internet runs on open source. In 1991, a Finnish student named Linus Torvalds posted a message saying he was making a free operating system \"just a hobby\". That hobby became Linux, which now runs most of the world's servers, all of the top 500 supercomputers, and Android phones.",
        "现代互联网的很大一部分运行在开源软件上。1991 年，芬兰学生林纳斯·托瓦兹发帖说他在做一个免费的操作系统，「只是个爱好」。这个爱好后来成了 Linux，如今运行着世界上大多数服务器、全部前 500 名超级计算机，以及安卓手机。"],
      ["Open-source projects are built by volunteers and companies around the world. Because many people can examine the code, bugs are often found quickly. As one famous saying puts it, \"Given enough eyeballs, all bugs are shallow.\"",
        "开源项目由世界各地的志愿者和公司共同开发。因为很多人都能检查代码，bug 往往很快就会被发现。正如一句名言所说：「只要眼睛够多，所有 bug 都无处藏身。」"],
    ],
    questions: [
      { q: "What is special about open-source software?", o: ["It is always free of bugs.", "Anyone can read, change and share the code.", "Only companies can use it.", "It has no code."], a: 1, e: "第一段。" },
      { q: "What did Linus Torvalds call his project at first?", o: ["A business.", "Just a hobby.", "A revolution.", "A game."], a: 1, e: "第二段。" },
      { q: "Why are bugs often found quickly in open source?", o: ["Many people examine the code.", "It is written in English.", "It is short.", "Companies pay for it."], a: 0, e: "第三段。" },
    ],
  },
  {
    id: "p_unicode", category: "pro", title: "Unicode: Every Character in the World", level: "高级", topic: "计算机 · 基础", imgQuery: "Unicode characters emoji",
    paragraphs: [
      ["Computers store letters as numbers. Early systems like ASCII, created in the 1960s, used only 128 codes, enough for English letters, digits and punctuation, but not for Chinese, Arabic or even French accents like é.",
        "计算机用数字存储字母。二十世纪六十年代诞生的 ASCII 等早期系统只有 128 个编码，够存英文字母、数字和标点，却存不下中文、阿拉伯文，连法语的 é 这样带重音的字母都不行。"],
      ["Different countries created their own systems, such as GB2312 for Chinese, and the results were messy: open a file with the wrong system and you saw nonsense characters. This is called mojibake, a Japanese word meaning \"character transformation\".",
        "各国于是各自制定编码，比如中文的 GB2312，结果一团混乱：用错了编码打开文件，就会看到一堆乱码。这在日语里叫「mojibake（文字化け）」，意思是「文字变形」。"],
      ["Unicode solved this by giving every character in every writing system its own number. It now includes about 150,000 characters, from Chinese characters to ancient Egyptian hieroglyphs and emoji. The most common way to store Unicode is UTF-8, which is used by about 98 percent of websites.",
        "Unicode（统一码）解决了这个问题：它给所有书写系统中的每个字符都分配了唯一的编号。它现在收录了约 15 万个字符，从汉字到古埃及象形文字和表情符号。存储 Unicode 最常用的方式是 UTF-8，约 98% 的网站都在使用。"],
    ],
    questions: [
      { q: "How many codes did ASCII have?", o: ["26.", "128.", "1,000.", "150,000."], a: 1, e: "第一段。" },
      { q: "What is mojibake?", o: ["A type of font.", "Nonsense characters from the wrong encoding.", "A Japanese computer.", "An emoji."], a: 1, e: "第二段。" },
      { q: "What is the most common way to store Unicode?", o: ["ASCII.", "UTF-8.", "GB2312.", "Binary only."], a: 1, e: "第三段。" },
    ],
  },
  {
    id: "p_database", category: "pro", title: "Databases and SQL", level: "高级", topic: "计算机 · 数据", imgQuery: "server room",
    paragraphs: [
      ["Almost every app stores data in a database: your messages, orders, bank balance or game scores. The most common type is the relational database, which stores data in tables made of rows and columns, a bit like spreadsheets.",
        "几乎每个应用都把数据存在数据库里：你的消息、订单、银行余额或游戏分数。最常见的类型是关系型数据库，它把数据存在由行和列组成的表中，有点像电子表格。"],
      ["Tables can be linked together. A shop might have one table for customers and another for orders, with each order pointing to a customer's ID. This avoids storing the same information again and again.",
        "表之间可以相互关联。比如一家商店可能有一张顾客表和一张订单表，每个订单通过顾客 ID 指向对应的顾客。这样就避免了重复存储同样的信息。"],
      ["To ask questions of a database, programmers use SQL (Structured Query Language). For example, \"SELECT name FROM customers WHERE city = 'Beijing'\" finds all customers in Beijing. Databases can search millions of rows in a fraction of a second thanks to indexes, which work like the index at the back of a book.",
        "要向数据库提问，程序员使用 SQL（结构化查询语言）。比如「SELECT name FROM customers WHERE city = 'Beijing'」能找出所有在北京的顾客。借助索引——就像书后面的索引那样——数据库能在不到一秒内搜索几百万行数据。"],
    ],
    questions: [
      { q: "How does a relational database store data?", o: ["In tables of rows and columns.", "In pictures.", "In a single long text.", "In emails."], a: 0, e: "第一段。" },
      { q: "Why link tables together?", o: ["To avoid storing the same information repeatedly.", "To make it slower.", "To hide data.", "To print it."], a: 0, e: "第二段。" },
      { q: "What helps databases search very fast?", o: ["Indexes.", "Bigger screens.", "More tables.", "Passwords."], a: 0, e: "第三段。" },
    ],
  },
);
