import type { Song } from "../../shared/protocol";

interface SongHeaderProps {
  song: Song;
  position: number;
  total: number;
}

/**
 * SongHeader — compact song metadata bar above the chord chart.
 *
 * Shows title, position (N of M), key, tempo, and optional notes.
 * Does NOT use sticky positioning — it sits outside the scroll
 * container in the flex layout so it stays fixed naturally.
 */
export function SongHeader({ song, position, total }: SongHeaderProps) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 z-10">
      {/* Row 1: title + position */}
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold text-text-primary truncate">
          {song.title}
        </h2>
        <span className="text-text-secondary text-sm shrink-0">
          {position} of {total}
        </span>
      </div>

      {/* Row 2: key + tempo */}
      <div className="flex gap-4 text-sm text-text-secondary mt-0.5">
        <span>
          Key:{" "}
          <span className="text-accent-gold font-medium">{song.key}</span>
        </span>
        <span>{song.tempo}</span>
      </div>

      {/* Row 3: notes (conditional) */}
      {song.notes && (
        <p className="text-text-muted text-sm italic line-clamp-2 mt-1">
          {song.notes}
        </p>
      )}
    </div>
  );
}
