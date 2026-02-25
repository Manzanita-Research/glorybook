# Phase 5: Follower UX - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Followers can browse independently and snap back to the live song with one tap. Session presence shows who's connected and where they are. This phase covers FOLL-01 through FOLL-04 and PRES-01, PRES-02.

</domain>

<decisions>
## Implementation Decisions

### Go Live Banner
- Fixed bar at top of screen
- Text: just "GO LIVE" — no song name, no extra context
- Bold gold/amber accent color on the dark stage theme
- Appears instantly when follower browses away — no slide-in animation
- Tapping it snaps back to live song immediately

### Browse-Away Visual
- Gold/amber border around the entire screen when off-live
- Same color language as the Go Live banner — gold = "you've drifted"
- Setlist sidebar keeps the live song highlighted even when viewing a different song
- When the leader advances while you're browsing, the border/banner briefly pulses to signal movement

### Presence Display
- Names with tiny colored status dots in the setlist sidebar
- Minimal — this is a music stand on stage, not a social app or collaboration tool
- Just enough to know who's connected and if someone drifted
- No elaborate avatars, no activity feeds, no cursor tracking

### Transitions
- Auto-follow (leader advances, follower is on live): slide-left animation — old song slides out, new slides in from the right
- Go Live snap-back: instant — no animation, you need the chart NOW
- Scroll always resets to top on any song change
- If a follower browses to the song that happens to be the live song, auto-detect and put them back on live (border/banner disappear)

### Claude's Discretion
- Whether/how to mark the leader in the presence list (small icon, label, or nothing)
- Exact border width and pulse animation timing
- Slide-left animation duration and easing
- Dot colors for live vs. browsing status

</decisions>

<specifics>
## Specific Ideas

- "It can be SO minimal — remember this is for live performance and we're trying to make it as undistracting as possible"
- "This isn't some dumbass online game or figma clone, it's a tool"
- Presence should be debuggable (you can tell who's connected) but not a feature in itself

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-follower-ux*
*Context gathered: 2026-02-24*
