---
phase: 01-sync-layer-hardening
plan: "01"
requirements-completed: []
---

# Plan 01-01 Summary: Protocol Redesign

**Status:** Complete
**Duration:** ~5 minutes

## What was built

Rewrote `src/shared/protocol.ts` from scratch with the full message contract for the DeadSync sync layer. Added `joinedAt` to `SessionUser` for leader promotion ordering. Added `leader-disconnected` server message for grace period visibility. Added optional `reconnecting` flag to `join` message. Added optional `code` field to error messages. Extracted session word list as a const array.

## Key decisions

- Kept full setlist in state message (not metadata-only) per research recommendation — 20 songs is small enough
- Added `joinedAt: number` (Date.now() timestamp) to SessionUser for deterministic leader promotion order
- Used `as const` for session word list for type narrowing

## Key files

### Created
(none — rewrites only)

### Modified
- `src/shared/protocol.ts` — Complete protocol v2 with all message types

## Self-check

- [x] Protocol compiles with `tsc --noEmit`
- [x] ClientMessage includes join with reconnecting flag
- [x] ServerMessage includes leader-disconnected
- [x] SessionUser includes joinedAt
- [x] Default setlist compiles against updated types
