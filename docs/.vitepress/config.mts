import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import container from "markdown-it-container";

const base = process.env.GITHUB_PAGES ? "/the-ops-agent-book/" : "/";

export default withMermaid(defineConfig({
  lang: "zh-CN",
  title: "The Ops Agent Book",
  titleTemplate: ":title · 运维智能体工程手册",
  description:
    "面向运维场景的智能体最佳实践：全生命周期的规划、设计、建设、维护、优化与迭代。包含 K8s、RDMA 高网、GPU 推理等场景手册。",
  base,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
    ["meta", { name: "theme-color", content: "#ffffff" }],
    [
      "meta",
      {
        name: "description",
        content:
          "The Ops Agent Book：面向运维场景的智能体工程手册。覆盖规划、设计、建设、维护、优化、迭代，以及 K8s、RDMA、GPU 推理等场景。",
      },
    ],
  ],
  markdown: {
    config: (md: any) => {
      md.use(container, "diagram", {
        render: (tokens: any[], idx: number) => {
          const token = tokens[idx];
          if (token.nesting === 1) {
            const raw = token.info.trim().slice("diagram".length).trim();
            const [title, ...noteParts] = raw.split("|");
            const note = noteParts.join("|").trim();
            const titleHtml = title.trim()
              ? `<p class="custom-block-title">${md.utils.escapeHtml(
                  title.trim()
                )}</p>`
              : "";
            const noteHtml = note
              ? `<p class="diagram-note">${md.utils.escapeHtml(note)}</p>`
              : "";
            return `<div class="custom-block diagram"><div class="diagram-head">${titleHtml}${noteHtml}</div>\n`;
          }
          return "</div>\n";
        },
      });
    },
  },
  themeConfig: {
    logo: "/favicon.svg",
    siteTitle: "The Ops Agent Book",
    nav: [
      { text: "导读", link: "/guide/" },
      { text: "方法", link: "/guide/01-why-ops-agents" },
      { text: "场景手册", link: "/playbooks/" },
      { text: "厂商", link: "/vendors/" },
      { text: "工程域", link: "/guide/11-agentops-observability" },
      { text: "模板", link: "/templates/" },
      { text: "案例", link: "/appendix/case-notready" },
      { text: "附录", link: "/appendix/alibaba-agent-landscape" },
    ],
    sidebar: [
      {
        text: "开始阅读",
        items: [{ text: "导读：为什么写这本书", link: "/guide/" }],
      },
      {
        text: "第一部分 · 方法与生命周期",
        items: [
          { text: "01 为什么运维 Agent 不一样", link: "/guide/01-why-ops-agents" },
          { text: "02 全生命周期：从想法到退役", link: "/guide/02-lifecycle" },
          { text: "03 场景选择与可行性", link: "/guide/03-scenario-selection" },
          { text: "04 架构与运行模式", link: "/guide/04-architecture" },
          { text: "05 工具、权限与安全护栏", link: "/guide/05-tools-permissions" },
          { text: "06 上下文与知识工程", link: "/guide/06-context-knowledge" },
          { text: "07 评测、验收与发布", link: "/guide/07-evaluation-release" },
          { text: "08 运营、观测与持续改进", link: "/guide/08-operate-improve" },
          { text: "09 组织、流程与治理", link: "/guide/09-organization-governance" },
          { text: "10 Build vs Buy 与平台选型", link: "/guide/10-build-vs-buy" },
        ],
      },
      {
        text: "第二部分 · 场景手册",
        items: [
          { text: "场景手册导读", link: "/playbooks/" },
          { text: "K8s 集群运维 Agent", link: "/playbooks/k8s" },
          { text: "RDMA 高网运维 Agent", link: "/playbooks/rdma" },
          { text: "GPU 推理运维 Agent", link: "/playbooks/gpu-inference" },
          { text: "数据库运维 Agent", link: "/playbooks/database" },
          { text: "事故指挥 Agent", link: "/playbooks/incident-commander" },
        ],
      },
      {
        text: "第三部分 · 厂商与产品全景",
        items: [
          { text: "厂商地图导读", link: "/vendors/" },
          { text: "全球云厂商", link: "/vendors/global-cloud" },
          { text: "中国云厂商", link: "/vendors/china-cloud" },
          { text: "可观测与 AIOps", link: "/vendors/observability-aiops" },
          { text: "安全、网络与 FinOps", link: "/vendors/security-network-finops" },
          { text: "内嵌 Agent 助手", link: "/vendors/embedded-assistants" },
          { text: "垂直行业运维 Agent", link: "/vendors/vertical-ops" },
          { text: "厂商评估方法", link: "/vendors/methodology" },
        ],
      },
      {
        text: "第四部分 · 2026 工程域",
        items: [
          { text: "11 AgentOps 与可观测性", link: "/guide/11-agentops-observability" },
          { text: "12 身份、权限与安全", link: "/guide/12-identity-security" },
          { text: "13 成本、ROI 与组合管理", link: "/guide/13-cost-roi-portfolio" },
          { text: "14 2027+：自进化、A2A 与自治运维", link: "/guide/14-future-roadmap" },
        ],
      },
      {
        text: "第五部分 · 模板与工具箱",
        items: [
          { text: "模板导读", link: "/templates/" },
          { text: "Agent 设计文档", link: "/templates/agent-design-doc" },
          { text: "工具契约", link: "/templates/tool-contract" },
          { text: "评测集", link: "/templates/eval-set" },
          { text: "权限矩阵", link: "/templates/permission-matrix" },
          { text: "Runbook → Tool 映射", link: "/templates/runbook-tool-map" },
          { text: "发布与回滚清单", link: "/templates/release-checklist" },
          { text: "事故复盘", link: "/templates/incident-review" },
        ],
      },
      {
        text: "附录",
        items: [
          { text: "案例：K8s 节点 NotReady", link: "/appendix/case-notready" },
          { text: "失败复盘：一个没有上线的 Agent", link: "/appendix/case-failed-agent" },
          { text: "阿里 Agent 产品全景", link: "/appendix/alibaba-agent-landscape" },
          { text: "指标与 SLO 库", link: "/appendix/metrics" },
          { text: "术语表", link: "/appendix/glossary" },
          { text: "参考资料", link: "/appendix/references" },
        ],
      },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3], label: "本页目录" },
    editLink: {
      pattern: "https://github.com/ai-guru-global/the-ops-agent-book/edit/main/docs/:path",
      text: "在 GitHub 编辑此页",
    },
    lastUpdatedText: "最后更新",
    docFooter: { prev: "上一章", next: "下一章" },
    socialLinks: [
      { icon: "github", link: "https://github.com/ai-guru-global/the-ops-agent-book" },
    ],
    footer: {
      message: "面向运维场景的智能体工程手册 · 持续迭代中",
      copyright: "© 2026 ai-guru-global contributors · CC BY 4.0",
    },
  },
  appearance: false,
  mermaid: {
    theme: "base",
    themeVariables: {
      fontFamily:
        '"IBM Plex Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontSize: "14px",
      primaryColor: "#f4f4f4",
      primaryTextColor: "#161616",
      primaryBorderColor: "#0f62fe",
      secondaryColor: "#f4f4f4",
      secondaryTextColor: "#161616",
      secondaryBorderColor: "#8d8d8d",
      tertiaryColor: "#ffffff",
      tertiaryTextColor: "#161616",
      tertiaryBorderColor: "#c6c6c6",
      lineColor: "#525252",
      textColor: "#161616",
      mainBkg: "#f4f4f4",
      nodeBorder: "#0f62fe",
      clusterBkg: "#ffffff",
      clusterBorder: "#c6c6c6",
      edgeLabelBackground: "#ffffff",
      actorBkg: "#f4f4f4",
      actorBorder: "#0f62fe",
      actorTextColor: "#161616",
      signalColor: "#525252",
      signalTextColor: "#161616",
      labelBoxBkgColor: "#f4f4f4",
      labelBoxBorderColor: "#0f62fe",
      labelTextColor: "#161616",
      loopTextColor: "#161616",
      noteBkgColor: "#f4f4f4",
      noteBorderColor: "#c6c6c6",
      noteTextColor: "#161616",
      activationBkgColor: "#d0e2ff",
      activationBorderColor: "#0f62fe",
      sequenceNumberColor: "#ffffff",
      pie1: "#0f62fe",
      pie2: "#78a9ff",
      pie3: "#a6c8ff",
      pie4: "#d0e2ff",
      pieTitleTextSize: "16px",
      pieSectionTextSize: "12px",
      pieLegendTextSize: "12px",
      cScale0: "#0f62fe",
      cScale1: "#78a9ff",
      cScale2: "#a6c8ff",
      cScale3: "#d0e2ff",
      cScale4: "#0043ce",
      cScale5: "#8d8d8d",
      cScale6: "#525252",
      sectionBkgColor: "#edf5ff",
      altSectionBkgColor: "#d0e2ff",
      sectionBkgColor2: "#f4f4f4",
      taskBkgColor: "#0f62fe",
      taskBorderColor: "#0043ce",
      taskTextColor: "#ffffff",
      taskTextOutsideColor: "#161616",
      taskTextLightColor: "#161616",
      taskTextDarkColor: "#ffffff",
      gridColor: "#e0e0e0",
      todayLineColor: "#0f62fe",
    },
    flowchart: {
      curve: "linear",
      htmlLabels: true,
      nodeSpacing: 36,
      rankSpacing: 48,
      padding: 12,
    },
    sequence: {
      actorMargin: 44,
      messageMargin: 32,
      boxMargin: 8,
      useMaxWidth: true,
    },
    timeline: { useMaxWidth: true },
  },
}));
