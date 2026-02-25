---
phase: 01-visual-polish
plan: 01
subsystem: ui
tags: [fraunces, commit-mono, tailwind, typography, css]

requires:
  - phase: none
    provides: n/a
provides:
  - Fraunces display font loaded from Google Fonts CDN
  - Commit Mono monospace font self-hosted from public/fonts/
  - Tailwind theme tokens --font-display and --font-mono
  - CSS utility classes .font-display and .font-mono with brand settings
  - Film grain .grain CSS class
  - Brand ::selection style
affects: [01-02]

tech-stack:
  added: [Fraunces (Google Fonts), Commit Mono (self-hosted)]
  patterns: [font-display utility class with WONK/SOFT, font-mono with OpenType features, scoped grain overlay]

key-files:
  created: [public/fonts/CommitMono-Variable.woff2]
  modified: [index.html, src/client/app.css]

key-decisions:
  - "Self-hosted Commit Mono (copied from brand repo) rather than CDN — no external dependency"
  - "Scoped .grain class (www pattern) instead of global body::before (Toneword pattern) — grain only on JoinScreen"
  - "Added ::selection style (bark bg, cream text) per brand guide discretion area"

patterns-established:
  - "font-display class: always use for Fraunces elements — activates WONK 1, SOFT 100"
  - "font-mono class: always use for monospace elements — activates Commit Mono OpenType features"
  - "grain class: add to any element that needs film texture overlay"

requirements-completed: []

duration: 3min
completed: 2026-02-25
---

# Plan 01-01: Font Infrastructure Summary

**Fraunces and Commit Mono font loading with Tailwind theme tokens, CSS utility classes, grain overlay, and brand selection style**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T21:43:00Z
- **Completed:** 2026-02-25T21:46:00Z
- **Tasks:** 2
- **Files modified:** 3 (+ 1 binary font file)

## Accomplishments
- Fraunces variable font loads from Google Fonts with all axes (ital, opsz, wght, SOFT, WONK)
- Commit Mono self-hosted from public/fonts/ with @font-face declaration
- Tailwind @theme tokens --font-display and --font-mono override defaults
- .font-display class applies WONK 1, SOFT 100 variation settings
- .font-mono class applies full OpenType feature settings
- Scoped .grain class with SVG feTurbulence noise overlay
- Brand ::selection style (bark background, cream text)

## Task Commits

1. **Task 1: Copy Commit Mono font and add font loading to index.html** - `764e9d7` (feat)
2. **Task 2: Add @font-face, theme tokens, utility classes, grain, and selection to app.css** - `0d85a69` (feat)

## Files Created/Modified
- `public/fonts/CommitMono-Variable.woff2` - Manzanita custom Commit Mono variable font
- `index.html` - Google Fonts preconnect + Fraunces link with all variable axes
- `src/client/app.css` - @font-face, @theme fonts, utility classes, grain, selection

## Decisions Made
- Self-hosted Commit Mono rather than CDN — avoids external dependency, matches Toneword pattern
- Used scoped `.grain` class (www pattern) instead of global `body::before` (Toneword pattern) — allows grain on JoinScreen only
- Added `::selection` style per brand guide discretion area

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Font infrastructure ready for Plan 02 to apply to components
- All utility classes available: `font-display`, `font-mono`, `grain`

---
*Phase: 01-visual-polish*
*Completed: 2026-02-25*
