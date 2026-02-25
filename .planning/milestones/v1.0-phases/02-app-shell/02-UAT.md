---
status: complete
phase: 02-app-shell
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-02-24T12:00:00Z
updated: 2026-02-25T00:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. App loads with dark theme
expected: Navigate to the app URL. The page loads a dark-themed React app with warm terracotta/ochre tones — dark background, cream/off-white text. No white flash, no console errors.
result: pass

### 2. Join screen shows all fields on one page
expected: The join screen shows "Glory" branding with "soar." tagline, a name field, leader/follower role selection (two cards/buttons), a session code field with placeholder hint like "scarlet-042", and a Join button. All on one screen, no wizard or steps.
result: pass

### 3. Name pre-fills from localStorage
expected: Type a name and join a session. Then reload the page (or close and reopen). The name field should already have your previously entered name filled in.
result: pass

### 4. Post-submit validation only
expected: Leave the name and session code fields empty. Tap Join. An error message should appear. Before tapping Join, no error messages should be visible — validation only triggers after submit.
result: pass

### 5. Role selection works
expected: Tap "Leader" — it highlights with a gold accent. Tap "Follower" — it highlights instead and Leader deselects. Only one role can be selected at a time. Both buttons are large enough to tap easily on iPad.
result: pass

### 6. Joining a session shows connected state
expected: Fill in name, pick a role, enter a session code, and tap Join. The screen transitions to a session view showing: your session code, your name, your role, and a connection indicator (small green dot or similar). No loading spinner stuck, no error.
result: pass

### 7. Touch targets are iPad-friendly
expected: All buttons, inputs, and interactive elements are comfortably tappable — no tiny targets. Everything should feel natural to tap with a finger on an iPad-sized screen.
result: pass

### 8. Theme toggle works
expected: Look for a small icon in the top corner (moon or sun). Tap it — the theme should switch between warm-dark and OLED-black (true black background). Tap again to switch back. The toggle is always visible.
result: pass

### 9. Theme persists across reload
expected: Toggle to OLED-black theme, then reload the page. The page should load in OLED-black, not reset to warm-dark. Your theme preference is remembered.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
