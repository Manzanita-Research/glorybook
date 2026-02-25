# Phase 5: Follower UX - Research

**Researched:** 2026-02-24
**Domain:** React UI state management, CSS animations, presence display
**Confidence:** HIGH

## Summary

Phase 5 builds three things on top of the existing sync infrastructure: (1) a Go Live banner that appears when a follower browses away from the leader's current song, (2) a gold border + pulse effect to reinforce the "you've drifted" state, and (3) presence indicators in the setlist sidebar showing who's connected and whether they're live or browsing.

The sync layer already handles all the hard work. The `useDeadSync` hook exposes `isLive`, `liveIndex`, `localIndex`, and `sessionState.users` with each user's `isLive` and `currentIndex` fields. The server already processes `browse`, `go-live`, and `song-changed` messages and broadcasts `user-updated` events. This phase is purely UI — no protocol changes, no server changes.

**Primary recommendation:** Build three components (GoLiveBanner, BrowseAwayBorder, PresenceList) and integrate them into SessionScreen. Use Tailwind CSS animations for the pulse effect and slide-left transition. No new dependencies needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Go Live Banner: Fixed bar at top of screen. Text: just "GO LIVE" — no song name, no extra context. Bold gold/amber accent color on the dark stage theme. Appears instantly when follower browses away — no slide-in animation. Tapping it snaps back to live song immediately.
- Browse-Away Visual: Gold/amber border around the entire screen when off-live. Same color language as the Go Live banner — gold = "you've drifted." Setlist sidebar keeps the live song highlighted even when viewing a different song. When the leader advances while you're browsing, the border/banner briefly pulses to signal movement.
- Presence Display: Names with tiny colored status dots in the setlist sidebar. Minimal — this is a music stand on stage, not a social app or collaboration tool. Just enough to know who's connected and if someone drifted. No elaborate avatars, no activity feeds, no cursor tracking.
- Transitions: Auto-follow (leader advances, follower is on live): slide-left animation — old song slides out, new slides in from the right. Go Live snap-back: instant — no animation, you need the chart NOW. Scroll always resets to top on any song change. If a follower browses to the song that happens to be the live song, auto-detect and put them back on live (border/banner disappear).

### Claude's Discretion
- Whether/how to mark the leader in the presence list (small icon, label, or nothing)
- Exact border width and pulse animation timing
- Slide-left animation duration and easing
- Dot colors for live vs. browsing status

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOLL-01 | Follower automatically sees the song the leader navigates to | `useDeadSync` already auto-follows when `isLive` is true via `song-changed` handler. Add slide-left transition animation. |
| FOLL-02 | Follower can browse to a different song independently | Already works via `actions.browse()` in SetlistDrawer and NavigationBar. No changes needed to browse logic. |
| FOLL-03 | Follower sees a prominent "GO LIVE" banner when browsing away | New GoLiveBanner component, rendered when `!isLive && !isLeader`. |
| FOLL-04 | Follower can tap "GO LIVE" to snap back to the leader's current song | GoLiveBanner calls `actions.goLive()` on tap. Already implemented in hook. |
| PRES-01 | User can see who is connected to the session | PresenceList component reading `sessionState.users`. Display in SetlistDrawer. |
| PRES-02 | User can see who is live vs. browsing a different song | Each `SessionUser` has `isLive` field. Color-coded dots: green = live, amber = browsing. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already in project |
| Tailwind CSS | 4.2.1 | Styling + animations | Already in project, includes `@keyframes` support |

### Supporting
No new libraries needed. All features achievable with existing stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS animations | framer-motion | Overkill for a border pulse and slide transition. Adds 30KB+ for two effects. |
| Tailwind keyframes | react-spring | Same — unnecessary dependency for simple effects |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Component Structure
```
src/client/
├── components/
│   ├── GoLiveBanner.tsx       # NEW — fixed banner at top when browsing away
│   ├── BrowseAwayBorder.tsx   # NEW — gold border wrapper when off-live
│   ├── PresenceList.tsx       # NEW — user list with status dots
│   ├── SessionScreen.tsx      # MODIFIED — integrate new components
│   ├── SetlistDrawer.tsx      # MODIFIED — add PresenceList section
│   └── ChordChart.tsx         # MODIFIED — slide-left animation on song change
```

