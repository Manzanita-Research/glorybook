// chord-tokenizer.ts
// Pure functions for parsing chord chart strings into typed tokens.
// Used by all rendering components — no side effects, no DOM.

export type LineType =
  | "blank"
  | "box-grid"
  | "section"
  | "annotation"
  | "chord-lyric"
  | "plain";

export interface ChordSegment {
  chord: string;  // chord name, empty string for leading lyric text
  lyric: string;  // lyric text following this chord (or before first chord)
}

export type ParsedLine =
  | { type: "blank"; raw: string }
  | { type: "box-grid"; raw: string }
  | { type: "section"; raw: string }
  | { type: "annotation"; raw: string }
  | { type: "chord-lyric"; raw: string; segments: ChordSegment[] }
  | { type: "plain"; raw: string };

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** True if line starts with | and has at least one more | after the first char */
function isBoxGrid(line: string): boolean {
  return /^\|[^|]*\|/.test(line);
}

/** True if line matches UPPERCASE-COLON pattern (2+ uppercase chars before colon) */
function isSection(line: string): boolean {
  return /^[A-Z][A-Z\s\/\-]+:/.test(line);
}

/** @internal Exported for unit testing — called internally by tokenizeLine */
export function isAnnotation(line: string): boolean {
  if (line.startsWith(">")) return true;
  if (line.includes("→")) return true;
  if (/^\(.*\)$/.test(line.trim())) return true;
  return false;
}

/** True if line contains bracket chord notation */
function hasChords(line: string): boolean {
  return line.includes("[");
}

// ----------------------------------------------------------------
// Chord segment extraction
// ----------------------------------------------------------------

/**
 * Given a chord-lyric line, split into ChordSegment[].
 *
 * Strategy: split the line on /(\[[^\]]+\])/ — capturing the bracket tokens.
 * This produces alternating [text, bracket, text, bracket, ...] parts.
 * Walk through: any text before the first bracket becomes { chord: "", lyric: text }.
 * Each bracket token paired with the next text fragment becomes { chord, lyric }.
 */
function extractSegments(line: string): ChordSegment[] {
  // Split keeping the bracket tokens in the array
  const parts = line.split(/(\[[^\]]+\])/);
  // parts = ["leading text", "[G]", "lyric after G", "[Am]", "more lyric", ...]

  const segments: ChordSegment[] = [];
  let i = 0;

  // First part may be leading lyric text before any chord
  if (parts.length > 0 && !parts[0].startsWith("[")) {
    const leadingText = parts[0];
    if (leadingText) {
      // Don't push yet — attach to first chord if it exists,
      // OR emit as a leading segment with empty chord
      i = 1; // advance past leading text
      // Find the first bracket token
      if (parts[1] && parts[1].startsWith("[")) {
        // Emit leading text as segment with empty chord
        segments.push({ chord: "", lyric: leadingText });
        // Now process from parts[1] onward
      } else {
        // No chord follows — whole line is plain (shouldn't happen here, but be safe)
        segments.push({ chord: "", lyric: leadingText });
        return segments;
      }
    }
  }

  // Walk remaining parts, pairing [bracket] with following text
  while (i < parts.length) {
    const part = parts[i];
    if (part.startsWith("[")) {
      const chord = part.slice(1, -1); // strip [ and ]
      const lyric = parts[i + 1] ?? "";
      segments.push({ chord, lyric });
      i += 2;
    } else {
      // Orphan text (shouldn't happen after initial handling, but be safe)
      if (part) {
        segments.push({ chord: "", lyric: part });
      }
      i += 1;
    }
  }

  return segments;
}

// ----------------------------------------------------------------
// Main functions
// ----------------------------------------------------------------

/**
 * tokenizeLine — classify a single line and extract structured data.
 *
 * Priority order (first match wins):
 * 1. blank      — empty or whitespace only
 * 2. box-grid   — starts with | and has second |
 * 3. section    — uppercase-colon pattern
 * 4. annotation — >, →, or full-paren wrap
 * 5. chord-lyric — contains [ bracket
 * 6. plain      — everything else
 */
/** @internal Exported for unit testing — production code uses tokenizeChart */
export function tokenizeLine(line: string): ParsedLine {
  // 1. Blank
  if (line.trim() === "") {
    return { type: "blank", raw: line };
  }

  // 2. Box-grid
  if (isBoxGrid(line)) {
    return { type: "box-grid", raw: line };
  }

  // 3. Section (must come before chord-lyric — BRIDGE: [D] → [Am] is a section)
  if (isSection(line)) {
    return { type: "section", raw: line };
  }

  // 4. Annotation (must come before chord-lyric — → TRANSITION [A] is annotation)
  if (isAnnotation(line)) {
    return { type: "annotation", raw: line };
  }

  // 5. Chord-lyric
  if (hasChords(line)) {
    const segments = extractSegments(line);
    return { type: "chord-lyric", raw: line, segments };
  }

  // 6. Plain
  return { type: "plain", raw: line };
}

/**
 * tokenizeChart — parse an entire chart string into typed lines.
 * Splits on newline, maps tokenizeLine over each.
 */
export function tokenizeChart(chart: string): ParsedLine[] {
  return chart.split("\n").map(tokenizeLine);
}
