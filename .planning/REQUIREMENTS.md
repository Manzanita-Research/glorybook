# Requirements: Glory

**Defined:** 2026-02-24
**Core Value:** When the leader advances to the next song, every connected musician sees the chord chart instantly — and anyone who browsed ahead can snap back to live with one tap.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Sync Layer

- [x] **SYNC-01**: Server handles join, song navigation, browse/go-live, setlist management, leader transfer, and presence without bugs
- [x] **SYNC-02**: React hook exposes connection state, current song, isLive status, and actions without stale closures
- [x] **SYNC-03**: Server persists state correctly within Cloudflare storage limits
- [x] **SYNC-04**: Connection survives iOS Safari screen lock via Wake Lock API
- [x] **SYNC-05**: Client automatically reconnects and re-joins session after WiFi drop

### App Shell

- [x] **SHELL-01**: User can load the app via Vite entry point (index.html, main.tsx, App.tsx)
- [x] **SHELL-02**: App renders with dark, stage-friendly theme using Tailwind v4
- [x] **SHELL-03**: App is usable on iPad Safari with 44px minimum tap targets

### Join

- [x] **JOIN-01**: User can enter their name on a join screen
- [x] **JOIN-02**: User can choose leader or follower role
- [x] **JOIN-03**: User can enter a session code to join
- [ ] **JOIN-04**: User can scan a QR code to join a session

### Song Viewer

- [x] **SONG-01**: User sees the current song's chord chart rendered from markdown
- [x] **SONG-02**: Chords are highlighted in gold, section headers in blue, notes in purple
- [x] **SONG-03**: Song title and key are visible at the top of the viewer
- [x] **SONG-04**: User can scroll within a long chord chart
- [x] **SONG-05**: Font is readable at glance distance (20-22px minimum, monospaced for chord alignment)

### Leader Controls

- [x] **LEAD-01**: Leader can advance to the next song with one tap
- [x] **LEAD-02**: Leader can go back to the previous song with one tap
- [x] **LEAD-03**: Leader's role is clearly indicated on screen
- [x] **LEAD-04**: Leader can transfer leadership to another connected user

### Follower UX

- [ ] **FOLL-01**: Follower automatically sees the song the leader navigates to
- [ ] **FOLL-02**: Follower can browse to a different song independently
- [ ] **FOLL-03**: Follower sees a prominent "GO LIVE" banner when browsing away from the live song
- [ ] **FOLL-04**: Follower can tap "GO LIVE" to snap back to the leader's current song

### Setlist & Presence

- [x] **LIST-01**: User can see the full setlist in a sidebar
- [x] **LIST-02**: Current live song is highlighted in the setlist
- [x] **LIST-03**: User can tap a song in the sidebar to browse to it
- [ ] **PRES-01**: User can see who is connected to the session
- [ ] **PRES-02**: User can see who is live vs. browsing a different song

### Session Entry

- [ ] **SESS-01**: Leader can display a QR code that others scan to join
- [ ] **SESS-02**: Session codes use Dead song names (e.g., scarlet-042, ripple-817)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Polish

- **POL-01**: User can adjust font size for different reading distances
- **POL-02**: App gracefully shows "lost connection" state and auto-recovers
- **POL-03**: User can edit the setlist from within the UI

### Future

- **FUT-01**: tldraw canvas for annotations on chord charts
- **FUT-02**: Setlist templates and community sharing
- **FUT-03**: Service worker for offline caching of current setlist

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-scroll | Incompatible with improvisational Dead music — variable tempos, jams, solos |
| Transpose | Requires a full chord parser; Dead fans rarely transpose |
| Foot pedal / MIDI control | Hardware dependency, debugging on stage, out of scope for iPad-on-a-stand |
| Backing track integration | Different problem domain — audio routing and latency |
| User accounts / auth | Not a SaaS — session codes are the identity primitive |
| PDF import / render | Markdown-first decision settled — PDFs lose structured data benefits |
| Real-time scroll sync | Unnecessary WebSocket noise — sync only the live song index |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | Phase 1 | Done |
| SYNC-02 | Phase 1 | Done |
| SYNC-03 | Phase 1 | Done |
| SYNC-04 | Phase 1 | Done |
| SYNC-05 | Phase 1 | Done |
| SHELL-01 | Phase 2 | Done |
| SHELL-02 | Phase 2 | Done |
| SHELL-03 | Phase 2 | Done |
| JOIN-01 | Phase 2 | Done |
| JOIN-02 | Phase 2 | Done |
| JOIN-03 | Phase 2 | Done |
| SONG-01 | Phase 3 | Complete |
| SONG-02 | Phase 3 | Complete |
| SONG-03 | Phase 3 | Complete |
| SONG-04 | Phase 3 | Complete |
| SONG-05 | Phase 3 | Complete |
| LEAD-01 | Phase 4 | Complete |
| LEAD-02 | Phase 4 | Complete |
| LEAD-03 | Phase 4 | Complete |
| LEAD-04 | Phase 4 | Complete |
| LIST-01 | Phase 4 | Complete |
| LIST-02 | Phase 4 | Complete |
| LIST-03 | Phase 4 | Complete |
| FOLL-01 | Phase 5 | Pending |
| FOLL-02 | Phase 5 | Pending |
| FOLL-03 | Phase 5 | Pending |
| FOLL-04 | Phase 5 | Pending |
| PRES-01 | Phase 5 | Pending |
| PRES-02 | Phase 5 | Pending |
| JOIN-04 | Phase 6 | Pending |
| SESS-01 | Phase 6 | Pending |
| SESS-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 — traceability populated after roadmap creation*
