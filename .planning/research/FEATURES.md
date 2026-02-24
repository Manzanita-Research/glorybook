# Feature Research

**Domain:** Real-time setlist sync / chord chart viewer for live musicians
**Researched:** 2026-02-24
**Confidence:** MEDIUM — competitor analysis from live sources; real musician pain points from forums and app store reviews; Glory's specific real-time sync angle is underserved so some claims are extrapolated from adjacent apps.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features musicians assume exist in any stage-worthy chord chart app. Missing these means they won't trust it at a gig.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dark stage-friendly theme | iPads under stage lighting are unusable with bright whites. Every serious stage app (OnSong, SongSheet Pro, SongbookPro) offers dark mode. Non-negotiable for nighttime gigs. | LOW | Glory's design already calls for this. Warm muted dark palette, not stark black. |
| Readable font at glance distance | Charts are read from 2-3 feet away on a music stand. Font size must be large enough to catch at a glance while playing — not while hunched over a screen. | LOW | Minimum 20-22px for lyrics/chords. Monospaced font helps chord alignment. Adjustable size is expected. |
| Chord syntax highlighting | Gold/colored chords visually separated from lyric text. Musicians' eyes scan for chord names; they should pop instantly. SongbookPro lets users make "all chords yellow." | MEDIUM | Already in the design spec: gold for chords, blue for sections, purple for notes. Need a reliable markdown-to-highlighted-HTML parser. |
| Setlist navigation (next/prev song) | Core to the app's purpose. Every competitor has this. On stage, the leader needs one tap to advance. | LOW | Already specified. Leader controls next/prev. |
| Song title and key visible at top | Musicians need instant orientation when a song loads. What song is this? What key? | LOW | Should be persistent header even while scrolling. |
| Scroll within a song | Long chord charts require scrolling. Autoscroll is bonus; manual scroll is table stakes. | LOW | Standard browser scroll works. Touch-friendly on iPad. |
| Join a session easily | Typing a session code on stage should be fast. Competitors require too many steps — OnSong needs 9 steps to share a set. Glory's QR code approach is the right answer here. | MEDIUM | QR scan to join is the path. Fallback: short memorable code (Dead song name format). |
| See who's connected / presence | Musicians need to know their bandmates are actually on the same chart. "Is the bassist live?" is a real question mid-soundcheck. | LOW | Already in protocol: user-joined, user-left events. Render as simple presence list. |
| Leader/follower role clarity | The screen must immediately communicate: "You are following Jem" or "You are leading." Ambiguity on stage is a disaster. | LOW | Single clear persistent status indicator. |
| GO LIVE / snap-back | The ability to browse independently and snap back to what the leader is on. This is Glory's core differentiator within real-time sync apps — but musicians expect that browsing won't break sync silently. | LOW | Big obvious banner when out-of-sync. One tap to return. Already specified. |
| Works offline at gig | Local WiFi / travel router scenario. Cloud dependency at showtime is a trust-killer. OnSong, BandHelper — the serious gig apps all handle offline. | MEDIUM | PartyKit local dev mode covers this. Need graceful degradation if socket drops. |
| Touch-friendly tap targets | iPad fingers in the dark, possibly with a pick in hand. Buttons must be large. No precision required. | LOW | Tailwind makes this straightforward. Min 44px tap targets (Apple HIG). |

---

### Differentiators (Competitive Advantage)

