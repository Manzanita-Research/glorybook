# Phase 3: Song Rendering - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Render the current song's chord chart from markdown into a readable, color-coded display optimized for stage use on iPad. Covers: markdown parsing, chord highlighting, section headers, annotations, sticky song header, scrollable chart body. Does NOT cover: song navigation, setlist sidebar, leader/follower controls, or canvas-based chart editing.

</domain>

<decisions>
## Implementation Decisions

### Chord layout
- Chords render ABOVE the line they attach to, not inline with lyrics
- Chord position aligns above the syllable where the bracket appears in the markdown source
- Chord-only lines (no lyrics) render in box grid notation: `|G   |C   |D   |%   |`
- The `%` repeat symbol renders as-is — musicians know what it means

### Chord parsing
- Anything in `[brackets]` is treated as a chord — loose parsing, no validation against chord grammar
- Brackets are stripped from display; the chord name gets gold pill treatment
- Box grid lines (pipes + chord names) are detected and rendered as a visual grid

### Color system
- **Chords (gold):** Gold text on a dark semi-transparent background pill/badge. Must pop under dim stage lighting.
- **Section headers (blue):** Bold uppercase labels (e.g., `CHORUS:`, `VERSE:`, `JAM SECTION:`). Blue text, prominent landmarks for scanning.
- **Annotations (purple):** Italic, slightly dimmer than lyrics. For band notes, transitions, stage directions.
- **Lyrics:** Warm off-white / cream on dark background. Not pure white — easier on the eyes during long sets.

### Song header bar
- Sticky at the top, chart scrolls beneath it
- Contains: song title, key (displayed exactly as-is from data, e.g., "A → B"), tempo, song position ("3 of 8"), and song notes
- Separated from chart body by a thin border line (not shadow)
- Long notes handling: Claude's discretion

### Typography
- Monospaced font throughout the chart for chord alignment
- Minimum 20px font size for stage readability at arm's length
- Line spacing: Claude's discretion (optimize for stage readability)

### Claude's Discretion
- Line spacing / vertical rhythm between lines and sections
- Treatment of transition arrows (→) — annotation style or distinct callout
- Treatment of parenthetical stage directions — how they differ from other annotations
- Section dividers between major sections (whitespace vs thin rules)
- Long notes truncation behavior in the header

</decisions>

<specifics>
## Specific Ideas

- Above-the-line chord layout is the classic chord chart look — chords float on their own row above the syllable they attach to
- Box grid for chord-only passages gives clear bar boundaries: `|G   |C   |D   |%   |`
- Section headers should be scannable landmarks — when you glance at the chart, CHORUS and BRIDGE should jump out immediately
- Gold chord pills should be the most visually prominent element after the section headers — they're what you're playing
- The header should give you full context without scrolling: what song, what key, what feel, where in the set, any special notes

</specifics>

<deferred>
## Deferred Ideas

- tldraw canvas view for chart input/annotation — FUT-01, future phase. User wants the option to choose between text and canvas views for inputting song data in a v2.
- Font size adjustment (pinch or setting) — POL-01, v2 requirement

</deferred>

---

*Phase: 03-song-rendering*
*Context gathered: 2026-02-24*
