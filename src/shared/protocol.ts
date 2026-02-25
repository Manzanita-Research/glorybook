// ============================================
// DeadSync Protocol — v2
// ============================================
// The message contract between PartyKit server and clients.
// This is the single source of truth for the sync layer.
//
// Redesigned from scratch for Phase 1: accounts for
// reconnect re-join, leader grace periods, browse/live
// dual state, and sharded storage.

// --- Song data model ---

export interface Song {
  id: string;
  title: string;
  key: string;
  tempo: string;
  notes?: string;
  chart: string; // markdown chord chart content
}

export interface Setlist {
  id: string;
  name: string;
  songs: Song[];
}

// --- Session state ---

export type UserRole = "leader" | "follower";

export interface SessionUser {
  id: string; // connection id
  name: string; // display name
  role: UserRole;
  isLive: boolean; // synced to leader's position?
  currentIndex: number; // what song they're viewing
  joinedAt: number; // Date.now() when joined — used for leader promotion order
}

export interface SessionState {
  sessionCode: string;
  setlist: Setlist;
  liveIndex: number; // the leader's current song index
  leaderId: string | null;
  users: SessionUser[];
}

// --- Messages: Client → Server ---

export type ClientMessage =
  | { type: "join"; name: string; role: UserRole; reconnecting?: boolean }
  | { type: "set-song"; index: number }
  | { type: "browse"; index: number }
  | { type: "go-live" }
  | { type: "request-state" }
  | { type: "set-setlist"; setlist: Setlist }
  | { type: "transfer-lead"; userId: string };

// --- Messages: Server → Client ---

export type ServerMessage =
  | { type: "state"; state: SessionState }
  | { type: "song-changed"; index: number; leaderId: string }
  | { type: "user-joined"; user: SessionUser }
  | { type: "user-left"; userId: string }
  | { type: "user-updated"; user: SessionUser }
  | { type: "leader-changed"; leaderId: string; leaderName: string }
  | { type: "leader-disconnected"; graceSeconds: number }
  | { type: "error"; message: string; code?: string };

// --- Utility ---

const SESSION_WORDS = [
  "stella",
  "sugar",
  "bertha",
  "althea",
  "cosmic",
  "ripple",
  "shakedown",
  "scarlet",
  "terrapin",
  "cassidy",
  "franklin",
  "sugaree",
  "brokedown",
  "truckin",
  "china",
  "rider",
] as const;

export function generateSessionCode(): string {
  const word = SESSION_WORDS[Math.floor(Math.random() * SESSION_WORDS.length)];
  const num = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `${word}-${num}`;
}
