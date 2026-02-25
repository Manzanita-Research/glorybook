# Phase 8: Clean Up Tech Debt - Research

**Researched:** 2026-02-25
**Domain:** Documentation cleanup, TypeScript strictness, import hygiene, dead code removal
**Confidence:** HIGH

## Summary

Phase 8 addresses 10 tech debt items identified in the v1.0 milestone audit. All 32 requirements are satisfied — this phase adds no new functionality. The items break into four categories: (1) missing/incomplete planning documentation for early phases, (2) a cosmetic import path in ChordLine.tsx, (3) TypeScript type errors in test mocks that pass at runtime but fail `tsc --noEmit`, and (4) dead exports in chord-tokenizer.ts.

All items are well-understood and low-risk. Most are documentation-only edits or single-line code changes. The TypeScript mock issue requires understanding how literal type narrowing works with spread overrides. The "human verification pending" and "Cloudflare deploy" items are documentation-acknowledgment items — they cannot be resolved by code changes alone.

**Primary recommendation:** Group into three small plans — (1) documentation fixes, (2) code fixes, (3) items that require acknowledgment/deferral rather than code changes. All code changes must pass `tsc --noEmit` and `vitest run` with zero regressions.

## Architecture Patterns

### The 10 Tech Debt Items — Categorized

#### Category A: Missing Planning Documentation (items 1-2, 4)

These are `.planning/` directory files that predate the current workflow conventions.

**Item 1 — Phase 1 has no VERIFICATION.md**
- Phase 1 (Sync Layer Hardening) was completed before the verifier workflow existed
- All other phases (2-7) have VERIFICATION.md files
- Phase 1 requirements: SYNC-01 through SYNC-05
- Evidence exists: code is complete, 31 server+hook tests pass, requirements marked Done in traceability table
- Fix: Create `01-VERIFICATION.md` following the format established in phases 2-7

**Item 2 — Phase 1 SUMMARY files lack `requirements-completed` frontmatter**
- Four SUMMARY files: `01-01-SUMMARY.md` through `01-04-SUMMARY.md`
- These use an older freeform format (no YAML frontmatter at all)
- Post-Phase-1 SUMMARY files all have structured YAML frontmatter including `requirements-completed` arrays
- Requirements to distribute across summaries:
  - 01-01 (Protocol Redesign): Partial SYNC-01 (protocol contract)
  - 01-02 (Server Hardening): SYNC-01, SYNC-03, SYNC-05 (server handlers, storage, reconnect)
  - 01-03 (Hook Rewrite): SYNC-02, SYNC-04, SYNC-05 (hook API, wake lock, reconnect)
  - 01-04 (Tests): No new requirements — tests validate prior work
- Fix: Add YAML frontmatter blocks to each with `requirements-completed` arrays

**Item 4 — `03-02-SUMMARY.md` lacks `requirements-completed` frontmatter**
- File has YAML frontmatter but is missing `requirements-completed` key
- This plan completed: SONG-03, SONG-04, SONG-05 (visible title/key, scrollable chart, readable font)
- `03-01-SUMMARY.md` already has `requirements-completed: [SONG-01, SONG-02]`
- Fix: Add `requirements-completed: [SONG-03, SONG-04, SONG-05]` to existing frontmatter

#### Category B: Code Fixes (items 5, 7, 8)

**Item 5 — ChordLine.tsx import path**
- Current: `import type { ChordSegment } from "../../client/lib/chord-tokenizer"`
- Correct: `import type { ChordSegment } from "../lib/chord-tokenizer"`
- ChordLine.tsx is at `src/client/components/ChordLine.tsx`
- chord-tokenizer.ts is at `src/client/lib/chord-tokenizer.ts`
- The `../../client/lib/` path works because it traverses up to `src/` then back into `client/lib/`, but `../lib/` is the canonical relative path from `components/` to `lib/`
- Fix: Single import path change. Type-only import, so no runtime behavior change.

**Item 7 — TypeScript errors in SessionScreen.test.tsx**
- 3 errors found by `tsc --noEmit` (tests pass at runtime via Vitest):
  - Line 233: `leaderDisconnected: { graceSeconds: 30 }` — type `{ graceSeconds: number }` not assignable to type `null`
  - Line 244: Same issue, same field
  - Line 316: `leaderId: "conn-1"` — type `string` not assignable to type `null`
