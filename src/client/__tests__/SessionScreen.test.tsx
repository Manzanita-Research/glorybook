import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionScreen } from "../components/SessionScreen";

// Mock useDeadSync hook
const mockJoin = vi.fn();
const mockSetSong = vi.fn();
const mockBrowse = vi.fn();
const mockActions = {
  join: mockJoin,
  setSong: mockSetSong,
  browse: mockBrowse,
  goLive: vi.fn(),
  setSetlist: vi.fn(),
  transferLead: vi.fn(),
  disconnect: vi.fn(),
};

const testSongs = [
  { id: "1", title: "Scarlet Begonias", key: "B", tempo: "Moderate", chart: "[B]Scarlet" },
  { id: "2", title: "Fire on the Mountain", key: "B", tempo: "Moderate", chart: "[B]Fire" },
  { id: "3", title: "Estimated Prophet", key: "E", tempo: "Moderate", chart: "[E]Estimated" },
];

const defaultMockReturn = {
  connected: true,
  connectionId: "conn-1",
  sessionState: {
    sessionCode: "scarlet-042",
    setlist: { id: "s1", name: "Test Set", songs: testSongs },
    liveIndex: 0,
    leaderId: null,
    users: [
      { id: "conn-1", name: "Jerry", role: "follower" as const, isLive: true, currentIndex: 0, joinedAt: Date.now() },
      { id: "conn-2", name: "Bobby", role: "leader" as const, isLive: true, currentIndex: 0, joinedAt: Date.now() },
    ],
  },
  currentSong: testSongs[0],
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
    mockReturnValue = {
      ...defaultMockReturn,
      actions: { ...mockActions, join: mockJoin, setSong: mockSetSong, browse: mockBrowse },
    };
  });

  it("renders session code", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(screen.getByText("scarlet-042")).toBeInTheDocument();
  });

  it("renders user name and follower role", () => {
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

  it("calls actions.join on mount", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(mockJoin).toHaveBeenCalledWith("Jerry", "follower");
  });

  it("shows LEADER badge when user is leader", () => {
    mockReturnValue = { ...defaultMockReturn, isLeader: true, actions: mockActions };
    render(<SessionScreen name="Jerry" role="leader" code="scarlet-042" />);
    expect(screen.getByText("LEADER")).toBeInTheDocument();
  });

  it("shows follower text when user is not leader", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    const followerElements = screen.getAllByText(/follower/i);
    expect(followerElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders NavigationBar with correct song title", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    // Song title appears in both SongHeader and NavigationBar
    const titles = screen.getAllByText("Scarlet Begonias");
    expect(titles.length).toBeGreaterThanOrEqual(2);
    // Position appears in both SongHeader ("1 of 3") and NavigationBar ("1 of 3")
    const positions = screen.getAllByText("1 of 3");
    expect(positions.length).toBeGreaterThanOrEqual(1);
  });

  it("renders prev and next buttons", () => {
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    expect(screen.getByLabelText("Previous song")).toBeInTheDocument();
    expect(screen.getByLabelText("Next song")).toBeInTheDocument();
  });

  it("leader pressing next calls actions.setSong", async () => {
    mockReturnValue = { ...defaultMockReturn, isLeader: true, actions: { ...mockActions, setSong: mockSetSong } };
    render(<SessionScreen name="Jerry" role="leader" code="scarlet-042" />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Next song"));
    expect(mockSetSong).toHaveBeenCalledWith(1);
  });

  it("follower pressing next calls actions.browse", async () => {
    mockReturnValue = { ...defaultMockReturn, isLeader: false, actions: { ...mockActions, browse: mockBrowse } };
    render(<SessionScreen name="Jerry" role="follower" code="scarlet-042" />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Next song"));
    expect(mockBrowse).toHaveBeenCalledWith(1);
  });
});
