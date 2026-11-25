# The Ops Agent Book 改进计划

计划日期：2026-11-24  
基线来源：[逐章评估报告](/Users/allengaller/Documents/GitHub/ai-guru-global/the-ops-agent-book/reports/chapter-evaluation.md) 与 [44 页评分表](/Users/allengaller/Documents/GitHub/ai-guru-global/the-ops-agent-book/reports/chapter-scores.csv)  
执行清单：[improvement-backlog.csv](/Users/allengaller/Documents/GitHub/ai-guru-global/the-ops-agent-book/reports/improvement-backlog.csv)

## 1. 计划目标

把本书从“结构完整、视觉成熟、覆盖面广的在线工程手册”升级为“可直接用于生产设计、采购、评测和验收的智能体参考书”。

核心原则：**不再优先扩写目录，优先补齐可验证契约、真实 artifact、失败路径和来源追溯。**

## 2. 基线与目标分数

| 维度 | 当前 | v0.2.0 安全一致版 | v0.3.0 可执行版 | v1.0-rc1 目标 |
| --- | ---: | ---: | ---: | ---: |
| 内容深度 | 3.27 | 3.7 | 4.0 | 4.2 |
| 内容广度 | 4.00 | 4.1 | 4.2 | 4.3 |
| 智能体最佳实践 | 3.57 | 4.0 | 4.4 | 4.5 |
| 可读性 | 4.14 | 4.3 | 4.4 | 4.5 |
| 可用性 | 3.25 | 3.7 | 4.1 | 4.3 |
| 易读性 | 3.89 | 4.1 | 4.2 | 4.4 |
| 图示完整性 | 2.52 | 3.8 | 4.2 | 4.3 |
| **综合（等权）** | **3.52** | **3.96** | **4.21** | **4.36** |

目标是发布门槛，不是自动预测。每一版都必须用同一量表重新评估；v2 保留原 44 页可比口径，并额外评估新增的需求地图、图示规范、来源注册表与维护注册表，现行覆盖 48 页。未达标项需要明确豁免或继续留在 backlog。

## 3. 范围与非目标

### 范围

- 修正安全、审批、回滚、权限、评测、指标和 ROI 中会误导实施的语义。
- 修正 9 张重点 Mermaid 图，转换 10 个图状文本块和 2 个纯文本步骤序列，补关键缺失图。
- 建立来源 ID、claim 矩阵、商业字段、快照和 review_by 机制。
- 把模板升级为 JSON Schema、policy-as-code、eval manifest、Runbook schema 和 CI 可验证资产。
- 增加参考实现、Trace、评测结果、成本模型、POC 评分卡和真实/高保真案例附件。
- 深化五本场景手册，使每本至少有一个可复制、可验证的端到端样例。
- 完善治理、术语、跨章地图、PDF/EPUB、无障碍和阅读测试。

### 非目标

- 不新增厂商章节、行业章节或未来趋势，直到现有事实完成逐主张溯源。
- 不继续增加没有验收标准的通用检查清单。
- 不重做 IBM 白底蓝视觉方向，只修复语义、可读性和发布细节。
- 不把合成案例写成真实客户案例；所有演示数据必须标注 synthetic/脱敏。
- 不在质量门禁通过前自动发布到线上。

## 4. 三种投入档位

| 档位 | 覆盖范围 | 估算工作量 | 适用场景 |
| --- | --- | ---: | --- |
| A. 安全一致版 | P0：WP-00～04 的关键项 | 28.5 人日 | 先消除误导和图示/来源/指标缺口 |
| B. 可执行参考版 | P0 + P1 | 77.5 人日 | 形成 schema、参考实现、评测和场景 Runbook |
| C. 出版候选版 | P0 + P1 + P2 | 89.5 人日 | 复评、PDF/EPUB、无障碍、用户测试、rc1 |

工作量按 2 人并行估算：A 约 3–4 周，B 约 7–9 周，C 约 9–11 周；单人执行需要按总人日重新排期。

## 5. 30 / 60 / 90 天路线

### 0–30 天：安全、语义、图示和事实底座

