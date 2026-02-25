// ============================================
// useDeadSync — React hook for PartyKit connection
// ============================================
// Manages the WebSocket connection to the PartyKit server
// and exposes session state + actions to React components.
//
// Phase 1 fixes:
// - Stale closure eliminated (useRef for latest state)
// - Reconnect re-join (sends join on every open event)
// - Wake Lock integration (screen stays on)
// - leader-disconnected message handling

import { useState, useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import type {
  ClientMessage,
  ServerMessage,
  SessionState,
  SessionUser,
  Setlist,
  UserRole,
} from "../shared/protocol";
import { requestWakeLock, releaseWakeLock } from "./wake-lock";

interface UseDeadSyncOptions {
  host: string; // e.g. "localhost:1999" or "your-project.username.partykit.dev"
  room: string; // the session/room id
}

interface DeadSyncActions {
  join: (name: string, role: UserRole) => void;
  setSong: (index: number) => void;
  browse: (index: number) => void;
  goLive: () => void;
  setSetlist: (setlist: Setlist) => void;
  transferLead: (userId: string) => void;
  disconnect: () => void;
}

interface LeaderDisconnectedInfo {
  graceSeconds: number;
}

interface UseDeadSyncReturn {
  // Connection state
  connected: boolean;
  connectionId: string | null;

  // Session state (from server)
  sessionState: SessionState | null;

  // Derived convenience values
  currentSong: SessionState["setlist"]["songs"][number] | null;
  isLeader: boolean;
  isLive: boolean;
  myUser: SessionUser | null;
  liveIndex: number;
  localIndex: number;

  // Leader grace period state (for subtle UI indicator)
  leaderDisconnected: LeaderDisconnectedInfo | null;

  // Actions
  actions: DeadSyncActions;
}

export function useDeadSync({
  host,
  room,
}: UseDeadSyncOptions): UseDeadSyncReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [localIndex, setLocalIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [leaderDisconnected, setLeaderDisconnected] =
    useState<LeaderDisconnectedInfo | null>(null);

  // --- Refs for latest state (fixes stale closure bug) ---
  // The message handler is created once in useEffect but needs
  // access to current values. Refs bridge the gap.
  const isLiveRef = useRef(true);
  const sessionStateRef = useRef<SessionState | null>(null);
  const userInfoRef = useRef<{ name: string; role: UserRole } | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // --- Connect to PartyKit ---
  useEffect(() => {
    const socket = new PartySocket({
      host,
      room,
      // PartySocket defaults are perfect for our needs:
      // maxRetries: Infinity (never give up — per CONTEXT.md)
      // maxReconnectionDelay: 10000 (10s max between retries)
      // reconnectionDelayGrowFactor: 1.3 (exponential backoff)
    });
    socketRef.current = socket;

    // --- Handle socket open (fires on EVERY connect, including reconnect) ---
    socket.addEventListener("open", () => {
      setConnected(true);
      setConnectionId(socket.id);

      // Re-join on reconnect (not just first connect)
      // Per CONTEXT.md: "On successful reconnect, snap to the current live
      // song automatically" — the state message handler does the snapping.
      if (userInfoRef.current) {
        const msg: ClientMessage = {
          type: "join",
          name: userInfoRef.current.name,
          role: userInfoRef.current.role,
          reconnecting: true,
        };
        socket.send(JSON.stringify(msg));
      }
    });

    // --- Handle socket close ---
    socket.addEventListener("close", () => {
      setConnected(false);
    });

    // --- Handle messages from server ---
    // This handler is created once but reads current values via refs.
    // No useCallback needed — the handler lives inside the effect.
    socket.addEventListener("message", (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "state":
          setSessionState(msg.state);
          // Always snap to live on state sync
          // (covers both initial connect and reconnect)
          setLocalIndex(msg.state.liveIndex);
          setIsLive(true);
          // Clear any leader-disconnected state
          setLeaderDisconnected(null);
          break;

        case "song-changed":
          setSessionState((prev) => {
            if (!prev) return prev;
            return { ...prev, liveIndex: msg.index };
          });
          // Only follow if we're live — read from ref, not closure
          if (isLiveRef.current) {
            setLocalIndex(msg.index);
          }
          break;

        case "user-joined":
          setSessionState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              users: [
                ...prev.users.filter((u) => u.id !== msg.user.id),
                msg.user,
              ],
            };
          });
          break;

        case "user-left":
          setSessionState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              users: prev.users.filter((u) => u.id !== msg.userId),
            };
          });
          break;

        case "user-updated":
          setSessionState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              users: prev.users.map((u) =>
                u.id === msg.user.id ? msg.user : u,
              ),
            };
          });
          break;

        case "leader-changed":
          setSessionState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              leaderId: msg.leaderId,
              users: prev.users.map((u) => ({
                ...u,
                role:
                  u.id === msg.leaderId
                    ? ("leader" as const)
                    : ("follower" as const),
              })),
            };
          });
          // Clear leader-disconnected when new leader is established
          setLeaderDisconnected(null);
          break;

        case "leader-disconnected":
          setLeaderDisconnected({ graceSeconds: msg.graceSeconds });
          break;

        case "error":
          console.error("[DeadSync]", msg.message);
          break;
      }
    });

    return () => {
      releaseWakeLock();
      socket.close();
      socketRef.current = null;
    };
  }, [host, room]);

  // --- Send message helper ---
  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // --- Actions ---
  const actions: DeadSyncActions = {
    join: useCallback(
      (name: string, role: UserRole) => {
        userInfoRef.current = { name, role };
        send({ type: "join", name, role });
        // Request Wake Lock on first join
        requestWakeLock();
      },
      [send],
    ),

    setSong: useCallback(
      (index: number) => {
        send({ type: "set-song", index });
        setLocalIndex(index);
        setIsLive(true);
      },
      [send],
    ),

    browse: useCallback(
      (index: number) => {
        setLocalIndex(index);
        // Check if we're still on the live song — use ref for current value
        const liveIdx = sessionStateRef.current?.liveIndex ?? 0;
        if (index === liveIdx) {
          setIsLive(true);
        } else {
          setIsLive(false);
        }
        send({ type: "browse", index });
      },
      [send],
    ),

    goLive: useCallback(() => {
      setIsLive(true);
      const liveIdx = sessionStateRef.current?.liveIndex ?? 0;
      setLocalIndex(liveIdx);
      send({ type: "go-live" });
    }, [send]),

    setSetlist: useCallback(
      (setlist: Setlist) => {
        send({ type: "set-setlist", setlist });
      },
      [send],
    ),

    transferLead: useCallback(
      (userId: string) => {
        send({ type: "transfer-lead", userId });
      },
      [send],
    ),

    disconnect: useCallback(() => {
      releaseWakeLock();
      socketRef.current?.close();
    }, []),
  };

  // --- Derived values ---
  const isLeader = connectionId === sessionState?.leaderId;
  const myUser =
    sessionState?.users.find((u) => u.id === connectionId) ?? null;
  const liveIndex = sessionState?.liveIndex ?? 0;
  const displayIndex = isLive ? liveIndex : localIndex;
  const currentSong = sessionState?.setlist.songs[displayIndex] ?? null;

  return {
    connected,
    connectionId,
    sessionState,
    currentSong,
    isLeader,
    isLive,
    myUser,
    liveIndex,
    localIndex: displayIndex,
    leaderDisconnected,
    actions,
  };
}
