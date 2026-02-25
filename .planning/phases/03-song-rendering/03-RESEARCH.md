# Phase 3: Song Rendering - Research

**Researched:** 2026-02-24
**Domain:** Chord chart tokenization and React rendering
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Chord layout:** Chords render ABOVE the line they attach to, not inline with lyrics. Chord position aligns above the syllable where the bracket appears in the markdown source. Chord-only lines (no lyrics) render in box grid notation: `|G   |C   |D   |%   |`. The `%` repeat symbol renders as-is.
- **Chord parsing:** Anything in `[brackets]` is treated as a chord — loose parsing, no validation against chord grammar. Brackets are stripped from display; the chord name gets gold pill treatment. Box grid lines (pipes + chord names) are detected and rendered as a visual grid.
- **Color system:** Chords are gold text on a dark semi-transparent background pill/badge. Section headers are bold uppercase blue text. Annotations are italic, slightly dimmer purple. Lyrics are warm off-white / cream. Not pure white.
- **Song header bar:** Sticky at the top, chart scrolls beneath it. Contains: song title, key, tempo, song position ("3 of 8"), and song notes. Separated from chart body by a thin border line (not shadow).
- **Typography:** Monospaced font throughout the chart. Minimum 20px font size. Line spacing at Claude's discretion.

### Claude's Discretion

- Line spacing / vertical rhythm between lines and sections
- Treatment of transition arrows (→) — annotation style or distinct callout
- Treatment of parenthetical stage directions — how they differ from other annotations
- Section dividers between major sections (whitespace vs thin rules)
- Long notes truncation behavior in the header

### Deferred Ideas (OUT OF SCOPE)

