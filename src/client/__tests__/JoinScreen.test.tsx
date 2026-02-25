import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinScreen } from "../components/JoinScreen";

describe("JoinScreen", () => {
  const mockOnJoin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders name input field", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it("renders role selection (leader and follower)", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.getByRole("button", { name: /leader/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /follower/i })).toBeInTheDocument();
  });

  it("renders session code input with placeholder hint", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    const codeInput = screen.getByLabelText(/session code/i);
    expect(codeInput).toBeInTheDocument();
    expect(codeInput).toHaveAttribute("placeholder", "scarlet-042");
  });

  it("renders Glory branding with soar. tagline", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.getByText("Glory")).toBeInTheDocument();
    expect(screen.getByText("soar.")).toBeInTheDocument();
  });

  it("renders join button", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
  });

  it("pre-fills name from localStorage", () => {
    localStorage.setItem("glory-name", "Bobby");
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.getByLabelText(/your name/i)).toHaveValue("Bobby");
  });

  it("shows error when submitting with empty name", async () => {
    const user = userEvent.setup();
    render(<JoinScreen onJoin={mockOnJoin} />);

    const codeInput = screen.getByLabelText(/session code/i);
    await user.type(codeInput, "scarlet-042");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(mockOnJoin).not.toHaveBeenCalled();
  });

  it("shows error when submitting with empty session code", async () => {
    const user = userEvent.setup();
    render(<JoinScreen onJoin={mockOnJoin} />);

    const nameInput = screen.getByLabelText(/your name/i);
    await user.type(nameInput, "Jerry");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(screen.getByText(/session code is required/i)).toBeInTheDocument();
    expect(mockOnJoin).not.toHaveBeenCalled();
  });

  it("does not show error before first submit attempt", () => {
    render(<JoinScreen onJoin={mockOnJoin} />);
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it("calls onJoin with name, role, and code on valid submit", async () => {
    const user = userEvent.setup();
    render(<JoinScreen onJoin={mockOnJoin} />);

    await user.type(screen.getByLabelText(/your name/i), "Jerry");
    await user.click(screen.getByRole("button", { name: /leader/i }));
    await user.type(screen.getByLabelText(/session code/i), "scarlet-042");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(mockOnJoin).toHaveBeenCalledWith("Jerry", "leader", "scarlet-042");
  });

  it("saves name to localStorage on successful join", async () => {
    const user = userEvent.setup();
    render(<JoinScreen onJoin={mockOnJoin} />);

    await user.type(screen.getByLabelText(/your name/i), "Jerry");
    await user.type(screen.getByLabelText(/session code/i), "ripple-123");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(localStorage.getItem("glory-name")).toBe("Jerry");
  });

  it("defaults role to follower", async () => {
    const user = userEvent.setup();
    render(<JoinScreen onJoin={mockOnJoin} />);

    await user.type(screen.getByLabelText(/your name/i), "Bobby");
    await user.type(screen.getByLabelText(/session code/i), "china-456");
    await user.click(screen.getByRole("button", { name: /^join$/i }));

    expect(mockOnJoin).toHaveBeenCalledWith("Bobby", "follower", "china-456");
  });
});
