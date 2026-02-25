# Phase 1: Visual Polish - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring Glory's visual presentation in line with Manzanita Research brand identity. Typography, texture, label styling, and overall polish. No new features, no layout restructuring — refine the existing UI to feel like it belongs in the same family as manzanita.computer and Toneword.

</domain>

<decisions>
## Implementation Decisions

### Typography
- Add Fraunces as display font for "Glory" branding, song titles, and headings — always with `font-variation-settings: 'WONK' 1, 'SOFT' 100`
- Add Commit Mono (self-hosted from org/fonts/CommitMono-Variable.woff2) for chord charts and monospace content — with full OpenType features: `font-feature-settings: 'cv01' 1, 'cv03' 1, 'cv04' 1, 'cv06' 1, 'cv11' 1, 'ss01' 1, 'ss02' 1, 'ss03' 1, 'ss04' 1, 'ss05' 1`
- Body/UI text stays as system sans-serif — this is a stage tool, not an editorial site. Readability under lights > brand purity for small UI labels

### Label styling
- Section labels (like "Key:", "Role", "Session code", presence labels) should use uppercase tracking (`text-xs uppercase tracking-[0.2em]`) consistent with Toneword and www
- Monospace accent for metadata labels where appropriate (matching Toneword's `SPECTRUM — REAL-TIME OUTPUT` style)

### Texture
- Add subtle film grain overlay to JoinScreen background (matching www's `.grain` pattern)
- Session screen stays clean — chord charts need maximum readability, grain would interfere

### Color refinements
- Current warm-dark palette is on-brand — keep it
- Ensure the "Glory" wordmark and key branding moments use the ochre/gold accent consistently
- Review border and surface contrast for brand warmth (current `#1a1410` surface tones are good)

### Claude's Discretion
- Exact font loading strategy (Google Fonts CDN for Fraunces, self-hosted for Commit Mono)
- Whether to adjust font sizes or keep current sizing
- Transition/animation refinements if any feel off during implementation
- Whether to add a `::selection` style matching the brand (bark bg, cream text)
- Spacing micro-adjustments for visual balance after font swap

</decisions>

<specifics>
## Specific Ideas

- Toneword's "TONE*WORD*" branding uses Fraunces with italic on the second word — Glory's wordmark could benefit from similar typographic personality
- www's Hero uses `font-light` Fraunces at large sizes with tight leading — that editorial weight is the target feel for Glory's song titles
- The uppercase monospace labels in Toneword (e.g., `SOURCE`, `TONE WORDS`, `TONE RECIPES`) establish hierarchy without shouting — Glory's section labels should follow this pattern
- Brand guide: "Typography should feel human. Something with a little weight and character — not a geometric sans-serif from a startup template."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-visual-polish*
*Context gathered: 2026-02-25*
