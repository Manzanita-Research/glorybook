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

export function App() {
  const [joinConfig, setJoinConfig] = useState<JoinConfig | null>(null);

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
        <JoinScreen onJoin={handleJoin} />
      )}
    </>
  );
}
