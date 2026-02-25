interface GoLiveBannerProps {
  onGoLive: () => void;
  pulse?: boolean;
}

/**
 * GoLiveBanner — fixed gold banner at top of screen when a follower
 * browses away from the live song.
 *
 * Text: just "GO LIVE" — no song name, no extra context.
 * Tapping it snaps back to the leader's current song immediately.
 * Appears instantly (no slide-in animation per user decision).
 */
export function GoLiveBanner({ onGoLive, pulse }: GoLiveBannerProps) {
  return (
    <button
      onClick={onGoLive}
      className={`w-full py-3 bg-accent-gold text-surface font-bold text-center
        uppercase tracking-wider text-sm shrink-0
        ${pulse ? "animate-[pulse-once_0.6s_ease-in-out]" : ""}`}
      aria-label="Go live — return to current song"
    >
      GO LIVE
    </button>
  );
}
