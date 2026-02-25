---
status: complete
phase: 05-follower-ux
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md
started: 2026-02-25T07:00:00Z
updated: 2026-02-25T07:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. App loads and join screen appears
expected: Navigating to the app shows a join screen where user can enter name, choose role, and enter session code.
result: pass

### 2. Leader joins and sees session screen with chord chart
expected: After joining as leader, user sees the session screen with a chord chart, navigation controls, and setlist drawer.
result: pass

### 3. Follower joins and auto-follows leader's song
expected: A follower joining the same session sees the same song the leader is on. No Go Live banner visible (follower is on live song).
result: pass

### 4. Follower browses away — gold border and Go Live banner appear
expected: When follower taps a different song in the setlist sidebar, a gold ring border appears around the screen and a gold "GO LIVE" banner appears at the top.
result: pass

### 5. Follower taps Go Live — instant snap back
expected: Tapping the GO LIVE banner instantly returns the follower to the leader's current song. Gold border and banner disappear. No slide animation.
result: pass

### 6. Leader advances — follower on live sees slide-left animation
expected: When leader taps next song and follower is on live, the new song slides in from the right with a smooth animation.
result: pass

### 7. Leader advances while follower browsing — pulse effect
expected: When leader advances while follower is browsing a different song, the border/banner pulses briefly to signal the leader moved.
result: skipped
reason: Too timing-sensitive for screenshot-based verification

### 8. Presence list shows connected users in sidebar
expected: Opening the setlist drawer shows a presence section at the bottom with connected user names, colored status dots, and leader marking.
result: issue
reported: "Only see Bobby in presence list, Jerry (leader) is missing"
severity: major

### 9. Presence dots reflect live vs browsing status
expected: Users on the live song have green dots. Users browsing a different song have gold dots.
result: skipped
reason: Blocked by Test 8 issue — only one user visible, can't verify status differentiation

## Summary

total: 9
passed: 6
issues: 1
pending: 0
skipped: 2

## Gaps

- truth: "Every connected musician can see who else is in the session"
  status: failed
  reason: "User reported: Only see Bobby in presence list, Jerry (leader) is missing"
  severity: major
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
