# Pitfalls Research

**Domain:** Real-time collaborative setlist sync — WebSocket, PartyKit, React, iPad stage use
**Researched:** 2026-02-24
**Confidence:** HIGH (code reviewed directly; pitfalls verified against existing source files and external research)

---

## Critical Pitfalls

### Pitfall 1: Stale Closure Trapping `isLive` in the Message Handler

**What goes wrong:**
The `handleServerMessage` callback in `use-deadsync.ts` is memoized with `useCallback` and lists `isLive` as a dependency. The message event listener is registered once inside `useEffect` on mount. Because React closures capture values at the time of render, the `isLive` value seen by `handleServerMessage` may be stale when a `song-changed` message arrives. If a follower goes live after the initial render, the closed-over `isLive` in the event handler will still read `false`, and the client will silently stop following the leader.

**Why it happens:**
The `useEffect` that registers the WebSocket listeners doesn't include `handleServerMessage` in its dependency array. The socket is created once (`[host, room]` deps), but `handleServerMessage` is recreated when `isLive` changes. The existing event listener is never re-bound to the new callback.

**How to avoid:**
Use a `useRef` to hold the latest `handleServerMessage` function, and call `currentHandlerRef.current(msg)` inside the static event listener. This pattern decouples listener registration from handler updates:

```ts
const handlerRef = useRef(handleServerMessage);
useEffect(() => { handlerRef.current = handleServerMessage; });
// inside the socket useEffect:
socket.addEventListener("message", (e) => handlerRef.current(JSON.parse(e.data)));
```

Alternatively, move `isLive` state into a ref that's mutated directly, keeping it readable without closures.

**Warning signs:**
- Followers tap "GO LIVE" but continue to see their browsed song rather than the leader's song
- Unit tests for the hook pass (testing in isolation), but in integration the follower state drifts
- The bug only appears after a user has browsed away and returned — initial state works fine

**Phase to address:**
Phase 1 (hook review and validation) — before the UI is built on top of it

---

### Pitfall 2: Full Setlist Persisted as a Single Storage Key — Will Hit 128 KiB Limit

**What goes wrong:**
The server persists the entire session state — including the full `Setlist` with all song chart content — under a single key: `"session"`. Cloudflare Durable Objects key-value storage has a hard 128 KiB per-value limit. The default setlist has 8 songs with real chord charts in markdown. If a user loads a 20-song setlist, or songs with extended annotations, the single stored object will silently fail or throw.

**Why it happens:**
The existing `persistState()` method calls `this.room.storage.put("session", { ... setlist: this.setlist ... })`. This was written for a small demo. Chord charts for a full Dead show can be 2–5 KB each; 40 songs × 4 KB = 160 KB, already over the limit.

**How to avoid:**
Shard storage across multiple keys. Store song charts separately under `song:{id}` keys, and keep only metadata (sessionCode, liveIndex, leaderId, setlist name and song IDs) under the `"session"` key. Load charts on demand. The PartyKit docs explicitly recommend this pattern:

```ts
// Store song under its own key
this.room.storage.put(`song:${song.id}`, song.chart);
// Session key holds only lightweight metadata
this.room.storage.put("session", { sessionCode, liveIndex, leaderId, songIds });
```

**Warning signs:**
- Storage errors appear in PartyKit logs when setlist is loaded or updated
- Session state survives a server restart but setlist is missing or truncated
- Local dev works (no storage limit in dev mode) but deploy fails

**Phase to address:**
Phase 1 (server review) — before any setlist management UI is built

---

### Pitfall 3: No Hibernation Enabled — Server Idles Unnecessarily Between Songs

**What goes wrong:**
The existing `DeadSyncServer` does not set `options: { hibernate: true }`. Without hibernation, the Durable Object stays alive in memory between all messages. During a show, the band might stay on one song for 20 minutes — the DO burns CPU/memory the entire time doing nothing. More practically: without hibernation, the state management pattern used (in-memory `Map` for users) will not survive hibernation wake-ups anyway, creating a false sense of security.

**Why it happens:**
Hibernation requires opting in. It was skipped during the original one-shot implementation. The tradeoff wasn't evaluated: for a low-concurrency jam session, hibernation is fine and reduces cost/complexity.