Features that set Glory apart. Not expected from the category, but meaningfully valuable once experienced.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time leader sync (push model) | Every competitor syncs the setlist as a static list. Glory pushes the *current song* live, as the leader moves. Nobody has to remember to tap "next" — it just changes. This is the livestream-scrub model applied to chord charts. | HIGH | Already built in the server/hook. The UI just needs to surface it clearly. |
| Browse-without-losing-sync | Followers can look ahead, then snap back. OnSong Connect requires you to fully detach and reattach. Glory's GO LIVE model is cleaner and more musician-friendly. | MEDIUM | The protocol already handles browse state. UI needs the banner + one-tap return. |
| Leadership transfer on the fly | Any band member can be handed the baton. Useful when the bandleader is soloing and someone else needs to call the next tune. | LOW | Already in protocol (transfer-lead message). UI: a simple "hand off" button visible only to leader. |
| Session codes as Dead song names | `scarlet-042`, `ripple-817`. Memorable, distinctive, on-brand. Competitors use numbers or UUIDs. Dead heads will feel it immediately. | LOW | Needs a word list and ID generation function. Fun touch with zero cost. |
| QR code for instant venue join | Point your phone at the iPad, join the session. No typing, no app store download for the follower. Eliminates the "9 steps to share" complaint musicians have about OnSong. | MEDIUM | QR encodes the session URL. Standard QR library. Followers need only a browser if the client is web-first. |
| Warm, human visual design | Every competitor looks like enterprise software or a dark mode generic app. A warm, sun-faded palette (terracotta, ochre, sage, cream) is immediately distinctive and feels right for Americana/Dead-adjacent music. | LOW | Tailwind custom theme. Design constraint already established. |
| No subscription, no account | Competitors charge $15-30/year or require accounts. Glory is open source, free, community-scale. For a band that just wants to run it on a Mac mini at gigs, this is a meaningful difference. | LOW | Already decided. No auth in scope. |
| Local-first for zero-cloud gigs | Bring a travel router, run on a Mac mini. Zero cloud dependency at showtime. BandHelper requires internet. OnSong requires Dropbox for sync. Glory works on local WiFi only. | MEDIUM | PartyKit's local dev mode already handles this. Document the local gig setup clearly. |
| Chord chart in markdown (not PDF) | PDFs can't be re-colored, resized, or parsed for transposition. Markdown chord charts are editable, annotatable, and render cleanly with syntax highlighting. More flexible for the Dead's catalog which is freely available in text form. | LOW | Parser already needed for table stakes. Markdown-first is already decided. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but create scope, complexity, or philosophical problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-scroll during performance | Musicians see auto-scroll in OnSong and assume they need it. Foot pedal hands-free control is popular. | Auto-scroll speed calibration is hard. Songs have variable tempos, solos, jams. A Dead show will never follow a fixed scroll rate. Adds complexity, breaks on improvisational music. | Manual scroll on iPad; large font so the whole section fits on screen without needing scroll mid-passage. |
| Transpose on the fly | Worship musicians and cover bands need this constantly. Transposing a chord chart to a different key is a power feature. | Requires a real chord parser, not just text highlighting. Getting transposition right (enharmonic equivalents, chord modifiers like maj7, b5, etc.) is its own project. Dead fans rarely transpose — the songs are what they are. | Defer entirely. Pre-transpose the chart before adding to setlist. Document the deliberate skip. |
| Foot pedal / MIDI control | Power users in OnSong and BandHelper use foot switches for hands-free page turns. | Hardware dependency, Bluetooth pairing complexity, and debugging on stage. Out of scope for the primary use case of iPad-on-a-stand. | Large tap targets on iPad. The GO LIVE button is designed to be a single, obvious tap. |
| Backing track integration | BandHelper and OnSong both play backing tracks and click tracks from the app. | Different problem domain entirely. Audio routing, latency, sync — all add significant complexity. Not what Glory is for. | Use a dedicated backing track app. Glory is for charts, not audio. |
| User accounts / auth | "I want to log in from any device" | SaaS model, privacy surface, subscription friction, and complexity. Against the project's philosophy. | Session codes as the identity primitive. Share the code, you're in. |
| PDF import / render | Musicians have PDFs of charts. Seems obvious to support. | PDF rendering is a solved problem (PDF.js), but parsed chord detection from PDFs is unreliable. You get an image, not structured data. Loses all the benefits of markdown-first. | Commit to markdown. Provide a simple template and onboarding guide for converting charts. |
| Setlist templates / community sharing | "Let me share my setlists online" | Becomes a social platform problem. Moderation, accounts, hosting. Against the community-scale philosophy. | Open source the default setlist format. Bands share files directly. |
| Annotations on charts | Drawing, sticky notes on chord charts is an OnSong premium feature. | Meaningful complexity. tldraw canvas was discussed and explicitly deferred. Annotations need persistence, sync, and a rendering layer on top of markdown. | Defer to a future milestone. Core chart viewing first. |
| Real-time everything | Syncing every cursor position, every scroll position, in real time. | WebSocket noise, unnecessary complexity. The Dead don't need to see where your scroll position is. | Sync only the live song index. State changes are intentional, not continuous. |

