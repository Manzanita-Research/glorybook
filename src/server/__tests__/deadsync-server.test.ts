import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ServerMessage, SessionUser, Setlist } from "../../shared/protocol";

// We can't import the actual PartyKit server class directly because it depends
// on PartyKit types that don't exist outside the runtime. Instead, we test the
// server logic by creating a lightweight mock that mirrors the server's behavior.

// --- Mock infrastructure ---

function createMockStorage() {
  const store = new Map<string, unknown>();
  let alarm: number | null = null;
  return {
    get: async <T>(key: string): Promise<T | undefined> =>
      store.get(key) as T | undefined,
    put: async (key: string, value: unknown) => {
      store.set(key, value);
    },
    delete: async (keys: string | string[]) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => store.delete(k));
    },
    list: async <T>(opts?: { prefix?: string }): Promise<Map<string, T>> => {
      const result = new Map<string, T>();
      for (const [k, v] of store) {
        if (!opts?.prefix || k.startsWith(opts.prefix)) {
          result.set(k, v as T);
        }
      }
      return result;
    },
    setAlarm: async (time: number) => {
      alarm = time;
    },
    getAlarm: async (): Promise<number | null> => alarm,
    deleteAlarm: async () => {
      alarm = null;
    },
    // Test helpers
    _store: store,
    _getAlarm: () => alarm,
  };
}

interface MockConnection {
  id: string;
  _messages: string[];
  send: (msg: string) => void;
  close: () => void;
}

function createMockConnection(id: string): MockConnection {
  return {
    id,
    _messages: [],
    send(msg: string) {
      this._messages.push(msg);
    },
    close: vi.fn(),
  };
}

function parseMessages(conn: MockConnection): ServerMessage[] {
  return conn._messages.map((m) => JSON.parse(m));
}

function lastMessage(conn: MockConnection): ServerMessage {
  const msgs = parseMessages(conn);
  return msgs[msgs.length - 1];
}

// --- Mini server that mirrors the real server's logic ---
// This tests the same handler logic without PartyKit runtime deps

class TestableDeadSyncServer {
  sessionCode = "test-session";
  liveIndex = 0;
  leaderId: string | null = null;
  setlistInfo = { id: "test", name: "Test Setlist", songCount: 0 };
  users = new Map<string, SessionUser>();
  pendingLeaderDisconnect: string | null = null;
  storage: ReturnType<typeof createMockStorage>;
  connections = new Map<string, MockConnection>();

  constructor() {
    this.storage = createMockStorage();
  }

  broadcast(msg: ServerMessage, exclude?: string[]) {
    const data = JSON.stringify(msg);
    for (const [id, conn] of this.connections) {
      if (!exclude?.includes(id)) {
        conn.send(data);
      }
    }
  }

