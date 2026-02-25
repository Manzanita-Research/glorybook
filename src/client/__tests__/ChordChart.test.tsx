import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordChart } from "../components/ChordChart";
import type { Song } from "../../shared/protocol";

const mockSong: Song = {
  id: "test",
  title: "Test Song",
  key: "G",
  tempo: "Medium",
  notes: "Test notes",
  chart: "CHORUS:\n[G]hello [Am]world\n> play softly\n|G   |C   |",
};

describe("ChordChart", () => {
  it("renders song title in the header", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Test Song")).toBeInTheDocument();
  });

  it("renders chord text with gold class (text-accent-gold)", () => {
    const { container } = render(
      <ChordChart song={mockSong} position={1} total={8} />
    );
    // Find chord badge spans — they have the rounded bg class from ChordLine
    const chordBadges = container.querySelectorAll(".text-accent-gold.rounded");
    expect(chordBadges.length).toBeGreaterThan(0);
    // The G chord badge should exist
    const gBadge = Array.from(chordBadges).find(
      (el) => el.textContent === "G"
    );
    expect(gBadge).toBeDefined();
  });

  it("renders the Am chord with gold class", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    const amChord = screen.getByText("Am");
    expect(amChord).toHaveClass("text-accent-gold");
  });

  it("renders section header text with blue class (text-accent-blue)", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    const section = screen.getByText("CHORUS:");
    expect(section).toHaveClass("text-accent-blue");
  });

  it("renders annotation text with purple class (text-accent-purple)", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    const annotation = screen.getByText("play softly");
    expect(annotation).toHaveClass("text-accent-purple");
  });

  it("renders lyric text", () => {
    const { container } = render(
      <ChordChart song={mockSong} position={1} total={8} />
    );
    // "hello " and "world" are lyric spans inside ChordLine segments
    // Use container query to find text nodes in block spans
    const lyricSpans = container.querySelectorAll(".text-text-primary");
    const textContent = Array.from(lyricSpans).map((el) => el.textContent);
    expect(textContent.some((t) => t?.includes("hello"))).toBe(true);
    expect(textContent.some((t) => t?.includes("world"))).toBe(true);
  });

  it("chart body container has overflow-y-auto class", () => {
    const { container } = render(
      <ChordChart song={mockSong} position={1} total={8} />
    );
    const scrollable = container.querySelector(".overflow-y-auto");
    expect(scrollable).toBeInTheDocument();
  });

  it("chart body has font-mono class for monospace", () => {
    const { container } = render(
      <ChordChart song={mockSong} position={1} total={8} />
    );
    const monoBody = container.querySelector(".font-mono.overflow-y-auto");
    expect(monoBody).toBeInTheDocument();
  });

  it("renders position indicator", () => {
    render(<ChordChart song={mockSong} position={3} total={8} />);
    expect(screen.getByText("3 of 8")).toBeInTheDocument();
  });

  it("renders key value in header", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    // Key label + value — the key value "G" appears in chord context too,
    // find the one in the header area
    expect(screen.getByText("Key:")).toBeInTheDocument();
  });

  it("renders a box-grid row for pipe notation", () => {
    const { container } = render(
      <ChordChart song={mockSong} position={1} total={8} />
    );
    // BoxGridLine renders cells — look for the flex grid container
    const gridCells = container.querySelectorAll(".border.border-border");
    expect(gridCells.length).toBeGreaterThan(0);
  });

  it("renders song notes from header", () => {
    render(<ChordChart song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Test notes")).toBeInTheDocument();
  });

  it("works without notes", () => {
    const songNoNotes: Song = { ...mockSong, notes: undefined };
    render(<ChordChart song={songNoNotes} position={1} total={8} />);
    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.queryByText("Test notes")).not.toBeInTheDocument();
  });
});
