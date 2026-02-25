# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.
**Current focus:** Phase 3 — Song Rendering

## Current Position

Phase: 3 of 6 (Song Rendering)
Plan: 1 of 3 in current phase
Status: Plan 03-01 complete
Last activity: 2026-02-24 — Plan 03-01 complete

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~7 minutes
- Total execution time: ~37 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Sync Layer Hardening | 4 | ~35 min | ~8 min |
| 3. Song Rendering | 1 | ~2 min | ~2 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 01-03, 01-04, 03-01
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

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

### Pending Todos

- ~~Upgrade React 18 -> 19, add Tailwind v4~~ (Done in 02-01)
- ~~Upgrade partysocket 1.0.1 -> 1.1.16~~ (Done in 02-01)
- Manual smoke test: partykit dev + two browser tabs syncing (Phase 2, needs UI)
- Test hibernation + storage sharding against actual Cloudflare deploy (future)

### Blockers/Concerns

- Phase 1 concern resolved: Hibernation and storage sharding implemented, but local `partykit dev` doesn't hibernate. Real Cloudflare testing is deferred.
- Phase 6: Session code word list (Dead song names) needs to be built — the format is decided but the list does not exist yet.

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 03-song-rendering plan 03-01 (chord tokenizer)
Resume file: .planning/phases/03-song-rendering/03-01-SUMMARY.md