- Root cause: `defaultMockReturn` defines `leaderDisconnected: null` and `sessionState.leaderId: null`. TypeScript infers these as literal type `null`. When tests spread `...defaultMockReturn` and override with a non-null value, the inferred type of the object still expects `null` for those fields.
- Fix: Add explicit type annotation to `defaultMockReturn` so TypeScript knows the full union type. Either:
  - Type the `defaultMockReturn` object with the hook's return type (e.g., `Partial<UseDeadSyncReturn>` or a custom test type)
  - Or use `as` assertions on the specific override values: `leaderDisconnected: { graceSeconds: 30 } as LeaderDisconnectedInfo | null`
  - Or annotate `defaultMockReturn` with the return type of `useDeadSync`
- Recommended approach: Add a type annotation to `defaultMockReturn` using the hook's `UseDeadSyncReturn` type (or the equivalent interface). This is the cleanest fix — it makes the mock match the real type contract.

**Item 8 — Dead exports in chord-tokenizer.ts**
- `tokenizeLine` and `isAnnotation` are exported but only consumed in `chord-tokenizer.test.ts`
- `tokenizeChart` is the only export used by production code (`ChordChart.tsx`)
- `isAnnotation` is also called internally by `tokenizeLine`
- Options:
  - (a) Remove `export` keyword from `tokenizeLine` and `isAnnotation` — tests can still import them if the test file uses the same module
  - (b) Keep exports, accept that test-only exports are a valid pattern
  - Actually: Vitest test files CAN import non-exported functions only if they use workarounds. The standard pattern is to keep exports for testability.
- Recommended approach: Keep the exports. The audit called these "dead exports for production code" but they serve a clear purpose — unit testing individual functions. Add a `// @internal — exported for testing` JSDoc comment to document intent. This is not actually dead code, it's test infrastructure.

#### Category C: Cannot-Fix-With-Code Items (items 3, 6)

**Item 3 — Hibernation + storage sharding not tested against actual Cloudflare deploy**
- Local `partykit dev` does not hibernate — this is a known platform limitation
- The code is implemented and tested locally (storage sharding, hibernation options set)
- A real Cloudflare deploy is the only way to verify hibernation behavior
- This is not a code change — it requires deploying to Cloudflare and running manual tests
- Recommendation: Document as "deferred to production deploy" in the phase summary. Cannot be resolved in this tech debt phase unless we deploy.

**Item 6 — 4 human verification items pending (Phase 5)**
- Slide animation, pulse effect, instant snap-back, real PartyKit presence
- Already documented in `05-VERIFICATION.md` under "Human Verification Required"
- These require two browser tabs connected to a running PartyKit session
- Cannot be automated — they are visual/timing checks by design
- Recommendation: Document as "requires manual smoke test" and leave in the audit as acknowledged. These don't block v1.0 functionality.

## Common Pitfalls

### Pitfall 1: Breaking Existing Tests While Fixing TypeScript Errors
**What goes wrong:** Fixing `tsc --noEmit` errors by changing mock types can break test assertions if the type changes affect mock behavior.
**Why it happens:** Mock objects are untyped or loosely typed; tightening types can surface other issues.
**How to avoid:** Run both `tsc --noEmit` and `vitest run` after every change. The goal is zero TS errors AND 208 tests passing.
**Warning signs:** Tests that previously passed start failing after type annotation changes.

### Pitfall 2: Over-Refactoring Phase 1 Documentation
**What goes wrong:** Trying to rewrite Phase 1 SUMMARY files to match the full modern format instead of just adding the missing frontmatter.
**Why it happens:** The freeform format looks incomplete compared to later phases.
**How to avoid:** Only add the `requirements-completed` frontmatter field. Do not restructure the prose content — it accurately reflects what was built.

### Pitfall 3: Removing Test-Only Exports
**What goes wrong:** Removing `export` from `tokenizeLine` and `isAnnotation` breaks the test file imports.
**Why it happens:** The audit called them "dead exports" which implies they should be removed.
**How to avoid:** These are not dead — they are consumed by tests. Add a comment documenting intent instead of removing them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript type for mock | Custom interface duplicating hook return | Import `UseDeadSyncReturn` from use-deadsync.ts (or derive from its return type) | Keeps mock in sync with real type |

## Code Examples

### Fix: TypeScript Mock Type Annotation

The `defaultMockReturn` needs a type annotation so spread-and-override works:

```typescript
// Option A: Import and use the hook's return type
import type { UseDeadSyncReturn } from "../use-deadsync";

const defaultMockReturn: UseDeadSyncReturn = {
  connected: true,
  // ... all fields with correct union types
};
```

```typescript
// Option B: Satisfies operator (TypeScript 4.9+)
const defaultMockReturn = {
  // ... fields
  leaderDisconnected: null as LeaderDisconnectedInfo | null,
  sessionState: {
    // ...
    leaderId: null as string | null,
  },
  // ...
} satisfies UseDeadSyncReturn;
```

