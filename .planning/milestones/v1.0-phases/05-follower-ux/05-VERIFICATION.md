---
phase: 05-follower-ux
verified: 2026-02-24T23:24:00Z
status: passed
score: 6/6 success criteria verified
re_verification: false
gaps: []
human_verification:
  - test: "Auto-follow slide animation plays on song advance"
    expected: "When leader advances and follower is live, chord chart slides in from the right"
    why_human: "CSS keyframe animation requires visual inspection in a real browser — cannot verify animation rendering in tests"
  - test: "Gold ring border pulse when leader advances while follower is browsing"
    expected: "The ring around the screen briefly brightens/thickens and the GO LIVE banner pulses for ~600ms"
    why_human: "Timing-based CSS animation triggered by React state — requires real browser and two connected devices"
  - test: "Go Live snap-back is instant (no slide animation)"
    expected: "Tapping GO LIVE shows the new song immediately with no slide-in animation"
    why_human: "Requires distinguishing animation vs. no-animation on two user actions in a live session"
  - test: "All connected musicians appear in presence list (leader + followers)"
    expected: "Opening the setlist drawer shows all users including the leader — no one missing"
    why_human: "Server fix removes premature state on connect; requires two real browser tabs in a running PartyKit session to confirm the race condition is resolved"
---

# Phase 5: Follower UX Verification Report

**Phase Goal:** Followers can browse independently and snap back to the live song with one tap
**Verified:** 2026-02-24T23:24:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (from phase brief)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Follower who has not browsed away sees the new song automatically when the leader advances | VERIFIED | `use-deadsync.ts` lines 148-157: `song-changed` handler calls `setLocalIndex(msg.index)` when `isLiveRef.current` is true; `SessionScreen.tsx` passes `animateTransition={isLive}` to `ChordChart` with keyed wrapper for slide animation |
| 2 | Follower can tap a different song in the sidebar without affecting anyone else's view | VERIFIED | `SessionScreen.tsx` line 109: `handleDrawerSelect` calls `actions.browse(index)` (local only); server `handleBrowse` broadcasts `user-updated` but does NOT change `liveIndex` |
| 3 | When a follower is browsing a different song, a prominent banner appears on their screen | VERIFIED | `SessionScreen.tsx` lines 211-213: `{isBrowsingAway && <GoLiveBanner ... />}`; `GoLiveBanner.tsx` renders gold full-width button with "GO LIVE" text; `SessionScreen.test.tsx` tests this explicitly |
| 4 | Tapping the banner snaps the follower back to the leader's current song | VERIFIED | `GoLiveBanner.tsx` line 17: `onClick={onGoLive}`; `SessionScreen.tsx` lines 98-105: `handleGoLive` calls `actions.goLive()`; `use-deadsync.ts` lines 273-278: `goLive` sets `isLive=true`, `setLocalIndex(liveIdx)`, sends `go-live` message |
| 5 | Every connected musician can see who else is in the session | VERIFIED | `PresenceList.tsx` renders all users from `users` prop; `SetlistDrawer.tsx` renders `<PresenceList users={users} leaderId={leaderId} />`; `SessionScreen.tsx` passes `sessionState?.users ?? []` and `sessionState?.leaderId ?? null`; server fix in `05-03` removes premature `state` on `onConnect` so all users are present |
| 6 | The sidebar or presence bar shows who is on the live song vs. browsing elsewhere | VERIFIED | `PresenceList.tsx` lines 29-33: green dot (`bg-status-connected`) when `user.isLive`, gold dot (`bg-accent-gold`) when not; `aria-label` is "Live" or "Browsing"; server `handleBrowse` sets `user.isLive = index === this.liveIndex` and broadcasts `user-updated` |

**Score:** 6/6 success criteria verified

### Observable Truths (from plan must_haves)

