---
status: complete
phase: 04-navigation-and-leader-controls
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-02-24T21:16:00Z
updated: 2026-02-24T21:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navigation bar shows at bottom with prev/next
expected: On the session screen, a transport bar sits at the bottom of the screen showing: left arrow, the current song title, position "N of M", and right arrow. The bar doesn't overlap the chord chart content.
result: pass

### 2. Prev/next arrows navigate songs
expected: Tap the right arrow — the chart changes to the next song in the setlist (title and chords update). Tap the left arrow — it goes back. The position counter updates accordingly.
result: pass

### 3. Navigation disables at boundaries
expected: Navigate to the first song — the left arrow should be visually dimmed/disabled and not respond to taps. Navigate to the last song — the right arrow should be disabled.
result: pass

### 4. LEADER badge shows for leader
expected: Join a session as leader. In the session header, next to your name, you see a gold "LEADER" badge (uppercase, gold background tint). As a follower, you see "follower" in plain muted text instead.
result: pass

### 5. Hamburger opens setlist drawer
expected: Tap the hamburger icon (three lines) in the top-left of the session header. A drawer slides in from the left showing the full song list. Each song shows its title. The currently live song has a gold accent highlight.
result: pass

### 6. Drawer song selection browses locally
expected: In the setlist drawer, tap a song that's not the current one. The drawer closes and the chart updates to that song. If you're a follower, this is local-only — it doesn't change what other users see.
result: pass

### 7. Long-press LEADER badge opens transfer menu
expected: As a leader, press and hold the LEADER badge for about half a second. A transfer menu appears showing other connected users. Tapping a user shows a confirmation step before transferring leadership.
result: skipped
reason: Testing on Mac — long-press with trackpad is unreliable

### 8. Backdrop dismiss on drawer and menu
expected: With the setlist drawer open, tap the dark backdrop area to the right of the drawer — it closes. Similarly, if the transfer menu is open, tapping outside it should dismiss it.
result: pass

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 1

## Gaps

[none]
