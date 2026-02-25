# Phase 2: App Shell - Research

**Researched:** 2026-02-24
**Domain:** React app shell, Vite entry point, Tailwind v4 dark theme, PartyKit serve config, iPad Safari UX
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single page join screen with all fields visible -- name, role (leader/follower), session code, join button. No multi-step wizard.
- Name field pre-filled from localStorage, editable.
- Branding: "Glory" app name with tagline "soar." visible on join screen.
- Session code field has placeholder hint showing format (e.g., `scarlet-042`).
- Light validation -- error only surfaces after attempting to join, not inline.
- Two theme modes as user preference: warm-dark and pure-black OLED.
- Warm-dark: hint of warm brown/charcoal. Pure-black: true #000 for OLED.
- Preference stored in localStorage, persists across sessions.
- Persistent corner icon to toggle themes, accessible during sessions.
- Chord highlighting colors (gold, blue, purple) used as primary accent colors app-wide.
- Gold as primary interactive accent (buttons, active states, highlights).
- Body text in warm cream/off-white.
- Post-join: connected confirmation screen showing session code, name, role, who's connected.
- No song viewer placeholder -- holding state until Phase 3.
- Presence updates are silent -- no toasts, banners, sounds, or badges.
- Subtle connection indicator (small dot/icon) that changes color on WebSocket drop/reconnect.
- **Zero interruptions during performance.**

### Claude's Discretion
- Session code display prominence on the connected screen (leader showing others how to join)
- Role selection UX (toggle, cards, buttons -- whatever fits the single-page layout best)
- Exact icon for theme toggle
- Layout and spacing of the join form
- Connected screen layout and information hierarchy

### Deferred Ideas (OUT OF SCOPE)
- None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHELL-01 | User can load the app via Vite entry point (index.html, main.tsx, App.tsx) | Vite + PartyKit serve block config, React 19 createRoot pattern |
| SHELL-02 | App renders with dark, stage-friendly theme using Tailwind v4 | Tailwind v4 CSS-first config, @theme directive for custom colors, dark mode via class strategy |
| SHELL-03 | App is usable on iPad Safari with 44px minimum tap targets | Touch target sizing, viewport meta tag, Safe Area insets |
| JOIN-01 | User can enter their name on a join screen | React form handling, localStorage for name persistence |
| JOIN-02 | User can choose leader or follower role | UI pattern for binary choice (toggle/cards), maps to UserRole type |
| JOIN-03 | User can enter a session code to join | Connects to useDeadSync hook with host + room parameters |
</phase_requirements>

## Summary

Phase 2 builds the first visible surface of the app: a Vite-bundled React 19 app served through PartyKit, styled with Tailwind CSS v4, that lets a musician enter their name, pick a role, type a session code, and connect to the sync layer. The existing `useDeadSync` hook already handles all WebSocket logic -- this phase wraps it in a loadable UI.

The key technical tasks are: (1) create the Vite entry point (`index.html`, `src/main.tsx`, `src/App.tsx`) and wire it into PartyKit's `serve` block, (2) install and configure Tailwind v4 with custom warm-dark and OLED-black theme tokens, (3) build the join screen form, (4) build a post-join connected screen, and (5) ensure all of it works on iPad Safari with proper touch targets. React and partysocket need version upgrades as noted in STATE.md pending todos.

