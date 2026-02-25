import { useMemo } from "react";
import type { Song } from "../../shared/protocol";
import { tokenizeChart } from "../lib/chord-tokenizer";
import type { ParsedLine } from "../lib/chord-tokenizer";
import { SongHeader } from "./SongHeader";
import { ChordLine } from "./ChordLine";
import { BoxGridLine } from "./BoxGridLine";

interface ChordChartProps {
  song: Song;
  position: number;
  total: number;
  animateTransition?: boolean;
}

/**
 * ChordChart — top-level composition component.
 *
 * Tokenizes the song chart once (memoized), renders SongHeader above
 * a scrollable body. The parent SessionScreen provides viewport height
 * via flex layout — this component fills available space with flex-col.
 */
export function ChordChart({ song, position, total, animateTransition }: ChordChartProps) {
  const lines = useMemo(() => tokenizeChart(song.chart), [song.chart]);

  function renderLine(line: ParsedLine, i: number) {
    switch (line.type) {
      case "blank":
        return <div key={i} className="h-4" />;

      case "section":
        return (
          <div
            key={i}
            className="font-bold text-accent-blue uppercase mt-6 mb-2 tracking-wide"
          >
            {line.raw.trim()}
          </div>
        );

      case "annotation":
        return (
          <div key={i} className="italic text-accent-purple my-1">
            {line.raw.startsWith(">")
              ? line.raw.slice(1).trim()
              : line.raw.trim()}
          </div>
        );

      case "box-grid":
        return <BoxGridLine key={i} raw={line.raw} />;

      case "chord-lyric":
        return <ChordLine key={i} segments={line.segments!} />;

      case "plain":
        return (
          <div key={i} className="text-text-primary my-0.5">
            {line.raw.trim()}
          </div>
        );
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SongHeader song={song} position={position} total={total} />
      <div
        key={animateTransition ? `song-${song.id}` : undefined}
        className={`flex-1 overflow-y-auto px-4 py-4 font-mono text-xl${
          animateTransition ? " animate-[slide-in-left_200ms_ease-out]" : ""
        }`}
      >
        {lines.map((line, i) => renderLine(line, i))}
      </div>
    </div>
  );
}
