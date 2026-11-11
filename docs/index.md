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
    <div>
      <div class="book-hero__meta">Field Manual · V0.1 · 2026</div>
      <h1>运维智能体<br /><em>工程手册</em></h1>
      <div class="book-hero__sub">The Ops Agent Book</div>
      <p class="book-hero__lead">
        给运维场景做 Agent，难点不在模型，而在证据、权限、变更与可验证性。
        这本书给出一套从规划到退役的工程方法，以及 K8s、RDMA、GPU 推理三本可以直接照做的场景手册。
      </p>
      <div class="book-hero__actions">
        <a class="book-btn primary" href="./guide/">开始阅读</a>
        <a class="book-btn" href="./playbooks/">场景手册</a>
        <a class="book-btn" href="https://github.com/ai-guru-global/the-ops-agent-book" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </div>
    <aside class="book-hero__panel">
      <div class="book-hero__panel-label">本书结构 / Contents</div>
      <div class="book-hero__parts">
        <div class="book-hero__part">
          <div class="book-hero__part-num">01</div>
          <div>
            <div class="book-hero__part-title">方法与生命周期</div>
            <div class="book-hero__part-note">10 章：场景选择、架构、工具权限、上下文、评测、运营、治理、平台选型</div>
          </div>
        </div>
        <div class="book-hero__part">
          <div class="book-hero__part-num">02</div>
          <div>
            <div class="book-hero__part-title">场景手册</div>
            <div class="book-hero__part-note">K8s 集群、RDMA 高网、GPU 推理、数据库、事故指挥</div>
          </div>
        </div>
        <div class="book-hero__part">
          <div class="book-hero__part-num">03</div>
          <div>
            <div class="book-hero__part-title">厂商与产品全景</div>
            <div class="book-hero__part-note">全球云、中国云、可观测/AIOps、安全/网络/FinOps、内嵌助手、垂直行业</div>
          </div>
        </div>
        <div class="book-hero__part">
          <div class="book-hero__part-num">04</div>
          <div>
            <div class="book-hero__part-title">模板与工具箱</div>
            <div class="book-hero__part-note">设计文档、工具契约、评测集、权限矩阵、Runbook 映射、发布清单</div>
          </div>
        </div>
      </div>
      <div class="book-stages">
        <div class="book-stage">Plan</div>
        <div class="book-stage">Design</div>
        <div class="book-stage">Build</div>
        <div class="book-stage">Validate</div>
        <div class="book-stage">Release</div>
        <div class="book-stage">Operate</div>
        <div class="book-stage">Improve</div>
      </div>
    </aside>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Why this book</div>
  <h2>运维 Agent 不是一个更聪明的聊天框。</h2>
  <p class="book-section__lead">
    它要读取真实状态、调用真实工具、做出真实变更，并对结果负责。
    这意味着它必须像一套生产系统那样被规划、设计、评测、发布和运营，而不是像一段 Prompt 那样被随手写出来。
    这本书写给 SRE、平台工程师、AI 工程师、运维产品经理与架构师。
  </p>
  <div class="book-columns">
    <div class="book-column">
      <div class="book-column__num">01</div>
      <h3>运维是“会改变系统”的工作</h3>
      <p>一次错误的删除、一次错误的扩容、一次错误的网络策略，都可能影响生产。Agent 的价值在行动，风险也在行动。</p>
    </div>
    <div class="book-column">
      <div class="book-column__num">02</div>
      <h3>生命周期比 Prompt 重要</h3>
      <p>场景选择、工具契约、权限模型、评测集、灰度发布、回滚、运营复盘，缺任何一环都可能让 Demo 永远停在 Demo。</p>
    </div>
    <div class="book-column">
      <div class="book-column__num">03</div>
      <h3>场景不能泛化</h3>
      <p>K8s、RDMA、GPU 推理的证据、工具和护栏完全不同。方法可以复用，场景必须深潜。</p>
    </div>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Contents</div>
  <h2>全书目录</h2>
  <p class="book-section__lead">
    建议按顺序读第一部分，再选一本与你当前场景最接近的册子；如果你已经在生产环境运行 Agent，可以从第 05 章开始。厂商地图用于选型、竞品研究与“自建还是采购”的决策。
  </p>
  <div class="book-toc">
    <div class="book-toc__row">
      <div class="book-toc__part">Part 01</div>
      <div>
        <div class="book-toc__title">方法与生命周期</div>
        <div class="book-toc__note">为什么运维 Agent 不一样 · 全生命周期 · 场景选择 · 架构 · 工具与权限 · 上下文 · 评测发布 · 运营迭代 · 组织治理 · Build vs Buy</div>
      </div>
      <a class="book-toc__link" href="./guide/01-why-ops-agents.html">进入 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">Part 02</div>
      <div>
        <div class="book-toc__title">场景手册</div>
        <div class="book-toc__note">K8s 集群运维 · RDMA 高网运维 · GPU 推理运维 · 数据库运维 · 事故指挥；每本都包含证据源、工具清单、任务流、护栏、评测与检查清单。</div>
      </div>
      <a class="book-toc__link" href="./playbooks/">进入 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">Part 03</div>
      <div>
        <div class="book-toc__title">厂商与产品全景</div>
        <div class="book-toc__note">全球云（AWS / Azure / Google / IBM / Oracle / SAP / ServiceNow）· 中国云（阿里 / 华为 / 腾讯 / 百度 / 火山 / 京东 / 移动 / 浪潮）· 可观测/AIOps · 安全/网络/FinOps · 内嵌助手 · 垂直行业。</div>
      </div>
      <a class="book-toc__link" href="./vendors/">进入 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">Part 04</div>
      <div>
        <div class="book-toc__title">模板与工具箱</div>
        <div class="book-toc__note">Agent 设计文档 · 工具契约 · 评测集 · 权限矩阵 · Runbook → Tool 映射 · 发布与回滚清单 · 事故复盘。</div>
      </div>
      <a class="book-toc__link" href="./templates/">进入 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">Appendix</div>
      <div>
        <div class="book-toc__title">阿里 Agent 产品全景与参考资料</div>
        <div class="book-toc__note">官方 Agent 服务目录之外，AgentRun、AgentScope、Agent Sandbox/AgentBay、Qoder Cloud Agents、百炼、AgentLoop、Agentic OS 等产品如何映射到生命周期；指标库、术语与来源。</div>
      </div>
      <a class="book-toc__link" href="./appendix/alibaba-agent-landscape.html">进入 →</a>
    </div>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Playbooks</div>
  <h2>从三个最难的场景开始。</h2>
  <p class="book-section__lead">
    每个场景手册都按同一套结构写：范围与非目标、证据源、工具清单、典型任务流、权限与护栏、评测集、SLO 与失败模式。
  </p>
  <div class="book-scenarios">
    <a class="book-scenario" href="./playbooks/k8s.html">
      <div class="book-scenario__id">PLAYBOOK 01</div>
      <h3>K8s 集群运维</h3>
      <p>从 CrashLoopBackOff、Node NotReady 到滚动发布失败和集群升级。</p>
    </a>
    <a class="book-scenario" href="./playbooks/rdma.html">
      <div class="book-scenario__id">PLAYBOOK 02</div>
      <h3>RDMA 高网运维</h3>
      <p>RoCE/IB、PFC/ECN、链路抖动、拓扑与 NCCL 性能回归。</p>
    </a>
    <a class="book-scenario" href="./playbooks/gpu-inference.html">
      <div class="book-scenario__id">PLAYBOOK 03</div>
      <h3>GPU 推理运维</h3>
      <p>TTFT/TPOT、KV Cache、OOM、XID/ECC、模型发布与容量。</p>
    </a>
    <a class="book-scenario" href="./playbooks/database.html">
      <div class="book-scenario__id">PLAYBOOK 04</div>
      <h3>数据库运维</h3>
      <p>慢 SQL、锁等待、复制延迟、容量与变更审批。</p>
    </a>
    <a class="book-scenario" href="./playbooks/incident-commander.html">
      <div class="book-scenario__id">PLAYBOOK 05</div>
      <h3>事故指挥</h3>
      <p>多 Agent 协同、证据共享、时间线、沟通与升级。</p>
    </a>
    <a class="book-scenario" href="./playbooks/">
      <div class="book-scenario__id">OVERVIEW</div>
      <h3>场景手册导读</h3>
      <p>如何选择第一本册子，以及三本手册共享的设计语言。</p>
    </a>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Vendor map</div>
  <h2>覆盖主要厂商，而不是只列阿里。</h2>
  <p class="book-section__lead">
    独立运维 Agent、云产品内嵌助手、Agent 运行时、AIOps 平台里的 AI、垂直行业 Agent——按产品形态分层，而不是把不同层级混在一张表里比较。
  </p>
  <div class="book-scenarios">
    <a class="book-scenario" href="./vendors/global-cloud.html">
      <div class="book-scenario__id">VENDORS 01</div>
      <h3>全球云厂商</h3>
      <p>AWS、Microsoft、Google、IBM、Oracle、SAP、ServiceNow、Salesforce。</p>
    </a>
    <a class="book-scenario" href="./vendors/china-cloud.html">
      <div class="book-scenario__id">VENDORS 02</div>
      <h3>中国云厂商</h3>
      <p>阿里、华为、腾讯、百度、火山引擎、京东云、移动云、浪潮与国产 AIOps。</p>
    </a>
    <a class="book-scenario" href="./vendors/observability-aiops.html">
      <div class="book-scenario__id">VENDORS 03</div>
      <h3>可观测与 AIOps</h3>
      <p>Datadog、Dynatrace、New Relic、Splunk、PagerDuty、Grafana、BMC、ManageEngine。</p>
    </a>
    <a class="book-scenario" href="./vendors/security-network-finops.html">
      <div class="book-scenario__id">VENDORS 04</div>
      <h3>安全、网络与 FinOps</h3>
      <p>Security Copilot、Palo Alto、CrowdStrike、Cisco、Juniper、Arista、Cloudability。</p>
    </a>
    <a class="book-scenario" href="./vendors/embedded-assistants.html">
      <div class="book-scenario__id">VENDORS 05</div>
      <h3>内嵌 Agent 助手</h3>
      <p>M365 Copilot、Azure Copilot、Gemini Cloud Assist、Now Assist、Agentforce、Joule。</p>
    </a>
    <a class="book-scenario" href="./vendors/vertical-ops.html">
      <div class="book-scenario__id">VENDORS 06</div>
      <h3>垂直行业运维</h3>
      <p>电信 NOC、金融、制造/OT、能源、零售、物流、医疗、政务。</p>
    </a>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Reading paths</div>
  <h2>三条阅读路径</h2>
  <div class="book-toc">
    <div class="book-toc__row">
      <div class="book-toc__part">第一次做</div>
      <div>
        <div class="book-toc__title">从 0 到 1 做一个运维 Agent</div>
        <div class="book-toc__note">导读 → 01–03 → 选一本场景手册 → 用模板写设计文档与评测集。</div>
      </div>
      <a class="book-toc__link" href="./guide/">开始 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">要上生产</div>
      <div>
        <div class="book-toc__title">已有 Agent，准备进入生产</div>
        <div class="book-toc__note">05 工具与权限 → 07 评测发布 → 08 运营迭代 → 模板中的权限矩阵、发布清单与复盘模板。</div>
      </div>
      <a class="book-toc__link" href="./guide/05-tools-permissions.html">开始 →</a>
    </div>
    <div class="book-toc__row">
      <div class="book-toc__part">平台团队</div>
      <div>
        <div class="book-toc__title">建设可复用的 Agent 能力</div>
        <div class="book-toc__note">04 架构 → 05 工具与权限 → 09 组织治理 → 10 Build vs Buy → 附录阿里 Agent 产品全景。</div>
      </div>
      <a class="book-toc__link" href="./guide/04-architecture.html">开始 →</a>
    </div>
  </div>
</section>

<section class="book-section">
  <div class="book-kicker">Principles</div>
  <h2>五条工程原则</h2>
  <div class="book-principles">
    <div class="book-principle">
      <div class="book-principle__num">01</div>
      <p>先做只读 Copilot，再做受控执行，最后才谈自治。</p>
    </div>
    <div class="book-principle">
      <div class="book-principle__num">02</div>
      <p>证据先于结论，验证先于关闭。</p>
    </div>
    <div class="book-principle">
      <div class="book-principle__num">03</div>
      <p>权限按工具、资源、环境、时间收紧。</p>
    </div>
    <div class="book-principle">
      <div class="book-principle__num">04</div>
      <p>每次变更都要有 dry-run、审批与回滚。</p>
    </div>
    <div class="book-principle">
      <div class="book-principle__num">05</div>
      <p>Agent 是产品，不是一次性 Prompt。</p>
    </div>
  </div>
</section>

<div class="book-cta">
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

</div>
