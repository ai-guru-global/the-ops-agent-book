---
layout: page
sidebar: false
aside: false
outline: false
title: The Ops Agent Book
---

<div class="book-home">

<section class="book-hero">
  <div class="book-hero__inner">
    <div class="book-hero__lead-col">
      <h1>运维智能体<br /><em>工程手册</em></h1>
      <p class="book-hero__lead">
        给运维场景做 Agent，难点不在模型，而在证据、权限、变更与可验证性。
        这本书给出一套从规划到退役的工程方法，以及 K8s、RDMA、GPU 推理、数据库与事故指挥五本可以直接照做的场景手册。
      </p>
      <div class="book-hero__actions">
        <a class="book-btn primary" href="./guide/">开始阅读</a>
        <a class="book-btn" href="./playbooks/">场景手册</a>
        <a class="book-btn" href="https://github.com/ai-guru-global/the-ops-agent-book" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
    <aside class="book-hero__aside" aria-label="本书信息">
      <dl class="book-meta">
        <div>
          <dt>版本</dt>
          <dd>v0.1.1 / 2026-11</dd>
        </div>
        <div>
          <dt>结构</dt>
          <dd>5 部分 · 14 章 · 5 本场景手册</dd>
        </div>
        <div>
          <dt>读者</dt>
          <dd>SRE、平台工程师、AI 工程师、架构师</dd>
        </div>
        <div>
          <dt>形态</dt>
          <dd>在线手册 · 可打印 · Mermaid 图解</dd>
        </div>
        <div>
          <dt>案例</dt>
          <dd>2 个合成/脱敏走查</dd>
        </div>
      </dl>
      <ol class="book-stages" aria-label="生命周期阶段">
        <li>Plan</li>
        <li>Design</li>
        <li>Build</li>
        <li>Validate</li>
        <li>Release</li>
        <li>Operate</li>
        <li>Improve</li>
      </ol>
    </aside>
  </div>
</section>

<section class="book-section">
  <h2>运维 Agent 不是一个更聪明的聊天框。</h2>
  <p class="book-section__lead">
    它要读取真实状态、调用真实工具、做出真实变更，并对结果负责。
    这意味着它必须像一套生产系统那样被规划、设计、评测、发布和运营，而不是像一段 Prompt 那样被随手写出来。
  </p>
  <div class="book-thesis">
    <div class="book-thesis__item">
      <h3>运维是“会改变系统”的工作</h3>
      <p>一次错误的删除、一次错误的扩容、一次错误的网络策略，都可能影响生产。Agent 的价值在行动，风险也在行动。</p>
    </div>
    <div class="book-thesis__item">
      <h3>生命周期比 Prompt 重要</h3>
      <p>场景选择、工具契约、权限模型、评测集、灰度发布、回滚、运营复盘，缺任何一环都可能让 Demo 永远停在 Demo。</p>
    </div>
    <div class="book-thesis__item">
      <h3>场景不能泛化</h3>
      <p>K8s、RDMA、GPU 推理的证据、工具和护栏完全不同。方法可以复用，场景必须深潜。</p>
    </div>
  </div>
</section>

