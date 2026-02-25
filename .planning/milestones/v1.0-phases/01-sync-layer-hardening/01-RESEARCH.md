# Phase 1: Sync Layer Hardening — Research

**Researched:** 2026-02-24
**Phase Goal:** The sync layer is reliable enough to trust on stage
**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05

---

## 1. Existing Code Review

### Current State

Four source files exist:
- `src/shared/protocol.ts` — Types for Song, Setlist, SessionUser, SessionState, ClientMessage, ServerMessage, and a `generateSessionCode()` utility
- `src/server/deadsync-server.ts` — PartyKit server (339 lines) implementing join, set-song, browse, go-live, set-setlist, transfer-lead, presence, persistence, and HTTP info endpoint
- `src/client/use-deadsync.ts` — React hook (229 lines) wrapping PartySocket with connection management, state sync, and actions
- `src/shared/default-setlist.ts` — 8 Grateful Dead songs with real chord charts

### Known Bugs (confirmed via code review)

**Bug 1: Stale closure in `useDeadSync`** (SYNC-02)
- `handleServerMessage` is wrapped in `useCallback([isLive])` but registered as a message listener in a `useEffect([host, room])` that runs once on mount
- After the effect runs, the message handler captures the initial `isLive` value and never updates
- When a follower browses away (`isLive = false`) and the leader advances, the handler still sees `isLive = true` from the closure — it follows the leader even though the follower browsed away
- **Confidence: HIGH** — directly observable in the code

**Bug 2: 128 KiB storage limit** (SYNC-03)
- Server persists the entire session as one blob: `this.room.storage.put("session", { sessionCode, setlist, liveIndex, leaderId })`
- A 20-song setlist with full chord charts (each 500-2000 bytes of markdown) could easily exceed 128 KiB per value
- The default 8-song setlist is ~4 KiB, so it works now, but a real gig setlist will break
- **Confidence: HIGH** — Cloudflare limit is documented at 128 KiB per value

**Bug 3: No hibernation support** (SYNC-03)
- Server uses `Party.Server` without `options.hibernate = true`
- Uses `this.room` (the older `Party.Room` API) — works but doesn't leverage hibernation
- Without hibernation: max 100 connections per room (fine for a band, but hibernation is free and correct)
- **Confidence: HIGH** — PartyKit docs confirm the pattern

**Bug 4: Eager leader promotion** (SYNC-01)
- `onClose` immediately promotes the first remaining user to leader when the leader disconnects
- No grace period — a WiFi blip on the leader's iPad promotes a follower instantly
- **Confidence: HIGH** — directly observable in `onClose` handler

**Bug 5: No Wake Lock** (SYNC-04)
- No `navigator.wakeLock.request()` anywhere in the codebase
- iPads on music stands will dim and sleep, tearing down the WebSocket connection
- **Confidence: HIGH** — feature simply doesn't exist

**Bug 6: No reconnect re-join** (SYNC-05)
- PartySocket has built-in reconnection, but after reconnecting the client doesn't send a `join` message
- The server sends initial state on `onConnect`, but the user won't be in the users map
- The hook creates the socket once in `useEffect` and doesn't handle reconnection events
- **Confidence: HIGH** — the hook has no reconnect lifecycle handling

### What to Keep

- **Default setlist** — 8 songs with real charts, good test data, keep as-is
- **Core data model** — Song, Setlist, SessionUser types are solid
- **Server handler structure** — the handler methods (handleJoin, handleSetSong, etc.) are well-organized, bugs are fixable without rewriting
- **Session code generator** — works fine

### What to Redesign

- **Protocol messages** — CONTEXT.md says "rethought from scratch." The current types work but should be redesigned with the browse/live dual state, reconnect re-join, and leader grace period in mind
- **Hook message handler** — needs ref-based pattern to fix stale closure
- **Storage layer** — needs sharding to handle larger setlists
- **Server lifecycle** — needs hibernation support and alarm-based leader grace period

---

## 2. PartyKit Hibernation API

**Confidence: HIGH** — documented, widely used

### How to Enable

```typescript
export default class DeadSyncServer implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };
  constructor(readonly room: Party.Room) {}
}
```

### Behavior

