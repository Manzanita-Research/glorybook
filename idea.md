# Glory — Real-time setlist sync for live musicians

One person leads, everyone follows — but anyone can browse ahead and snap back to live with one tap.

## The idea

You're at a gig. The bandleader has a setlist loaded. Everyone in the band connects to the same session on their phone or tablet. When the leader advances to the next song, everyone sees the chord chart instantly. If you want to peek at what's coming up, you can browse independently — then hit "GO LIVE" to snap back, like catching up on a livestream.

## Architecture

PartyKit server as the sync layer. Each jam session is a PartyKit room (Durable Object). The server holds canonical state — who's connected, who's leading, what song index is "live" — and broadcasts changes.

**Leader/follower model.** Only the leader can advance the live song. Followers receive updates automatically if they're "live," or can detach to browse and snap back. Leadership is transferable.

### Message flow

```
Client → Server: join, set-song, browse, go-live, request-state, set-setlist, transfer-lead
Server → Client: state, song-changed, user-joined, user-left, user-updated, leader-changed, error
```

## Tech stack

- **PartyKit** — WebSocket server on Cloudflare Workers / Durable Objects
- **React** — UI
- **TypeScript** — everything is typed
- **Vite** — bundler (configured in partykit.json serve block)
- **Tailwind CSS** — styling
- **partysocket** — PartyKit's client WebSocket library
- **Bun** — package manager / runtime

## What's already built

- Full protocol definition with typed messages both directions (`src/shared/protocol.ts`)
- PartyKit server with all core features (`src/server/deadsync-server.ts`): join, song navigation, browse/go-live, setlist management, leader transfer, presence, state persistence, HTTP info endpoint
- React hook (`src/client/use-deadsync.ts`) with connection management and all actions
- Default setlist with 8 Grateful Dead songs and real chord charts (`src/shared/default-setlist.ts`)

## What needs to be built

### Immediate — wire up the UI
- Create Vite entry point (`index.html`, `src/main.tsx`, `src/App.tsx`)
- Build the join screen (enter name, choose leader/follower)
- Build the song viewer (markdown rendering with chord highlighting)
- Build leader controls (next/prev song)
- Build the "GO LIVE" snap-back banner for followers
- Build the setlist sidebar (browse songs, see who's live vs. browsing)
- Dark, stage-friendly theme (readable on iPad under stage lights)

### Soon — make it real
- QR code generation for venue sessions
- Songbook import (parse chord charts from various sources into Song format)
- Touch-friendly interactions for iPad
- Presence indicators (who's connected, who's on what song)

### Later — nice to have
- tldraw canvas for annotations (circle a section, draw on charts mid-jam)
- Setlist templates and community sharing
- Transpose button (shift all chords up/down)
- Auto-scroll during jams
- Audio cue integration (click track sync)
- Offline fallback (service worker cache of current setlist)
- PDF songbook import (parse Jerry Garcia Songbook → structured markdown)

## Design decisions (settled)

- **Markdown for charts, not PDF rendering.** More flexible, easier to annotate.
- **PartyKit over raw WebSocket / Socket.io.** Maps perfectly to the session-room model.
- **Local-first for gigs.** Bring a travel router, run on a Mac mini. Zero cloud dependency at showtime.
- **Not a SaaS.** Community-scale, open source, no pricing page. Software for a band, by a band.
- **Session codes use Dead song names** (e.g., `scarlet-042`, `ripple-817`).
- **Dark stage-friendly theme.** Gold for chords, blue for sections, purple for notes.

## Deployment

Two modes, same codebase:
- `npx partykit dev` — local, port 1999. For gigs on local WiFi.
- `npx partykit deploy` — Cloudflare edge. For remote rehearsals.

## Philosophy

This is community-scale technology. Not a SaaS. Not a startup. An open-source tool for a band to use at a gig. Local-first, offline-first. Instruments, not automations.