### Pattern 1: Conditional Rendering Based on isLive State
**What:** The `useDeadSync` hook already exposes `isLive` (boolean). Components conditionally render based on this flag.
**When to use:** GoLiveBanner and BrowseAwayBorder visibility.
**Example:**
```typescript
// In SessionScreen
{!isLive && !isLeader && <GoLiveBanner onGoLive={actions.goLive} />}
```

### Pattern 2: CSS-Only Slide-Left Animation
**What:** Tailwind `@keyframes` + a key-based remount to trigger CSS animation on song change.
**When to use:** Auto-follow song transitions (leader advances while follower is live).
**Example:**
```typescript
// Use song id or index as key to trigger animation on change
<div key={`song-${currentSong?.id}`} className="animate-slide-in-left">
  <ChordChart ... />
</div>
```

```css
/* In app.css */
@keyframes slide-in-left {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### Pattern 3: Pulse Animation for Leader-Advanced-While-Browsing
**What:** When `song-changed` fires and follower is NOT live, the border/banner briefly pulse.
**When to use:** Signal to browsing follower that the leader moved.
**Example:**
```typescript
// Track liveIndex changes to trigger pulse
const [pulse, setPulse] = useState(false);
const prevLiveIndex = useRef(liveIndex);

useEffect(() => {
  if (liveIndex !== prevLiveIndex.current && !isLive) {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 600);
    prevLiveIndex.current = liveIndex;
    return () => clearTimeout(timer);
  }
  prevLiveIndex.current = liveIndex;
}, [liveIndex, isLive]);
```

### Pattern 4: Auto-Detect Return to Live Song
**What:** When a follower browses and lands on the song that happens to be the live song, auto-detect and clear browse state.
**When to use:** The `actions.browse()` function already handles this — it checks `index === liveIdx` and sets `isLive = true`. No additional code needed in the UI layer.

### Anti-Patterns to Avoid
- **Heavy animation libraries for simple effects:** framer-motion, react-spring — not needed for a border pulse and slide transition.
- **Inline transition styles with JavaScript timers:** Use CSS animations triggered by class names or key changes, not JS-driven `requestAnimationFrame` loops.
- **Polling for presence state:** The server already pushes `user-updated` events. No need to poll or request presence separately.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide animation | JS-driven animation loop | CSS `@keyframes` with React key remount | Simpler, GPU-accelerated, no JS overhead |
| Presence polling | Timer-based state requests | Server-pushed `user-updated` events | Already built into sync protocol |
| Browse state tracking | Separate browse state machine | `useDeadSync.isLive` + `localIndex` | Already tracks this — hook returns both values |
| Auto-follow detection | Manual song-changed comparison | `isLive` flag in hook | Hook already handles follow/browse logic in `song-changed` handler |

**Key insight:** The sync layer (Phase 1) and hook (Phase 1) already handle ALL the state logic for browse/live/follow. Phase 5 is purely presentation — reading state that already exists and rendering it visually.

## Common Pitfalls

### Pitfall 1: Breaking Flex Layout with Border Wrapper
**What goes wrong:** Adding a border wrapper around the entire SessionScreen can break the `h-dvh` flex layout, causing scroll issues.
**Why it happens:** An extra wrapping div may not inherit the full viewport height correctly.
**How to avoid:** Use `ring` or `outline` utilities instead of `border` — these don't affect layout flow. Alternative: apply border styling directly to the existing root div with conditional classes.
**Warning signs:** ChordChart scroll stops working, NavigationBar disappears below fold.

### Pitfall 2: Slide Animation Firing on Every Render
**What goes wrong:** The slide-in animation plays on mount, not just on song changes.
**Why it happens:** CSS animations trigger on element mount. If the key doesn't change properly, or the component re-renders for other reasons, the animation replays.
**How to avoid:** Use `currentSong.id` (not index) as the key. Only wrap the chart content in the animated div, not the entire component tree.
**Warning signs:** Chart flickers/slides on unrelated state changes.

### Pitfall 3: GoLive Banner Covering Content
**What goes wrong:** A fixed-position banner at top covers the session header or first line of the chord chart.
**Why it happens:** Fixed positioning removes the element from document flow.
**How to avoid:** Use a static/relative banner that pushes content down, OR add top padding to the content area when banner is visible.
**Warning signs:** Session code or first chord line hidden behind banner.

### Pitfall 4: Presence List Stale After Reconnect
**What goes wrong:** Users list shows old connections after someone reconnects.
**Why it happens:** The server sends `user-left` + `user-joined` on reconnect, but if the `state` sync message arrives first, it may reset with stale data.
**How to avoid:** The hook's `state` handler replaces the entire user list. Individual `user-joined`/`user-left` messages update incrementally. This should work correctly already — just verify in tests.
**Warning signs:** Duplicate user entries or ghost users who disconnected.

### Pitfall 5: Leader Seeing Browse-Away UI
**What goes wrong:** The leader sees the Go Live banner or browse border when they use the setlist drawer.
**Why it happens:** Leader uses `setSong` (which changes the live index), not `browse`. But if navigation logic routes leader through `browse` accidentally, `isLive` goes false.
**How to avoid:** GoLiveBanner and BrowseAwayBorder should check `!isLeader` in addition to `!isLive`. The leader's `setSong` action always sets `isLive = true`.
**Warning signs:** Leader sees gold border after using prev/next.

## Code Examples

### GoLiveBanner Component
```typescript
interface GoLiveBannerProps {
  onGoLive: () => void;
  pulse?: boolean;
}

