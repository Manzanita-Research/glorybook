---
phase: 03-song-rendering
plan: "02"
subsystem: song-rendering
tags: [react, components, chord-chart, tailwind, testing]
dependency_graph:
  requires:
    - 03-01  # chord-tokenizer (tokenizeChart, ParsedLine, ChordSegment)
    - 02-02  # SessionScreen component exists
  provides:
    - ChordChart component (fully wired to sessionState)
    - SongHeader component
    - ChordLine component
    - BoxGridLine component
  affects:
    - SessionScreen layout (restructured to flex-col h-dvh)
tech_stack:
  added: []
  patterns:
    - useMemo for chart tokenization (memoized on song.chart change)
    - flex flex-col h-full with flex-1 min-h-0 for nested scroll
    - Tailwind color tokens from app.css (text-accent-gold, text-accent-blue, text-accent-purple)
key_files:
  created:
    - src/client/components/ChordLine.tsx
    - src/client/components/BoxGridLine.tsx
    - src/client/components/SongHeader.tsx
    - src/client/components/ChordChart.tsx
    - src/client/__tests__/ChordChart.test.tsx
    - src/client/__tests__/SongHeader.test.tsx
  modified:
    - src/client/components/SessionScreen.tsx
    - src/client/__tests__/SessionScreen.test.tsx
decisions:
  - "useMemo on song.chart — tokenization is pure, memoize once per song change"
  - "flex-1 min-h-0 wrapper — required for overflow-y-auto to work inside flex child"
  - "User list removed from SessionScreen — deferred to Phase 5 (PRES-01/02) with proper presence indicators"
  - "leaderDisconnected notice removed — Phase 5 adds a proper status bar placement"
  - "SongHeader has no sticky positioning — sits outside scroll container in flex layout naturally"
requirements-completed: [SONG-03, SONG-04, SONG-05]
metrics:
  duration: "~8 minutes"
  completed: "2026-02-24"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
  tests_added: 23
  tests_total: 126
---

# Phase 3 Plan 02: Song Rendering Components Summary

**One-liner:** Four React components render color-coded chord charts on stage — gold chords, blue sections, purple annotations, sticky header, independent scroll.

## What Was Built

### Components

**ChordLine.tsx** — Renders one chord-lyric line with above-the-line chord badges. Each segment is an `inline-block` with chord badge (gold, rounded pill) stacked above lyric text. Empty lyrics get `\u00A0` to preserve alignment.

**BoxGridLine.tsx** — Renders pipe-separated chord grid rows. Splits on `|`, filters empty strings from leading/trailing pipes, renders each cell as a bordered box with gold text. The Dead's box-grid notation works naturally.

**SongHeader.tsx** — Compact metadata bar: song title (bold, large), position "N of M" (right-aligned), key (gold accent), tempo, and optional notes (italic, muted). No sticky needed — it lives outside the scroll container.

**ChordChart.tsx** — Top-level composition. Tokenizes `song.chart` with `useMemo` on chart change. Renders `SongHeader` above a `flex-1 overflow-y-auto` body that maps line types to components. Handles all six line types from the chord-tokenizer.

### SessionScreen Restructure

Replaced the "Setlist viewer coming soon" placeholder with the full chart display. Layout changed from `min-h-dvh` to `h-dvh flex flex-col`. The session header is a compact `shrink-0` bar (code, name/role, connection dot). The chord chart wrapper is `flex-1 min-h-0` so ChordChart's internal scroll works correctly.

The user list and leader-disconnected notice were removed — both return in Phase 5 with proper presence indicators and status bar placement.

## Color System

| Element | Class | Color |
|---------|-------|-------|
| Chord badges | `text-accent-gold` + `bg-surface-overlay/60` | `#d4a843` |
| Section headers | `text-accent-blue uppercase font-bold` | `#5b8fb9` |
| Annotations | `text-accent-purple italic` | `#9b72b0` |
| Box grid cells | `text-accent-gold border-border` | `#d4a843` |
| Song title / lyrics | `text-text-primary` | `#f5f0e8` |
| Key value in header | `text-accent-gold` | `#d4a843` |

## Tests

23 new tests added across two files:

- `ChordChart.test.tsx` (13 tests) — title in header, chord badge gold class, section blue class, annotation purple class, lyric text, overflow-y-auto body, font-mono, position indicator, box-grid cells, notes rendering
- `SongHeader.test.tsx` (10 tests) — title, key value, tempo, position "N of M", notes present, notes absent, Key: label, gold key styling, bold title, edge case 1 of 1

Full suite: **126 tests, all passing**.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test selector ambiguity on chord "G" text**
- **Found during:** Task 1 verification
- **Issue:** `getByText("G")` matched three elements (key header span, chord badge, box grid cell). Also `getByText("hello ")` failed — the text is a child of a multi-child span.
- **Fix:** Used `querySelectorAll(".text-accent-gold.rounded")` to target chord badges specifically; used `querySelectorAll(".text-text-primary")` + textContent check for lyrics.
- **Files modified:** `src/client/__tests__/ChordChart.test.tsx`
- **Commit:** e74c02b (included in same task commit)

**2. [Rule 1 - Bug] SessionScreen test "renders connected users list" broke**
- **Found during:** Task 2 verification
- **Issue:** Plan explicitly removes user list from SessionScreen (Phase 5 territory). The test expected `getByText("Bobby")` which no longer exists.
- **Fix:** Updated test to reflect new design — checks for current user name in session header via `/Jerry/` regex match.
- **Files modified:** `src/client/__tests__/SessionScreen.test.tsx`
- **Commit:** ee65080 (included in same task commit)

## Self-Check

### Files Exist
- `src/client/components/ChordLine.tsx` — FOUND
- `src/client/components/BoxGridLine.tsx` — FOUND
- `src/client/components/SongHeader.tsx` — FOUND
- `src/client/components/ChordChart.tsx` — FOUND
- `src/client/__tests__/ChordChart.test.tsx` — FOUND
- `src/client/__tests__/SongHeader.test.tsx` — FOUND

### Commits Exist
- `e74c02b` — feat(03-02): create rendering components — FOUND
- `ee65080` — feat(03-02): wire ChordChart into SessionScreen — FOUND

## Self-Check: PASSED
