import { useEffect } from "react";
import { useDeadSync } from "../use-deadsync";
import type { UserRole } from "../../shared/protocol";

interface SessionScreenProps {
  name: string;
  role: UserRole;
  code: string;
}

export function SessionScreen({ name, role, code }: SessionScreenProps) {
  const {
    connected,
    sessionState,
    myUser,
    isLeader,
    leaderDisconnected,
    actions,
  } = useDeadSync({
    host: window.location.host,
    room: code,
  });

  // Join the session on mount
  useEffect(() => {
    actions.join(name, role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const users = sessionState?.users ?? [];

  return (
    <div className="min-h-dvh bg-surface text-text-primary safe-area-padding p-4">
      {/* Header area */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-accent-gold tracking-tight">
            {code}
          </h2>
          <p className="text-text-secondary text-sm">
            {name} &middot;{" "}
            <span className="capitalize">
              {isLeader ? "leader" : role}
            </span>
            {isLeader && (
              <span className="ml-1 text-accent-gold font-medium">
                &#9733;
              </span>
            )}
          </p>
        </div>

        {/* Connection indicator */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              connected ? "bg-status-connected" : "bg-status-disconnected"
            }`}
            role="status"
            aria-label={connected ? "Connected" : "Disconnected"}
          />
          <span>{connected ? "connected" : "reconnecting..."}</span>
        </div>
      </div>

      {/* Leader disconnected notice */}
      {leaderDisconnected && (
        <p className="text-text-muted text-sm mb-4">
          Leader disconnected. Waiting for reconnect...
        </p>
      )}

      {/* Connected users */}
      <div className="space-y-2">
        <h3 className="text-sm text-text-secondary font-medium uppercase tracking-wider">
          In session
        </h3>
        {users.length === 0 ? (
          <p className="text-text-muted text-sm">Connecting...</p>
        ) : (
          <ul className="space-y-1">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised min-h-[44px]"
              >
                <span className="text-text-primary">
                  {user.name}
                  {user.id === myUser?.id && (
                    <span className="text-text-muted ml-1">(you)</span>
                  )}
                </span>
                <span className="text-text-muted text-sm capitalize">
                  {user.role}
                </span>
                {user.role === "leader" && (
                  <span className="text-accent-gold text-sm" aria-label="Leader">
                    &#9733;
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Placeholder for setlist viewer (Phase 3) */}
      <div className="mt-8 text-center text-text-muted text-sm">
        <p>Setlist viewer coming soon.</p>
      </div>
    </div>
  );
}
