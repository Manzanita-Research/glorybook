import { useEffect } from "react";
import { useDeadSync } from "../use-deadsync";
import type { UserRole } from "../../shared/protocol";
import { ChordChart } from "./ChordChart";

interface SessionScreenProps {
  name: string;
  role: UserRole;
  code: string;
}

export function SessionScreen({ name, role, code }: SessionScreenProps) {
  const {
    connected,
    sessionState,
    isLeader,
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

  const currentSong = sessionState?.setlist.songs[sessionState.liveIndex];
  const total = sessionState?.setlist.songs.length ?? 0;
  const position = (sessionState?.liveIndex ?? 0) + 1;

  return (
    <div className="h-dvh bg-surface text-text-primary safe-area-padding flex flex-col">
      {/* Session info header — compact, non-growing */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-lg font-bold text-accent-gold tracking-tight leading-tight">
            {code}
          </h2>
          <p className="text-text-secondary text-sm leading-tight">
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

      {/* Chord chart — fills remaining viewport, owns its own scroll */}
      <div className="flex-1 min-h-0">
        {currentSong ? (
          <ChordChart
            song={currentSong}
            position={position}
            total={total}
          />
        ) : (
          <div className="mt-8 text-center text-text-muted text-sm">
            <p>Waiting for setlist...</p>
          </div>
        )}
      </div>
    </div>
  );
}
