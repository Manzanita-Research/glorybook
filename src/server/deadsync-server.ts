// ============================================
// DeadSync PartyKit Server — v2
// ============================================
// Each "room" is a jam session. The server holds
// the canonical state: who's connected, who's leading,
// and what song we're on.
//
// Phase 1 hardening:
// - Hibernation enabled (scales to 32k connections, survives sleep)
// - Sharded storage (songs stored individually, no 128 KiB limit)
// - Leader grace period (30s alarm before promoting on disconnect)
// - Join-order tracking for predictable leader promotion

import type * as Party from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  SessionUser,
  Setlist,
  Song,
  UserRole,
} from "../shared/protocol";
import { generateSessionCode } from "../shared/protocol";
import { DEFAULT_SETLIST } from "../shared/default-setlist";

// --- Storage types (sharded keys) ---

interface StoredMeta {
  sessionCode: string;
  liveIndex: number;
  leaderId: string | null;
}

interface StoredSetlistInfo {
  id: string;
  name: string;
  songCount: number;
}

interface StoredDisconnectedLeader {
  id: string;
  name: string;
  disconnectedAt: number;
}

// --- Constants ---

const LEADER_GRACE_PERIOD_MS = 30_000; // 30 seconds

export default class DeadSyncServer implements Party.Server {
  // Hibernation: server sleeps between messages, wakes on activity
  options: Party.ServerOptions = {
    hibernate: true,
  };

  // --- In-memory state (restored from storage on wake) ---
  sessionCode: string = "";
  liveIndex: number = 0;
  leaderId: string | null = null;
  setlistInfo: StoredSetlistInfo = { id: "", name: "", songCount: 0 };
  users: Map<string, SessionUser> = new Map();
  pendingLeaderDisconnect: string | null = null;

  constructor(readonly room: Party.Room) {}

  // --- Lifecycle: load state on start (and on every hibernation wake) ---
  async onStart() {
    const meta = await this.room.storage.get<StoredMeta>("meta");
    if (meta) {
      this.sessionCode = meta.sessionCode;
      this.liveIndex = meta.liveIndex;
      this.leaderId = meta.leaderId;
    } else {
      this.sessionCode = generateSessionCode();
    }

    const setlistInfo =
      await this.room.storage.get<StoredSetlistInfo>("setlist-info");
    if (setlistInfo) {
      this.setlistInfo = setlistInfo;
    } else {
      // First start — seed default setlist
      this.setlistInfo = {
        id: DEFAULT_SETLIST.id,
        name: DEFAULT_SETLIST.name,
        songCount: DEFAULT_SETLIST.songs.length,
      };
      await this.room.storage.put("setlist-info", this.setlistInfo);
      for (let i = 0; i < DEFAULT_SETLIST.songs.length; i++) {
        await this.room.storage.put(`song:${i}`, DEFAULT_SETLIST.songs[i]);
      }
      await this.persistMeta();
    }

    // Restore pending leader disconnect state
    const disconnected =
      await this.room.storage.get<StoredDisconnectedLeader>(
        "disconnectedLeader",
      );
    if (disconnected) {
      this.pendingLeaderDisconnect = disconnected.id;
    }
  }

  // --- Storage: sharded persistence ---

  async persistMeta() {
    await this.room.storage.put<StoredMeta>("meta", {
      sessionCode: this.sessionCode,
      liveIndex: this.liveIndex,
      leaderId: this.leaderId,
    });
  }

  async persistSetlist(setlist: Setlist) {
    // Delete old songs
    const oldKeys: string[] = [];
    for (let i = 0; i < this.setlistInfo.songCount; i++) {
      oldKeys.push(`song:${i}`);
    }
    if (oldKeys.length > 0) {
      await this.room.storage.delete(oldKeys);
    }

    // Write new setlist info and songs
    this.setlistInfo = {
      id: setlist.id,
      name: setlist.name,
      songCount: setlist.songs.length,
    };
    await this.room.storage.put("setlist-info", this.setlistInfo);
    for (let i = 0; i < setlist.songs.length; i++) {
      await this.room.storage.put(`song:${i}`, setlist.songs[i]);
    }
  }

