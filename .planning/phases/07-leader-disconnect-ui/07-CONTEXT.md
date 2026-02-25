# Phase 7: Leader Disconnect UI - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the leader grace period to followers as a visible UI indicator. The `leaderDisconnected` export from `useDeadSync` already provides `{ graceSeconds }` — this phase wires it into a UI component. No sync layer changes, no new protocol messages.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
User gave full discretion on all implementation areas:

- **Indicator style** — Banner, toast, overlay, or inline badge; placement and prominence
- **Grace period visualization** — Whether to show countdown, progress bar, or static text
- **Transition states** — How the indicator behaves when leader reconnects vs. new leader promoted (animation, dismissal)
- **Tone and urgency** — How alarming or calm the indicator feels

**Guiding constraint:** This is a live stage context. Musicians are performing. The indicator should be noticeable enough that followers aren't confused, but not so alarming that it disrupts a set. Think informational, not emergency.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The hook already exports `leaderDisconnected` with `graceSeconds`, so this is a straightforward UI consumption task.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-leader-disconnect-ui*
*Context gathered: 2026-02-24*
