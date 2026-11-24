# 改进执行状态

更新时间：2026-11-24  
当前版本：v0.2.0-rc1  
执行清单：[improvement-backlog.csv](./improvement-backlog.csv)

## 当前进度

- 总任务：57
- 已完成：35
- 进行中：6
- 未开始：16

P0 的 19 项任务已全部完成；P1 已提前完成 14 项，另有 6 项进行中。当前尚未达到 v1.0-rc1，不标记总目标完成。

## 已通过的质量门禁

- `npm run docs:build`：通过。
- `npm run validate:assets`：通过；35 张图、46 个来源、33 个被引用 source_id、Schema/JSON/YAML/ROI 重算均通过。
- `python3 scripts/check_internal_links.py`：0 断链。
- `npm run check:mermaid`：35/35 张 Mermaid 在 25 个页面实际渲染为 SVG。
- `bash -n examples/playbooks/*.sh`：通过。
- `python3 -m py_compile examples/playbooks/*.py`：通过。
- `npm run check:all`：完整通过。

## 本轮完成的核心内容

1. **安全与语义**：审批前置于工具调用；绑定不可变计划哈希/版本/有效期；重新校验；uncordon/drain/清理/复位的部分成功、补偿与安全恢复；只读快路径；异常状态机。
2. **图示**：图示从 23 张扩展到 35 张，修正 9 张重点图，转换全部图状文本块与步骤序列；新增治理、单位经济、A2A、设计架构、场景准入门禁等图。
3. **来源与厂商**：46 条来源注册、claim→source_id 回指、商业字段证据卡、review_by；不可核实断言显式标注。
4. **指标与财务**：metric/agent-event Schema、SLO/评测/发布门禁、Judge 校准、ROI 全成本与敏感性/盈亏平衡。
5. **可执行模板**：工具契约、权限策略、Runbook、评测 manifest、发布与复盘 YAML；对应示例与 Schema。
6. **场景手册**：五本手册均有端到端样例；K8s/RDMA/GPU/数据库/事故指挥补命令、SQL、计数器差分、显存账、Severity/RACI 与异常状态。
7. **案例**：NotReady 案例补齐配置 diff、PDB 前置检查、双人审批、部分成功、补偿与整改后 6/6 回归；Trace/工具契约/权限策略 artifact 已落地。

## 进行中

| 任务 | 当前状态 | 剩余工作 |
| --- | --- | --- |
| DIAG-04 | 35 图已有编号、图注和 IBM 样式 | 补 alt text 与图示维护规范 |
| DIAG-05 | 35 图桌面渲染通过 | 执行 320/390/768/1024/1440/print 全矩阵 |
| SRC-04 | 快照计划已记录 | 下载并归档关键官方快照 |
| SRC-05 | 厂商页已有 review_by | 为其余事实页补 Owner/review_by |
| CON-03 | manifest 与 starter cases 已建立 | 实现 runner，补齐 400 条分层案例 |
| CON-06 | 本地 `check:all` 与 CI workflow 已建立 | 推送后运行远端 CI |

## 下一阶段优先顺序

1. **WP-06 参考实现**：实现 MCP/OpenAPI 工具网关、PEP、不可变审批、短时凭证、撤销、影子/灰度/回滚脚本。
2. **PLAY-07 失败案例闭环**：补正式否决记录、整改 Owner、复评与重新准入结论。
3. **CON-03 评测 runner**：让 manifest、fixtures、报告可实际运行。
4. **DIAG-04/05 与 SRC-04/05**：完成图示规范、六尺寸验证、快照和全书 review_by。
5. **WP-08/09**：治理矩阵、术语注册表、需求地图、PDF/EPUB、无障碍、用户阅读测试与 44 页复评。

## 发布状态

本轮未提交、未推送、未部署。当前改动仍在本地工作区，避免在 G1/G2 与远端 CI 未确认前自动发布。
