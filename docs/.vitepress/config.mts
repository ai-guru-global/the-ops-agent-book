import { defineConfig } from "vitepress";

const base = process.env.GITHUB_PAGES ? "/the-ops-agent-book/" : "/";

export default defineConfig({
  lang: "zh-CN",
  title: "The Ops Agent Book",
  titleTemplate: ":title · 运维智能体工程手册",
  description:
    "面向运维场景的智能体最佳实践：全生命周期的规划、设计、建设、维护、优化与迭代。包含 K8s、RDMA 高网、GPU 推理等场景手册。",
  base,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: `${base}favicon.svg` }],
    ["meta", { name: "theme-color", content: "#161616" }],
    [
      "meta",
      {
        name: "description",
        content:
          "The Ops Agent Book：面向运维场景的智能体工程手册。覆盖规划、设计、建设、维护、优化、迭代，以及 K8s、RDMA、GPU 推理等场景。",
      },
    ],
  ],
  themeConfig: {
    logo: "/favicon.svg",
    siteTitle: "The Ops Agent Book",
    nav: [
      { text: "导读", link: "/guide/" },
      { text: "方法", link: "/guide/01-why-ops-agents" },
      { text: "场景手册", link: "/playbooks/" },
      { text: "模板", link: "/templates/" },
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
        text: "第三部分 · 模板与工具箱",
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
});
