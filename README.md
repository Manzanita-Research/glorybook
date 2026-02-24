# Glory

Real-time setlist sync for live musicians. One person leads, everyone follows — but anyone can browse ahead and snap back to live with one tap.

Built with [PartyKit](https://partykit.io) for WebSocket sync, React for the UI.

## What it does

You're at a gig. The bandleader has a setlist loaded. Everyone in the band connects to the same session on their phone or tablet. When the leader advances to the next song, everyone sees the chord chart instantly. If you want to peek at what's coming up, you can browse independently — then hit "GO LIVE" to snap back, like catching up on a livestream.

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

## Running it

```bash
# Install dependencies
bun install

# Local dev (gig mode — runs on your machine)
bun run dev
# → Server at http://localhost:1999

# Deploy to PartyKit cloud (remote rehearsals)
bun run deploy
```

For gigs: bring a travel router, run the server on a Mac mini or laptop, everyone connects to the local IP. No cloud dependency.

## Project structure

```
glory/
├── src/
│   ├── server/
│   │   └── deadsync-server.ts    # PartyKit server (the brain)
│   ├── client/
│   │   └── use-deadsync.ts       # React hook for sync
│   └── shared/
│       ├── protocol.ts           # Message types & shared contract
│       └── default-setlist.ts    # Demo setlist (Dead classics)
├── partykit.json                 # PartyKit config
├── tsconfig.json
└── package.json
```

## Current status

**Working:** The sync layer is built — PartyKit server with room management, leader/follower state, presence tracking, and a React hook that wraps it all. The protocol is defined and typed end-to-end.

**Not yet wired:** There's no React UI connected to the hook yet. An interactive prototype was built during design but needs to be reimplemented as a proper app connected to the real sync layer.

## Philosophy

This is community-scale technology. Not a SaaS. Not a startup. An open-source tool for a band to use at a gig.

- **Local-first**: runs on hardware you own. No cloud required at showtime.
- **Open source**: fork it, change it, make it yours.
- **Simple**: a WebSocket, some markdown, and a "Go Live" button.

## License

MIT
