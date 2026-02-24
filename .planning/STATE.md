# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.
**Current focus:** Phase 1 — Sync Layer Hardening

## Current Position

Phase: 1 of 6 (Sync Layer Hardening)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-24 — Roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Sync layer has 5 known bugs — stale closure, 128 KiB storage limit, missing hibernation, eager leader promotion, iOS Safari WebSocket teardown. Fix these in Phase 1 before building UI.
- Pre-roadmap: React 19, Tailwind v4, partysocket 1.1.16 — upgrade all three from existing versions.
- Pre-roadmap: Custom chord tokenizer (not ChordSheetJS HTML formatter) — parses `[G]` bracket notation into typed tokens.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Hibernation and storage sharding fixes must be tested against an actual Cloudflare deploy, not just local `partykit dev` — local has no limits and no hibernation.
- Phase 6: Session code word list (Dead song names) needs to be built — the format is decided but the list does not exist yet.

## Session Continuity

Last session: 2026-02-24
Stopped at: Roadmap created, requirements mapped, STATE.md initialized
Resume file: None
