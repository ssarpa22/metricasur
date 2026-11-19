"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="rounded-3xl border border-[#e4eae6] bg-white p-7 shadow-[0_24px_70px_rgba(30,58,46,0.09)] sm:p-9">
      <div className="mb-7 flex rounded-xl bg-[#f2f6f3] p-1">
        <button type="button" onClick={() => setMode("signin")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "signin" ? "bg-white text-[#174532] shadow-sm" : "text-[#718078]"}`}>Iniciar sesión</button>
        <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-[#174532] shadow-sm" : "text-[#718078]"}`}>Crear cuenta</button>
      </div>

      <form action={mode === "signin" ? signIn : signUp} className="space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-medium text-[#34443d]">
            Tu nombre
            <input name="fullName" autoComplete="name" required minLength={2} maxLength={80} className="mt-2 w-full rounded-xl border border-[#dce5e0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16785a] focus:ring-2 focus:ring-[#16785a]/10" placeholder="Cómo te llamás" />
          </label>
        )}
        <label className="block text-sm font-medium text-[#34443d]">
          Email
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-[#dce5e0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16785a] focus:ring-2 focus:ring-[#16785a]/10" placeholder="vos@ejemplo.com" />
        </label>
        <label className="block text-sm font-medium text-[#34443d]">
          Contraseña
          <input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} className="mt-2 w-full rounded-xl border border-[#dce5e0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16785a] focus:ring-2 focus:ring-[#16785a]/10" placeholder={mode === "signup" ? "Al menos 8 caracteres" : "Tu contraseña"} />
        </label>
        <button type="submit" className="mt-2 w-full rounded-xl bg-[#16785a] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#105c45]">
          {mode === "signin" ? "Ingresar a MétricaSur" : "Crear mi cuenta"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-[#84918b]">Tus espacios de trabajo y tus datos están protegidos por permisos de acceso.</p>
    </div>
  );
}
