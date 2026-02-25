import { useEffect, useState, useRef } from "react";
import { useDeadSync } from "../use-deadsync";
import type { UserRole } from "../../shared/protocol";
import { ChordChart } from "./ChordChart";
import { NavigationBar } from "./NavigationBar";
import { SetlistDrawer } from "./SetlistDrawer";
import { TransferMenu } from "./TransferMenu";
import { GoLiveBanner } from "./GoLiveBanner";
import { LeaderDisconnectBanner } from "./LeaderDisconnectBanner";

interface SessionScreenProps {
  name: string;
  role: UserRole;
  code: string;
}

export function SessionScreen({ name, role, code }: SessionScreenProps) {
  const {
    connected,
    connectionId,
    sessionState,
    isLeader,
    isLive,
    liveIndex,
    localIndex,
    leaderDisconnected,
    actions,
  } = useDeadSync({
    host: window.location.host,
    room: code,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transferMenuOpen, setTransferMenuOpen] = useState(false);

  // Pulse detection — border/banner pulse when leader advances while follower is browsing
  const [pulse, setPulse] = useState(false);
  const prevLiveIndexRef = useRef(liveIndex);

  useEffect(() => {
    if (liveIndex !== prevLiveIndexRef.current) {
      if (!isLive) {
        setPulse(true);
        const timer = setTimeout(() => setPulse(false), 600);
        prevLiveIndexRef.current = liveIndex;
        return () => clearTimeout(timer);
      }
      prevLiveIndexRef.current = liveIndex;
    }
  }, [liveIndex, isLive]);

  // Go Live snap-back suppresses slide animation for one render cycle
  const justSnappedBackRef = useRef(false);

  // Long-press detection for LEADER badge
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const longPressFiredRef = useRef(false);

  // Join the session on mount
  useEffect(() => {
    actions.join(name, role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Compute navigation values — respects browse state
  const songs = sessionState?.setlist.songs ?? [];
  const total = songs.length;
  const displayIndex = isLive ? liveIndex : localIndex;
  const currentSong = songs[displayIndex] ?? null;
  const position = displayIndex + 1;

  // Whether to animate song transitions (only during auto-follow, not Go Live snap-back)
  const animateTransition = isLive && !justSnappedBackRef.current;

  // Navigation handlers — leader changes live song, follower browses
  function handlePrev() {
    if (isLeader) {
      actions.setSong(liveIndex - 1);
    } else {
      actions.browse(displayIndex - 1);
    }
  }

  function handleNext() {
    if (isLeader) {
      actions.setSong(liveIndex + 1);
    } else {
      actions.browse(displayIndex + 1);
    }
  }

  // Go Live handler — instant snap-back, no animation
  function handleGoLive() {
    justSnappedBackRef.current = true;
    actions.goLive();
    // Clear on next frame so subsequent auto-follows animate
    requestAnimationFrame(() => {
      justSnappedBackRef.current = false;
    });
  }

  // Drawer song selection — always browses locally
  function handleDrawerSelect(index: number) {
    actions.browse(index);
    setDrawerOpen(false);
  }

  // Leadership transfer
  function handleTransfer(userId: string) {
    actions.transferLead(userId);
    setTransferMenuOpen(false);
  }

  // Long-press handlers for LEADER badge
  function handleBadgePointerDown() {
    if (!isLeader) return;
    longPressFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setTransferMenuOpen(true);
    }, 500);
  }

  function handleBadgePointerUp() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  // Browse-away state: follower is not on the live song
  const isBrowsingAway = !isLive && !isLeader;

  return (
    <>
      <div
        className={`h-dvh bg-surface text-text-primary safe-area-padding flex flex-col${
          isBrowsingAway ? " ring-4 ring-inset ring-accent-gold" : ""
        }${
          isBrowsingAway && pulse
            ? " animate-[ring-pulse_0.6s_ease-in-out]"
            : ""
        }`}
        data-testid="session-root"
      >
        {/* Session info header — compact, non-growing */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          {/* Hamburger + session info */}
          <div className="flex items-center gap-3">
            {/* Hamburger button */}
            <button
              className="min-w-12 min-h-12 flex items-center justify-center text-text-secondary"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open setlist"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div>
              <h2 className="text-lg font-bold text-accent-gold tracking-tight leading-tight">
                {code}
              </h2>
              <p className="text-text-secondary text-sm leading-tight">
                {name} &middot;{" "}
                {isLeader ? (
                  <span
                    className="bg-accent-gold/20 text-accent-gold text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer select-none touch-none"
                    onPointerDown={handleBadgePointerDown}
                    onPointerUp={handleBadgePointerUp}
                    onPointerCancel={handleBadgePointerUp}
                    role="button"
                    aria-label="Transfer leadership (long press)"
                  >
                    LEADER
                  </span>
                ) : (
                  <span className="text-text-secondary">follower</span>
                )}
              </p>
            </div>
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

        {/* Leader disconnect banner — informational, followers only */}
        {leaderDisconnected && !isLeader && <LeaderDisconnectBanner />}

        {/* GO LIVE banner — appears when follower browses away from live song */}
        {isBrowsingAway && (
          <GoLiveBanner onGoLive={handleGoLive} pulse={pulse} />
        )}

        {/* Chord chart — fills remaining viewport, owns its own scroll */}
        <div className="flex-1 min-h-0">
          {currentSong ? (
            <ChordChart
              song={currentSong}
              position={position}
              total={total}
              animateTransition={animateTransition}
            />
          ) : (
            <div className="mt-8 text-center text-text-muted text-sm">
              <p>Waiting for setlist...</p>
            </div>
          )}
        </div>

        {/* Navigation bar — shrink-0, sticks to bottom */}
        {total > 0 && (
          <NavigationBar
            songTitle={currentSong?.title ?? ""}
            position={position}
            total={total}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </div>

      {/* Overlays — outside main flex column (fixed positioning) */}
      <SetlistDrawer
        open={drawerOpen}
        songs={songs}
        liveIndex={liveIndex}
        users={sessionState?.users ?? []}
        leaderId={sessionState?.leaderId ?? null}
        onSelect={handleDrawerSelect}
        onClose={() => setDrawerOpen(false)}
      />

      {isLeader && (
        <TransferMenu
          open={transferMenuOpen}
          users={sessionState?.users ?? []}
          currentUserId={connectionId}
          onTransfer={handleTransfer}
          onClose={() => setTransferMenuOpen(false)}
        />
      )}
    </>
  );
}
