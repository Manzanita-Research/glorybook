# Plan 01-02 Summary: Server Hardening

**Status:** Complete
**Duration:** ~10 minutes

## What was built

Rewrote `src/server/deadsync-server.ts` with three critical fixes:

1. **Hibernation** — `options: { hibernate: true }` enables Durable Object hibernation. Server sleeps between messages, restores state from storage in `onStart`.

2. **Sharded storage** — Session data split into separate keys: `meta` (session code, live index, leader ID), `setlist-info` (id, name, song count), and individual `song:N` keys. No single value exceeds 128 KiB. Default setlist seeded on first start.

3. **Leader grace period** — On leader disconnect, sets a 30-second alarm instead of immediately promoting. If the leader reconnects (by name match), they reclaim leadership and the alarm is cancelled. If the alarm fires, the first follower by `joinedAt` order is promoted.

## Key decisions

- Leader reclaim matches by name (not connection ID, which changes on reconnect)
- Songs loaded lazily via `getFullSetlist()` — reads all `song:*` keys and sorts by index
- `onAlarm` handles promotion with join-order sorting
- HTTP endpoint updated to read current song from sharded storage

## Key files

### Modified
- `src/server/deadsync-server.ts` — Full server rewrite with hibernation, sharded storage, grace period

## Self-check

- [x] Server compiles with `tsc --noEmit`
- [x] `options.hibernate = true` present
- [x] Storage uses sharded keys (meta, setlist-info, song:N)
- [x] onClose sets 30-second alarm for leader disconnect
- [x] onAlarm promotes by joinedAt order
- [x] handleJoin checks disconnectedLeader for reclaim
- [x] Default setlist seeded on first start
