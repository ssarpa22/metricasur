"use client";

import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

type ThemeOption = { id: "light" | "dark" | "system"; label: string; icon: React.FC<{ size?: number | string }> };

const themeOptions: ThemeOption[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border p-2.5 transition hover:bg-[var(--surface-hover)] focus:outline-none"
        aria-label="Seleccionar tema de color"
        aria-expanded={open}
      >
        {(() => { const Opt = themeOptions.find((o) => o.id === theme)?.icon; return Opt ? <Opt size={16} /> : null; })()}
        <span className="text-xs font-medium hidden sm:block">{themeOptions.find((o) => o.id === theme)?.label}</span>
        <span className="ml-1 text-[10px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl border bg-[var(--surface)] p-1 shadow-lg z-50">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => { setTheme(option.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${theme === option.id ? "bg-[var(--accent-light)] text-[var(--accent-hover)]" : "text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"}`}
              >
                <Icon size={16} />
                <span>{option.label}</span>
                {theme === option.id && <span className="ml-auto text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
