---
phase: 05-follower-ux
plan: 02
subsystem: ui
tags: [react, presence, follower-ux]

requires:
  - phase: 05-follower-ux
    plan: 01
    provides: GoLiveBanner, browse-away border, SessionScreen with isLive/liveIndex integration
provides:
  - PresenceList component with status dots and leader marking
  - SetlistDrawer renders presence indicators below song list
  - SessionScreen passes users and leaderId through to drawer
affects: [05-follower-ux]

tech-stack:
  added: []
  patterns:
    - "PresenceList as pinned footer in SetlistDrawer (shrink-0 below scrollable song list)"
    - "Green dot (bg-status-connected) for live users, gold dot (bg-accent-gold) for browsing"
    - "role=img with aria-label on status dots for accessibility"

key-files:
  created:
    - src/client/components/PresenceList.tsx
    - src/client/__tests__/PresenceList.test.tsx
  modified:
    - src/client/components/SetlistDrawer.tsx
    - src/client/__tests__/SetlistDrawer.test.tsx
    - src/client/__tests__/SessionScreen.test.tsx

key-decisions:
  - "PresenceList pinned at drawer bottom with shrink-0, song list scrolls above it"
  - "Status dots use role=img with aria-label Live or Browsing for screen readers"
  - "Leader marked with small (lead) text label, not a separate icon"
  - "SessionScreen test for presence uses Bobby assertion (unique to presence) to avoid Jerry ambiguity with header"

patterns-established:
  - "Presence indicators as compact footer section in overlay drawers"
  - "getAllByText for test assertions when a name appears in multiple DOM locations"

requirements-completed: [PRES-01, PRES-02]

duration: 2min
completed: 2026-02-25
---

# Phase 5 Plan 02: Presence Indicators Summary

**PresenceList component with colored status dots integrated into SetlistDrawer**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T06:48:00Z
- **Completed:** 2026-02-25T06:55:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PresenceList component showing connected users with green (live) and gold (browsing) status dots
- Leader identified with "(lead)" label
- Integrated into SetlistDrawer as pinned footer below scrollable song list
- SessionScreen passes users and leaderId props through to SetlistDrawer
- 9 PresenceList tests, 2 new SetlistDrawer tests, 1 new SessionScreen integration test

## Task Commits

1. **Task 1: Create PresenceList component with tests** - `a06b5f0` (feat)
2. **Task 2: Integrate into SetlistDrawer and wire from SessionScreen** - `579a475` (feat)

## Files Created/Modified
- `src/client/components/PresenceList.tsx` - Compact user list with status dots and leader marking
- `src/client/__tests__/PresenceList.test.tsx` - 9 tests for rendering, dots, leader label, accessibility
- `src/client/components/SetlistDrawer.tsx` - Added users/leaderId props, renders PresenceList at bottom
- `src/client/__tests__/SetlistDrawer.test.tsx` - 2 new tests for presence rendering and status dots
- `src/client/__tests__/SessionScreen.test.tsx` - 1 new test for presence data flowing to drawer

## Decisions Made
- PresenceList sits at the bottom of SetlistDrawer with shrink-0 to stay pinned while songs scroll
- Status dots use role="img" with descriptive aria-labels for accessibility
- Leader marking is a simple "(lead)" text label — minimal and not distracting on stage
- Used getAllByText in SessionScreen test to handle Jerry appearing in both header and presence list

## Deviations from Plan
- SessionScreen test originally used getByText(/Jerry/) which failed due to Jerry appearing in both header and presence list. Fixed by asserting on Bobby (unique to presence) and using getAllByText.

## Issues Encountered
- "Found multiple elements with text /Jerry/" — resolved by targeting Bobby instead for presence assertions

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All Phase 5 requirements complete (FOLL-01 through FOLL-04, PRES-01, PRES-02)
- Ready for Phase 6: Session Entry and Polish

---
*Phase: 05-follower-ux*
*Completed: 2026-02-25*
