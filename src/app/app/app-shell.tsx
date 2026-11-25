"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  CalendarDays, Check, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  CreditCard, LayoutDashboard, LogOut, Menu, Package, Plus, Settings2, ShoppingBag,
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

sectionTitles.subscription = { title: "SuscripciÃ³n", description: "ConocÃ© tu plan, uso y opciones de crecimiento." };

sectionTitles.subscription = { title: "SuscripciÃ³n", description: "ConocÃ© tu plan, uso y opciones de crecimiento." };

const moduleIcons: Record<string, typeof ShoppingBag> = {
  sales: ShoppingBag, customers: Users, services: BriefcaseBusiness, appointments: CalendarDays,
  proposals: ClipboardList, inventory: Package, purchasing: CreditCard, suppliers: Store,
  waste_tracking: Activity, menu_costing: Wallet, projects: BriefcaseBusiness,
  time_tracking: Activity, production: Store, work_orders: ClipboardList, tasks: Check,
};

function NavLink({ id, label, icon: Icon, active, onClick }: {
  id: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={`/app?section=${id}`} onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#eaf4ee] text-[#176b4f]" : "text-[#65736b] hover:bg-[#f3f6f4] hover:text-[#263b30]"}`}>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8}/>
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-[#19805c]"/>}
    </Link>
  );
}

export function AppShell(props: Props) {
  const [collapsed, setCollapsed] = useState(false);
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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center justify-between border-b border-[#edf0ee] px-5">
        <Link href="/app" className={`flex items-center gap-3 overflow-hidden ${collapsed ? "lg:justify-center" : ""}`}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#176b4f] text-white"><BarChart3 size={21}/></span>
          {!collapsed && <span className="whitespace-nowrap text-xl font-bold tracking-tight text-[#1c2c24]">métrica<span className="text-[#176b4f]">sur</span></span>}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#718078] hover:bg-[#f2f5f3] lg:hidden" aria-label="Cerrar menú"><X size={19}/></button>
      </div>

      <div className="border-b border-[#edf0ee] p-3">
        <button onClick={() => setBusinessExpanded(!businessExpanded)} className="flex w-full items-center gap-3 rounded-xl border border-[#e7ece9] p-3 text-left hover:bg-[#f8faf8]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5f0] text-[#176b4f]"><Store size={18}/></span>
          {!collapsed && <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[#263b30]">{active?.name ?? "Sin negocio"}</span>
            <span className="block truncate text-xs text-[#89958e]">{industry.label}</span>
          </span>}
          {!collapsed && <ChevronDown size={16} className={`shrink-0 text-[#8b9790] transition ${businessExpanded ? "rotate-180" : ""}`}/>}
        </button>
        {businessExpanded && !collapsed && <div className="mt-2 space-y-1 rounded-xl bg-[#f7f9f7] p-2">
          {props.businesses.map((business) => <form action={switchBusiness} key={business.id}>
            <input type="hidden" name="businessId" value={business.id}/>
            <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#5f7066] hover:bg-white">
              <span className="truncate">{business.name}</span>{business.id === active?.id && <Check size={14} className="text-[#176b4f]"/>}
            </button>
          </form>)}
          <Link href="/app?section=settings" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#176b4f]"><Plus size={14}/> Crear o administrar espacios</Link>
        </div>}
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => <div key={group.title}>
          {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa59e]">{group.title}</p>}
          <div className="space-y-1">{group.items.map((item) =>
            <NavLink key={item.id} {...item} active={props.section === item.id} onClick={() => setMobileOpen(false)}/>)}</div>
        </div>)}
        <div>
          <button onClick={() => setModulesExpanded(!modulesExpanded)} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa59e] hover:text-[#52645a] ${collapsed ? "justify-center" : ""}`}>
            {!collapsed && <><span className="flex-1 text-left">Módulos activos</span><span className="rounded-full bg-[#edf2ee] px-2 py-0.5 text-[10px]">{activeCount}</span><ChevronDown size={14} className={modulesExpanded ? "rotate-180" : ""}/></>}
            {collapsed && <Package size={17}/>}
          </button>
          {modulesExpanded && <div className="space-y-1">{enabledModuleList.map((module) => {
            const Icon = moduleIcons[module.slug] ?? Package;
            return <NavLink key={module.slug} id={module.slug} label={module.name} icon={Icon} active={props.section === module.slug} onClick={() => setMobileOpen(false)}/>;
          })}</div>}
          {!enabledModuleList.length && !collapsed && <p className="px-3 py-2 text-xs text-[#9aa59e]">Todavía no hay módulos activos.</p>}
        </div>
        <div className="border-t border-[#edf0ee] pt-4">
          <NavLink id="subscription" label="SuscripciÃ³n" icon={CreditCard} active={props.section === "subscription"} onClick={() => setMobileOpen(false)}/>
          <NavLink id="assistant" label="Asistente IA" icon={Sparkles} active={props.section === "assistant"} onClick={() => setMobileOpen(false)}/>
          <NavLink id="settings" label="Configuración" icon={Settings2} active={props.section === "settings"} onClick={() => setMobileOpen(false)}/>
        </div>
      </nav>

      <div className="border-t border-[#edf0ee] p-3">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm font-bold text-[#176b4f]">{props.firstName.slice(0,1).toUpperCase()}</span>
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#33463a]">{props.firstName}</span><span className="block truncate text-[11px] text-[#8b9790]">{props.email}</span></span>}
          <form action={signOut}><button aria-label="Cerrar sesión" className="rounded-lg p-2 text-[#829087] hover:bg-[#f2f5f3] hover:text-[#176b4f]"><LogOut size={16}/></button></form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#1e2d25]">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#e7ece9] bg-white transition-all duration-200 lg:block ${collapsed ? "w-[84px]" : "w-[272px]"}`}>
        {sidebar}
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-[88px] flex size-7 items-center justify-center rounded-full border border-[#e2e9e4] bg-white text-[#718078] shadow-sm hover:text-[#176b4f]" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</button>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button className="absolute inset-0 bg-[#17251d]/35" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"/>
        <aside className="absolute inset-y-0 left-0 w-[min(88vw,320px)] bg-white shadow-2xl">{sidebar}</aside>
      </div>}

      <div className={`min-h-screen transition-all duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e9eeeb] bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-[#52645a] hover:bg-[#f1f5f2] lg:hidden" aria-label="Abrir menú"><Menu size={21}/></button>
            <div><p className="text-sm font-semibold text-[#263b30]">{page.title}</p><p className="hidden text-xs text-[#8b9790] sm:block">{active?.name ?? "Tu espacio de trabajo"}</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-[#edf5f0] px-3 py-1.5 text-xs font-medium text-[#347253] sm:inline-flex">{industry.label}</span>
            <Link href="/app?section=reports" className="rounded-xl p-2.5 text-[#748279] hover:bg-[#f2f5f3]" aria-label="Ir a informes" title="Informes"><Bell size={18}/></Link>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf2ed] text-sm font-bold text-[#176b4f]">{props.firstName.slice(0,1).toUpperCase()}</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          {props.notices.error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{props.notices.error}</p>}
          {props.notices.dataIssue && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{props.notices.dataIssue} No vamos a mostrar estas secciones como si estuvieran vacías.</p>}
          {(props.notices.created || props.notices.profile || props.notices.modules || props.notices.deleted || props.notices.saved || props.notices.deletedRecord) && <p role="status" className="mb-5 rounded-xl border border-[#cfe6d8] bg-[#edf6f1] px-4 py-3 text-sm text-[#24513f]">{props.notices.created ? "Tu espacio de trabajo está creado." : props.notices.profile ? "Tu perfil se actualizó correctamente." : props.notices.modules ? "La configuración de módulos se actualizó." : props.notices.saved ? "El registro se guardó correctamente." : props.notices.deletedRecord ? "El registro se eliminó." : "El espacio de trabajo se eliminó correctamente."}</p>}

          {!active ? <EmptyWorkspace/> : props.section === "home" || !sectionTitles[props.section] && !moduleCatalog.some((m) => m.slug === props.section) ? (
            <Dashboard firstName={props.firstName} business={active} industry={industry} modules={enabledModuleList.length} records={props.allRecords}/>
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

function Dashboard({ firstName, business, industry, modules, records }: { firstName: string; business: Business; industry: (typeof industries)[Industry]; modules: number; records: BusinessRecord[] }) {
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-[#718078]">Tu resumen de hoy</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20352a] sm:text-[34px]">¡Hola, {firstName}! <span className="text-2xl">👋</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#78867e]">Este es el punto de partida para organizar {business.name.toLowerCase()}. Vamos paso a paso.</p></div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e2eae4] bg-white px-3 py-2 text-xs font-medium text-[#5e7567]"><span className="size-2 rounded-full bg-[#41a477]"/> Espacio activo</span>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Store} label="Rubro" value={industry.label} note="Espacio configurado"/>
      <StatCard icon={Package} label="Registros" value={String(records.length)} note="Operaciones guardadas"/>
      <StatCard icon={ClipboardList} label="Pendientes" value={String(records.filter((r) => r.status === "open" || r.status === "in_progress").length)} note="Requieren seguimiento"/>
      <StatCard icon={Sparkles} label="Módulos activos" value={String(modules)} note="Herramientas habilitadas"/>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#2b4034]">Tu espacio de trabajo</h2><p className="mt-1 text-xs text-[#89958e]">Una base clara para empezar a gestionar.</p></div><span className="rounded-lg bg-[#edf5f0] p-2 text-[#347253]"><LayoutDashboard size={18}/></span></div>
        <div className="mt-6 rounded-xl bg-[#f7faf8] p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f2eb] text-[#28734f]"><Check size={20}/></span><div><h3 className="text-sm font-semibold text-[#33483b]">Tu negocio ya tiene una estructura inicial</h3><p className="mt-1 text-sm leading-6 text-[#77857d]">Configuramos las herramientas recomendadas para {industry.label.toLowerCase()}. Podés ajustar los módulos cuando lo necesites.</p><Link href="/app?section=settings" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#176b4f] hover:underline">Revisar configuración <ArrowRight size={15}/></Link></div></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <QuickLink href="/app?section=operations" icon={Store} title="Ver operaciones" description="Accedé a tus herramientas activas"/>
          <QuickLink href="/app?section=organization" icon={ClipboardList} title="Organizar trabajo" description="Tareas, proyectos y agenda"/>
        </div>
      </section>
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-2"><Activity size={18} className="text-[#28734f]"/><h2 className="text-base font-semibold text-[#2b4034]">Actividad reciente</h2></div>
        {records.length ? <div className="mt-5 space-y-3">{records.slice(0,5).map((record) => <div key={record.id} className="flex items-center justify-between gap-3 border-b border-[#edf0ee] pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#405448]">{record.title}</p><p className="text-[11px] text-[#89958e]">{moduleCatalog.find((m) => m.slug === record.module_slug)?.name ?? record.module_slug} · {new Date(record.created_at).toLocaleDateString("es-AR")}</p></div><span className="shrink-0 text-[10px] font-semibold text-[#397552]">{record.status === "completed" ? "Completado" : record.status === "in_progress" ? "En curso" : record.status === "cancelled" ? "Cancelado" : "Pendiente"}</span></div>)}<Link href="/app?section=reports" className="inline-flex text-xs font-semibold text-[#176b4f] hover:underline">Ver informes <ArrowRight size={13}/></Link></div> : <div className="flex min-h-[190px] flex-col items-center justify-center py-8 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#f0f5f1] text-[#7e9b88]"><ArrowDownLeft size={22}/></span><p className="mt-4 text-sm font-semibold text-[#46594d]">Todavía no hay actividad</p><p className="mt-1 max-w-[230px] text-xs leading-5 text-[#8b9790]">Creá registros en tus módulos y aparecerán acá.</p><Link href="/app?section=operations" className="mt-3 text-xs font-semibold text-[#176b4f]">Ir a operaciones →</Link></div>}
      </section>
    </div>

    <section className="rounded-2xl border border-[#dce9e0] bg-gradient-to-r from-[#edf6f0] to-white p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#28734f]"><Sparkles size={20}/></span><div><h2 className="text-sm font-semibold text-[#2d4938]">MétricaSur se adapta a tu negocio</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#74857a]">{industry.description} Vamos a ir incorporando herramientas específicas para que puedas gestionar sin complicarte.</p></div></div><Link href="/app?section=settings" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#176b4f] hover:underline">Personalizar <ArrowUpRight size={16}/></Link></div>
    </section>
  </div>;
}

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Store; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[#e5ebe7] bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#85928a]">{label}</span><Icon size={18} className="text-[#83a18e]"/></div><p className="mt-4 truncate text-xl font-semibold text-[#2d4235]">{value}</p><p className="mt-1 text-xs text-[#96a199]">{note}</p></div>;
}

function QuickLink({ href, icon: Icon, title, description }: { href: string; icon: typeof Store; title: string; description: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-[#e8ede9] p-4 transition hover:border-[#c8dbce] hover:bg-[#fbfdfb]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-[#558267]"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#3b5143]">{title}</span><span className="mt-1 block text-xs text-[#89958e]">{description}</span></span><ArrowRight size={16} className="text-[#a0aaa3] transition group-hover:translate-x-0.5 group-hover:text-[#28734f]"/></Link>;
}

function ModuleCollection({ title, description, modules }: { title: string; description: string; modules: typeof moduleCatalog }) {
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold tracking-tight text-[#263b30]">{title}</h1><p className="mt-2 text-sm text-[#7d8a82]">{description}</p></div>
    {modules.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{modules.map((module) => { const Icon = moduleIcons[module.slug] ?? Package; return <Link key={module.slug} href={`/app?section=${module.slug}`} className="group rounded-2xl border border-[#e5ebe7] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c8dbce] hover:shadow-sm"><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf5f0] text-[#397552]"><Icon size={19}/></span><ArrowUpRight size={17} className="text-[#a0aaa3] group-hover:text-[#28734f]"/></div><h2 className="mt-4 text-sm font-semibold text-[#354a3b]">{module.name}</h2><p className="mt-1 text-xs leading-5 text-[#839087]">{module.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#397552]">Ver módulo <ArrowRight size={13}/></span></Link>; })}</div> : <EmptyModules/>}
  </div>;
}

function ReportsView({ records, industry, plan }: { records: BusinessRecord[]; industry: (typeof industries)[Industry]; plan: SubscriptionPlan }) {
  const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const totalAmount = records.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const pending = getPendingRecords(records);
  const overdue = getOverdueRecords(records, getTodayInBuenosAires());
  const byModule = moduleCatalog.map((m) => ({ ...m, count: records.filter((r) => r.module_slug === m.slug).length })).filter((m) => m.count).sort((a,b) => b.count-a.count);
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
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#43815f]">Análisis del negocio</p><h1 className="mt-2 text-2xl font-semibold text-[#263b30]">Informes de {industry.label.toLowerCase()}</h1><p className="mt-1 text-sm text-[#7d8a82]">Estadísticas calculadas a partir de tus registros guardados.</p></div><button onClick={exportCsv} disabled={!records.length} className="rounded-xl bg-[#176b4f] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Exportar CSV</button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={ClipboardList} label="Registros" value={String(records.length)} note="Total almacenado"/><StatCard icon={Activity} label="Pendientes" value={String(pending.length)} note="Abiertos o en curso"/><StatCard icon={CalendarDays} label="Vencidos" value={String(overdue.length)} note="Requieren atención"/><StatCard icon={Wallet} label="Importes cargados" value={money.format(totalAmount)} note="Suma de importes registrados"/>
  {completionRate !== null ? (
    <StatCard icon={CheckSquare} label="Tasa de cumplimiento" value={completionRate.toFixed(1) + "%"} note="Completado sobre no cancelados"/>
  ) : (
    <StatCard icon={Clock} label="Tasa de cumplimiento" value="N/D" note="No hay registros no cancelados"/>
  )}</div>
    <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-[#e5ebe7] bg-white p-5"><h2 className="font-semibold text-[#304638]">Actividad por módulo</h2>{byModule.length ? <div className="mt-4 space-y-4">{byModule.map((m) => <div key={m.slug}><div className="mb-1 flex justify-between text-xs"><span className="font-medium text-[#52645a]">{m.name}</span><span className="text-[#839087]">{m.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf2ee]"><div className="h-full rounded-full bg-[#39805b]" style={{width:`${Math.max(4,m.count/records.length*100)}%`}}/></div></div>)}</div> : <p className="mt-4 text-sm text-[#89958e]">Todavía no hay datos para analizar. Empezá creando registros en tus módulos.</p>}</section>
    <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5"><h2 className="font-semibold text-[#304638]">Distribución por estado</h2><div className="mt-4 space-y-3">{[["Pendiente",records.filter(r=>r.status==="open").length],["En curso",records.filter(r=>r.status==="in_progress").length],["Completado",records.filter(r=>r.status==="completed").length],["Cancelado",records.filter(r=>r.status==="cancelled").length]].map(([label,count])=><div key={String(label)} className="flex items-center justify-between rounded-lg bg-[#f7faf8] px-3 py-2 text-sm"><span className="text-[#52645a]">{label}</span><strong className="text-[#304638]">{count}</strong></div>)}</div></section></div>
    <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5"><h2 className="font-semibold text-[#304638]">Importes por módulo</h2>{Object.keys(amountBreakdown).length ? <div className="mt-4 divide-y divide-[#edf0ee]">{Object.entries(amountBreakdown).map(([slug, data]) => <div key={slug} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="text-[#52645a]">{moduleCatalog.find((m) => m.slug === slug)?.name ?? slug}<span className="ml-2 text-xs text-[#89958e]">({data.count} registros)</span></span><span className="text-right"><strong className="block text-[#304638]">{money.format(data.total)}</strong><span className="text-xs text-[#89958e]">Promedio {money.format(data.average)}</span></span></div>)}</div> : <p className="mt-3 text-sm text-[#89958e]">No hay importes cargados para agrupar.</p>}</section>
    <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5"><h2 className="font-semibold text-[#304638]">Próximas fechas y atrasos</h2>{records.filter(r=>r.due_date && r.status!=="completed" && r.status!=="cancelled").sort((a,b)=>(a.due_date??"").localeCompare(b.due_date??"")).slice(0,8).length ? <div className="mt-3 divide-y divide-[#edf0ee]">{records.filter(r=>r.due_date && r.status!=="completed" && r.status!=="cancelled").sort((a,b)=>(a.due_date??"").localeCompare(b.due_date??"")).slice(0,8).map(r=><div key={r.id} className="flex justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate text-[#52645a]">{r.title}</span><span className="shrink-0 text-xs text-[#839087]">{new Date((r.due_date??"")+"T12:00:00").toLocaleDateString("es-AR")}</span></div>)}</div> : <p className="mt-3 text-sm text-[#89958e]">No hay fechas pendientes registradas.</p>}</section>
  </div>;
}

function BasicReportsView({ records, industry }: { records: BusinessRecord[]; industry: (typeof industries)[Industry] }) {
  const completed = records.filter((record) => record.status === "completed").length;
  const pending = getPendingRecords(records).length;
  const completionRate = getCompletionRate(records.map((record) => ({ status: record.status })));
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">Resumen operativo</p><h1 className="mt-2 text-2xl font-semibold text-[#F1F5F9]">Informes de {industry.label.toLowerCase()}</h1><p className="mt-1 text-sm text-[#94A3B8]">Métricas esenciales del negocio seleccionado.</p></div><div className="grid gap-4 sm:grid-cols-3"><StatCard icon={ClipboardList} label="Registros" value={String(records.length)} note="Total almacenado"/><StatCard icon={CheckSquare} label="Completados" value={String(completed)} note="Registros terminados"/><StatCard icon={Activity} label="Pendientes" value={String(pending)} note="Abiertos o en curso"/></div><section className="rounded-2xl border border-[#263445] bg-[#151E29] p-6"><h2 className="font-semibold text-[#F1F5F9]">Tasa de cumplimiento</h2><p className="mt-3 text-3xl font-semibold text-[#38BDF8]">{completionRate === null ? "N/D" : `${completionRate.toFixed(1)}%`}</p><p className="mt-2 text-sm text-[#94A3B8]">El análisis avanzado y los importes por módulo están disponibles desde Pro.</p></section></div>;
}

function SubscriptionView({ subscription }: { subscription: Props["subscription"] }) {
  const current = subscription.plan;
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">MétricaSur Plans</p><h1 className="mt-2 text-2xl font-semibold text-[#F1F5F9]">Tu suscripción</h1><p className="mt-1 text-sm text-[#94A3B8]">Capacidad clara para que sepas qué incluye tu plan y cuándo conviene crecer.</p></div><section className="rounded-2xl border border-[#263445] bg-[#151E29] p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm text-[#94A3B8]">Plan actual</p><h2 className="mt-2 text-3xl font-semibold text-[#F1F5F9]">{current.name}</h2><p className="mt-2 text-sm text-[#94A3B8]">{current.description}</p></div><div className="text-left sm:text-right"><p className="text-3xl font-semibold text-[#38BDF8]">USD {current.priceUsdMonthly}<span className="text-sm font-normal text-[#94A3B8]">/mes</span></p><span className="mt-2 inline-flex rounded-full bg-[#123047] px-3 py-1 text-xs font-semibold text-[#7DD3FC]">{subscription.status === "active" ? "Activo" : subscription.status}</span></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><UsageMeter label="Registros este mes" current={subscription.monthlyRecords} limit={current.maxMonthlyRecords}/><UsageMeter label="Negocios" current={subscription.businessCount} limit={current.maxBusinesses}/></div></section><div className="grid gap-4 lg:grid-cols-3">{Object.values(subscriptionPlans).map((plan) => <article key={plan.id} className={`rounded-2xl border p-5 ${plan.id === current.id ? "border-[#38BDF8] bg-[#122331]" : "border-[#263445] bg-[#151E29]"}`}><div className="flex items-center justify-between"><h2 className="font-semibold text-[#F1F5F9]">{plan.name}</h2>{plan.id === current.id && <span className="rounded-full bg-[#123047] px-2 py-1 text-[10px] font-semibold text-[#7DD3FC]">Actual</span>}</div><p className="mt-3 text-2xl font-semibold text-[#F1F5F9]">USD {plan.priceUsdMonthly}<span className="text-xs font-normal text-[#94A3B8]">/mes</span></p><ul className="mt-5 space-y-2 text-sm text-[#94A3B8]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#22C55E]"/>{feature}</li>)}</ul></article>)}</div><p className="text-xs text-[#64748B]">Los pagos todavía no están conectados. Los precios y límites se administran desde la configuración central de planes.</p></div>;
}

function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const percentage = limit === null ? 0 : Math.min(100, (current / limit) * 100);
  return <div className="rounded-xl border border-[#263445] bg-[#111820] p-4"><div className="flex justify-between gap-3 text-sm"><span className="text-[#94A3B8]">{label}</span><span className="font-semibold text-[#F1F5F9]">{current} / {limit ?? "∞"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#263445]"><div className="h-full rounded-full bg-[#38BDF8]" style={{ width: `${percentage}%` }}/></div></div>;
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
  return <div className="mx-auto max-w-3xl space-y-5"><div className="rounded-2xl border border-[#e5ebe7] bg-white p-7 sm:p-10"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><Sparkles size={23}/></span><h1 className="mt-5 text-2xl font-semibold text-[#263b30]">Asistente de negocio</h1><p className="mt-2 text-sm leading-6 text-[#7d8a82]">Ya puede consultar tus registros y responder preguntas básicas. Esta primera versión no modifica datos ni ejecuta acciones externas.</p><div className="mt-6 flex flex-wrap gap-2">{["¿Qué tengo vencido?","¿Cuántas tareas están pendientes?","¿Qué importes registré?"].map(q=><button key={q} onClick={()=>{setQuestion(q);setAnswer("");}} className="rounded-full border border-[#dce5e0] px-3 py-2 text-xs text-[#52645a] hover:bg-[#f5f8f6]">{q}</button>)}</div><form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();ask();}}><label className="block text-xs font-semibold text-[#52645a]">Consultá sobre {industry.label.toLowerCase()}<textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} placeholder="Ej. ¿Qué cosas necesitan atención esta semana?" className="mt-2 w-full rounded-xl border border-[#dce5e0] p-3 text-sm font-normal outline-none focus:border-[#397552]"/></label><button className="rounded-xl bg-[#176b4f] px-5 py-2.5 text-sm font-semibold text-white">Consultar mis datos</button></form>{answer&&<div role="status" className="mt-5 rounded-xl border border-[#cfe6d8] bg-[#edf6f1] p-4 text-sm leading-6 text-[#24513f]">{answer}</div>}</div><p className="text-xs leading-5 text-[#89958e]">Importante: es un asistente local basado en reglas y tus registros. Todavía no usa un modelo de IA externo.</p></div>;
}

const moduleGroups: { title: string; slugs: string[] }[] = [
  { title: "Ventas y clientes", slugs: ["sales", "customers", "proposals", "services"] },
  { title: "Operaciones", slugs: ["inventory", "purchasing", "suppliers", "waste_tracking", "production", "work_orders"] },
  { title: "Organización", slugs: ["appointments", "projects", "time_tracking", "tasks"] },
];

function SettingsView(props: Props & { industry: (typeof industries)[Industry]; isManager: boolean }) {
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-[#263b30]">Configuración</h1><p className="mt-2 text-sm text-[#7d8a82]">Todo lo importante de tu cuenta y tu negocio, en un solo lugar.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Store size={18} className="text-[#397552]"/> Tu espacio de trabajo</h2><p className="mt-1 text-xs text-[#89958e]">Nombre y rubro del negocio activo.</p>{props.activeBusiness && <div className="mt-5 rounded-xl bg-[#f7faf8] p-4"><p className="text-sm font-semibold text-[#354a3b]">{props.activeBusiness.name}</p><p className="mt-1 text-xs text-[#849087]">{props.industry.label} · {props.activeRole ?? "miembro"}</p></div>}<div className="mt-5"><h3 className="text-sm font-semibold text-[#405448]">Tus espacios</h3><div className="mt-2 space-y-2">{props.businesses.map((business) => <div key={business.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e9eeeb] p-3"><span className="min-w-0 truncate text-sm text-[#52645a]">{business.name}</span>{business.id === props.activeBusiness?.id ? <span className="shrink-0 text-[10px] font-semibold text-[#397552]">Activo</span> : <form action={switchBusiness}><input type="hidden" name="businessId" value={business.id}/><button className="text-xs font-semibold text-[#397552] hover:underline">Cambiar</button></form>}</div>)}</div></div>
        <details className="mt-5 rounded-xl border border-[#e7ece9] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#405448]">Crear otro espacio</summary><form action={createBusiness} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-[#52645a]">Nombre<input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi estudio" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"/></label><label className="block text-xs font-semibold text-[#52645a]">Rubro<select name="industry" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal"><option value="" disabled>Seleccioná un rubro</option>{Object.entries(industries).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><button className="rounded-xl bg-[#176b4f] px-4 py-2.5 text-xs font-semibold text-white">Crear espacio</button></form></details>
        {props.activeBusiness && props.activeRole === "owner" && <details className="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-4"><summary className="cursor-pointer text-sm font-semibold text-red-800">Zona de peligro: eliminar espacio</summary><p className="mt-2 text-xs leading-5 text-red-800/80">Esta acción es permanente y elimina el espacio y sus datos asociados.</p><DeleteBusinessForm businessId={props.activeBusiness.id} businessName={props.activeBusiness.name}/></details>}
      </section>
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Package size={18} className="text-[#397552]"/> Módulos y herramientas</h2><p className="mt-1 text-xs text-[#89958e]">Mostrá solo las herramientas que realmente necesitás.</p>{props.moduleSetupMissing && props.isManager && props.activeBusiness && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Este espacio todavía no tiene módulos instalados</p><p className="mt-1 text-xs leading-5 text-amber-800">Podés restaurar las herramientas recomendadas para {props.industry.label.toLowerCase()}. Esto no borra ni modifica registros existentes.</p><form action={restoreRecommendedBusinessModules} className="mt-3"><input type="hidden" name="businessId" value={props.activeBusiness.id}/><button className="rounded-lg bg-[#176b4f] px-3 py-2 text-xs font-semibold text-white">Instalar módulos recomendados</button></form></div>}<div className="mt-5 space-y-3">{moduleGroups.map((group) => <details key={group.title} open className="rounded-xl border border-[#e9eeeb] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#405448]">{group.title}</summary><div className="mt-3 space-y-3">{group.slugs.map((slug) => { const moduleItem = moduleCatalog.find((item) => item.slug === slug); if (!moduleItem) return null; const on = props.enabledModules[slug] ?? false; return <div key={slug} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-[#52645a]">{moduleItem.name}</p><p className="text-[11px] text-[#8b9790]">{moduleItem.description}</p></div>{props.isManager && props.activeBusiness ? <form action={setBusinessModuleEnabled}><input type="hidden" name="businessId" value={props.activeBusiness?.id ?? ""}/><input type="hidden" name="moduleSlug" value={slug}/><input type="hidden" name="enabled" value={String(!on)}/><button className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${on ? "border border-[#dce5e0] text-[#66766c]" : "bg-[#176b4f] text-white"}`}>{on ? "Desactivar" : "Activar"}</button></form> : <span className="text-[10px] text-[#8b9790]">{on ? "Activo" : "Inactivo"}</span>}</div>; })}</div></details>)}</div><p className="mt-4 text-[11px] leading-5 text-[#89958e]">Desactivar un módulo oculta su acceso, pero no elimina sus datos.</p></section>
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7 xl:col-span-2"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Users size={18} className="text-[#397552]"/> Tu perfil</h2><p className="mt-1 text-xs text-[#89958e]">Información de tu cuenta personal.</p><form action={updateProfile} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-xs font-semibold text-[#52645a]">Nombre<input name="fullName" defaultValue={props.fullName} required minLength={2} maxLength={80} placeholder="Tu nombre" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"/></label><div><p className="text-xs font-semibold text-[#52645a]">Email</p><p className="mt-1.5 rounded-xl bg-[#f6f8f7] px-3 py-2.5 text-sm text-[#718078]">{props.email}</p></div><button className="rounded-xl border border-[#dce5e0] px-4 py-2.5 text-xs font-semibold text-[#3f5a49] hover:border-[#397552]">Guardar perfil</button></form></section>
    </div>
  </div>;
}

