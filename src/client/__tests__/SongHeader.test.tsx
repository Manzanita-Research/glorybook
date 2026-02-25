import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SongHeader } from "../components/SongHeader";
import type { Song } from "../../shared/protocol";

const mockSong: Song = {
  id: "scarlet",
  title: "Scarlet Begonias",
  key: "E",
  tempo: "Medium-fast",
  notes: "Capo 2 for studio key",
  chart: "",
};

describe("SongHeader", () => {
  it("renders song title", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Scarlet Begonias")).toBeInTheDocument();
  });

  it("renders key value", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    expect(screen.getByText("E")).toBeInTheDocument();
  });

  it("renders tempo", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Medium-fast")).toBeInTheDocument();
  });

  it("renders position as N of M", () => {
    render(<SongHeader song={mockSong} position={3} total={10} />);
    expect(screen.getByText("3 of 10")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Capo 2 for studio key")).toBeInTheDocument();
  });

  it("does not render notes section when notes is undefined", () => {
    const songNoNotes: Song = { ...mockSong, notes: undefined };
    render(<SongHeader song={songNoNotes} position={1} total={8} />);
    expect(screen.queryByText("Capo 2 for studio key")).not.toBeInTheDocument();
  });

  it("renders Key: label", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    expect(screen.getByText("Key:")).toBeInTheDocument();
  });

  it("key value has accent-gold styling", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    const keyValue = screen.getByText("E");
    expect(keyValue).toHaveClass("text-accent-gold");
  });

  it("title has bold large styling", () => {
    render(<SongHeader song={mockSong} position={1} total={8} />);
    const title = screen.getByText("Scarlet Begonias");
    expect(title).toHaveClass("font-bold");
  });

  it("position 1 of 1 renders correctly for single-song setlists", () => {
    render(<SongHeader song={mockSong} position={1} total={1} />);
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
  });
});
