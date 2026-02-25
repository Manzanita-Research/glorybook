import type { Song } from "../../shared/protocol";

interface SetlistDrawerProps {
  open: boolean;
  songs: Song[];
  liveIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/**
 * SetlistDrawer — slide-out panel listing all songs in the setlist.
 *
 * The live song is highlighted with a gold left accent bar and bold text.
 * Tapping a song browses to it locally (does NOT change the live song
 * for others). Drawer closes on song selection or backdrop tap.
 */
export function SetlistDrawer({
  open,
  songs,
  liveIndex,
  onSelect,
  onClose,
}: SetlistDrawerProps) {
  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          role="presentation"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-surface-raised z-50 flex flex-col
          transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-label="Setlist"
        aria-hidden={!open}
      >
        {/* Drawer header */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-text-primary font-bold text-lg">Setlist</h3>
        </div>

        {/* Song list */}
        <ul className="flex-1 overflow-y-auto">
          {songs.map((song, index) => {
            const isLive = index === liveIndex;
            return (
              <li
                key={song.id}
                className={`px-4 py-3 cursor-pointer flex items-center gap-3 hover:bg-surface-overlay/50
                  ${
                    isLive
                      ? "border-l-4 border-accent-gold font-bold text-text-primary bg-surface-overlay/30"
                      : "border-l-4 border-transparent text-text-secondary"
                  }`}
                onClick={() => {
                  onSelect(index);
                  onClose();
                }}
              >
                <span className="text-sm text-text-muted w-6 text-right shrink-0">
                  {index + 1}
                </span>
                <span className="truncate">{song.title}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
