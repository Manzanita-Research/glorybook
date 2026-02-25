# Phase 1: Visual Polish - Research

**Researched:** 2026-02-25
**Domain:** Typography, CSS theming, brand visual identity
**Confidence:** HIGH

## Summary

Phase 1 brings Glory's visual presentation in line with the Manzanita Research brand. The work is entirely CSS/font-level — no new features, no layout changes. The existing codebase uses Tailwind CSS v4 with a well-structured custom theme in `app.css`, React components with inline Tailwind classes, and Vite for bundling.

The primary work involves: (1) loading Fraunces from Google Fonts and Commit Mono self-hosted, (2) applying those fonts to appropriate elements, (3) adding uppercase tracking label patterns to section labels, (4) adding film grain texture to the JoinScreen background, and (5) ensuring consistent use of the gold accent for branding.

**Primary recommendation:** This is a pure CSS/font integration phase. No new dependencies needed — just font loading in `index.html`, `@font-face` + utility classes in `app.css`, and targeted class changes across ~8 components. Two plans: one for font infrastructure + typography, one for texture/label polish.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Typography:** Fraunces as display font for "Glory" branding, song titles, and headings — always with `font-variation-settings: 'WONK' 1, 'SOFT' 100`
- **Typography:** Commit Mono (self-hosted from org/fonts/CommitMono-Variable.woff2) for chord charts and monospace content — with full OpenType features
- **Typography:** Body/UI text stays as system sans-serif — readability under lights > brand purity for small UI labels
- **Label styling:** Section labels use uppercase tracking (`text-xs uppercase tracking-[0.2em]`) consistent with Toneword and www
- **Label styling:** Monospace accent for metadata labels where appropriate
- **Texture:** Film grain overlay on JoinScreen background only (matching www's `.grain` pattern)
- **Texture:** Session screen stays clean — no grain on chord charts
- **Color:** Current warm-dark palette stays. Gold accent for branding moments. Review border/surface contrast.

### Claude's Discretion
- Font loading strategy (Google Fonts CDN for Fraunces, self-hosted for Commit Mono)
- Whether to adjust font sizes or keep current sizing
- Transition/animation refinements if any feel off during implementation
- Whether to add a `::selection` style matching the brand (bark bg, cream text)
- Spacing micro-adjustments for visual balance after font swap

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.1 | Utility-first styling | Already in project, v4 with `@theme` blocks |
| Fraunces | Variable (Google Fonts) | Display typography | Manzanita brand display font |
| Commit Mono | Variable (self-hosted) | Monospace typography | Manzanita custom build |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/vite | 4.2.1 | Vite integration | Already configured |

### Alternatives Considered
None — all decisions are locked by CONTEXT.md. No new dependencies needed.

**Installation:**
```bash
# No npm installs needed — fonts loaded via CSS/HTML
```

## Architecture Patterns

### Font Loading Strategy

**Fraunces (Google Fonts CDN):**
Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1&display=swap" rel="stylesheet" />
```
Source: Verified from Toneword (`toneword/web/index.html` line 28) and www (`www/index.html` line 14).

**Commit Mono (self-hosted):**
Copy `org/fonts/CommitMono-Variable.woff2` from the brand repo to `public/fonts/` in Glory. Add `@font-face` to `app.css`:
```css
@font-face {
  font-family: 'Commit Mono';
  src: url('/fonts/CommitMono-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```
Source: Verified from Toneword (`toneword/web/src/index.css` lines 4-9).

### Tailwind Theme Integration

Add font families to `@theme` block in `app.css`:
```css
@theme {
  /* existing colors... */
  --font-display: 'Fraunces', Georgia, serif;
  --font-mono: 'Commit Mono', monospace;
}
```

Add utility classes for font features:
```css
/* Fraunces variable font — soft wonky display */
.font-display {
  font-variation-settings: 'WONK' 1, 'SOFT' 100;
}

/* Commit Mono — Manzanita custom build OpenType features */
.font-mono {
  font-feature-settings:
    'cv01' 1, 'cv03' 1, 'cv04' 1, 'cv06' 1, 'cv11' 1,
    'ss01' 1, 'ss02' 1, 'ss03' 1, 'ss04' 1, 'ss05' 1;
}
```
Source: Verified from Toneword (`toneword/web/src/index.css` lines 61-70).

### Film Grain Pattern

Two options exist in the codebase:

**Option A — Global overlay (Toneword pattern):** `body::before` with `position: fixed`, affects entire page.

**Option B — Scoped class (www pattern):** `.grain` class with `::after` pseudo-element, only affects elements with the class.

**Recommendation: Option B** — The www `.grain` class pattern is better for Glory because the user wants grain on JoinScreen only, not on Session screen. Use a scoped `.grain` class:

```css
.grain {
  position: relative;
}

.grain::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  pointer-events: none;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  z-index: 1;
}
```
Source: Verified from www (`www/src/index.css` lines 117-132). Using dark-mode blend values since Glory is dark-only.

### Label Styling Pattern

The Manzanita brand uses uppercase-tracked labels for section identifiers. In Toneword: `SOURCE`, `TONE WORDS`, `TONE RECIPES`. In Glory, these apply to labels like "Key:", "Role", "Session code", "Connected", "Setlist".

Pattern: `text-xs uppercase tracking-[0.2em] font-mono`

Components that need label updates:
- **JoinScreen.tsx** — "Your name", "Role", "Session code" labels
- **SongHeader.tsx** — "Key:" label
- **PresenceList.tsx** — "Connected" header (already has `text-xs uppercase tracking-wider`, just needs font-mono)
- **SetlistDrawer.tsx** — "Setlist" header
- **SessionScreen.tsx** — session code display, LEADER badge (already uppercase tracked)

### Selection Style

The www site uses `::selection { background-color: var(--color-bark); color: var(--color-cream); }`. Recommendation: add this to Glory. It's subtle but reinforces brand feel.

```css
::selection {
  background-color: #6b3a2a; /* bark */
  color: #f5f0e8; /* text-primary / cream-ish */
}
```

### Anti-Patterns to Avoid
- **Don't set `opsz` manually on Fraunces** — optical sizing is automatic via the browser
- **Don't use Fraunces for body/UI text** — it's a display font, readability degrades at small sizes
- **Don't apply grain to the session screen** — chord charts need maximum readability under stage lights
- **Don't add Fraunces to `<body>` font stack** — only for display elements (h1, h2, song titles, wordmark)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Film grain texture | Canvas noise generator | SVG feTurbulence in CSS | Proven pattern from www/Toneword, zero JS, GPU-composited |
| Font variation settings | Per-element inline styles | CSS utility class `.font-display` | Consistency, single source of truth |
| OpenType features | Nothing — this is just CSS | `.font-mono` class with `font-feature-settings` | Toneword already has the exact rule |

## Common Pitfalls

### Pitfall 1: FOUT (Flash of Unstyled Text) with Google Fonts
**What goes wrong:** Fraunces loads async, page renders with fallback then shifts
**Why it happens:** Google Fonts CSS is render-blocking by default, but font files load async
**How to avoid:** Use `<link rel="preconnect">` for both domains (already in pattern). `font-display: swap` is included in Google Fonts URL. Accept brief FOUT — it's fine for a stage tool.
**Warning signs:** Large layout shift when fonts load

### Pitfall 2: Commit Mono missing from public directory
**What goes wrong:** `@font-face` src fails silently, falls back to system monospace
**Why it happens:** Font file needs to be copied from brand repo to `public/fonts/`
**How to avoid:** Copy file as first step, verify with dev tools network tab
**Warning signs:** Chord charts rendering in system monospace instead of Commit Mono

### Pitfall 3: Tailwind v4 @theme overrides
**What goes wrong:** Adding `--font-mono` to `@theme` might conflict with Tailwind's default `font-mono` utility
**Why it happens:** Tailwind v4 uses CSS custom properties for theme values
**How to avoid:** This actually works correctly — `--font-mono` in `@theme` overrides the default. `font-mono` utility class will use the custom value.
**Warning signs:** `font-mono` class not applying Commit Mono

### Pitfall 4: Grain z-index blocking interactions
**What goes wrong:** Film grain pseudo-element intercepts clicks/taps
**Why it happens:** Pseudo-element is positioned over content
**How to avoid:** Always include `pointer-events: none` on the grain pseudo-element
**Warning signs:** Form inputs on JoinScreen become unclickable

### Pitfall 5: font-variation-settings not applying to Fraunces
**What goes wrong:** WONK and SOFT axes not activating, font looks generic
**Why it happens:** Variable axes only work when the variable font is loaded with those axes enabled
**How to avoid:** The Google Fonts URL must include `SOFT,WONK` in the family parameter (verified in pattern above)
**Warning signs:** Fraunces rendering without the characteristic wonky, soft feel

## Code Examples

### Component Font Application — Song Title (SongHeader.tsx)
```tsx
// Before:
<h2 className="text-2xl font-bold text-text-primary truncate">

// After:
<h2 className="text-2xl font-bold text-text-primary truncate font-display">
```

### Component Font Application — Chord Chart (ChordChart.tsx)
```tsx
// Before (already has font-mono):
className={`flex-1 overflow-y-auto px-4 py-4 font-mono text-xl...`}

// After — no change needed, font-mono will pick up Commit Mono from @theme
```

### Label Styling — Section Labels
```tsx
// Before:
<label className="block text-sm text-text-secondary">Your name</label>

// After:
<label className="block text-xs uppercase tracking-[0.2em] text-text-secondary font-mono">Your name</label>
```

### Glory Wordmark — JoinScreen
```tsx
// Before:
<h1 className="text-4xl font-bold text-accent-gold tracking-tight">Glory</h1>

// After:
<h1 className="text-4xl font-light text-accent-gold tracking-tight font-display">Glory</h1>
```
Note: Using `font-light` for the editorial weight, matching www's Hero approach.

### Grain on JoinScreen
```tsx
// Before:
<div className="min-h-dvh bg-surface text-text-primary safe-area-padding flex items-center justify-center px-4">

// After:
<div className="min-h-dvh bg-surface text-text-primary safe-area-padding flex items-center justify-center px-4 grain">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 config.js | Tailwind v4 @theme CSS | 2025 | Theme tokens are CSS custom properties, no config file needed |
| Google Fonts link tag (static) | Google Fonts with variable axes | Current | Single request, all weights/styles |

## Open Questions

1. **Font file location for Commit Mono**
   - What we know: Brand repo has it at `org/fonts/CommitMono-Variable.woff2`. Toneword copies it to `public/fonts/`.
   - What's unclear: Whether to copy the file into the Glory repo or symlink it
   - Recommendation: Copy it to `public/fonts/CommitMono-Variable.woff2` — simpler, no cross-repo dependency at runtime

2. **OLED theme grain interaction**
   - What we know: Glory has an `.oled` theme with true black backgrounds. Grain uses `mix-blend-mode: soft-light`.
   - What's unclear: Whether grain looks good on pure black (#000000)
   - Recommendation: On OLED theme, grain opacity may need slight adjustment. Test during implementation, tweak if needed.

## Sources

### Primary (HIGH confidence)
- Toneword codebase (`toneword/web/src/index.css`) — verified font loading, grain pattern, font feature settings
- www codebase (`www/src/index.css`, `www/index.html`) — verified grain class pattern, selection styles, Fraunces loading
- Brand repo (`brand/org/fonts/`) — verified Commit Mono font file exists
- Glory codebase (`src/client/app.css`, components) — verified current styling approach

### Secondary (MEDIUM confidence)
- CLAUDE.md org instructions — brand voice, visual direction, font specifications

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, just CSS/fonts
- Architecture: HIGH — verified patterns from two sibling Manzanita projects
- Pitfalls: HIGH — all identified from direct codebase inspection

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable — CSS/font patterns don't change quickly)