**Primary recommendation:** Start with infrastructure (Vite entry point + PartyKit serve + Tailwind v4 + React 19 upgrade), then build the join screen, then the connected screen. Keep it simple -- no routing library needed, just conditional rendering based on connection state.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.0.0 | UI framework | Project decision (upgrade from 18). React 19 is stable, simplifies ref forwarding. |
| react-dom | ^19.0.0 | DOM rendering | Paired with React 19 |
| tailwindcss | ^4.1.0 | Utility-first CSS | Project decision (Tailwind v4). CSS-first config via `@theme`, no JS config file. |
| @tailwindcss/vite | ^4.1.0 | Vite plugin for Tailwind v4 | Required for Tailwind v4 + Vite integration |
| vite | ^5.0.0 (existing) | Bundler | Already in devDependencies |
| @vitejs/plugin-react | ^4.2.0 (existing) | React Fast Refresh for Vite | Already in devDependencies |
| partysocket | ^1.1.16 | PartyKit WebSocket client | Project decision (upgrade from 1.0.1) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | ^19.0.0 | TypeScript types for React 19 | Development -- must match React 19 |
| @types/react-dom | ^19.0.0 | TypeScript types for ReactDOM 19 | Development -- must match React 19 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Conditional rendering for screens | React Router | Overkill for 2 screens. No URL-based routing needed. Add if Phase 3+ requires it. |
| Tailwind v4 @theme | CSS variables + hand-rolled classes | @theme gives us Tailwind utility classes for custom colors automatically |
| PartyKit serve block | Separate Vite dev server + proxy | PartyKit serve is simpler, single port, same-origin WebSocket. No CORS hassle. |

**Installation:**
```bash
npm install react@^19 react-dom@^19 partysocket@^1.1 tailwindcss@^4.1 @tailwindcss/vite@^4.1
npm install -D @types/react@^19 @types/react-dom@^19
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── client/
│   ├── App.tsx              # Root component, screen routing
│   ├── main.tsx             # Vite entry: createRoot + render
│   ├── app.css              # Tailwind imports + @theme tokens
│   ├── components/
│   │   ├── JoinScreen.tsx   # Name, role, code, join button
│   │   └── SessionScreen.tsx # Post-join connected state
│   ├── use-deadsync.ts      # (existing) React hook
│   └── wake-lock.ts         # (existing) Wake Lock utility
├── server/
│   └── deadsync-server.ts   # (existing) PartyKit server
├── shared/
│   ├── protocol.ts          # (existing) Message types
│   └── default-setlist.ts   # (existing) Demo data
index.html                   # Vite HTML entry (project root)
```

### Pattern 1: PartyKit Serve Block for Vite
**What:** PartyKit can serve static assets and run a build command. For Vite, configure `serve` in `partykit.json` to point at the Vite output directory with a build command.
**When to use:** Always -- this is how the app gets served in both dev and deploy modes.

PartyKit's `serve.build` runs the specified command before serving. For development, `partykit dev` runs the build and serves the output. The reference project used this pattern:

```jsonc
// partykit.json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "deadsync",
  "main": "src/server/deadsync-server.ts",
  "port": 1977,
  "compatibilityDate": "2026-02-24",
  "serve": {
    "path": "dist",
    "build": "npx vite build",
    "singlePageApp": true
  }
}
```

**Important:** `singlePageApp: true` ensures all non-file requests fall through to `index.html`, which is required if we ever add client-side routing. Good to set it now.

### Pattern 2: Vite Config for PartyKit Projects
**What:** Vite config that outputs to `dist/` and handles React JSX.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
});
```

**Note:** The existing `vitest.config.ts` only has test config. Create a separate `vite.config.ts` for the build. Vitest will still find its own config file.

### Pattern 3: React 19 Entry Point with createRoot
**What:** Standard React 19 app bootstrapping pattern.

```typescript
// src/client/main.tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./app.css";

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
```

### Pattern 4: Tailwind v4 CSS-first Theme Configuration
**What:** Tailwind v4 replaces `tailwind.config.js` with CSS-first configuration using `@theme` blocks. Custom colors become utility classes automatically.

```css
/* src/client/app.css */
@import "tailwindcss";

