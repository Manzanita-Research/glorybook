# Glory (DeadSync)

Real-time setlist sync for live musicians. A leader controls the "live" song, everyone else follows via WebSocket. Individuals can browse independently and snap back with "GO LIVE." Think livestream scrub-back, but for chord charts on stage.

## Architecture

The app uses a **PartyKit server** as the sync layer. Each jam session is a PartyKit room (Durable Object). The server holds canonical state — who's connected, who's leading, what song index is "live" — and broadcasts changes.

**Key pattern:** Leader/follower model. Only the leader can advance the live song. Followers receive updates automatically if they're "live," or can detach to browse and snap back. Leadership is transferable.

### Important files

- `src/shared/protocol.ts` — **the single source of truth** for all message types between server and client. Both directions are typed here. Change this first when modifying the protocol.
- `src/server/deadsync-server.ts` — PartyKit server. Handles join, set-song, browse, go-live, set-setlist, transfer-lead. Persists to PartyKit storage. Also exposes HTTP GET for session info (QR code target).
- `src/client/use-deadsync.ts` — React hook wrapping `PartySocket`. Manages connection lifecycle, handles all server message types, exposes clean actions (`setSong`, `browse`, `goLive`, `transferLead`).
- `src/shared/default-setlist.ts` — 8 Grateful Dead songs with real chord charts in markdown. Demo data.

### Message flow

```
Client → Server: join, set-song, browse, go-live, request-state, set-setlist, transfer-lead
Server → Client: state, song-changed, user-joined, user-left, user-updated, leader-changed, error
```

## Tech stack

- **PartyKit** — WebSocket server on Cloudflare Workers / Durable Objects
- **React** — UI (not yet built beyond the hook)
- **TypeScript** — everything is typed
- **Vite** — bundler (configured in partykit.json serve block)
- **partysocket** — PartyKit's client WebSocket library

## Deployment

Two modes, same codebase:
- `npx partykit dev` — local, port 1999. For gigs on local WiFi.
- `npx partykit deploy` — Cloudflare edge. For remote rehearsals.

## What's working

- Full protocol definition with typed messages both directions
- PartyKit server with all core features: join, song navigation, browse/go-live, setlist management, leader transfer, presence, state persistence, HTTP info endpoint
- React hook (`useDeadSync`) with connection management and all actions
- Default setlist with 8 Dead songs and real chord charts

## What's NOT working yet

- **No React UI** — the `useDeadSync` hook exists but there's no app shell, no components rendering the setlist, no "GO LIVE" button, no leader controls. An interactive prototype was built in the original chat as a standalone JSX artifact but it's not connected to the real sync layer.
- **No `public/index.html` or app entry point** — need to create the Vite entry point and React app
- **No QR code generation** for venue sessions
- **No songbook import** — parsing PDFs or other formats into the Song markdown format
- **No tldraw canvas** — discussed as a v1 feature for annotations
- **No offline fallback** — service worker for caching the current setlist

## Design decisions (settled)

- **Markdown for charts, not PDF rendering.** More flexible, easier to annotate, Dead tabs are freely available.
- **PartyKit over raw WebSocket / Socket.io.** "Use the homies' tools." Also maps perfectly to the session-room model.
- **Local-first for gigs.** Bring a travel router, run on a Mac mini. Zero cloud dependency at showtime.
- **Not a SaaS.** Community-scale, open source, no pricing page. Software for a band, by a band.
- **Session codes use Dead song names** (e.g., `scarlet-042`, `ripple-817`).

## Next steps

The obvious next move is building the React UI that connects to `useDeadSync`. The earlier prototype had: dark stage-friendly theme, leader/follower role selection, song navigation with next/prev, the "GO LIVE" snap-back banner, chord highlighting (gold for chords, blue for sections, purple for notes). That UX needs to be rebuilt as a proper React app wired to the real hook.