- tldraw canvas view for chart input/annotation (FUT-01, v2)
- Font size adjustment / pinch-to-zoom (POL-01, v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SONG-01 | User sees the current song's chord chart rendered from markdown | Custom tokenizer + React rendering patterns documented below |
| SONG-02 | Chords are highlighted in gold, section headers in blue, notes in purple | Theme colors already defined in app.css — use existing Tailwind tokens |
| SONG-03 | Song title and key are visible at the top of the viewer | Sticky header pattern with Tailwind `sticky top-0` documented below |
| SONG-04 | User can scroll within a long chord chart | `overflow-y-auto` on chart body + fixed-height container pattern documented |
| SONG-05 | Font is readable at glance distance (20-22px minimum, monospaced for chord alignment) | Tailwind `font-mono text-xl` (20px) verified — existing `--font-mono` theme var |
</phase_requirements>

## Summary

Phase 3 is a pure React rendering problem. There are no third-party libraries that handle the specific bracket-notation chord format used by this project (`[G]`, `[Am]`, `[C/G]`). The STATE.md already records a locked decision to build a custom chord tokenizer rather than use ChordSheetJS. This research validates that decision: ChordSheetJS uses ChordPro format and HTML formatter output that would need to be completely overridden for this color system and layout; it is more work than a focused custom tokenizer.

The core rendering challenge is above-the-line chord layout. The standard pattern from established chord rendering tools (markdown-it-chords, ChordPro renderers) is the same: split each line on `[bracket]` tokens, then render chord/lyric segment pairs where each pair is an `inline-block` container with the chord sitting in an absolutely-positioned or block-level element above the lyric syllable. This is straightforward CSS with no exotic browser behavior. The existing `app.css` theme already defines every color token needed (`accent-gold`, `accent-blue`, `accent-purple`, `text-primary`). No new dependencies are required.

The sticky header + scrollable chart body is a solved layout problem with Tailwind: `h-dvh` on the outer container, `sticky top-0` on the header, `overflow-y-auto flex-1` on the chart body.

**Primary recommendation:** Build `ChordChart` as a pure rendering component that accepts a `Song` object and renders it. Implement a `tokenizeLine()` pure function that is independently testable. Use existing Tailwind tokens throughout — no new CSS or colors needed.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.4 | Component rendering | Already installed, used throughout |
| Tailwind CSS v4 | ^4.2.1 | Utility styling | Already installed, theme defined |
| TypeScript | ^5.3.0 | Type safety for token types | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | — | — | All requirements met by existing stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tokenizer | ChordSheetJS | ChordSheetJS uses ChordPro `.pro` format, not `[bracket]` notation. Its HTML formatter produces unstyled markup requiring complete style override. More work than a 50-line tokenizer. |
| Custom tokenizer | markdown-it-chords | Same issue: different bracket syntax expectation, requires markdown-it dependency, outputs HTML strings not React elements. |
| Custom tokenizer | ChordFiddle / similar | All chord rendering libraries target ChordPro format or generate SVG. None match the Dead-chart markdown format. |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure

```
src/client/
├── components/
│   ├── ChordChart.tsx        # top-level composer: header + chart body
│   ├── SongHeader.tsx        # sticky header: title, key, tempo, position, notes
│   ├── ChordLine.tsx         # renders one above-the-line chord+lyric line
│   └── BoxGridLine.tsx       # renders one |G   |C   |D   | grid row
├── lib/
│   └── chord-tokenizer.ts    # pure function: string → Token[]
└── __tests__/
    ├── chord-tokenizer.test.ts
    ├── ChordChart.test.tsx
    └── SongHeader.test.tsx
```

### Pattern 1: Chord Tokenizer — Pure Function

**What:** Split a chart line into typed tokens. Each line is either a chord-lyric line, a box grid line, a section header, an annotation, or a plain text line.

**When to use:** Call before rendering. Tokenize the full chart string once; memoize with `useMemo`.

**Token types:**

```typescript
// src/client/lib/chord-tokenizer.ts

export type LineType =
  | "chord-lyric"   // contains [bracket] chords mixed with lyrics
  | "box-grid"      // starts with | and contains pipe-separated entries
  | "section"       // matches /^[A-Z][A-Z\s]+:/ — e.g. "CHORUS:", "JAM SECTION:"
  | "annotation"    // starts with > or is a parenthetical or contains →
  | "blank"         // empty line — section spacer
  | "plain";        // anything else — plain lyric text, no chords

export interface ChordSegment {
  chord: string;    // content without brackets, e.g. "Am", "C/G"
  lyric: string;    // the lyric syllables that follow this chord
}

export interface ParsedLine {
  type: LineType;
  raw: string;
  segments?: ChordSegment[];  // only on chord-lyric type
}

export function tokenizeLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (!trimmed) return { type: "blank", raw: line };
  if (/^\|/.test(trimmed)) return { type: "box-grid", raw: line };
  if (/^[A-Z][A-Z\s\/\-]+:/.test(trimmed)) return { type: "section", raw: line };
  if (!trimmed.includes("[")) return { type: "plain", raw: line };
  // chord-lyric: split on bracket tokens
  const segments: ChordSegment[] = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    segments.push({ chord: match[1], lyric: match[2] });
  }
  return { type: "chord-lyric", raw: line, segments };
}

export function tokenizeChart(chart: string): ParsedLine[] {
  return chart.split("\n").map(tokenizeLine);
}
```

### Pattern 2: Above-the-Line Chord Rendering

**What:** Each `ChordSegment` pair renders as a `span` with `display: inline-block`. The chord name floats above using `display: block` before the lyric text. This is the standard approach used by markdown-it-chords and all ChordPro renderers.

**When to use:** For all `chord-lyric` type lines.

**Example:**

```tsx
// src/client/components/ChordLine.tsx
import type { ChordSegment } from "../lib/chord-tokenizer";

interface Props {
  segments: ChordSegment[];
}

export function ChordLine({ segments }: Props) {
  return (
    <span className="whitespace-pre font-mono">
      {segments.map((seg, i) => (
        <span key={i} className="inline-block align-bottom">
          {/* chord badge — sits above lyric */}
          <span className="block text-accent-gold bg-surface-overlay/60 px-1 rounded text-sm leading-tight mb-0.5">
            {seg.chord}
          </span>
          {/* lyric syllable — invisible if empty, but preserves spacing */}
          <span className="block text-text-primary">
            {seg.lyric || "\u00A0"}
          </span>
        </span>
      ))}
    </span>
  );
}
```

**Key insight:** Each chord+lyric pair is `inline-block`. The chord `span` is `block` above the lyric `span`. This lines up chords above their syllables correctly. Empty lyric text gets a non-breaking space (`\u00A0`) to preserve column width for chord-only lines.

### Pattern 3: Box Grid Line

**What:** A line like `|G   |C   |D   |%   |` is rendered as a horizontal flex row where each cell between pipes gets equal width, chord-colored.

**When to use:** `box-grid` type lines.

**Example:**

```tsx
// src/client/components/BoxGridLine.tsx

interface Props {
  raw: string;
}

export function BoxGridLine({ raw }: Props) {
  // split on | and filter empty entries from leading/trailing pipes
  const cells = raw.split("|").filter(Boolean);
  return (
    <div className="flex gap-0 font-mono text-xl my-1">
      {cells.map((cell, i) => (
        <span
          key={i}
          className="inline-block border border-border px-2 py-0.5 text-accent-gold min-w-[3.5rem] text-center"
        >
          {cell.trim() || "\u00A0"}
        </span>
      ))}
    </div>
  );
}
```

### Pattern 4: Sticky Header + Scrollable Chart

**What:** Full-height layout where the header sticks to the top and the chart body scrolls independently. Uses `h-dvh` (dynamic viewport height) to handle iPad Safari's collapsing address bar correctly.

**When to use:** The `ChordChart` component wrapper.

**Example:**

```tsx
// src/client/components/ChordChart.tsx

export function ChordChart({ song, position, total }: ChordChartProps) {
  const lines = useMemo(() => tokenizeChart(song.chart), [song.chart]);

  return (
    <div className="flex flex-col h-dvh">
      {/* Sticky header — does not scroll */}
      <SongHeader song={song} position={position} total={total} />

      {/* Chart body — scrolls independently */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {lines.map((line, i) => renderLine(line, i))}
      </div>
    </div>
  );
}
```

### Pattern 5: Section Header Line

**What:** Lines matching `CHORUS:`, `VERSE:`, `JAM SECTION:` etc. render as bold, blue, uppercase landmark text.

```tsx
// Inside ChordChart renderLine()
case "section":
  return (
    <div key={i} className="font-mono font-bold text-accent-blue text-xl uppercase mt-4 mb-2 tracking-wide">
      {line.raw.trim()}
    </div>
  );
```

### Pattern 6: Annotation Line

**What:** Lines starting with `>` or containing `→` render in italic purple. Parentheticals use annotation style.

```tsx
case "annotation":
  // strip leading > if present
  const text = line.raw.replace(/^>\s*/, "").trim();
  return (
    <div key={i} className="font-mono italic text-accent-purple text-xl my-1">
      {text}
    </div>
  );
```

**Note on annotation detection:** The tokenizer should classify a line as annotation if it: starts with `>`, OR contains `→`, OR is entirely wrapped in parentheses. This covers all cases in the default setlist (transition arrows, stage direction lines).

### Pattern 7: SongHeader Component

**What:** Sticky bar showing song title, key, tempo, position in set, and notes.

```tsx
// src/client/components/SongHeader.tsx

export function SongHeader({ song, position, total }: SongHeaderProps) {
  return (
    <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 z-10">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate">
          {song.title}
        </h1>
        <span className="text-text-secondary text-sm shrink-0">
          {position} of {total}
        </span>
      </div>
      <div className="flex gap-4 text-sm text-text-secondary mt-0.5">
        <span>Key: <span className="text-accent-gold">{song.key}</span></span>
        <span>{song.tempo}</span>
      </div>
      {song.notes && (
        <p className="text-text-muted text-sm mt-1 italic line-clamp-2">
          {song.notes}
        </p>
      )}
    </div>
  );
}
```

**Long notes:** Use `line-clamp-2` (Tailwind built-in via `overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2`). Notes truncate to two lines. This is Claude's discretion per CONTEXT.md.

### Anti-Patterns to Avoid

- **dangerouslySetInnerHTML for chord rendering:** Never parse chart markdown into raw HTML strings and inject. Produces un-stylable markup, breaks CSP, and prevents React event handling. Always tokenize to typed data structures first.
- **`white-space: pre` on the outer container without `inline-block` on chord pairs:** Causes chord pairs to wrap incorrectly. The `inline-block` on each chord+lyric pair is what creates column alignment.
- **Using `position: absolute` for chord placement:** The `display: block` stacked approach is simpler and more responsive. Absolute positioning requires knowing character widths in advance.
- **Splitting sections by regex on the whole chart:** Split line-by-line first, then classify each line. Never apply a single regex to the full chart string.
- **`overflow: hidden` on the chart body instead of `overflow-y-auto`:** The chart must scroll. `hidden` cuts off content on iPads with long charts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sticky header on iPad Safari | Custom scroll event listener | Tailwind `sticky top-0` + `h-dvh` container | Safari's `position: sticky` works correctly when the parent has a fixed height (not `100vh` — use `100dvh`) |
| Long note truncation | JS substring logic | Tailwind `line-clamp-2` | CSS `line-clamp` is fully supported in Safari/iOS. No JS needed. |
| Non-breaking space in empty lyric slots | String padding logic | Literal `\u00A0` in JSX | Monospace alignment relies on character width. A non-breaking space preserves column width without padding logic. |
| Section landmark detection | Complex regex | Simple colon-suffix test `/^[A-Z][A-Z\s\/\-]+:/` | The Dead chart format is consistent: CHORUS:, VERSE:, BRIDGE:, JAM SECTION:, VAMP:, INTRO:, OUTRO:. All uppercase, end with colon. |

**Key insight:** The rendering problem is simpler than it looks. The chord tokenizer is ~50 lines of pure TypeScript. The rendering is ~100 lines of straightforward JSX. No algorithms, no libraries, no complex state.

## Common Pitfalls

### Pitfall 1: `100vh` vs `100dvh` on iPad Safari

**What goes wrong:** Using `h-screen` (`height: 100vh`) on iPad Safari causes the chart to overflow behind the address bar. Content at the bottom of the chart is unreachable.

**Why it happens:** `100vh` on iOS Safari is fixed to the viewport height including the address bar height, even when the address bar is visible. `100dvh` (dynamic viewport height) accounts for the current visible area.

**How to avoid:** Use Tailwind `h-dvh` on the outer container (already used in the existing `SessionScreen` via `min-h-dvh`). The chord chart wrapper must use `h-dvh` (fixed, not min) so the flex layout constrains the scrollable region.

**Warning signs:** Chart body scrolls but the header scrolls away too. Or the chart cuts off at the bottom.

### Pitfall 2: Chord Alignment Breaks When Lyric Text Is Empty

**What goes wrong:** A line of only chords (`[G]  [C]  [D]`) produces segments where `lyric` is an empty string. Without a placeholder, the lyric `span` collapses and chord badges stack to different heights than lines with lyrics.

**Why it happens:** The chord/lyric `inline-block` pair uses the lyric `span` as its baseline. If the lyric is empty, the pair height is only the chord badge height — different from pairs with lyrics.

**How to avoid:** Always render `seg.lyric || "\u00A0"` in the lyric slot. The non-breaking space gives the lyric span a consistent height regardless of content. This applies even on box grid lines detected as `chord-lyric` type.

**Warning signs:** Chord-only intro lines look visually lower than mixed chord+lyric lines.

### Pitfall 3: Section Header Regex Too Broad

**What goes wrong:** A line like `A lit up and the [G]boys were drinkin'` starts with uppercase A and contains letters before a chord. A broad section header regex could misclassify it.

**Why it happens:** Greedy matching on "starts with uppercase letter(s) followed by colon."

**How to avoid:** The regex must require at least two uppercase characters before the colon, OR require the entire text before the colon to be uppercase: `/^[A-Z][A-Z\s\/\-]+:/`. A single uppercase letter followed immediately by a colon is also valid (e.g., `A:` as a section label), but in practice Dead charts use multi-word labels. Test against the actual default setlist during implementation.

**Warning signs:** First line of a verse is rendered as a section header.

### Pitfall 4: Box Grid Detection Fires on Pipe Characters in Lyrics

**What goes wrong:** Rare, but a lyric containing `|` could trigger box grid rendering.

**Why it happens:** Detecting box grids by checking if a line starts with `|`.

**How to avoid:** Also require the line to have at least two pipe characters (i.e., at least one complete cell): `/^\|[^|]+\|/`. All 8 songs in the default setlist use `|G   |C   |` style — always multiple cells. A single `|` in lyrics is extremely unlikely in this corpus.

**Warning signs:** A line like `| walking along |` renders as a grid instead of a lyric.

### Pitfall 5: `sticky top-0` Header Does Not Stick

**What goes wrong:** The sticky header scrolls away with the chart content.

**Why it happens:** `position: sticky` only works when the parent container has a defined height and `overflow` set. If the `flex-1 overflow-y-auto` is on the wrong element, the scroll context is wrong.

**How to avoid:** The layout must be `flex flex-col h-dvh` on the outermost wrapper. The header gets `sticky top-0` (or can be non-sticky since the scroll is on the sibling — in fact with this layout the header naturally stays fixed since only the sibling div scrolls). The chart body is `overflow-y-auto flex-1`. The header does not need `sticky` if it is outside the scrolling element — it simply does not scroll. Use the flex-column approach rather than relying on CSS sticky.

**Warning signs:** Scrolling the chart body causes the header to move.

## Code Examples

Verified patterns based on official sources and existing project code:

### Tailwind v4 — Using Existing Theme Tokens

```tsx
// All color tokens are already defined in src/client/app.css @theme block.
// Use them directly in className props — no new CSS needed.

// Gold chord badge:
<span className="text-accent-gold bg-surface-overlay/60 px-1 rounded text-sm">Am</span>

// Blue section header:
<span className="text-accent-blue font-bold uppercase">CHORUS:</span>

// Purple annotation:
<span className="text-accent-purple italic">→ TRANSITION TO FIRE ON THE MOUNTAIN</span>

// Cream lyric text:
<span className="text-text-primary font-mono text-xl">A lit up and the boys</span>
```

### Monospaced Font at Minimum 20px

```tsx
// Tailwind text-xl = 1.25rem = 20px at default 16px root.
// font-mono uses --font-mono which is already defined in Tailwind v4 defaults.
<div className="font-mono text-xl leading-snug">
  {/* chart content */}
</div>
```

### h-dvh Layout for iPad

```tsx
// Source: https://tailwindcss.com/docs/height (h-dvh utility)
<div className="flex flex-col h-dvh">
  <div className="sticky top-0 bg-surface border-b border-border z-10">
    {/* SongHeader */}
  </div>
  <div className="flex-1 overflow-y-auto">
    {/* ChordChart lines */}
  </div>
</div>
```

### Full Tokenizer Line Classification

```typescript
// Annotation detection accounts for: >, →, parentheticals
function isAnnotation(line: string): boolean {
  const t = line.trim();
  return (
    t.startsWith(">") ||
    t.includes("→") ||
    (t.startsWith("(") && t.endsWith(")"))
  );
}
```

### Integration with SessionScreen

```tsx
// The existing SessionScreen has a placeholder:
// <div className="mt-8 text-center text-text-muted text-sm">
//   <p>Setlist viewer coming soon.</p>
// </div>
//
// Phase 3 replaces this with <ChordChart> wired to sessionState.

const currentSong = sessionState?.setlist.songs[sessionState.liveIndex];

// Inside SessionScreen render:
{currentSong && (
  <ChordChart
    song={currentSong}
    position={sessionState.liveIndex + 1}
    total={sessionState.setlist.songs.length}
  />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen layout | `100dvh` (`h-dvh` in Tailwind) | iOS 15.4+ / Safari 15.4 (2022) | Charts on iPad no longer cut off behind address bar |
| ChordSheetJS HTML formatter | Custom tokenizer | This project's Phase 1 decision | Full control over rendering, no dependency on external format |
| Tailwind v3 config JS | Tailwind v4 `@theme` CSS block | v4 release (already in project) | Colors defined in CSS, not JS config — `app.css` `@theme` is the source of truth |
| `line-clamp` plugin | Native CSS `line-clamp` via Tailwind | Tailwind v3.3+ | No `@tailwindcss/line-clamp` plugin needed — `line-clamp-2` just works |

**Deprecated/outdated:**
- `@tailwindcss/line-clamp` plugin: deprecated, functionality built into Tailwind core since v3.3
- `100vh` for iPad layouts: causes address-bar height bugs — always use `100dvh`

## Open Questions

1. **Chord-lyric alignment precision with variable-width chars**
   - What we know: Monospace fonts make alignment predictable. The `inline-block` per-chord-pair approach aligns chords above their first lyric syllable.
   - What's unclear: The default setlist uses mixed cases like `[G]boys` (bracket immediately before lyric with no space). After stripping the bracket, "boys" starts immediately. The regex `\[([^\]]+)\]([^\[]*)` captures everything from the chord to the next bracket or end-of-string as the lyric — this should be correct.
   - Recommendation: Test against "Friend of the Devil" first (has `[G]boys` style), verify visually before moving to box grid lines.

2. **How to handle lines with leading text before first chord**
   - What we know: Some lines start with lyrics before any chord (e.g., `A lit up and the [G]boys were drinkin'`). The tokenizer's regex only captures segments starting from `[bracket]` — the leading text is lost.
   - What's unclear: Whether leading lyric text before the first chord needs to be preserved.
   - Recommendation: Extend the tokenizer to capture a leading lyric segment: split on `\[([^\]]+)\]` and treat odd-indexed parts as lyrics, even-indexed as chords. Or, detect if the line starts before any bracket and add an initial `{ chord: "", lyric: prefix }` segment that renders with no chord badge.

3. **`position` and `total` props — where do they come from in Phase 3?**
   - What we know: Phase 3 renders the current song; Phase 4 adds navigation. The `liveIndex` from `sessionState` gives position.
   - What's unclear: Phase 3 won't have song navigation controls yet. The header still needs position context.
   - Recommendation: In Phase 3, wire `position = liveIndex + 1` and `total = setlist.songs.length` from `sessionState`. Navigation to change `liveIndex` is Phase 4 scope.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `/Users/jem/code/manzanita-research/glorybook/vitest.config.ts` |
| Quick run command | `bun run test` |
| Full suite command | `bun run test` |
| Estimated runtime | ~5 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONG-01 | `ChordChart` renders chart lines from a `Song` object | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |
| SONG-01 | `tokenizeChart()` produces correct `ParsedLine[]` from sample chart strings | unit | `bun run test src/client/__tests__/chord-tokenizer.test.ts` | ❌ Wave 0 gap |
| SONG-02 | Gold chord badge appears for `[G]` | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |
| SONG-02 | Section header line has `text-accent-blue` | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |
| SONG-02 | Annotation line has `text-accent-purple` | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |
| SONG-03 | `SongHeader` renders title, key, tempo, position, and notes | unit | `bun run test src/client/__tests__/SongHeader.test.tsx` | ❌ Wave 0 gap |
| SONG-04 | Chart body container has `overflow-y-auto` in rendered DOM | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |
| SONG-05 | Chart text element has `font-mono` and minimum 20px font size class | unit | `bun run test src/client/__tests__/ChordChart.test.tsx` | ❌ Wave 0 gap |

### Nyquist Sampling Rate

- **Minimum sample interval:** After every committed task → run: `bun run test`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)

