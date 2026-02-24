# Glory

## What This Is

Real-time setlist sync for live musicians. A leader controls the "live" song, everyone else follows via WebSocket. Anyone can browse independently and snap back with one tap — like catching up on a livestream, but for chord charts on stage. Built with PartyKit for sync, React for UI.

## Core Value

When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.

## Requirements

### Validated

(None yet — existing sync layer code is unreviewed and untested. Treat as reference/starting point, not validated.)

**Existing code (unreviewed, may need rework):**
- Protocol definition (`src/shared/protocol.ts`)
- PartyKit server (`src/server/deadsync-server.ts`)
- React hook (`src/client/use-deadsync.ts`)
- Default setlist (`src/shared/default-setlist.ts`)

### Active

- [ ] Vite entry point and React app shell
- [ ] Join screen (enter name, choose leader/follower)
- [ ] Song viewer with markdown rendering and chord highlighting
- [ ] Leader controls (next/prev song)
- [ ] "GO LIVE" snap-back banner for followers
- [ ] Setlist sidebar (browse songs, see who's live vs. browsing)
- [ ] Dark, stage-friendly theme (readable on iPad under stage lights)
- [ ] QR code generation for venue sessions
- [ ] Touch-friendly interactions for iPad
- [ ] Presence indicators (who's connected, who's on what song)

### Out of Scope

- tldraw canvas for annotations — complexity, defer to later milestone
- Setlist templates and community sharing — not needed for first gig
- Transpose button — nice to have, not core
- Auto-scroll during jams — nice to have, not core
- Audio cue integration — different problem domain
- Offline fallback / service worker — adds complexity, local-first model covers gig use case
- PDF songbook import — markdown-first decision settled
- OAuth / user accounts — not a SaaS, no auth needed

## Context

The sync layer was one-shotted by Opus in a previous chat — PartyKit server, React hook, typed protocol, demo setlist. None of it has been reviewed or run yet. It's a starting point, not a foundation — feel free to rework or replace any of it. What's missing is the entire React UI that connects to `useDeadSync`. An interactive prototype was built during the original design chat with the right UX patterns (dark theme, chord highlighting with gold/blue/purple colors, leader/follower role selection, GO LIVE banner) but it was a standalone artifact, not wired to the real sync layer.

The app runs two ways: locally on a Mac mini with a travel router for gigs (zero cloud dependency), or deployed to Cloudflare edge via PartyKit for remote rehearsals. Session codes use Dead song names (e.g., `scarlet-042`, `ripple-817`).

Primary use: iPad on a music stand at gigs. Must be readable under stage lights.

## Constraints

- **Tech stack**: PartyKit, React, TypeScript, Vite, Tailwind CSS, Bun — settled
- **Platform**: Must work well on iPad Safari (primary gig device)
- **Theme**: Dark, stage-friendly — no bright whites, high contrast for dim lighting
- **Dependency**: Zero cloud dependency at showtime (local-first for gigs)
- **Philosophy**: Community-scale, open source, not a SaaS — no pricing, no user accounts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown for charts, not PDF | More flexible, easier to annotate, Dead tabs freely available | — Pending |
| PartyKit over raw WebSocket | Maps perfectly to session-room model, "use the homies' tools" | — Pending |
| Local-first for gigs | Zero cloud dependency at showtime, bring a travel router | — Pending |
| Session codes use Dead song names | Fun, memorable, on-brand (e.g., scarlet-042) | — Pending |
| Dark stage-friendly theme | Readable on iPad under stage lights, gold/blue/purple chord highlighting | — Pending |
| Tailwind CSS for styling | Org default, fast iteration | — Pending |

---
*Last updated: 2026-02-24 after initialization*
