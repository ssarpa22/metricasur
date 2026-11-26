"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  CalendarDays, Check, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  CreditCard, LayoutDashboard, LogOut, Menu, Monitor, Package, Plus, Settings2, ShoppingBag,
  Sparkles, Store, Users, Wallet, X, Clock,
} from "lucide-react";
import { industries, type Industry } from "@/lib/industries";
import { moduleCatalog } from "@/lib/modules";
import { subscriptionPlans, type SubscriptionPlan } from "@/lib/subscriptions";
import { getOverdueRecords, getPendingRecords, getTodayInBuenosAires, serializeCsv, getCompletionRate, getOperationalAmountBreakdown } from "@/lib/record-insights";
import {
  createBusiness, restoreRecommendedBusinessModules, setBusinessModuleEnabled, signOut, switchBusiness, updateProfile,
} from "./actions";
import { DeleteBusinessForm } from "./delete-business-form";
import { ModuleWorkspace } from "./module-workspace";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "./theme-provider";
import { Dashboard, useDashboardPrefs } from "./dashboard-widgets";
import type { LayoutDensity, Theme } from "@/lib/user-preferences";
import { CommandPalette } from "./productivity-tools";

type Business = { id: string; name: string; industry: string; created_at: string };
type BusinessRecord = { id: string; module_slug: string; title: string; description: string; status: "open" | "in_progress" | "completed" | "cancelled"; amount: number | null; quantity: number | null; due_date: string | null; category: string; reference: string; metadata: Record<string, unknown>; created_at: string };
type Props = {
  firstName: string;
  fullName: string;
  email: string;
  businesses: Business[];
  activeBusiness: Business | null;
  activeRole: string | null;
  activeIndustry: Industry;
  enabledModules: Record<string, boolean>;
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    startedAt: string;
    renewsAt: string | null;
    freePlanGrandfathered: boolean;
    monthlyRecords: number;
    businessCount: number;
  };
  moduleSetupMissing: boolean;
  section: string;
  records: BusinessRecord[];
  allRecords: BusinessRecord[];
  notices: { error?: string; dataIssue?: string; created?: string; profile?: string; modules?: string; deleted?: string; saved?: string; deletedRecord?: string };
};

const navGroups = [
  { title: "General", items: [{ id: "home", label: "Inicio", icon: LayoutDashboard }] },
  { title: "Tu negocio", items: [
    { id: "operations", label: "Operaciones", icon: Store },
    { id: "people", label: "Personas", icon: Users },
    { id: "organization", label: "Organización", icon: ClipboardList },
  ] },
  { title: "Análisis", items: [{ id: "reports", label: "Informes", icon: BarChart3 }] },
];

const sectionTitles: Record<string, { title: string; description: string }> = {
  home: { title: "Inicio", description: "Una vista simple de lo que pasa en tu negocio." },
  operations: { title: "Operaciones", description: "Las herramientas para llevar adelante el trabajo diario." },
  people: { title: "Personas", description: "Clientes, proveedores y relaciones de tu negocio." },
  organization: { title: "Organización", description: "Proyectos, tareas, turnos y trabajo pendiente." },
  reports: { title: "Informes", description: "Conocé el estado y la evolución de tu actividad." },
  assistant: { title: "Asistente", description: "Un espacio para consultar y, más adelante, delegar tareas." },
  settings: { title: "Configuración", description: "Administrá tu espacio, tus módulos y tu perfil." },
};

sectionTitles.subscription = { title: "Suscripción", description: "Conocé tu plan, uso y opciones de crecimiento." };

const moduleIcons: Record<string, typeof ShoppingBag> = {
  sales: ShoppingBag, customers: Users, services: BriefcaseBusiness, appointments: CalendarDays,
  proposals: ClipboardList, inventory: Package, purchasing: CreditCard, suppliers: Store,
  waste_tracking: Activity, menu_costing: Wallet, projects: BriefcaseBusiness,
  time_tracking: Activity, production: Store, work_orders: ClipboardList, tasks: Check,
};

function NavLink({ id, label, icon: Icon, active, onClick, collapsed = false }: {
  id: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick?: () => void; collapsed?: boolean;
}) {
  return (
    <Link href={`/app?section=${id}`} onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${active ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--muted-light)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground-secondary)]"}`}>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8}/>
      {!collapsed && <span>{label}</span>}
      {active && <span className={`size-1.5 rounded-full bg-[var(--accent)] ${collapsed ? "absolute right-2 top-1/2 -translate-y-1/2" : "ml-auto"}`}/>} 
    </Link>
  );
}

