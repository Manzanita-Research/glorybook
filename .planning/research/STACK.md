# Stack Research

**Domain:** Real-time collaborative music app UI (React + PartyKit + Vite)
**Researched:** 2026-02-24
**Confidence:** HIGH — all versions verified via npm registry and Context7/official docs

---

## Context

The sync layer already exists: PartyKit server, typed protocol, `useDeadSync` hook. This research covers only what's needed to build the React UI on top of that foundation. The existing `package.json` has React 18.2, Vite 5, and `partysocket ^1.0.1` — all of which need upgrading or augmenting.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.4 | UI framework | Production-stable as of mid-2025. Automatic compiler, improved concurrent rendering. Backward compatible with the existing 18.x hook code. Existing `package.json` pins 18.2 — upgrade is safe. |
| Vite | 7.3.1 | Build tool / dev server | PartyKit's `serve` block calls `npx vite build`. Already in the project. Fastest iteration cycle for the React UI. |
| @vitejs/plugin-react | 5.1.4 | Vite React transform | Required for JSX/TSX compilation with Vite. Already in devDeps. |
| TypeScript | 5.9.3 | Type safety | Already in project. Protocol types are the source of truth — type safety matters here. |
| Tailwind CSS | 4.2.1 | Utility-first styling | Org default. v4 is production-stable as of early 2025, uses `@tailwindcss/vite` plugin (no `tailwind.config.js` needed), 5x faster full builds, 100x faster incremental. Target is iPad Safari 16.4+ (gigs in 2025), which meets v4's browser floor. |
| @tailwindcss/vite | 4.2.1 | Tailwind Vite integration | v4 ships its own Vite plugin. Replaces PostCSS + autoprefixer setup. Add to `vite.config.ts`; add `@import "tailwindcss";` to CSS. |
| partysocket | 1.1.16 | PartyKit client WebSocket | Already in project (^1.0.1). `usePartySocket` hook from `partysocket/react` is available but the existing `useDeadSync` hook builds on raw `PartySocket` — continue that pattern. Upgrade to 1.1.16 for latest fixes. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-markdown | 10.1.0 | Markdown rendering for chord charts | The `chart` field in `Song` is markdown/chord text. `react-markdown` renders it safely via React components with full customization. Use the `components` prop to intercept text nodes for chord highlighting. |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown plugin | Adds table, strikethrough, task list support. The chart format uses code blocks and section labels — GFM handles those cleanly. Pass as `remarkPlugins={[remarkGfm]}` to `<Markdown>`. |
| chordsheetjs | 14.0.0 | Chord parsing + HTML formatting | The existing chart format uses `[G]`, `[Am]`, `[C/G]` inline bracket notation — this is ChordPro format. ChordSheetJS parses it, identifies chord tokens, and can render structured HTML. Use this to parse chords for highlighting, not react-markdown's code component. See "Chord Highlighting Strategy" below. |
| qrcode.react | 4.2.0 | QR code generation | Venue session QR codes. Use `<QRCodeSVG>` (not canvas) — scales cleanly on any display, theming via `fgColor`/`bgColor` props. Stage dark theme: light QR on dark background. |
| react-swipeable | 7.0.2 | Touch swipe gestures | iPad prev/next song navigation by swiping. Lightweight hook (`useSwipeable`), no dependencies, works with Safari touch events. For song browsing left/right. |
| motion | 12.34.3 | Animations | "GO LIVE" banner slide-in, presence indicator transitions. Use `motion/react` import. Framer Motion rebranded to `motion` — use that package name. Apply `touch-action: none` on drag targets for Safari. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Bun | Package manager + task runner | Org default. Use `bun install` and `bun run dev`. All `npm install` commands in this doc should use `bun add` in practice. |
| partykit CLI | Dev server + deploy | Already configured. `bunx partykit dev` runs local server on port 1999. |
| @types/react | 19.2.14 | React type definitions | Must match React version — 19.x types for React 19. |
| @types/react-dom | 19.2.3 | ReactDOM type definitions | Same. |

---

## Chord Highlighting Strategy

This is the most domain-specific challenge. The existing chart format in `default-setlist.ts` is:

```
A lit up and the [G]boys were drinkin'
[C]The air was [G]smoky and the [Am]place was [C]loud
```

This is **ChordPro bracket format** — chords inline with lyrics using `[Chord]` notation.

**Recommended approach: custom text parser, not a library.**

ChordSheetJS can parse the format and emit structured HTML, but its HTML output requires custom CSS overrides that fight Tailwind. For this use case — rendering inside React with Tailwind, applying gold/blue/purple token colors — a small custom parser is more maintainable:

```typescript
// Parse "[G]boys were drinkin'" into tokens
type Token = { type: 'chord' | 'lyric' | 'section'; text: string }

function parseChordLine(line: string): Token[] {
  const tokens: Token[] = []
  const regex = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'lyric', text: line.slice(lastIndex, match.index) })
    }
    tokens.push({ type: 'chord', text: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) {
    tokens.push({ type: 'lyric', text: line.slice(lastIndex) })
  }
  return tokens
}
```

Section labels like `CHORUS:`, `BRIDGE:`, `VERSE:` get `type: 'section'` treatment with blue color. Chords get gold. Lyrics get cream/off-white. Notes/annotations (lines starting with `→` or in parens) get muted purple.

**Use ChordSheetJS for:** transpose functionality if added later, or if importing external ChordPro files. It's a good dep to have but not the primary renderer.

**Use react-markdown for:** song metadata display, notes field, README-style content — not the chord chart itself.

---

## Dark Theme Implementation

This app is always dark — stage use, iPad under lights. Do not toggle dark mode.

