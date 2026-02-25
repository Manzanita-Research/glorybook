---
phase: 02-app-shell
plan: 01
subsystem: ui
tags: [react-19, tailwind-v4, vite-6, partykit]

requires:
  - phase: 01-sync-layer
    provides: PartyKit server and protocol
provides:
  - Vite build pipeline with React 19 and Tailwind v4
  - Dark stage-friendly theme with warm-dark and OLED CSS custom properties
  - PartyKit serve block pointing to dist/ with singlePageApp routing
  - React app entry point (main.tsx, App.tsx, index.html)
affects: [02-app-shell, 03-setlist-viewer, 04-session-management]

tech-stack:
  added: [react-19, tailwindcss-4, "@tailwindcss/vite", vite-6]
  patterns: [css-first-tailwind-config, custom-variant-dark-mode]

key-files:
  created: [index.html, src/client/main.tsx, src/client/App.tsx, src/client/app.css, vite.config.ts]
  modified: [package.json, partykit.json]

key-decisions:
  - "Upgraded Vite 5 to 6 for ESM compatibility with @tailwindcss/vite"
  - "Tailwind v4 CSS-first config with @theme tokens instead of tailwind.config.js"

patterns-established:
  - "Theme tokens: bg-surface, text-text-primary, text-accent-gold etc. via @theme block"
  - "OLED override: .oled class on html swaps surface colors to true black"
  - "Safe area padding: .safe-area-padding class for iPad viewport-fit=cover"

requirements-completed: [SHELL-01, SHELL-02]

duration: 5min
completed: 2026-02-24
---

# Plan 02-01: Vite Entry Point Summary

**React 19 + Tailwind v4 + Vite 6 app shell with warm-dark theme tokens and PartyKit serve block**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 2

## Accomplishments
- React 19.2.4, Tailwind CSS 4.2.1, Vite 6.4.1, partysocket 1.1.16 installed
- Vite build produces dist/index.html with CSS and JS bundles
- Dark stage-friendly theme with warm terracotta/ochre palette via @theme tokens
- OLED black theme override via .oled CSS class
- PartyKit serve block with singlePageApp routing on port 1977
- All 31 existing tests pass after React 19 upgrade

## Task Commits

1. **Task 1: Install dependencies and upgrade React 19 + Tailwind v4** - `84ca13d`
2. **Task 2: Create Vite entry point, Tailwind theme, and PartyKit serve config** - `7f04eb8`

## Files Created/Modified
- `index.html` - Vite HTML entry with dark class, viewport-fit=cover for iPad
- `src/client/main.tsx` - React 19 createRoot bootstrap
- `src/client/App.tsx` - Root component with Glory branding placeholder
- `src/client/app.css` - Tailwind v4 @theme tokens (warm-dark + OLED override)
- `vite.config.ts` - Vite 6 config with react and tailwindcss plugins
- `package.json` - Upgraded deps (react 19, tailwind 4, vite 6, partysocket 1.1)
- `partykit.json` - Added serve block pointing to dist/

## Decisions Made
- Upgraded Vite from 5 to 6: @tailwindcss/vite is ESM-only, Vite 5 CJS config loading could not resolve it. Vite 6 uses native ESM config loading.
- Kept vitest.config.ts separate from vite.config.ts: vitest needs jsdom environment config, vite needs tailwindcss plugin. Vitest auto-reads vitest.config.ts when present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vite 5 to 6 upgrade for ESM compatibility**
- **Found during:** Task 2 (Vite build)
- **Issue:** @tailwindcss/vite is ESM-only, Vite 5 uses CJS config loading via esbuild which cannot require ESM modules
- **Fix:** Upgraded Vite from ^5 to ^6 which uses native ESM config loading
- **Files modified:** package.json
- **Verification:** `npx vite build` succeeds, `npx vitest run` still passes
- **Committed in:** 84ca13d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for build to work. No scope creep.

## Issues Encountered
None beyond the Vite version upgrade noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell renders with dark theme, ready for join screen and session screen (Plan 02-02)
- Vite build pipeline confirmed working
- All existing sync layer tests pass with React 19

---
*Phase: 02-app-shell*
*Completed: 2026-02-24*