export function AppShell(props: Props) {
  const { prefs, setPrefs: updatePrefs } = useDashboardPrefs();
  const collapsed = prefs.sidebarCollapsed;
  const toggleSidebar = () => {
    updatePrefs({ sidebarCollapsed: !prefs.sidebarCollapsed });
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modulesExpanded, setModulesExpanded] = useState(true);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const active = props.activeBusiness;
  const industry = industries[props.activeIndustry];
  const page = sectionTitles[props.section] ?? sectionTitles.home;
  const activeCount = Object.values(props.enabledModules).filter(Boolean).length;
  const isManager = props.activeRole === "owner" || props.activeRole === "admin";
  const enabledModuleList = moduleCatalog.filter((module) => props.enabledModules[module.slug]);
  const currentModules = enabledModuleList.filter((module) => {
    if (props.section === "people") return ["customers", "suppliers"].includes(module.slug);
    if (props.section === "organization") return ["projects", "time_tracking", "appointments", "tasks", "work_orders"].includes(module.slug);
    if (props.section === "operations") return !["customers", "suppliers", "projects", "time_tracking", "appointments", "tasks", "proposals"].includes(module.slug);
    return true;
  });
  const today = getTodayInBuenosAires(new Date());
  const overdue = getOverdueRecords(props.allRecords, today);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center justify-between border-b border-[var(--line-light)] px-5">
        <Link href="/app" aria-label="MétricaSur, ir al inicio" title={collapsed ? "MétricaSur, ir al inicio" : undefined} className={`flex items-center gap-3 overflow-hidden ${collapsed ? "lg:justify-center" : ""}`}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white"><BarChart3 size={21}/></span>
          {!collapsed && <span className="whitespace-nowrap text-xl font-bold tracking-tight text-[var(--foreground-secondary)]">métrica<span className="text-[var(--accent)]">sur</span></span>}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] lg:hidden" aria-label="Cerrar menú"><X size={19}/></button>
      </div>

      <div className="border-b border-[var(--line-light)] p-3">
        <button onClick={() => setBusinessExpanded(!businessExpanded)} aria-label={collapsed ? `Cambiar espacio de trabajo. Actual: ${active?.name ?? "Sin negocio"}` : undefined} title={collapsed ? `Espacio actual: ${active?.name ?? "Sin negocio"}` : undefined} className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] p-3 text-left hover:bg-[var(--surface-hover)]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]"><Store size={18}/></span>
          {!collapsed && <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[var(--foreground-secondary)]">{active?.name ?? "Sin negocio"}</span>
            <span className="block truncate text-xs text-[var(--muted-light)]">{industry.label}</span>
          </span>}
          {!collapsed && <ChevronDown size={16} className={`shrink-0 text-[var(--muted-light)] transition ${businessExpanded ? "rotate-180" : ""}`}/>}
        </button>
        {businessExpanded && !collapsed && <div className="mt-2 space-y-1 rounded-xl bg-[var(--surface-elevated)] p-2">
          {props.businesses.map((business) => <form action={switchBusiness} key={business.id}>
            <input type="hidden" name="businessId" value={business.id}/>
            <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[var(--muted-light)] hover:bg-[var(--surface)]">
              <span className="truncate">{business.name}</span>{business.id === active?.id && <Check size={14} className="text-[var(--accent)]"/>}
            </button>
          </form>)}
          <Link href="/app?section=settings" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--accent)]"><Plus size={14}/> Crear o administrar espacios</Link>
        </div>}
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => <div key={group.title}>
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-light)]">{group.title}</p>}
          <div className="space-y-1">{group.items.map((item) =>
            <NavLink key={item.id} {...item} active={props.section === item.id} collapsed={collapsed} onClick={() => setMobileOpen(false)}/>)}</div>
        </div>)}
        <div>
          <button onClick={() => setModulesExpanded(!modulesExpanded)} aria-label="Módulos activos" title={collapsed ? "Módulos activos" : undefined} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-light)] hover:text-[var(--muted)] ${collapsed ? "justify-center" : ""}`}>
            {!collapsed && <><span className="flex-1 text-left">Módulos activos</span><span className="rounded-full bg-[var(--line-light)] px-2 py-0.5 text-[10px]">{activeCount}</span><ChevronDown size={14} className={modulesExpanded ? "rotate-180" : ""}/></>}
            {collapsed && <Package size={17}/>}
          </button>
          {modulesExpanded && <div className="space-y-1">{enabledModuleList.map((module) => {
            const Icon = moduleIcons[module.slug] ?? Package;
            return <NavLink key={module.slug} id={module.slug} label={module.name} icon={Icon} active={props.section === module.slug} collapsed={collapsed} onClick={() => setMobileOpen(false)}/>;
          })}</div>}
          {!enabledModuleList.length && !collapsed && <p className="px-3 py-2 text-xs text-[var(--muted-light)]">Todavía no hay módulos activos.</p>}
        </div>
        <div className="border-t border-[var(--line-light)] pt-4">
          <NavLink id="subscription" label="Suscripción" icon={CreditCard} active={props.section === "subscription"} collapsed={collapsed} onClick={() => setMobileOpen(false)}/>
          <NavLink id="assistant" label="Asistente IA" icon={Sparkles} active={props.section === "assistant"} collapsed={collapsed} onClick={() => setMobileOpen(false)}/>
          <NavLink id="settings" label="Configuración" icon={Settings2} active={props.section === "settings"} collapsed={collapsed} onClick={() => setMobileOpen(false)}/>
        </div>
      </nav>

      <div className="border-t border-[var(--line-light)] p-3">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-sm font-bold text-[var(--accent)]">{props.firstName.slice(0,1).toUpperCase()}</span>
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[var(--foreground-secondary)]">{props.firstName}</span><span className="block truncate text-[11px] text-[var(--muted-light)]">{props.email}</span></span>}
          <ThemeToggle />
          <form action={signOut}><button aria-label="Cerrar sesión" className="rounded-lg p-2 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"><LogOut size={16}/></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div data-density={prefs.layoutDensity} className="min-h-screen bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--line)] bg-[var(--surface)] transition-all duration-200 lg:block ${collapsed ? "w-[84px]" : "w-[272px]"}`}>
        {sidebar}
        <button onClick={toggleSidebar} className="absolute -right-3 top-[88px] flex size-7 items-center justify-center rounded-full border border-[var(--line-light)] bg-[var(--surface)] text-[var(--muted-light)] shadow-sm hover:text-[var(--accent)]" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button className="absolute inset-0 bg-[var(--foreground-secondary)]/20" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"/>
        <aside className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-[var(--surface)] shadow-2xl">{sidebar}</aside>
      </div>}

      <div className={`min-h-screen transition-all duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[var(--line)] bg-[var(--surface)]/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-[var(--muted-light)] hover:bg-[var(--surface-hover)] lg:hidden" aria-label="Abrir menú"><Menu size={21}/></button>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--foreground-secondary)]">{page.title}</p>
              <div className="flex items-center gap-1 text-[10px] text-[var(--muted-light)]">
                <span>Inicio</span><span className="text-[var(--muted-light)]">›</span><span>{props.activeBusiness?.name ?? "Tu espacio de trabajo"}</span>
                {props.section !== "home" && <><span className="text-[var(--muted-light)]">›</span><span>{page.title}</span></>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <CommandPalette modules={enabledModuleList} />
            <span className="hidden rounded-full bg-[var(--accent-light)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] sm:inline-flex">{industry.label}</span>
            {overdue.length > 0 && <Link href="/app?section=reports" className="relative rounded-xl p-2.5 text-[var(--error)] hover:bg-[var(--error-light)]" aria-label="Ver registros vencidos" title="Registros vencidos"><AlertTriangle size={18}/><span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--error)] text-white text-[10px] font-bold">{overdue.length}</span></Link>}
            <Link href="/app?section=reports" className="rounded-xl p-2.5 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]" aria-label="Ir a informes" title="Informes"><Bell size={18}/></Link>
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-light)] text-sm font-bold text-[var(--accent)]">{props.firstName.slice(0,1).toUpperCase()}</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          {props.notices.error && <p role="alert" className="mb-5 rounded-xl border border-[var(--error-light)] bg-[var(--error-light)]/50 px-4 py-3 text-sm text-[var(--error)]">{props.notices.error}</p>}
          {props.notices.dataIssue && <p role="alert" className="mb-5 rounded-xl border border-[var(--warning-light)] bg-[var(--warning-light)]/50 px-4 py-3 text-sm leading-6 text-[var(--warning)]">{props.notices.dataIssue} No vamos a mostrar estas secciones como si estuvieran vacías.</p>}
          {(props.notices.created || props.notices.profile || props.notices.modules || props.notices.deleted || props.notices.saved || props.notices.deletedRecord) && <p role="status" className="mb-5 rounded-xl border border-[var(--success-light)] bg-[var(--success-light)]/50 px-4 py-3 text-sm text-[var(--success)]">{props.notices.created ? "Tu espacio de trabajo está creado." : props.notices.profile ? "Tu perfil se actualizó correctamente." : props.notices.modules ? "La configuración de módulos se actualizó." : props.notices.saved ? "El registro se guardó correctamente." : props.notices.deletedRecord ? "El registro se eliminó." : "El espacio de trabajo se eliminó correctamente."}</p>}

          {!active ? <EmptyWorkspace/> : props.section === "home" || !sectionTitles[props.section] && !moduleCatalog.some((m) => m.slug === props.section) ? (
            <Dashboard firstName={props.firstName} business={active} industry={industry} records={props.allRecords} enabledModulesCount={activeCount}/>
          ) : props.section === "settings" ? (
            <SettingsView {...props} industry={industry} isManager={isManager}/>
          ) : props.section === "assistant" ? (
            <AssistantView records={props.allRecords} industry={industry}/>
          ) : props.section === "reports" ? (
            <ReportsView records={props.allRecords} industry={industry} plan={props.subscription.plan}/>
          ) : props.section === "subscription" ? (
            <SubscriptionView subscription={props.subscription}/>
          ) : moduleCatalog.some((module) => module.slug === props.section) ? (
            <ModuleWorkspace businessId={active.id} slug={props.section} name={moduleCatalog.find((module) => module.slug === props.section)?.name ?? "Módulo"} description={moduleCatalog.find((module) => module.slug === props.section)?.description ?? ""} records={props.records} enabled={props.enabledModules[props.section] ?? false} canExport={props.subscription.plan.canExport}/>
          ) : (
            <ModuleCollection title={page.title} description={page.description} modules={currentModules}/>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Store; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[var(--muted-light)]">{label}</span><Icon size={18} className="text-[var(--muted-light)]"/></div><p className="mt-4 truncate text-xl font-semibold text-[var(--foreground-secondary)]">{value}</p><p className="mt-1 text-xs text-[var(--muted-light)]">{note}</p></div>;
}

function ModuleCollection({ title, description, modules }: { title: string; description: string; modules: typeof moduleCatalog }) {
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground-secondary)]">{title}</h1><p className="mt-2 text-sm text-[var(--muted-light)]">{description}</p></div>
    {modules.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{modules.map((module) => { const Icon = moduleIcons[module.slug] ?? Package; return <Link key={module.slug} href={`/app?section=${module.slug}`} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-light)] hover:shadow-[var(--shadow)]"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><Icon size={19}/></span><ArrowUpRight size={17} className="text-[var(--muted-light)] group-hover:text-[var(--accent)]"/></div><h2 className="mt-4 text-sm font-semibold text-[var(--foreground-secondary)]">{module.name}</h2><p className="mt-1 text-xs leading-5 text-[var(--muted-light)]">{module.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">Ver módulo <ArrowRight size={13}/></span></Link>; })}</div> : <EmptyModules/>}
  </div>;
}

function ReportsView({ records, industry, plan }: { records: BusinessRecord[]; industry: (typeof industries)[Industry]; plan: SubscriptionPlan }) {
  const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const today = getTodayInBuenosAires(new Date());
  const startOfMonth = `${today.slice(0, 7)}-01`;
  const thisMonth = records.filter((r) => r.created_at.startsWith(startOfMonth));
  const totalAmount = records.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const monthlyAmount = thisMonth.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const pending = getPendingRecords(records);
  const overdue = getOverdueRecords(records, today);
  const byModule = moduleCatalog.map((m) => ({ ...m, count: records.filter((r) => r.module_slug === m.slug).length })).filter((m) => m.count).sort((a, b) => b.count - a.count);
  const completionRate = getCompletionRate(records.map((r) => ({ status: r.status })));
  const amountBreakdown = getOperationalAmountBreakdown(records.map((r) => ({ module_slug: r.module_slug, amount: r.amount })));
  const advancedAnalytics = plan.analytics === "advanced";
  if (!advancedAnalytics) return <BasicReportsView records={records} industry={industry}/>;
  const exportCsv = () => {
    const header = ["Modulo","Titulo","Estado","Importe ARS","Cantidad","Fecha objetivo","Categoria","Referencia","Creado"];
    const rows = records.map((r) => [moduleCatalog.find((m) => m.slug === r.module_slug)?.name ?? r.module_slug,r.title,r.status,r.amount ?? "",r.quantity ?? "",r.due_date ?? "",r.category,r.reference,r.created_at]);
    const csv = serializeCsv([header, ...rows]);
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download="metricasur-informe.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const statusCounts = { open: records.filter((r) => r.status === "open").length, in_progress: records.filter((r) => r.status === "in_progress").length, completed: records.filter((r) => r.status === "completed").length, cancelled: records.filter((r) => r.status === "cancelled").length };
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Análisis del negocio</p><h1 className="mt-2 text-2xl font-semibold text-[var(--foreground-secondary)]">Informes de {industry.label.toLowerCase()}</h1><p className="mt-1 text-sm text-[var(--muted-light)]">Estadísticas calculadas a partir de tus registros guardados.</p></div><button onClick={exportCsv} disabled={!records.length} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Exportar CSV</button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={ClipboardList} label="Registros" value={String(records.length)} note={thisMonth.length ? `${thisMonth.length} este mes` : "Sin actividad este mes"}/><StatCard icon={Activity} label="Pendientes" value={String(pending.length)} note="Abiertos o en curso"/><StatCard icon={CalendarDays} label="Vencidos" value={String(overdue.length)} note={overdue.length > 0 ? "Requieren atención" : "Sin atrasos"}/><StatCard icon={Wallet} label="Importes" value={money.format(totalAmount)} note={thisMonth.length ? `Este mes: ${money.format(monthlyAmount)}` : "Sin importes este mes"}/>
    {completionRate !== null ? (
      <StatCard icon={CheckSquare} label="Tasa de cumplimiento" value={completionRate.toFixed(0) + "%"} note="Completado sobre no cancelados"/>
    ) : (
      <StatCard icon={Clock} label="Tasa de cumplimiento" value="N/D" note="No hay registros no cancelados"/>
    )}</div>
    <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold text-[var(--foreground-secondary)]">Actividad por módulo</h2>{byModule.length ? <div className="mt-4 space-y-3">{byModule.slice(0, 6).map((m) => <div key={m.slug} className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[var(--muted-light)]">{m.name}</p><p className="text-[10px] text-[var(--muted-light)]">{m.count} registro{m.count !== 1 ? "s" : ""}</p></div><div className="shrink-0 w-24 h-2 overflow-hidden rounded-full bg-[var(--line-light)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (m.count / records.length) * 100)}%` }}/></div><span className="shrink-0 text-xs font-semibold text-[var(--foreground-secondary)]">{m.count}</span></div>)}</div> : <p className="mt-4 text-sm text-[var(--muted-light)]">Todavía no hay datos para analizar. Empezá creando registros en tus módulos.</p>}</section>
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold text-[var(--foreground-secondary)]">Distribución por estado</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(statusCounts).map(([label, count]) => { const statusKey = label as keyof typeof statusLabels; return <div key={label} className="flex items-center justify-between rounded-lg bg-[var(--surface-elevated)] px-3 py-2 text-sm"><span className="text-[var(--muted-light)]">{statusLabels[statusKey]}</span><span className="flex items-center gap-1.5"><strong className="text-[var(--foreground-secondary)]">{count}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[statusKey]}`}>{statusLabels[statusKey]}</span></span></div>; })}</div></section></div>
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold text-[var(--foreground-secondary)]">Importes por módulo</h2>{Object.keys(amountBreakdown).length ? <div className="mt-4 divide-y divide-[var(--line-light)]">{Object.entries(amountBreakdown).map(([slug, data]) => <div key={slug} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="text-[var(--muted-light)]">{moduleCatalog.find((m) => m.slug === slug)?.name ?? slug}<span className="ml-2 text-xs text-[var(--muted-light)]">({data.count} registros)</span></span><span className="text-right"><strong className="block text-[var(--foreground-secondary)]">{money.format(data.total)}</strong><span className="text-xs text-[var(--muted-light)]">Promedio {money.format(data.average)}</span></span></div>)}</div> : <p className="mt-3 text-sm text-[var(--muted-light)]">No hay importes cargados para agrupar.</p>}</section>
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold text-[var(--foreground-secondary)]">Próximas fechas y atrasos</h2>{records.filter((r) => r.due_date && r.status !== "completed" && r.status !== "cancelled").sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")).slice(0, 8).length ? <div className="mt-3 divide-y divide-[var(--line-light)]">{records.filter((r) => r.due_date && r.status !== "completed" && r.status !== "cancelled").sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")).slice(0, 8).map((r) => <div key={r.id} className="flex justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate text-[var(--muted-light)]">{r.title}</span><span className={`shrink-0 text-xs font-semibold ${new Date((r.due_date ?? "") + "T12:00:00") < new Date(today + "T12:00:00") ? "text-[var(--error)]" : "text-[var(--muted-light)]"}`}>{new Date((r.due_date ?? "") + "T12:00:00").toLocaleDateString("es-AR")}</span></div>)}</div> : <p className="mt-3 text-sm text-[var(--muted-light)]">No hay fechas pendientes registradas.</p>}</section>
  </div>;
}