- 冻结基线、Owner、RACI、来源规范和指标 schema。
- 完成 WP-01 安全与语义纠正。
- 完成 DIAG-01/02：9 张重点图 + 10 个图状文本块 + 2 个步骤序列。
- 建立来源注册表和 claim 矩阵骨架，先覆盖高风险/高变化事实。
- 完成 SLO/评测/ROI 指标契约和发布门禁表。
- **出口：v0.2.0，G1/G2 通过；不存在 P0 误导、图示文本残留或不可计算指标。**

### 31–60 天：可执行契约与参考资产

- 完成 JSON Schema、policy-as-code、eval manifest、Runbook schema 和 CI。
- 实现最小工具网关、策略执行点、不可变审批计划、Trace 和回滚演练。
- 产出第一份 eval suite + 结果、Trace、成本模型和 POC 评分卡。
- 完成 K8s 与事故指挥的端到端样例，关闭 NotReady 案例。
- **出口：v0.3.0，G3 通过；资产可在干净环境复现，schema/fixtures/tests 全绿。**

### 61–90 天：场景深化、治理和出版候选

- 完成 RDMA、GPU、数据库 Runbook 和失败案例闭环。
- 完成治理矩阵、术语注册表、需求→章节→模板→证据地图和页面 review_by。
- 补 PDF/EPUB、print、无障碍、响应式和 3–5 人阅读测试。
- 用同一量表复评 44 页，形成 v1.0-rc1 发布决策。
- **出口：v1.0-rc1，G4/G5 通过；目标分数达成或有书面豁免。**

## 6. 工作包总览

> 本节保留初始计划快照：57 个任务、89.5 人日。执行期间新增安全审计、真实资产与发布修复任务后，当前权威 backlog 为 **73 项、111.0 人日，72 项完成、1 项进行中**；当前状态见 [improvement-status.md](./improvement-status.md) 与 [improvement-backlog.csv](./improvement-backlog.csv)。

| 工作包 | 任务数 | 人日 | 阶段 | 核心交付物 | 门禁 |
| --- | ---: | ---: | --- | --- | --- |
| WP-00 基线与治理 | 3 | 3 | 0–30 天 | 评分基线、RACI、来源规范 | G0 |
| WP-01 安全与语义纠正 | 8 | 9 | 0–30 天 | 安全语义修订与领域审稿 | G1 |
| WP-02 图示系统补全 | 5 | 11 | 0–60 天 | 图示修订、转换、补全与六尺寸验收 | G2 |
| WP-03 来源与事实追溯 | 6 | 9 | 0–60 天 | 来源注册表、claim 矩阵、商业字段 | G2 |
| WP-04 指标与财务契约 | 5 | 7.5 | 0–60 天 | 指标 schema、SLO/评测门禁、成本模型 | G1/G3 |
| WP-05 可执行契约与模板 | 7 | 11.5 | 31–60 天 | schema、policy、eval、Runbook、CI | G3 |
| WP-06 参考实现与真实资产 | 7 | 13 | 31–60 天 | 工具网关、Trace、eval、回滚、成本、POC | G3 |
| WP-07 场景手册与案例深化 | 7 | 13.5 | 31–90 天 | 五本 Runbook、两个案例闭环 | G3 |
| WP-08 治理与维护 | 4 | 5 | 61–90 天 | 治理矩阵、术语、需求地图、review_by | G4 |
| WP-09 发布与阅读 QA | 5 | 7 | 61–90 天 | print/PDF/EPUB、无障碍、用户测试、复评 | G4/G5 |
| **初始合计** | **57** | **89.5** | 0–90 天 | 57 个初始可执行任务 | G0–G5 |

## 7. 工作包详述

### WP-00 基线与治理

**目标**：让后续所有改动有唯一基线、Owner、验收口径和来源规范。  
**关键产出**：评分基线、目标分数、RACI、评审日历、来源/claim/review_by 规范。  
**验收**：44 页基线不可漂移；每个 WP 有唯一 Owner 和签署人；后续任务无需重新定义评分或来源格式。  
**依赖**：无。  
**估算**：3 人日。

### WP-01 安全与语义纠正

**目标**：先修正会直接导致错误实施的内容。  
**关键任务**：审批前置于工具调用；审批绑定计划哈希/版本/有效期；重写 drain/uncordon/清理/复位的部分成功与补偿；修正 K8s Pressure/PDB 顺序；GPU 动作门禁；证据包/Runbook 示例；ROI 重复计量；角色权限；状态机异常路径。  
**验收**：所有写操作先批准后执行；不可逆动作有补偿；只读快路径不经过审批；每个异常状态有出口；五个领域审稿人签字。  
**依赖**：WP-00。  
**估算**：9 人日。

