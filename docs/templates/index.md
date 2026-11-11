---
title: 模板导读
description: 七个可直接复用的运维 Agent 交付物模板与使用方式。
---

# 模板导读

> 模板不是让你少想，而是让你不要漏想。每个模板都对应生命周期中的一个门禁。

## 七个模板

| 模板 | 用在哪 | 主要读者 | 对应门禁 |
| --- | --- | --- | --- |
| [Agent 设计文档](./agent-design-doc) | Design | 领域专家、平台、安全 | G1 |
| [工具契约](./tool-contract) | Design / Build | 工具 owner、平台 | G1/G2 |
| [评测集](./eval-set) | Validate | 评测 owner、领域专家 | G3 |
| [权限矩阵](./permission-matrix) | Design / Release | 安全、平台、值班 | G1/G4 |
| [Runbook → Tool 映射](./runbook-tool-map) | Design / Build | 领域专家、Agent 工程师 | G1/G2 |
| [发布与回滚清单](./release-checklist) | Release | Agent Owner、值班 | G4 |
| [事故复盘](./incident-review) | Operate / Improve | 事故负责人、团队 | G5 |

## 使用方式

1. 复制模板到你的项目仓库（不要直接改本仓库的模板作为项目文档）。
2. 用你的场景替换示例；保留不适用的章节并标注 “N/A + 原因”。
3. 在 G1/G3/G4 评审中逐项检查。
4. 每次重大变更后更新模板中的版本、评测与回滚信息。

::: warning 不要为了填模板而填
如果某个字段没有答案，写“未决”并分配 owner，而不是编一个看起来完整的答案。
:::

下一篇：[Agent 设计文档](./agent-design-doc)
