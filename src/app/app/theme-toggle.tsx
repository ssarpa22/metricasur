"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-8 w-[3.75rem] shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] p-1 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
    >
      <Sun size={14} aria-hidden="true" className={`absolute left-1.5 transition-colors ${isDark ? "text-[var(--muted-light)]" : "text-amber-500"}`} />
      <Moon size={14} aria-hidden="true" className={`absolute right-1.5 transition-colors ${isDark ? "text-indigo-400" : "text-[var(--muted-light)]"}`} />
      <span
        aria-hidden="true"
        className={`relative z-10 size-5 rounded-full bg-[var(--surface)] shadow-sm transition-transform ${isDark ? "translate-x-7" : "translate-x-0"}`}
      />
    </button>
  );
}