#### Plans 05-01 and 05-03

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Follower who has not browsed away sees the new song automatically when the leader advances | VERIFIED | `song-changed` handler in hook; `isLiveRef` guards follow behavior |
| 2 | Follower browsing a different song sees a gold GO LIVE banner at the top of the screen | VERIFIED | `GoLiveBanner.tsx` — gold button, full width, `py-3`; `isBrowsingAway` condition in `SessionScreen` |
| 3 | Tapping GO LIVE instantly snaps the follower back to the leader's current song | VERIFIED | `handleGoLive` → `actions.goLive()` → sets isLive=true, localIndex=liveIndex |
| 4 | Gold border appears around the screen when follower is browsing away from live song | VERIFIED | `SessionScreen.tsx` line 142-143: `ring-4 ring-inset ring-accent-gold` when `isBrowsingAway` |
| 5 | Border and banner briefly pulse when the leader advances while follower is browsing | VERIFIED | `SessionScreen.tsx` lines 38-48: `useEffect` detects `liveIndex` change while `!isLive`, sets `pulse=true` for 600ms; passed to `GoLiveBanner` and as `animate-[ring-pulse...]` class |
| 6 | Auto-follow song changes show a slide-left transition animation | VERIFIED | `ChordChart.tsx` lines 69-72: keyed div with `animate-[slide-in-left_200ms_ease-out]` when `animateTransition` is true; `@keyframes slide-in-left` in `app.css` lines 52-61 |
| 7 | Go Live snap-back is instant with no animation | VERIFIED | `SessionScreen.tsx` lines 51, 98-105: `justSnappedBackRef` set on `handleGoLive`, clears via `requestAnimationFrame`; `animateTransition = isLive && !justSnappedBackRef.current` |

#### Plan 05-02

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every connected musician can see who else is in the session, including the leader | VERIFIED | `PresenceList.tsx` renders all users; server fix in 05-03 |
| 2 | The presence list shows all users — both the person viewing it AND every other connected user | VERIFIED | Server `onConnect` sends NO state (lines 176-182); `handleJoin` sends state after user added to Map (line 362); server test "follower state message contains both leader and follower" passes |
| 3 | Presence dots correctly show green for live users and gold for browsing users | VERIFIED | `PresenceList.tsx` conditional class; `PresenceList.test.tsx` tests both dot colors explicitly |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/client/components/GoLiveBanner.tsx` | GO LIVE banner component | VERIFIED | 26 lines; exports `GoLiveBanner`; gold bg, full-width button, `onGoLive` callback, `pulse` prop with animation class |
| `src/client/app.css` | Slide-in and pulse keyframe animations | VERIFIED | Contains `@keyframes slide-in-left`, `ring-pulse`, `pulse-once` at lines 52-73 |
| `src/client/__tests__/GoLiveBanner.test.tsx` | Tests for GoLiveBanner | VERIFIED | 6 tests covering render, click callback, aria-label, pulse class on/off/undefined |
| `src/client/components/PresenceList.tsx` | User list with status dots | VERIFIED | 46 lines; exports `PresenceList`; green/gold dots, `(lead)` label, `aria-label` on dots |
| `src/client/__tests__/PresenceList.test.tsx` | Tests for presence rendering | VERIFIED | 9 tests covering heading, names, green/gold dots, leader label, empty array, aria-labels |
| `src/server/deadsync-server.ts` | Server with correct user list in state | VERIFIED | `onConnect` is empty (lines 176-182); `handleJoin` sends state only after user added |
| `src/client/use-deadsync.ts` | Hook with complete user list handling | VERIFIED | `user-joined`, `user-left`, `user-updated` handlers maintain users array accurately |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SessionScreen.tsx` | `GoLiveBanner.tsx` | conditional render when `isBrowsingAway` | VERIFIED | Line 211: `{isBrowsingAway && <GoLiveBanner onGoLive={handleGoLive} pulse={pulse} />}` |
| `GoLiveBanner.tsx` | `useDeadSync actions.goLive` | `onClick` → `handleGoLive` | VERIFIED | `GoLiveBanner` receives `onGoLive` prop; `handleGoLive` calls `actions.goLive()` |
| `SetlistDrawer.tsx` | `PresenceList.tsx` | rendered at bottom of drawer | VERIFIED | Line 85: `<PresenceList users={users} leaderId={leaderId} />` |
| `SessionScreen.tsx` | `SetlistDrawer.tsx` | passes `users` and `leaderId` props | VERIFIED | Lines 248-249: `users={sessionState?.users ?? []}` and `leaderId={sessionState?.leaderId ?? null}` |
| `deadsync-server.ts` | `use-deadsync.ts` | state message with `users` array | VERIFIED | `getState()` returns `users: Array.from(this.users.values())`; hook `state` case calls `setSessionState(msg.state)` |
| `PresenceList.tsx` | `sessionState.users` | `users.map` in render | VERIFIED | `PresenceList.tsx` line 26: `{users.map((user) => ...)}` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FOLL-01 | 05-01, 05-03 | Follower automatically sees the song the leader navigates to | SATISFIED | Hook `song-changed` handler follows when `isLive=true`; server test "live follower DOES follow song-changed" passes |
| FOLL-02 | 05-01, 05-03 | Follower can browse to a different song independently | SATISFIED | `actions.browse()` sets local state only; does not broadcast `set-song`; SetlistDrawer calls `handleDrawerSelect` which calls `browse()` |
| FOLL-03 | 05-01, 05-03 | Follower sees a prominent "GO LIVE" banner when browsing away | SATISFIED | `GoLiveBanner.tsx` component; conditional render in `SessionScreen` when `isBrowsingAway` |
| FOLL-04 | 05-01, 05-03 | Follower can tap "GO LIVE" to snap back to the leader's current song | SATISFIED | `GoLiveBanner` `onClick` calls `handleGoLive` → `actions.goLive()` → sets `isLive=true`, `localIndex=liveIndex` |
| PRES-01 | 05-02, 05-03 | User can see who is connected to the session | SATISFIED | `PresenceList` in `SetlistDrawer`; server fix ensures all users present in state; server test "follower state message contains both leader and follower" passes |
| PRES-02 | 05-02, 05-03 | User can see who is live vs. browsing a different song | SATISFIED | Green dot for `isLive=true`, gold dot for `isLive=false`; server `handleBrowse` updates `user.isLive` and broadcasts `user-updated`; `PresenceList.test.tsx` tests dot colors |