---

## Feature Dependencies

```
[Session creation / QR code]
    └──requires──> [Session code generation (Dead song names)]
    └──requires──> [PartyKit room initialization]

[Leader controls (next/prev)]
    └──requires──> [Join screen with role selection]
    └──requires──> [WebSocket connection (useDeadSync hook)]

[GO LIVE snap-back banner]
    └──requires──> [Browse state tracked per user]
    └──requires──> [Leader sync (know what "live" is)]

[Chord highlighting]
    └──requires──> [Markdown renderer]
    └──enhances──> [Song viewer]

[Presence indicators]
    └──requires──> [WebSocket connection]
    └──requires──> [user-joined / user-left messages (already in protocol)]

[Leadership transfer]
    └──requires──> [Leader role established]
    └──requires──> [transfer-lead message (already in protocol)]

[QR code join]
    └──requires──> [Session URL format defined]
    └──enhances──> [Join screen]

[Offline gig use]
    └──requires──> [Local PartyKit dev mode documented]
    └──requires──> [Graceful WebSocket disconnection handling]
```

### Dependency Notes

- **Chord highlighting requires markdown renderer:** The markdown-to-HTML pipeline must be in place before any visual chord treatments can work. Choose this early — it affects the whole song viewer.
- **GO LIVE requires browse state:** The server already tracks whether a user is "live" or "browsing." The UI only needs to read that state and show the banner. Low lift once the hook is wired up.
- **Session codes require a word list:** A small, deliberate dependency. Dead song names as session IDs is a list-generation problem, not a cryptography problem.
- **Leadership transfer conflicts with leaderless sessions:** If no leader exists (everyone browsing), the UI needs a defined state. Resolve: first person to join is leader by default; can transfer.

---

## MVP Definition

### Launch With (v1)

The minimum set to take Glory to a real gig and trust it.

- [ ] App shell with React + Vite entry point — nothing works without it
- [ ] Join screen: enter name, choose leader or follower, enter/scan session code
- [ ] Song viewer: markdown rendered with chord/section/note highlighting (gold/blue/purple)
- [ ] Leader controls: next/prev song navigation
- [ ] GO LIVE snap-back banner: visible when follower is out of sync, one tap to return
- [ ] Setlist sidebar: list of songs, current song highlighted, browse by tapping
- [ ] Presence list: who's connected, who's live vs. browsing
- [ ] Dark stage-friendly theme: warm muted dark palette, large readable font
- [ ] QR code display for leader: scan to join the session
- [ ] Session codes using Dead song names

### Add After Validation (v1.x)

These make the app better but aren't needed for the first gig.

- [ ] Leadership transfer — add once a band has used it and wants to pass the baton live
- [ ] Graceful offline degradation — reconnect handling, "lost connection" state
- [ ] Font size adjustment — user-controlled scaling for different reading distances
- [ ] Custom setlist editing in the UI — v1 can rely on editing the default setlist file directly

### Future Consideration (v2+)

Explicitly deferred. Revisit after the first real gig validates the core.

