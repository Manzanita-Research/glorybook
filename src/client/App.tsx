import { useState, useEffect } from "react";
import { JoinScreen } from "./components/JoinScreen";
import { SessionScreen } from "./components/SessionScreen";
import { ThemeToggle } from "./components/ThemeToggle";
import { applyTheme, getTheme } from "./lib/theme";
import type { UserRole } from "../shared/protocol";

interface JoinConfig {
  name: string;
  role: UserRole;
  code: string;
}

/** Read ?code= from URL and clean up so refresh doesn't re-trigger */
export function getCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return code;
}

export function App() {
  const [joinConfig, setJoinConfig] = useState<JoinConfig | null>(null);
  const [initialCode] = useState(() => getCodeFromURL());

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  function handleJoin(name: string, role: UserRole, code: string) {
    setJoinConfig({ name, role, code });
  }

  return (
    <>
      <ThemeToggle />
      {joinConfig ? (
        <SessionScreen
          name={joinConfig.name}
          role={joinConfig.role}
          code={joinConfig.code}
        />
      ) : (
        <JoinScreen onJoin={handleJoin} initialCode={initialCode ?? undefined} />
      )}
    </>
  );
}
