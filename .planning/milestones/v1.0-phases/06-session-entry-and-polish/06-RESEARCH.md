# Phase 6: Session Entry and Polish - Research

**Researched:** 2026-02-25
**Domain:** QR code generation, URL-based session joining, client-server session code integration
**Confidence:** HIGH

## Summary

Phase 6 closes the last 3 requirements blocking the v1.0 milestone. The server already generates Dead song session codes (`generateSessionCode()` in `protocol.ts`) and exposes `sessionCode` via the HTTP `onRequest` endpoint. The gap is entirely on the client side: no component fetches or displays the session code as a QR code, and no URL-based join flow exists for scanning.

The work decomposes cleanly into three pieces: (1) a QR code display component for the leader, (2) URL parameter parsing in `App.tsx` so a scanned QR link auto-fills the join screen, and (3) wiring the server-generated session code into the leader's UI. The `qrcode.react` library handles QR rendering with zero configuration. The URL join flow is vanilla `URLSearchParams` — no router needed.

**Primary recommendation:** Use `qrcode.react` (QRCodeSVG) for QR generation. Encode a URL like `https://{host}/?code={sessionCode}` into the QR. On load, parse `?code=` from the URL and pre-fill the JoinScreen. No QR *scanning* library is needed — the phone's native camera handles that.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JOIN-04 | User can scan a QR code to join a session | QR encodes a URL with `?code=` param. Phone camera opens Safari, `App.tsx` reads the param and pre-fills JoinScreen. No JS QR scanner needed. |
| SESS-01 | Leader can display a QR code that others scan to join | `qrcode.react` QRCodeSVG renders the join URL. Displayed in a modal/panel on the leader's SessionScreen. Session code comes from `sessionState.sessionCode`. |
| SESS-02 | Session codes use Dead song names (e.g., scarlet-042, ripple-817) | Already implemented server-side in `generateSessionCode()` with 16 Dead song words. Client receives it via `sessionState.sessionCode` after join. No new work needed for generation — only display. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| qrcode.react | ^4.2.0 | QR code SVG rendering | Most popular React QR library (High reputation in Context7). Pure SVG output, zero dependencies, works in jsdom for tests. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | No additional libraries needed. URL parsing is native `URLSearchParams`. QR scanning is the phone camera. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| qrcode.react | react-qr-code | Similar API, slightly less popular. qrcode.react has better SVG support and image embedding if we want a logo later. |
| qrcode.react | snap-qr | Newer (Oct 2025), hook-based. Less battle-tested. |
| URL params for join | Client-side QR scanner (html5-qrcode) | Unnecessary complexity. Phone cameras already decode QR to URLs natively. Adding a JS scanner means camera permissions, canvas rendering, and a scanning UI — all for zero UX benefit since the native camera flow is what users expect. |

**Installation:**
```bash
npm install qrcode.react
```

## Architecture Patterns

### Recommended Project Structure
```
src/client/
├── components/
│   ├── QRCodePanel.tsx       # QR display for leader (new)
│   └── SessionScreen.tsx     # Wire QR panel into leader view (modify)
├── App.tsx                   # Parse ?code= URL param on load (modify)
└── ...existing files...
```

### Pattern 1: URL-Based QR Join Flow
**What:** The QR code encodes a full URL with the session code as a query parameter. When scanned, the phone opens Safari, the app loads, reads the param, and pre-fills the join screen.
**When to use:** Always — this is the entire QR join flow.
**Example:**
```typescript
// In App.tsx — read ?code= param on mount
function getCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

// In QRCodePanel.tsx — construct the URL to encode
const joinURL = `${window.location.origin}/?code=${sessionCode}`;
```

### Pattern 2: QRCodeSVG with Theme Colors
**What:** Render the QR code with colors matching the app's warm-dark theme. Dark background with gold/cream foreground for on-brand appearance.
**When to use:** QR display component.
**Example:**
```typescript
// Source: Context7 /zpao/qrcode.react
import { QRCodeSVG } from "qrcode.react";

<QRCodeSVG
  value={joinURL}
  size={200}
  level="M"
  bgColor="#1a1410"   // surface color
  fgColor="#f5f0e8"   // text-primary (cream)
  marginSize={2}
/>
```

### Pattern 3: Session Code Display from Server State
**What:** The server generates the session code on room start. The client receives it in `sessionState.sessionCode` after joining. The leader displays it alongside the QR code.
**When to use:** Any time the session code needs to be shown.
**Example:**
```typescript
// sessionState.sessionCode is already populated after join
const { sessionState } = useDeadSync({ host, room });
const sessionCode = sessionState?.sessionCode; // e.g., "scarlet-042"
```

