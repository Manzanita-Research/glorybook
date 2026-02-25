import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PresenceList } from "../components/PresenceList";
import type { SessionUser } from "../../shared/protocol";

const testUsers: SessionUser[] = [
  { id: "u1", name: "Jerry", role: "leader", isLive: true, currentIndex: 0, joinedAt: 1000 },
  { id: "u2", name: "Bobby", role: "follower", isLive: true, currentIndex: 0, joinedAt: 2000 },
  { id: "u3", name: "Phil", role: "follower", isLive: false, currentIndex: 2, joinedAt: 3000 },
];

describe("PresenceList", () => {
  it('renders "Connected" heading', () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders all user names", () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    expect(screen.getByText(/Jerry/)).toBeInTheDocument();
    expect(screen.getByText(/Bobby/)).toBeInTheDocument();
    expect(screen.getByText(/Phil/)).toBeInTheDocument();
  });

  it("shows green dot for users with isLive=true", () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    const liveDots = screen.getAllByLabelText("Live");
    expect(liveDots.length).toBe(2); // Jerry and Bobby are live
    liveDots.forEach((dot) => {
      expect(dot.className).toContain("bg-status-connected");
    });
  });

  it("shows gold dot for users with isLive=false", () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    const browsingDots = screen.getAllByLabelText("Browsing");
    expect(browsingDots.length).toBe(1); // Phil is browsing
    browsingDots.forEach((dot) => {
      expect(dot.className).toContain("bg-accent-gold");
    });
  });

  it('shows "(lead)" label next to the leader', () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    expect(screen.getByText("(lead)")).toBeInTheDocument();
  });

  it('does not show "(lead)" for non-leader users', () => {
    render(<PresenceList users={testUsers} leaderId="u1" />);
    const leadLabels = screen.getAllByText("(lead)");
    expect(leadLabels.length).toBe(1);
  });

  it("handles empty users array gracefully", () => {
    render(<PresenceList users={[]} leaderId={null} />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("dot has correct aria-label for live user", () => {
    const singleUser: SessionUser[] = [
      { id: "u1", name: "Jerry", role: "leader", isLive: true, currentIndex: 0, joinedAt: 1000 },
    ];
    render(<PresenceList users={singleUser} leaderId="u1" />);
    expect(screen.getByLabelText("Live")).toBeInTheDocument();
  });

  it("dot has correct aria-label for browsing user", () => {
    const singleUser: SessionUser[] = [
      { id: "u1", name: "Phil", role: "follower", isLive: false, currentIndex: 2, joinedAt: 1000 },
    ];
    render(<PresenceList users={singleUser} leaderId={null} />);
    expect(screen.getByLabelText("Browsing")).toBeInTheDocument();
  });
});
