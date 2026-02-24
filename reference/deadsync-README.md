# 🎸 DeadSync

**Real-time setlist sync for live musicians.**

DeadSync lets a band share chord charts and setlists in real-time during a live performance or jam session. One person leads, everyone else follows — but anyone can browse ahead and snap back to live with one tap.

Built with [PartyKit](https://partykit.io) for WebSocket sync, React for the UI.

## How it works

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Leader iPad │◄──────────────────►│                  │
│  (drives     │                    │  PartyKit Server  │
│   setlist)   │     WebSocket      │  (jam session     │
├─────────────┤◄──────────────────►│   room)           │
│  Follower 1  │                    │                  │
│  (guitarist) │     WebSocket      │  Holds:          │
├─────────────┤◄──────────────────►│  - live song idx  │
│  Follower 2  │                    │  - setlist        │
│  (bassist)   │     WebSocket      │  - user presence  │
├─────────────┤◄──────────────────►│                  │
│  Sit-in      │                    └──────────────────┘
│  (new friend)│
└─────────────┘
```

### The "Go Live" model

Think of it like a livestream scrub-back:

- The **leader** controls the "live" song — when they advance, everyone who's "live" sees the new chart instantly
- Any **follower** can browse the setlist independently (peek at the next song, review the last one)
- When browsing, you see a banner: *"You're browsing independently — Leader is on 'Scarlet Begonias'"*
- Hit **"GO LIVE"** to snap back to wherever the leader is right now

### Deployment modes

**Cloud (rehearsals, remote jams):**
```bash
npx partykit deploy
```
Runs on Cloudflare's edge network via PartyKit. Share a link, jam from anywhere.

**Local (gigs, venues):**
```bash
npx partykit dev
```
Runs on your Mac mini / laptop on the local network. Zero cloud dependency.
Bring a $30 travel router, plug it in, everyone connects to `192.168.x.x:1999`.

Scan a QR code at the venue → you're in the session.

## Quick start

```bash
# Clone and install
git clone https://github.com/your-org/deadsync.git
cd deadsync
npm install

# Run locally
npm run dev
# → Server at http://localhost:1999

# Deploy to PartyKit cloud
npm run deploy
```

## Project structure

```
deadsync/
├── src/
│   ├── server/
│   │   └── deadsync-server.ts    # PartyKit server (the brain)
│   ├── client/
│   │   └── use-deadsync.ts       # React hook for sync
│   └── shared/
│       ├── protocol.ts           # Message types & shared contract
│       └── default-setlist.ts    # Demo setlist (Dead classics)
├── partykit.json                 # PartyKit config
└── package.json
```

## Protocol

All communication is JSON over WebSocket.

### Client → Server

| Message | Who | What |
|---------|-----|------|
| `join` | Anyone | Join session with name + role |
| `set-song` | Leader | Change the live song |
| `browse` | Follower | View a different song independently |
| `go-live` | Follower | Snap back to leader's song |
| `set-setlist` | Leader | Load a new setlist |
| `transfer-lead` | Leader | Hand off leadership |

### Server → Client

| Message | What |
|---------|------|
| `state` | Full state sync (on connect, on setlist change) |
| `song-changed` | Leader advanced to a new song |
| `user-joined` / `user-left` / `user-updated` | Presence |
| `leader-changed` | Leadership transferred |

## Philosophy

This is **community-scale technology**. It's not a SaaS. It's not a startup. It's an open-source tool for a band to use at a gig.

- **Local-first**: Runs on hardware you own. No cloud required at showtime.
- **Open source**: Fork it, change it, make it yours.
- **Simple**: A WebSocket, some markdown, and a "Go Live" button.
- **Built with love**: Uses the homies' tools (PartyKit ❤️).

## Roadmap

- [ ] PDF songbook import (parse Jerry Garcia Songbook → structured markdown)
- [ ] tldraw canvas for annotations (circle a section, draw on charts mid-jam)
- [ ] QR code generation for venue sessions
- [ ] Setlist templates & community sharing
- [ ] Transpose button (shift all chords up/down)
- [ ] Auto-scroll during jams
- [ ] Audio cue integration (click track sync?)
- [ ] Offline fallback (service worker cache of current setlist)

## License

MIT — do whatever you want with it. Play some Dead. ✌️
