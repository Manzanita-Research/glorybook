# Phase 4: Navigation and Leader Controls - Research

**Researched:** 2026-02-24
**Domain:** React UI components — navigation controls, drawer sidebar, leader identity, leadership transfer
**Confidence:** HIGH

## Summary

Phase 4 is purely a UI construction phase. The sync layer is complete — `useDeadSync` already exposes `setSong`, `browse`, `goLive`, `transferLead`, `isLeader`, `isLive`, `localIndex`, `liveIndex`, and full session state including the users list. No protocol changes are needed. No new libraries are needed.

The work is: build four UI features (bottom navigation bar, setlist drawer, leader badge, transfer menu) and wire them to existing hook actions. The `SessionScreen` component is the integration surface — it already renders `ChordChart` and has access to the hook's return values.

**Primary recommendation:** Build components in dependency order — NavigationBar first (needed for basic song advancement), SetlistDrawer second (references the same song data), LeaderBadge third (simple display), TransferMenu last (depends on badge + users list). All wire into SessionScreen.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed bottom bar with prev/next arrows and song name + position ("3 of 8") between them
- 48px tap targets to start — revisit sizing during UAT
- Prev button disabled (greyed out) on first song, next disabled on last — no wrapping
- Only the leader's next/prev changes the live song for all followers
- Toggle drawer, not always-visible — chord chart gets full width by default
- Hamburger icon in top-left opens the drawer (no swipe gesture)
- Live song highlighted with gold left accent bar + bold text — consistent with existing gold chord palette
- Tapping a song in the sidebar browses to it on your screen only — does NOT change the live song for others
- Leader uses next/prev in the bottom bar to advance the live song for everyone
- Persistent "LEADER" badge in the header bar — always visible, no ambiguity mid-show
- Leadership transfer via long-press on the LEADER badge — opens a menu of connected users
- Confirmation step required: "Transfer leadership to [name]?" with confirm/cancel

### Claude's Discretion
- Whether followers see "Led by [name]" or just their own "FOLLOWER" role — presence display is Phase 5 territory, so minimal here is fine
- Drawer animation style and overlay behavior
- Bottom bar visual treatment (background, border, shadow)
- Exact badge styling and positioning

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEAD-01 | Leader can advance to the next song with one tap | NavigationBar component — calls `actions.setSong(liveIndex + 1)` |
| LEAD-02 | Leader can go back to the previous song with one tap | NavigationBar component — calls `actions.setSong(liveIndex - 1)` |
| LEAD-03 | Leader's role is clearly indicated on screen | LeaderBadge in session header — persistent "LEADER" text |
| LEAD-04 | Leader can transfer leadership to another connected user | TransferMenu via long-press on badge — calls `actions.transferLead(userId)` |
| LIST-01 | User can see the full setlist in a sidebar | SetlistDrawer component — reads `sessionState.setlist.songs` |
| LIST-02 | Current live song is highlighted in the setlist | Gold left accent bar on the song at `liveIndex` |
| LIST-03 | User can tap a song in the sidebar to browse to it | Tap handler calls `actions.browse(index)`, closes drawer |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI components | Already installed, project standard |
| Tailwind CSS | v4 | Styling | Already installed, project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | All features use React state + existing hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom drawer | headlessui Dialog | Overkill — drawer is a simple overlay + translate transform |
| Long-press library | react-use useLongPress | Single use case — a `setTimeout`/`onTouchStart`/`onTouchEnd` is cleaner |

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/client/components/
├── SessionScreen.tsx     # Integration surface (modify)
├── NavigationBar.tsx     # NEW — prev/next + song position
├── SetlistDrawer.tsx     # NEW — slide-out setlist panel
├── LeaderBadge.tsx       # NEW — role indicator in header
├── TransferMenu.tsx      # NEW — connected users + confirmation
├── ChordChart.tsx        # Existing — no changes needed
├── SongHeader.tsx        # Existing — no changes needed
└── ...
```

### Pattern 1: Leader vs Follower Conditional Rendering
**What:** The NavigationBar renders for everyone but only the leader's taps change the live song. Followers' taps call `actions.browse()` instead.
**When to use:** Any component where leader and follower see the same UI but trigger different sync actions.
**Example:**
```typescript
function handleNext() {
  const nextIndex = liveIndex + 1;
  if (isLeader) {
    actions.setSong(nextIndex); // Changes live song for everyone
  } else {
    actions.browse(nextIndex); // Only changes local view
  }
}
```

### Pattern 2: Long-Press Gesture
**What:** Use `onPointerDown`/`onPointerUp`/`onPointerCancel` with a `setTimeout` for 500ms to detect long-press. Pointer events work across mouse and touch.
**When to use:** TransferMenu trigger on the LEADER badge.
**Example:**
```typescript
const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

