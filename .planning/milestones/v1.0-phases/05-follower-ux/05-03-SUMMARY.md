---
phase: 05-follower-ux
plan: 03
subsystem: sync, presence
tags: [partykit, websocket, presence, deadsync]

# Dependency graph
requires:
  - phase: 05-follower-ux/02
    provides: "PresenceList component, SetlistDrawer with presence integration"
provides:
  - "Server sends state only after join — no premature onConnect state"
  - "All connected users reliably appear in the presence list"
  - "Integration test covering presence dot colors end-to-end"
affects: [06-session-entry]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State sent only from handleJoin, never onConnect — eliminates race condition"

key-files:
  created: []
  modified:
    - src/server/deadsync-server.ts
    - src/server/__tests__/deadsync-server.test.ts
    - src/client/__tests__/SessionScreen.test.tsx

key-decisions:
  - "Removed state message from onConnect — handleJoin is the sole source of initial state"

patterns-established:
  - "onConnect is a no-op for state; client always sends join first, server responds with full state after user is in the Map"

requirements-completed: [PRES-01, PRES-02, FOLL-01, FOLL-02, FOLL-03, FOLL-04]

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 5 Plan 3: Presence List Fix Summary

**Removed premature state from onConnect so all users (leader included) appear in presence list, verified with server and integration tests**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-25T07:20:10Z
- **Completed:** 2026-02-25T07:21:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed UAT Test 8: leader now reliably appears in follower's presence list
- Verified UAT Test 9: green dots for live users, gold dots for browsing users
- Added integration test confirming data flows from useDeadSync through SetlistDrawer to PresenceList
- Full test suite green (185 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix leader missing from presence list** - `040e2bd` (fix)
2. **Task 2: Verify presence dots and add integration test** - `02d230e` (test)

## Files Created/Modified
- `src/server/deadsync-server.ts` - Removed premature state send from onConnect
- `src/server/__tests__/deadsync-server.test.ts` - Added 2 tests: follower state includes both users, state only after join
- `src/client/__tests__/SessionScreen.test.tsx` - Added integration test for presence dot colors (UAT Test 9)

## Decisions Made
- Removed state message from onConnect entirely. The client always sends a join message immediately after connecting, and handleJoin responds with full state after the user is added to the Map. This eliminates the race where a premature state could overwrite or precede the complete one.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 5 presence requirements fully met (UAT Tests 8 and 9 resolved)
- Ready for Phase 6 (Session Entry and Polish)

---
*Phase: 05-follower-ux*
*Completed: 2026-02-25*
