"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownLeft, ArrowRight, Check, CheckSquare,
  ChevronDown, ChevronUp, ClipboardList, GripVertical,
  Settings2, Store, X, CalendarDays,
} from "lucide-react";
import {
  getTodayInBuenosAires, getOverdueRecords, getPendingRecords, getCompletionRate,
} from "@/lib/record-insights";
import {
  loadPreferences, savePreferences, getVisibleWidgets, getLayoutClass, type DashboardWidget, type UserPreferences,
} from "@/lib/user-preferences";
import { moduleCatalog } from "@/lib/modules";

type Business = { id: string; name: string; industry: string; created_at: string };
type BusinessRecord = {
  id: string; module_slug: string; title: string; description: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  amount: number | null; quantity: number | null; due_date: string | null;
  category: string; reference: string; metadata: Record<string, unknown>; created_at: string;
};
type IndustryInfo = { label: string; description: string };

type DashboardProps = {
  firstName: string;
  business: Business;
  industry: IndustryInfo;
  records: BusinessRecord[];
};

function useDashboardPrefs() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [customizing, setCustomizing] = useState(false);

  const updatePrefs = useCallback((partial: Partial<UserPreferences>) => {
    const next = { ...prefs, ...partial };
    if (partial.dashboardWidgets) {
      next.dashboardWidgets = prefs.dashboardWidgets.map((w) => {
        const updated = partial.dashboardWidgets!.find((dw) => dw.id === w.id);
        if (updated) return { ...w, visible: updated.visible ?? w.visible, order: updated.order ?? w.order };
        return w;
      });
    }
    savePreferences(next);
    setPrefs(next);
  }, [prefs]);

  return { prefs, setPrefs: (p: Partial<UserPreferences>) => updatePrefs(p), customizing, setCustomizing };
}