  async getFullSetlist(): Promise<Setlist> {
    const songs: Song[] = [];
    const entries = await this.room.storage.list<Song>({ prefix: "song:" });
    // Sort by key to maintain song order
    const sorted = [...entries.entries()].sort(([a], [b]) => {
      const numA = parseInt(a.split(":")[1]);
      const numB = parseInt(b.split(":")[1]);
      return numA - numB;
    });
    for (const [, song] of sorted) {
      songs.push(song);
    }
    return { id: this.setlistInfo.id, name: this.setlistInfo.name, songs };
  }

  // --- Build the full state snapshot ---
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

  // --- Send to one connection ---
  send(connection: Party.Connection, msg: ServerMessage) {
    connection.send(JSON.stringify(msg));
  }

  // --- Broadcast to all ---
  broadcast(msg: ServerMessage, exclude?: string[]) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }

  // --- Connection events ---

  async onConnect(connection: Party.Connection) {
    // Send current state to the new connection
    const state = await this.getState();
    this.send(connection, { type: "state", state });
  }

  async onClose(connection: Party.Connection) {
    const user = this.users.get(connection.id);
    if (!user) return;

    this.users.delete(connection.id);

    // If the leader disconnected, start the grace period
    if (this.leaderId === connection.id) {
      this.pendingLeaderDisconnect = connection.id;

      // Store disconnected leader info for potential reclaim
      await this.room.storage.put<StoredDisconnectedLeader>(
        "disconnectedLeader",
        {
          id: connection.id,
          name: user.name,
          disconnectedAt: Date.now(),
        },
      );

      // Set alarm for grace period — don't promote yet
      await this.room.storage.setAlarm(Date.now() + LEADER_GRACE_PERIOD_MS);

      // Tell followers the leader dropped
      this.broadcast({
        type: "leader-disconnected",
        graceSeconds: LEADER_GRACE_PERIOD_MS / 1000,
      });
    }

    this.broadcast({ type: "user-left", userId: connection.id });
    await this.persistMeta();
  }

  // --- Alarm: leader grace period expired ---

  async onAlarm() {
    if (this.pendingLeaderDisconnect) {
      this.pendingLeaderDisconnect = null;
      await this.room.storage.delete("disconnectedLeader");

      // Promote the first user by join order
      const remaining = Array.from(this.users.values());
      if (remaining.length > 0) {
        // Sort by joinedAt to find the earliest joiner
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

  // --- Message handling ---

  async onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      this.send(sender, { type: "error", message: "Invalid message format" });
      return;
    }

    switch (msg.type) {
      case "join":
        await this.handleJoin(sender, msg.name, msg.role, msg.reconnecting);
        break;
      case "set-song":
        await this.handleSetSong(sender, msg.index);
        break;
      case "browse":
        this.handleBrowse(sender, msg.index);
        break;
      case "go-live":
        this.handleGoLive(sender);
        break;
      case "request-state": {
        const state = await this.getState();
        this.send(sender, { type: "state", state });
        break;
      }
      case "set-setlist":
        await this.handleSetSetlist(sender, msg.setlist);
        break;
      case "transfer-lead":
        await this.handleTransferLead(sender, msg.userId);
        break;
      default:
        this.send(sender, { type: "error", message: "Unknown message type" });
    }
  }

  // --- Handlers ---

  async handleJoin(
    connection: Party.Connection,
    name: string,
    requestedRole: UserRole,
    reconnecting?: boolean,
  ) {
    // Check if this is a reconnecting leader reclaiming their role
    const disconnectedLeader =
      await this.room.storage.get<StoredDisconnectedLeader>(
        "disconnectedLeader",
      );

    let role: UserRole = requestedRole;
    let reclaimingLeadership = false;

    if (disconnectedLeader && name === disconnectedLeader.name) {
      // Original leader reconnected — reclaim leadership
      reclaimingLeadership = true;
      role = "leader";

      // Cancel the grace period alarm
      await this.room.storage.deleteAlarm();
      await this.room.storage.delete("disconnectedLeader");
      this.pendingLeaderDisconnect = null;

      // Demote current leader if someone was promoted
      if (this.leaderId && this.leaderId !== connection.id) {
        const currentLeader = this.users.get(this.leaderId);
        if (currentLeader) {
          currentLeader.role = "follower";
          this.users.set(this.leaderId, currentLeader);
        }
      }
    } else if (
      role === "leader" &&
      this.leaderId &&
      this.leaderId !== connection.id
    ) {
      // Someone else wants leader but there's already one — make them follower
      role = "follower";
    }

    const user: SessionUser = {
      id: connection.id,
      name,
      role,
      isLive: true,
      currentIndex: this.liveIndex,
      joinedAt: Date.now(),
    };

    this.users.set(connection.id, user);

    if (role === "leader") {
      this.leaderId = connection.id;
    }

    // Broadcast to others
    this.broadcast({ type: "user-joined", user }, [connection.id]);

    // If leadership was reclaimed, tell everyone
    if (reclaimingLeadership) {
      this.broadcast({
        type: "leader-changed",
        leaderId: connection.id,
        leaderName: name,
      });
    }

    // Send full state to the joiner
    const state = await this.getState();
    this.send(connection, { type: "state", state });

    await this.persistMeta();
  }

  async handleSetSong(connection: Party.Connection, index: number) {
    if (connection.id !== this.leaderId) {
      this.send(connection, {
        type: "error",
        message: "Only the leader can change the live song",
      });
      return;
    }

    if (index < 0 || index >= this.setlistInfo.songCount) {
      this.send(connection, {
        type: "error",
        message: "Song index out of range",
      });
      return;
    }

    this.liveIndex = index;

    // Update leader's own tracking
    const leader = this.users.get(connection.id);
    if (leader) {
      leader.currentIndex = index;
      this.users.set(connection.id, leader);
    }

    this.broadcast({
      type: "song-changed",
      index,
      leaderId: connection.id,
    });

    await this.persistMeta();
  }

  handleBrowse(connection: Party.Connection, index: number) {
    const user = this.users.get(connection.id);
    if (!user) return;

    user.currentIndex = index;
    user.isLive = index === this.liveIndex;
    this.users.set(connection.id, user);

    this.broadcast({ type: "user-updated", user });
  }

  handleGoLive(connection: Party.Connection) {
    const user = this.users.get(connection.id);
    if (!user) return;

    user.currentIndex = this.liveIndex;
    user.isLive = true;
    this.users.set(connection.id, user);

    this.broadcast({ type: "user-updated", user });
  }

  async handleSetSetlist(connection: Party.Connection, setlist: Setlist) {
    if (connection.id !== this.leaderId) {
      this.send(connection, {
        type: "error",
        message: "Only the leader can change the setlist",
      });
      return;
    }

    await this.persistSetlist(setlist);
    this.liveIndex = 0;

    // Reset all users to the first song
    for (const [id, user] of this.users) {
      user.currentIndex = 0;
      user.isLive = true;
      this.users.set(id, user);
    }

    const state = await this.getState();
    this.broadcast({ type: "state", state });
    await this.persistMeta();
  }

  async handleTransferLead(connection: Party.Connection, newLeaderId: string) {
    if (connection.id !== this.leaderId) {
      this.send(connection, {
        type: "error",
        message: "Only the current leader can transfer leadership",
      });
      return;
    }

    const newLeader = this.users.get(newLeaderId);
    if (!newLeader) {
      this.send(connection, { type: "error", message: "User not found" });
      return;
    }

    // Demote old leader
    const oldLeader = this.users.get(connection.id);
    if (oldLeader) {
      oldLeader.role = "follower";
      this.users.set(connection.id, oldLeader);
    }

    // Promote new leader
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

  // --- HTTP endpoint for session info (QR code target) ---

  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      const currentSongIndex = this.liveIndex;
      const currentSong = await this.room.storage.get<Song>(
        `song:${currentSongIndex}`,
      );
      return new Response(
        JSON.stringify({
          sessionCode: this.sessionCode,
          roomId: this.room.id,
          songCount: this.setlistInfo.songCount,
          setlistName: this.setlistInfo.name,
          userCount: this.users.size,
          currentSong: currentSong?.title ?? null,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