function BasicReportsView({ records, industry }: { records: BusinessRecord[]; industry: (typeof industries)[Industry] }) {
  const completed = records.filter((record) => record.status === "completed").length;
  const pending = getPendingRecords(records).length;
  const completionRate = getCompletionRate(records.map((record) => ({ status: record.status })));
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Resumen operativo</p><h1 className="mt-2 text-2xl font-semibold text-[var(--foreground-secondary)]">Informes de {industry.label.toLowerCase()}</h1><p className="mt-1 text-sm text-[var(--muted-light)]">Métricas esenciales del negocio seleccionado.</p></div><div className="grid gap-4 sm:grid-cols-3"><StatCard icon={ClipboardList} label="Registros" value={String(records.length)} note="Total almacenado"/><StatCard icon={CheckSquare} label="Completados" value={String(completed)} note="Registros terminados"/><StatCard icon={Activity} label="Pendientes" value={String(pending)} note="Abiertos o en curso"/></div><section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><h2 className="font-semibold text-[var(--foreground-secondary)]">Tasa de cumplimiento</h2><p className="mt-3 text-3xl font-semibold text-[var(--accent)]">{completionRate === null ? "N/D" : `${completionRate.toFixed(1)}%`}</p><p className="mt-2 text-sm text-[var(--muted-light)]">El análisis avanzado y los importes por módulo están disponibles desde Pro.</p></section></div>;
}