### WP-02 图示系统补全

**目标**：让图示从“有图”升级为“语义准确、覆盖完整、跨尺寸可读”。  
**关键任务**：修正图 04/05/08/12/14/16/18/20/22；转换 10 个图状文本块与 2 个步骤序列；补治理、单位经济、自进化/A2A、发布回滚和手册异常图；建立图号/图注/alt/维护规范；六尺寸验收。  
**验收**：图与正文一致；条件、拒绝、失败、回滚可见；无图状文本残留；320/390/768/1024/1440/print 全部可读。  
**依赖**：WP-01 的安全语义。  
**估算**：11 人日。

### WP-03 来源与事实追溯

**目标**：让厂商与产品事实可逐主张复核、可过期、可归档。  
**关键任务**：来源 ID、claim 矩阵、商业字段、快照校验和、页面 Owner/review_by、删除或标注不可核实断言。  
**验收**：所有 material claim 有 source_id；官方与报道分开；GA/预览、区域、许可、计费、驻留、导出字段完整或显式未知；过期事实可被构建发现。  
**依赖**：WP-00。  
**估算**：9 人日。

### WP-04 指标与财务契约

**目标**：让“85%”“100%”“ROI 140%”等数字可计算、可复现、可审计。  
**关键任务**：指标 schema；重写指标库和 07/08；发布门禁表；成本模型；算术验证。  
**验收**：每个指标有公式、单位、分子/分母、窗口、排除、数据源、Owner、阈值；评测有样本量和分层；ROI 无重复收益，含敏感性/盈亏平衡。  
**依赖**：WP-00；SAFE-06。  
**估算**：7.5 人日。

### WP-05 可执行契约与模板

**目标**：把“模板示例”升级为“可校验、可测试、可运行”的工程资产。  
**关键任务**：工具契约 JSON Schema；权限 policy-as-code；eval manifest/fixtures/runner；Runbook schema；发布/复盘机器可读模板；CI；模板元数据与一致性。  
**验收**：示例通过 schema；策略有允许/拒绝/过期/撤销测试；黄金集/校准/留出划分明确；PR 必须通过 schema、fixture、内链、Mermaid 和来源过期检查。  
**依赖**：WP-01、WP-04。  
**估算**：11.5 人日。

### WP-06 参考实现与真实资产

**目标**：为全书提供一套可复现的生产骨架，而不是继续写孤立示例。  
**关键任务**：MCP/OpenAPI 工具网关；策略执行点；不可变审批/短时凭证/撤销；Canonical Event Schema + Trace；影子/灰度/回滚；eval harness + 结果；成本样例；POC 评分卡。  
**验收**：干净环境可启动；无硬编码密钥；Trace 含版本/成本/脱敏；回滚在 RTO 内完成；eval 报告含样本量、分层和失败案例。  
**依赖**：WP-05。  
**估算**：13 人日。

### WP-07 场景手册与案例深化

**目标**：让五本手册都达到“领域 SRE 可照着做”的深度。  
**关键任务**：K8s 命令/PromQL；RDMA 计数器差分；GPU endpoint/显存账；MySQL/PostgreSQL SQL；事故 Severity/RACI/状态机；两个案例的原始 artifact 与整改后回归。  
**验收**：每本至少一个端到端可复制样例；案例 gap 全部关闭；不可逆动作有补偿；整改有复评和重新准入结论。  
**依赖**：WP-01、WP-05、WP-06。  
**估算**：13.5 人日。

### WP-08 治理与维护

**目标**：让内容长期不过期、不产生无主事实、不丢失决策证据。  
**关键任务**：决策权/门禁证据/缺席代理/退役矩阵；术语注册表；需求→章节→模板→证据地图；Owner/review_by/归档。  
**验收**：每阶段有 A/R、证据、否决权和升级路径；术语全文一致；无无主页面；需求可直达资产。  
**依赖**：WP-00、WP-03、WP-05。  
**估算**：5 人日。

### WP-09 发布与阅读 QA

