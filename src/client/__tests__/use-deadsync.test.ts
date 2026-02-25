import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeadSync } from "../use-deadsync";
import type { ServerMessage } from "../../shared/protocol";

// --- Mock PartySocket ---

type EventHandler = (event: { data: string }) => void;

interface MockSocket {
  id: string;
  readyState: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  addEventListener: (event: string, handler: EventHandler | (() => void)) => void;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listeners: Record<string, Array<EventHandler | (() => void)>>;
  _emit: (event: string, data?: unknown) => void;
}

let mockSocket: MockSocket;

vi.mock("partysocket", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const listeners: Record<string, Array<EventHandler | (() => void)>> = {};
      mockSocket = {
        id: "mock-conn-id",
        readyState: 1, // WebSocket.OPEN
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: (event: string, handler: EventHandler | (() => void)) => {
          (listeners[event] ??= []).push(handler);
        },
        removeEventListener: vi.fn(),
        _listeners: listeners,
        _emit: (event: string, data?: unknown) => {
          listeners[event]?.forEach((fn) => (fn as Function)(data));
        },
      };
      return mockSocket;
    }),
  };
});

// Mock wake-lock module
vi.mock("../wake-lock", () => ({
  requestWakeLock: vi.fn().mockResolvedValue(true),
  releaseWakeLock: vi.fn().mockResolvedValue(undefined),
}));

// --- Helpers ---

function emitOpen() {
  act(() => {
    mockSocket._emit("open");
  });
}

function emitMessage(msg: ServerMessage) {
  act(() => {
    mockSocket._emit("message", { data: JSON.stringify(msg) });
  });
}

function emitClose() {
  act(() => {
    mockSocket._emit("close");
  });
}

const baseState = {
  sessionCode: "test-123",
  setlist: {
    id: "test",
    name: "Test",
    songs: [
      { id: "s0", title: "Song 0", key: "G", tempo: "M", chart: "[G]" },
      { id: "s1", title: "Song 1", key: "A", tempo: "M", chart: "[A]" },
      { id: "s2", title: "Song 2", key: "C", tempo: "M", chart: "[C]" },
    ],
  },
  liveIndex: 0,
  leaderId: "leader-1",
  users: [
    {
      id: "mock-conn-id",
      name: "Jerry",
      role: "follower" as const,
      isLive: true,
      currentIndex: 0,
      joinedAt: Date.now(),
    },
  ],
};

// --- Tests ---

describe("useDeadSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts disconnected", () => {
    const { result } = renderHook(() =>
      useDeadSync({ host: "localhost:1999", room: "test" }),
    );
    expect(result.current.connected).toBe(false);
    expect(result.current.sessionState).toBeNull();
  });

  it("connects on open event", () => {
    const { result } = renderHook(() =>
      useDeadSync({ host: "localhost:1999", room: "test" }),
    );

    emitOpen();

    expect(result.current.connected).toBe(true);
    expect(result.current.connectionId).toBe("mock-conn-id");
  });

  it("disconnects on close event", () => {
    const { result } = renderHook(() =>
      useDeadSync({ host: "localhost:1999", room: "test" }),
    );

    emitOpen();
    expect(result.current.connected).toBe(true);

    emitClose();
    expect(result.current.connected).toBe(false);
  });

  it("receives and stores session state", () => {
    const { result } = renderHook(() =>
      useDeadSync({ host: "localhost:1999", room: "test" }),
    );

    emitOpen();
    emitMessage({ type: "state", state: baseState });

    expect(result.current.sessionState).not.toBeNull();
    expect(result.current.sessionState?.sessionCode).toBe("test-123");
    expect(result.current.currentSong?.title).toBe("Song 0");
  });

  describe("Stale closure fix (CRITICAL)", () => {
    it("browsing follower does NOT follow song-changed", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });

      // Follower browses to song 2 (not live)
      act(() => {
        result.current.actions.browse(2);
      });

      expect(result.current.isLive).toBe(false);
      expect(result.current.localIndex).toBe(2);

      // Leader advances to song 1
      emitMessage({
        type: "song-changed",
        index: 1,
        leaderId: "leader-1",
      });

      // The browsing follower should NOT follow — they should stay on song 2
      // This is the exact bug that the stale closure caused:
      // Before the fix, isLive was captured as `true` in the closure
      // and the follower would follow the leader even when browsing
      expect(result.current.localIndex).toBe(2);
      expect(result.current.isLive).toBe(false);
    });

    it("live follower DOES follow song-changed", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });

      // Follower is live (default)
      expect(result.current.isLive).toBe(true);

      // Leader advances to song 1
      emitMessage({
        type: "song-changed",
        index: 1,
        leaderId: "leader-1",
      });

      // Live follower should follow
      expect(result.current.localIndex).toBe(1);
    });
  });

  describe("Reconnect re-join", () => {
    it("sends join message on reconnect after initial join", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();

      // User joins
      act(() => {
        result.current.actions.join("Jerry", "follower");
      });

      // First join message (no reconnecting flag)
      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "join", name: "Jerry", role: "follower" }),
      );

      mockSocket.send.mockClear();

      // Simulate disconnect + reconnect
      emitClose();
      emitOpen();

      // Should auto-send join with reconnecting flag
      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join",
          name: "Jerry",
          role: "follower",
          reconnecting: true,
        }),
      );
    });

    it("snaps to live song after reconnect state message", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });

      // Browse away
      act(() => {
        result.current.actions.browse(2);
      });
      expect(result.current.isLive).toBe(false);

      // Disconnect and reconnect
      emitClose();
      emitOpen();

      // Receive state with liveIndex = 1 (leader advanced while we were disconnected)
      emitMessage({
        type: "state",
        state: { ...baseState, liveIndex: 1 },
      });

      // Should snap to live
      expect(result.current.localIndex).toBe(1);
      expect(result.current.isLive).toBe(true);
    });
  });

  describe("Actions", () => {
    it("setSong sends correct message", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      mockSocket.send.mockClear();

      act(() => {
        result.current.actions.setSong(2);
      });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "set-song", index: 2 }),
      );
    });

    it("goLive snaps to live index", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });

      // Browse away
      act(() => {
        result.current.actions.browse(2);
      });
      expect(result.current.isLive).toBe(false);

      // Go live
      act(() => {
        result.current.actions.goLive();
      });
      expect(result.current.isLive).toBe(true);
      expect(result.current.localIndex).toBe(0); // liveIndex is 0
    });
  });

  describe("Leader disconnected", () => {
    it("stores leader-disconnected info for UI", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });

      expect(result.current.leaderDisconnected).toBeNull();

      emitMessage({ type: "leader-disconnected", graceSeconds: 30 });

      expect(result.current.leaderDisconnected).toEqual({
        graceSeconds: 30,
      });
    });

    it("clears leader-disconnected on leader-changed", () => {
      const { result } = renderHook(() =>
        useDeadSync({ host: "localhost:1999", room: "test" }),
      );

      emitOpen();
      emitMessage({ type: "state", state: baseState });
      emitMessage({ type: "leader-disconnected", graceSeconds: 30 });

      expect(result.current.leaderDisconnected).not.toBeNull();

      emitMessage({
        type: "leader-changed",
        leaderId: "new-leader",
        leaderName: "Bobby",
      });

      expect(result.current.leaderDisconnected).toBeNull();
    });
  });
});