/* Class-based dark mode (not media query) */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Warm-dark palette (manzanita brand) */
  --color-surface: #1a1410;
  --color-surface-raised: #241e18;
  --color-text-primary: #f5f0e8;
  --color-text-secondary: #a89e8c;

  /* OLED overrides applied via .oled class */
  --color-accent-gold: #d4a843;
  --color-accent-blue: #5b8fb9;
  --color-accent-purple: #9b72b0;

  /* Interactive */
  --color-interactive: var(--color-accent-gold);
  --color-interactive-hover: #e0b94f;
}
```

**Key insight:** With Tailwind v4, `bg-surface`, `text-primary`, `text-accent-gold` all become usable utilities from the `@theme` block. No JS config file needed.

### Pattern 5: Screen State Management Without a Router
**What:** Simple conditional rendering based on connection state from `useDeadSync`.

```typescript
// src/client/App.tsx
function App() {
  const [joined, setJoined] = useState(false);
  const [joinConfig, setJoinConfig] = useState<JoinConfig | null>(null);
  // Only create the hook connection after user submits join form
  // ...
  if (!joined) return <JoinScreen onJoin={handleJoin} />;
  return <SessionScreen /* ...pass hook state */ />;
}
```

**Design consideration:** The `useDeadSync` hook creates a WebSocket on mount. We should only instantiate it after the user submits the join form, not on app load. Either conditionally render a component that uses the hook, or restructure the hook to accept a `ready` flag. The cleaner pattern is a wrapper component that only mounts when joined.

### Pattern 6: Theme Toggle with localStorage
**What:** Two dark themes (warm-dark and OLED-black) controlled by a class on `<html>`.

```typescript
// Theme is "warm-dark" | "oled-black"
// Both are dark themes -- there's no light mode
type Theme = "warm-dark" | "oled-black";

function getTheme(): Theme {
  return (localStorage.getItem("glory-theme") as Theme) || "warm-dark";
}

function applyTheme(theme: Theme) {
  localStorage.setItem("glory-theme", theme);
  const html = document.documentElement;
  html.classList.add("dark"); // always dark
  html.classList.toggle("oled", theme === "oled-black");
}
```

Both themes apply `.dark` class (Tailwind dark mode). The OLED variant adds `.oled` class which overrides background colors to `#000`.

### Anti-Patterns to Avoid
- **Creating a Vite dev server alongside PartyKit dev:** PartyKit's `serve` block handles the build. Don't run two dev servers. Use `partykit dev` as the single command.
- **Installing Tailwind v3 patterns:** No `tailwind.config.js`, no `@tailwind base; @tailwind components; @tailwind utilities;`. Tailwind v4 uses `@import "tailwindcss"` and `@theme`.
- **Using media query dark mode:** The user wants explicit theme toggle, not OS preference. Use class-based dark mode with `@custom-variant`.
- **Mounting useDeadSync before join:** The hook creates a WebSocket immediately. Don't mount it until the user has entered their info and tapped join.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS utility framework | Custom CSS classes for spacing/colors | Tailwind v4 | Consistent, documented, huge ecosystem |
| WebSocket reconnection | Custom reconnect logic | partysocket (existing) | Already handles exponential backoff, max retries |
| Screen wake prevention | Custom visibility listener | wake-lock.ts (existing) | Already built in Phase 1, handles re-acquisition |
| Session code generation | Random string builder | protocol.ts `generateSessionCode()` | Already exists, uses Dead song names |

**Key insight:** Most of the hard infrastructure (sync hook, wake lock, protocol, reconnection) already exists from Phase 1. This phase is primarily about creating UI that connects to existing code.

## Common Pitfalls

### Pitfall 1: PartyKit Host Resolution in Dev vs Deploy
**What goes wrong:** `useDeadSync` requires a `host` parameter. Hardcoding `localhost:1977` breaks in production.
**Why it happens:** PartyKit dev and deploy use different hosts.
**How to avoid:** When served by PartyKit's own serve block, the client is same-origin with the server. Use `window.location.host` as the host parameter. For local dev this resolves to `localhost:1977`, for deploy it resolves to `deadsync.username.partykit.dev`.
**Warning signs:** WebSocket connection fails after deploy but works locally.

### Pitfall 2: React 19 Type Incompatibility
**What goes wrong:** `@types/react@18` and `react@19` cause type errors, especially around `ref` props and `ReactNode` types.
**Why it happens:** React 19 changed some type signatures. `ReactNode` no longer includes `{}`, `forwardRef` is deprecated in favor of ref-as-prop.
**How to avoid:** Upgrade `@types/react` and `@types/react-dom` to `^19.0.0` at the same time as React. Run `npx types-react-codemod@latest preset-19 ./src` if type errors appear in existing code.
**Warning signs:** TypeScript errors mentioning `ReactNode`, `forwardRef`, or `ref` incompatibility.

