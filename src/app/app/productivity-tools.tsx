"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, BriefcaseBusiness,
  Command, CreditCard, LayoutDashboard, Package, Search, Settings2,
  Store, Users, X,
} from "lucide-react";

type ModuleItem = { slug: string; name: string; description: string };

const sections = [
  { id: "home", label: "Inicio", description: "Resumen de tu negocio", icon: LayoutDashboard },
  { id: "operations", label: "Operaciones", description: "Herramientas del trabajo diario", icon: Store },
  { id: "people", label: "Personas", description: "Clientes y proveedores", icon: Users },
  { id: "organization", label: "Organización", description: "Tareas, proyectos y agenda", icon: BriefcaseBusiness },
  { id: "reports", label: "Informes", description: "Indicadores y actividad", icon: BarChart3 },
  { id: "subscription", label: "Suscripción", description: "Plan y límites de tu cuenta", icon: CreditCard },
  { id: "settings", label: "Configuración", description: "Preferencias y espacios", icon: Settings2 },
];

export function CommandPalette({ modules }: { modules: ModuleItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo(() => [
    ...sections.map((item) => ({ ...item, href: `/app?section=${item.id}` })),
    ...modules.map((module) => ({
      id: module.slug,
      label: module.name,
      description: module.description,
      icon: Package,
      href: `/app?section=${module.slug}`,
    })),
  ].filter((item) => `${item.label} ${item.description}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))), [modules, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted-light)] transition hover:border-[var(--accent-border)] hover:text-[var(--foreground-secondary)]"
        aria-label="Abrir búsqueda rápida"
        title="Búsqueda rápida (Ctrl+K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Ir a...</span>
        <kbd className="hidden rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[10px] sm:inline-flex">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-3 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-label="Búsqueda rápida" className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--line-light)] px-4">
              <Search size={18} className="shrink-0 text-[var(--muted-light)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar una sección o módulo..."
                className="h-14 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none focus:ring-0"
                aria-label="Buscar secciones y módulos"
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]" aria-label="Cerrar búsqueda"><X size={17} /></button>
            </div>
            <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
              {items.length ? items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]"><Icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--foreground-secondary)]">{item.label}</span>
                      <span className="block truncate text-xs text-[var(--muted-light)]">{item.description}</span>
                    </span>
                    <ArrowRight size={15} className="text-[var(--muted-light)]" />
                  </Link>
                );
              }) : (
                <p className="px-4 py-10 text-center text-sm text-[var(--muted-light)]">No encontramos coincidencias. Probá con otra palabra.</p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line-light)] px-4 py-3 text-[10px] text-[var(--muted-light)]">
              <span>Navegá por MétricaSur sin recorrer los menús</span>
              <span className="inline-flex items-center gap-1"><Command size={11} /> K para abrir</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function GettingStartedCard({ businessName, recordsCount, enabledModulesCount }: {
  businessName: string;
  recordsCount: number;
  enabledModulesCount: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(window.localStorage.getItem("metricasur_getting_started_dismissed") === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!mounted || dismissed || recordsCount > 0) return null;

  const steps = [
    { done: enabledModulesCount > 0, title: "Prepará tus herramientas", description: "Revisá los módulos que mejor se adaptan a tu actividad.", href: "/app?section=settings", action: "Ver módulos" },
    { done: false, title: "Cargá tu primer registro", description: "Anotá una venta, tarea, turno o movimiento para empezar a organizarte.", href: "/app?section=operations", action: "Ir a operaciones" },
  ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-2xl border border-[var(--accent-border)] bg-[var(--surface)] p-4 sm:p-5" aria-labelledby="getting-started-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Primeros pasos</p>
          <h2 id="getting-started-title" className="mt-1 text-base font-semibold text-[var(--foreground-secondary)]">Poné en marcha {businessName}</h2>
          <p className="mt-1 text-xs text-[var(--muted-light)]">Una guía breve y opcional para aprovechar tu espacio de trabajo.</p>
        </div>
        <button type="button" onClick={() => {
          setDismissed(true);
          try { window.localStorage.setItem("metricasur_getting_started_dismissed", "1"); } catch {}
        }} className="rounded-lg p-1.5 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]" aria-label="Ocultar guía de primeros pasos"><X size={16} /></button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line-light)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} /></div>
        <span className="text-[10px] font-semibold tabular-nums text-[var(--muted-light)]">{completed}/{steps.length}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <Link key={step.title} href={step.href} className="group flex items-center gap-3 rounded-xl border border-[var(--line-light)] p-3 transition hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)]">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-[var(--accent-light)] text-[var(--accent)]"}`}>{step.done ? "✓" : "→"}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-[var(--foreground-secondary)]">{step.title}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-[var(--muted-light)]">{step.description}</span>
            </span>
            <span className="shrink-0 text-[10px] font-semibold text-[var(--accent)]">{step.action}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
