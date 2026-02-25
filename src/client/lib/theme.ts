export type Theme = "warm-dark" | "oled-black";

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem("glory-theme");
    if (stored === "warm-dark" || stored === "oled-black") return stored;
  } catch {
    /* swallow — Safari private browsing throws on localStorage access */
  }
  return "warm-dark";
}

export function applyTheme(theme: Theme): void {
  try {
    localStorage.setItem("glory-theme", theme);
  } catch {
    /* swallow */
  }
  const html = document.documentElement;
  html.classList.add("dark");
  html.classList.toggle("oled", theme === "oled-black");
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === "warm-dark" ? "oled-black" : "warm-dark";
  applyTheme(next);
  return next;
}