### Anti-Patterns to Avoid
- **Client-side QR scanning library:** Do not add html5-qrcode, jsQR, or similar. Phone cameras handle QR natively. Adding a scanner creates a camera permission prompt, a viewfinder UI, and debugging headaches on iOS Safari — all for zero improvement over the native flow.
- **Generating session codes on the client:** The server already does this. Do not duplicate `generateSessionCode()` on the client side.
- **Using the room ID as the session code in the QR:** The session code (e.g., `scarlet-042`) IS the room ID already. The JoinScreen passes `code` as the `room` to `useDeadSync`. The QR URL must use the same value the user would type — which is the session code displayed in the SessionScreen header.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code rendering | Custom QR matrix generator | `qrcode.react` QRCodeSVG | QR encoding has error correction, masking, and version selection. Thousands of edge cases. |
| QR code scanning | JS camera-based scanner | Native phone camera | iOS Safari, Android Chrome all decode QR codes natively from the camera app. The scanned URL opens the browser automatically. |
| URL routing | React Router or custom router | `URLSearchParams` + state | The app has exactly one route. A router adds 30KB+ for a single `?code=` param read. |

**Key insight:** The heaviest lift in this phase (QR scanning) is handled entirely by the phone's native camera. There is no scanning code to write. The QR code just encodes a URL.

## Common Pitfalls

