"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { completeTutorial, dismissTutorial } from "./actions";

const steps = [
  { title: "¡Bienvenido a MétricaSur!", body: "MétricaSur reúne la información y las herramientas de tu negocio en un solo espacio. Vamos a recorrer lo esencial para que puedas empezar." },
  { title: "Primero, tu empresa", body: "Tu espacio de trabajo representa el negocio que estás administrando. Si todavía no lo creaste, la pantalla inicial te permite cargar su nombre y rubro. Si ya existe, podés administrarlo desde Configuración." },
  { title: "Configurá tu espacio", body: "En Configuración podés revisar el nombre y rubro, administrar los módulos disponibles y actualizar los datos de tu perfil." },
  { title: "Conocé los módulos", body: "La barra lateral agrupa las herramientas por tarea. Solo aparecen los módulos habilitados para el espacio de trabajo activo." },
  { title: "Cargá tu primer registro", body: "Entrá en un módulo habilitado y usá su formulario para registrar la actividad. Los campos disponibles pueden variar según el módulo." },
  { title: "Explorá tu dashboard", body: "Volvé a Inicio para consultar el resumen y la actividad del negocio. Los indicadores se completan a medida que cargás registros reales." },
];

export function TutorialWidget({ initiallyDismissed }: { initiallyDismissed: boolean }) {
  const [open, setOpen] = useState(!initiallyDismissed);
  const [step, setStep] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const openTutorial = () => { setStep(0); setConfirmClose(false); setError(""); setOpen(true); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (confirmClose) setConfirmClose(false);
        else if (open) setConfirmClose(true);
      }
    };
    window.addEventListener("metricasur:open-tutorial", openTutorial);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("metricasur:open-tutorial", openTutorial);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmClose, open]);

  async function finishTutorial() {
    setSaving(true);
    setError("");
    const result = await completeTutorial();
    setSaving(false);
    if (!result.ok) { setError("No pudimos guardar el avance. Revisá tu conexión e intentá nuevamente."); return; }
    setOpen(false);
    setStep(0);
  }

  async function stopShowing() {
    setSaving(true);
    setError("");
    const result = await dismissTutorial();
    setSaving(false);
    if (!result.ok) { setError("No pudimos guardar tu preferencia. El tutorial seguirá disponible."); return; }
    setConfirmClose(false);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => { setStep(0); setConfirmClose(false); setError(""); setOpen(true); }} aria-label="Abrir tutorial de MétricaSur" title="Ayuda y tutorial" className="fixed bottom-5 right-5 z-[65] flex size-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2">
        <CircleHelp size={22}/>
      </button>
      {open && (
        <section aria-label="Tutorial de MétricaSur" aria-live="polite" className="fixed bottom-[5.25rem] right-4 z-[64] w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--foreground-secondary)] shadow-2xl sm:bottom-20 sm:right-5 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Guía de primeros pasos</p><h2 className="mt-1 text-base font-semibold">{steps[step].title}</h2></div>
            <button type="button" onClick={() => setConfirmClose(true)} aria-label="Cerrar tutorial" className="rounded-lg p-1.5 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]"><X size={17}/></button>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-light)]">{steps[step].body}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: ((step + 1) / steps.length * 100) + "%" }}/></div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-light)]"><span>Paso {step + 1} de {steps.length}</span><span>{Math.round((step + 1) / steps.length * 100)}%</span></div>
          {error && <p role="alert" className="mt-3 text-xs text-[var(--error)]">{error}</p>}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" disabled={step === 0 || saving} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted-light)] hover:bg-[var(--surface-hover)] disabled:opacity-40"><ChevronLeft size={15}/> Anterior</button>
            {step < steps.length - 1
              ? <button type="button" disabled={saving} onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Siguiente <ChevronRight size={15}/></button>
              : <button type="button" disabled={saving} onClick={finishTutorial} className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Check size={15}/> {saving ? "Guardando…" : "Finalizar"}</button>}
          </div>
          {confirmClose && <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--surface)]/95 p-4 backdrop-blur-sm">
            <div className="w-full"><h3 className="text-sm font-semibold">¿Querés que dejemos de mostrarte este tutorial?</h3><p className="mt-2 text-xs leading-5 text-[var(--muted-light)]">Podés volver a abrirlo cuando quieras desde Ayuda o desde el botón flotante.</p>
              {error && <p role="alert" className="mt-2 text-xs text-[var(--error)]">{error}</p>}
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" disabled={saving} onClick={() => { setConfirmClose(false); setError(""); }} className="rounded-lg border border-[var(--line)] px-3 py-2.5 text-xs font-semibold text-[var(--foreground-secondary)]">No, continuar con el tutorial</button>
                <button type="button" disabled={saving} onClick={stopShowing} className="rounded-lg bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white">{saving ? "Guardando…" : "Sí, no volver a mostrarlo"}</button>
              </div>
            </div>
          </div>}
        </section>
      )}
    </>
  );
}
