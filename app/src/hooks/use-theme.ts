import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return media.matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => getStoredTheme() ?? getSystemTheme(),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Follow OS changes until the user picks a theme explicitly.
  useEffect(() => {
    const onChange = () => {
      if (!getStoredTheme()) setThemeState(getSystemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function setTheme(next: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; theme still applies for this session.
    }
    setThemeState(next);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, setTheme, toggleTheme };
}

/**
 * Read-only: whether dark mode is currently applied. Watches the `dark` class on
 * <html>, so it stays in sync with whichever component toggles the theme.
 */
export function useIsDark() {
  const root = document.documentElement;
  const [isDark, setIsDark] = useState(() => root.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [root]);

  return isDark;
}
