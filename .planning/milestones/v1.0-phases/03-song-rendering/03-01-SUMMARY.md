---
phase: 03-song-rendering
plan: 01
subsystem: ui
tags: [chord-tokenizer, typescript, vitest, tdd, pure-functions]

# Dependency graph
requires: []
provides:
  - tokenizeLine pure function classifying all 6 line types from chord chart strings
  - tokenizeChart pure function splitting chart strings into ParsedLine arrays
  - ChordSegment, ParsedLine, LineType types exported for rendering components
affects:
  - 03-song-rendering (downstream plans building ChordLine, SectionHeader, AnnotationLine components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD: tests written and committed before implementation"
    - "Union discriminated types for ParsedLine (type field narrows to correct shape)"
    - "Priority-ordered classification: blank > box-grid > section > annotation > chord-lyric > plain"
    - "String splitting with capturing regex for bracket extraction instead of exec loop"

key-files:
  created:
    - src/client/lib/chord-tokenizer.ts
    - src/client/__tests__/chord-tokenizer.test.ts
  modified: []

key-decisions:
  - "Section check fires before chord-lyric — BRIDGE: [D] → [Am] lines are sections, not chord-lyrics"
  - "Annotation check fires before chord-lyric — → TRANSITION [A] lines are annotations"
  - "Segment extraction uses split on /([\\[^\\]]+])/ to capture leading lyric text naturally"
  - "isAnnotation exported as helper for downstream rendering components"

patterns-established:
  - "Chord bracket notation: [CHORD]lyric text parsed into ChordSegment[]"
  - "Leading lyric before first chord: { chord: '', lyric: 'prefix text ' } segment"
  - "Discriminated union ParsedLine: chord-lyric variant carries segments, others just raw string"

requirements-completed: [SONG-01, SONG-02]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 3 Plan 1: Chord Chart Tokenizer Summary

**Pure `tokenizeLine`/`tokenizeChart` functions classifying 6 line types and extracting typed ChordSegment arrays from `[G]bracket` chord notation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T17:07:33Z
- **Completed:** 2026-02-24T17:09:33Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Wrote 43 failing tests covering all line types and edge cases from the real default setlist
- Implemented tokenizer with priority-ordered classification (blank, box-grid, section, annotation, chord-lyric, plain)
- All 43 new tests pass; full suite of 103 tests passes with no regressions
- `BRIDGE: [D] → [Am]` correctly classified as section (not chord-lyric)
- `→ TRANSITION TO FIRE` correctly classified as annotation (not chord-lyric)
- Leading lyric text before first chord preserved as `{ chord: "", lyric: "..." }` segment

## Task Commits

1. **RED — Failing tests** - `e55a1c0` (test)
2. **GREEN — Implementation** - `807ae3e` (feat)

## Files Created/Modified

- `src/client/lib/chord-tokenizer.ts` - tokenizeLine, tokenizeChart, isAnnotation, all exported types
- `src/client/__tests__/chord-tokenizer.test.ts` - 43 unit tests covering all line types and setlist edge cases

## Decisions Made

- Segment extraction splits line by `/(\[[^\]]+\])/` (capturing regex) to get alternating text/bracket parts — cleaner than an exec loop for handling leading lyric text
- `isAnnotation` exported (not just internal) so downstream components can reuse the same detection logic
- All types exported at module level (LineType union, ChordSegment, ParsedLine) for use in rendering components

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tokenizer is the data foundation for all chord rendering components
- Ready for 03-02: ChordLine component (renders chord-lyric ParsedLine with gold chord / white lyric styling)
- Ready for 03-03: Full ChordChart component assembling all line types into a scrollable view

---
*Phase: 03-song-rendering*
*Completed: 2026-02-24*