  send(conn: MockConnection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  async persistMeta() {
    await this.storage.put("meta", {
      sessionCode: this.sessionCode,
      liveIndex: this.liveIndex,
      leaderId: this.leaderId,
    });
  }

  async persistSetlist(setlist: Setlist) {
    const oldKeys: string[] = [];
    for (let i = 0; i < this.setlistInfo.songCount; i++) {
      oldKeys.push(`song:${i}`);
    }
    if (oldKeys.length > 0) await this.storage.delete(oldKeys);

    this.setlistInfo = {
      id: setlist.id,
      name: setlist.name,
      songCount: setlist.songs.length,
    };
    await this.storage.put("setlist-info", this.setlistInfo);
    for (let i = 0; i < setlist.songs.length; i++) {
      await this.storage.put(`song:${i}`, setlist.songs[i]);
    }
  }

  async getFullSetlist(): Promise<Setlist> {
    const entries = await this.storage.list<{ id: string; title: string; key: string; tempo: string; chart: string }>({ prefix: "song:" });
    const sorted = [...entries.entries()].sort(([a], [b]) => {
      return parseInt(a.split(":")[1]) - parseInt(b.split(":")[1]);
    });
    const songs = sorted.map(([, song]) => song);
    return { id: this.setlistInfo.id, name: this.setlistInfo.name, songs };
  }

  async getState() {
    const setlist = await this.getFullSetlist();
    return {
      sessionCode: this.sessionCode,
      setlist,
      liveIndex: this.liveIndex,
      leaderId: this.leaderId,
      users: Array.from(this.users.values()),
    };
  }

  async handleJoin(
    conn: MockConnection,
    name: string,
    requestedRole: "leader" | "follower",
    reconnecting?: boolean,
  ) {
    const disconnectedLeader = await this.storage.get<{
      id: string;
      name: string;
    }>("disconnectedLeader");

    let role = requestedRole;
    let reclaimingLeadership = false;

    if (disconnectedLeader && name === disconnectedLeader.name) {
      reclaimingLeadership = true;
      role = "leader";
      await this.storage.deleteAlarm();
      await this.storage.delete("disconnectedLeader");
      this.pendingLeaderDisconnect = null;

      if (this.leaderId && this.leaderId !== conn.id) {
        const currentLeader = this.users.get(this.leaderId);
        if (currentLeader) {
          currentLeader.role = "follower";
          this.users.set(this.leaderId, currentLeader);
        }
      }
    } else if (role === "leader" && this.leaderId && this.leaderId !== conn.id) {
      role = "follower";
    }

    const user: SessionUser = {
      id: conn.id,
      name,
      role,
      isLive: true,
      currentIndex: this.liveIndex,
      joinedAt: Date.now(),
    };

    this.users.set(conn.id, user);
    this.connections.set(conn.id, conn);

    if (role === "leader") {
      this.leaderId = conn.id;
    }

    this.broadcast({ type: "user-joined", user }, [conn.id]);

    if (reclaimingLeadership) {
      this.broadcast({
        type: "leader-changed",
        leaderId: conn.id,
        leaderName: name,
      });
    }

    const state = await this.getState();
    this.send(conn, { type: "state", state });
    await this.persistMeta();
  }

  async handleSetSong(conn: MockConnection, index: number) {
    if (conn.id !== this.leaderId) {
      this.send(conn, {
        type: "error",
        message: "Only the leader can change the live song",
      });
      return;
    }
    if (index < 0 || index >= this.setlistInfo.songCount) {
      this.send(conn, { type: "error", message: "Song index out of range" });
      return;
    }
    this.liveIndex = index;
    const leader = this.users.get(conn.id);
    if (leader) {
      leader.currentIndex = index;
      this.users.set(conn.id, leader);
    }
    this.broadcast({ type: "song-changed", index, leaderId: conn.id });
    await this.persistMeta();
  }

  handleBrowse(conn: MockConnection, index: number) {
    const user = this.users.get(conn.id);
    if (!user) return;
    user.currentIndex = index;
    user.isLive = index === this.liveIndex;
    this.users.set(conn.id, user);
    this.broadcast({ type: "user-updated", user });
  }

  handleGoLive(conn: MockConnection) {
    const user = this.users.get(conn.id);
    if (!user) return;
    user.currentIndex = this.liveIndex;
    user.isLive = true;
    this.users.set(conn.id, user);
    this.broadcast({ type: "user-updated", user });
  }

  async onClose(conn: MockConnection) {
    const user = this.users.get(conn.id);
    if (!user) return;
    this.users.delete(conn.id);
    this.connections.delete(conn.id);

    if (this.leaderId === conn.id) {
      this.pendingLeaderDisconnect = conn.id;
      await this.storage.put("disconnectedLeader", {
        id: conn.id,
        name: user.name,
        disconnectedAt: Date.now(),
      });
      await this.storage.setAlarm(Date.now() + 30_000);
      this.broadcast({ type: "leader-disconnected", graceSeconds: 30 });
    }

    this.broadcast({ type: "user-left", userId: conn.id });
    await this.persistMeta();
  }

  async onAlarm() {
    if (this.pendingLeaderDisconnect) {
      this.pendingLeaderDisconnect = null;
      await this.storage.delete("disconnectedLeader");

      const remaining = Array.from(this.users.values());
      if (remaining.length > 0) {
        remaining.sort((a, b) => a.joinedAt - b.joinedAt);
        const newLeader = remaining[0];
        newLeader.role = "leader";
        this.leaderId = newLeader.id;
        this.users.set(newLeader.id, newLeader);
        this.broadcast({
          type: "leader-changed",
          leaderId: newLeader.id,
          leaderName: newLeader.name,
        });
        await this.persistMeta();
      } else {
        this.leaderId = null;
        await this.persistMeta();
      }
    }
  }

  async handleTransferLead(conn: MockConnection, newLeaderId: string) {
    if (conn.id !== this.leaderId) {
      this.send(conn, {
        type: "error",
        message: "Only the current leader can transfer leadership",
      });
      return;
    }
    const newLeader = this.users.get(newLeaderId);
    if (!newLeader) {
      this.send(conn, { type: "error", message: "User not found" });
      return;
    }
    const oldLeader = this.users.get(conn.id);
    if (oldLeader) {
      oldLeader.role = "follower";
      this.users.set(conn.id, oldLeader);
    }
    newLeader.role = "leader";
    this.users.set(newLeaderId, newLeader);
    this.leaderId = newLeaderId;
    this.broadcast({
      type: "leader-changed",
      leaderId: newLeaderId,
      leaderName: newLeader.name,
    });
    await this.persistMeta();
  }

  async handleSetSetlist(conn: MockConnection, setlist: Setlist) {
    if (conn.id !== this.leaderId) {
      this.send(conn, {
        type: "error",
        message: "Only the leader can change the setlist",
      });
      return;
    }
    await this.persistSetlist(setlist);
    this.liveIndex = 0;
    for (const [id, user] of this.users) {
      user.currentIndex = 0;
      user.isLive = true;
      this.users.set(id, user);
    }
    const state = await this.getState();
    this.broadcast({ type: "state", state });
    await this.persistMeta();
  }
}

// --- Test data ---

function makeTestSetlist(songCount: number): Setlist {
  return {
    id: "test-setlist",
    name: "Test Setlist",
    songs: Array.from({ length: songCount }, (_, i) => ({
      id: `song-${i}`,
      title: `Song ${i}`,
      key: "G",
      tempo: "Medium",
      chart: `[G] [C] [D] Test chart for song ${i}`,
    })),
  };
}

// --- Tests ---

describe("DeadSync Server", () => {
  let server: TestableDeadSyncServer;

  beforeEach(async () => {
    server = new TestableDeadSyncServer();
    // Seed a 3-song setlist
    const setlist = makeTestSetlist(3);
    await server.persistSetlist(setlist);
  });

  describe("Join handling", () => {
    it("first user joining as leader gets leader role", async () => {
      const conn = createMockConnection("user-1");
      await server.handleJoin(conn, "Jerry", "leader");

      expect(server.leaderId).toBe("user-1");
      const user = server.users.get("user-1");
      expect(user?.role).toBe("leader");
    });

    it("second user joining as leader gets demoted to follower", async () => {
      const conn1 = createMockConnection("user-1");
      await server.handleJoin(conn1, "Jerry", "leader");

      const conn2 = createMockConnection("user-2");
      await server.handleJoin(conn2, "Bobby", "leader");

      expect(server.leaderId).toBe("user-1");
      const user2 = server.users.get("user-2");
      expect(user2?.role).toBe("follower");
    });

    it("joining sends full state to the joiner", async () => {
      const conn = createMockConnection("user-1");
      await server.handleJoin(conn, "Jerry", "leader");

      const msgs = parseMessages(conn);
      const stateMsg = msgs.find((m) => m.type === "state");
      expect(stateMsg).toBeDefined();
      if (stateMsg?.type === "state") {
        expect(stateMsg.state.sessionCode).toBe("test-session");
        expect(stateMsg.state.setlist.songs.length).toBe(3);
      }
    });

    it("joining broadcasts user-joined to others", async () => {
      const conn1 = createMockConnection("user-1");
      await server.handleJoin(conn1, "Jerry", "leader");
      conn1._messages = []; // clear

      const conn2 = createMockConnection("user-2");
      await server.handleJoin(conn2, "Bobby", "follower");

      const msgs1 = parseMessages(conn1);
      const joinMsg = msgs1.find((m) => m.type === "user-joined");
      expect(joinMsg).toBeDefined();
      if (joinMsg?.type === "user-joined") {
        expect(joinMsg.user.name).toBe("Bobby");
      }
    });

    it("user has joinedAt timestamp", async () => {
      const before = Date.now();
      const conn = createMockConnection("user-1");
      await server.handleJoin(conn, "Jerry", "leader");
      const after = Date.now();

      const user = server.users.get("user-1");
      expect(user?.joinedAt).toBeGreaterThanOrEqual(before);
      expect(user?.joinedAt).toBeLessThanOrEqual(after);
    });
  });

  describe("Song navigation", () => {
    it("leader can set song and broadcasts song-changed", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");
      follower._messages = [];

      await server.handleSetSong(leader, 2);

      expect(server.liveIndex).toBe(2);
      const msgs = parseMessages(follower);
      const songMsg = msgs.find((m) => m.type === "song-changed");
      expect(songMsg).toBeDefined();
      if (songMsg?.type === "song-changed") {
        expect(songMsg.index).toBe(2);
      }
    });

    it("non-leader gets error when trying to set song", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");
      follower._messages = [];

      await server.handleSetSong(follower, 1);

      const msgs = parseMessages(follower);
      const errMsg = msgs.find((m) => m.type === "error");
      expect(errMsg).toBeDefined();
    });

    it("out-of-range index returns error", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");
      leader._messages = [];

      await server.handleSetSong(leader, 99);

      const msgs = parseMessages(leader);
      const errMsg = msgs.find((m) => m.type === "error");
      expect(errMsg).toBeDefined();
    });
  });

  describe("Browse and go-live", () => {
    it("follower browse updates currentIndex and isLive", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");

      server.handleBrowse(follower, 2);

      const user = server.users.get("follower-1");
      expect(user?.currentIndex).toBe(2);
      expect(user?.isLive).toBe(false);
    });

    it("go-live snaps follower back to liveIndex", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");

      server.handleBrowse(follower, 2);
      server.handleGoLive(follower);

      const user = server.users.get("follower-1");
      expect(user?.currentIndex).toBe(0); // liveIndex is 0
      expect(user?.isLive).toBe(true);
    });
  });

  describe("Leader grace period", () => {
    it("leader disconnect sets alarm and does NOT immediately promote", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");

      await server.onClose(leader);

      // Leader should still be set (not promoted yet)
      // The alarm should be set
      const alarm = server.storage._getAlarm();
      expect(alarm).not.toBeNull();
      expect(server.pendingLeaderDisconnect).toBe("leader-1");

      // Follower should have received leader-disconnected
      const msgs = parseMessages(follower);
      const disconnectedMsg = msgs.find(
        (m) => m.type === "leader-disconnected",
      );
      expect(disconnectedMsg).toBeDefined();
    });

    it("after alarm fires, new leader is promoted by joinedAt order", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      // Add two followers with different join times
      const follower1 = createMockConnection("follower-1");
      await server.handleJoin(follower1, "Bobby", "follower");

      // Small delay to ensure different joinedAt
      await new Promise((r) => setTimeout(r, 10));
      const follower2 = createMockConnection("follower-2");
      await server.handleJoin(follower2, "Phil", "follower");

      await server.onClose(leader);
      follower1._messages = [];
      follower2._messages = [];

      // Fire the alarm
      await server.onAlarm();

      // First follower (Bobby) should be promoted
      expect(server.leaderId).toBe("follower-1");
      const bobby = server.users.get("follower-1");
      expect(bobby?.role).toBe("leader");

      // Both should have received leader-changed
      const msgs1 = parseMessages(follower1);
      const leaderMsg = msgs1.find((m) => m.type === "leader-changed");
      expect(leaderMsg).toBeDefined();
    });

    it("reconnecting leader reclaims leadership and cancels alarm", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");

      // Leader disconnects
      await server.onClose(leader);
      expect(server.storage._getAlarm()).not.toBeNull();

      // Leader reconnects (new connection id)
      const leaderReconnected = createMockConnection("leader-1-new");
      follower._messages = [];
      await server.handleJoin(leaderReconnected, "Jerry", "follower", true);

      // Alarm should be cancelled
      expect(server.storage._getAlarm()).toBeNull();

      // Jerry should be leader again
      expect(server.leaderId).toBe("leader-1-new");
      const jerry = server.users.get("leader-1-new");
      expect(jerry?.role).toBe("leader");

      // Follower should receive leader-changed
      const msgs = parseMessages(follower);
      const leaderMsg = msgs.find((m) => m.type === "leader-changed");
      expect(leaderMsg).toBeDefined();
    });
  });

  describe("Storage sharding", () => {
    it("songs are stored as individual keys", async () => {
      const setlist = makeTestSetlist(5);
      await server.persistSetlist(setlist);

      const song0 = await server.storage.get("song:0");
      const song4 = await server.storage.get("song:4");
      expect(song0).toBeDefined();
      expect(song4).toBeDefined();
    });

    it("getFullSetlist reassembles from sharded keys in correct order", async () => {
      const setlist = makeTestSetlist(5);
      await server.persistSetlist(setlist);

      const reassembled = await server.getFullSetlist();
      expect(reassembled.songs.length).toBe(5);
      expect(reassembled.songs[0].title).toBe("Song 0");
      expect(reassembled.songs[4].title).toBe("Song 4");
    });

    it("no single storage value exceeds 128 KiB", async () => {
      // Create a 20-song setlist with large charts
      const bigSetlist = makeTestSetlist(20);
      // Each chart ~500 bytes, well under limit
      await server.persistSetlist(bigSetlist);

      for (const [key, value] of server.storage._store) {
        const serialized = JSON.stringify(value);
        expect(serialized.length).toBeLessThan(128 * 1024);
      }
    });

    it("setSetlist replaces old songs with new ones", async () => {
      const setlist3 = makeTestSetlist(3);
      await server.persistSetlist(setlist3);
      expect((await server.storage.get("song:0"))).toBeDefined();
      expect((await server.storage.get("song:2"))).toBeDefined();

      const setlist2 = makeTestSetlist(2);
      await server.persistSetlist(setlist2);
      expect((await server.storage.get("song:0"))).toBeDefined();
      expect((await server.storage.get("song:1"))).toBeDefined();
      expect((await server.storage.get("song:2"))).toBeUndefined();
    });
  });

  describe("Transfer leadership", () => {
    it("leader can transfer to another user", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");
      follower._messages = [];

      await server.handleTransferLead(leader, "follower-1");

      expect(server.leaderId).toBe("follower-1");
      const jerry = server.users.get("leader-1");
      expect(jerry?.role).toBe("follower");
      const bobby = server.users.get("follower-1");
      expect(bobby?.role).toBe("leader");
    });

    it("non-leader gets error when trying to transfer", async () => {
      const leader = createMockConnection("leader-1");
      await server.handleJoin(leader, "Jerry", "leader");

      const follower = createMockConnection("follower-1");
      await server.handleJoin(follower, "Bobby", "follower");
      follower._messages = [];

      await server.handleTransferLead(follower, "leader-1");

      const msgs = parseMessages(follower);
      const errMsg = msgs.find((m) => m.type === "error");
      expect(errMsg).toBeDefined();
    });
  });
});
