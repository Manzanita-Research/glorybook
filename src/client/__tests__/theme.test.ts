import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTheme, applyTheme, toggleTheme } from "../lib/theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("getTheme returns warm-dark by default", () => {
    expect(getTheme()).toBe("warm-dark");
  });

  it("getTheme returns stored preference from localStorage", () => {
    localStorage.setItem("glory-theme", "oled-black");
    expect(getTheme()).toBe("oled-black");
  });

  it("applyTheme sets .dark class on html element", () => {
    applyTheme("warm-dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applyTheme adds .oled class for oled-black theme", () => {
    applyTheme("oled-black");
    expect(document.documentElement.classList.contains("oled")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applyTheme removes .oled class for warm-dark theme", () => {
    document.documentElement.classList.add("oled");
    applyTheme("warm-dark");
    expect(document.documentElement.classList.contains("oled")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applyTheme persists preference to localStorage", () => {
    applyTheme("oled-black");
    expect(localStorage.getItem("glory-theme")).toBe("oled-black");
  });

  it("toggleTheme switches from warm-dark to oled-black", () => {
    applyTheme("warm-dark");
    const next = toggleTheme();
    expect(next).toBe("oled-black");
    expect(document.documentElement.classList.contains("oled")).toBe(true);
  });

  it("toggleTheme switches from oled-black to warm-dark", () => {
    applyTheme("oled-black");
    const next = toggleTheme();
    expect(next).toBe("warm-dark");
    expect(document.documentElement.classList.contains("oled")).toBe(false);
  });

  it("getTheme handles localStorage errors gracefully", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(getTheme()).toBe("warm-dark");
    spy.mockRestore();
  });
});