<section class="book-section">
  <h2>全书目录</h2>
  <p class="book-section__lead">
    建议按顺序读第一部分，再选一本与你当前场景最接近的册子；如果你已经在生产环境运行 Agent，可以从第 05 章开始。厂商地图用于选型、竞品研究与“自建还是采购”的决策。
  </p>
  <ol class="book-index">
    <li>
      <span class="book-index__num">01</span>
      <div class="book-index__body">
        <h3>方法与生命周期</h3>
        <p>为什么运维 Agent 不一样 · 全生命周期 · 场景选择 · 架构 · 工具与权限 · 上下文 · 评测发布 · 运营迭代 · 组织治理 · Build vs Buy</p>
      </div>
      <a class="book-index__link" href="./guide/">进入 →</a>
    </li>
    <li>
      <span class="book-index__num">02</span>
      <div class="book-index__body">
        <h3>场景手册</h3>
        <p>K8s 集群运维 · RDMA 高网运维 · GPU 推理运维 · 数据库运维 · 事故指挥；每本都包含证据源、工具清单、任务流、护栏、评测与检查清单。</p>
      </div>
      <a class="book-index__link" href="./playbooks/">进入 →</a>
    </li>
    <li>
      <span class="book-index__num">03</span>
      <div class="book-index__body">
        <h3>厂商与产品全景</h3>
        <p>全球云（AWS / Azure / Google / IBM / Oracle / SAP / ServiceNow）· 中国云（阿里 / 华为 / 腾讯 / 百度 / 火山 / 京东 / 移动 / 浪潮）· 可观测/AIOps · 安全/网络/FinOps · 内嵌助手 · 垂直行业。</p>
      </div>
      <a class="book-index__link" href="./vendors/">进入 →</a>
    </li>
    <li>
      <span class="book-index__num">04</span>
      <div class="book-index__body">
        <h3>2026 工程域</h3>
        <p>AgentOps 与可观测性 · 身份/权限/OWASP 安全 · 成本、ROI 与组合管理 · 2027+ 自进化、A2A 与自治运维。</p>
      </div>
      <a class="book-index__link" href="./guide/11-agentops-observability.html">进入 →</a>
    </li>
    <li>
      <span class="book-index__num">05</span>
      <div class="book-index__body">
        <h3>模板与工具箱</h3>
        <p>Agent 设计文档 · 工具契约 · 评测集 · 权限矩阵 · Runbook → Tool 映射 · 发布与回滚清单 · 事故复盘。</p>
      </div>
      <a class="book-index__link" href="./templates/">进入 →</a>
    </li>
    <li>
      <span class="book-index__num">A</span>
      <div class="book-index__body">
        <h3>案例、阿里 Agent 产品全景与参考资料</h3>
        <p>一次 K8s 节点 NotReady 的端到端走查、一个未上线项目的失败复盘；AgentRun、AgentScope、Agent Sandbox/AgentBay、Qoder Cloud Agents、百炼、AgentLoop、Agentic OS 等产品如何映射到生命周期；指标库、术语与来源。</p>
      </div>
      <a class="book-index__link" href="./appendix/case-notready.html">进入 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>五本场景手册</h2>
  <p class="book-section__lead">
    每个场景手册都按同一套结构写：范围与非目标、证据源、工具清单、典型任务流、权限与护栏、评测集、SLO 与失败模式。
  </p>
  <ol class="book-index book-index--compact">
    <li>
      <span class="book-index__num">01</span>
      <div class="book-index__body">
        <h3>K8s 集群运维</h3>
        <p>从 CrashLoopBackOff、Node NotReady 到滚动发布失败和集群升级。</p>
      </div>
      <a class="book-index__link" href="./playbooks/k8s.html">打开 →</a>
    </li>
    <li>
      <span class="book-index__num">02</span>
      <div class="book-index__body">
        <h3>RDMA 高网运维</h3>
        <p>RoCE/IB、PFC/ECN、链路抖动、拓扑与 NCCL 性能回归。</p>
      </div>
      <a class="book-index__link" href="./playbooks/rdma.html">打开 →</a>
    </li>
    <li>
      <span class="book-index__num">03</span>
      <div class="book-index__body">
        <h3>GPU 推理运维</h3>
        <p>TTFT/TPOT、KV Cache、OOM、XID/ECC、模型发布与容量。</p>
      </div>
      <a class="book-index__link" href="./playbooks/gpu-inference.html">打开 →</a>
    </li>
    <li>
      <span class="book-index__num">04</span>
      <div class="book-index__body">
        <h3>数据库运维</h3>
        <p>慢 SQL、锁等待、复制延迟、容量与变更审批。</p>
      </div>
      <a class="book-index__link" href="./playbooks/database.html">打开 →</a>
    </li>
    <li>
      <span class="book-index__num">05</span>
      <div class="book-index__body">
        <h3>事故指挥</h3>
        <p>多 Agent 协同、证据共享、时间线、沟通与升级。</p>
      </div>
      <a class="book-index__link" href="./playbooks/incident-commander.html">打开 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>两个走查：一个成功，一个失败。</h2>
  <p class="book-section__lead">
    方法只有在具体证据、审批和回滚里才站得住。案例均基于合成/脱敏场景，保留真实工程约束，不包含真实客户数据。
  </p>
  <ol class="book-index book-index--compact">
    <li>
      <span class="book-index__num">C1</span>
      <div class="book-index__body">
        <h3>K8s 节点 NotReady</h3>
        <p>从告警、证据包、假设、审批包到 drain、清理、验证与复盘的一次完整闭环。</p>
      </div>
      <a class="book-index__link" href="./appendix/case-notready.html">阅读 →</a>
    </li>
    <li>
      <span class="book-index__num">C2</span>
      <div class="book-index__body">
        <h3>一个没有上线的 Agent</h3>
        <p>为什么 Demo 很好、评测也过，却在灰度前被叫停：权限、Owner、评测集与流程的失败复盘。</p>
      </div>
      <a class="book-index__link" href="./appendix/case-failed-agent.html">阅读 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>厂商与产品全景</h2>
  <p class="book-section__lead">
    独立运维 Agent、云产品内嵌助手、Agent 运行时、AIOps 平台里的 AI、垂直行业 Agent——按产品形态分层，而不是把不同层级混在一张表里比较。
  </p>
  <ol class="book-index book-index--compact">
    <li>
      <span class="book-index__num">01</span>
      <div class="book-index__body">
        <h3>全球云厂商</h3>
        <p>AWS、Microsoft、Google、IBM、Oracle、SAP、ServiceNow、Salesforce。</p>
      </div>
      <a class="book-index__link" href="./vendors/global-cloud.html">查看 →</a>
    </li>
    <li>
      <span class="book-index__num">02</span>
      <div class="book-index__body">
        <h3>中国云厂商</h3>
        <p>阿里、华为、腾讯、百度、火山引擎、京东云、移动云、浪潮与国产 AIOps。</p>
      </div>
      <a class="book-index__link" href="./vendors/china-cloud.html">查看 →</a>
    </li>
    <li>
      <span class="book-index__num">03</span>
      <div class="book-index__body">
        <h3>可观测与 AIOps</h3>
        <p>Datadog、Dynatrace、New Relic、Splunk、PagerDuty、Grafana、BMC、ManageEngine。</p>
      </div>
      <a class="book-index__link" href="./vendors/observability-aiops.html">查看 →</a>
    </li>
    <li>
      <span class="book-index__num">04</span>
      <div class="book-index__body">
        <h3>安全、网络与 FinOps</h3>
        <p>Security Copilot、Palo Alto、CrowdStrike、Cisco、Juniper、Arista、Cloudability。</p>
      </div>
      <a class="book-index__link" href="./vendors/security-network-finops.html">查看 →</a>
    </li>
    <li>
      <span class="book-index__num">05</span>
      <div class="book-index__body">
        <h3>内嵌 Agent 助手</h3>
        <p>M365 Copilot、Azure Copilot、Gemini Cloud Assist、Now Assist、Agentforce、Joule。</p>
      </div>
      <a class="book-index__link" href="./vendors/embedded-assistants.html">查看 →</a>
    </li>
    <li>
      <span class="book-index__num">06</span>
      <div class="book-index__body">
        <h3>垂直行业运维</h3>
        <p>电信 NOC、金融、制造/OT、能源、零售、物流、医疗、政务。</p>
      </div>
      <a class="book-index__link" href="./vendors/vertical-ops.html">查看 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>2026 工程域</h2>
  <p class="book-section__lead">
    AgentOps、身份与安全、成本/ROI、2027+ 路线图——这四章决定 Agent 能不能上生产、能不能算过账、能不能持续演进。
  </p>
  <ol class="book-index book-index--compact">
    <li>
      <span class="book-index__num">11</span>
      <div class="book-index__body">
        <h3>AgentOps 与可观测性</h3>
        <p>OTel GenAI、Trace/Session、工具调用、评测数据飞轮、异常检测与成本归因。</p>
      </div>
      <a class="book-index__link" href="./guide/11-agentops-observability.html">阅读 →</a>
    </li>
    <li>
      <span class="book-index__num">12</span>
      <div class="book-index__body">
        <h3>身份、权限与安全</h3>
        <p>NHI、委托、短时凭证、MCP 信任、OWASP Agentic Top 10 与供应链。</p>
      </div>
      <a class="book-index__link" href="./guide/12-identity-security.html">阅读 →</a>
    </li>
    <li>
      <span class="book-index__num">13</span>
      <div class="book-index__body">
        <h3>成本、ROI 与组合</h3>
        <p>TCO、单位经济、ROI 测算、试点组合与 FinOps 控制。</p>
      </div>
      <a class="book-index__link" href="./guide/13-cost-roi-portfolio.html">阅读 →</a>
    </li>
    <li>
      <span class="book-index__num">14</span>
      <div class="book-index__body">
        <h3>2027+ 路线图</h3>
        <p>自进化、A2A、仿真/数字孪生、形式化保障、监管与能效。</p>
      </div>
      <a class="book-index__link" href="./guide/14-future-roadmap.html">阅读 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>图解索引</h2>
  <p class="book-section__lead">
    全书采用统一的 IBM 蓝线图：白底、蓝色描边、灰色节点、等宽标签。每张图都有编号、图注和正文说明，可打印、可横向滚动。
  </p>
  <ol class="book-figures">
    <li><a href="./guide/"><span>图 01</span>运维 Agent 最小闭环</a><em>导读</em></li>
    <li><a href="./guide/02-lifecycle.html"><span>图 02</span>八阶段与六道门禁</a><em>02</em></li>
    <li><a href="./guide/03-scenario-selection.html"><span>图 03</span>第一个场景的筛选路径</a><em>03</em></li>
    <li><a href="./guide/04-architecture.html"><span>图 04</span>参考架构</a><em>04</em></li>
    <li><a href="./guide/04-architecture.html"><span>图 05</span>一次运行的 State Machine</a><em>04</em></li>
    <li><a href="./guide/05-tools-permissions.html"><span>图 06</span>动作阶梯 L0–L5</a><em>05</em></li>
    <li><a href="./guide/05-tools-permissions.html"><span>图 07</span>审批与护栏判断</a><em>05</em></li>
    <li><a href="./guide/06-context-knowledge.html"><span>图 08</span>五层上下文</a><em>06</em></li>
    <li><a href="./guide/07-evaluation-release.html"><span>图 09</span>评测金字塔与发布阶梯</a><em>07</em></li>
    <li><a href="./guide/08-operate-improve.html"><span>图 10</span>运营反馈闭环</a><em>08</em></li>
    <li><a href="./guide/10-build-vs-buy.html"><span>图 11</span>Build / Buy / Hybrid 决策</a><em>10</em></li>
    <li><a href="./guide/11-agentops-observability.html"><span>图 12</span>AgentOps Trace</a><em>11</em></li>
    <li><a href="./guide/11-agentops-observability.html"><span>图 13</span>评测数据飞轮</a><em>11</em></li>
    <li><a href="./guide/12-identity-security.html"><span>图 14</span>身份与委托链</a><em>12</em></li>
    <li><a href="./guide/14-future-roadmap.html"><span>图 15</span>2026–2028 路线图</a><em>14</em></li>
    <li><a href="./playbooks/k8s.html"><span>图 16</span>K8s NotReady 诊断流</a><em>K8s</em></li>
    <li><a href="./playbooks/rdma.html"><span>图 17</span>RDMA fabric 拓扑</a><em>RDMA</em></li>
    <li><a href="./playbooks/gpu-inference.html"><span>图 18</span>GPU 推理 triage</a><em>GPU</em></li>
    <li><a href="./playbooks/database.html"><span>图 19</span>数据库慢 SQL triage</a><em>数据库</em></li>
    <li><a href="./playbooks/incident-commander.html"><span>图 20</span>事故指挥流程</a><em>事故</em></li>
    <li><a href="./vendors/"><span>图 21</span>五类产品形态</a><em>厂商</em></li>
    <li><a href="./appendix/case-notready.html"><span>图 22</span>NotReady 取证与审批时序</a><em>案例</em></li>
    <li><a href="./appendix/case-failed-agent.html"><span>图 23</span>失败项目因果链</a><em>案例</em></li>
  </ol>