```css
/* In index.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

```html
<!-- In index.html -->
<html class="dark">
```

Then all `dark:` utilities apply always. Color palette for Tailwind config (CSS variables in v4):

```css
@theme {
  --color-stage-bg: #1a1714;        /* near-black, warm */
  --color-stage-surface: #252118;   /* card backgrounds */
  --color-stage-border: #3a3530;    /* subtle borders */
  --color-chord: #d4a935;           /* gold — chord names */
  --color-section: #6b9fd4;         /* blue — CHORUS, VERSE */
  --color-annotation: #9b7fc7;      /* purple — notes, arrows */
  --color-lyric: #e8e0d5;           /* warm cream — lyric text */
  --color-muted: #8a8278;           /* muted — secondary text */
}
```

---

## Installation

```bash
# Upgrade core (existing project)
bun add react@^19.2.4 react-dom@^19.2.4

# Add Tailwind v4 (replaces any v3 setup)
bun add tailwindcss @tailwindcss/vite

# Chord chart + QR
bun add react-markdown remark-gfm chordsheetjs qrcode.react

# Touch + animation
bun add react-swipeable motion

# Dev type upgrades
bun add -d @types/react@^19.2.14 @types/react-dom@^19.2.3

# Upgrade partysocket
bun add partysocket@^1.1.16
```

**`vite.config.ts` additions:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Tailwind CSS v4 | Tailwind CSS v3 | Targeting Safari <16.4. For a 2025+ gig setup on modern iPads, v4 is the right call. |
| Custom chord parser | ChordSheetJS HTML formatter | ChordSheetJS HTML output is correct but its table/div layout fights Tailwind. Use ChordSheetJS for parsing/transposing only; render with React components. |
| react-markdown | marked / unified directly | react-markdown wraps unified correctly for React. Using unified directly adds config overhead with no benefit here. |
| qrcode.react (SVG) | node-qrcode | qrcode.react is React-native, renders SVG, customizable colors. node-qrcode targets Node/canvas — wrong tool. |
| motion | @headlessui/react | headlessui handles accessible dropdowns/modals. motion handles animation/gesture. They solve different problems; use both if needed. |
| react-swipeable | motion drag gestures | motion drag works but adds complexity for simple prev/next swipes. react-swipeable is purpose-built for swipe detection and Safari-tested. |
| React 19 | React 18 | React 18 is still supported but React 19 is production-stable and recommended. Upgrade is safe — the existing hook code is compatible. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-syntax-highlighter | Designed for code blocks — heavy, targets `<pre><code>` semantics. Chord charts are not code. | Custom chord tokenizer (see above) |
| CSS Modules | Project uses Tailwind. Mixing both creates two competing styling systems. | Tailwind utility classes only |
| Socket.io | Already committed to PartyKit/partysocket. Socket.io would require replacing the entire sync layer. | partysocket |
| next-themes | Theme toggling library — overkill. The app is always dark, no toggle needed. | Hardcode `class="dark"` on `<html>` |
| react-pdf / PDF.js | Settled decision: markdown-first for charts, not PDF rendering. PDF brings 500KB+ bundle cost. | react-markdown + chord tokenizer |
| Zustand / Jotai | All sync state lives in `useDeadSync` already. Adding a state manager would duplicate the source of truth. | The existing hook + React `useState` |
| tldraw | Out of scope for this milestone. Canvas annotations deferred. | — |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react@19 | @types/react@19 | Types must match major version. @types/react@18 will cause TS errors with React 19 APIs. |
| tailwindcss@4 | @tailwindcss/vite@4 | They ship together — keep versions in sync. v4 drops `tailwind.config.js`; use CSS `@theme` instead. |
| react-markdown@10 | remark-gfm@4 | Major version pairing. remark-gfm@3 works with react-markdown@8-9; v4 needed for react-markdown@10. |
| partysocket@1.1 | partykit@0.0.115 | Server and client versions are independent. partysocket is the client lib only. |
| motion@12 | React 19 | motion/react is compatible with React 19. Previous framer-motion@10 had React 19 issues. |

---

## Stack Patterns by Variant

**Local gig mode (Mac mini + travel router):**
- `VITE_PARTYKIT_HOST=localhost:1999` in `.env.local`
- QR code encodes the Mac mini's LAN IP + session code
- No changes to stack — same build, different env var

**Cloudflare edge mode (remote rehearsals):**
- `VITE_PARTYKIT_HOST=deadsync.username.partykit.dev`
- `bun run deploy` via `partykit deploy`
- Same stack, different host

---

## Sources

- `npm view [package] version` — all version numbers verified from npm registry 2026-02-24
- Context7 `/remarkjs/react-markdown` — custom components, plugin pipeline (HIGH)
- Context7 `/partykit/partykit` — `usePartySocket` API reference (HIGH)
- Context7 `/tailwindlabs/tailwindcss.com` — v4 Vite setup, dark mode class variant (HIGH)
- Context7 `/zpao/qrcode.react` — QRCodeSVG/QRCodeCanvas props reference (HIGH)
- Context7 `/websites/motion_dev` — touch support, drag controls (HIGH)
- tailwindcss.com/docs/guides/vite — v4.2 official Vite install steps (HIGH)
- WebSearch: Tailwind v4 vs v3 browser floor — Safari 16.4+ requirement confirmed (MEDIUM)
- WebSearch: React 19 production stability 2025 — consensus: production-ready (MEDIUM)
- WebSearch: ChordSheetJS — bracket format / ChordPro parser support (MEDIUM, verified via GitHub README)
- WebSearch: react-swipeable v7.0.2 — current version, iPad Safari compatibility (MEDIUM)
- Existing codebase (`src/shared/default-setlist.ts`) — confirmed `[G]` bracket chord format (HIGH)

---

*Stack research for: Glory (DeadSync) React UI milestone*
*Researched: 2026-02-24*
