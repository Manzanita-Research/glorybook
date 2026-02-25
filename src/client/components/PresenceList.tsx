import type { SessionUser } from "../../shared/protocol";

interface PresenceListProps {
  users: SessionUser[];
  leaderId: string | null;
}

/**
 * PresenceList — compact list of connected users with status dots.
 *
 * Green dot = live (synced to leader's song).
 * Gold dot = browsing (looking at a different song).
 * Leader gets a small "(lead)" label.
 *
 * Designed to be minimal — this is a music stand on stage,
 * not a social app. Just enough to know who's connected
 * and if someone drifted.
 */
export function PresenceList({ users, leaderId }: PresenceListProps) {
  return (
    <div className="px-4 py-3 border-t border-border shrink-0">
      <h4 className="text-text-muted text-xs uppercase tracking-wider mb-2">
        Connected
      </h4>
      <ul className="space-y-1">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                user.isLive ? "bg-status-connected" : "bg-accent-gold"
              }`}
              role="img"
              aria-label={user.isLive ? "Live" : "Browsing"}
            />
            <span className="text-text-secondary truncate">
              {user.name}
              {user.id === leaderId && (
                <span className="text-text-muted text-xs ml-1">(lead)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
