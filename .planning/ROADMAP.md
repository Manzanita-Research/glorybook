# Roadmap: Glory

## Overview

The sync layer was one-shotted and has known bugs — stale closures, storage limits, missing hibernation, and a leader promotion problem that could blow up a gig. Fix those first, in isolation. Then build the React UI from the bottom up: entry point and context, chord rendering, navigation with the full sync loop, follower UX with GO LIVE snap-back, and finally session entry polish. Six phases, each delivering something you can hold in your hand and test before moving on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Sync Layer Hardening** - Fix the existing server and hook bugs before building UI on top of them (completed 2026-02-24)
- [x] **Phase 2: App Shell** - Entry point, context architecture, join screen, and iOS reliability (completed 2026-02-24)
- [x] **Phase 3: Song Rendering** - Chord chart display with gold/blue/purple highlighting (completed 2026-02-25)
- [x] **Phase 4: Navigation and Leader Controls** - Full sync loop exercised end-to-end (completed 2026-02-25)
- [x] **Phase 5: Follower UX** - GO LIVE snap-back, presence indicators, and connection status (completed 2026-02-25)
- [ ] **Phase 6: Session Entry and Polish** - QR codes, Dead song session codes, iPad touch polish
- [ ] **Phase 7: Leader Disconnect UI** - Surface leader grace period to followers, close SYNC-02 gap

## Phase Details

### Phase 1: Sync Layer Hardening
**Goal**: The sync layer is reliable enough to trust on stage
**Depends on**: Nothing (first phase)
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. The `useDeadSync` hook responds correctly to `song-changed` messages received after initial mount — no stale-closure silent failures
  2. A 20-song setlist with full chord charts can be persisted and retrieved from Cloudflare storage without hitting limits
  3. Presence state (who is connected, who is leader) survives a Durable Object hibernation wake-up
  4. The server waits a grace period before promoting a new leader when the current leader disconnects
  5. The client reconnects and re-joins the session automatically after a WiFi drop without user intervention
**Plans**: 4 plans (4/4 complete)
- [x] 01-01-PLAN.md -- Protocol redesign (types, messages, session code utility)
- [x] 01-02-PLAN.md -- Server hardening (hibernation, sharded storage, leader grace period)
- [x] 01-03-PLAN.md -- Hook rewrite (stale closure fix, reconnect re-join, Wake Lock)
- [x] 01-04-PLAN.md -- Tests (Vitest setup, server tests, hook tests)

### Phase 2: App Shell
**Goal**: A loadable app with working session entry that can connect to the sync layer
**Depends on**: Phase 1
**Requirements**: SHELL-01, SHELL-02, SHELL-03, JOIN-01, JOIN-02, JOIN-03
**Success Criteria** (what must be TRUE):
  1. Navigating to the app URL loads a dark-themed React app with no console errors
  2. A user can enter their name, choose leader or follower, type a session code, and join a session
  3. After joining, the app shows a connected state (not a loading spinner or error)
  4. Keeping the iPad screen on with the app open does not drop the WebSocket connection
  5. All interactive elements are reachable with a finger tap — no tiny touch targets
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Vite entry point, React 19 + Tailwind v4 setup, PartyKit serve config
- [x] 02-02-PLAN.md — Join screen, session screen, theme toggle, iPad touch targets

### Phase 3: Song Rendering
**Goal**: The current song's chord chart is on screen and readable under stage lights
**Depends on**: Phase 2
**Requirements**: SONG-01, SONG-02, SONG-03, SONG-04, SONG-05
**Success Criteria** (what must be TRUE):
  1. A chord chart renders on screen with bracket chords (`[G]`, `[Am]`, `[C/G]`) colored gold
  2. Section headers (e.g., `## Verse`, `## Chorus`) appear in blue
  3. Annotation lines (e.g., `> note`) appear in purple
  4. The song title and key are visible in a persistent header above the chart
  5. A long chart scrolls independently within the viewer without the header scrolling away
  6. Chart text is at minimum 20px, monospaced, readable at arm's length on an iPad
