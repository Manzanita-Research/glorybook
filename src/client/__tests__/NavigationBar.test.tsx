import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavigationBar } from "../components/NavigationBar";

describe("NavigationBar", () => {
  const defaultProps = {
    songTitle: "Scarlet Begonias",
    position: 3,
    total: 8,
    onPrev: vi.fn(),
    onNext: vi.fn(),
  };

  it("renders song title and position text", () => {
    render(<NavigationBar {...defaultProps} />);
    expect(screen.getByText("Scarlet Begonias")).toBeInTheDocument();
    expect(screen.getByText("3 of 8")).toBeInTheDocument();
  });

  it("disables prev button when position is 1", () => {
    render(<NavigationBar {...defaultProps} position={1} />);
    const prevButton = screen.getByLabelText("Previous song");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button when position equals total", () => {
    render(<NavigationBar {...defaultProps} position={8} />);
    const nextButton = screen.getByLabelText("Next song");
    expect(nextButton).toBeDisabled();
  });

  it("enables both buttons for middle positions", () => {
    render(<NavigationBar {...defaultProps} />);
    const prevButton = screen.getByLabelText("Previous song");
    const nextButton = screen.getByLabelText("Next song");
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("calls onPrev when prev button is clicked", async () => {
    const onPrev = vi.fn();
    render(<NavigationBar {...defaultProps} onPrev={onPrev} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Previous song"));
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it("calls onNext when next button is clicked", async () => {
    const onNext = vi.fn();
    render(<NavigationBar {...defaultProps} onNext={onNext} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Next song"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("does not call onPrev when disabled button is clicked", async () => {
    const onPrev = vi.fn();
    render(<NavigationBar {...defaultProps} position={1} onPrev={onPrev} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Previous song"));
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("does not call onNext when disabled button is clicked", async () => {
    const onNext = vi.fn();
    render(
      <NavigationBar {...defaultProps} position={8} total={8} onNext={onNext} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Next song"));
    expect(onNext).not.toHaveBeenCalled();
  });
});
