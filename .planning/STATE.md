# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.
**Current focus:** Phase 2 — App Shell

## Current Position

Phase: 2 of 6 (App Shell)
Plan: 2 of 2 in current phase
Status: All plans complete, verifying phase goal
Last activity: 2026-02-24 — Plan 02-02 complete

Progress: [███░░░░░░░] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~8 minutes
- Total execution time: ~35 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Sync Layer Hardening | 4 | ~35 min | ~8 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 01-03, 01-04
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Sync layer has 5 known bugs — stale closure, 128 KiB storage limit, missing hibernation, eager leader promotion, iOS Safari WebSocket teardown. Fix these in Phase 1 before building UI.
- Pre-roadmap: React 19, Tailwind v4, partysocket 1.1.16 — upgrade all three from existing versions.
- Pre-roadmap: Custom chord tokenizer (not ChordSheetJS HTML formatter) — parses `[G]` bracket notation into typed tokens.
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
Stopped at: Phase 2 plans complete, running verification
Resume file: .planning/phases/02-app-shell/02-02-SUMMARY.md