**Plans**: 2 plans
Plans:
- [ ] 03-01-PLAN.md — Chord tokenizer (TDD): pure function for line classification and chord/lyric segment extraction
- [ ] 03-02-PLAN.md — Rendering components + integration: ChordLine, BoxGridLine, SongHeader, ChordChart, wire into SessionScreen

### Phase 4: Navigation and Leader Controls
**Goal**: The leader can move through the setlist and followers see the change instantly
**Depends on**: Phase 3
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LIST-01, LIST-02, LIST-03
**Success Criteria** (what must be TRUE):
  1. The leader taps next and every connected follower's screen changes to the new song within a second
  2. The leader taps previous and the same sync happens
  3. The leader's role is clearly marked on their screen so there is no ambiguity mid-show
  4. The full setlist is visible in a sidebar with the current live song highlighted
  5. Tapping a song in the sidebar navigates to it (browsing, not changing the live song for others)
  6. The leader can transfer leadership to another connected user
**Plans**: 2 plans
Plans:
- [ ] 04-01-PLAN.md — Navigation bar (prev/next transport) and LEADER badge
- [ ] 04-02-PLAN.md — Setlist drawer sidebar and leadership transfer menu

### Phase 5: Follower UX
**Goal**: Followers can browse independently and snap back to the live song with one tap
**Depends on**: Phase 4
**Requirements**: FOLL-01, FOLL-02, FOLL-03, FOLL-04, PRES-01, PRES-02
**Success Criteria** (what must be TRUE):
  1. A follower who has not browsed away sees the new song automatically when the leader advances
  2. A follower can tap a different song in the sidebar without affecting anyone else's view
  3. When a follower is browsing a different song, a prominent banner appears on their screen
  4. Tapping the banner snaps the follower back to the leader's current song
  5. Every connected musician can see who else is in the session
  6. The sidebar or presence bar shows who is on the live song vs. browsing elsewhere
**Plans**: 3 plans
Plans:
- [x] 05-01-PLAN.md — GO LIVE banner, browse-away border, pulse effects, slide-left animation
- [x] 05-02-PLAN.md — Presence indicators in setlist drawer
- [ ] 05-03-PLAN.md — Gap closure: fix leader missing from presence list, verify presence dots

### Phase 6: Session Entry and Polish
**Goal**: The app is ready for a first gig — QR join works, session codes are on-brand, iPad use is smooth
**Depends on**: Phase 5
**Requirements**: JOIN-04, SESS-01, SESS-02
**Success Criteria** (what must be TRUE):
  1. The leader's screen shows a QR code that another musician can scan to join the session
  2. Session codes are generated from Dead song names (e.g., `scarlet-042`, `ripple-817`)
  3. Scanning the QR code on an iPhone or iPad Safari opens the app and joins the correct session
**Plans**: TBD

### Phase 7: Leader Disconnect UI
**Goal**: Followers see a visible indicator when the leader disconnects, showing the grace period before leader promotion
**Depends on**: Phase 5
**Requirements**: SYNC-02
**Gap Closure:** Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. When the leader disconnects, followers see a visible "Leader reconnecting..." indicator within 1 second
  2. The indicator disappears when the leader reconnects or a new leader is promoted
  3. The `leaderDisconnected` export from `useDeadSync` is consumed by a UI component (no orphaned exports)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Sync Layer Hardening | 4/4 | Complete | 2026-02-24 |
| 2. App Shell | 2/2 | Complete | 2026-02-24 |
| 3. Song Rendering | 2/2 | Complete    | 2026-02-25 |
| 4. Navigation and Leader Controls | 2/2 | Complete | 2026-02-25 |
| 5. Follower UX | 2/2 | Complete    | 2026-02-25 |
| 6. Session Entry and Polish | 0/TBD | Not started | - |
| 7. Leader Disconnect UI | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-24*