**目标**：形成可发布、可打印、可无障碍访问、经过真实读者验证的 rc1。  
**关键任务**：print pre-wrap/重复表头/页码/图表目录；PDF/EPUB；无障碍；响应式矩阵；3–5 人任务型阅读测试；44 页复评。  
**验收**：无 AA 阻断项；长代码不裁切；所有图在目标尺寸可读；用户能完成定位、理解、复用任务；达到目标分数或书面豁免。  
**依赖**：全部前置 WP。  
**估算**：7 人日。

## 8. 完整任务清单

| ID | 优先级 | 阶段 | 任务 | Owner | 人日 | 依赖 | 验收标准 |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| GOV-01 | P0 | 0-30天 | 冻结 44 页七维度评分基线、目标分数和复评口径 | Content Lead | 1 | — | 44 页均有基线；复评使用同一量表 |
| GOV-02 | P0 | 0-30天 | 为每个工作包指定 Owner、审稿人、领域审稿人和发布负责人 | Maintainer | 1 | GOV-01 | 每个 WP 有唯一 Owner 和签署人 |
| GOV-03 | P0 | 0-30天 | 建立来源 ID、claim 矩阵、review_by 和过期标记规范 | Content Lead | 1 | GOV-01 | 规范可被后续 WP-03 直接使用 |
| SAFE-01 | P0 | 0-30天 | 修正审批顺序：审批/策略执行必须在工具调用前，绑定不可变计划哈希、版本、有效期和重校验 | Agent Engineer + Security | 1.5 | GOV-02 | 所有写操作路径均为先批准后执行；计划变更使审批失效 |
| SAFE-02 | P0 | 0-30天 | 重写 drain/uncordon/清理/复位等动作的幂等、部分成功、补偿与安全恢复语义 | Domain SRE + Security | 1.5 | SAFE-01 | 不再把 uncordon 当作完整回滚；不可逆动作有补偿方案 |
| SAFE-03 | P0 | 0-30天 | 修正 K8s Pressure 分支与 PDB 检查顺序 | K8s SRE | 1 | SAFE-01 | Memory/Disk/PID 分支互斥完备；PDB 在任何 drain 前通过 |
| SAFE-04 | P0 | 0-30天 | 为 GPU 复位/替换路径加入 drain、无流量确认、审批和验证门禁 | GPU SRE | 1 | SAFE-01 | 高风险硬件动作不可绕过门禁 |
| SAFE-05 | P0 | 0-30天 | 修复证据包与 Runbook 示例中的未观测证据、缺失变更步骤和回滚触发条件 | Content Lead + K8s SRE | 1 | SAFE-01 | 每个结论有观测证据；Runbook 先变更有验证/回滚 |
| SAFE-06 | P0 | 0-30天 | 消除 ROI 重复计量，补人工复核、风险准备、迁移和敏感性说明 | FinOps Reviewer | 1 | GOV-01 | 示例可复算；收益项不重复；有一手来源或明确合成 |
| SAFE-07 | P0 | 0-30天 | 统一 Copilot/Operator/Commander 的权限、责任和写操作边界 | Content Lead + Security | 1 | GOV-02 | 同一角色在所有章节权限一致；Commander 协调权与生产写权分离 |
| SAFE-08 | P0 | 0-30天 | 状态机补只读快路径、拒绝、工具失败、重规划、回滚和升级状态 | Agent Engineer | 1 | SAFE-01 | 只读诊断无需审批；所有异常都有明确出口 |
| DIAG-01 | P0 | 0-30天 | 修正图 04/05/08/12/14/16/18/20/22 的语义 | Docs Designer + Domain Reviewers | 3 | SAFE-01,SAFE-03,SAFE-04,SAFE-08 | 图与正文一致；条件、拒绝、失败、回滚可见 |
| DIAG-02 | P0 | 0-30天 | 把 10 个图状文本块与 2 个步骤序列转换为 Mermaid 或状态/决策表 | Docs Designer | 3 | DIAG-01 | 静态扫描不再发现图状文本；不重复同一概念 |
| DIAG-03 | P1 | 31-60天 | 补治理、单位经济、自进化/A2A 保障、发布回滚和手册异常路径图 | Docs Designer + SMEs | 3 | DIAG-01 | 关键机制无图示缺口；新增图有编号和图注 |
| DIAG-04 | P1 | 31-60天 | 建立图号、图注、颜色、语义、alt text 与维护规范 | Docs Designer | 1 | GOV-03 | 新增图必须通过规范检查 |
| DIAG-05 | P1 | 31-60天 | 执行 320/390/768/1024/1440/print 六尺寸图示验收 | Docs QA | 1 | DIAG-02,DIAG-03 | 无压缩到不可读、无裁剪、打印可输出 |
| SRC-01 | P0 | 0-30天 | 实现来源注册表：source_id、标题、URL、类型、访问日、快照、review_by | Content Lead | 1 | GOV-03 | 每个来源有稳定 ID 和过期策略 |
| SRC-02 | P0 | 0-30天 | 为厂商与阿里附录的每条能力主张绑定 source_id 和精确章节 | Vendor Researcher | 3 | SRC-01 | material claim 100% 可回指；报道与官方事实分开 |
| SRC-03 | P0 | 0-30天 | 补 GA/预览/停服、区域、许可单位、最低消费、超额费用、数据驻留、导出字段 | Vendor Researcher + FinOps | 2 | SRC-02 | 采购必需字段无空缺；未知项显式标记未核实 |
| SRC-04 | P1 | 31-60天 | 归档关键官方快照并生成校验和 | Maintainer | 1 | SRC-01 | 关键事实可在源页面变化后复核 |
| SRC-05 | P1 | 31-60天 | 为事实页增加 Owner、review_by、最后核实和过期提示 | Content Lead | 1 | SRC-01 | 过期页面在构建或页面显著提示 |
| SRC-06 | P1 | 31-60天 | 删除或明确标注无法核实的数量、状态和能力断言 | Vendor Researcher | 1 | SRC-02,SRC-03 | 无“官方/报道”混合来源类型的模糊断言 |
| MET-01 | P0 | 0-30天 | 定义指标 schema：公式、单位、分子/分母、窗口、排除、数据源、Owner、阈值 | Evaluation Owner | 1 | GOV-01 | 所有指标可机器校验 |
| MET-02 | P0 | 0-30天 | 按 schema 重写指标库、07/08 的 SLO 与评测门槛 | Evaluation Owner + Content Lead | 2 | MET-01 | 每个指标可计算、有最低样本和触发动作 |
| MET-03 | P0 | 0-30天 | 建立发布门禁表：场景分层、样本量、置信区间、观察窗、自动回滚阈值 | Evaluation Owner | 1.5 | MET-01 | 每项门槛有明确通过/失败判定 |
| MET-04 | P1 | 31-60天 | 制作可复算成本模型：基线、复核、风险准备、迁移、爬坡、敏感性、盈亏平衡 | FinOps Reviewer | 2 | SAFE-06 | 样例结果可复现；含悲观/基准/乐观情景 |
| MET-05 | P1 | 31-60天 | 用测试数据验证所有公式与样例计算 | Evaluation Owner | 1 | MET-02,MET-03,MET-04 | 无重复收益、单位混用或算术错误 |
| CON-01 | P1 | 31-60天 | 发布工具契约 JSON Schema、版本兼容规则和完整示例 | Agent Engineer | 2 | SAFE-01,SAFE-02 | 示例通过 schema；写工具字段无缺失 |
| CON-02 | P1 | 31-60天 | 发布权限 policy-as-code schema、deny 优先级、break-glass 与撤销规则 | Security Engineer | 2 | CON-01,SAFE-07 | 策略可执行；有允许/拒绝/过期/撤销测试 |
| CON-03 | P1 | 31-60天 | 发布评测 suite manifest、fixtures、运行器和报告格式 | Evaluation Owner | 2 | MET-03 | 黄金集/校准/留出划分明确；报告可复现 |
| CON-04 | P1 | 31-60天 | 发布 Runbook 2.0 schema：输入、断言、验证、回滚、升级 | Domain SREs | 1.5 | SAFE-05,CON-01 | 步骤可机器校验；无自由文本 shell 拼接 |
| CON-05 | P1 | 31-60天 | 把发布清单和事故复盘行动项改为带证据、Owner、状态的机器可读模板 | Maintainer | 1 | CON-03 | 检查项可绑定制品、证据和签署人 |
| CON-06 | P1 | 31-60天 | 建立 CI：schema lint、fixture tests、内链、Mermaid 渲染、过期来源检查 | Docs Engineer | 2 | CON-01,CON-02,CON-03,SRC-05 | PR 必须通过全部质量门禁 |
| CON-07 | P1 | 31-60天 | 统一模板 Owner、版本、artifact ID、填写完成判定和跨模板字段 | Content Lead | 1 | CON-01,CON-03,CON-04 | 不再有无法验收的空字段 |
| ART-01 | P1 | 31-60天 | 实现最小 MCP/OpenAPI 工具网关和策略执行点 | Agent Engineer | 3 | CON-01,CON-02 | 干净环境可启动；无硬编码密钥 |
| ART-02 | P1 | 31-60天 | 实现不可变审批计划、短时凭证、撤销和审计事件 | Agent Engineer + Security | 2 | ART-01,SAFE-01 | 计划变更使审批失效；撤销即时传播 |
| ART-03 | P1 | 31-60天 | 发布 Canonical Event Schema 和一份脱敏 Trace | AgentOps Engineer | 2 | ART-01 | Trace 含 Session/Run/Tool/Approval/Outcome、版本、成本、脱敏 |
| ART-04 | P1 | 31-60天 | 实现影子/灰度/回滚脚本和 kill switch 演练 | Agent Engineer + SRE | 2 | ART-01,ART-02 | 回滚在定义 RTO 内完成；在途动作有处理策略 |
| ART-05 | P1 | 31-60天 | 运行评测 harness，产出基线、失败案例和回归报告 | Evaluation Owner | 2 | CON-03,ART-01 | 报告含样本量、分层、失败案例和版本 |
| ART-06 | P1 | 31-60天 | 把成本模型接入一个真实工作负载样例并记录假设 | FinOps Reviewer | 1 | MET-04,ART-05 | Token/工具/沙箱/人工/风险成本齐全 |
| ART-07 | P1 | 31-60天 | 制作采购 POC 评分卡与退出/迁移测试模板 | Vendor Researcher | 1 | SRC-03,MET-04 | 可用于真实厂商 POC，含硬否决项和退出测试 |
| PLAY-01 | P1 | 31-60天 | K8s：补 kubectl/PromQL 示例、参数/输出、完整 NotReady Runbook | K8s SRE | 2 | SAFE-03,CON-04 | 读者可在测试集群复现并验证 |
| PLAY-02 | P1 | 61-90天 | RDMA：补 RoCE/IB 分流、计数器差分、单端口 flap 样例 | Network SRE | 2 | CON-04 | 原始输出→差分→阈值→隔离→恢复闭环可复现 |
| PLAY-03 | P1 | 61-90天 | GPU：补框架 endpoint/字段映射、显存账例题和动作门禁 | GPU SRE | 2 | SAFE-04,CON-04 | 显存计算无重复变量；高风险动作有审批/验证 |
| PLAY-04 | P1 | 61-90天 | 数据库：补 MySQL/PostgreSQL 查询包、EXPLAIN 区别、DDL/恢复演练 | DBA | 2 | CON-04 | 引擎/版本明确；查询有超时、行数、脱敏和验证 |
| PLAY-05 | P1 | 61-90天 | 事故指挥：补 Severity/RACI、分派规则、状态机和异常回路 | Incident Commander | 2 | CON-02,CON-04 | 冲突、拒绝、超时、恢复失败均有路径 |
| PLAY-06 | P1 | 31-60天 | NotReady 案例补原始 artifact、审批记录、根因整改和整改后回归 | Content Lead + K8s SRE | 2 | PLAY-01,ART-03 | gap 全部关闭；不可逆动作有补偿；回归结果可复核 |
| PLAY-07 | P1 | 61-90天 | 失败案例补正式否决记录、整改 Owner、复评和重新准入条件 | Content Lead + Maintainer | 1.5 | GOV-02 | 复盘行动项有验收证据和最终状态 |
| MAINT-01 | P2 | 61-90天 | 建立决策权、门禁证据、缺席代理和退役执行矩阵 | Maintainer | 1.5 | GOV-02 | 每阶段有 A/R、证据、否决权和升级路径 |
| MAINT-02 | P2 | 61-90天 | 建立术语注册表、首次定义链接和章节反向链接 | Content Lead | 1 | SRC-05 | Canary/AgentRun/AgentBay/NHI 等全文一致 |
| MAINT-03 | P2 | 61-90天 | 建立需求→章节→模板→验证证据地图 | Content Lead | 1.5 | CON-07,ART-05 | 读者可从需求直达可执行资产 |
| MAINT-04 | P2 | 61-90天 | 为所有事实页配置 Owner、review_by、过期与归档流程 | Maintainer | 1 | SRC-05 | 无无主页面；过期事实可被构建发现 |
| PUB-01 | P2 | 61-90天 | 补 print pre-wrap、重复表头、页码、图表目录和 PDF/EPUB 导出 | Docs Engineer | 2 | DIAG-05,CON-06 | 长代码不裁切；PDF/EPUB 可生成 |
| PUB-02 | P2 | 61-90天 | 执行无障碍检查：对比度、alt text、键盘、reduced motion | Docs QA + Accessibility Reviewer | 1 | DIAG-04,PUB-01 | 无 AA 阻断项；图有文字上下文 |
| PUB-03 | P2 | 61-90天 | 执行 320/390/768/1024/1440/print 全站矩阵 | Docs QA | 1.5 | PUB-01 | 无横向页面溢出、表格可读、图不压缩 |
| PUB-04 | P2 | 61-90天 | 邀请 3–5 名 SRE/平台工程师做任务型阅读测试 | Content Lead | 1.5 | PUB-03 | 定位、理解、复用三类任务有通过记录 |
| PUB-05 | P2 | 61-90天 | 按同一量表复评 44 页并决定 v1.0-rc1 是否发布 | Review Board | 1 | GOV-03,SAFE-08,DIAG-05,SRC-06,MET-05,CON-07,ART-07,PLAY-07,MAINT-04,PUB-04 | 达到目标门槛；未达标项有明确豁免或继续计划 |

