# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Visual Polish

**Shipped:** 2026-02-25
**Phases:** 1 | **Plans:** 2

### What Was Built
- Fraunces display font on all headings/branding with WONK 1, SOFT 100
- Commit Mono self-hosted on chord charts and labels with full OpenType features
- Uppercase tracked monospace labels across all section identifiers
- Film grain overlay on JoinScreen, brand selection style

### What Worked
- Auto-advance pipeline (discuss → plan → execute) ran end-to-end without intervention
- Brand materials (www, Toneword screenshots, brand README) gave enough context for Claude to make visual decisions autonomously
- Scoping grain to JoinScreen only was a good call — chord chart readability preserved

### What Was Inefficient
- Phase added to stale v1.0 config instead of properly starting a new milestone cycle
- One test needed updating due to label markup change (Key: → Key) — minor but avoidable with upfront label audit

### Patterns Established
- `font-display` utility class = Fraunces with WONK/SOFT always set
- `font-mono` utility class = Commit Mono with OpenType features always set
- `text-xs uppercase tracking-[0.2em] font-mono` = standard label pattern
- `.grain` class for scoped film grain overlay (JoinScreen only, not session)

### Key Lessons
1. Visual polish phases can run fully automated when brand materials are well-documented
2. Self-hosting fonts from org/fonts avoids CDN dependency — good pattern for gig-mode offline use

### Cost Observations
- Model mix: quality profile (opus for all agents)
- Sessions: 1 (full auto-advance)
- Notable: Entire phase (discuss + plan + execute) completed in single pipeline run

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~8 | 8 | Initial build, manual phase-by-phase |
| v1.1 | 1 | 1 | Full auto-advance pipeline, single session |

### Cumulative Quality

| Milestone | Tests | LOC | Key Addition |
|-----------|-------|-----|--------------|
| v1.0 | 208 | 6,192 | Full app from scratch |
| v1.1 | 208 | 5,435 | Brand typography system |

### Top Lessons (Verified Across Milestones)

1. Well-documented brand materials enable autonomous visual work
2. Scoped CSS utilities (.grain, .font-display) keep brand application consistent without global side effects