function handlePointerDown() {
  timerRef.current = setTimeout(() => {
    setShowTransferMenu(true);
  }, 500);
}

function handlePointerUp() {
  if (timerRef.current) clearTimeout(timerRef.current);
}
```

### Pattern 3: Drawer with Overlay
**What:** A fixed-position panel that slides in from the left with a semi-transparent backdrop. Controlled by boolean state in SessionScreen.
**When to use:** SetlistDrawer.
**Example:**
```typescript
// Backdrop
<div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
// Drawer panel
<div className={`fixed inset-y-0 left-0 w-72 bg-surface-raised z-50
  transform transition-transform duration-200
  ${open ? 'translate-x-0' : '-translate-x-full'}`}>
```

### Anti-Patterns to Avoid
- **Prop drilling session state through multiple levels:** SessionScreen should destructure from useDeadSync and pass only what each child needs (songs array, liveIndex, isLeader, specific actions).
- **Duplicating song index logic:** The hook already computes `liveIndex` and `localIndex` — components should not re-derive these.
- **Using onClick for long-press:** onClick fires on release — use pointer events for press-and-hold detection.
- **Wrapping navigation:** CONTEXT.md explicitly says no wrapping — disable prev on first, next on last.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket sync | Custom WebSocket code | `useDeadSync` hook | Already built, tested, handles reconnect |
| Song data model | Custom types | `protocol.ts` types | Single source of truth |
| Theme tokens | Inline colors | Tailwind theme vars (`accent-gold`, `surface-raised`, etc.) | Consistency with existing palette |

**Key insight:** The entire sync layer is complete. Phase 4 touches ZERO server or hook code. Every action already exists and is typed.

## Common Pitfalls

### Pitfall 1: Bottom Bar Consuming Scroll Space
**What goes wrong:** A fixed bottom bar sits on top of the chord chart, hiding the last few lines.
**Why it happens:** Using `fixed bottom-0` without accounting for it in the flex layout.
**How to avoid:** Keep NavigationBar inside the flex column as a `shrink-0` element at the bottom — it naturally pushes the scrollable ChordChart area up. The existing `h-dvh flex flex-col` layout in SessionScreen already supports this pattern (header is `shrink-0`, chart is `flex-1 min-h-0`).
**Warning signs:** Can't see the last chord line when scrolled to bottom.

### Pitfall 2: Leader Checking Wrong Index
**What goes wrong:** Leader's next/prev uses `localIndex` instead of `liveIndex`, causing drift if they browsed.
**Why it happens:** Confusing the two indices.
**How to avoid:** Leader's next/prev always works from `liveIndex` (the canonical server position). The hook provides both — use the right one.
**Warning signs:** Leader presses next but skips a song or goes backwards.

### Pitfall 3: Drawer State Leaking into Navigation
**What goes wrong:** Opening the drawer doesn't close when a song is tapped, or tapping prev/next while drawer is open causes unexpected behavior.
**Why it happens:** Drawer open state not cleaned up on song navigation.
**How to avoid:** Close the drawer when a song is selected. NavigationBar ignores drawer state entirely.
**Warning signs:** Drawer stays open after song tap.

### Pitfall 4: Long-Press Triggering Click
**What goes wrong:** After releasing a long-press, the normal click handler also fires, navigating away or triggering an unwanted action.
**Why it happens:** Pointer events fire click at the end of the gesture chain.
**How to avoid:** Set a flag when long-press triggers, suppress the next click, reset the flag.
**Warning signs:** Transfer menu opens AND something else happens on release.

### Pitfall 5: Safe Area Overlap on iPad
**What goes wrong:** Bottom navigation bar sits behind the iPad home indicator.
**Why it happens:** Not accounting for `env(safe-area-inset-bottom)`.
**How to avoid:** The existing `.safe-area-padding` class handles this for the outer container. The NavigationBar should add `pb-[env(safe-area-inset-bottom)]` or the outer container's padding should cover it. Since `SessionScreen` already uses `safe-area-padding` on the outer div, the bottom bar benefits from it.
**Warning signs:** Bottom bar buttons partially hidden by home indicator.

## Code Examples

### NavigationBar Component Shell
```typescript
interface NavigationBarProps {
  songTitle: string;
  position: number;     // 1-based display index
  total: number;
  isLeader: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function NavigationBar({ songTitle, position, total, isLeader, onPrev, onNext }: NavigationBarProps) {
  const isFirst = position === 1;
  const isLast = position === total;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-t border-border shrink-0">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="w-12 h-12 flex items-center justify-center text-text-primary disabled:text-text-muted"
        aria-label="Previous song"
      >
        {/* Left arrow */}
      </button>
      <div className="text-center min-w-0 flex-1 px-2">
        <p className="text-text-primary font-medium truncate">{songTitle}</p>
        <p className="text-text-secondary text-sm">{position} of {total}</p>
      </div>
      <button
        onClick={onNext}
        disabled={isLast}
        className="w-12 h-12 flex items-center justify-center text-text-primary disabled:text-text-muted"
        aria-label="Next song"
      >
        {/* Right arrow */}
      </button>
    </div>
  );
}
```

### SetlistDrawer Item with Live Highlight
```typescript
<li
  className={`px-4 py-3 cursor-pointer flex items-center gap-3
    ${index === liveIndex ? 'border-l-4 border-accent-gold font-bold text-text-primary' : 'text-text-secondary'}`}
  onClick={() => { onSelect(index); onClose(); }}