**How to avoid:**
Enable hibernation. Audit all state that lives in instance variables (`this.users`, `this.leaderId`, etc.) — none of it survives hibernation. Move presence state into connection `.setState()` (2 KB per connection limit, plenty for a `SessionUser`) and reload session metadata from storage in `onStart`. This is also the recommended PartyKit pattern for presence management.

**Warning signs:**
- After server sits idle for a few minutes, the next message arrives and presence data is empty
- Connected users disappear from the presence list between songs
- Local dev (no hibernation) never shows the bug; production (Cloudflare) does

**Phase to address:**
Phase 1 (server review) — foundational to the server's reliability

---

### Pitfall 4: iOS Safari Drops WebSocket When iPad Goes to Sleep or Switches Apps

**What goes wrong:**
On stage, a musician sets their iPad down for a few minutes. iOS suspends the Safari tab, killing the WebSocket connection. When they pick it up, PartySocket auto-reconnects — but the reconnected client sees the state snapshot from `onConnect`, not a `join` message. If `handleJoin` was never called on reconnect (because the user skips the join screen), the user appears in the presence list as a ghost from the previous connection.

**Why it happens:**
iOS Safari aggressively closes network connections when a tab is backgrounded or the screen locks. This is documented behavior, not a bug. PartySocket will reconnect automatically, but the server treats this as a new connection — the old `connection.id` is gone, and the user must re-join. The current server sends `state` on `onConnect`, but the client UI must also handle the re-join flow gracefully.

**How to avoid:**
- Request a Screen Wake Lock via the Wake Lock API (`navigator.wakeLock.request('screen')`) on app start. Supported in iOS Safari 16.4+, with a known bug in PWA mode fixed in iOS 18.4.
- On reconnect, immediately re-send the `join` message with the user's cached name and role (store both in `localStorage`).
- Show a subtle "Reconnecting..." indicator — never a modal that blocks the chart view.
- Design the server's `onClose` to handle the leader dropping briefly: promote a new leader only after a grace period (or keep leader state in storage, not just in-memory presence).

**Warning signs:**
- During rehearsal, musicians complain they "get kicked" and lose their place after the phone idles
- Presence indicators show duplicate or ghost users
- The leader role is silently transferred mid-song when the leader's iPad sleeps

**Phase to address:**
Phase 2 (UI shell) — Wake Lock must be requested at app start; Phase 3 (presence/UX) — reconnect flow

---

### Pitfall 5: Automatic Leader Promotion on Disconnect Can Happen Mid-Song

**What goes wrong:**
The current `onClose` handler immediately promotes the first remaining user to leader if the current leader disconnects. During a show, the band leader's WiFi hiccups for 2 seconds. A follower — possibly a musician who just joined — is instantly promoted to leader. They don't know this. The leader comes back, reconnects, and is now a follower. The song can no longer be advanced by the person who should be advancing it.

**Why it happens:**
The promotion logic is eager — no grace period, no user intent. In distributed systems this is called "split brain." For a concert context, it's just chaos.

**How to avoid:**
- Persist the intended leader's name (or a shared secret) in storage. On reconnect, the returning leader should be able to re-claim the role.
- Add a configurable grace period (3–5 seconds) before promoting. Use a stored timeout or use PartyKit's alarm API.
- Alternatively: do not auto-promote. Instead, broadcast a `leader-needed` message to all clients and let the next song be held until someone explicitly steps up — surfaced in the UI as a banner.
- At minimum: persist `leaderId` in storage (already done) and use it to restore the leader role if that connection.id rejoins.

**Warning signs:**
- Repeated complaints that the leader "lost control" after a brief disconnection
- The leader's "Next Song" button is grayed out (because they are now a follower)
- Presence list shows no leader

**Phase to address:**
Phase 1 (server review) — must be settled before first gig

---

## Technical Debt Patterns