### Pitfall 3: Tailwind v4 Config Migration
**What goes wrong:** Trying to use a `tailwind.config.js` file with Tailwind v4, or using v3 directive syntax.
**Why it happens:** Tailwind v4 is a major rewrite. CSS-first config replaces JS config. `@tailwind base` becomes `@import "tailwindcss"`.
**How to avoid:** Fresh start -- no config file migration needed since this is a new UI. Just use `@import "tailwindcss"` and `@theme`.
**Warning signs:** "Unknown at rule @tailwind" errors, missing utility classes, config file being ignored.

### Pitfall 4: iPad Safari Viewport and Safe Areas
**What goes wrong:** Content overlaps the notch/home indicator on newer iPads, or the page is zoomable when it shouldn't be.
**Why it happens:** Safari has unique viewport behavior. Missing `viewport-fit=cover` and safe area padding.
**How to avoid:** Set `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and use `env(safe-area-inset-*)` padding on the root container. Tailwind v4 doesn't have safe-area utilities built in, so use custom CSS or arbitrary values like `pb-[env(safe-area-inset-bottom)]`.
**Warning signs:** Content hidden behind home indicator, page zooms on double-tap.

### Pitfall 5: Touch Targets Below 44px
**What goes wrong:** Buttons and inputs are too small to tap reliably, especially with guitar-calloused fingers in dim light.
**Why it happens:** Default HTML inputs and small icon buttons are often 32px or less.
**How to avoid:** Set `min-h-[44px] min-w-[44px]` on ALL interactive elements. Apple's HIG specifies 44pt minimum. Use `p-3` or larger on buttons. The theme toggle icon needs this too.
**Warning signs:** Misclicks on stage, frustrated musicians.

### Pitfall 6: localStorage Errors in Private Browsing
**What goes wrong:** `localStorage.setItem()` throws in Safari private browsing (pre-iOS 11) or when storage is full.
**Why it happens:** Safari used to throw QuotaExceededError in private mode.
**How to avoid:** Wrap localStorage calls in try/catch. Modern Safari (iOS 11+) doesn't throw anymore, but defensive coding is cheap.
**Warning signs:** App crashes on first load for some users.

## Code Examples

### Vite HTML Entry Point
```html
<!-- index.html (project root) -->
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>Glory</title>
</head>
<body class="bg-surface text-text-primary min-h-dvh">
  <div id="root"></div>
  <script type="module" src="/src/client/main.tsx"></script>
