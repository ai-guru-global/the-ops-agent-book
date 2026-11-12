---
version: 1
slug: "docs-index-md"
primary_target: "docs/index.md"
related_targets: []
---

# Surface brief: The Ops Agent Book

## Scope and mode

Read. Site-wide frame and homepage for an online engineering manual; chapter pages inherit the same frame. Existing URLs, content, and VitePress behavior stay intact.

## Audience and job

SRE、平台工程师、AI 工程师、运维产品经理与架构师。读者来查一套可执行的运维 Agent 方法、场景手册、模板和案例；他们需要快速定位章节、扫读表格、看懂图，然后回到自己的工作里做设计或评审。

## Direction

IBM 企业技术手册。白色画布、IBM Blue 60 作为唯一强调色、IBM Gray 细分隔线、IBM Plex Sans/Mono、方形边角、精确网格。框架可以很品牌，正文阅读列保持安静。图表是内容的一部分，不是装饰；每张图有编号、标题、图注和文字上下文。

## Memorable moment

打开首页时先看到一张像 IBM 产品手册目录的结构表，而不是深色 Hero 和卡片墙；进入任一章后，关键机制以同一套蓝色线框示意图出现，读者可以在几秒内看懂生命周期、状态机或证据链。

## Constraints

- VitePress 1.6 静态站；不引入后端。
- 强制浅色主题，移除深色切换。
- 保留现有路由与 URL。
- 不使用圆角卡片堆叠、渐变文字、玻璃拟态、彩色左边框、硬偏移阴影。
- 图表必须可打印、窄屏可横向滚动、有文字说明。
- 现有中文内容、表格与代码块保持可读。

## Unresolved

None. The user confirmed force-light, all concept diagrams, and direct publication.

## Direction contract

THESIS: An IBM-precision field manual, not a startup landing page. Refuse the dark hero, card grid, kicker/eyebrow labels, and decorative gradients that dominate AI product sites.
OWN-WORLD: White #ffffff ground; IBM Gray 10/20/30 rules; IBM Blue 60 #0f62fe as the only accent; IBM Plex Sans and IBM Plex Mono; square corners; 1px rules; diagram-first layouts. With all content removed, it should still read as an IBM technical publication.
STORY: The reader sees a serious, current technical manual, scans a precise contents table, chooses a chapter, and understands the method through numbered blue-line diagrams, tables, and checklists.
FIRST VIEWPORT: A white masthead with the book title and a thin blue rule; left: title "运维智能体工程手册", short lead, primary "开始阅读" and secondary "场景手册" actions; right: a compact metadata table (version, scope, audience, format) and the seven-stage line. No dark panel, no card grid.
FORM: Pinned by the user's brief, not a concept roll; code-led. The diagram system is the signature: numbered Mermaid figures using IBM blue strokes, gray fills, Plex Sans labels, and captions.
seed: none (brief-pinned direction)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