function EmptyWorkspace() {
  return <div className="mx-auto max-w-xl rounded-2xl border border-[#e5ebe7] bg-white p-8">
    <div className="text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><Store size={22}/></span><h1 className="mt-4 text-xl font-semibold text-[#304638]">Creá tu primer espacio</h1><p className="mt-2 text-sm leading-6 text-[#839087]">Cada espacio representa un negocio y mantiene su propia configuración. Completá estos datos para empezar.</p></div>
    <form action={createBusiness} className="mt-7 space-y-4">
      <label className="block text-xs font-semibold text-[#52645a]">Nombre del negocio<input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi comercio" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"/></label>
      <label className="block text-xs font-semibold text-[#52645a]">Rubro<select name="industry" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal"><option value="" disabled>Seleccioná un rubro</option>{Object.entries(industries).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
      <button className="w-full rounded-xl bg-[#176b4f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#125b42]">Crear mi espacio</button>
    </form>
  </div>;
}

function EmptyModules() {
  return <div className="rounded-2xl border border-dashed border-[#dce6df] bg-white p-10 text-center"><Package size={25} className="mx-auto text-[#8da596]"/><p className="mt-3 text-sm font-semibold text-[#52645a]">No hay herramientas activas en esta sección</p><p className="mt-1 text-xs text-[#89958e]">Podés habilitarlas desde Configuración.</p><Link href="/app?section=settings" className="mt-4 inline-flex text-xs font-semibold text-[#397552] hover:underline">Ir a configuración <ArrowRight size={13}/></Link></div>;
}