export function GoLiveBanner({ onGoLive, pulse }: GoLiveBannerProps) {
  return (
    <button
      onClick={onGoLive}
      className={`w-full py-3 bg-accent-gold text-surface font-bold text-center
        uppercase tracking-wider text-sm shrink-0
        ${pulse ? 'animate-pulse-once' : ''}`}
      aria-label="Go live — return to current song"
    >
      GO LIVE
    </button>
  );
}
```

### BrowseAwayBorder (using ring utility)
```typescript
// Applied as conditional class on SessionScreen root div
<div className={`h-dvh bg-surface text-text-primary safe-area-padding flex flex-col
  ${!isLive && !isLeader ? 'ring-4 ring-accent-gold ring-inset' : ''}
  ${pulse ? 'animate-ring-pulse' : ''}`}>
```

### PresenceList in SetlistDrawer
```typescript
interface PresenceListProps {
  users: SessionUser[];
  leaderId: string | null;
}

export function PresenceList({ users, leaderId }: PresenceListProps) {
  return (
    <div className="px-4 py-3 border-t border-border">
      <h4 className="text-text-muted text-xs uppercase tracking-wider mb-2">Connected</h4>
      <ul className="space-y-1">
        {users.map(user => (
          <li key={user.id} className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              user.isLive ? 'bg-status-connected' : 'bg-accent-gold'
            }`} />
            <span className="text-text-secondary truncate">
              {user.name}
              {user.id === leaderId && (
                <span className="text-text-muted text-xs ml-1">(lead)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Slide-Left Keyframes (app.css)
```css
@keyframes slide-in-left {
  from {
    transform: translateX(40%);
    opacity: 0.3;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes ring-pulse {
  0%, 100% { box-shadow: inset 0 0 0 4px var(--color-accent-gold); }
  50% { box-shadow: inset 0 0 0 6px var(--color-accent-gold); }
}

@keyframes pulse-once {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS animation libs | CSS animations + Tailwind | Tailwind v4 (2025) | Native `@keyframes` in `@theme` block, no extra deps |
| `outline` for focus rings | `ring` utility in Tailwind | Tailwind v3+ | `ring-inset` provides layout-safe border effect |

**Deprecated/outdated:**
- None relevant — all patterns use current Tailwind v4 and React 19 APIs.

## Open Questions

1. **Slide animation on Go Live snap-back?**
   - What we know: User decided "instant — no animation" for Go Live snap-back
   - What's unclear: Should the key change still trigger slide-in? Probably not.
   - Recommendation: Only apply slide-in animation when `isLive` is true (auto-follow). When user taps Go Live, skip animation (don't change key, just swap content).

2. **Leader marking in presence list**
   - What we know: User left this to Claude's discretion
   - Recommendation: Small "(lead)" text label after the leader's name, in muted color. Minimal, debuggable, no icon needed.

3. **Border width**
   - What we know: User left exact width to Claude's discretion
   - Recommendation: `ring-4` (4px) — visible enough to notice, not so thick it looks like an error state. Pulse briefly increases to 6px.

4. **Slide animation timing**
   - What we know: User left duration/easing to Claude's discretion
   - Recommendation: 200ms with ease-out. Fast enough for stage use, smooth enough to read as intentional movement.

5. **Dot colors**
   - What we know: User left to Claude's discretion
   - Recommendation: Green (`status-connected`) for live, gold (`accent-gold`) for browsing. Gold matches the "you've drifted" color language.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + React Testing Library 16.3.2 |
| Config file | vitest config in package.json or vite.config |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~5 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOLL-01 | Auto-follow on song-changed when isLive | unit | `npx vitest run src/client/__tests__/SessionScreen.test.tsx -t "auto-follow"` | Partial (SessionScreen tests exist, need new cases) |
| FOLL-02 | Browse to different song independently | unit | `npx vitest run src/client/__tests__/SessionScreen.test.tsx -t "browse"` | Partial (browse test exists for drawer) |
| FOLL-03 | GO LIVE banner visible when browsing away | unit | `npx vitest run src/client/__tests__/GoLiveBanner.test.tsx` | No — Wave 0 gap |
| FOLL-04 | Tapping GO LIVE calls goLive action | unit | `npx vitest run src/client/__tests__/GoLiveBanner.test.tsx -t "go live"` | No — Wave 0 gap |
| PRES-01 | Shows connected users | unit | `npx vitest run src/client/__tests__/PresenceList.test.tsx` | No — Wave 0 gap |
| PRES-02 | Shows live vs. browsing status | unit | `npx vitest run src/client/__tests__/PresenceList.test.tsx -t "status"` | No — Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run --reporter=verbose`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before verification runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/client/__tests__/GoLiveBanner.test.tsx` — covers FOLL-03, FOLL-04
- [ ] `src/client/__tests__/PresenceList.test.tsx` — covers PRES-01, PRES-02
- [ ] Additional test cases in `SessionScreen.test.tsx` — covers FOLL-01 (auto-follow with animation), FOLL-02 (browse away shows banner integration)

*(Test framework and shared fixtures already exist from Phase 1)*

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/client/use-deadsync.ts` — hook already exposes `isLive`, `liveIndex`, `localIndex`, `actions.goLive()`, `actions.browse()`
- Codebase analysis: `src/shared/protocol.ts` — `SessionUser.isLive` and `SessionUser.currentIndex` fields exist
- Codebase analysis: `src/server/deadsync-server.ts` — `handleBrowse()` and `handleGoLive()` already implemented, `user-updated` broadcasts on state change
- Codebase analysis: `src/client/app.css` — `--color-accent-gold: #d4a843` defined in theme

### Secondary (MEDIUM confidence)
- Tailwind v4 `ring` utilities for layout-safe border effects
- CSS `@keyframes` for slide and pulse animations

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, everything in project already
- Architecture: HIGH — all state management exists in hook, phase is UI-only
- Pitfalls: HIGH — based on direct codebase analysis of flex layout and hook behavior

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable — no external dependencies)