## 9. RACI 建议

| 角色 | 责任 | 主要签署门禁 |
| --- | --- | --- |
| Content Lead | 章节范围、评分口径、术语、来源矩阵、复评 | G0、G2、G5 |
| Agent Engineer | 工具契约、策略执行点、Trace、回滚、参考实现 | G1、G3 |
| Domain SREs | K8s/RDMA/GPU/DB/事故的领域正确性与 Runbook | G1、G3 |
| Security/IAM Reviewer | 身份、审批、越权、注入、供应链、审计 | G1、G3 |
| Evaluation Owner | 指标、样本、Rubric、Judge、回归报告 | G3 |
| FinOps Reviewer | TCO、ROI、许可/计费、盈亏平衡 | G2、G3 |
| Docs/Design Engineer | Mermaid、版式、响应式、print、PDF/EPUB | G2、G4 |
| Maintainer | CI、版本、发布、回滚、归档 | G3、G5 |

## 10. 质量门禁

| 门禁 | 通过条件 | 批准人 |
| --- | --- | --- |
| G0 基线锁定 | 44 页评分、目标、Owner、来源规范冻结 | Content Lead |
| G1 安全与语义 | 无 P0 误导；审批/回滚/角色/公式经领域和安全审稿 | Security + Domain SREs |
| G2 图示与事实 | 9 张重点图修正；10+2 文本图转换；material claim 有来源 ID | Content Lead + Docs QA |
| G3 可执行资产 | schema/fixtures/tests 全绿；Trace/eval/rollback 可复现 | Agent Engineer + Evaluation Owner |
| G4 阅读与发布 | 六尺寸/print/无障碍/用户测试通过；PDF/EPUB 可生成 | Docs QA + Accessibility Reviewer |
| G5 发布决策 | 44 页复评达到目标；未达标项有书面豁免；发布与回滚就绪 | Review Board + Maintainer |

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 产品事实快速变化 | 厂商页再次过期 | source_id、快照、review_by、构建过期告警 |
| 合成 artifact 被误当真实数据 | 可信度受损 | 所有样例标注 synthetic；记录生成方式与假设 |
| 范围继续扩大 | 90 天无法收敛 | P0/P1 未完成不新增章节；变更需 Review Board 批准 |
| 安全/领域审稿人不足 | 语义修订停滞 | 在 Day 1 预订审稿人；每周固定审稿窗口 |
| 资产体积影响站点性能 | 阅读变慢 | 示例资产按需下载；设 bundle/PDF 体积预算 |
| Schema/CI 无人维护 | 质量门禁形式化 | Maintainer 为 CI Owner；季度检查规则与模板漂移 |
| 指标门槛拍脑袋 | 通过线不可信 | 每个阈值记录来源、样本、置信度和历史基线 |
| 长表/代码印刷仍拥挤 | PDF 不可读 | print pre-wrap、重复表头、图表目录、分册导出 |

