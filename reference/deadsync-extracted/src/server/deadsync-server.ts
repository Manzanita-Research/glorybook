// ============================================
// DeadSync PartyKit Server
// ============================================
// Each "room" is a jam session. The server holds
// the canonical state: who's connected, who's leading,
// and what song we're on.
//
// Deploy to PartyKit cloud for rehearsals-from-anywhere,
// or run locally on a Mac mini at the venue.

import type * as Party from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  SessionState,
  SessionUser,
  Setlist,
} from "../shared/protocol";
import { generateSessionCode } from "../shared/protocol";

// Default setlist — will be replaceable by the leader
import { DEFAULT_SETLIST } from "../shared/default-setlist";

export default class DeadSyncServer implements Party.Server {
  // --- In-memory state ---
  sessionCode: string = "";
  setlist: Setlist = DEFAULT_SETLIST;
  liveIndex: number = 0;
  leaderId: string | null = null;
  users: Map<string, SessionUser> = new Map();

  constructor(readonly room: Party.Room) {}

  // --- Lifecycle: load state on start ---
  async onStart() {
    // Restore persisted state if it exists
    const stored = await this.room.storage.get<{
      sessionCode: string;
      setlist: Setlist;
      liveIndex: number;
      leaderId: string | null;
    }>("session");

    if (stored) {
      this.sessionCode = stored.sessionCode;
      this.setlist = stored.setlist;
      this.liveIndex = stored.liveIndex;
      this.leaderId = stored.leaderId;
    } else {
      this.sessionCode = generateSessionCode();
    }
  }

  // --- Persist state ---
  async persistState() {
    await this.room.storage.put("session", {
      sessionCode: this.sessionCode,
      setlist: this.setlist,
      liveIndex: this.liveIndex,
      leaderId: this.leaderId,
    });
  }

  // --- Build the full state snapshot ---
  getState(): SessionState {
    return {
      sessionCode: this.sessionCode,
      setlist: this.setlist,
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

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to the new connection immediately
    this.send(connection, { type: "state", state: this.getState() });
  }

  onClose(connection: Party.Connection) {
    const user = this.users.get(connection.id);
    if (!user) return;

    this.users.delete(connection.id);

    // If the leader left, promote someone else or clear
    if (this.leaderId === connection.id) {
      const remaining = Array.from(this.users.values());
      if (remaining.length > 0) {
        // Promote the first remaining user
        const newLeader = remaining[0];
        newLeader.role = "leader";
        this.leaderId = newLeader.id;
        this.users.set(newLeader.id, newLeader);

        this.broadcast({
          type: "leader-changed",
          leaderId: newLeader.id,
          leaderName: newLeader.name,
        });
      } else {
        this.leaderId = null;
      }
    }

    this.broadcast({ type: "user-left", userId: connection.id });
    this.persistState();
  }

  // --- Message handling ---

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message as string);
    } catch {
      this.send(sender, { type: "error", message: "Invalid message format" });
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name, msg.role);
        break;

      case "set-song":
        this.handleSetSong(sender, msg.index);
        break;

      case "browse":
        this.handleBrowse(sender, msg.index);
        break;

      case "go-live":
        this.handleGoLive(sender);
        break;

      case "request-state":
        this.send(sender, { type: "state", state: this.getState() });
        break;

      case "set-setlist":
        this.handleSetSetlist(sender, msg.setlist);
        break;

      case "transfer-lead":
        this.handleTransferLead(sender, msg.userId);
        break;

      default:
        this.send(sender, { type: "error", message: "Unknown message type" });
    }
  }

  // --- Handlers ---

  handleJoin(connection: Party.Connection, name: string, requestedRole: string) {
    // If someone wants to be leader and there's already a leader, make them follower
    let role: "leader" | "follower" = requestedRole as "leader" | "follower";
    if (role === "leader" && this.leaderId && this.leaderId !== connection.id) {
      role = "follower";
    }

    const user: SessionUser = {
      id: connection.id,
      name,
      role,
      isLive: true,
      currentIndex: this.liveIndex,
    };

    this.users.set(connection.id, user);

    if (role === "leader") {
      this.leaderId = connection.id;
    }

    // Tell everyone about the new user
    this.broadcast({ type: "user-joined", user }, [connection.id]);

    // Send full state to the joiner
    this.send(connection, { type: "state", state: this.getState() });

    this.persistState();
  }

  handleSetSong(connection: Party.Connection, index: number) {
    // Only the leader can set the live song
    if (connection.id !== this.leaderId) {
      this.send(connection, {
        type: "error",
        message: "Only the leader can change the live song",
      });
      return;
    }

    if (index < 0 || index >= this.setlist.songs.length) {
      this.send(connection, { type: "error", message: "Song index out of range" });
      return;
    }

    this.liveIndex = index;

    // Update leader's own tracking
    const leader = this.users.get(connection.id);
    if (leader) {
      leader.currentIndex = index;
      this.users.set(connection.id, leader);
    }

    // Broadcast to ALL (including leader for confirmation)
    this.broadcast({
      type: "song-changed",
      index,
      leaderId: connection.id,
    });

    this.persistState();
  }

  handleBrowse(connection: Party.Connection, index: number) {
    const user = this.users.get(connection.id);
    if (!user) return;

    user.currentIndex = index;
    user.isLive = index === this.liveIndex;
    this.users.set(connection.id, user);

    // Let others know this user is browsing
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

  handleSetSetlist(connection: Party.Connection, setlist: Setlist) {
    // Only the leader can change the setlist
    if (connection.id !== this.leaderId) {
      this.send(connection, {
        type: "error",
        message: "Only the leader can change the setlist",
      });
      return;
    }

    this.setlist = setlist;
    this.liveIndex = 0;

    // Reset all users to the first song
    for (const [id, user] of this.users) {
      user.currentIndex = 0;
      user.isLive = true;
      this.users.set(id, user);
    }

    // Full state sync for everyone
    this.broadcast({ type: "state", state: this.getState() });
    this.persistState();
  }

  handleTransferLead(connection: Party.Connection, newLeaderId: string) {
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

    this.persistState();
  }

  // --- HTTP endpoint for session info (QR code target) ---

  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          sessionCode: this.sessionCode,
          roomId: this.room.id,
          songCount: this.setlist.songs.length,
          setlistName: this.setlist.name,
          userCount: this.users.size,
          currentSong: this.setlist.songs[this.liveIndex]?.title ?? null,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
