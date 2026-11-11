import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./custom.css";

export default {
  extends: DefaultTheme,
} satisfies Theme;
