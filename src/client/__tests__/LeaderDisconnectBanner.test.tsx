import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderDisconnectBanner } from "../components/LeaderDisconnectBanner";

describe("LeaderDisconnectBanner", () => {
  it("renders 'Leader reconnecting...' text", () => {
    render(<LeaderDisconnectBanner />);
    expect(screen.getByText("Leader reconnecting...")).toBeInTheDocument();
  });

  it("has role='status' for accessibility", () => {
    render(<LeaderDisconnectBanner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Leader reconnecting...",
    );
  });

  it("has aria-live='polite' for non-intrusive screen reader announcements", () => {
    render(<LeaderDisconnectBanner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
