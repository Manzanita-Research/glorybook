import { describe, it, expect } from "vitest";
import {
  tokenizeLine,
  tokenizeChart,
  type ParsedLine,
  type ChordSegment,
  type LineType,
} from "../lib/chord-tokenizer";

// ------------------------------------------------------------
// tokenizeLine — blank lines
// ------------------------------------------------------------

describe("tokenizeLine — blank", () => {
  it("classifies empty string as blank", () => {
    const result = tokenizeLine("");
    expect(result.type).toBe("blank");
    expect(result.raw).toBe("");
  });

  it("classifies whitespace-only line as blank", () => {
    const result = tokenizeLine("   ");
    expect(result.type).toBe("blank");
  });
});

// ------------------------------------------------------------
// tokenizeLine — box-grid
// ------------------------------------------------------------

describe("tokenizeLine — box-grid", () => {
  it("classifies pipe-table line as box-grid", () => {
    const line = "|G   |C   |D   |%   |";
    const result = tokenizeLine(line);
    expect(result.type).toBe("box-grid");
    expect(result.raw).toBe(line);
  });

  it("requires at least two pipes — single leading pipe is NOT box-grid", () => {
    // A line like "| just one pipe" should fall through to plain
    const result = tokenizeLine("| single");
    expect(result.type).not.toBe("box-grid");
  });

  it("line must START with pipe to be box-grid", () => {
    // Pipe in the middle is not box-grid
    const result = tokenizeLine("G |C| D");
    expect(result.type).not.toBe("box-grid");
  });
});

// ------------------------------------------------------------
// tokenizeLine — section
// ------------------------------------------------------------

describe("tokenizeLine — section", () => {
  it("classifies CHORUS: as section", () => {
    const result = tokenizeLine("CHORUS:");
    expect(result.type).toBe("section");
    expect(result.raw).toBe("CHORUS:");
  });

  it("classifies JAM SECTION: as section", () => {
    const result = tokenizeLine("JAM SECTION:");
    expect(result.type).toBe("section");
  });

  it("classifies VAMP: as section", () => {
    expect(tokenizeLine("VAMP:").type).toBe("section");
  });

  it("classifies BRIDGE: line (even with chords after colon) as section", () => {
    // Priority: section check fires before chord-lyric
    const line = "BRIDGE:  [D] → [Am] → [G]  (repeat 2x, jam here)";
    const result = tokenizeLine(line);
    expect(result.type).toBe("section");
  });

  it("classifies OUTRO: as section", () => {
    const line = "OUTRO: La da da da... [G] [C] [G]";
    expect(tokenizeLine(line).type).toBe("section");
  });

  it("classifies INTRO: as section", () => {
    const line = "INTRO: [G] fingerpicking pattern (Garcia style)";
    expect(tokenizeLine(line).type).toBe("section");
  });

  it("classifies JAM: as section", () => {
    expect(tokenizeLine("JAM:").type).toBe("section");
  });

  it("does not classify normal lyrics as section (no uppercase-colon match)", () => {
    const result = tokenizeLine("Just plain lyrics about life");
    expect(result.type).not.toBe("section");
  });

  it("does not classify single uppercase word without colon as section", () => {
    expect(tokenizeLine("HELLO THERE").type).not.toBe("section");
  });
});

// ------------------------------------------------------------
// tokenizeLine — annotation
// ------------------------------------------------------------

describe("tokenizeLine — annotation", () => {
  it("classifies lines starting with > as annotation", () => {
    const line = "> some note";
    const result = tokenizeLine(line);
    expect(result.type).toBe("annotation");
    expect(result.raw).toBe(line);
  });

  it("classifies lines containing → as annotation", () => {
    const line = "→ TRANSITION TO FIRE ON THE MOUNTAIN: modulate to [A]";
    const result = tokenizeLine(line);
    expect(result.type).toBe("annotation");
  });

  it("classifies lines fully wrapped in parens as annotation", () => {
    const line = "(Everyone sings — let it ring out)";
    const result = tokenizeLine(line);
    expect(result.type).toBe("annotation");
  });

  it("classifies another paren-wrapped line as annotation", () => {
    const line = "(Build energy each verse — this is a crowd-pleaser)";
    expect(tokenizeLine(line).type).toBe("annotation");
  });

  it("classifies paren-wrapped stage direction as annotation", () => {
    const line = "(Big group vocal on \"Come hear Uncle John's Band\")";
    expect(tokenizeLine(line).type).toBe("annotation");
  });

  it("does NOT classify line starting with paren but not fully wrapped", () => {
    // "(start of line but there's more after" — not fully wrapped
    const line = "(start but not closed";
    expect(tokenizeLine(line).type).not.toBe("annotation");
  });

  it("annotation check fires before chord-lyric for → lines with brackets", () => {
    // → TRANSITION TO FIRE ON THE MOUNTAIN: modulate to [A]
    // Has [A] bracket but → makes it annotation
    const line = "→ TRANSITION TO FIRE ON THE MOUNTAIN: modulate to [A]";
    expect(tokenizeLine(line).type).toBe("annotation");
  });
});

