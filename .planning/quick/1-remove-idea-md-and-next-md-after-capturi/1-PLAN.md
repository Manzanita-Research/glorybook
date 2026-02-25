---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/PROJECT.md
  - idea.md
  - next.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "idea.md and next.md no longer exist in repo"
    - "No ideas from seed files were lost — all captured in planning docs"
  artifacts:
    - path: ".planning/PROJECT.md"
      provides: "Updated requirements capturing any missing items from seed files"
  key_links: []
---

<objective>
Diff idea.md and next.md against existing planning files, capture any missing items in PROJECT.md, then delete both seed files.

Purpose: Clean up repo root — these seed files predate the planning system and their contents should live in structured planning docs.
Output: Updated PROJECT.md (if gaps found), deleted idea.md and next.md.
</objective>

<execution_context>
@/Users/jem/.claude/get-shit-done/workflows/execute-plan.md
@/Users/jem/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@idea.md
@next.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Capture missing items and delete seed files</name>
  <files>.planning/PROJECT.md, idea.md, next.md</files>
  <action>
Compare idea.md and next.md contents against PROJECT.md and ROADMAP.md. The analysis shows:

**Already captured (no action needed):**
- Project description, core value, philosophy → PROJECT.md "What This Is" + "Core Value"
- Architecture, tech stack → PROJECT.md "Context" + "Constraints"
- Design decisions → PROJECT.md "Key Decisions"
- Deployment modes → PROJECT.md "Context" paragraph
- All "Immediate" items → shipped in v1.0 (ROADMAP phases 1-8)
- QR code generation → shipped in v1.0 (phase 6)
- Presence indicators → shipped in v1.0 (phase 5)
- tldraw, setlist templates, transpose, auto-scroll, audio cue, offline fallback, PDF import → PROJECT.md "Out of Scope"

**Gaps to capture in PROJECT.md before deletion:**
1. "Songbook import (parse chord charts from various sources into Song format)" from the "Soon" section is not in Active requirements or Out of Scope. Add to Active requirements: "Songbook import — parse chord charts from various sources into Song format"
2. "Touch-friendly interactions for iPad" is implied by the constraint but not an explicit requirement. Add to Active requirements: "Touch-friendly refinements for iPad (larger tap targets, swipe gestures)"

Update PROJECT.md:
- Add the two items above to the "### Active" requirements list
- No other changes needed

Then delete idea.md and next.md using git rm.
  </action>
  <verify>
    <automated>test ! -f idea.md && test ! -f next.md && grep -q "Songbook import" .planning/PROJECT.md && grep -q "Touch-friendly" .planning/PROJECT.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>idea.md and next.md are deleted. All unique ideas from those files are captured in PROJECT.md Active requirements. No information was lost.</done>
</task>

</tasks>

<verification>
- idea.md and next.md no longer exist
- PROJECT.md Active requirements include songbook import and touch-friendly items
- git status shows clean deletions staged
</verification>

<success_criteria>
Seed files removed, all ideas preserved in structured planning docs.
</success_criteria>

<output>
After completion, create `.planning/quick/1-remove-idea-md-and-next-md-after-capturi/1-SUMMARY.md`
</output>
