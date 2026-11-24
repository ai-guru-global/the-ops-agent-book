# 改进执行状态

更新时间：2026-11-25当前版本：v0.2.0-rc1执行清单：[improvement-backlog.csv](./improvement-backlog.csv)复评与决策：[re-evaluation.md](./re-evaluation.md)

## 当前进度

- 总任务：57
- 已完成：56
- 进行中：1
- 未开始：0

唯一未完成项是 PUB-04 真实用户阅读测试。测试协议已准备，但必须由 3–5 名真实 SRE/平台工程师执行；自动化检查、合成 reviewer 与参考实现测试不能替代。

## 复评与发布决策

- 原 44 页可比均分：3.52 → **4.10**。
- 新增 4 页均分：**4.07**。
- 现行 48 页均分：**4.10/5**；v1.0-rc1 目标为 4.36。
- **v1.0-rc1 No-Go**，继续保留 v0.2.0-rc1。
- 主要短板：厂商逐产品证据、图示覆盖、真实用户测试、400 条 suite 与独立 300 条 Judge 校准。

## 本轮补齐

1. **P1 实现修正**：K8s PID 指标、PostgreSQL 阻塞链语义、事故部分成功/未知结果、RDMA 五窗口采样、Runbook 幂等键、评测 Rubric 一致性。
2. **校准门禁**：60 条 Agent confidence 校准与 300 条独立 Judge 验收校准分离；Judge starter 明确为 0/300，未完成不得 release-ready。
3. **图示覆盖**：在 35 张图基础上补齐 8 张厂商页图和 7 张关键模板页图，总计 50 张；旧图号不重排。
4. **维护与导出**：来源日期同步、维护注册表自登记、首页 PDF/EPUB 与复现入口；宽表增加键盘可访问滚动容器，打印时完整展开。
5. **决策证据**：48 页 v2 评分、No-Go 报告、真实用户测试协议；本地 PDF 553 页、EPUB 48 章已重新生成并校验。
6. **厂商补证**：来源注册表增至 144 条、正文快照 105 份；111 个证据缺口 claim 机器可读，91 个已绑定 source_id；未核实字段不默认通过。
7. **评测资产**：400 条 synthetic K8s 案例（40/60/300，五类各 80）与 400 份本地快照 fixture；确定性生成、SHA-256、负向控制与 14 项 self-test 通过；报告仍为 INCONCLUSIVE。
8. **POC 示例**：填写的 synthetic POC 73/100、INCONCLUSIVE；17/17 参考测试、400-case self-test、干净目录导入、Shadow/rollback 与 26 项制品哈希通过；真实 TCO/商务退出未完成。
9. **Judge 校准工具**：300 条独立候选池、答案键、快照 registry、双人标注/独立裁决 CLI 与 κ/召回报告已就绪；真实标注 0/300，release_ready=false。

## 质量门禁

最终结果以本轮 `npm run check:all` 与远端 Book quality 为准。已覆盖：

- VitePress 构建、Schema/JSON/YAML/资产校验、内部链接。
- 50 张 Mermaid 实际渲染、编号、图注与图状文本残留检查。
- 320/390/768/1024/1440 与 A4 打印、WCAG 2.1 AA。
- 参考实现 17/17、eval self-test 14/14、5 类负向控制与 synthetic 基线回归。
- 成本模型 18 个 derived 与 14 个敏感性数值对账。
- Shell/Python 语法、Runbook Schema、Trace 哈希链、来源快照 SHA-256。

## 剩余工作

| 任务 | 状态 | 关闭条件 |
| --- | --- | --- |
| PUB-04 真实用户阅读测试 | in_progress | 3–5 名真实 SRE/平台工程师完成定位、理解、复用与窄屏/打印任务；critical/serious 问题关闭并留下脱敏结果 |
| 400 条 suite | open | synthetic 案例与快照 fixture 已齐；仍需真实模型/工具运行、原始 Trace 与独立验收 |
| 独立 Judge 校准 | open | 300 条候选已就绪；仍需双人标注、裁决、一致性/κ/召回达标并签署 |
| 厂商采购证据 | open | 关键商业字段有逐产品来源与快照；未核实项不得支持采购结论 |

## 发布状态

代码、文档、合成资产与报告已推送至远端提交 `af68e6c`；Docs check 与 Book quality（run `45495476488`）全部通过，可发布为 v0.2.0-rc1。PDF/EPUB 为本地生成产物，不是 GitHub Pages 发布资产。真实用户测试与生产/采购证据未完成前，不声明 v1.0-rc1 或生产就绪。
