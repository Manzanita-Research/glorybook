---
phase: 08-clean-up-tech-debt
plan: "01"
subsystem: code-quality
tags: [typescript, imports, jsdoc]

requires:
  - phase: 01-sync-layer-hardening
    provides: use-deadsync hook with UseDeadSyncReturn type
  - phase: 03-song-rendering
    provides: chord-tokenizer with test-only exports
provides:
  - Zero TypeScript compiler errors (tsc --noEmit exits 0)
  - Exported UseDeadSyncReturn type for test consumers
  - Canonical import paths in ChordLine
  - @internal JSDoc on test-only chord-tokenizer exports
affects: []

tech-stack:
  added: []
  patterns:
    - "@internal JSDoc for test-only exports"

key-files:
  created: []
  modified:
    - src/client/use-deadsync.ts
    - src/client/__tests__/SessionScreen.test.tsx
    - src/client/components/ChordLine.tsx
    - src/client/lib/chord-tokenizer.ts

key-decisions:
  - "Type annotation on mock object (UseDeadSyncReturn) rather than individual field casts"

patterns-established:
  - "@internal JSDoc: mark exports that exist only for unit testing"

requirements-completed: [tech-debt]

duration: 2min
completed: 2026-02-25
---

# Plan 08-01: Code Fixes Summary

**Zero tsc errors achieved — exported UseDeadSyncReturn type, canonicalized ChordLine import, added @internal JSDoc to test-only exports**

## Performance

- **Duration:** 2 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- tsc --noEmit now exits 0 (was 3 errors from untyped mock object)
- UseDeadSyncReturn exported for test consumers to type their mocks
- ChordLine.tsx import path canonicalized (../lib/ not ../../client/lib/)
- tokenizeLine and isAnnotation marked @internal for test-only usage clarity

## Task Commits

1. **Task 1: Fix TypeScript errors and export UseDeadSyncReturn** - `97b586e` (fix)
2. **Task 2: Fix ChordLine import path and document test-only exports** - `982a75a` (fix)

## Files Created/Modified
- `src/client/use-deadsync.ts` - Exported UseDeadSyncReturn interface
- `src/client/__tests__/SessionScreen.test.tsx` - Added type import and annotation
- `src/client/components/ChordLine.tsx` - Canonical import path
- `src/client/lib/chord-tokenizer.ts` - @internal JSDoc on test-only exports

## Decisions Made
- Used type annotation on defaultMockReturn rather than individual field casts — cleaner and catches all type mismatches at once

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
- Code-level tech debt resolved, documentation fixes remain in 08-02

---
*Phase: 08-clean-up-tech-debt*
*Completed: 2026-02-25*
