---
phase: 01-sync-layer-hardening
plan: "03"
requirements-completed: [SYNC-02, SYNC-04, SYNC-05]
---

# Plan 01-03 Summary: Hook Rewrite

**Status:** Complete
**Duration:** ~10 minutes

## What was built

1. **Stale closure fix** — Replaced `useCallback` message handler with inline handler in `useEffect`. Uses `useRef` to hold latest `isLive` and `sessionState` values. The handler reads from refs, not closures, so it always sees current state.

2. **Reconnect re-join** — Stores user info in `useRef`. On every `open` event (including reconnect), sends a `join` message with `reconnecting: true`. On receiving `state` message, always snaps to live index (covers both initial connect and reconnect).

3. **Wake Lock** — New `src/client/wake-lock.ts` utility with `requestWakeLock()` and `releaseWakeLock()`. Requested on first join, released on disconnect and unmount. Auto re-acquires on `visibilitychange`.

4. **Leader-disconnected handling** — New `leaderDisconnected` state exposed in hook return for future UI indicator.

## Key decisions

- Used `useRef` pattern (not React 19's `useEffectEvent`) — works on React 18 and 19
- Wake Lock is a separate utility module, not inline in the hook
- Message handler defined inside `useEffect` body (not `useCallback`) to eliminate the stale closure pattern entirely
- `sessionStateRef` used for browse action to read current liveIndex

## Key files

### Created
- `src/client/wake-lock.ts` — Wake Lock utility

### Modified
- `src/client/use-deadsync.ts` — Full hook rewrite

## Self-check

- [x] Hook compiles with `tsc --noEmit`
- [x] No `useCallback` wrapping message handler
- [x] `isLiveRef` used in message handler
- [x] Socket open handler sends join with reconnecting flag
- [x] State message handler snaps to live
- [x] Wake Lock requested on join, released on disconnect
- [x] `leaderDisconnected` in return type