All 6 phase requirements satisfied. No orphaned requirements found — REQUIREMENTS.md traceability table shows FOLL-01 through FOLL-04 and PRES-01, PRES-02 all mapped to Phase 5 and marked Complete.

### Anti-Patterns Found

No problematic anti-patterns detected. Scanned all phase 5 files:

- `GoLiveBanner.tsx`: No stubs, no empty handlers, real `onClick` wired to `onGoLive` prop
- `PresenceList.tsx`: No stubs, real `users.map()` render
- `SessionScreen.tsx`: No stubs; all handlers have real implementations
- `SetlistDrawer.tsx`: No stubs; `PresenceList` rendered with real props
- `ChordChart.tsx`: Animation is real CSS keyframe, not a placeholder
- `app.css`: All three keyframes are substantive (`slide-in-left`, `ring-pulse`, `pulse-once`)
- `deadsync-server.ts`: `onConnect` is intentionally empty with explanatory comment — this is the fix, not a stub
- `use-deadsync.ts`: No stubs; all message handlers update state substantively

Note: `placeholder=` attribute hits in `JoinScreen.tsx` are HTML form placeholders — unrelated to this phase.

### Human Verification Required

The following items require a running app with two connected browser tabs to confirm:

#### 1. Auto-follow slide animation

**Test:** Start a session with two tabs. Have Jerry (leader) and Bobby (follower). Bobby stays on the live song. Jerry taps Next.
**Expected:** Bobby's chord chart slides in from the right with a 200ms ease-out animation.
**Why human:** CSS `animate-[slide-in-left_200ms_ease-out]` applied via React key change — animation rendering cannot be asserted in JSDOM tests.

#### 2. Gold ring border pulse on leader advance while browsing

**Test:** Bobby browses away to song 3. Jerry taps Next (advances to song 2). Observe Bobby's screen.
**Expected:** The gold ring border around Bobby's screen briefly pulses (thickens then returns) over 600ms. The GO LIVE banner text also pulses.
**Why human:** `animate-[ring-pulse_0.6s_ease-in-out]` is a CSS animation triggered by a 600ms React state window — visual timing check required.

#### 3. Go Live snap-back is instant

**Test:** Bobby is browsing away (song 3). Bobby taps GO LIVE.
**Expected:** The chord chart changes to the live song immediately with NO slide animation.
**Why human:** The absence of animation (via `justSnappedBackRef`) requires visual confirmation — JSDOM does not render CSS animations.

#### 4. All users in presence list (real session)

**Test:** Open two browser tabs, have Jerry join as leader and Bobby join as follower. Open the setlist drawer in Bobby's tab.
**Expected:** Both Jerry and Bobby appear in the "Connected" section with correct dots. Jerry shows a green dot and "(lead)" label.
**Why human:** The server fix (removing premature `state` on `onConnect`) eliminates the race condition. The server test verifies the fix in isolation, but real PartyKit session confirms timing end-to-end.

---

## Test Suite Results

185 tests across 13 files — all passing.

Relevant phase 5 test counts:
- `GoLiveBanner.test.tsx`: 6 tests
- `PresenceList.test.tsx`: 9 tests
- `SessionScreen.test.tsx`: 22 tests (includes GoLiveBanner, presence, and UAT Test 9 integration)
- `SetlistDrawer.test.tsx`: 10 tests (includes presence display tests)
- `deadsync-server.test.ts`: Includes "follower state message contains both leader and follower (UAT Test 8)" and "state message is only sent after join, not on connect"

---

_Verified: 2026-02-24T23:24:00Z_
_Verifier: Claude (gsd-verifier)_
