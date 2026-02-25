import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransferMenu } from "../components/TransferMenu";
import type { SessionUser } from "../../shared/protocol";

const testUsers: SessionUser[] = [
  { id: "conn-1", name: "Jerry", role: "leader", isLive: true, currentIndex: 0, joinedAt: Date.now() },
  { id: "conn-2", name: "Bobby", role: "follower", isLive: true, currentIndex: 0, joinedAt: Date.now() },
  { id: "conn-3", name: "Phil", role: "follower", isLive: true, currentIndex: 0, joinedAt: Date.now() },
];

describe("TransferMenu", () => {
  const defaultProps = {
    open: true,
    users: testUsers,
    currentUserId: "conn-1",
    onTransfer: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders nothing when closed", () => {
    const { container } = render(<TransferMenu {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders user list excluding current user when open", () => {
    render(<TransferMenu {...defaultProps} />);
    expect(screen.getByText("Bobby")).toBeInTheDocument();
    expect(screen.getByText("Phil")).toBeInTheDocument();
    expect(screen.queryByText("Jerry")).not.toBeInTheDocument();
  });

  it("shows confirmation when a user is tapped", async () => {
    render(<TransferMenu {...defaultProps} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Bobby"));
    expect(screen.getByText(/Transfer leadership to/)).toBeInTheDocument();
    expect(screen.getByText("Bobby", { selector: "span" })).toBeInTheDocument();
  });

  it("calls onTransfer with correct userId after confirmation", async () => {
    const onTransfer = vi.fn();
    render(<TransferMenu {...defaultProps} onTransfer={onTransfer} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Bobby"));
    await user.click(screen.getByText("Transfer"));
    expect(onTransfer).toHaveBeenCalledWith("conn-2");
  });

  it("cancels confirmation without transferring", async () => {
    const onTransfer = vi.fn();
    render(<TransferMenu {...defaultProps} onTransfer={onTransfer} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Bobby"));
    await user.click(screen.getByText("Cancel"));
    expect(onTransfer).not.toHaveBeenCalled();
    // Should be back to user list
    expect(screen.getByText("Bobby")).toBeInTheDocument();
    expect(screen.getByText("Phil")).toBeInTheDocument();
  });

  it("shows empty state when no other users exist", () => {
    const singleUser: SessionUser[] = [testUsers[0]];
    render(<TransferMenu {...defaultProps} users={singleUser} />);
    expect(screen.getByText("No other users connected")).toBeInTheDocument();
  });

  it("renders Transfer Leadership title", () => {
    render(<TransferMenu {...defaultProps} />);
    expect(screen.getByText("Transfer Leadership")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<TransferMenu {...defaultProps} onClose={onClose} />);
    const user = userEvent.setup();
    const backdrop = screen.getByRole("presentation");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