function SubscriptionView({ subscription }: { subscription: Props["subscription"] }) {
  const current = subscription.plan;
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">MétricaSur Plans</p><h1 className="mt-2 text-2xl font-semibold text-[var(--foreground-secondary)]">Tu suscripción</h1><p className="mt-1 text-sm text-[var(--muted-light)]">Capacidad clara para que sepas qué incluye tu plan y cuándo conviene crecer.</p></div><section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm text-[var(--muted-light)]">Plan actual</p><h2 className="mt-2 text-3xl font-semibold text-[var(--foreground-secondary)]">{current.name}</h2><p className="mt-2 text-sm text-[var(--muted-light)]">{current.description}</p></div><div className="text-left sm:text-right"><p className="text-3xl font-semibold text-[var(--accent)]">USD {current.priceUsdMonthly}<span className="text-sm font-normal text-[var(--muted-light)]">/mes</span></p><span className="mt-2 inline-flex rounded-full bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">{subscription.status === "active" ? "Activo" : subscription.status}</span></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><UsageMeter label="Registros este mes (cuenta)" current={subscription.monthlyRecords} limit={current.maxMonthlyRecords}/><UsageMeter label="Negocios de la cuenta" current={subscription.businessCount} limit={current.maxBusinesses}/></div></section><div className="grid gap-4 lg:grid-cols-3">{Object.values(subscriptionPlans).map((plan) => <article key={plan.id} className={`rounded-2xl border p-5 ${plan.id === current.id ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--line)] bg-[var(--surface)]"}`}><div className="flex items-center justify-between"><h2 className="font-semibold text-[var(--foreground-secondary)]">{plan.name}</h2>{plan.id === current.id && <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold text-white">Actual</span>}</div><p className="mt-3 text-2xl font-semibold text-[var(--foreground-secondary)]">USD {plan.priceUsdMonthly}<span className="text-xs font-normal text-[var(--muted-light)]">/mes</span></p><ul className="mt-5 space-y-2 text-sm text-[var(--muted-light)]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success)]"/>{feature}</li>)}</ul></article>)}</div><p className="text-xs text-[var(--muted-light)]">Los pagos todavía no están conectados. Los precios y límites se administran desde la configuración central de planes.</p></div>;
}

function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const percentage = limit === null ? 0 : Math.min(100, (current / limit) * 100);
  return <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><div className="flex justify-between gap-3 text-sm"><span className="text-[var(--muted-light)]">{label}</span><span className="font-semibold text-[var(--foreground-secondary)]">{current} / {limit ?? "∞"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line-light)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${percentage}%` }}/></div></div>;
}

function AssistantView({ records, industry }: { records: BusinessRecord[]; industry: (typeof industries)[Industry] }) {
  const [question,setQuestion] = useState("");
  const [answer,setAnswer] = useState("");
  function ask() {
    const q=question.trim().toLowerCase();
    if(!q){setAnswer("Escribí una consulta para que pueda revisar los datos de tu negocio.");return;}
    const pending=getPendingRecords(records);
    const overdue=getOverdueRecords(records, getTodayInBuenosAires());
    if(/venc|atras|demor/.test(q)) setAnswer(`Encontré ${overdue.length} registro(s) vencido(s). ${overdue.slice(0,5).map(r=>r.title).join(", ") || "No hay registros vencidos."}`);
    else if(/pendient|abiert|tarea|falta/.test(q)) setAnswer(`Tenés ${pending.length} registro(s) pendiente(s) o en curso. ${pending.slice(0,5).map(r=>r.title).join(", ") || "No hay pendientes."}`);
    else if(/venta|ingres|factur|importe|dinero/.test(q)) setAnswer(`La suma de importes cargados en todos los módulos es ${new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(records.reduce((s,r)=>s+(r.amount??0),0))}. Es una suma de registros, no necesariamente ventas cobradas.`);
    else if(/cliente|proveedor|contact/.test(q)){const matches=records.filter(r=>/cliente|proveedor|contact/.test(r.module_slug));setAnswer(`Hay ${matches.length} registro(s) de clientes/proveedores. ${matches.slice(0,5).map(r=>r.title).join(", ") || "Todavía no hay contactos cargados."}`);}
    else setAnswer(`Revisé los ${records.length} registros de ${industry.label}. Puedo resumir pendientes, vencimientos, importes y actividad. Probá preguntando "¿Qué tengo vencido?" o "¿Cuántas tareas están pendientes?"`);
  }
  return <div className="mx-auto max-w-3xl space-y-5"><div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10"><span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]"><Sparkles size={23}/></span><h1 className="mt-5 text-2xl font-semibold text-[var(--foreground-secondary)]">Asistente de negocio</h1><p className="mt-2 text-sm leading-6 text-[var(--muted-light)]">Ya puede consultar tus registros y responder preguntas básicas. Esta primera versión no modifica datos ni ejecuta acciones externas.</p><div className="mt-6 flex flex-wrap gap-2">{["¿Qué tengo vencido?","¿Cuántas tareas están pendientes?","¿Qué importes registré?"].map(q=><button key={q} onClick={()=>{setQuestion(q);setAnswer("");}} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted-light)] hover:bg-[var(--surface-hover)]">{q}</button>)}</div><form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();ask();}}><label className="block text-xs font-semibold text-[var(--muted-light)]">Consultá sobre {industry.label.toLowerCase()}<textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} placeholder="Ej. ¿Qué cosas necesitan atención esta semana?" className="mt-2 w-full rounded-xl border border-[var(--line)] p-3 text-sm font-normal outline-none focus:border-[var(--accent)]"/></label><button className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white">Consultar mis datos</button></form>{answer&&<div role="status" className="mt-5 rounded-xl border border-[var(--success-light)] bg-[var(--success-light)]/50 p-4 text-sm leading-6 text-[var(--success)]">{answer}</div>}</div><p className="text-xs leading-5 text-[var(--muted-light)]">Importante: es un asistente local basado en reglas y tus registros. Todavía no usa un modelo de IA externo.</p></div>;
}

const moduleGroups: { title: string; slugs: string[] }[] = [
  { title: "Ventas y clientes", slugs: ["sales", "customers", "proposals", "services"] },
  { title: "Operaciones", slugs: ["inventory", "purchasing", "suppliers", "waste_tracking", "production", "work_orders"] },
  { title: "Organización", slugs: ["appointments", "projects", "time_tracking", "tasks"] },
];

const statusLabels = { open: "Pendiente", in_progress: "En curso", completed: "Completado", cancelled: "Cancelado" };
const statusStyles = { open: "bg-[var(--warning-light)] text-[var(--warning)]", in_progress: "bg-[var(--line-light)] text-[var(--muted-light)]", completed: "bg-[var(--success-light)] text-[var(--success)]", cancelled: "bg-[var(--line-light)] text-[var(--muted-light)]" };

function ModuleRow({ slug, on, isManager, activeBusiness }: { slug: string; on: boolean; isManager: boolean; activeBusiness: { id: string } | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--muted-light)]">{moduleCatalog.find((m) => m.slug === slug)?.name ?? slug}</p>
        <p className="text-[11px] text-[var(--muted-light)]">{moduleCatalog.find((m) => m.slug === slug)?.description ?? ""}</p>
      </div>
      {isManager && activeBusiness ? (
        <form action={setBusinessModuleEnabled}><input type="hidden" name="businessId" value={activeBusiness.id}/><input type="hidden" name="moduleSlug" value={slug}/><input type="hidden" name="enabled" value={String(!on)}/><button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--muted-light)] hover:bg-[var(--surface-hover)]">{on ? "Desactivar" : "Activar"}</button></form>
      ) : (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${on ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-[var(--muted-light)]/20 text-[var(--muted-light)]"}`}>{on ? "Activo" : "Inactivo"}</span>
      )}
    </div>
  );
}

