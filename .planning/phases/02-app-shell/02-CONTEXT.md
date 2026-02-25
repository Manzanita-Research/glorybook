# Phase 2: App Shell - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A loadable app with working session entry that can connect to the sync layer. Delivers: Vite entry point, React app shell with dark stage-friendly theme, join screen (name + role + session code), connected state after joining, and iPad Safari reliability (44px tap targets, Wake Lock). No song viewer, no navigation controls, no setlist sidebar — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Join screen layout
- Single page with all fields visible — name, role (leader/follower), session code, join button
- No multi-step wizard. Musicians need to get in fast when the band is waiting.
- Name field pre-filled from localStorage (remembered between sessions, editable)
- Branding: "Glory" app name with tagline "soar." visible on the join screen
- Session code field has placeholder hint showing the format (e.g., `scarlet-042`)
- Light validation — error only surfaces after attempting to join, not inline

### Dark theme
- Two theme modes as a user preference: warm-dark and pure-black OLED
- Warm-dark: not pure black, hint of warm brown/charcoal — feels like a dim stage
- Pure-black: true #000 for OLED iPads — maximum contrast, battery savings
- Preference stored in localStorage, persists across sessions
- Persistent corner icon to toggle themes (sun/moon or similar), accessible during sessions
- Chord highlighting colors (gold, blue, purple) used as primary accent colors app-wide — not just in the song viewer
- Gold as primary interactive accent (buttons, active states, highlights)
- Body text in warm cream/off-white — softer on eyes in dark rooms

### Post-join state
- After joining: simple connected confirmation screen showing session code, your name, your role, who else is connected
- No song viewer placeholder — this is a holding state until Phase 3
- Presence updates are silent — names update in the data but never push notifications or pop-ups
- An info/status area shows who's connected, but only when the musician looks at it
- **Zero interruptions during performance.** No toasts, no banners, no sounds, no badges appearing.
- Subtle connection indicator (small dot or icon) that changes color when WebSocket drops, returns to normal on reconnect — visible if you look, never demands attention

### Claude's Discretion
- Session code display prominence on the connected screen (leader showing others how to join)
- Role selection UX (toggle, cards, buttons — whatever fits the single-page layout best)
- Exact icon for theme toggle
- Layout and spacing of the join form
- Connected screen layout and information hierarchy

</decisions>

<specifics>
## Specific Ideas

- "soar." as the tagline — lowercase, with period
- Theme toggle should be always accessible, not buried in settings — but it's not something you'd flip mid-gig
- Presence should feel like checking who's in the room by glancing at a corner, not like getting pinged
- The join screen is the first impression of the app — it should feel warm and grounded, not like a startup login page

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-app-shell*
*Context gathered: 2026-02-24*