>
  <span className="text-sm text-text-muted w-6 text-right">{index + 1}</span>
  <span className="truncate">{song.title}</span>
</li>
```

### Wiring in SessionScreen
```typescript
// Destructure additional values from hook
const { liveIndex, localIndex, isLive, actions, sessionState, isLeader } = useDeadSync({ host, room });

// Navigation handlers — leader changes live, follower browses
function handlePrev() {
  const target = liveIndex - 1;
  if (isLeader) actions.setSong(target);
  else actions.browse(target);
}
function handleNext() {
  const target = liveIndex + 1;
  if (isLeader) actions.setSong(target);
  else actions.browse(target);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| onTouchStart/End | onPointerDown/Up | Pointer Events are standard | Unified mouse + touch handling |
| Fixed positioning for bottom bars | Flexbox shrink-0 | CSS Flexbox maturity | No scroll overlap issues |
| CSS transitions for drawers | Same (CSS transitions) | Stable | No JS animation library needed |

**Deprecated/outdated:**
- Touch events (`onTouchStart`, `onTouchEnd`): Pointer events supersede these and work across input types.

## Open Questions

1. **Follower role display**
   - What we know: Leader sees "LEADER" badge. CONTEXT.md says Claude decides what followers see.
   - Recommendation: Show "FOLLOWER" badge (muted, not gold) — simple, clear, deferred to Phase 5 for "Led by [name]" enhancement.

2. **Drawer width on smaller screens**
   - What we know: `w-72` (288px) is a common drawer width.
   - Recommendation: Use `w-72 max-w-[80vw]` so it doesn't overflow on narrower screens. iPad in portrait is ~768px so 288px is fine.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/client/use-deadsync.ts` — all actions already implemented
- Codebase analysis: `src/shared/protocol.ts` — all types defined
- Codebase analysis: `src/client/components/SessionScreen.tsx` — integration surface
- Codebase analysis: `src/client/app.css` — theme tokens already defined

### Secondary (MEDIUM confidence)
- Pointer Events API — web standard, widely supported since 2019

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing
- Architecture: HIGH — codebase fully inspected, patterns clear
- Pitfalls: HIGH — based on direct codebase analysis of flex layout and hook API

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable — no external dependencies to drift)
