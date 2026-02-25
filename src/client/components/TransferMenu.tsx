import { useState } from "react";
import type { SessionUser } from "../../shared/protocol";

interface TransferMenuProps {
  open: boolean;
  users: SessionUser[];
  currentUserId: string | null;
  onTransfer: (userId: string) => void;
  onClose: () => void;
}

/**
 * TransferMenu — modal overlay for leadership transfer.
 *
 * Shows connected users (excluding the current user). Tapping a user
 * shows a confirmation step before calling onTransfer. Accessible via
 * long-press on the LEADER badge in SessionScreen.
 */
export function TransferMenu({
  open,
  users,
  currentUserId,
  onTransfer,
  onClose,
}: TransferMenuProps) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  if (!open) return null;

  const otherUsers = users.filter((u) => u.id !== currentUserId);
  const pendingUser = otherUsers.find((u) => u.id === pendingUserId);

  function handleClose() {
    setPendingUserId(null);
    onClose();
  }

  function handleConfirm() {
    if (pendingUserId) {
      onTransfer(pendingUserId);
      setPendingUserId(null);
      onClose();
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={handleClose}
        role="presentation"
      />

      {/* Menu panel */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 max-w-[85vw] bg-surface-raised rounded-lg border border-border z-[60] overflow-hidden"
        role="dialog"
        aria-label="Transfer Leadership"
      >
        {/* Title */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-text-primary font-medium">
            Transfer Leadership
          </h3>
        </div>

        {pendingUser ? (
          /* Confirmation view */
          <div className="px-4 py-4">
            <p className="text-text-secondary text-sm mb-4">
              Transfer leadership to{" "}
              <span className="text-text-primary font-medium">
                {pendingUser.name}
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="min-h-12 px-4 text-text-secondary"
                onClick={() => setPendingUserId(null)}
              >
                Cancel
              </button>
              <button
                className="min-h-12 px-4 bg-interactive text-surface font-medium rounded"
                onClick={handleConfirm}
              >
                Transfer
              </button>
            </div>
          </div>
        ) : otherUsers.length === 0 ? (
          /* Empty state */
          <div className="py-6 text-center">
            <p className="text-text-muted text-sm">
              No other users connected
            </p>
          </div>
        ) : (
          /* User list */
          <div>
            {otherUsers.map((user) => (
              <button
                key={user.id}
                className="w-full text-left px-4 py-3 text-text-secondary hover:bg-surface-overlay/50 hover:text-text-primary"
                onClick={() => setPendingUserId(user.id)}
              >
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
