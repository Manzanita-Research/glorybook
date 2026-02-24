// ============================================
// DeadSync Protocol
// ============================================
// The message format between PartyKit server and clients.
// This is the single source of truth for the sync layer.

// --- Song data model ---

export interface Song {
  id: string;
  title: string;
  key: string;
  tempo: string;
  notes?: string;
  chart: string; // markdown/chord chart content
}

export interface Setlist {
  id: string;
  name: string;
  songs: Song[];
}

// --- Session state ---

export type UserRole = "leader" | "follower";

export interface SessionUser {
  id: string;       // connection id
  name: string;     // display name
  role: UserRole;
  isLive: boolean;  // are they synced to leader's position?
  currentIndex: number; // what song they're actually viewing
}

export interface SessionState {
  sessionCode: string;
  setlist: Setlist;
  liveIndex: number;     // the leader's current song index
  leaderId: string | null;
  users: SessionUser[];
}

// --- Messages: Client → Server ---

export type ClientMessage =
  | { type: "join"; name: string; role: UserRole }
  | { type: "set-song"; index: number }       // leader sets the live song
  | { type: "browse"; index: number }          // follower browsing independently
  | { type: "go-live" }                        // follower snaps back to leader
  | { type: "request-state" }                  // ask for full state on connect
  | { type: "set-setlist"; setlist: Setlist }   // leader loads a setlist
  | { type: "transfer-lead"; userId: string }; // hand off leader role

// --- Messages: Server → Client ---

export type ServerMessage =
  | { type: "state"; state: SessionState }                    // full state sync
  | { type: "song-changed"; index: number; leaderId: string } // leader moved
  | { type: "user-joined"; user: SessionUser }
  | { type: "user-left"; userId: string }
  | { type: "user-updated"; user: SessionUser }
  | { type: "leader-changed"; leaderId: string; leaderName: string }
  | { type: "error"; message: string };

// --- Utility ---

export function generateSessionCode(): string {
  const words = [
    "stella", "sugar", "bertha", "althea", "cosmic", "ripple",
    "shakedown", "scarlet", "terrapin", "cassidy", "franklin",
    "sugaree", "brokedown", "truckin", "china", "rider"
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `${word}-${num}`;
}