Note: The hook return type must be verified — check if `UseDeadSyncReturn` is exported from `use-deadsync.ts`. If not, either export it or use inline type widening with `as` casts on the `null` fields.

### Fix: ChordLine Import Path

```typescript
// Before (works but wrong traversal)
import type { ChordSegment } from "../../client/lib/chord-tokenizer";

// After (canonical path from components/ to lib/)
import type { ChordSegment } from "../lib/chord-tokenizer";
```

### Fix: Document Test-Only Exports

```typescript
/** @internal Exported for unit testing — production code uses tokenizeChart */
export function tokenizeLine(line: string): ParsedLine {
```

```typescript
/** @internal Exported for unit testing — called internally by tokenizeLine */
export function isAnnotation(line: string): boolean {
```

### Fix: SUMMARY Frontmatter

For Phase 1 SUMMARY files, prepend YAML frontmatter:

```yaml
---
phase: 01-sync-layer-hardening
plan: "02"
requirements-completed: [SYNC-01, SYNC-03, SYNC-05]
---
```

For `03-02-SUMMARY.md`, add to existing frontmatter:

```yaml
requirements-completed: [SONG-03, SONG-04, SONG-05]
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest, with jsdom environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~2.4 seconds |

### Phase Requirements to Test Map

This phase has no requirement IDs — it is a tech debt cleanup. Validation is:

| Tech Debt Item | Behavior to Verify | Test Type | Automated Command |
|----------------|--------------------|-----------|--------------------|
| Item 5 (import path) | ChordLine import resolves correctly | build | `npx tsc --noEmit` |
| Item 7 (TS errors) | Zero TypeScript errors in SessionScreen.test.tsx | typecheck | `npx tsc --noEmit` |
| Item 7 (TS errors) | All 208 tests still pass | unit | `npx vitest run` |
| Item 8 (dead exports) | Comments added, exports preserved | manual | Review chord-tokenizer.ts |
| Items 1-2, 4 (docs) | Frontmatter present in SUMMARY files | manual | Review .planning files |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task, run: `npx vitest run && npx tsc --noEmit`
- **Full suite trigger:** Before final task commit
- **Phase-complete gate:** `tsc --noEmit` exits 0 AND `vitest run` shows 208 tests passing
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new test files needed.

## Open Questions

1. **Should Phase 1 SUMMARY files get full YAML frontmatter or just the missing field?**
   - What we know: Phase 1 SUMMARYs use freeform markdown with no YAML block at all. Later phases use structured YAML frontmatter with many fields.
   - What's unclear: Whether we should add full structured frontmatter (matching the later format) or minimal frontmatter (just `requirements-completed`).
   - Recommendation: Add minimal YAML frontmatter with `phase`, `plan`, and `requirements-completed`. Don't try to backfill all the fields that later phases have — it's unnecessary work and the freeform content is accurate.

2. **Is `UseDeadSyncReturn` exported from use-deadsync.ts?**
   - What we know: The hook returns an object with `leaderDisconnected: LeaderDisconnectedInfo | null` and `sessionState` containing `leaderId: string | null`.
   - What's unclear: Whether the return type interface is exported by name.
   - Recommendation: Check at implementation time. If not exported, either export it or use inline `as` casts on the null-typed fields in the mock.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: All 10 tech debt items verified by reading actual source files
- `tsc --noEmit` output: Confirmed exactly 3 TypeScript errors (lines 233, 244, 316 — note line 316 differs from audit's "line 284")
- `vitest run` output: Confirmed 208 tests passing across 16 files
- `.planning/` documentation files: Read all SUMMARY and VERIFICATION files referenced in the audit

### Notes on Audit Accuracy
- The audit reports TS errors at "lines 233, 244, 284" but actual `tsc --noEmit` shows errors at lines 233, 244, 316. Line 284 appears to be a stale reference — the code may have shifted since the audit was written. The actual errors are the same type (literal null inference) but the third one is `leaderId` not `leaderDisconnected`.

## Metadata

**Confidence breakdown:**
- Documentation fixes: HIGH — straightforward additions, format established by later phases
- Import path fix: HIGH — single line change, verified correct path
- TypeScript fix: HIGH — root cause identified, standard TypeScript pattern
- Dead exports: HIGH — decision is clear (keep exports, add comments)
- Cannot-fix items: HIGH — correctly identified as out-of-scope for code changes

**Research date:** 2026-02-25
**Valid until:** No expiry — tech debt items are static facts about the codebase
