import { describe, it, expect, beforeEach } from "vitest";

// Will import from ../../lib/theme once Task 1 creates it
// import { getTheme, applyTheme, toggleTheme } from "../../lib/theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it.todo("getTheme returns warm-dark by default");
  it.todo("getTheme returns stored preference from localStorage");
  it.todo("applyTheme sets .dark class on html element");
  it.todo("applyTheme adds .oled class for oled-black theme");
  it.todo("applyTheme removes .oled class for warm-dark theme");
  it.todo("applyTheme persists preference to localStorage");
  it.todo("toggleTheme switches from warm-dark to oled-black");
  it.todo("toggleTheme switches from oled-black to warm-dark");
  it.todo("getTheme handles localStorage errors gracefully");
});
