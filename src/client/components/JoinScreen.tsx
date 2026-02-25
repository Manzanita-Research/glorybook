import { useState, useEffect } from "react";
import type { UserRole } from "../../shared/protocol";

interface JoinScreenProps {
  onJoin: (name: string, role: UserRole, code: string) => void;
  initialCode?: string;
}

const STORAGE_KEY = "glory-name";

function getStoredName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    /* swallow — Safari private browsing */
  }
}

export function JoinScreen({ onJoin, initialCode }: JoinScreenProps) {
  const [name, setName] = useState(getStoredName);
  const [role, setRole] = useState<UserRole>("follower");
  const [code, setCode] = useState(initialCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasAttempted(true);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();

    if (!trimmedName && !trimmedCode) {
      setError("Name and session code are required");
      return;
    }
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!trimmedCode) {
      setError("Session code is required");
      return;
    }

    setError(null);
    storeName(trimmedName);
    onJoin(trimmedName, role, trimmedCode);
  }

  return (
    <div className="min-h-dvh bg-surface text-text-primary safe-area-padding flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] space-y-6"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent-gold tracking-tight">
            Glory
          </h1>
          <p className="mt-1 text-text-secondary text-lg">soar.</p>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-sm text-text-secondary"
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jerry"
            className="w-full min-h-[44px] px-3 rounded-lg bg-surface-raised border border-border text-text-primary text-lg placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            autoComplete="name"
          />
        </div>

        {/* Role selection */}
        <div className="space-y-1">
          <span className="block text-sm text-text-secondary">Role</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("leader")}
              className={`min-h-[44px] rounded-lg border text-lg font-medium transition-colors ${
                role === "leader"
                  ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "border-border bg-surface-raised text-text-secondary hover:border-text-muted"
              }`}
            >
              Leader
            </button>
            <button
              type="button"
              onClick={() => setRole("follower")}
              className={`min-h-[44px] rounded-lg border text-lg font-medium transition-colors ${
                role === "follower"
                  ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                  : "border-border bg-surface-raised text-text-secondary hover:border-text-muted"
              }`}
            >
              Follower
            </button>
          </div>
        </div>

        {/* Session code */}
        <div className="space-y-1">
          <label
            htmlFor="session-code"
            className="block text-sm text-text-secondary"
          >
            Session code
          </label>
          <input
            id="session-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="scarlet-042"
            className="w-full min-h-[44px] px-3 rounded-lg bg-surface-raised border border-border text-text-primary text-lg placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            autoComplete="off"
          />
        </div>

        {/* Join button */}
        <button
          type="submit"
          className="w-full min-h-[44px] rounded-lg bg-interactive hover:bg-interactive-hover active:bg-interactive-active text-surface font-bold text-lg transition-colors"
        >
          Join
        </button>

        {/* Error message — only after first submit attempt */}
        {hasAttempted && error && (
          <p className="text-center text-status-disconnected text-sm">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
