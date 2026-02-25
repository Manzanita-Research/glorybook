import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoLiveBanner } from "../components/GoLiveBanner";

describe("GoLiveBanner", () => {
  it("renders GO LIVE text", () => {
    render(<GoLiveBanner onGoLive={vi.fn()} />);
    expect(screen.getByText("GO LIVE")).toBeInTheDocument();
  });

  it("calls onGoLive callback when clicked", async () => {
    const onGoLive = vi.fn();
    render(<GoLiveBanner onGoLive={onGoLive} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("GO LIVE"));
    expect(onGoLive).toHaveBeenCalledOnce();
  });

  it("has accessible aria-label", () => {
    render(<GoLiveBanner onGoLive={vi.fn()} />);
    expect(
      screen.getByLabelText("Go live — return to current song"),
    ).toBeInTheDocument();
  });

  it("applies pulse animation class when pulse prop is true", () => {
    render(<GoLiveBanner onGoLive={vi.fn()} pulse={true} />);
    const button = screen.getByText("GO LIVE");
    expect(button.className).toContain("animate-[pulse-once");
  });

  it("does not apply pulse class when pulse is false", () => {
    render(<GoLiveBanner onGoLive={vi.fn()} pulse={false} />);
    const button = screen.getByText("GO LIVE");
    expect(button.className).not.toContain("animate-[pulse-once");
  });

  it("does not apply pulse class when pulse is undefined", () => {
    render(<GoLiveBanner onGoLive={vi.fn()} />);
    const button = screen.getByText("GO LIVE");
    expect(button.className).not.toContain("animate-[pulse-once");
  });
});
