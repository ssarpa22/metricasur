"use client";

import { useState } from "react";
import { Check, Copy, Mail, BookOpen } from "lucide-react";

const CONTACT_EMAIL = "metricasurteam@gmail.com";

export function ContactView() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyEmail() {
    setCopied(false);
    setCopyError(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }

  return <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
    <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><Mail size={21}/></div>
    <h1 className="mt-4 text-xl font-semibold text-[var(--foreground-secondary)]">Contactá al equipo de MétricaSur</h1>
    <p className="mt-2 text-sm leading-6 text-[var(--muted-light)]">¿Tenés una consulta, encontraste un problema o querés compartir una sugerencia? Escribinos y te vamos a ayudar.</p>
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--background-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-light)]">Correo de contacto</p><p className="mt-1 break-all text-sm font-semibold text-[var(--foreground-secondary)]">{CONTACT_EMAIL}</p></div>
      <button type="button" onClick={copyEmail} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copiado" : "Copiar correo"}</button>
    </div>
    {copyError && <p role="status" className="mt-2 text-xs text-[var(--muted-light)]">No pudimos copiarlo automáticamente. Seleccioná y copiá la dirección: <strong>{CONTACT_EMAIL}</strong></p>}
    <a href="mailto:metricasurteam@gmail.com?subject=Consulta%20sobre%20M%C3%A9tricaSur" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"><Mail size={17}/> Enviar un correo</a>
    <p className="mt-3 text-xs leading-5 text-[var(--muted-light)]">Si no tenés un cliente de correo configurado, copiá la dirección y pegala en Gmail, Outlook o el servicio de correo que uses. El asunto sugerido es «Consulta sobre MétricaSur».</p>
  </section>;
}

export function HelpView() {
  return <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
    <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><BookOpen size={21}/></div>
    <h1 className="mt-4 text-xl font-semibold text-[var(--foreground-secondary)]">Ayuda y primeros pasos</h1>
    <p className="mt-2 text-sm leading-6 text-[var(--muted-light)]">Recorré una guía breve para conocer tu espacio de trabajo, los módulos y el panel de inicio. Podés abrirla o repetirla en cualquier momento.</p>
    <button type="button" onClick={() => window.dispatchEvent(new Event("metricasur:open-tutorial"))} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"><BookOpen size={17}/> Abrir tutorial interactivo</button>
    <p className="mt-4 text-xs text-[var(--muted-light)]">También podés usar el botón flotante de ayuda que aparece en la esquina inferior derecha.</p>
  </section>;
}