</section>

<section class="book-section">
  <h2>三条阅读路径</h2>
  <ol class="book-index book-index--compact">
    <li>
      <span class="book-index__num">第一次做</span>
      <div class="book-index__body">
        <h3>从 0 到 1 做一个运维 Agent</h3>
        <p>导读 → 01–03 → 选一本场景手册 → 用模板写设计文档与评测集。</p>
      </div>
      <a class="book-index__link" href="./guide/">开始 →</a>
    </li>
    <li>
      <span class="book-index__num">要上生产</span>
      <div class="book-index__body">
        <h3>已有 Agent，准备进入生产</h3>
        <p>05 工具与权限 → 07 评测发布 → 08 运营迭代 → 模板中的权限矩阵、发布清单与复盘模板。</p>
      </div>
      <a class="book-index__link" href="./guide/05-tools-permissions.html">开始 →</a>
    </li>
    <li>
      <span class="book-index__num">平台团队</span>
      <div class="book-index__body">
        <h3>建设可复用的 Agent 能力</h3>
        <p>04 架构 → 05 工具与权限 → 09 组织治理 → 10 Build vs Buy → 附录阿里 Agent 产品全景。</p>
      </div>
      <a class="book-index__link" href="./guide/04-architecture.html">开始 →</a>
    </li>
  </ol>
</section>

<section class="book-section">
  <h2>五条工程原则</h2>
  <ol class="book-principles">
    <li><span>01</span><p>先做只读 Copilot，再做受控执行，最后才谈自治。</p></li>
    <li><span>02</span><p>证据先于结论，验证先于关闭。</p></li>
    <li><span>03</span><p>权限按工具、资源、环境、时间收紧。</p></li>
    <li><span>04</span><p>每次变更都要有 dry-run、审批与回滚。</p></li>
    <li><span>05</span><p>Agent 是产品，不是一次性 Prompt。</p></li>
  </ol>
</section>

<section class="book-cta">
  <div class="book-cta__inner">
    <h2>从第一本场景手册开始。</h2>
    <p>
      如果你正在设计 K8s 集群运维、RDMA 高网运维或 GPU 推理运维 Agent，先读对应的场景手册；
      如果你还在判断该不该做，从第 01 章开始。
    </p>
    <div class="book-cta__actions">
      <a class="book-btn primary" href="./guide/">阅读导读</a>
      <a class="book-btn" href="./playbooks/">打开场景手册</a>
      <a class="book-btn" href="./templates/">取用模板</a>
    </div>
  </div>
</section>

</div>
