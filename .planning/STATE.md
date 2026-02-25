# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.
**Current focus:** Phase 7 — Leader Disconnect UI

## Current Position

Phase: 7 of 7 (Leader Disconnect UI) — COMPLETE
Plan: 1 of 1 in current phase
Status: Phase 7 complete (leader disconnect banner)
Last activity: 2026-02-25 — Plan 07-01 complete (leader disconnect banner)

Progress: [█████████░] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~7 minutes
- Total execution time: ~37 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Sync Layer Hardening | 4 | ~35 min | ~8 min |
| 3. Song Rendering | 2 | ~10 min | ~5 min |

**Recent Trend:**
- Last 5 plans: 01-03, 01-04, 03-01, 03-02, 03-02
- Trend: Consistent

*Updated after each plan completion*
| Phase 03-song-rendering P02 | 8 | 2 tasks | 8 files |
| Phase 04 P01 | 2min | 2 tasks | 4 files |
| Phase 04 P02 | 2min | 2 tasks | 6 files |
| Phase 05 P03 | 1min | 2 tasks | 3 files |
| Phase 07 P01 | 1min | 2 tasks | 4 files |

## Accumulated Context

### Roadmap Evolution

- Phase 8 added: clean up tech debt

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Sync layer has 5 known bugs — stale closure, 128 KiB storage limit, missing hibernation, eager leader promotion, iOS Safari WebSocket teardown. Fix these in Phase 1 before building UI.
- Pre-roadmap: React 19, Tailwind v4, partysocket 1.1.16 — upgrade all three from existing versions.
- Pre-roadmap: Custom chord tokenizer (not ChordSheetJS HTML formatter) — parses `[G]` bracket notation into typed tokens.
- Phase 3 (03-01): Chord tokenizer built with TDD. Section check fires before chord-lyric (BRIDGE: [D] is a section). Annotation check fires before chord-lyric (→ TRANSITION [A] is annotation). Segment extraction splits on capturing regex for clean leading-lyric handling.
- Phase 1: Protocol redesigned from scratch with leader-disconnected message, reconnecting flag on join, joinedAt on SessionUser.
- Phase 1: Storage sharded into meta + setlist-info + song:N keys. No single value exceeds 128 KiB.
- Phase 1: Leader grace period uses PartyKit alarm (30 seconds). Reconnecting leader reclaims by name match.
- Phase 1: Stale closure fixed with useRef pattern. React 19 upgrade deferred to Phase 2.
- Phase 1: Wake Lock utility created but real testing deferred to Phase 2 (needs UI).
- [Phase 03-song-rendering]: useMemo on song.chart for tokenization — pure function, memoize once per song change
- [Phase 03-song-rendering]: flex-1 min-h-0 wrapper required for overflow-y-auto to work inside flex child in ChordChart
- [Phase 03-song-rendering]: User list removed from SessionScreen for Phase 3 — returns in Phase 5 (PRES-01/02) with proper presence indicators
- [Phase 05]: Removed state message from onConnect — handleJoin is the sole source of initial state, eliminates race condition

### Pending Todos

- ~~Upgrade React 18 -> 19, add Tailwind v4~~ (Done in 02-01)
- ~~Upgrade partysocket 1.0.1 -> 1.1.16~~ (Done in 02-01)
- Manual smoke test: partykit dev + two browser tabs syncing (Phase 2, needs UI)
- Test hibernation + storage sharding against actual Cloudflare deploy (future)

### Blockers/Concerns

- Phase 1 concern resolved: Hibernation and storage sharding implemented, but local `partykit dev` doesn't hibernate. Real Cloudflare testing is deferred.
- Phase 6: Session code word list (Dead song names) needs to be built — the format is decided but the list does not exist yet.

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 07-01-PLAN.md (leader disconnect banner)
Resume file: .planning/phases/07-leader-disconnect-ui/07-01-SUMMARY.md