// ------------------------------------------------------------
// tokenizeLine — chord-lyric
// ------------------------------------------------------------

describe("tokenizeLine — chord-lyric", () => {
  it("classifies line with brackets as chord-lyric", () => {
    const result = tokenizeLine("[G]boys were drinkin'");
    expect(result.type).toBe("chord-lyric");
  });

  it("extracts single chord at start of line", () => {
    const result = tokenizeLine("[G]boys were drinkin'");
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments).toEqual([{ chord: "G", lyric: "boys were drinkin'" }]);
    }
  });

  it("preserves leading lyric text before first chord", () => {
    const line = "A lit up and the [G]boys were drinkin'";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[0]).toEqual({ chord: "", lyric: "A lit up and the " });
      expect(result.segments[1]).toEqual({ chord: "G", lyric: "boys were drinkin'" });
    }
  });

  it("handles multiple chords on same line", () => {
    const line = "[C]The air was [G]smoky and the [Am]place was [C]loud";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments).toHaveLength(4);
      expect(result.segments[0]).toEqual({ chord: "C", lyric: "The air was " });
      expect(result.segments[1]).toEqual({ chord: "G", lyric: "smoky and the " });
      expect(result.segments[2]).toEqual({ chord: "Am", lyric: "place was " });
      expect(result.segments[3]).toEqual({ chord: "C", lyric: "loud" });
    }
  });

  it("handles chord-only line with spaces between chords", () => {
    const line = "[G]  [C]  [D]";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments).toHaveLength(3);
      expect(result.segments[0]).toEqual({ chord: "G", lyric: "  " });
      expect(result.segments[1]).toEqual({ chord: "C", lyric: "  " });
      expect(result.segments[2]).toEqual({ chord: "D", lyric: "" });
    }
  });

  it("handles slash chords like C/G", () => {
    const line = "[C/G]walking in the sunshine";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[0]).toEqual({ chord: "C/G", lyric: "walking in the sunshine" });
    }
  });

  it("handles complex chord names like Emaj7", () => {
    const line = "[Emaj7]  [A/E]  (sparkly intro)";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[0].chord).toBe("Emaj7");
      expect(result.segments[1].chord).toBe("A/E");
    }
  });

  it("handles chord-lyric with trailing annotation-like text", () => {
    // "[B] [E] [B] [E] — open jam, build intensity" — classified as chord-lyric
    // The "— open jam" is part of the last segment's lyric
    const line = "[B] [E] [B] [E] — open jam, build intensity";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments).toHaveLength(4);
      expect(result.segments[3].lyric).toBe(" — open jam, build intensity");
    }
  });

  it("handles chord-lyric from actual setlist line", () => {
    const line = "If I [Am]get home be[C]fore daylight";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[0]).toEqual({ chord: "", lyric: "If I " });
      expect(result.segments[1]).toEqual({ chord: "Am", lyric: "get home be" });
      expect(result.segments[2]).toEqual({ chord: "C", lyric: "fore daylight" });
    }
  });

  it("handles Bm chord", () => {
    const line = "[G]Think this through with [Bm]me";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[1]).toEqual({ chord: "Bm", lyric: "me" });
    }
  });

  it("handles F# chord", () => {
    const line = "In the [F#]strangest of places if you [E]look at it right";
    const result = tokenizeLine(line);
    expect(result.type).toBe("chord-lyric");
    if (result.type === "chord-lyric") {
      expect(result.segments[1].chord).toBe("F#");
    }
  });
});

// ------------------------------------------------------------
// tokenizeLine — plain
// ------------------------------------------------------------

