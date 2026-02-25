---
phase: 05-follower-ux
plan: 01
subsystem: ui
tags: [react, tailwindcss, css-animations, follower-ux]

requires:
  - phase: 04-navigation-and-leader-controls
    provides: SessionScreen with navigation, SetlistDrawer, isLive/liveIndex from useDeadSync
provides:
  - GoLiveBanner component for snap-back to live song
  - Browse-away gold ring border on SessionScreen
  - Pulse detection for leader-advance-while-browsing
  - Slide-left CSS animation for auto-follow song transitions
  - Go Live snap-back suppression (no animation on instant snap)
affects: [05-follower-ux]

tech-stack:
  added: []
  patterns:
    - "ring-inset for layout-safe border effect (no layout shift)"
    - "CSS @keyframes in app.css for slide-in-left, ring-pulse, pulse-once"
    - "React key-based remount to trigger CSS animation on song change"
    - "justSnappedBackRef pattern to suppress animation for one render cycle"

key-files:
  created:
    - src/client/components/GoLiveBanner.tsx
    - src/client/__tests__/GoLiveBanner.test.tsx
  modified:
    - src/client/components/SessionScreen.tsx
    - src/client/components/ChordChart.tsx
    - src/client/app.css
    - src/client/__tests__/SessionScreen.test.tsx

key-decisions:
  - "ring-4 ring-inset ring-accent-gold for browse-away border — no layout shift vs border which breaks flex"
  - "justSnappedBackRef with requestAnimationFrame for single-frame animation suppression on Go Live"
  - "data-testid='session-root' added for ring class assertions in tests"
  - "animateTransition prop on ChordChart controlled by isLive && !justSnappedBack"

patterns-established:
  - "Conditional ring utility classes for state-dependent screen borders"
  - "Pulse detection via useEffect + prevRef tracking liveIndex changes when !isLive"
  - "Animation suppression via ref + requestAnimationFrame for instant transitions"

requirements-completed: [FOLL-01, FOLL-02, FOLL-03, FOLL-04]

duration: 3min
completed: 2026-02-25
---

# Phase 5 Plan 01: Follower UX Summary

**GoLiveBanner with gold border, pulse effects, and slide-left animation for follower browse-away experience**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T06:42:05Z
- **Completed:** 2026-02-25T06:48:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- GoLiveBanner component with gold background, "GO LIVE" text, accessible aria-label
- Gold ring-4 inset border around SessionScreen when follower browses away
- Pulse detection that fires when leader advances while follower is browsing
- Slide-left CSS animation for auto-follow song transitions (200ms ease-out)
- Go Live snap-back is instant with no animation (justSnappedBackRef pattern)
- 6 new GoLiveBanner tests, 6 new SessionScreen integration tests

## Task Commits

1. **Task 1: Create GoLiveBanner component and CSS keyframes** - `fa41231` (feat)
2. **Task 2: Integrate browse-away visuals and slide animation** - `110cfae` (feat)

## Files Created/Modified
- `src/client/components/GoLiveBanner.tsx` - Gold banner component with pulse support
- `src/client/app.css` - Added slide-in-left, ring-pulse, pulse-once keyframes
- `src/client/__tests__/GoLiveBanner.test.tsx` - 6 tests for banner rendering and behavior
- `src/client/components/SessionScreen.tsx` - GoLiveBanner integration, ring border, pulse detection
- `src/client/components/ChordChart.tsx` - animateTransition prop for slide-left animation
- `src/client/__tests__/SessionScreen.test.tsx` - 6 new tests for browse-away UI

## Decisions Made
- Used ring-4 ring-inset instead of border to avoid flex layout disruption
- 200ms ease-out for slide animation — fast enough for stage, smooth enough to read
- justSnappedBackRef + requestAnimationFrame to suppress animation on Go Live snap-back
- Added data-testid="session-root" for class-based test assertions on the root div

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GoLiveBanner and browse-away visuals complete
- Ready for Plan 05-02: Presence indicators in SetlistDrawer

---
*Phase: 05-follower-ux*
*Completed: 2026-02-25*