- Server goes to sleep between messages when no work to do
- When a client sends a message, the server wakes up: runs constructor, then `onStart`, then handles the message
- Client connections remain active and uninterrupted during hibernation
- Scales from 100 to 32,000 connections per room (not that a band needs it, but it's free)

### Key Requirement: Restore State in `onStart`

Since the server is deallocated from memory during hibernation, all in-memory state is lost. Must reload from storage in `onStart`:

```typescript
async onStart() {
  this.sessionCode = await this.room.storage.get("sessionCode") ?? generateSessionCode();
  this.liveIndex = await this.room.storage.get("liveIndex") ?? 0;
  this.leaderId = await this.room.storage.get("leaderId") ?? null;
  // Songs loaded on demand, not in onStart (partial state loading)
}
```

### Gotchas

- `partykit dev` does NOT hibernate — development behavior differs from production
- Don't do expensive work in `onStart` (it runs on every wake-up)
- Event handlers attached in `onConnect` won't survive hibernation — use `onMessage`/`onClose` callbacks (the current code already does this correctly)
- The `onAlarm` callback works with hibernation — the room wakes up to handle the alarm

---

## 3. Storage Sharding for Setlists

**Confidence: HIGH** — standard Cloudflare pattern

### The Problem

Current code: `this.room.storage.put("session", entireSessionObject)` — the whole setlist is one value. Cloudflare storage limit is 128 KiB per value. Key limit is 2,048 bytes.

### Solution: Split Storage Keys

Store session metadata and songs separately:

```
Key: "meta"        → { sessionCode, liveIndex, leaderId } (~100 bytes)
Key: "setlist"     → { id, name, songCount } (~200 bytes)
Key: "song:0"      → Song object (~2 KiB)
Key: "song:1"      → Song object (~2 KiB)
...
Key: "song:19"     → Song object (~2 KiB)
```

Each song is well under 128 KiB. A 20-song setlist uses ~21 storage keys totaling ~40 KiB.

### Storage API

```typescript
// Write multiple keys atomically (if needed)
await this.room.storage.put("meta", { sessionCode, liveIndex, leaderId });

// Read a specific song
const song = await this.room.storage.get<Song>(`song:${index}`);

// Read all songs (batch)
const songs = await this.room.storage.list({ prefix: "song:" });

// Delete a range
await this.room.storage.delete([...Array(20)].map((_, i) => `song:${i}`));
```

### Performance Consideration

With hibernation, keep `onStart` lean — load the meta key only. Load songs on demand when a client requests state or the full setlist.

---

## 4. Leader Grace Period with Alarms

**Confidence: HIGH** — PartyKit alarms are documented and designed for this

### Pattern

When the leader disconnects, set an alarm for 30 seconds instead of immediately promoting:

```typescript
onClose(connection: Party.Connection) {
  if (this.leaderId === connection.id) {
    // Don't promote yet — set a grace period alarm
    this.pendingLeaderDisconnect = connection.id;
    this.room.storage.setAlarm(Date.now() + 30_000);
    // Store the disconnected leader's info for potential reclaim
    await this.room.storage.put("disconnectedLeader", {
      id: connection.id,
      name: user.name,
      disconnectedAt: Date.now()
    });
  }
  // ... handle user removal from presence
}

onAlarm() {
  // Grace period expired — promote someone
  if (this.pendingLeaderDisconnect) {
    this.promoteNextLeader();
    this.pendingLeaderDisconnect = null;
  }
}
```

### Leader Reclaim on Reconnect

Per CONTEXT.md: "If original leader reconnects (even after promotion), they automatically reclaim leadership."

On join, check if the joining user was the disconnected leader:

```typescript
handleJoin(connection, name, role) {
  const disconnectedLeader = await this.room.storage.get("disconnectedLeader");
  if (disconnectedLeader && name === disconnectedLeader.name) {
    // Cancel alarm, reclaim leadership
    this.room.storage.deleteAlarm();
    // ... promote this user to leader, demote current leader
  }
}
```

### Alarm Limitations

- Only ONE alarm per room at a time — setting a new alarm cancels the previous one
- This is fine for our use case (only one leader grace period at a time)
- Alarm works even if room is hibernating — wakes up the room

### Promotion Order

Per CONTEXT.md: "Promotion goes to first follower who joined the session (predictable — co-bandleader is usually second in)."

Track join order by storing a `joinOrder` array or using timestamps on user entries.

---

## 5. PartySocket Reconnection

**Confidence: HIGH** — built-in, well-documented

### Default Behavior

PartySocket already reconnects automatically with these defaults:
```javascript
maxReconnectionDelay: 10000,        // 10s max between retries
minReconnectionDelay: 1000 + Math.random() * 4000,  // 1-5s initial delay
reconnectionDelayGrowFactor: 1.3,   // exponential backoff
maxRetries: Infinity,               // never give up (exactly what CONTEXT.md wants)
connectionTimeout: 4000,            // 4s connection timeout
maxEnqueuedMessages: Infinity,      // buffer all messages during disconnect
```

This is already perfect for the "never give up" requirement. PartySocket handles the backoff internally.

### What the Hook Needs

The issue isn't reconnection (PartySocket handles it) — it's **re-joining the session after reconnect**:

1. PartySocket reconnects automatically
2. Server `onConnect` fires and sends current state
3. But the user isn't in the users map (they were removed in `onClose`)
4. The hook needs to detect reconnection and send a `join` message

PartySocket emits standard WebSocket events. The hook should:
- Store the user's name and role
- On every `open` event (not just the first), send a `join` message
- On receiving `state`, snap to the live song (per CONTEXT.md: "snap to the current live song automatically")

### Client ID Persistence

PartySocket supports a custom `id` parameter. If the same ID is used on reconnect, the server could potentially recognize it. But since `onClose` already fires and removes the user, a re-join is cleaner and more reliable.

---

## 6. Wake Lock API

**Confidence: HIGH** — browser API, well-supported

### Browser Support

- Safari 16.4+ (March 2023)
- iOS Safari 16.4+
- iPadOS Safari 16.4+
- Chrome, Firefox, Edge — all supported
- Important: PWA bug was fixed in iOS 18.4 (March 2025) — works correctly now

### Implementation

```typescript
async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (!("wakeLock" in navigator)) return null;
  try {
    return await navigator.wakeLock.request("screen");
  } catch (err) {
    // Fails if: page not visible, low battery, system policy
    console.warn("Wake Lock request failed:", err);
    return null;
  }
}
```

### Re-acquisition

Wake Lock is released when the page becomes hidden (tab switch, screen lock). Must re-acquire on `visibilitychange`:

```typescript
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    wakeLock = await requestWakeLock();
  }
});
```

### Placement Decision

Per CONTEXT.md: "Request Wake Lock API on session join." The hook should request it when the connection opens, and re-acquire on visibility change. Since there's no UI yet, this lives in the hook or a small utility module.

### Testing Note

Per CONTEXT.md: "Defer reconnect/Wake Lock verification to UI phase (needs real UI to meaningfully test)." Implement it now, test it properly in Phase 2.

---

## 7. Stale Closure Fix

**Confidence: HIGH** — standard React pattern

### The Problem

```typescript
// Current code — captures `isLive` at useCallback creation time
const handleServerMessage = useCallback((msg: ServerMessage) => {
  if (isLive) { // <-- stale: always the value from when useCallback was created
    setLocalIndex(msg.index);
  }
}, [isLive]); // dependency listed, but handler is registered in a separate useEffect
```

The handler is registered as a listener in `useEffect([host, room])` which only runs once. Even though `useCallback` lists `isLive` as a dependency and would create a new function, the listener in the effect still points to the old function.

### Solution: useRef for Latest State

```typescript
const isLiveRef = useRef(isLive);
useEffect(() => { isLiveRef.current = isLive; }, [isLive]);

// In message handler:
if (isLiveRef.current) {
  setLocalIndex(msg.index);
}
```

Or better — use functional state updates where possible:

```typescript
case "song-changed":
  setSessionState(prev => prev ? { ...prev, liveIndex: msg.index } : prev);
  // Use ref for conditional logic
  if (isLiveRef.current) {
    setLocalIndex(msg.index);
  }
  break;
```

### React 19 Alternative

React 19 has `useEffectEvent` which solves this more elegantly. Since STATE.md mentions upgrading to React 19, this could be used — but useRef works on both 18 and 19 and is simpler to reason about.

### Decision: Whether to Upgrade to React 19

STATE.md mentions "React 19, Tailwind v4, partysocket 1.1.16 — upgrade all three from existing versions." However, CONTEXT.md scope is "Fix known bugs and validate the unreviewed sync layer." Upgrading React is a dependency change that could introduce new issues. **Recommendation: defer React 19 upgrade to Phase 2 (App Shell) where Tailwind v4 setup also happens.** Fix the stale closure with useRef in Phase 1.

---

## 8. Protocol Redesign

**Confidence: MEDIUM** — design decisions needed

### Current Protocol

```
Client → Server: join, set-song, browse, go-live, request-state, set-setlist, transfer-lead
Server → Client: state, song-changed, user-joined, user-left, user-updated, leader-changed, error
```

### Suggested Redesign Considerations

Per CONTEXT.md: "Protocol (protocol.ts) should be rethought from scratch — design fresh message types based on what we now know."

New capabilities to account for:
1. **Reconnect re-join** — the `join` message should handle both first-time join and reconnect
2. **Leader grace period** — server-side only, no new client messages needed, but maybe a `leader-disconnected` server message so followers know the leader is temporarily gone
3. **Browse/live dual state** — the current model works well, but consider making `isLive` purely computed (server-side) rather than client-tracked
4. **Partial state sync** — instead of sending the entire state (including all song charts) on connect, send metadata first and let clients request songs on demand

### Proposed New Messages

```
Client → Server:
  join { name, role, reconnecting? }
  set-song { index }
  browse { index }
  go-live
  set-setlist { setlist }
  transfer-lead { userId }

Server → Client:
  state { sessionCode, setlistMeta, liveIndex, leaderId, users }
  song-changed { index }
  user-joined { user }
  user-left { userId }
  user-updated { user }
  leader-changed { leaderId, leaderName }
  leader-disconnected { graceSeconds }  // NEW: tells followers the leader dropped
  error { message, code? }
```

### Key Design Question

Should song chart content be included in the `state` message or fetched separately? The current approach sends the entire setlist (all charts) on every state sync. For 20 songs that's 20-40 KiB of text — not terrible over WebSocket but wasteful. Consider:
- **Option A:** Keep sending full setlist in state (simple, works for 20 songs)
- **Option B:** Send setlist metadata in state, fetch charts via HTTP endpoint (more complex, but scales better)

**Recommendation: Option A for Phase 1.** A 20-song setlist is small. Optimize in a future phase if needed.

---

## 9. Testing Strategy

**Confidence: MEDIUM** — framework choice is discretionary

### Options

1. **Vitest** — fast, Vite-native, good for unit tests. The project already uses Vite.
2. **vitest-websocket-mock** — mocks WebSocket for testing the hook
3. **Direct server testing** — instantiate the server class directly, pass mock connection objects

### Recommended Approach

**Unit tests (Vitest):**
- Protocol message parsing/validation
- Server handler logic (mock connections, verify broadcasts)
- Hook state management (mock WebSocket)

**Integration test (manual, per CONTEXT.md):**
- `partykit dev` → two browser tabs → leader advances → follower sees it
- Per CONTEXT.md: "Phase is NOT done until partykit dev starts and two browser tabs can sync"

### Server Testing Pattern

The PartyKit server class can be tested by:
1. Creating mock `Party.Room` and `Party.Connection` objects
2. Calling handler methods directly
3. Asserting on what was sent/broadcast

```typescript
// Pseudo-test
const mockRoom = createMockRoom();
const server = new DeadSyncServer(mockRoom);
await server.onStart();

const conn = createMockConnection("user-1");
server.onMessage(JSON.stringify({ type: "join", name: "Jerry", role: "leader" }), conn);

expect(conn.sentMessages).toContainEqual(
  expect.objectContaining({ type: "state" })
);
```

---

## 10. Dependency Versions

### Current vs Targets

| Package | Current | Target | Phase |
|---------|---------|--------|-------|
| react | 18.2.0 | 19.x | Phase 2 |
| react-dom | 18.2.0 | 19.x | Phase 2 |
| partysocket | 1.0.1 | 1.1.16 | Phase 1 (minor) |
| partykit | 0.0.111 | latest | Phase 1 |
| tailwindcss | not installed | v4 | Phase 2 |

**Phase 1 recommendation:** Upgrade `partykit` and `partysocket` to latest (minor/patch, low risk). Defer React 19 and Tailwind to Phase 2.

---

## Summary: What the Planner Needs to Know

1. **Hibernation** is a one-line opt-in (`hibernate: true`) plus ensuring state loads from storage in `onStart`. The server structure is already compatible.

2. **Storage sharding** splits the monolithic `session` blob into `meta` + `song:N` keys. Individual songs are well under 128 KiB. Use `storage.list({ prefix: "song:" })` for batch reads.

3. **Leader grace period** uses PartyKit's `onAlarm` API — set a 30-second alarm on leader disconnect, promote in `onAlarm` if the leader hasn't reconnected. Only one alarm per room (fine for us).

4. **Reconnect** is mostly handled by PartySocket's built-in retry. The hook just needs to send a `join` message on every `open` event (not just the first) and snap to the live song on reconnect.

5. **Stale closure** is fixed with `useRef` to hold latest `isLive` value. Don't need React 19 for this.

6. **Wake Lock** is a small utility: `navigator.wakeLock.request("screen")` on join, re-acquire on `visibilitychange`. Supported on all target browsers. Test properly in Phase 2.

7. **Protocol redesign** should be done first — it's the contract between server and client. Keep it simple, add `leader-disconnected` for grace period visibility, handle reconnect in the `join` message.

8. **Testing** with Vitest for unit/integration tests of protocol, server handlers, and hook logic. Manual smoke test with two tabs to close the phase.

9. **Dependency upgrades** — bump PartyKit and partysocket in Phase 1. Defer React 19 + Tailwind to Phase 2.

## RESEARCH COMPLETE