## 12. 复评与度量

- 每个版本结束后用同一量表复评 44 页，保存 `reports/chapter-scores-vX.csv`。
- 硬性指标：
  - P0 语义错误：0。
  - 误导性图示：0。
  - 图状文本块：0。
  - material claim 有 source_id：100%。
  - 指标有公式/单位/窗口/Owner：100%。
  - 写工具有 schema/测试/部分成功/回滚定义：100%。
  - 五本手册端到端样例：5/5。
  - 案例原始 artifact + 整改后回归：2/2。
  - 目标尺寸与 print 无阻断：100%。
- 软性指标：3–5 名 SRE 的定位、理解、复用任务通过率；来源过期数；未关闭行动项数。

## 13. Definition of Done

- [ ] 44 页全部完成内容、最佳实践、可读性、可用性、易读性、图示复评。
- [ ] 所有 P0 任务关闭；无书面豁免之外的语义错误。
- [ ] 23 张原图全部复核，新增图全部编号/图注/可读；图状文本为 0。
- [ ] 来源、指标、契约、策略、评测、Runbook、Trace、成本、POC 资产可复现。
- [ ] 五本场景手册各有端到端样例；两个案例有整改后验证。
- [ ] CI、内链、schema、fixture、Mermaid、来源过期检查通过。
- [ ] 320/390/768/1024/1440/print、无障碍和用户阅读测试通过。
- [ ] PDF/EPUB 生成；发布说明、版本、回滚和归档就绪。