- [ ] `src/client/__tests__/chord-tokenizer.test.ts` — covers SONG-01 tokenizer unit tests
- [ ] `src/client/__tests__/ChordChart.test.tsx` — covers SONG-01, SONG-02, SONG-04, SONG-05
- [ ] `src/client/__tests__/SongHeader.test.tsx` — covers SONG-03

## Sources

### Primary (HIGH confidence)

- `/websites/tailwindcss` (Context7) — sticky positioning, overflow-y-auto, h-dvh, @theme CSS variables, line-clamp
- `/Users/jem/code/manzanita-research/glorybook/src/client/app.css` — existing color tokens verified directly
- `/Users/jem/code/manzanita-research/glorybook/src/shared/default-setlist.ts` — actual chart format verified
- `/Users/jem/code/manzanita-research/glorybook/.planning/STATE.md` — locked custom tokenizer decision

### Secondary (MEDIUM confidence)

- [markdown-it-chords documentation](https://dnotes.github.io/markdown-it-chords/) — HTML structure for chord-above-lyric layout (CSS absolute positioning approach verified against project approach)
- Tailwind CSS docs (https://tailwindcss.com/docs/height) — `h-dvh` support for dynamic viewport height

### Tertiary (LOW confidence)

- WebSearch results for ChordPro rendering — confirmed no library matches bracket notation format; no direct verification of React-specific patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and verified in package.json
- Architecture: HIGH — pattern derived directly from actual chart format in default-setlist.ts and existing theme tokens in app.css
- Pitfalls: HIGH for iPad/dvh and sticky header (verified with Tailwind docs); MEDIUM for tokenizer edge cases (derived from chart corpus analysis)

**Research date:** 2026-02-24
**Valid until:** 2026-08-24 (stable stack — Tailwind v4, React 19, Vitest 3 are all current releases)
