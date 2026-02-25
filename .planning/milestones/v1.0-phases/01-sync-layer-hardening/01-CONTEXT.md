# Phase 1: Sync Layer Hardening - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix known bugs and validate the unreviewed sync layer so it's reliable enough to trust on stage. Covers: protocol redesign, server fixes, hook fixes, storage sharding, Wake Lock, reconnect, leader grace period. Does not include any UI components — those start in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Reconnect behavior
- Subtle indicator when connection drops — don't interrupt the chart the musician is reading (small dot or badge color change, not a banner or overlay)
- Never give up reconnecting — keep retrying with backoff forever. It's a gig, the WiFi will come back.
- On successful reconnect, snap to the current live song automatically (user probably missed a song change while disconnected)
- Request Wake Lock API on session join — iPads on music stands should never sleep. Always on, no user toggle.

### Leader grace period
- 30-second grace period before promoting a new leader when current leader disconnects
- If original leader reconnects (even after promotion), they automatically reclaim leadership
- Promotion goes to first follower who joined the session (predictable — co-bandleader is usually second in)
- No toast notification on leadership change — just update the role indicator silently

### Existing code approach
- Claude reviews the existing server, hook, and setlist code and decides what to keep vs rewrite
- Protocol (protocol.ts) should be rethought from scratch — design fresh message types based on what we now know from research
- Keep the default setlist with 8 Dead songs and real chord charts — good demo data for testing
- Phase is NOT done until `partykit dev` starts and two browser tabs can sync

### Testing strategy
- Both automated tests AND manual smoke testing
- Automated: unit tests for protocol logic, integration tests for server message handling
- Manual: start `partykit dev`, open two tabs, verify "leader advances, follower sees it" works
- Local only — no Cloudflare deploy testing in this phase
- Defer reconnect/Wake Lock verification to UI phase (needs real UI to meaningfully test)

### Claude's Discretion
- Which parts of existing server/hook code to keep vs rewrite (after reviewing)
- New protocol message type design (fresh rethink, not constrained by existing shapes)
- Exact reconnect backoff timing strategy
- Storage sharding approach for Cloudflare limits
- Hibernation implementation details
- Automated test framework choice

</decisions>

<specifics>
## Specific Ideas

- The core smoke test is "leader advances, follower sees it" — if that works in two browser tabs, the sync layer is solid
- The protocol rethink should account for everything learned in research: the browse/live dual state, leader grace periods, reconnect re-join
- Keep it simple — this is infrastructure for a band app, not a distributed systems PhD

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-sync-layer-hardening*
*Context gathered: 2026-02-24*
