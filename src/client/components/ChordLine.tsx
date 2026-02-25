import type { ChordSegment } from "../../client/lib/chord-tokenizer";

interface ChordLineProps {
  segments: ChordSegment[];
}

/**
 * ChordLine — renders one chord-lyric line using above-the-line layout.
 *
 * Each segment is an inline-block span with two stacked spans:
 * chord badge on top, lyric text below. Empty lyrics get a non-breaking
 * space to preserve alignment.
 */
export function ChordLine({ segments }: ChordLineProps) {
  return (
    <div className="whitespace-pre font-mono">
      {segments.map((seg, i) => (
        <span key={i} className="inline-block align-top">
          {seg.chord ? (
            <span className="block text-accent-gold bg-surface-overlay/60 px-1 rounded text-sm leading-tight mb-0.5">
              {seg.chord}
            </span>
          ) : (
            <span className="block text-sm leading-tight mb-0.5">&nbsp;</span>
          )}
          <span className="block text-text-primary">
            {seg.lyric || "\u00A0"}
          </span>
        </span>
      ))}
    </div>
  );
}