Shortcuts that seem fine but create real problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Persisting entire setlist as one storage key | Simple `persistState()` | Hits 128 KiB limit with real setlists | Never — shard from the start |
| In-memory `Map` for user presence without hibernation | Simple code | Presence vanishes after idle period in production | Never in production |
| Skipping `join` re-send on reconnect | Simpler reconnect logic | Ghost users, missing presence, broken role state | Never for on-stage use |
| No Wake Lock request | Less code, one less permission | iPad sleeps mid-set, kills connection | Never for primary gig device |
| Using `useCallback` with `isLive` dep for socket handler | Feels "correct" hooks usage | Stale closure silently breaks follower sync | Never — use ref pattern instead |
| Auto-promote first user to leader on disconnect | No dead state | Wrong person becomes leader mid-show | Never without grace period |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PartyKit storage | Storing large objects under one key | Shard: metadata key + one key per song |
| PartyKit hibernation | Relying on instance vars for presence state | Store user presence in `connection.setState()`, recover from storage on wake |
| PartySocket reconnect | Assuming reconnect = re-join | Explicitly re-send `join` on socket `open` if session was already joined |
| iOS Safari Wake Lock | Not requesting it, or requesting it too late | Request `wakeLock` immediately on app load, re-request on `visibilitychange` |
| Vite + PartyKit dev | HMR causes new `socket.id`, drops the user from presence | Expected behavior; suppress by persisting user info in `sessionStorage` |
| Cloudflare edge deploy vs local dev | Local has no storage limits, no hibernation | Test full storage and presence lifecycle on Cloudflare before first gig |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-parsing markdown on every render | Chart view stutters when song-changed arrives | Memoize parsed output with `useMemo`; parse once per song | Immediately visible on older iPads |
| Sending full `state` on every `browse` message | Followers see lag when someone browses the setlist quickly | `browse` only needs a `user-updated` event, not full state — already designed this way, don't regress it | At ~4+ users browsing rapidly |
| Broadcasting `user-updated` for every scroll position | Network flood during setlist browsing | Debounce `browse` sends on the client (100–200ms) | At 5+ users on slow venue WiFi |
| Chord highlighting regex on every keypress | Not applicable for read-only charts | Pre-process highlighting at parse time, not in render | N/A |
| Large chord chart not memoized between followers | All followers re-render on every `user-updated` from any user | Use `React.memo` on the chart component; only re-render when `currentSong.id` changes | At 3+ users with a presence sidebar updating |

---

## Security Mistakes

This is a local-network / private-session tool, not a public web app. The threat model is different.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Any connected client can call `set-setlist` by spoofing leader role | Someone wipes the setlist mid-show | Server already validates `connection.id === this.leaderId` — keep this check |
| Session room IDs are guessable (Dead song names are finite) | Random person joins the session | Room IDs are `word-NNN` with 16 words × 1000 suffixes = 16,000 combinations. Add a PIN for public deploys. For local gig use, WiFi isolation is sufficient. |
| Setlist chart content is sent to all clients unredacted | Chord charts are visible to anyone who can join | Intentional and correct for this use case — musicians need the charts |
| No rate limiting on `set-song` messages | A bad actor can thrash the song index | PartyKit rate-limiting example pattern: check `connection.state.lastMessageTime` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Modal or alert on reconnect | Blocks chord chart view right when musician needs it | Use a non-blocking status bar or subtle indicator |
| "GO LIVE" button visible to the leader | Confusing — leader is always live | Show "GO LIVE" only to followers who have browsed away |
| Song index starts at 0 but setlist shows "Song 1 of 8" | Mismatch between internal state and display | Always display `index + 1` to users |
| Advancing to the next song scrolls chart to middle of page | Musician misses the song title and key | Reset scroll position to top on every `currentSong` change |
| Pure black background (`#000000`) | Increases screen glare under stage lights on glossy iPad | Use dark charcoal (`#111`, `#1a1a1a`) — absorbs less light, easier on eyes |
| Touch targets smaller than 44×44pt | Fat-finger misses during performance | All nav controls (prev/next, GO LIVE) must be minimum 48×48pt hit area |
| No visual distinction between leader and follower view | Followers think they can advance songs | Leader UI should have distinct controls that followers never see |
| Error messages surfaced as browser alerts | Blocks interaction | Log errors to console in dev; surface as transient toast in production |

---

## "Looks Done But Isn't" Checklist

