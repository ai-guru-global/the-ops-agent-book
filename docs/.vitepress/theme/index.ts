import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";
import { onMounted, watchEffect } from "vue";
import type { Theme } from "vitepress";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./custom.css";

function enhanceScrollRegions() {
  if (typeof document === "undefined") return;
  const regions = document.querySelectorAll<HTMLElement>(
    ".mermaid, .vp-doc div[class*='language-']"
  );
  for (const region of regions) {
    if (region.scrollWidth <= region.clientWidth + 1) continue;
    region.tabIndex = 0;
    region.setAttribute("role", "region");
    const figureTitle = region.closest("figure")?.querySelector(".custom-block-title");
    const language = region.closest("div[class*='language-']")?.querySelector(".lang");
    region.setAttribute(
      "aria-label",
      figureTitle?.textContent?.trim() || language?.textContent?.trim() || "可横向滚动的内容"
    );
  }
}

export default {
  extends: DefaultTheme,
  setup() {
    const { page } = useData();
    onMounted(() => {
      enhanceScrollRegions();
      const observer = new MutationObserver(enhanceScrollRegions);
      observer.observe(document.body, { childList: true, subtree: true });
    });
    watchEffect(() => {
      page.value.relativePath;
      setTimeout(enhanceScrollRegions, 0);
    });
  },
} satisfies Theme;