### Pitfall 1: QR Colors Must Have Sufficient Contrast
**What goes wrong:** QR codes with low contrast between foreground and background fail to scan reliably, especially on phone cameras in dim venues (stage lighting).
**Why it happens:** Themed QR codes (dark bg, colored fg) reduce contrast below what phone cameras need.
**How to avoid:** Use high-contrast colors. Cream (#f5f0e8) on dark (#1a1410) works well. Test with phone camera before shipping. Consider offering a "high contrast" white-on-black fallback.
**Warning signs:** QR fails to scan under stage lights or at an angle.

### Pitfall 2: QR Code Size Too Small for Camera Distance
**What goes wrong:** QR displayed on an iPad needs to be scannable from 2-3 feet away by another musician holding their phone.
**Why it happens:** Default 128px is too small for cross-room scanning.
**How to avoid:** Use at least 200px, ideally 240-280px. The QR panel should be a modal or dedicated area, not crammed into a header.
**Warning signs:** Musicians have to hold their phone right up to the iPad screen.

### Pitfall 3: URL Pre-fill Without Clearing the Search Param
**What goes wrong:** After joining via `?code=scarlet-042`, the URL still contains the param. If the user refreshes, they get a stale pre-fill.
**Why it happens:** Nobody cleans up the URL after reading the param.
**How to avoid:** After reading the `?code=` param, use `history.replaceState` to clean the URL: `window.history.replaceState({}, '', window.location.pathname)`.
**Warning signs:** Refresh after joining shows pre-filled code from a previous session.

### Pitfall 4: Session Code vs Room ID Confusion
**What goes wrong:** The QR URL uses a different identifier than what the JoinScreen expects, so scanning doesn't actually join the right room.
**Why it happens:** Confusion between `sessionCode` (server-generated, e.g., `scarlet-042`) and `room.id` (PartyKit room identifier).
**How to avoid:** In this codebase they are the same thing. The user types a code (e.g., `scarlet-042`) in the JoinScreen, which becomes the `room` param for PartySocket. The server generates a `sessionCode` on first start and stores it — but the room ID in PartyKit is whatever the first connector used. The leader creates the room by joining with their code. The QR must encode the same code the leader typed to create the session, which is `code` from the JoinScreen props passed down to SessionScreen.
**Warning signs:** QR joins a different (empty) room than the leader's session.

### Pitfall 5: QR Code Panel Blocks Stage View
**What goes wrong:** The QR panel covers the chord chart, making the leader unable to see their music while sharing the code.
**Why it happens:** Modal overlay without dismiss, or QR embedded inline taking up chord chart space.
**How to avoid:** Use a dismissible modal/sheet. The leader opens it when inviting musicians, then closes it to see their chart again. Consider a small "Share" button in the header that opens the QR panel.
**Warning signs:** Leader has to choose between showing QR and seeing their chord chart.

## Code Examples

### QRCodePanel Component
```typescript
// Source: qrcode.react official docs + project conventions
import { QRCodeSVG } from "qrcode.react";

interface QRCodePanelProps {
  sessionCode: string;
  onClose: () => void;
}

export function QRCodePanel({ sessionCode, onClose }: QRCodePanelProps) {
  const joinURL = `${window.location.origin}/?code=${sessionCode}`;

  return (
    <div className="fixed inset-0 z-50 bg-surface/90 flex items-center justify-center">
      <div className="bg-surface-raised rounded-2xl p-8 text-center max-w-sm mx-4">
        <h2 className="text-xl font-bold text-accent-gold mb-2">
          Join this session
        </h2>
        <p className="text-text-secondary text-lg mb-6 font-mono">
          {sessionCode}
        </p>
        <div className="inline-block p-4 bg-surface rounded-xl">
          <QRCodeSVG
            value={joinURL}
            size={240}
            level="M"
            bgColor="#1a1410"
            fgColor="#f5f0e8"
            marginSize={2}
          />
        </div>
        <p className="mt-4 text-text-muted text-sm">
          Scan with your phone camera
        </p>
        <button
          onClick={onClose}
          className="mt-6 min-h-[44px] px-8 rounded-lg bg-interactive text-surface font-bold text-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
```

### URL Parameter Reading in App.tsx
```typescript
function getCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    // Clean up URL so refresh doesn't re-trigger
    window.history.replaceState({}, "", window.location.pathname);
  }
  return code;
}

// In App component:
const [initialCode] = useState(() => getCodeFromURL());
// Pass initialCode to JoinScreen to pre-fill the session code field
```

### JoinScreen Pre-fill
```typescript
// JoinScreen already accepts code as local state.
// Add an optional initialCode prop:
interface JoinScreenProps {
  onJoin: (name: string, role: UserRole, code: string) => void;
  initialCode?: string;
}

// In the component, initialize code state from prop:
const [code, setCode] = useState(initialCode ?? "");
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS QR scanner libraries | Native phone camera QR | ~2019+ (iOS 11, Android 9) | No need for client-side QR scanning code. All modern phones decode QR from the camera app. |
| QR code as Canvas | QR code as SVG (QRCodeSVG) | qrcode.react 3.x+ (2023) | SVG renders crisply at any size, can be styled with CSS, passes through SVG props. Canvas requires ref gymnastics. |

**Deprecated/outdated:**
- `includeMargin` prop on qrcode.react: Deprecated in favor of `marginSize` (number of modules).

## Open Questions

1. **Session code vs. room ID identity**
   - What we know: The JoinScreen takes user input as `code`, passes it as `room` to PartySocket. The server generates `sessionCode` via `generateSessionCode()` and stores it in state. These are technically separate values — the room ID is the PartyKit room name, while `sessionCode` is stored metadata.
   - What's unclear: When the leader creates a new session, what is the room ID? If the leader types "my-jam" as the code, the room ID is "my-jam" but `sessionCode` will be something like "ripple-817". The QR should probably encode the room name (what the user typed), not the server-generated session code, since that's what other users need to type to join.
   - Recommendation: The QR URL should use `code` (the value the leader typed to create the room), which is available as a prop on SessionScreen. The `sessionCode` displayed in the header is already `code`. The server-generated `sessionCode` in `sessionState.sessionCode` is cosmetic metadata. **Use the `code` prop from SessionScreen, not `sessionState.sessionCode`.** This is the value that actually routes to the correct PartyKit room.

2. **Leader-only QR display trigger**
   - What we know: SESS-01 says "Leader can display a QR code." This implies only the leader sees the share button.
   - What's unclear: Should followers also be able to share? Requirements say leader only.
   - Recommendation: Show the QR/share button only for the leader (`isLeader` check). Keeps the UI clean for followers.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config file | `/vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |
| Estimated runtime | ~3 seconds (191 existing tests) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JOIN-04 | Scanning QR opens app with pre-filled code | unit | `npx vitest run src/client/__tests__/App.test.tsx -t "URL param"` | No — Wave 0 gap |
| SESS-01 | Leader sees QR code panel with session URL | unit | `npx vitest run src/client/__tests__/QRCodePanel.test.tsx` | No — Wave 0 gap |
| SESS-02 | Session codes use Dead song names | unit | `npx vitest run src/shared/__tests__/protocol.test.ts -t "generateSessionCode"` | Partially — server test verifies generation, but client display not tested |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npx vitest run`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~3 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/client/__tests__/QRCodePanel.test.tsx` -- covers SESS-01 (QR renders with correct URL, session code display, close button)
- [ ] `src/client/__tests__/App.test.tsx` -- covers JOIN-04 (URL param parsing, pre-fill to JoinScreen, URL cleanup after read)
- [ ] No framework install needed -- Vitest + testing-library already configured

## Sources

### Primary (HIGH confidence)
- Context7 `/zpao/qrcode.react` - QRCodeSVG props, version, API surface
- Codebase analysis: `src/shared/protocol.ts` (generateSessionCode, SessionState.sessionCode)
- Codebase analysis: `src/server/deadsync-server.ts` (onStart, onRequest HTTP endpoint)
- Codebase analysis: `src/client/App.tsx`, `SessionScreen.tsx`, `JoinScreen.tsx`, `use-deadsync.ts`

### Secondary (MEDIUM confidence)
- [qrcode.react npm](https://www.npmjs.com/package/qrcode.react) - version, download stats
- [qrcode.react GitHub](https://github.com/zpao/qrcode.react) - README, changelog

### Tertiary (LOW confidence)
- None. All findings verified against codebase and Context7.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - qrcode.react is well-documented, verified via Context7, single dependency
- Architecture: HIGH - URL param join flow is vanilla browser APIs, codebase structure is well understood
- Pitfalls: HIGH - Contrast/size issues are well-known QR concerns, session code identity confirmed via codebase grep

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable domain, no fast-moving dependencies)
