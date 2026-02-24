// ============================================
// useDeadSync — React hook for PartyKit connection
// ============================================
// This hook manages the WebSocket connection to the
// PartyKit server and exposes the session state +
// actions to React components.

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

interface UseDeadSyncOptions {
  host: string;     // e.g. "localhost:1999" or "your-project.username.partykit.dev"
  room: string;     // the session/room id
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

  // Actions
  actions: DeadSyncActions;
}

export function useDeadSync({ host, room }: UseDeadSyncOptions): UseDeadSyncReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [localIndex, setLocalIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // --- Connect to PartyKit ---
  useEffect(() => {
    const socket = new PartySocket({ host, room });
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
      setConnectionId(socket.id);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      handleServerMessage(msg);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [host, room]);

  // --- Handle messages from server ---
  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "state":
        setSessionState(msg.state);
        if (isLive) {
          setLocalIndex(msg.state.liveIndex);
        }
        break;

      case "song-changed":
        setSessionState((prev) => {
          if (!prev) return prev;
          return { ...prev, liveIndex: msg.index };
        });
        // If we're in "live" mode, follow the leader
        if (isLive) {
          setLocalIndex(msg.index);
        }
        break;

      case "user-joined":
        setSessionState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            users: [...prev.users.filter((u) => u.id !== msg.user.id), msg.user],
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
            users: prev.users.map((u) => (u.id === msg.user.id ? msg.user : u)),
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
              role: u.id === msg.leaderId ? "leader" as const : "follower" as const,
            })),
          };
        });
        break;

      case "error":
        console.error("[DeadSync]", msg.message);
        break;
    }
  }, [isLive]);

  // --- Send message helper ---
  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // --- Actions ---
  const actions: DeadSyncActions = {
    join: useCallback((name: string, role: UserRole) => {
      send({ type: "join", name, role });
    }, [send]),

    setSong: useCallback((index: number) => {
      send({ type: "set-song", index });
      setLocalIndex(index);
      setIsLive(true);
    }, [send]),

    browse: useCallback((index: number) => {
      setLocalIndex(index);
      // Check if we're still on the live song
      const liveIdx = sessionState?.liveIndex ?? 0;
      if (index === liveIdx) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
      send({ type: "browse", index });
    }, [send, sessionState?.liveIndex]),

    goLive: useCallback(() => {
      setIsLive(true);
      const liveIdx = sessionState?.liveIndex ?? 0;
      setLocalIndex(liveIdx);
      send({ type: "go-live" });
    }, [send, sessionState?.liveIndex]),

    setSetlist: useCallback((setlist: Setlist) => {
      send({ type: "set-setlist", setlist });
    }, [send]),

    transferLead: useCallback((userId: string) => {
      send({ type: "transfer-lead", userId });
    }, [send]),

    disconnect: useCallback(() => {
      socketRef.current?.close();
    }, []),
  };

  // --- Derived values ---
  const isLeader = connectionId === sessionState?.leaderId;
  const myUser = sessionState?.users.find((u) => u.id === connectionId) ?? null;
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
    actions,
  };
}
