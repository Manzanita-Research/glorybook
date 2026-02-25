# Phase 4: Navigation and Leader Controls - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Leader song navigation (next/prev), setlist sidebar, leader identity display, and leadership transfer. The full sync loop exercised end-to-end — leader moves, followers see it. Follower-specific UX (GO LIVE, presence indicators) belongs in Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Navigation controls
- Fixed bottom bar with prev/next arrows and song name + position ("3 of 8") between them
- 48px tap targets to start — revisit sizing during UAT
- Prev button disabled (greyed out) on first song, next disabled on last — no wrapping
- Only the leader's next/prev changes the live song for all followers

### Setlist sidebar
- Toggle drawer, not always-visible — chord chart gets full width by default
- Hamburger icon in top-left opens the drawer (no swipe gesture)
- Live song highlighted with gold left accent bar + bold text — consistent with existing gold chord palette
- Tapping a song in the sidebar browses to it on your screen only — does NOT change the live song for others
- Leader uses next/prev in the bottom bar to advance the live song for everyone

### Leader indicator
- Persistent "LEADER" badge in the header bar — always visible, no ambiguity mid-show
- Leadership transfer via long-press on the LEADER badge — opens a menu of connected users
- Confirmation step required: "Transfer leadership to [name]?" with confirm/cancel

### Claude's Discretion
- Whether followers see "Led by [name]" or just their own "FOLLOWER" role — presence display is Phase 5 territory, so minimal here is fine
- Drawer animation style and overlay behavior
- Bottom bar visual treatment (background, border, shadow)
- Exact badge styling and positioning

</decisions>

<specifics>
## Specific Ideas

- Bottom bar should feel like a music player transport — familiar pattern for musicians
- Gold accent on live song in sidebar ties into the existing chord highlighting color system (gold chords, blue sections, purple notes)
- Long-press for transfer is a power-user gesture — keeps it hidden from accidental taps during a show

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-navigation-and-leader-controls*
*Context gathered: 2026-02-24*