describe("tokenizeLine — plain", () => {
  it("classifies regular lyric lines as plain", () => {
    const line = "Just plain lyrics";
    const result = tokenizeLine(line);
    expect(result.type).toBe("plain");
    expect(result.raw).toBe(line);
  });

  it("classifies non-uppercase-colon text as plain", () => {
    expect(tokenizeLine("Get up get out of the door").type).toBe("plain");
  });

  it("classifies indented lyrics as plain", () => {
    const line = "    Might as well try";
    expect(tokenizeLine(line).type).toBe("plain");
  });

  it("classifies vocal harmony instructions as plain", () => {
    const line = "Bobby comps on the [A], Jerry solos over [B]";
    // Wait — this has brackets! So it's chord-lyric, not plain
    // Let's test a real plain line
    expect(tokenizeLine("This can go for 10+ minutes. LISTEN.").type).toBe("plain");
  });
});

// ------------------------------------------------------------
// tokenizeChart — full chart parsing
// ------------------------------------------------------------

describe("tokenizeChart", () => {
  it("splits chart string into parsed lines", () => {
    const chart = "[G]  [C]\nA lit up and the [G]boys were drinkin'\n\nCHORUS:";
    const result = tokenizeChart(chart);
    expect(result).toHaveLength(4);
    expect(result[0].type).toBe("chord-lyric");
    expect(result[1].type).toBe("chord-lyric");
    expect(result[2].type).toBe("blank");
    expect(result[3].type).toBe("section");
  });

  it("parses Friend of the Devil chart without throwing", () => {
    const chart = `[G]  [C]
A lit up and the [G]boys were drinkin'
[C]The air was [G]smoky and the [Am]place was [C]loud
A [G]friend of the [C]devil is a friend of mine
If I [Am]get home be[C]fore daylight
I [G]just might get some [D]sleep to[G]night

[G]  [C]  [D]
I [G]ran into the [C]devil, babe,

CHORUS:
[D]Set out [C]runnin' but I [G]take my time

BRIDGE:  [D] → [Am] → [G]  (repeat 2x, jam here)`;

    const lines = tokenizeChart(chart);
    expect(lines.length).toBeGreaterThan(0);

    // BRIDGE line should be section (priority over chord-lyric)
    const bridgeLine = lines.find((l) => l.raw.startsWith("BRIDGE:"));
    expect(bridgeLine?.type).toBe("section");

    // CHORUS line should be section
    const chorusLine = lines.find((l) => l.raw === "CHORUS:");
    expect(chorusLine?.type).toBe("section");
  });

  it("parses Scarlet Begonias chart correctly", () => {
    const chart = `[B]  [E]  [B]  [E]

JAM SECTION:
[B] [E] [B] [E] — open jam, build intensity
→ TRANSITION TO FIRE ON THE MOUNTAIN: modulate to [A]`;

    const lines = tokenizeChart(chart);

    const jamSection = lines.find((l) => l.raw === "JAM SECTION:");
    expect(jamSection?.type).toBe("section");

    const transitionLine = lines.find((l) => l.raw.startsWith("→"));
    expect(transitionLine?.type).toBe("annotation");

    const jamLine = lines.find((l) => l.raw.startsWith("[B] [E] [B] [E]"));
    expect(jamLine?.type).toBe("chord-lyric");
  });

  it("handles empty chart string", () => {
    expect(tokenizeChart("")).toEqual([{ type: "blank", raw: "" }]);
  });

  it("returns correct types for all lines", () => {
    const chart = `INTRO: [G] fingerpicking pattern
[G] [C] [G] [C]
(Big group vocal on "Come hear")

Just plain lyrics`;

    const lines = tokenizeChart(chart);
    expect(lines[0].type).toBe("section");    // INTRO:
    expect(lines[1].type).toBe("chord-lyric"); // [G] [C] ...
    expect(lines[2].type).toBe("annotation"); // (Big group...)
    expect(lines[3].type).toBe("blank");      // empty line
    expect(lines[4].type).toBe("plain");      // plain lyrics
  });
});

// ------------------------------------------------------------
// Type exports verification
// ------------------------------------------------------------

describe("type exports", () => {
  it("ParsedLine and ChordSegment types are usable", () => {
    const seg: ChordSegment = { chord: "G", lyric: "hello" };
    const line: ParsedLine = { type: "plain", raw: "hello" };
    expect(seg.chord).toBe("G");
    expect(line.raw).toBe("hello");
  });

  it("LineType union covers all expected values", () => {
    const types: LineType[] = ["blank", "section", "annotation", "box-grid", "chord-lyric", "plain"];
    expect(types).toHaveLength(6);
  });
});
