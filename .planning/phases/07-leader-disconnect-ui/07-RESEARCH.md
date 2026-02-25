# Phase 7: Leader Disconnect UI - Research

**Researched:** 2026-02-25
**Domain:** React UI component consuming existing hook state
**Confidence:** HIGH

## Summary

This phase is a straightforward UI wiring task. The `useDeadSync` hook already exposes `leaderDisconnected: { graceSeconds: number } | null`, populated when the server sends a `leader-disconnected` message (30-second grace period). The server broadcasts this message on leader disconnect, and the hook clears it on `leader-changed` or `state` messages. No protocol changes, no new server messages, no new hook logic needed.

The work is: (1) destructure `leaderDisconnected` in SessionScreen, (2) create a small indicator component, (3) render it conditionally, (4) test it. The GoLiveBanner component is a close analog for the pattern — a conditional banner rendered between the header and the chord chart area.

**Primary recommendation:** Build a `LeaderDisconnectBanner` component using the same pattern as `GoLiveBanner` — a non-interactive, calm-toned banner in the existing `status-warning` color (gold/amber), placed below the header. Use static text ("Leader reconnecting..."), not a countdown timer. Dismiss automatically when `leaderDisconnected` becomes null.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — user gave full discretion on all implementation areas.

### Claude's Discretion
- **Indicator style** — Banner, toast, overlay, or inline badge; placement and prominence
- **Grace period visualization** — Whether to show countdown, progress bar, or static text
- **Transition states** — How the indicator behaves when leader reconnects vs. new leader promoted (animation, dismissal)
- **Tone and urgency** — How alarming or calm the indicator feels

**Guiding constraint:** This is a live stage context. Musicians are performing. The indicator should be noticeable enough that followers aren't confused, but not so alarming that it disrupts a set. Think informational, not emergency.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-02 | React hook exposes connection state, current song, isLive status, and actions without stale closures | Hook already exposes `leaderDisconnected` — this phase wires it into a UI component to close the "no UI reads it" gap. The hook itself is complete; the requirement is partial only because the export is orphaned. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already in use |
| Tailwind CSS | 4.2.1 | Styling via utility classes | Already in use, theme tokens defined in app.css |
| Vitest | 3.2.4 | Unit/integration testing | Already in use |
| @testing-library/react | 16.3.2 | Component testing | Already in use |

### Supporting
No new libraries needed. This phase uses only what is already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static text banner | Countdown timer | Countdown adds complexity (setInterval, cleanup, sync with server grace period) for marginal UX value. Musicians don't need a precise countdown — they need to know the leader dropped. |
| Banner below header | Toast/notification | Toast requires a toast system that doesn't exist. Banner follows the established GoLiveBanner pattern. |
| Gold/amber color | Red/error color | Red implies emergency. Gold (status-warning) is already in the theme and feels informational, not alarming. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/client/components/
├── LeaderDisconnectBanner.tsx   # NEW — the indicator component
├── GoLiveBanner.tsx             # ANALOG — same conditional-banner pattern
└── SessionScreen.tsx            # MODIFIED — destructure leaderDisconnected, render banner

