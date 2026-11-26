"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loadPreferences, updatePreferences } from "@/lib/user-preferences";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("metricasur_theme");
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return loadPreferences().theme;
}

function getInitialSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getInitialSystemTheme);

  const applyTheme = useCallback((next: Theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const resolved = next === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next;
    root.setAttribute("data-theme", resolved);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      applyTheme(next);
      try {
        window.localStorage.setItem("metricasur_theme", next);
      } catch {
        // Theme changes must still apply when browser storage is unavailable.
      }
      updatePreferences({ theme: next });
    }
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        setSystemTheme(media.matches ? "dark" : "light");
        applyTheme("system");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
