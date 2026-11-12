# Product

<!-- impeccable:product-schema 1 -->

<!-- Assumptions: product facts below are inferred from README.md, the existing site, and the user's brief on 2026-11-12. No commercial claims, customer names, or benchmarks were invented. -->

## Platform

web

## Stack

VitePress 1.6 + Vue 3 + Markdown. Mermaid 11 for concept diagrams. Static build deployed to GitHub Pages.

## Users

SRE、平台工程师、AI 工程师、运维产品经理与架构师。读者通常在以下场景使用本书：评估一个运维场景是否值得做 Agent、设计工具与权限边界、准备评测与灰度发布、选择厂商或运行时，或在事故后用证据复盘。

## Product Purpose

面向运维场景的智能体工程手册。把运维 Agent 从想法到退役的工程方法、场景手册、厂商地图、模板与案例组织成可在线阅读、可检索、可打印的技术文档；成功标准是读者能带着一个具体场景进来，带着可执行的证据、权限、评测和发布方案离开。

## Positioning

不以“模型能力”为中心，而以运维 Agent 的证据、权限、变更与可验证性为中心。方法层给出生命周期门禁、动作阶梯、证据包、工具契约和评测金字塔；场景层给出 K8s、RDMA、GPU 推理、数据库与事故指挥的可落地手册；案例层用合成/脱敏走查展示成功与失败。

## Operating Context

读者在桌面浏览器中长时间阅读，也会在手机上查目录或单章；内容包含大量表格、检查清单、YAML/JSON 片段和概念图。站点需要本地搜索、章节目录、上一章/下一章、GitHub 编辑入口和打印友好样式。部署目标为 GitHub Pages，构建命令为 `npm run docs:build`。

## Capabilities and Constraints

- 五部分结构：方法与生命周期、场景手册、厂商与产品全景、2026 工程域、模板与工具箱；另有案例与附录。
- 内容以中文为主，术语首次出现给出英文；产品能力必须可核验，涉及厂商时给出官方来源或明确标注“公开报道”。
- 案例均为合成/脱敏内容，不得写成真实客户案例或真实数据。
- 站点必须静态构建、可离线预览、无后端依赖；Mermaid 图在构建后可客户端渲染。
- 视觉方向由用户明确指定：IBM 企业风格、白色背景、IBM 蓝强调色、强制浅色主题，不提供深色切换。
- 图表范围：全书所有概念图，包括方法章、5 本场景手册、2 个案例、厂商分层与关键模板。
- 现有 URL 与章节路径保持不变，避免破坏外链与搜索引擎收录。

## Brand Commitments

- 名字：The Ops Agent Book / 运维智能体工程手册。
- 字体：IBM Plex Sans 与 IBM Plex Mono（拉丁与图表标签，已随项目自托管）；中文正文使用 PingFang SC / Microsoft YaHei / Noto Sans SC 原生字体，避免为每个页面加载数 MB 的 CJK 子集。
- 颜色：IBM 白底、IBM Blue 60 `#0f62fe`、Blue 70 `#0043ce`、Blue 10 `#edf5ff`，灰色阶使用 IBM Gray 10/20/30/50/70/90/100。
- 形态：方形边角、1px 细分隔线、精确网格、克制留白；不使用圆角卡片堆叠、渐变文字、玻璃拟态或彩色左边框。
- 语气：工程、直接、可核验；避免营销式夸张和不可核验的“最强/最好”。

## Evidence on Hand

- 14 章方法正文、5 本场景手册、8 个厂商页、7 个模板、4 个附录。
- 两个合成案例：K8s 节点 NotReady 端到端案例、未上线 Agent 失败复盘。
- 参考资料页含官方文档、标准与公开报道链接；厂商页标注最后核实日期。
- `assets/preview.png` 为首页预览图；README 与站点内容保持同步。

## Product Principles

1. 证据先于结论，验证先于关闭。
2. 权限先于能力，默认只读，逐步升级。
3. 场景必须深潜，方法可以复用。
4. Agent 是产品，不是一次性 Prompt；上线只是开始。
5. 人对结果负责，Agent 不承担责任。

## Accessibility & Inclusion

- 正文对比度达到 WCAG AA；链接、焦点环、选中文本与表单控件使用 IBM 蓝色系。
- 图表必须有标题/图注与文字上下文；Mermaid 图在窄屏可横向滚动，不压缩到不可读。
- 键盘可访问导航、搜索、目录与上一章/下一章；不使用仅靠颜色传达状态。
- 打印样式保留正文、表格与图，隐藏导航与交互控件。