function SettingsView(props: Props & { industry: (typeof industries)[Industry]; isManager: boolean }) {
  const { prefs, setPrefs: updatePrefs } = useDashboardPrefs();
  const { setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-[var(--foreground-secondary)]">Configuración</h1><p className="mt-2 text-sm text-[var(--muted-light)]">Todo lo importante de tu cuenta y tu negocio, en un solo lugar.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground-secondary)]"><Store size={18} className="text-[var(--accent)]"/> Tu espacio de trabajo</h2><p className="mt-1 text-xs text-[var(--muted-light)]">Nombre y rubro del negocio activo.</p>{props.activeBusiness && <div className="mt-5 rounded-xl bg-[var(--surface-elevated)] p-4"><p className="text-sm font-semibold text-[var(--foreground-secondary)]">{props.activeBusiness.name}</p><p className="mt-1 text-xs text-[var(--muted-light)]">{props.industry.label} · {props.activeRole ?? "miembro"}</p></div>}<div className="mt-5"><h3 className="text-sm font-semibold text-[var(--foreground-secondary)]">Tus espacios</h3><div className="mt-2 space-y-2">{props.businesses.map((business) => <div key={business.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3"><span className="min-w-0 truncate text-sm text-[var(--muted-light)]">{business.name}</span>{business.id === props.activeBusiness?.id ? <span className="shrink-0 text-[10px] font-semibold text-[var(--accent)]">Activo</span> : <form action={switchBusiness}><input type="hidden" name="businessId" value={business.id}/><button className="text-xs font-semibold text-[var(--accent)] hover:underline">Cambiar</button></form>}</div>)}</div></div>
        <details className="mt-5 rounded-xl border border-[var(--line-light)] p-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--foreground-secondary)]">Crear otro espacio</summary><form action={createBusiness} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-[var(--muted-light)]">Nombre<input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi estudio" className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]"/></label><label className="block text-xs font-semibold text-[var(--muted-light)]">Rubro<select name="industry" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal"><option value="" disabled>Seleccioná un rubro</option>{Object.entries(industries).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><button className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white">Crear espacio</button></form></details>
        {props.activeBusiness && props.activeRole === "owner" && <details className="mt-4 rounded-xl border border-[var(--error-light)] bg-[var(--error-light)]/50 p-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--error)]">Zona de peligro: eliminar espacio</summary><p className="mt-2 text-xs leading-5 text-[var(--error)]">Esta acción es permanente y elimina el espacio y sus datos asociados.</p><DeleteBusinessForm businessId={props.activeBusiness.id} businessName={props.activeBusiness.name}/></details>}
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground-secondary)]"><Package size={18} className="text-[var(--accent)]"/> Módulos y herramientas</h2><p className="mt-1 text-xs text-[var(--muted-light)]">Mostrá solo las herramientas que realmente necesitás.</p>{props.moduleSetupMissing && props.isManager && props.activeBusiness && <div className="mt-4 rounded-xl border border-[var(--warning-light)] bg-[var(--warning-light)]/50 p-4"><p className="text-sm font-semibold text-[var(--warning)]">Este espacio todavía no tiene módulos instalados</p><p className="mt-1 text-xs leading-5 text-[var(--warning)]">Podés restaurar las herramientas recomendadas para {props.industry.label.toLowerCase()}. Esto no borra ni modifica registros existentes.</p><form action={restoreRecommendedBusinessModules} className="mt-3"><input type="hidden" name="businessId" value={props.activeBusiness.id}/><button className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">Instalar módulos recomendados</button></form></div>}<div className="mt-5 space-y-3">{moduleGroups.map((group) => <details key={group.title} open className="rounded-xl border border-[var(--line)] p-4"><summary className="cursor-pointer text-sm font-semibold text-[var(--foreground-secondary)]">{group.title}</summary><div className="mt-3 space-y-3">{group.slugs.map((slug) => { const moduleItem = moduleCatalog.find((item) => item.slug === slug); if (!moduleItem) return null; const on = props.enabledModules[slug] ?? false; return <ModuleRow key={slug} slug={slug} on={on} isManager={props.isManager} activeBusiness={props.activeBusiness}/>; })}</div></details>)}</div>
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7 xl:col-span-2"><h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground-secondary)]"><Users size={18} className="text-[var(--accent)]"/> Tu perfil</h2><p className="mt-1 text-xs text-[var(--muted-light)]">Información de tu cuenta personal.</p><form action={updateProfile} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-xs font-semibold text-[var(--muted-light)]">Nombre<input name="fullName" defaultValue={props.fullName} required minLength={2} maxLength={80} placeholder="Tu nombre" className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]"/></label><div><p className="text-xs font-semibold text-[var(--muted-light)]">Email</p><p className="mt-1.5 rounded-xl bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--muted-light)]">{props.email}</p></div><button className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:border-[var(--accent)]">Guardar perfil</button></form></section>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7 xl:col-span-2"><h2 className="flex items-center gap-2 text-base font-semibold text-[var(--foreground-secondary)]"><Monitor size={18} className="text-[var(--accent)]"/> Apariencia y preferencias</h2><p className="mt-1 text-xs text-[var(--muted-light)]">Personalizá cómo se ve y se comporta MétricaSur.</p>
        <form className="mt-5 space-y-5" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const themeValue = fd.get("theme");
          const density = fd.get("density");
          const selectedTheme: Theme = themeValue === "light" || themeValue === "dark" || themeValue === "system" ? themeValue : "system";
          updatePrefs({
            theme: selectedTheme,
            layoutDensity: density === "compact" || density === "comfortable" ? density as LayoutDensity : "comfortable",
            sidebarCollapsed: fd.get("sidebar") === "on",
            showWelcomeCard: fd.get("welcome") === "on",
          });
          setTheme(selectedTheme);
          setSaved(true);
        }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[var(--muted-light)]">Tema de color</p>
              <select name="theme" defaultValue={prefs.theme} className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]">
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="system">Sistema</option>
              </select>
              <p className="mt-1 text-[10px] text-[var(--muted-light)]">Elige entre modo claro, oscuro o seguir la configuración de tu sistema.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--muted-light)]">Densidad de diseño</p>
              <select name="density" defaultValue={prefs.layoutDensity} className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]">
                <option value="comfortable">Cómodo</option>
                <option value="compact">Compacto</option>
              </select>
              <p className="mt-1 text-[10px] text-[var(--muted-light)]">Controla el espacio entre elementos en pantallas y formularios.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="sidebar" value="on" defaultChecked={prefs.sidebarCollapsed} className="rounded border-[var(--line)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span className="text-sm text-[var(--foreground-secondary)]">Iniciar con el menú lateral contraído</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="welcome" value="on" defaultChecked={prefs.showWelcomeCard} className="rounded border-[var(--line)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span className="text-sm text-[var(--foreground-secondary)]">Mostrar tarjeta de bienvenida en el panel</span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]">Guardar preferencias</button>
            {saved && <p role="status" className="text-xs font-medium text-[var(--success)]">Preferencias guardadas y aplicadas.</p>}
          </div>
        </form>
      </section>
    </div>
  </div>;
}