</body>
</html>
```

### Join Form with localStorage Persistence
```typescript
// Pattern for name persistence
function JoinScreen({ onJoin }: { onJoin: (name: string, role: UserRole, code: string) => void }) {
  const [name, setName] = useState(() => {
    try { return localStorage.getItem("glory-name") || ""; }
    catch { return ""; }
  });
  const [role, setRole] = useState<UserRole>("follower");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Name and session code are required");
      return;
    }
    try { localStorage.setItem("glory-name", name.trim()); }
    catch { /* swallow */ }
    onJoin(name.trim(), role, code.trim().toLowerCase());
  }
  // ...
}
```

### Conditional Hook Mounting
```typescript
// Only mount useDeadSync after join
function SessionScreen({ name, role, code }: JoinConfig) {
  const { connected, sessionState, myUser, actions } = useDeadSync({
    host: window.location.host,
    room: code,
  });

  // Join on mount
  useEffect(() => {
    actions.join(name, role);
  }, []); // eslint-disable-line -- intentionally once

  // ...render connected state
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (JS config) | @theme in CSS (CSS-first) | Tailwind v4 (Jan 2025) | No config file needed, faster builds, native CSS cascade |
| ReactDOM.render() | createRoot() | React 18 (Mar 2022) | Required for concurrent features |
| forwardRef() | ref as prop | React 19 (Dec 2024) | Simpler component APIs |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind v4 (Jan 2025) | Single import replaces three directives |
| prefers-color-scheme media query | Class-based dark mode with @custom-variant | Tailwind v4 | Explicit user control instead of OS setting |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Replaced by CSS `@theme` blocks in v4. A JS config can still be loaded via `@config` for migration, but new projects should use CSS-first.
- `ReactDOM.render()`: Removed in React 19. Must use `createRoot()`.
- `forwardRef()`: Deprecated in React 19. Function components accept `ref` as a regular prop.

## Open Questions

1. **PartyKit dev + Vite HMR integration**
   - What we know: PartyKit serve block runs `npx vite build` and serves from `dist/`. In dev, `partykit dev` watches and rebuilds.
   - What's unclear: Whether Vite HMR (hot module replacement) works through PartyKit dev, or if it requires full page reloads. The reference project used the same pattern.
   - Recommendation: Start with `serve.build: "npx vite build"` pattern from the reference project. If HMR doesn't work through PartyKit dev, live with full reloads for now -- the app is small.

2. **partysocket 1.1.16 API changes from 1.0.1**
   - What we know: The hook uses `PartySocket` with `host` and `room` options. This API has been stable.
   - What's unclear: Whether 1.1.x introduced any breaking changes to constructor options.
   - Recommendation: Upgrade and run existing tests (`npm test`). If tests pass, the API is compatible. LOW risk -- partysocket follows semver.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~3 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | App loads via Vite entry point | smoke (manual) | `npx vite build` (build succeeds = loadable) | N/A -- build command |
| SHELL-02 | Dark theme renders with Tailwind v4 | unit | `npx vitest run src/client/__tests__/theme.test.ts -t "theme"` | No -- Wave 0 gap |
| SHELL-03 | 44px minimum tap targets | manual | Visual inspection on iPad Safari | N/A -- manual |
| JOIN-01 | User can enter name | unit | `npx vitest run src/client/__tests__/JoinScreen.test.tsx` | No -- Wave 0 gap |
| JOIN-02 | User can choose role | unit | `npx vitest run src/client/__tests__/JoinScreen.test.tsx` | No -- Wave 0 gap |
| JOIN-03 | User can enter session code and join | integration | `npx vitest run src/client/__tests__/JoinScreen.test.tsx` | No -- Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/client/__tests__/JoinScreen.test.tsx` -- covers JOIN-01, JOIN-02, JOIN-03
- [ ] `src/client/__tests__/SessionScreen.test.tsx` -- covers post-join connected state rendering
- [ ] `src/client/__tests__/theme.test.ts` -- covers SHELL-02 (theme toggle, localStorage persistence)
- [ ] Install `@testing-library/react` and `@testing-library/user-event` for component tests (RTL already in devDeps, user-event may be needed)

## Sources

### Primary (HIGH confidence)
- Context7 `/tailwindlabs/tailwindcss.com` -- Tailwind v4 installation, @theme, dark mode, custom colors
- Context7 `/websites/react_dev` -- React 19 upgrade guide, createRoot, ref-as-prop
- Context7 `/partykit/partykit` -- serve block configuration, static assets, singlePageApp mode
- Existing codebase: `src/client/use-deadsync.ts`, `src/shared/protocol.ts`, `src/client/wake-lock.ts`, `partykit.json`, `reference/deadsync-extracted/partykit.json`

### Secondary (MEDIUM confidence)
- [Vite Getting Started](https://vite.dev/guide/) -- Vite project setup patterns
- Apple Human Interface Guidelines -- 44pt minimum touch target (well-established standard)

### Tertiary (LOW confidence)
- PartyKit + Vite HMR behavior in dev mode -- could not verify whether HMR works through PartyKit's serve block. The reference project suggests full rebuilds.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via Context7, versions confirmed
- Architecture: HIGH -- patterns follow established Vite + React + Tailwind conventions, PartyKit serve pattern verified from reference project
- Pitfalls: HIGH -- common issues well-documented in official sources
- Validation: MEDIUM -- test patterns are standard RTL, but component tests for theme/form are new

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable stack, unlikely to shift)
