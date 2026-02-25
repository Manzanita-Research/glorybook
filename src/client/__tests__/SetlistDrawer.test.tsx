import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetlistDrawer } from "../components/SetlistDrawer";
import type { Song, SessionUser } from "../../shared/protocol";

const testSongs: Song[] = [
  { id: "1", title: "Scarlet Begonias", key: "B", tempo: "Moderate", chart: "[B]Scarlet" },
  { id: "2", title: "Fire on the Mountain", key: "B", tempo: "Moderate", chart: "[B]Fire" },
  { id: "3", title: "Estimated Prophet", key: "E", tempo: "Moderate", chart: "[E]Estimated" },
];

const testUsers: SessionUser[] = [
  { id: "u1", name: "Jerry", role: "leader", isLive: true, currentIndex: 0, joinedAt: 1000 },
  { id: "u2", name: "Bobby", role: "follower", isLive: true, currentIndex: 0, joinedAt: 2000 },
  { id: "u3", name: "Phil", role: "follower", isLive: false, currentIndex: 2, joinedAt: 3000 },
];

describe("SetlistDrawer", () => {
  const defaultProps = {
    open: true,
    songs: testSongs,
    liveIndex: 1,
    users: [] as SessionUser[],
    leaderId: null as string | null,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  it("does not render drawer content when closed", () => {
    render(<SetlistDrawer {...defaultProps} open={false} />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("renders song list when open", () => {
    render(<SetlistDrawer {...defaultProps} />);
    expect(screen.getByText("Scarlet Begonias")).toBeInTheDocument();
    expect(screen.getByText("Fire on the Mountain")).toBeInTheDocument();
    expect(screen.getByText("Estimated Prophet")).toBeInTheDocument();
  });

  it("highlights the live song with bold text", () => {
    render(<SetlistDrawer {...defaultProps} liveIndex={1} />);
    const items = screen.getAllByRole("listitem");
    // Second item (index 1) should have font-bold
    expect(items[1].className).toContain("font-bold");
    // Other items should not
    expect(items[0].className).not.toContain("font-bold");
    expect(items[2].className).not.toContain("font-bold");
  });

  it("calls onSelect with correct index when song is tapped", async () => {
    const onSelect = vi.fn();
    render(<SetlistDrawer {...defaultProps} onSelect={onSelect} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Estimated Prophet"));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<SetlistDrawer {...defaultProps} onClose={onClose} />);
    const user = userEvent.setup();
    const backdrop = screen.getByRole("presentation");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose after song selection", async () => {
    const onClose = vi.fn();
    render(<SetlistDrawer {...defaultProps} onClose={onClose} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Scarlet Begonias"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders song numbers", () => {
    render(<SetlistDrawer {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders Setlist header", () => {
    render(<SetlistDrawer {...defaultProps} />);
    expect(screen.getByText("Setlist")).toBeInTheDocument();
  });

  // --- Presence tests ---

  it("renders PresenceList with connected users", () => {
    render(<SetlistDrawer {...defaultProps} users={testUsers} leaderId="u1" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText(/Jerry/)).toBeInTheDocument();
    expect(screen.getByText(/Bobby/)).toBeInTheDocument();
    expect(screen.getByText(/Phil/)).toBeInTheDocument();
  });

  it("shows presence status dots", () => {
    render(<SetlistDrawer {...defaultProps} users={testUsers} leaderId="u1" />);
    const liveDots = screen.getAllByLabelText("Live");
    expect(liveDots.length).toBe(2);
    liveDots.forEach((dot) => {
      expect(dot.className).toContain("bg-status-connected");
    });
    const browsingDots = screen.getAllByLabelText("Browsing");
    expect(browsingDots.length).toBe(1);
    browsingDots.forEach((dot) => {
      expect(dot.className).toContain("bg-accent-gold");
    });
  });
});