## 14. 评估发现到计划的覆盖映射

| 评估发现 | 对应工作包/任务 |
| --- | --- |
| 审批在工具调用后、计划未绑定、回滚语义过度 | WP-01 / SAFE-01～08；CON-01～02；ART-02 |
| 9 张图示语义问题 | WP-02 / DIAG-01 |
| 10 个图状文本块 + 2 个步骤序列 | WP-02 / DIAG-02 |
| 01/09/13 等缺图，手册异常路径不足 | WP-02 / DIAG-03 |
| 厂商 claim 不可追溯、商业字段缺失 | WP-03 / SRC-01～06 |
| SLO/评测/ROI 不可计算 | WP-04 / MET-01～05 |
| 模板不可执行、无 schema/fixtures/CI | WP-05 / CON-01～07 |
| 无 Trace、eval 结果、策略代码、成本模型、POC | WP-06 / ART-01～07 |
| 五本手册深度不均、案例未闭环 | WP-07 / PLAY-01～07 |
| RACI/术语/跨章地图/维护缺失 | WP-08 / MAINT-01～04 |
| print/PDF/无障碍/用户验证不足 | WP-09 / PUB-01～05 |
| 44 页复评与目标分数 | PUB-05 + G5 |

## 15. 前 10 个工作日建议

1. **Day 1**：GOV-01/02，冻结基线，指定 Owner，预订领域/安全审稿人。
2. **Day 2–3**：SAFE-01/02/07，先修审批、回滚和角色权限。
3. **Day 4–5**：SAFE-03/04/05/06/08，修 K8s/GPU/证据包/ROI/状态机。
4. **Day 6–8**：DIAG-01/02，修 9 张图并转换 10+2 文本图。
5. **Day 9**：MET-01/02/03，建立指标 schema、SLO 和发布门禁表。
6. **Day 10**：G1 审稿；未通过项留在 P0，不进入可执行资产阶段。

## 16. 计划审计

- 该计划覆盖评估报告中的 9 类跨章缺口和 P0/P1/P2 路线。
- 初始计划 backlog 为 **57 个任务、89.5 人日**；当前执行 backlog 已扩展为 **73 项、111.0 人日**，每个任务有 ID、优先级、阶段、Owner、依赖、交付物和验收标准。
- 计划不把“写完文档”当作完成；可执行资产、测试、真实/高保真 artifact、复评和用户验证都是门禁。
- 初始状态为 `planned`；当前状态以 backlog 为准：**72 项 completed、PUB-04 in_progress**，不得把初始快照当作当前进度。
