import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { getCodeFromURL } from "../App";

// Mock the theme utilities to avoid side effects in jsdom
vi.mock("../lib/theme", () => ({
  applyTheme: vi.fn(),
  getTheme: vi.fn(() => "dark"),
}));

// Mock useDeadSync to prevent WebSocket connections
vi.mock("../use-deadsync", () => ({
  useDeadSync: vi.fn(() => ({
    connected: false,
    connectionId: null,
    sessionState: null,
    currentSong: null,
    isLeader: false,
    isLive: true,
    myUser: null,
    liveIndex: 0,
    localIndex: 0,
    leaderDisconnected: null,
    actions: {
      join: vi.fn(),
      setSong: vi.fn(),
      browse: vi.fn(),
      goLive: vi.fn(),
      setSetlist: vi.fn(),
      transferLead: vi.fn(),
      disconnect: vi.fn(),
    },
  })),
}));

describe("getCodeFromURL", () => {
  let originalLocation: Location;
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalLocation = window.location;
    replaceStateSpy = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    replaceStateSpy.mockRestore();
  });

  it("returns code from ?code= URL param", () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?code=scarlet-042", pathname: "/" },
      writable: true,
      configurable: true,
    });
    const result = getCodeFromURL();
    expect(result).toBe("scarlet-042");
  });

  it("cleans URL after reading ?code= param", () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?code=ripple-817", pathname: "/app" },
      writable: true,
      configurable: true,
    });
    getCodeFromURL();
    expect(replaceStateSpy).toHaveBeenCalledWith({}, "", "/app");
  });

  it("returns null when no ?code= param", () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "", pathname: "/" },
      writable: true,
      configurable: true,
    });
    const result = getCodeFromURL();
    expect(result).toBeNull();
  });

  it("does not call replaceState when no ?code= param", () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "", pathname: "/" },
      writable: true,
      configurable: true,
    });
    getCodeFromURL();
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });
});

describe("App with URL param integration", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("pre-fills session code from ?code= URL param", async () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "?code=scarlet-042", pathname: "/", host: "localhost:1999", origin: "http://localhost:1999" },
      writable: true,
      configurable: true,
    });

    // Dynamic import after setting location
    const { App } = await import("../App");
    render(<App />);

    const codeInput = screen.getByLabelText(/session code/i);
    expect(codeInput).toHaveValue("scarlet-042");
  });

  it("renders empty session code when no URL param", async () => {
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, search: "", pathname: "/", host: "localhost:1999", origin: "http://localhost:1999" },
      writable: true,
      configurable: true,
    });

    const { App } = await import("../App");
    render(<App />);

    const codeInput = screen.getByLabelText(/session code/i);
    expect(codeInput).toHaveValue("");
  });
});