- [ ] **Reconnect flow:** PartySocket reconnects, but is `join` re-sent? Verify the user re-appears in presence after a 10-second disconnect.
- [ ] **Wake Lock:** Is `navigator.wakeLock.request('screen')` called? Verify by watching the screen timeout during a 30-minute rehearsal.
- [ ] **Storage sharding:** Does the setlist survive a server restart with 20+ songs? Test with a full-sized setlist, not just the 8-song demo.
- [ ] **Hibernation compatibility:** Does presence (user list) survive a 10-minute idle period on Cloudflare deploy? Local dev will not catch this.
- [ ] **Leader disconnect recovery:** What happens when the leader's device loses WiFi for 5 seconds? Is the leader role correctly restored on reconnect?
- [ ] **Follower state after go-live:** After browsing to song 3 and tapping GO LIVE, does the client immediately show the leader's current song — or does it wait for the next message?
- [ ] **isLive closure bug:** Open two tabs. Have one follow the leader, have the other browse away then go live. Verify both clients show the same song when the leader advances.
- [ ] **Touch targets on iPad:** Verify every interactive element passes the 44pt minimum with a finger, not a mouse.
- [ ] **Chord highlighting doesn't re-parse on presence updates:** Confirm the chart component does not re-render when another user updates their position.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale closure bug in hook | LOW | Refactor handler to use ref pattern; no protocol changes needed |
| Storage key size exceeded | MEDIUM | Migrate to sharded storage keys; existing sessions lose their setlist on next deploy |
| No hibernation | MEDIUM | Enable `hibernate: true`; move user presence to `connection.setState()`; test full lifecycle |
| Leader lost on disconnect | LOW | Add grace period + storage-based leader restoration; backward-compatible change |
| iOS wake lock missing | LOW | Add 5 lines on app mount; test on physical iPad |
| Stale setlist after reconnect | LOW | Re-send `request-state` on every reconnect; server already handles it |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale `isLive` closure in hook | Phase 1: Sync layer review | Unit test: go-live after browse in isolated hook test |
| Setlist storage key size limit | Phase 1: Sync layer review | Integration test: load 25-song setlist, restart server, confirm state persists |
| No hibernation + in-memory presence | Phase 1: Sync layer review | Deploy to Cloudflare, let idle 10 min, verify presence recovers |
| iOS Safari disconnects on sleep | Phase 2: App shell | Physical iPad test: lock screen for 30s, verify reconnect and re-join |
| Auto leader promotion on disconnect | Phase 1: Sync layer review | Test: leader disconnects 3s, reconnects — verify role restored |
| Stale markdown parse on re-render | Phase 3: Chart view | Profile render on song-change with React DevTools on iPad |
| Touch target size | Phase 2: App shell | Tap all controls with finger on physical iPad |
| Missing reconnect re-join | Phase 2: App shell | Test: kill socket manually, verify user re-appears in presence |
| Wake Lock not requested | Phase 2: App shell | 30-minute idle test on physical iPad at screen brightness |

---

## Sources

- PartyKit documentation — hibernation and storage patterns: https://docs.partykit.io/guides/scaling-partykit-servers-with-hibernation/
- PartyKit storage sharding pattern (Context7 / GitHub): https://github.com/partykit/partykit/blob/main/apps/docs/src/content/docs/guides/persisting-state-into-storage.md
- Cloudflare Durable Objects limits (128 KiB per KV value): https://developers.cloudflare.com/durable-objects/platform/limits/
- iOS Safari WebSocket background disconnection (known issue): https://github.com/socketio/socket.io/issues/2924
- Screen Wake Lock API, iOS 16.4+ support: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- React stale closure / useEffect cleanup patterns: https://hookedonui.com/real%E2%80%91time-react-implementing-websockets-without-the-headaches/
- Touch target sizing for iPad (Apple HIG: 44pt minimum): https://developer.apple.com/help/app-store-connect/manage-app-accessibility/dark-interface-evaluation-criteria/
- PartyKit connection state 2KB limit: https://docs.partykit.io/reference/partysocket-api/
- Code review of existing source files: `src/client/use-deadsync.ts`, `src/server/deadsync-server.ts`, `src/shared/protocol.ts`

---
*Pitfalls research for: Glory (DeadSync) — real-time setlist sync for live musicians*
*Researched: 2026-02-24*
