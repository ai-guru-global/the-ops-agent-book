# 改进执行状态

更新时间：2026-11-25
当前版本：v0.2.0-rc1
执行清单：[improvement-backlog.csv](./improvement-backlog.csv)

## 当前进度

- 总任务：57
- 已完成：55
- 进行中：0
- 未开始：2

P0、P1 与大部分 P2 已完成。剩余两项是真实用户阅读测试（PUB-04）和按同一量表复评 44 页并作出 v1.0-rc1 发布决策（PUB-05）。

## 已通过的质量门禁

- `npm run docs:build`：通过。
- `npm run validate:assets`：通过；35 张图、48 个来源、9 个正文快照、Schema/JSON/YAML/ROI/Trace 均通过。
- `python3 scripts/check_internal_links.py`：0 断链。
- `npm run check:mermaid`：35/35 张 Mermaid 在 25 个页面实际渲染为 SVG。
- `npm run check:responsive`：25 个页面/尺寸组合通过，生成 A4 打印样本。
- `npm run check:accessibility`：8 个页面/尺寸组合无 serious/critical WCAG 2.1 AA 问题。
- `npm run test:reference`：17/17 通过。
- `npm run eval:self-test`：14/14 通过，含 5 类负向控制与 synthetic 基线回归。
- `npm run cost:demo`：18 个 derived、14 个敏感性数值全部对账。
- `npm run check:all`：完整通过。
- 远端 Book quality workflow：成功（run 45443164237）。

## 已落地的核心资产

1. **安全与语义**：审批前置于工具调用；不可变计划哈希、版本、有效期与重校验；drain/uncordon/清理/复位的部分成功、补偿与安全恢复；只读快路径与异常状态机。
2. **图示**：35 张统一 IBM 风格 Mermaid 图，全部有编号和图注；新增 aria 关联、减少动态效果支持与图示规范。
3. **来源与维护**：48 条来源注册、claim→source_id 回指、商业字段证据卡、9 个正文快照与 SHA-256、47 个内容页维护元数据。
4. **指标与财务**：metric/agent-event Schema、SLO/评测/发布门禁、Judge 校准、ROI 全成本与敏感性/盈亏平衡。
5. **可执行模板**：工具契约、权限策略、Runbook、评测 manifest、发布与复盘 YAML；对应 Schema 与示例。
6. **参考实现**：纯 Node.js synthetic runtime，包含 PEP、审批、短时凭证、撤销、工具网关、Trace 哈希链、Shadow/Canary/Rollback。
7. **评测与成本**：NotReady 案例集成 reference core；5 类故障注入负向控制；synthetic 基线与回归对比；可复算成本模型。
8. **场景与案例**：五本手册均有端到端样例；NotReady 与失败 Agent 案例形成证据、整改、复评和再准入闭环。
9. **出版**：全书 PDF 407 页、EPUB 48 章，均带图表与页码/目录；打印代码换行与重复表头已处理。

## 剩余工作

| 任务 | 状态 | 说明 |
| --- | --- | --- |
| PUB-04 | planned | 需要邀请真实 SRE/平台工程师完成定位、理解、复用三类任务；自动化检查不能替代真实用户测试 |
| PUB-05 | planned | 按同一七维度量表复评 44 页，形成 v1.0-rc1 Go/No-Go 决策 |

## 发布状态

代码与文档已提交并推送：`c435fd8`。远端 Book quality 全部通过。GitHub Pages 尚未重新部署，等待 PUB-05 的发布决策；PDF/EPUB 已生成在本地 `dist-pdf/` 与 `dist-epub/`。
