# Glory

## What This Is

Real-time setlist sync for live musicians. A leader controls the "live" song, everyone else follows via WebSocket. Anyone can browse independently and snap back with one tap. Built with PartyKit for sync, React 19 for UI, Tailwind v4 for styling. Dark, stage-friendly theme with gold/blue/purple chord highlighting readable under stage lights.

## Core Value

When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.

## Requirements

### Validated

- ✓ Sync layer reliable on stage (hibernation, sharded storage, grace period, reconnect) — v1.0
- ✓ React app shell with dark theme and iPad touch targets — v1.0
- ✓ Chord chart rendering with gold/blue/purple highlighting — v1.0
- ✓ Leader controls (next/prev, leadership transfer) — v1.0
- ✓ Follower UX with GO LIVE snap-back and presence indicators — v1.0
- ✓ QR code session sharing with Dead song name codes — v1.0
- ✓ Leader disconnect banner for followers — v1.0
- ✓ Zero TypeScript errors, clean imports, consistent docs — v1.0

### Active

- [ ] Adjustable font size for different reading distances
- [ ] Graceful "lost connection" state with auto-recovery UI
- [ ] In-app setlist editing

### Out of Scope

- tldraw canvas for annotations — complexity, defer to later milestone
- Setlist templates and community sharing — not needed for first gig
- Transpose button — Dead fans rarely transpose
- Auto-scroll during jams — incompatible with improvisational music, variable tempos
- Audio cue integration — different problem domain
- Offline fallback / service worker — adds complexity, local-first model covers gig use case
- PDF songbook import — markdown-first decision settled
- OAuth / user accounts — not a SaaS, session codes are the identity primitive
- Foot pedal / MIDI control — hardware dependency, out of scope for iPad-on-a-stand
- Real-time scroll sync — unnecessary WebSocket noise, sync only the live song index

## Context

Shipped v1.0 with 6,192 LOC TypeScript across 122 files. 208 tests passing.
Tech stack: PartyKit, React 19, Tailwind v4, Vite 6, Bun, TypeScript.

The app runs two ways: locally on a Mac mini with a travel router for gigs (zero cloud dependency), or deployed to Cloudflare edge via PartyKit for remote rehearsals. Session codes use Dead song names (e.g., `scarlet-042`, `ripple-817`).

Primary use: iPad on a music stand at gigs. Must be readable under stage lights.

Known tech debt (4 items):
- Hibernation + storage sharding not tested against actual Cloudflare deploy
- 4 human verification items pending (slide animation, pulse effect, snap-back, PartyKit presence)
- SUMMARY frontmatter inconsistency across phases
- 3 unused hook exports (benign, available for future use)

## Constraints

- **Tech stack**: PartyKit, React 19, TypeScript, Vite 6, Tailwind v4, Bun — settled
- **Platform**: Must work well on iPad Safari (primary gig device)
- **Theme**: Dark, stage-friendly — no bright whites, high contrast for dim lighting
- **Dependency**: Zero cloud dependency at showtime (local-first for gigs)
- **Philosophy**: Community-scale, open source, not a SaaS — no pricing, no user accounts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown for charts, not PDF | More flexible, easier to annotate, Dead tabs freely available | ✓ Good — clean tokenizer, structured data |
| PartyKit over raw WebSocket | Maps perfectly to session-room model, "use the homies' tools" | ✓ Good — hibernation, alarms, sharded storage |
| Local-first for gigs | Zero cloud dependency at showtime, bring a travel router | ✓ Good — `partykit dev` works offline |
| Session codes use Dead song names | Fun, memorable, on-brand (e.g., scarlet-042) | ✓ Good |
| Dark stage-friendly theme | Readable on iPad under stage lights, gold/blue/purple highlighting | ✓ Good — 3 distinct colors for chords/sections/notes |
| Tailwind v4 for styling | Org default, CSS-first config, fast iteration | ✓ Good |
| Custom chord tokenizer (not ChordSheetJS) | Parses `[G]` bracket notation into typed tokens, TDD | ✓ Good — pure function, fully tested |
| useRef for stale closure fix | React hook message handler reads from refs, not closures | ✓ Good — eliminated silent sync failures |
| Sharded storage (meta + setlist-info + song:N) | No single value exceeds 128 KiB Cloudflare limit | ✓ Good |
| Leader grace period via PartyKit alarm | 30-second window for reconnect before promoting new leader | ✓ Good |
| handleJoin as sole initial state source | Eliminated race condition from onConnect state message | ✓ Good |

---
*Last updated: 2026-02-25 after v1.0 milestone*