- [ ] Annotations / tldraw canvas — complexity not warranted until v1 is stable
- [ ] Transposition — requires a real chord parser; not a Dead band need
- [ ] Auto-scroll — incompatible with improvisational music
- [ ] Setlist import / songbook tools — markdown-first; convert charts manually for now
- [ ] Service worker / offline caching — local-first model covers the gig case

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dark stage theme | HIGH | LOW | P1 |
| Chord highlighting (gold/blue/purple) | HIGH | MEDIUM | P1 |
| Song viewer (markdown rendered) | HIGH | MEDIUM | P1 |
| Join screen with role selection | HIGH | LOW | P1 |
| Leader next/prev navigation | HIGH | LOW | P1 |
| GO LIVE snap-back banner | HIGH | LOW | P1 |
| Setlist sidebar | HIGH | LOW | P1 |
| QR code for session join | HIGH | MEDIUM | P1 |
| Presence indicators | MEDIUM | LOW | P1 |
| Session codes (Dead song names) | MEDIUM | LOW | P1 |
| Leadership transfer | MEDIUM | LOW | P2 |
| Font size adjustment | MEDIUM | LOW | P2 |
| Offline / reconnect handling | MEDIUM | MEDIUM | P2 |
| Custom setlist editing in UI | MEDIUM | MEDIUM | P2 |
| Auto-scroll | LOW | HIGH | P3 |
| Transpose | LOW | HIGH | P3 |
| Foot pedal / MIDI | LOW | HIGH | P3 |
| Annotations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | OnSong | BandHelper | Setflow | Glory |
|---------|--------|------------|---------|-------|
| Real-time song change pushed to all | Partial (Connect feature, local WiFi, premium only) | Yes (leader/follower, master/slave) | Yes (stage manager controls) | Yes — push model, core to the app |
| Browse independently + snap back | No (detach/reattach model) | No clear equivalent | No | Yes — GO LIVE banner is the differentiator |
| Leadership transfer mid-set | No | Partial (admin controls) | No | Yes — in protocol, low UI lift |
| Dark mode | Yes | Yes | Yes (performance mode) | Yes — warm palette not generic black |
| Chord highlighting / coloring | Yes (gold chords standard) | No | No | Yes — gold/blue/purple by element type |
| QR code join | No | No | No | Yes — eliminates "9 steps to share" |
| Offline / local WiFi only | Partial (library offline, sync needs cloud) | No (requires internet) | No (web app) | Yes — local-first design |
| No subscription / free | No ($15-30/year) | No (subscription) | No (subscription) | Yes — open source |
| User accounts | Yes (required) | Yes (required) | Yes (required) | No — not a SaaS |
| Auto-scroll | Yes | Yes | No | No — anti-feature for this use case |
| Transpose | Yes | Yes | No | No — deferred |
| MIDI / foot pedal | Yes | Yes | No | No — out of scope |
| Backing tracks | Yes | Yes | No | No — different domain |

---

## Sources

- [OnSong Features](https://onsongapp.com/features/) — official feature list, tier breakdown
- [OnSong Connect documentation](https://onsongapp.com/docs/features/connect/) — leader/follower sync mechanism
- [BandHelper Features](https://www.bandhelper.com/main/features.html) — comprehensive feature list
- [Setflow](https://www.setflow.live/) — stage manager / real-time sync competitor
- [Coda Music Tech: Top 5 Chord Chart Apps for iPad](https://www.codamusictech.com/blogs/news/top-5-favorite-paperless-sheet-music-apps-for-ios) — musician comparison
- [Una.ie: How to Format a Clear Chord Chart](http://una.ie/sound/clear-chordchart/) — typography and layout best practices
- [StagePrompter: Why Singers Use iPads on Stage](https://stageprompter.com/blogs/news/why-do-singers-have-an-ipad-on-stage) — musician pain points
- [TalkBass forum: Best iPad App for Cover Bands](https://www.talkbass.com/threads/best-ipad-app-for-cover-bands.1578280/) — real musician feedback (behind 403, supplemented by search summaries)
- [Sweetwater: iPad Optimization Guide for Live Musicians](https://www.sweetwater.com/sweetcare/articles/ipad-optimization-guide-for-live-musicians/) — stage performance optimization

---

*Feature research for: real-time setlist sync / chord chart viewer (Glory)*
*Researched: 2026-02-24*
