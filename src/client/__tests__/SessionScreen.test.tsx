import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionScreen } from "../components/SessionScreen";

// Mock useDeadSync hook
const mockJoin = vi.fn();
const mockActions = {
  join: mockJoin,
  setSong: vi.fn(),
  browse: vi.fn(),
  goLive: vi.fn(),
  setSetlist: vi.fn(),
  transferLead: vi.fn(),
  disconnect: vi.fn(),
};

const defaultMockReturn = {
  connected: true,
  connectionId: "conn-1",
  sessionState: {
    sessionCode: "scarlet-042",
    setlist: { id: "s1", name: "Test Set", songs: [] },
    liveIndex: 0,
    leaderId: null,
    users: [
      { id: "conn-1", name: "Jerry", role: "follower" as const, isLive: true, currentIndex: 0, joinedAt: Date.now() },
      { id: "conn-2", name: "Bobby", role: "leader" as const, isLive: true, currentIndex: 0, joinedAt: Date.now() },
    ],
  },
  currentSong: null,
  isLeader: false,
  isLive: true,
  myUser: { id: "conn-1", name: "Jerry", role: "follower" as const, isLive: true, currentIndex: 0, joinedAt: Date.now() },
  liveIndex: 0,
  localIndex: 0,
  leaderDisconnected: null,
  actions: mockActions,
};

let mockReturnValue = { ...defaultMockReturn };

vi.mock("../use-deadsync", () => ({
  useDeadSync: vi.fn(() => mockReturnValue),
}));

describe("SessionScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturnValue = { ...defaultMockReturn, actions: { ...mockActions, join: mockJoin } };
  });

  it("renders session code", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(screen.getByText("scarlet-042")).toBeInTheDocument();
  });

  it("renders user name and role", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    const jerryElements = screen.getAllByText(/Jerry/);
    expect(jerryElements.length).toBeGreaterThanOrEqual(1);
    const followerElements = screen.getAllByText(/follower/i);
    expect(followerElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders connection indicator", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows green dot when connected", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveAttribute("aria-label", "Connected");
  });

  it("shows red dot when disconnected", () => {
    mockReturnValue = { ...defaultMockReturn, connected: false, actions: mockActions };
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveAttribute("aria-label", "Disconnected");
  });

  it("renders current user name in session header", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    // Name appears in the compact session header row (Phase 5 will add full user list)
    expect(screen.getByText(/Jerry/)).toBeInTheDocument();
  });

  it("calls actions.join on mount", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(mockJoin).toHaveBeenCalledWith("Jerry", "follower");
  });

  it("shows leader badge when user is leader", () => {
    mockReturnValue = { ...defaultMockReturn, isLeader: true, actions: mockActions };
    render(<SessionScreen name="Jerry" role="leader" code="scarlet-042" />);
    // The star symbol should appear in the header for the user
    const leaderStars = screen.getAllByText("★");
    expect(leaderStars.length).toBeGreaterThanOrEqual(1);
  });
});
