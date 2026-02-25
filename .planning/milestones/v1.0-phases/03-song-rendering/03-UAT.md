---
status: complete
phase: 03-song-rendering
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-02-24T18:00:00Z
updated: 2026-02-24T21:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Song header displays metadata
expected: Join a session as a follower. The session screen shows a song header at the top with: the song title (bold, large), position like "1 of N" on the right, the key in gold, and a tempo value. If the song has notes, they appear in italic muted text.
result: pass

### 2. Chord badges render in gold above lyrics
expected: Look at a chord-lyric line in the chart. Chords appear as gold-colored badges/pills above the lyric text. The lyric text appears below in cream/white. Chords and lyrics are visually aligned — each chord sits directly above the syllable it belongs to.
result: pass
note: "User feedback — shaded background behind chords hurts legibility. Suggest plain pill around each chord instead."

### 3. Section headers render in blue
expected: Look for section markers like "VERSE:", "CHORUS:", "BRIDGE:" in the chart. They should appear in blue, uppercase, and bold — visually distinct from chord lines and lyrics.
result: pass

### 4. Annotations render in purple italic
expected: Look for annotation lines (arrows, transitions, performance notes). They should appear in purple italic text, visually distinct from sections and chord lines.
result: pass

### 5. Box grid renders as bordered cells
expected: If a song has box-grid notation (pipe-separated chords like |G |Am |C |D|), each chord appears in its own bordered box cell with gold text. The grid looks like a structured chord chart table.
result: skipped
reason: No example of box-grid notation in current setlist data

### 6. Chart body scrolls independently
expected: If the chord chart is longer than the screen, you can scroll through the chart body without the song header or session header moving. The chart scrolls independently within its container.
result: pass

### 7. Session header is compact
expected: At the top of the session screen, there's a compact bar showing: the session code, your name and role, and a connection indicator (green dot). This bar stays fixed and doesn't scroll with the chart.
result: pass
note: "User feedback — session header could be consolidated to one line. Session code + name + role info belongs in sidebar, feels wasteful as 2 lines."

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 1

## Gaps

[none]
