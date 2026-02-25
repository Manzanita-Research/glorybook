import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
// Will import once Task 2 creates the component
// import { SessionScreen } from "../../components/SessionScreen";

// Mock useDeadSync hook
vi.mock("../../use-deadsync", () => ({
  useDeadSync: vi.fn().mockReturnValue({
    connected: true,
    sessionState: { users: [], liveSongIndex: 0, setlist: [] },
    myUser: null,
    isLeader: false,
    leaderDisconnected: false,
    actions: { join: vi.fn(), setSong: vi.fn(), browse: vi.fn(), goLive: vi.fn(), transferLead: vi.fn() },
  }),
}));

describe("SessionScreen", () => {
  it.todo("renders session code");
  it.todo("renders user name and role");
  it.todo("renders connection indicator");
  it.todo("shows green dot when connected");
  it.todo("shows red dot when disconnected");
  it.todo("renders connected users list");
  it.todo("calls actions.join on mount");
  it.todo("shows leader badge when user is leader");
});