function EmptyWorkspace() {
  return <div className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
    <div className="text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]"><Store size={22}/></span><h1 className="mt-4 text-xl font-semibold text-[var(--foreground-secondary)]">Creá tu primer espacio</h1><p className="mt-2 text-sm leading-6 text-[var(--muted-light)]">Cada espacio representa un negocio y mantiene su propia configuración. Completá estos datos para empezar.</p></div>
    <form action={createBusiness} className="mt-7 space-y-4">
      <label className="block text-xs font-semibold text-[var(--muted-light)]">Nombre del negocio<input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi comercio" className="mt-1.5 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]"/></label>
      <label className="block text-xs font-semibold text-[var(--muted-light)]">Rubro<select name="industry" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal"><option value="" disabled>Seleccioná un rubro</option>{Object.entries(industries).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
      <button className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">Crear mi espacio</button>
    </form>
  </div>;
}

function EmptyModules() {
  return <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center"><Package size={25} className="mx-auto text-[var(--muted-light)]"/><p className="mt-3 text-sm font-semibold text-[var(--muted-light)]">No hay herramientas activas en esta sección</p><p className="mt-1 text-xs text-[var(--muted-light)]">Podés habilitarlas desde Configuración.</p><Link href="/app?section=settings" className="mt-4 inline-flex text-xs font-semibold text-[var(--accent)] hover:underline">Ir a configuración <ArrowRight size={13}/></Link></div>;
}