function WidgetHeader({ widget, onToggle, onRemove, dragging }: {
  widget: DashboardWidget; onToggle: () => void; onRemove: () => void; dragging: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button onClick={onToggle} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-[var(--surface-hover)]">
        {widget.visible ? <><Check size={12} className="text-[var(--success)]" /> <span>Ocultar</span></> : <><span className="w-3 h-3 rounded-full border border-[var(--line)]" /> <span>Mostrar</span></>}
      </button>
      <button onClick={onRemove} aria-label="Quitar widget" className="rounded-lg p-1.5 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] hover:text-[var(--error)]">
        <X size={13} />
      </button>
      {dragging && <span className="text-[10px] text-[var(--muted-light)]">↕ Arrastrá para reordenar</span>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }: {
  icon: typeof Store; label: string; value: string; note: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-light)]">{label}</span>
        <Icon size={18} className="text-[var(--muted-light)]" />
      </div>
      <p className="mt-4 truncate text-xl font-semibold text-[var(--foreground-secondary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted-light)]">{note}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, title, description, className }: {
  href: string; icon: typeof Store; title: string; description: string; className?: string;
}) {
  return (
    <Link href={href} className={`group flex items-center gap-3 rounded-xl border p-4 transition ${className ?? "border-[var(--line)] hover:border-[var(--line-light)] hover:bg-[var(--surface-hover)]"}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--line-light)] text-[var(--muted-light)]"><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--foreground-secondary)]">{title}</span>
        <span className="mt-1 block text-xs text-[var(--muted-light)]">{description}</span>
      </span>
      <ArrowRight size={16} className="text-[var(--muted-light)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
    </Link>
  );
}

function StatsWidget({ records }: { records: BusinessRecord[] }) {
  const today = getTodayInBuenosAires(new Date());
  const startOfMonth = `${today.slice(0, 7)}-01`;
  const thisMonth = records.filter((r) => r.created_at.startsWith(startOfMonth));
  const pending = getPendingRecords(records);
  const overdue = getOverdueRecords(records, today);
  const completionRate = getCompletionRate(records.map((r) => ({ status: r.status })));

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <WidgetHeader widget={{ id: "stats", label: "Resumen de métricas", visible: true, order: 1 }} onToggle={() => {}} onRemove={() => {}} dragging={false} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Registros" value={String(records.length)} note={thisMonth.length ? `${thisMonth.length} este mes` : "Sin actividad este mes"} />
        <StatCard icon={Activity} label="Pendientes" value={String(pending.length)} note="Abiertos o en curso" />
        <StatCard icon={CalendarDays} label="Vencidos" value={String(overdue.length)} note={overdue.length > 0 ? "Requieren atención" : "Sin atrasos"} />
        <StatCard icon={CheckSquare} label="Cumplimiento" value={completionRate === null ? "N/D" : completionRate.toFixed(0) + "%"} note={completionRate === null ? "Sin registros no cancelados" : "Completado sobre no cancelados"} />
      </div>
    </section>
  );
}

function WorkspaceWidget({ industry }: { industry: IndustryInfo }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
      <WidgetHeader widget={{ id: "workspace", label: "Tu espacio de trabajo", visible: true, order: 2 }} onToggle={() => {}} onRemove={() => {}} dragging={false} />
      <div className="mt-6 rounded-xl bg-[var(--surface-elevated)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><Check size={20} /></span>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">Tu negocio ya tiene una estructura inicial</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-light)]">Configuramos las herramientas recomendadas para {industry.label.toLowerCase()}. Podés ajustar los módulos cuando lo necesites.</p>
            <Link href="/app?section=settings" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline">Revisar configuración <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <QuickLink href="/app?section=operations" icon={Store} title="Ver operaciones" description="Accedé a tus herramientas activas" />
        <QuickLink href="/app?section=organization" icon={ClipboardList} title="Organizar trabajo" description="Tareas, proyectos y agenda" />
      </div>
    </section>
  );
}

function RecentWidget({ records }: { records: BusinessRecord[] }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
      <WidgetHeader widget={{ id: "recent", label: "Actividad reciente", visible: true, order: 3 }} onToggle={() => {}} onRemove={() => {}} dragging={false} />
      <div className="mt-5 space-y-3">
        {records.length ? (
          <div>
            {records.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 border-b border-[var(--line-light)] pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground-secondary)]">{record.title}</p>
                  <p className="text-[11px] text-[var(--muted-light)]">{moduleCatalog.find((m) => m.slug === record.module_slug)?.name ?? record.module_slug} · {new Date(record.created_at).toLocaleDateString("es-AR")}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-[var(--accent)]">{record.status === "completed" ? "Completado" : record.status === "in_progress" ? "En curso" : record.status === "cancelled" ? "Cancelado" : "Pendiente"}</span>
              </div>
            ))}
            <Link href="/app?section=reports" className="inline-flex text-xs font-semibold text-[var(--accent)] hover:underline">Ver informes <ArrowRight size={13} /></Link>
          </div>
        ) : (
          <div className="flex min-h-[190px] flex-col items-center justify-center py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--line-light)] text-[var(--muted-light)]"><ArrowDownLeft size={22} /></span>
            <p className="mt-4 text-sm font-semibold text-[var(--foreground-secondary)]">Todavía no hay actividad</p>
            <p className="mt-1 max-w-[230px] text-xs leading-5 text-[var(--muted-light)]">Creá registros en tus módulos y aparecerán acá.</p>
            <Link href="/app?section=operations" className="mt-3 text-xs font-semibold text-[var(--accent)]">Ir a operaciones →</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ByModuleWidget({ records }: { records: BusinessRecord[] }) {
  const byModule = moduleCatalog
    .map((m) => ({ ...m, count: records.filter((r) => r.module_slug === m.slug).length }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  if (byModule.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
      <WidgetHeader widget={{ id: "byModule", label: "Actividad por módulo", visible: true, order: 4 }} onToggle={() => {}} onRemove={() => {}} dragging={false} />
      <div className="mt-4 space-y-3">
        {byModule.slice(0, 5).map((m) => (
          <div key={m.slug} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--muted-light)]">{m.name}</p>
              <p className="text-[10px] text-[var(--muted-light)]">{m.count} registro{m.count !== 1 ? "s" : ""}</p>
            </div>
            <div className="shrink-0 w-24 h-2 overflow-hidden rounded-full bg-[var(--line-light)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (m.count / records.length) * 100)}%` }} />
            </div>
            <span className="shrink-0 text-xs font-semibold text-[var(--foreground-secondary)]">{m.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

type WidgetRendererProps = {
  widget: DashboardWidget;
  industry: IndustryInfo;
  records: BusinessRecord[];
};

function WidgetRenderer({ widget, industry, records }: WidgetRendererProps) {
  switch (widget.id) {
    case "stats":
      return <StatsWidget records={records} />;
    case "workspace":
      return <WorkspaceWidget industry={industry} />;
    case "recent":
      return <RecentWidget records={records} />;
    case "byModule":
      return <ByModuleWidget records={records} />;
    default:
      return null;
  }
}

export function Dashboard({ firstName, business, industry, records }: DashboardProps) {
  const { prefs, setPrefs: updatePrefs, customizing, setCustomizing } = useDashboardPrefs();
  const visibleWidgets = useMemo(() => getVisibleWidgets(prefs), [prefs]);

  const toggleWidget = (widgetId: string) => {
    updatePrefs({ dashboardWidgets: prefs.dashboardWidgets.map((w) => w.id === widgetId ? { ...w, visible: !w.visible } : w) });
  };

  const moveWidget = (widgetId: string, delta: number) => {
    const widgets = [...prefs.dashboardWidgets];
    const idx = widgets.findIndex((w) => w.id === widgetId);
    const newIdx = Math.max(0, Math.min(widgets.length - 1, idx + delta));
    if (newIdx === idx) return;
    const [moved] = widgets.splice(idx, 1);
    widgets.splice(newIdx, 0, moved);
    widgets.forEach((w, i) => { w.order = i + 1; });
    updatePrefs({ dashboardWidgets: widgets });
  };

  const resetWidgets = () => {
    const defaults = loadPreferences();
    savePreferences(defaults);
    updatePrefs(defaults);
  };

  const layoutClass = getLayoutClass(prefs.layoutDensity);


  return (
    <div className={`${layoutClass} space-y-7`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[var(--muted-light)]">Tu resumen de hoy</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground-secondary)] sm:text-[34px]">¡Hola, {firstName}! <span className="text-2xl">👋</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-light)]">Este es el punto de partida para organizar {business.name.toLowerCase()}. Vamos paso a paso.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCustomizing(true)} className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]">
            <Settings2 size={14} /> Personalizar
          </button>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line-light)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)]"><span className="size-2 rounded-full bg-[var(--success)]" /> Espacio activo</span>
        </div>
      </div>

      {visibleWidgets.map((widget) => (
        <WidgetRenderer key={widget.id} widget={widget} industry={industry} records={records} />
      ))}

      {customizing && (
        <section className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--foreground-secondary)]/40 backdrop-blur-sm" onClick={() => setCustomizing(false)}>
          <div className="relative z-[70] w-full max-w-lg mx-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--foreground-secondary)]">Personalizar panel</h2>
              <button onClick={() => setCustomizing(false)} className="rounded-lg p-2 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]"><X size={18} /></button>
            </div>
            <p className="text-sm text-[var(--muted-light)] mb-6">Seleccioná qué widgets mostrar y su orden en el panel de inicio.</p>
            <div className="space-y-3">
              {prefs.dashboardWidgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line-light)] bg-[var(--surface-elevated)] p-3">
                  <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-[var(--muted-light)]" />
                    <span className="text-sm font-medium text-[var(--foreground-secondary)]">{widget.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleWidget(widget.id)} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition ${widget.visible ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--muted-light)] hover:bg-[var(--surface-hover)]"}`}>
                      {widget.visible ? <><Check size={12} className="text-[var(--success)]" /> <span>Visible</span></> : <><span className="w-3 h-3 rounded-full border border-[var(--line)]" /> <span>Oculto</span></>}
                    </button>
                    <button onClick={() => moveWidget(widget.id, -1)} disabled={widget.order === 1} className="rounded-lg p-1 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveWidget(widget.id, 1)} disabled={widget.order === prefs.dashboardWidgets.length} className="rounded-lg p-1 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-[var(--line-light)]">
              <button onClick={resetWidgets} className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted-light)] hover:bg-[var(--surface-hover)]">Restablecer predeterminado</button>
              <button onClick={() => setCustomizing(false)} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">Listo</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export { useDashboardPrefs, type DashboardWidget, type UserPreferences };
