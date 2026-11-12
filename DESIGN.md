---
name: The Ops Agent Book
description: IBM enterprise white-and-blue field manual for ops agents
colors:
  primary: "#0f62fe"
  primary-deep: "#0043ce"
  primary-soft: "#edf5ff"
  primary-mid: "#d0e2ff"
  primary-bright: "#78a9ff"
  ink: "#161616"
  body: "#262626"
  muted: "#525252"
  soft: "#6f6f6f"
  surface: "#f4f4f4"
  line: "#e0e0e0"
  line-strong: "#c6c6c6"
  white: "#ffffff"
  warning: "#f1c21b"
  danger: "#da1e28"
typography:
  display:
    fontFamily: "IBM Plex Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(2.9rem, 5.4vw, 5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "IBM Plex Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.4rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "IBM Plex Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "IBM Plex Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  mono:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.none}"
    padding: "0.65rem 0.75rem"
  diagram:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px 16px"
---

# Design System: The Ops Agent Book

## Overview

**Creative North Star: "The IBM Field Manual"**

The site is a technical publication, not a product landing page. It should read like an IBM engineering manual set on white paper: precise headings, thin gray rules, a calm reading column, and one confident blue that marks action and evidence. The world owns the frame, the masthead, the contents index, and the figure system; the prose column stays quiet and readable.

The redesign removes the previous dark hero, warm paper ground, card grid, and eyebrow labels. What remains is a document-first system: a white page, IBM Plex type, square geometry, data tables, and numbered Mermaid diagrams. The diagram system is the signature: blue-stroked flowcharts, sequence diagrams, state machines, and timelines that explain the method in the same visual grammar across the book.

**Key Characteristics:**
- White #ffffff ground with IBM Gray rules; no dark mode.
- IBM Blue 60 #0f62fe is the only accent.
- IBM Plex Sans for reading; IBM Plex Mono only for code, IDs, figure numbers, and stage labels.
- Square corners, 1px borders, no shadows.
- Tables, index rows, and numbered diagrams instead of cards.
- 65–75ch body measure and generous section rhythm.

## Colors

The palette is a restrained IBM corporate system: one blue, one white, and a gray scale.

### Primary
- **IBM Blue 60** (`#0f62fe`): links, primary buttons, active navigation, diagram strokes, figure numbers, and key rules.
- **IBM Blue 70** (`#0043ce`): primary button hover and link hover.
- **IBM Blue 10** (`#edf5ff`): tip callouts, diagram node fills, table row hover.
- **IBM Blue 20** (`#d0e2ff`): link underlines and diagram secondary fills.
- **IBM Blue 40** (`#78a9ff`): timeline secondary bars and Mermaid secondary nodes.

### Neutral
- **Paper White** (`#ffffff`): page ground, navigation, reading column, diagram body.
- **Gray 10** (`#f4f4f4`): table headers, callouts, diagram captions, search field.
- **Gray 20** (`#e0e0e0`): all standard 1px rules and table borders.
- **Gray 30** (`#c6c6c6`): secondary button borders and stronger dividers.
- **Ink** (`#161616`): headings, nav title, diagram text.
- **Body** (`#262626`): running prose and list text.
- **Muted** (`#525252`): secondary prose, table headers, nav links, metadata values.
- **Soft** (`#6f6f6f`): meta labels, figure captions, footer text; still AA on white.

### Semantic
- **Warning** (`#f1c21b`): warning callout border.
- **Danger** (`#da1e28`): danger callout border.

**The One Accent Rule.** Blue is the only accent. Do not introduce a second brand hue, gradient, or colored glow; emphasis comes from blue, weight, and scale.

**The Surface Rule.** The page ground is white. Gray 10 is a surface for data and annotations, never a page-wide background.

## Typography

**Display Font:** IBM Plex Sans (with PingFang SC, Hiragino Sans GB, Microsoft YaHei fallbacks)
**Body Font:** IBM Plex Sans
**Label/Mono Font:** IBM Plex Mono

**Character:** IBM Plex Sans gives the manual its engineered, slightly humanist voice; Plex Mono is reserved for code, identifiers, diagram numbers, and stage labels so technical data reads as data, not decoration.

**CJK adaptation:** Chinese glyphs use the platform's native CJK sans (PingFang SC, Microsoft YaHei, Noto Sans SC) because IBM Plex Sans does not ship Simplified Chinese and a self-hosted CJK subset would add megabytes to every page. The IBM character is carried by Latin lettering, diagram labels, and the frame; CJK body text stays native for rendering speed and platform familiarity.

### Hierarchy
- **Display** (600, `clamp(2.9rem, 5.4vw, 5rem)`, 0.98): homepage title only; the second line may be blue.
- **Headline** (600, `clamp(1.8rem, 3vw, 2.4rem)`, 1.15): homepage section headings.
- **Title** (600, 1.55rem, 1.25): article h2; h3 at 1.18rem.
- **Body** (400, 1rem, 1.8): running prose; max 72ch.
- **Label** (600, 11px, 0.08em, uppercase): sidebar group labels, meta labels, table headers.
- **Mono** (400, 0.86–13px): inline code, code blocks, figure numbers, stage names.

