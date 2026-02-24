# Project Research Summary

**Project:** Glory (DeadSync)
**Domain:** Real-time collaborative setlist sync and chord chart viewer for live musicians
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

Glory is a specialized real-time sync app for live musicians — not a general collaboration tool. The sync layer is already complete (PartyKit server, typed protocol, `useDeadSync` hook). This build is about constructing the React UI on top of that working foundation. The recommended approach is a focused, stage-first build: dark theme, large touch targets, fast session join, and a clear leader/follower UX. Six phases of work, each shipping a testable vertical slice. React 19 + Tailwind v4 + PartyKit on Cloudflare, with Bun as the package manager per org defaults.

The core differentiator — pushing the live song to all followers in real time, with per-user browse-and-snap-back — is already implemented at the server and hook level. The UI just needs to surface it clearly. Most of what makes Glory compelling costs very little to build; the chord highlighting and QR join are the two areas with meaningful implementation decisions. A custom chord tokenizer (not ChordSheetJS's HTML formatter) is the right call for the markdown-rendered chart format used by the existing setlist data.

The main risks are not in the UI layer but in the existing server and hook code. Three issues need to be addressed before building on top of them: a stale closure bug in `useDeadSync` that will silently break follower sync, a storage design that will hit Cloudflare's 128 KiB per-key limit with a real setlist, and missing hibernation support that will lose presence state on Cloudflare after idle periods. These are low-cost fixes but must come first. iOS Safari's aggressive WebSocket teardown on sleep is also a real on-stage hazard — Wake Lock and reconnect-with-rejoin need to be in place before the first gig.

## Key Findings

### Recommended Stack

The existing project has React 18, Vite 5, and partysocket 1.0. All three should be upgraded: React 19 is production-stable and backward-compatible with the existing hook; Tailwind v4 ships its own Vite plugin (no `tailwind.config.js` needed) and is the right choice for iPad Safari 16.4+; partysocket 1.1.16 has current fixes. Tailwind custom CSS properties replace the config file; hardcode `class="dark"` on `<html>` — this app is always dark, no toggle needed.

For chord rendering, the custom tokenizer approach is correct: parse `[G]`, `[Am]`, `[C/G]` bracket notation into typed tokens (chord/lyric/section) and color them with Tailwind utility classes. `react-markdown` handles non-chart content. `ChordSheetJS` is worth adding as a dependency for future transposition but should not drive the primary render path. `qrcode.react` (SVG variant) for session QR codes. `react-swipeable` for iPad swipe navigation. `motion` for the GO LIVE banner slide-in.

**Core technologies:**
- React 19.2.4: UI framework — production-stable, React 19 compiler, compatible with existing hook
- Vite 7.3.1: build tool — already in project, fastest iteration, required by PartyKit `serve` block
- Tailwind CSS 4.2.1: styling — org default, no config file, CSS `@theme` variables for stage palette
- TypeScript 5.9.3: type safety — already in project, protocol types are the source of truth
- partysocket 1.1.16: WebSocket client — already in project, upgrade for latest fixes
- react-markdown 10.1.0 + remark-gfm 4.0.1: markdown rendering for song metadata and notes
- qrcode.react 4.2.0: QR code generation — SVG variant, themeable for dark stage use
- react-swipeable 7.0.2: touch swipe gestures for iPad song navigation
- motion 12.34.3: animations for GO LIVE banner and presence transitions

### Expected Features

Musicians using stage apps have clear expectations. The dark theme, large font, and reliable navigation are non-negotiable trust signals. The leader/follower clarity and GO LIVE snap-back are Glory's own additions to that baseline.

**Must have (table stakes):**
- Dark stage-friendly theme — unusable without it under stage lighting
- Readable font at iPad glance distance — 20-22px minimum, monospaced for chord alignment
- Chord syntax highlighting — gold chords, blue sections, purple annotations; eyes scan for them
- Setlist navigation (next/prev) — core to the app's purpose
- Song title and key in persistent header — instant orientation when a song loads
- Join screen — name entry, role selection, session code or QR scan
- Presence indicators — musicians need to know bandmates are actually on the same chart
- Leader/follower role clarity — ambiguity on stage is a disaster
- GO LIVE snap-back banner — big, obvious, one tap; visible only when follower has browsed away
- Works on local WiFi only — cloud dependency at showtime is a trust-killer
- Touch-friendly tap targets — 44pt minimum, Apple HIG, fingers in the dark with a pick in hand

**Should have (competitive advantage):**
- Real-time leader sync (push model) — nobody else does this; every competitor syncs a static setlist
- Browse-without-losing-sync — GO LIVE model is cleaner than any competitor's detach/reattach flow
- QR code for instant venue join — eliminates "9 steps to share" pain from OnSong
- Session codes as Dead song names — `scarlet-042`, `ripple-817`; memorable, on-brand
- Leadership transfer — pass the baton when the bandleader is soloing
- Warm human visual design — every competitor looks like enterprise software

**Defer (v2+):**
- Auto-scroll — incompatible with improvisational music; Dead shows don't follow fixed tempos
- Transpose — real chord parser required; not a Dead band need
- Annotations / tldraw canvas — explicitly deferred, adds a full rendering layer
- PDF import — against the markdown-first decision; chart conversion is manual for now
- MIDI / foot pedal — hardware dependency, Bluetooth complexity, out of scope
- Service worker offline caching — local PartyKit dev mode covers the gig case

### Architecture Approach

Single `DeadSyncContext` wrapping `useDeadSync` once — all components read via `useSync()`. One WebSocket connection per browser tab, distributed to the component tree through context. The hook already resolves `currentSong` correctly via `liveIndex`/`localIndex`/`isLive` logic; components should read `currentSong` for display and only reach for raw indices when they specifically need to show sync contrast (SetlistSidebar, GoLiveBanner). Build order flows bottom-up: entry point and context first, join screen second, song rendering third, navigation and leader controls fourth, follower UX fifth, polish sixth.

**Major components:**
1. `DeadSyncContext` / `DeadSyncProvider` — wraps `useDeadSync` once; distributes state + actions to the tree
2. `App` — join state machine; routes between JoinScreen and SessionLayout
3. `JoinScreen` — name, role selection, session code entry; local state only, calls `actions.join` on submit
4. `SessionLayout` — structural shell; renders sidebar, song viewer, and role-conditional overlays
5. `SongViewer` — renders `currentSong.chart` with chord/section/annotation token highlighting
6. `SetlistSidebar` — song list with live/browsing highlights and per-song presence dots
7. `LeaderControls` — prev/next buttons; only renders when `isLeader`
8. `GoLiveBanner` — snap-back prompt; only renders when `!isLive && !isLeader`
9. `PresenceBar` — connected users with live/browsing status
10. `ConnectionStatus` — reconnecting indicator; non-blocking

### Critical Pitfalls

1. **Stale `isLive` closure in `useDeadSync`** — The message handler captures `isLive` at mount time; changes after mount are invisible to it. Fix: `useRef` to hold the latest handler, call `handlerRef.current(msg)` inside the static event listener. Must fix before building UI on top of the hook.

2. **Setlist storage hit 128 KiB Cloudflare limit** — The server persists the entire setlist (including full chart markdown) under one `"session"` key. A 20-song Dead set will exceed the limit. Fix: shard storage — song charts under `song:{id}` keys, lightweight metadata under `"session"`. Fix before any setlist management UI is built.

3. **No hibernation = presence vanishes on Cloudflare after idle** — In-memory `Map` for users doesn't survive hibernation wake-ups. Fix: enable `hibernate: true`, move user presence to `connection.setState()` (2 KB per connection, sufficient), reload session metadata from storage in `onStart`. Local dev never surfaces this; production does.

4. **iOS Safari drops WebSocket when iPad sleeps** — Aggressive connection teardown on screen lock is documented Safari behavior. Fix: request `navigator.wakeLock.request('screen')` on app start (re-request on `visibilitychange`), and re-send `join` on every socket `open` after reconnect using cached name/role from `localStorage`. Show a non-blocking "Reconnecting..." status bar — never a modal.

5. **Eager leader promotion on disconnect causes mid-show chaos** — The current `onClose` handler immediately promotes the first remaining user to leader if the leader drops. A 2-second WiFi hiccup hands control to a random bandmate. Fix: add a 3-5 second grace period using PartyKit's alarm API, and restore the original leader by `connection.id` if they rejoin within the window.

## Implications for Roadmap

Based on research, the build should start with the foundation that everything else depends on — including fixing the existing server and hook issues before piling UI on top of them.

### Phase 1: Sync Layer Hardening

**Rationale:** Three critical pitfalls live in already-written code. Building the UI on top of a stale-closure hook or a storage-limited server means debugging those issues through the UI layer, which is harder. Fix them first, in isolation, where they're testable.
**Delivers:** A reliable sync layer that can be trusted for on-stage use. Deployable to Cloudflare without surprise failures.
**Addresses:** Stale closure bug, 128 KiB storage limit, missing hibernation, eager leader promotion
**Avoids:** Discovering these bugs through confusing UI behavior during a rehearsal

### Phase 2: App Shell and Entry Point

**Rationale:** Nothing renders without this. It's also where iOS-specific reliability work happens — Wake Lock and reconnect-with-rejoin belong at the app shell level.
**Delivers:** A loadable app with working session entry. First integration test point: can join, connection confirmed.
**Uses:** React 19, Vite entry point, Tailwind v4 dark theme base, `DeadSyncContext`, `App`, `JoinScreen`
**Implements:** Context architecture pattern; join flow state machine
**Avoids:** iOS Safari disconnect without Wake Lock, ghost users from missing re-join on reconnect

### Phase 3: Song Rendering

**Rationale:** The chord chart is the core content. Until it renders correctly with gold/blue/purple highlighting, the app has no value to show. This is also where the custom chord tokenizer gets built — it needs to exist before any other UI can display charts.
**Delivers:** A readable, highlighted chord chart on screen. Visually validates the stage theme.
**Uses:** Custom chord tokenizer, react-markdown, Tailwind stage palette (`--color-chord`, `--color-section`, `--color-annotation`, `--color-lyric`)
**Implements:** `SongViewer`, `SessionLayout` shell, `ChordChart` component with `useMemo` parse
**Avoids:** Markdown re-parsing on every render (memoize on `currentSong.id`)

### Phase 4: Navigation and Leader Controls

**Rationale:** With charts rendering, add the ability to move between them. This is where the core sync loop becomes verifiable end-to-end: leader advances, followers see the change.
**Delivers:** Working leader/follower navigation. The full sync loop is exercised for the first time.
**Uses:** `LeaderControls`, `SetlistSidebar`, `actions.setSong`, `actions.browse`
**Implements:** Dual-index pattern (liveIndex vs localIndex); conditional rendering by role
**Avoids:** Calling `useDeadSync` in multiple components; deriving current song outside the hook

### Phase 5: Follower UX

**Rationale:** The GO LIVE snap-back is Glory's main differentiator over every competitor. It needs to be prominent, clear, and dead simple. Presence indicators close the loop — musicians need to know their bandmates are actually connected.
**Delivers:** Full leader/follower experience end-to-end, including the browse-and-snap-back flow.
**Uses:** `GoLiveBanner`, `PresenceBar`, `ConnectionStatus`, `motion` for banner animation
**Implements:** `isLive`/`isLeader` conditional rendering; presence dots in setlist sidebar
**Avoids:** Showing GO LIVE to the leader; blocking UI on reconnect

### Phase 6: Session Entry and Polish

**Rationale:** QR code and session codes are the final piece that make Glory usable at a venue without friction. Polish (font size, touch targets, scroll reset) is last because it requires the full UI to exist before it can be audited.
**Delivers:** QR code generation for venue join. Dead song name session codes. Touch and visual polish for iPad use. Ready for first gig.
**Uses:** `qrcode.react`, `react-swipeable`, session code word list, touch target audit
**Implements:** QR display on leader screen; swipe gesture for song navigation; scroll-to-top on song change
**Avoids:** Touch targets below 44pt; pure black background (use warm dark charcoal); song index displayed as 0-based

### Phase Ordering Rationale

- Sync layer first because the UI will mask server bugs — fix them in isolation
- App shell before song rendering because nothing renders without an entry point and context
- Song rendering before navigation because a chart that looks wrong undermines trust in the whole app
- Navigation before follower UX because GO LIVE requires the sync loop to already be working
- Polish last because you can't audit touch targets or font sizes until the full UI exists

### Research Flags

Phases with standard patterns (research not needed during planning):
- **Phase 2 (App Shell):** React context setup and Vite entry point are well-documented. The Wake Lock API has clear MDN docs.
- **Phase 3 (Song Rendering):** Custom tokenizer pattern is fully specified in STACK.md. react-markdown setup is documented.
- **Phase 4 (Navigation):** Standard React state and conditional rendering patterns.
- **Phase 6 (Polish):** qrcode.react is well-documented; touch target sizing is an established standard.

Phases that may benefit from deeper research during planning:
- **Phase 1 (Sync Hardening):** PartyKit hibernation patterns and `connection.setState()` usage warrant a close read of the PartyKit docs and the existing server code before writing fixes. The alarm API for grace-period leader promotion is less commonly documented.
- **Phase 5 (Follower UX):** The reconnect + re-join flow has subtle edge cases (multiple reconnects, leader reconnect timing) that benefit from writing out the state machine explicitly before implementing.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from npm registry. Tailwind v4 setup confirmed against official docs. Existing codebase inspected directly for compatibility. |
| Features | MEDIUM | Competitor analysis from live sources; Glory's real-time sync angle is underserved so some differentiator claims are extrapolated from adjacent apps. Core musician pain points are well-sourced. |
| Architecture | HIGH | Existing hook and server code inspected directly. PartyKit patterns verified against docs. Component boundaries derived from the actual protocol shape. |
| Pitfalls | HIGH | All 5 critical pitfalls identified from direct code review of `use-deadsync.ts` and `deadsync-server.ts`. Cloudflare DO limits and iOS Safari behavior are documented and confirmed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Session code word list:** Dead song names as session IDs needs a curated word list. The format is decided (`word-NNN`) but the actual list needs to be built. Low effort, needs to happen in Phase 6.
- **Chord parser edge cases:** The custom tokenizer handles the existing `default-setlist.ts` format cleanly. Real-world Dead charts from the internet may use slightly different notation (slash chords, complex modifiers). Validate against a broader sample before Phase 3 ships.
- **Cloudflare vs local parity for hibernation testing:** Local `partykit dev` has no storage limits and no hibernation. The storage sharding and hibernation fixes from Phase 1 must be tested against an actual Cloudflare deploy before they can be considered done. A test deploy environment should be set up during Phase 1.
- **Leadership transfer UX:** The protocol already supports `transfer-lead`. The feature is scoped for v1.x (after validation). When it lands, the UX needs a defined model for who can transfer to whom and what the visual confirmation is.

## Sources

### Primary (HIGH confidence)
- npm registry (2026-02-24) — all version numbers for React, Vite, Tailwind, partysocket, react-markdown, qrcode.react, motion, react-swipeable
- Context7 `/tailwindlabs/tailwindcss.com` — v4 Vite setup, dark mode class variant, CSS `@theme` variables
- Context7 `/remarkjs/react-markdown` — custom components, plugin pipeline
- Context7 `/partykit/partykit` — `usePartySocket`, hibernation, connection state patterns
- Context7 `/zpao/qrcode.react` — QRCodeSVG/QRCodeCanvas props
- Context7 `/websites/motion_dev` — touch support, drag controls
- `src/shared/protocol.ts` — confirmed message types, both directions
- `src/client/use-deadsync.ts` — confirmed hook return shape, stale closure pattern identified
- `src/server/deadsync-server.ts` — confirmed storage pattern, hibernation gap, leader promotion logic
- `src/shared/default-setlist.ts` — confirmed `[G]` bracket chord format
- Cloudflare Durable Objects docs — 128 KiB per-value storage limit confirmed
- Screen Wake Lock API — MDN, iOS 16.4+ support confirmed

### Secondary (MEDIUM confidence)
- OnSong features and Connect docs — competitor feature analysis
- BandHelper features — competitor feature analysis
- Setflow — real-time sync competitor
- Coda Music Tech top chord chart apps — musician comparison and pain points
- StagePrompter blog — musician stage iPad pain points
- WebSearch: React 19 production stability 2025 — consensus: production-ready
- WebSearch: Tailwind v4 Safari 16.4+ browser floor
- WebSearch: ChordSheetJS bracket format / ChordPro parser support
- React stale closure / useEffect cleanup patterns — hookedonui.com

### Tertiary (LOW confidence / inferred)
- TalkBass forum cover band app thread — behind 403, supplemented by search summaries
- iOS Safari WebSocket background disconnection behavior — confirmed pattern, exact iOS version behavior extrapolated from socket.io issue thread

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
