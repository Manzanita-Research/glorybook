interface NavigationBarProps {
  songTitle: string;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * NavigationBar — bottom transport bar for song navigation.
 *
 * Modeled after a music player: prev/next arrows with song title
 * and position (N of M) in the center. Sits at the bottom of the
 * flex column in SessionScreen as a shrink-0 element.
 */
export function NavigationBar({
  songTitle,
  position,
  total,
  onPrev,
  onNext,
}: NavigationBarProps) {
  const isFirst = position === 1;
  const isLast = position === total;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-t border-border shrink-0">
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="min-w-12 min-h-12 flex items-center justify-center text-text-primary disabled:text-text-muted disabled:opacity-40"
        aria-label="Previous song"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-6 h-6"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>

      {/* Song title + position */}
      <div className="min-w-0 flex-1 text-center px-2">
        <p className="text-text-primary font-medium truncate">{songTitle}</p>
        <p className="text-text-secondary text-sm">
          {position} of {total}
        </p>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className="min-w-12 min-h-12 flex items-center justify-center text-text-primary disabled:text-text-muted disabled:opacity-40"
        aria-label="Next song"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-6 h-6"
        >
          <polyline points="9,6 15,12 9,18" />
        </svg>
      </button>
    </div>
  );
}
