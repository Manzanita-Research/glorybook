# Architecture Research

**Domain:** Real-time collaborative song viewer / setlist sync app
**Researched:** 2026-02-24
**Confidence:** HIGH (existing code inspected directly; patterns verified against PartyKit docs and React architecture sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (iPad / Desktop)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  JoinScreen  │  │  SongViewer  │  │   SetlistSidebar    │   │
│  └──────────────┘  └──────┬───────┘  └──────────┬──────────┘   │
│                            │                      │              │
│         ┌──────────────────┴──────────────────────┘             │
│         │                                                        │
│  ┌──────┴──────────────────────────────────────────────────┐   │
│  │                    DeadSyncContext                        │   │
│  │  (session state, isLive, isLeader, currentSong, actions) │   │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │                   useDeadSync hook                         │  │
│  │       (WebSocket lifecycle, message dispatch, actions)     │  │
│  └──────────────────────────┬────────────────────────────────┘  │
├───────────────────────────── │ ────────────────────────────────  │
│                    PartySocket / WS transport                    │
├─────────────────────────────────────────────────────────────────┤
│                     PartyKit Server (Durable Object)             │
│    join | set-song | browse | go-live | set-setlist | transfer   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `App` | Route between JoinScreen and session view; owns host + room params | DeadSyncContext |
| `JoinScreen` | Name entry, role selection (leader/follower), session code entry | App (via callback or router) |
| `DeadSyncContext` | Single context wrapping `useDeadSync`; distributes state + actions to the tree | All session components |
| `SessionLayout` | Structural shell: sidebar + main content + overlays | SetlistSidebar, SongViewer, LeaderControls, GoLiveBanner |
| `SongViewer` | Renders the current song's markdown chart with chord/section highlighting | DeadSyncContext (reads `currentSong`) |
| `SetlistSidebar` | Browse songs, show presence dots per song slot | DeadSyncContext (reads `sessionState.users`, `liveIndex`, `localIndex`) |
| `LeaderControls` | Prev/Next buttons for advancing the live song; only renders when `isLeader` | DeadSyncContext (`setSong`, `liveIndex`) |
| `GoLiveBanner` | "GO LIVE" snap-back banner; only renders when `!isLive` and `!isLeader` | DeadSyncContext (`isLive`, `goLive`) |
| `PresenceBar` | Avatars/names of connected users with live/browsing status | DeadSyncContext (`sessionState.users`) |
| `ConnectionStatus` | Connected / reconnecting / offline indicator | DeadSyncContext (`connected`) |

## Recommended Project Structure

```
src/
├── shared/               # protocol, types, default data (already exists)
│   ├── protocol.ts       # source of truth for message types
│   └── default-setlist.ts
├── server/               # PartyKit server (already exists)
│   └── deadsync-server.ts
├── client/               # React app
│   ├── use-deadsync.ts   # WebSocket hook (already exists, may need fixes)
│   ├── context.tsx       # DeadSyncContext wrapping the hook
│   ├── App.tsx           # Top-level: join vs session routing
│   ├── main.tsx          # Vite entry point
│   └── components/
│       ├── JoinScreen.tsx
│       ├── SessionLayout.tsx
│       ├── SongViewer.tsx
│       ├── SetlistSidebar.tsx
│       ├── LeaderControls.tsx
│       ├── GoLiveBanner.tsx
│       ├── PresenceBar.tsx
│       └── ConnectionStatus.tsx
└── styles/
    └── globals.css       # Tailwind base + custom properties
```

### Structure Rationale

- **`shared/`:** Protocol and data types are imported by both server and client. Keep the boundary clean — no UI imports here.
- **`client/`:** All React code. The hook stays separate from the context so it could theoretically be used headlessly.
- **`context.tsx` as its own file:** Keeps the hook file focused on WebSocket mechanics. The context adds the React tree distribution layer on top.
- **`components/` flat (no subdirectories):** This is a small, focused app. Nested folders add overhead without benefit at this scale.

## Architectural Patterns

### Pattern 1: Single Context, State + Actions Together

**What:** One `DeadSyncContext` that exposes the full return value of `useDeadSync` — state, derived values, and actions.

**When to use:** This app has one sync boundary (the PartyKit room). A single context is the right call; split contexts are an optimization for when you have many components that read state but never trigger actions, causing re-render storms. For a setlist app with ~6 components, the overhead doesn't exist.

**Trade-offs:** All context consumers re-render on any state change. Acceptable here — the state object changes infrequently (song changes, presence joins/leaves), not on every frame.

**Example:**
```typescript
// context.tsx
import { createContext, useContext } from "react";
import { useDeadSync } from "./use-deadsync";
import type { UseDeadSyncReturn } from "./use-deadsync";

const DeadSyncContext = createContext<UseDeadSyncReturn | null>(null);

export function DeadSyncProvider({
  host,
  room,
  children,
}: {
  host: string;
  room: string;
  children: React.ReactNode;
}) {
  const sync = useDeadSync({ host, room });
  return (
    <DeadSyncContext.Provider value={sync}>
      {children}
    </DeadSyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(DeadSyncContext);
  if (!ctx) throw new Error("useSync must be used inside DeadSyncProvider");
  return ctx;
}
```

### Pattern 2: Dual State — `liveIndex` vs `localIndex`

**What:** The hook already tracks two song positions: `liveIndex` (the leader's current song, server-authoritative) and `localIndex` (what this device is actually showing). The `isLive` boolean bridges them.

**When to use:** Every component that renders song content should read `currentSong` (already the resolved display song from the hook). Components that show sync status (GoLiveBanner, SetlistSidebar highlight) need both indices.

**Trade-offs:** This duality is the core UX. Don't collapse it — it's what makes "GO LIVE" possible.

**Implementation — how components use it:**
```typescript
// SongViewer only needs the resolved song — no dual-index awareness needed
function SongViewer() {
  const { currentSong } = useSync();
  return <ChordChart song={currentSong} />;
}

// GoLiveBanner needs to know if user has detached from live
function GoLiveBanner() {
  const { isLive, isLeader, liveIndex, sessionState, actions } = useSync();
  if (isLive || isLeader) return null;

  const liveSong = sessionState?.setlist.songs[liveIndex];
  return (
    <div className="go-live-banner">
      <span>Band is on: {liveSong?.title}</span>
      <button onClick={actions.goLive}>GO LIVE</button>
    </div>
  );
}

// SetlistSidebar needs both to show highlights
function SetlistSidebar() {
  const { sessionState, liveIndex, localIndex, isLive, actions } = useSync();
  const songs = sessionState?.setlist.songs ?? [];
  return (
    <ul>
      {songs.map((song, i) => (
        <li
          key={song.id}
          data-live={i === liveIndex}
          data-viewing={i === localIndex}
          onClick={() => actions.browse(i)}
        >
          {song.title}
          <PresenceDots users={sessionState?.users} songIndex={i} />
        </li>
      ))}
    </ul>
  );
}
```

### Pattern 3: Conditional Rendering by Role

**What:** Leader controls and follower snap-back are separate UI elements, conditionally rendered based on `isLeader`. No branching logic inside components — just render or don't.

**When to use:** Any UI element that only makes sense for one role.

**Trade-offs:** Keeps components simple. The role check belongs at the render boundary, not buried in handlers.

**Example:**
```typescript
function SessionLayout() {
  const { isLeader, isLive } = useSync();
  return (
    <div className="session-layout">
      <SetlistSidebar />
      <main>
        {!isLive && !isLeader && <GoLiveBanner />}
        <SongViewer />
        {isLeader && <LeaderControls />}
      </main>
      <PresenceBar />
    </div>
  );
}
```

### Pattern 4: Markdown Rendering with Chord Highlighting

**What:** The song `chart` field is markdown. Render it with a library (react-markdown or similar), then apply syntax highlighting to chord notation via a custom `remarkPlugin` or post-processing with regex. Three semantic colors: gold for chord names, blue for section labels (Verse, Chorus), purple for annotations/notes.

**When to use:** This is the core content rendering. It runs once per song change, not on every keypress.

**Trade-offs:** A remark plugin that runs at parse time is cleaner than post-render DOM manipulation. Tailwind CSS prose classes can style the non-chord markdown structure; chord spans get custom classes.

**Example regex pattern for chord detection:**
```typescript
// Matches common chord notation: Am, G7, Cmaj7, D/F#, etc.
const CHORD_PATTERN = /\b([A-G][b#]?(?:maj|min|m|aug|dim|sus)?[0-9]?(?:\/[A-G][b#]?)?)\b/g;
```

## Data Flow

### Incoming (Server → UI)

```
PartyKit Server broadcasts message
    ↓
PartySocket fires "message" event
    ↓
useDeadSync.handleServerMessage() dispatches
    ↓
useState setters update sessionState, liveIndex, isLive, localIndex
    ↓
DeadSyncContext.Provider re-renders with new value
    ↓
Consuming components re-render (SongViewer, SetlistSidebar, GoLiveBanner, etc.)
```

### Outgoing (User Action → Server)

```
User taps Next, GO LIVE, song in sidebar
    ↓
Component calls action from useSync() (e.g., actions.setSong(i))
    ↓
useDeadSync sends ClientMessage over WebSocket
    ↓
Local state optimistically updated (localIndex, isLive)
    ↓
Server broadcasts state change to all connections
    ↓
All clients receive server message → state sync
```

### Join Flow

```
App renders JoinScreen (no session state)
    ↓
User enters name + picks role → submits
    ↓
App navigates to session view, renders DeadSyncProvider with host+room
    ↓
useDeadSync connects to PartyKit room
    ↓
On "open": calls actions.join(name, role)
    ↓
Server responds with "state" message
    ↓
SessionLayout renders with full sessionState
```

### Key State Transitions

| Trigger | `isLive` | `localIndex` | Note |
|---------|----------|--------------|------|
| Leader calls `setSong(i)` | → `true` | → `i` | Leader always stays live |
| Any `song-changed` received and `isLive === true` | stays `true` | → server `liveIndex` | Auto-follow |
| Any `song-changed` received and `isLive === false` | stays `false` | unchanged | Banner stays up |
| User taps song in sidebar | → `false` (if index ≠ liveIndex) | → tapped index | Detaches from live |
| User taps "GO LIVE" | → `true` | → `liveIndex` | Snaps back |

## Suggested Build Order

Dependencies flow bottom-up. Build the foundation before the surfaces that depend on it.

### Phase 1: Entry Point + Context Layer

Build first because everything else depends on it.

1. `src/client/main.tsx` — Vite entry, mounts `<App />`
2. `public/index.html` — Vite HTML shell
3. `src/client/context.tsx` — `DeadSyncProvider` and `useSync`
4. `src/client/App.tsx` — join state machine (no session → show JoinScreen; has session → show SessionLayout)

At this point: app loads, context exists, but nothing renders.

### Phase 2: Join Screen

5. `src/client/components/JoinScreen.tsx` — name input, role select, session code input, connect button

At this point: can join a session. Verify connection works. This is the first integration test point.

### Phase 3: Core Song Rendering

6. `src/client/components/SongViewer.tsx` — renders `currentSong.chart` as markdown with chord highlighting
7. `src/client/components/SessionLayout.tsx` — structural shell (sidebar placeholder, main area with SongViewer)

At this point: can see songs. Verify chord highlighting renders correctly.

### Phase 4: Navigation + Leader Controls

8. `src/client/components/LeaderControls.tsx` — prev/next buttons, song title/counter display
9. `src/client/components/SetlistSidebar.tsx` — song list, tap to browse, visual highlights for live vs viewing

At this point: leader can navigate. Followers see updates. Core sync loop is verifiable.

### Phase 5: Follower UX

10. `src/client/components/GoLiveBanner.tsx` — detached-from-live banner with GO LIVE button
11. `src/client/components/PresenceBar.tsx` — connected users with live/browsing status

At this point: full leader/follower flow works end-to-end.

### Phase 6: Polish

12. `src/client/components/ConnectionStatus.tsx` — reconnecting indicator
13. Theme refinement — dark stage-friendly palette, font sizing for iPad distance reading
14. Touch target sizing audit for iPad

## Component Boundaries

| Component | Reads from context | Writes to context | No context access |
|-----------|-------------------|-------------------|-------------------|
| `JoinScreen` | — | `actions.join` | name/role form state is local only |
| `SongViewer` | `currentSong` | — | pure display |
| `SetlistSidebar` | `sessionState.setlist`, `liveIndex`, `localIndex`, `sessionState.users` | `actions.browse` | — |
| `LeaderControls` | `liveIndex`, `sessionState.setlist.songs.length` | `actions.setSong` | only renders when `isLeader` |
| `GoLiveBanner` | `isLive`, `isLeader`, `liveIndex`, `sessionState` | `actions.goLive` | only renders when `!isLive && !isLeader` |
| `PresenceBar` | `sessionState.users`, `connectionId` | — | pure display |
| `ConnectionStatus` | `connected` | — | pure display |

## Anti-Patterns

### Anti-Pattern 1: Calling `useDeadSync` in Multiple Components

**What people do:** Import and call `useDeadSync` directly in each component that needs sync data.

**Why it's wrong:** Creates multiple WebSocket connections to the same room. One connection per browser tab, not per component. This causes duplicate messages, doubled bandwidth, and unpredictable state.

**Do this instead:** Call `useDeadSync` exactly once in `DeadSyncProvider`. All other components read from context via `useSync()`.

### Anti-Pattern 2: Deriving "Current Song" Outside the Hook

**What people do:** Components independently compute `sessionState.setlist.songs[someIndex]` to get the song.

**Why it's wrong:** The hook already resolves `currentSong` correctly using the `isLive`/`localIndex`/`liveIndex` logic. Bypassing this creates a divergence where components show different songs.

**Do this instead:** Read `currentSong` from the hook return value. Only read raw indices when you specifically need to show the contrast (sidebar, banner).

### Anti-Pattern 3: Putting Join State in the Sync Hook

**What people do:** Try to handle name/role form state inside `useDeadSync` or the context.

**Why it's wrong:** Join state is ephemeral local UI state (form inputs before submission). It doesn't belong in the sync layer. Mixing them makes the hook harder to initialize and test.

**Do this instead:** `JoinScreen` manages its own local state with `useState`. On submit, it calls `actions.join(name, role)` and notifies the parent (App) to switch views.

### Anti-Pattern 4: Markdown Parsing on Every Render

**What people do:** Pass `chart` to a markdown renderer inside the component body without memoization.

**Why it's wrong:** Markdown parsing is non-trivial CPU work. `currentSong` only changes when the leader advances — that's rare. Parsing on every render wastes cycles, especially on low-end mobile.

**Do this instead:** Memoize with `useMemo(() => parseChart(currentSong?.chart), [currentSong?.id])`. Keying on `id` is more stable than keying on `chart` content.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PartyKit (local) | `useDeadSync({ host: "localhost:1999", room })` | For gigs on local WiFi |
| PartyKit (Cloudflare edge) | `useDeadSync({ host: "glory.username.partykit.dev", room })` | For remote rehearsals |
| QR code generation | `qrcode.react` component on join screen | Encode the full session URL |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `App` ↔ `JoinScreen` | Callback `onJoin(host, room, name, role)` | App owns routing decision |
| `DeadSyncProvider` ↔ all session components | React context via `useSync()` | Single connection, one source of truth |
| `protocol.ts` ↔ server and client | TypeScript import (shared types) | Change protocol here first, then update both sides |
| `use-deadsync.ts` ↔ `context.tsx` | Hook called inside provider | Hook has no React tree dependencies — testable in isolation |

## Scaling Considerations

This is a gig tool. Scale targets are radically different from typical web apps.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 band (2-6 devices) | Current architecture is exactly right. No changes needed. |
| Multiple bands sharing a PartyKit deployment | Already handled — each session is its own room (Durable Object). No changes needed. |
| 100+ concurrent sessions | PartyKit's Cloudflare edge handles this transparently. No changes to client architecture. |

The bottleneck at this scale is not state management — it's network reliability at the venue. Local-first deployment model is the correct solution.

## Sources

- PartyKit docs — Context7 `/partykit/partykit` (HIGH confidence): WebSocket hook patterns, presence server patterns
- PartyKit docs — Context7 `/websites/partykit_io` (HIGH confidence): Room/connection state management
- [developerway.com — React state management 2025](https://www.developerway.com/posts/react-state-management-2025) (MEDIUM confidence): Context provider patterns, avoiding providers hell
- [developerway.com — Performant React with Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context) (MEDIUM confidence): State + API context split rationale
- [tkdodo.eu — WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query) (HIGH confidence): Separating connection state from data state, event-based patterns
- Direct code inspection: `src/shared/protocol.ts`, `src/client/use-deadsync.ts` (HIGH confidence): Existing hook return shape, message types
- [mikedidomizio/partykit-chat](https://github.com/mikedidomizio/partykit-chat) (MEDIUM confidence): SocketProvider → domain-specific providers hierarchy pattern

---
*Architecture research for: real-time setlist sync React UI (Glory / DeadSync)*
*Researched: 2026-02-24*
