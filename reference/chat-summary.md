# DeadSync — Chat Summary

**Original conversation:** [claude.ai/share/c50214f4-6c22-44ed-b3d7-f0e438ec532a](https://claude.ai/share/c50214f4-6c22-44ed-b3d7-f0e438ec532a)

**Date:** Feb 22, 2025

## The idea

Jem has a 400-page Grateful Dead songbook PDF on her iPad and wants to share charts with her band at live shows and jams. The pain: navigating a huge PDF is awful when you're on stage, and sending it to sit-ins is awkward. The fix: a shared session that syncs to everyone's phones and tablets in real-time over WebSocket.

> "It'd be so nice if we could share a session that syncs to all of our phones & tablets live"

## Key design decisions

### Leader/follower model ("Go Live")
Modeled after livestream scrub-back. One person (the leader) drives the session — when they advance to the next song, everyone who's "live" sees it instantly. Followers can browse independently (peek at the next song, review the last one) and snap back with a "GO LIVE" button.

### PartyKit for sync
> "I think PartyKit is a really good idea if it's still maintained, because one of the homies made it, and I just always believe in using the homies' technology."

PartyKit chosen because: made by a friend (Sunil/Cloudflare team), built on Durable Objects which map perfectly to session rooms, and it supports both cloud deployment and local dev.

### Local-first deployment
> "We could just bring our own router to venues."

Two deployment modes with the same codebase:
- **Cloud** (`npx partykit deploy`): for remote rehearsals, runs on Cloudflare edge
- **Local** (`npx partykit dev`): for gigs, runs on a Mac mini or laptop on local WiFi. Bring a $30 travel router, everyone connects to `192.168.x.x:1999`

### Markdown over PDF
> "We don't need to do PDFs; we should do markdown. That's so much more flexible for rendering."

Dead tabs are freely available online. Markdown is more flexible for rendering, annotation, and structured data. PDF parsing was discussed but deferred.

### Community-scale philosophy
> "This is for us; this isn't some big data thing. It was an example of using vibe coding to make technology for communities."

Not a SaaS. Not a startup. Open source tool for a band to use at a gig. Post-capitalist ethos — build to give away power.

## What was built

1. **Interactive JSX prototype** (deadsync.jsx) — a self-contained React artifact simulating the leader/follower UX with mock data. Created as a Claude artifact; not extractable from the share page but the UX patterns are captured in the real code.

2. **Full PartyKit project** — 7 files creating the real sync layer:
   - `protocol.ts` — shared message types (client→server and server→client)
   - `deadsync-server.ts` — PartyKit server with room/session logic, state persistence, HTTP endpoint for QR
   - `default-setlist.ts` — 8 Dead songs with real chord charts
   - `use-deadsync.ts` — React hook wrapping PartySocket
   - `partykit.json`, `package.json`, `tsconfig.json` — config

## What's NOT built yet

- No React UI wired to the real PartyKit hook (the prototype was standalone, not connected)
- No QR code generation
- No songbook import/parsing (PDF → markdown)
- No tldraw canvas integration
- No service worker / offline fallback

## Things tried that didn't work

- Jem shared the Jerry Garcia Songbook PDF for parsing, but the chat got "borked" during that step. Parsing was skipped in favor of focusing on the tech architecture.

## Artifacts in this directory

- `deadsync-README.md` — the README generated in the chat
- `deadsync.tar.gz` — tarball of the full project as generated
- `deadsync-extracted/` — the tarball contents unpacked