**The Reading Column Rule.** Running text stays at 65–75ch and 1.8 line-height. Never set body prose or headings in monospace.

**The Mono-For-Data Rule.** Monospace is for code, IDs, measurements, figure numbers, and stage labels. It is not a “technical” costume for labels or nav.

## Layout

The page uses a 1200px content frame with 32px side padding on desktop and 20px on mobile. Article pages keep the VitePress sidebar at 288px and an outline rail on the right; the reading column is capped at 72ch. Homepage sections use a 72px vertical rhythm, reducing to 52px at 960px and 44px at 640px.

The first viewport is a two-column thesis: title and lead on the left, a compact metadata table and seven-stage line on the right. It collapses to one column at 960px. Contents, playbooks, cases, vendors, and engineering domains use index rows (number / title+note / action), not cards. The figure index is a two-column list of numbered diagrams, collapsing to one column on mobile.

Hero: `1.2fr / 0.8fr` grid; 64px gap; 72px top and 64px bottom padding. Index rows: `88px / minmax(0, 1fr) / auto`; 24px gap; 18px vertical padding. Figure index: two columns with 40px gap.

## Elevation & Depth

The system is flat. There are no box shadows, glows, or floating cards. Depth comes from 1px gray rules, gray-10 surfaces, and the contrast between white paper and blue diagram strokes. Hover states shift border color and background, not elevation.

**The Rule-Not-Shadow Rule.** If a boundary is needed, draw a 1px rule. Never use a shadow to imply hierarchy.

## Shapes

Square geometry throughout: 0 radius on buttons, tables, callouts, code blocks, diagram frames, and homepage rows. Borders are 1px; diagram frames and callout borders may be 1px blue, amber, or red by semantic role. No pills, no rounded cards, no clipped or organic shapes.

## Components

### Buttons
- **Shape:** square (0 radius), 44px height.
- **Primary:** IBM Blue 60 ground, white text, 0 20px padding; hover deepens to Blue 70.
- **Secondary:** white ground, ink text, 1px Gray 30 border; hover uses Gray 10.
- **CTA on blue:** white primary button with blue text; secondary is a white outline.

### Navigation
- White 64px bar with a 1px Gray 20 bottom border. Wordmark in Plex Sans 600 14px, not uppercase.
- Links are 13px muted; hover turns ink; active turns blue and semibold. No underline pseudo-element, no shadow.
- Sidebar groups use 11px 600 uppercase soft labels; active item turns blue with a 2px blue indicator.

### Tables
- Full-width, 1px Gray 20 borders, Gray 10 header, Ink body text, 13px type.
- Even rows use `#fafafa`; hover uses Blue 10. On screens ≤640px tables become horizontally scrollable blocks.

### Diagram Figure
- Markdown pattern: `::: diagram 图 XX · Title` wrapping a ` ```mermaid ` block.
- The caption is a Gray 10 strip with 1px bottom rule and 11px muted text; the diagram body is white with 24px 16px padding and horizontal scroll on narrow screens.
- Mermaid uses IBM Blue 60 strokes, Blue 10 node fills, Gray 50 lines, and Plex Sans labels. Figures are numbered continuously across the book.

### Callouts
- Square, 1px border, Gray 10 ground. Tip uses Blue 10 ground with Blue 60 border and Blue 70 title; warning uses amber border and a pale amber ground; danger uses red border and pale red ground. No colored left border.

### Code
- Inline code: Gray 10 ground, 1px Gray 20 border, Plex Mono, Ink text.
- Code blocks: Ink ground, white-gray code, square corners, 1px Ink border.

## Do's and Don'ts

### Do:
- **Do** use IBM Plex Sans for reading and IBM Plex Mono only for code, IDs, figure numbers, and stage labels.
- **Do** keep the page ground white and use Gray 10 only for data surfaces and annotations.
- **Do** use IBM Blue 60 for action, links, active navigation, and diagram strokes; keep it rare enough to mean something.
- **Do** use 1px gray rules to separate sections, rows, and metadata.
- **Do** number every concept diagram and give it a caption plus surrounding text explanation.
- **Do** keep the body measure at 65–75ch and section rhythm generous.

### Don't:
- **Don't** add a dark theme or a theme toggle; this world is forced light.
- **Don't** use gradient text, glass, colored glows, or decorative shadows.
- **Don't** use rounded cards, card grids, or nested cards for structure; use index rows and tables.
- **Don't** put an eyebrow/kicker label above a heading; the heading carries its own weight.
- **Don't** use a colored left border above 1px on cards, callouts, or list items.
- **Don't** set running prose or headings in monospace.
- **Don't** introduce a second accent color; blue is the only one.
