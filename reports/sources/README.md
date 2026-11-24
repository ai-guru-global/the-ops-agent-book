# 来源追溯检查

最后核实：2026-11-24；复核截止：2027-02-22。

## 交付内容

- 机器可读注册表：`sources/registry.yaml`，共 46 条来源（33 official_doc、9 public_report、4 community、0 official_release）。
- 阅读版注册表：`docs/appendix/source-registry.md`，记录来源 ID、类型、访问日、review_by、适用 claim 与快照计划。
- 厂商页、阿里附录与 references 使用稳定 `claim_id → source_id`；商业字段单列证据卡。
- 官方营销页只证明“厂商如此宣称”，不等于生产能力、SLA、区域、客户规模或商业条款证明。
- 动态目录数量不再作为当前事实；本轮未重新计数。

## 检查结果

- PyYAML 解析：通过。
- 必填字段、来源类型枚举、ISO 日期、review_by 晚于 accessed_at、source_id 唯一性：通过。
- 注册表中的 54 个可核验 claim 全部在目标文档出现，且能力行没有未绑定来源。
- 10 条抽查：10/10 通过：
  - GC-AWS-01 → SRC-AWS-DEVOPS-001
  - GC-AWS-02 → SRC-AWS-QDEV-001
  - GC-MS-01 → SRC-MS-SRE-001
  - GC-MS-02 → SRC-MS-COPILOT-001
  - GC-IBM-03 → SRC-IBM-ORCH-001
  - OBS-01 → SRC-DD-AI-001
  - OBS-08 → SRC-ELASTIC-AI-001
  - SEC-04 → SRC-CS-CHARLOTTE-001
  - FIN-01 → SRC-IBM-CLOUDABILITY-001
  - ALI-02 → SRC-ALI-AGENTRUN-001
- `python3 scripts/check_internal_links.py`：通过，`All internal links resolve.`
- `npm run docs:build`：通过；仅有既有 promql 高亮回退与 chunk 大小警告。
- Mermaid 图示系统未修改；`docs/vendors/index.md` 的图 21 保持原样。

## 未核实字段

- 状态：除 AWS DevOps Agent 的 Release Management Preview、Azure Copilot migration agent public preview、Amazon Q Developer IDE 插件 2027-04-30 停止支持、Elastic AI Assistant 文档明示 GA，以及 AgentScope Experimental 子功能外，多数产品整体 GA/预览状态未核实。
- 区域：除 AgentBay 产品页宣称 Singapore 外，完整区域清单均未核实；控制台区域链接不作为区域清单。
- 许可/计费：AgentCore 按量、AWS Quick 按 user/month、Azure SRE Agent AAU、GitHub Copilot credits、CrowdStrike 符合条件客户每月 50 AI credits、Agentforce Flex Credits/Resolutions/per-user、Elastic Managed LLM 额外收费等有局部证据；其余单位未核实。
- 最低消费/超额：多数未核实；IBM Instana/watsonx Orchestrate 结构化最低价单位与地区不清，未采用。
- 数据驻留：普遍未核实；AgentRun 的网络隔离/私有化、Elastic 第三方 provider、New Relic 合规限制等只记录页面明确边界，不推断具体位置。
- 导出/退出：全部未核实。

Google Cloud、Oracle、SAP、ServiceNow 产品正文，以及 Microsoft Security Copilot、Dynatrace、PagerDuty、Sumo Logic、LogicMonitor、BigPanda、OpsRamp、ManageEngine、SolarWinds、Cisco、Juniper、SentinelOne、Kubecost 等未取得足够官方正文，相关能力与商业字段保留“未核实”。

## 快照计划

永久快照尚未下载。优先保存 AWS DevOps Agent、Amazon Q Developer 停服提示、AgentRun、Elastic AI Assistant、CrowdStrike Charlotte AI、Azure SRE Agent 正文与访问时间；社区来源同时记录 commit SHA。路径确定后回填 YAML `snapshot` 字段。

## 复核方法

```bash
python3 - <<'PY'
import yaml
from datetime import date
with open('sources/registry.yaml', encoding='utf-8') as f:
    data = yaml.safe_load(f)
required = {'source_id', 'title', 'url', 'type', 'accessed_at', 'review_by', 'notes'}
allowed = {'official_doc', 'official_release', 'public_report', 'community'}
ids = [s['source_id'] for s in data['sources']]
assert len(ids) == len(set(ids))
for s in data['sources']:
    assert required <= set(s)
    assert s['type'] in allowed
    assert date.fromisoformat(s['accessed_at']) <= date.fromisoformat(s['review_by'])
print(f"OK: {len(ids)} sources")
PY
python3 scripts/check_internal_links.py
npm run docs:build
```

本报告不引用、不修改 `reports/backlog`。