src/client/__tests__/
├── LeaderDisconnectBanner.test.tsx  # NEW — unit tests for the component
└── SessionScreen.test.tsx          # MODIFIED — integration tests for banner visibility
```

### Pattern 1: Conditional Banner (established pattern)
**What:** A component rendered conditionally based on hook state, placed between the header and the chord chart.
**When to use:** When a transient status needs to be visible without blocking interaction.
**Example (existing GoLiveBanner pattern):**
```typescript
// Source: src/client/components/SessionScreen.tsx lines 211-213
{isBrowsingAway && (
  <GoLiveBanner onGoLive={handleGoLive} pulse={pulse} />
)}
```

The leader disconnect banner follows the same shape:
```typescript
{leaderDisconnected && !isLeader && (
  <LeaderDisconnectBanner />
)}
```

Key details:
- Only show to followers (leader already knows they're connected — this is for other users)
- The `!isLeader` guard prevents showing the banner to the leader themselves if they're the one reconnecting (edge case: the hook wouldn't fire for the disconnected leader anyway, but defensive coding)
- Banner auto-disappears when `leaderDisconnected` becomes null (React conditional rendering handles this)

### Pattern 2: Non-interactive Status Banner
**What:** A `<div>` (not a `<button>`) since there's no user action to take. The GoLiveBanner is a button because it triggers goLive; this banner is purely informational.
**When to use:** Status information that requires no user interaction.
**Example:**
```typescript
export function LeaderDisconnectBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full py-2 bg-status-warning/20 text-status-warning
        text-center text-sm font-medium shrink-0"
    >
      Leader reconnecting...
    </div>
  );
}
```

Design decisions:
- `role="status"` + `aria-live="polite"` for screen reader announcement without interrupting
- `bg-status-warning/20` — subtle background tint using existing theme token, not a solid block of color
- `text-status-warning` — gold/amber text, warm, matches the stage-friendly palette
- `shrink-0` — doesn't collapse inside the flex column
- `py-2` (not py-3 like GoLiveBanner) — slightly less prominent since it's informational, not actionable
- No countdown — static text is calmer and avoids the complexity of timer synchronization
- Text "Leader reconnecting..." — present tense, hopeful, not alarming. Avoids "disconnected" (sounds broken) or "lost" (sounds permanent)

### Anti-Patterns to Avoid
- **Countdown timer synced to server grace period:** The `graceSeconds` value is a snapshot from when the server sent the message. A client-side countdown would drift from the actual server alarm. If you wanted a countdown, you'd need to track when the message arrived and compute remaining time — unnecessary complexity for this context.
- **Modal or overlay:** Blocks the chord chart. Musicians need to keep reading even if the leader drops.
- **Red/error styling:** This is a transient state that resolves itself (either leader reconnects or a new leader is promoted). Error styling implies something is broken.
- **Showing to the leader:** The leader who disconnected won't see it (they're offline). If they reconnect, the banner disappears before they could see it. Only followers need this indicator.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional rendering | State management for show/hide | React conditional `{x && <Component />}` | The hook already manages the state lifecycle — `leaderDisconnected` goes from null to object to null. No local state needed in the component. |
| Accessibility announcements | Custom screen reader logic | `role="status"` + `aria-live="polite"` | Built-in browser behavior, well-supported. |
| Timer/countdown | setInterval countdown | Static text | Countdown adds complexity (interval cleanup, time drift, edge cases when leader reconnects mid-countdown) for no real UX benefit in a live performance context. |

**Key insight:** The hard work (protocol message, hook state, server alarm, grace period, leader promotion) was all done in Phase 1. This phase is pure UI consumption — keep it as simple as the data contract allows.

## Common Pitfalls

### Pitfall 1: Forgetting to destructure leaderDisconnected in SessionScreen
**What goes wrong:** The hook exposes it but SessionScreen currently doesn't destructure it from the return value.
**Why it happens:** The existing destructuring on line 17-28 of SessionScreen.tsx omits `leaderDisconnected`.
**How to avoid:** Add `leaderDisconnected` to the destructuring and verify it's wired through.
**Warning signs:** Banner never appears even when `leader-disconnected` message is sent.

### Pitfall 2: Showing the banner to the leader
**What goes wrong:** The leader sees "Leader reconnecting..." which is confusing — they're the leader and they're connected.
**Why it happens:** `leaderDisconnected` is set for ALL clients, not just followers.
**How to avoid:** Guard with `!isLeader` in the conditional render.
**Warning signs:** Leader sees the banner when testing with two browser tabs.

### Pitfall 3: Banner and GoLiveBanner stacking awkwardly
**What goes wrong:** If a follower is browsing away AND the leader disconnects, both banners appear.
**Why it happens:** Both conditions can be true simultaneously.
**How to avoid:** This is actually fine — both states are meaningful. The GoLiveBanner is interactive (go back to live song), the disconnect banner is informational. Stack them naturally. The disconnect banner should go above the GoLiveBanner (closer to the header, since it's about connection status).
**Warning signs:** Visual review in dev — ensure they don't overlap or create too much visual noise.

### Pitfall 4: Not updating the mock in SessionScreen.test.tsx
**What goes wrong:** Tests break because the mock doesn't include `leaderDisconnected` in the right state.
**Why it happens:** The mock already includes `leaderDisconnected: null` (line 46), but new tests need to set it to `{ graceSeconds: 30 }`.
**How to avoid:** Follow the existing pattern — override `mockReturnValue` with the desired state before rendering.

## Code Examples

### LeaderDisconnectBanner Component
```typescript
// Recommended implementation
interface LeaderDisconnectBannerProps {
  // No props needed — purely informational
  // Could accept graceSeconds if countdown is desired later
}

export function LeaderDisconnectBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full py-2 bg-status-warning/20 text-status-warning
        text-center text-sm font-medium shrink-0"
    >
      Leader reconnecting...
    </div>
  );
}
```

### SessionScreen Integration
```typescript
// In SessionScreen destructuring (add leaderDisconnected):
const {
  connected,
  connectionId,
  sessionState,
  isLeader,
  isLive,
  liveIndex,
  localIndex,
  leaderDisconnected, // ADD THIS
  actions,
} = useDeadSync({ host: window.location.host, room: code });

// In JSX, between the header and GoLiveBanner:
{/* Leader disconnect indicator — followers only */}
{leaderDisconnected && !isLeader && (
  <LeaderDisconnectBanner />
)}

{/* GO LIVE banner — appears when follower browses away from live song */}
{isBrowsingAway && (
  <GoLiveBanner onGoLive={handleGoLive} pulse={pulse} />
)}
```

### Unit Test Pattern
```typescript
// LeaderDisconnectBanner.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderDisconnectBanner } from "../components/LeaderDisconnectBanner";

