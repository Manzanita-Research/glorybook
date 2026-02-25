/**
 * LeaderDisconnectBanner — informational banner shown to followers
 * when the leader drops off. Gold/amber, calm, not alarming.
 *
 * Non-interactive (no button — there's nothing for the user to do).
 * The leader either reconnects or a new one is promoted automatically.
 */
export function LeaderDisconnectBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full py-2 bg-status-warning/20 text-status-warning text-center text-sm font-medium shrink-0"
    >
      Leader reconnecting...
    </div>
  );
}
