"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow-lg)] sm:p-9">
      <div className="mb-7 flex rounded-xl bg-[var(--surface-elevated)] p-1">
        <button type="button" onClick={() => setMode("signin")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "signin" ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm" : "text-[var(--muted-light)]"}`}>Iniciar sesión</button>
        <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm" : "text-[var(--muted-light)]"}`}>Crear cuenta</button>
      </div>

      <form action={mode === "signin" ? signIn : signUp} className="space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-medium text-[var(--foreground-secondary)]">
            Tu nombre
            <input name="fullName" autoComplete="name" required minLength={2} maxLength={80} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" placeholder="Cómo te llamás" />
          </label>
        )}
        <label className="block text-sm font-medium text-[var(--foreground-secondary)]">
          Email
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" placeholder="vos@ejemplo.com" />
        </label>
        <label className="block text-sm font-medium text-[var(--foreground-secondary)]">
          Contraseña
          <input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" placeholder={mode === "signup" ? "Al menos 8 caracteres" : "Tu contraseña"} />
        </label>
        <button type="submit" className="mt-2 w-full rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]">
          {mode === "signin" ? "Ingresar a MétricaSur" : "Crear mi cuenta"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-[var(--muted-light)]">Tus espacios de trabajo y tus datos están protegidos por permisos de acceso.</p>
    </div>
  );
}
