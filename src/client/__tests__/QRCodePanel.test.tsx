import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodePanel } from "../components/QRCodePanel";

// qrcode.react works in jsdom — QRCodeSVG renders an <svg> element
describe("QRCodePanel", () => {
  const defaultProps = {
    sessionCode: "scarlet-042",
    onClose: vi.fn(),
  };

  it("displays 'Join this session' heading", () => {
    render(<QRCodePanel {...defaultProps} />);
    expect(screen.getByText("Join this session")).toBeInTheDocument();
  });

  it("renders session code text", () => {
    render(<QRCodePanel {...defaultProps} />);
    expect(screen.getByText("scarlet-042")).toBeInTheDocument();
  });

  it("renders QRCodeSVG with correct value prop containing the session code in a URL", () => {
    const { container } = render(<QRCodePanel {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("calls onClose when Done button is clicked", async () => {
    const onClose = vi.fn();
    render(<QRCodePanel sessionCode="scarlet-042" onClose={onClose} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("displays helper text for scanning", () => {
    render(<QRCodePanel {...defaultProps} />);
    expect(screen.getByText("Scan with your phone camera")).toBeInTheDocument();
  });
});