describe("LeaderDisconnectBanner", () => {
  it("renders reconnecting text", () => {
    render(<LeaderDisconnectBanner />);
    expect(screen.getByText("Leader reconnecting...")).toBeInTheDocument();
  });

  it("has status role for accessibility", () => {
    render(<LeaderDisconnectBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has polite aria-live for non-intrusive announcements", () => {
    render(<LeaderDisconnectBanner />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("aria-live", "polite");
  });
});
```

### Integration Test Pattern
```typescript
// In SessionScreen.test.tsx — add these tests
it("shows leader disconnect banner when leaderDisconnected is set and user is follower", () => {
  mockReturnValue = {
    ...defaultMockReturn,
    leaderDisconnected: { graceSeconds: 30 },
    isLeader: false,
    actions: mockActions,
  };
  render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
  expect(screen.getByText("Leader reconnecting...")).toBeInTheDocument();
});

it("does not show leader disconnect banner when user is leader", () => {
  mockReturnValue = {
    ...defaultMockReturn,
    leaderDisconnected: { graceSeconds: 30 },
    isLeader: true,
    actions: mockActions,
  };
  render(<SessionScreen name="Jerry" role="leader" code="scarlet-042" />);
  expect(screen.queryByText("Leader reconnecting...")).not.toBeInTheDocument();
});

it("does not show leader disconnect banner when leaderDisconnected is null", () => {
  mockReturnValue = {
    ...defaultMockReturn,
    leaderDisconnected: null,
    isLeader: false,
    actions: mockActions,
  };
  render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
  expect(screen.queryByText("Leader reconnecting...")).not.toBeInTheDocument();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No disconnect UI | Server broadcasts `leader-disconnected`, hook stores it | Phase 1 (2026-02-24) | Data path complete, UI path is this phase |

**Deprecated/outdated:**
- None — the existing hook API (`leaderDisconnected: { graceSeconds } | null`) is the current design and won't change.

## Open Questions

1. **Should the banner show during the GoLiveBanner simultaneously?**
   - What we know: Both conditions can be true at once (follower browsing away + leader disconnected).
   - What's unclear: Whether stacking two banners feels cluttered on a small screen.
   - Recommendation: Allow stacking. Both communicate different things. If it feels too busy in practice, the disconnect banner could be integrated into the GoLiveBanner text instead, but that's a polish concern beyond this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~3 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-02 (banner appears) | Followers see "Leader reconnecting..." within 1 second of leader disconnect | unit | `npx vitest run src/client/__tests__/LeaderDisconnectBanner.test.tsx -x` | No — Wave 0 gap |
| SYNC-02 (banner disappears) | Banner disappears when leader reconnects or new leader promoted | integration | `npx vitest run src/client/__tests__/SessionScreen.test.tsx -x` | Exists (needs new test cases) |
| SYNC-02 (no orphan) | `leaderDisconnected` is consumed by a UI component | integration | `npx vitest run src/client/__tests__/SessionScreen.test.tsx -x` | Exists (needs new test cases) |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run --reporter=verbose`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/client/__tests__/LeaderDisconnectBanner.test.tsx` — covers SYNC-02 (banner renders correctly)
- [ ] New test cases in `src/client/__tests__/SessionScreen.test.tsx` — covers SYNC-02 (banner visibility logic, leader guard, disappearance)

*(No framework install needed — Vitest and testing-library are already configured and working)*

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/client/use-deadsync.ts` — hook API, `leaderDisconnected` type and lifecycle
- Direct codebase inspection: `src/client/components/SessionScreen.tsx` — current component structure, GoLiveBanner pattern
- Direct codebase inspection: `src/client/components/GoLiveBanner.tsx` — established conditional banner pattern
- Direct codebase inspection: `src/client/app.css` — theme tokens (`status-warning`, `status-connected`, etc.)
- Direct codebase inspection: `src/shared/protocol.ts` — `leader-disconnected` server message type
- Direct codebase inspection: `src/server/deadsync-server.ts` — 30-second grace period, alarm mechanism
- Direct codebase inspection: `src/client/__tests__/SessionScreen.test.tsx` — mock pattern for `leaderDisconnected`
- Direct codebase inspection: `src/client/__tests__/use-deadsync.test.ts` — existing tests for hook state lifecycle

### Secondary (MEDIUM confidence)
- None needed — this is a codebase-internal task with no external dependencies.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, everything already installed and proven
- Architecture: HIGH — follows established GoLiveBanner conditional-banner pattern exactly
- Pitfalls: HIGH — all pitfalls identified from direct codebase inspection of existing patterns and test mocks

**Research date:** 2026-02-25
**Valid until:** Indefinite — this is internal codebase wiring with no external dependency drift risk
