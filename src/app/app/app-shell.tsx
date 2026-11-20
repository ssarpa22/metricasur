"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  CreditCard, LayoutDashboard, LogOut, Menu, Package, Plus, Settings2, ShoppingBag,
  Sparkles, Store, Users, Wallet, X,
} from "lucide-react";
import { industries, type Industry } from "@/lib/industries";
import { moduleCatalog, type ModuleSlug } from "@/lib/modules";
import {
  createBusiness, setBusinessModuleEnabled, signOut, switchBusiness, updateProfile,
} from "./actions";
import { DeleteBusinessForm } from "./delete-business-form";

type Business = { id: string; name: string; industry: string; created_at: string };
type Props = {
  firstName: string;
  fullName: string;
  email: string;
  businesses: Business[];
  activeBusiness: Business | null;
  activeRole: string | null;
  activeIndustry: Industry;
  enabledModules: Record<string, boolean>;
  section: string;
  notices: { error?: string; created?: string; profile?: string; modules?: string; deleted?: string };
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
            <button className="relative rounded-xl p-2.5 text-[#748279] hover:bg-[#f2f5f3]" aria-label="Notificaciones"><Bell size={18}/><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d59b43]"/></button>
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf2ed] text-sm font-bold text-[#176b4f]">{props.firstName.slice(0,1).toUpperCase()}</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          {props.notices.error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{props.notices.error}</p>}
          {(props.notices.created || props.notices.profile || props.notices.modules || props.notices.deleted) && <p role="status" className="mb-5 rounded-xl border border-[#cfe6d8] bg-[#edf6f1] px-4 py-3 text-sm text-[#24513f]">{props.notices.created ? "Tu espacio de trabajo está creado." : props.notices.profile ? "Tu perfil se actualizó correctamente." : props.notices.modules ? "La configuración de módulos se actualizó." : "El espacio de trabajo se eliminó correctamente."}</p>}

          {!active ? <EmptyWorkspace/> : props.section === "home" || !sectionTitles[props.section] && !moduleCatalog.some((m) => m.slug === props.section) ? (
            <Dashboard firstName={props.firstName} business={active} industry={industry} modules={enabledModuleList.length}/>
          ) : props.section === "settings" ? (
            <SettingsView {...props} industry={industry} isManager={isManager}/>
          ) : props.section === "assistant" ? (
            <AssistantView/>
          ) : props.section === "reports" ? (
            <ReportsView/>
          ) : moduleCatalog.some((module) => module.slug === props.section) ? (
            <ModuleView slug={props.section} enabled={props.enabledModules[props.section] ?? false}/>
          ) : (
            <ModuleCollection title={page.title} description={page.description} modules={currentModules}/>
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ firstName, business, industry, modules }: { firstName: string; business: Business; industry: (typeof industries)[Industry]; modules: number }) {
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-[#718078]">Tu resumen de hoy</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20352a] sm:text-[34px]">¡Hola, {firstName}! <span className="text-2xl">👋</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#78867e]">Este es el punto de partida para organizar {business.name.toLowerCase()}. Vamos paso a paso.</p></div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e2eae4] bg-white px-3 py-2 text-xs font-medium text-[#5e7567]"><span className="size-2 rounded-full bg-[#41a477]"/> Espacio activo</span>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Store} label="Actividad" value={industry.label} note="Rubro configurado"/>
      <StatCard icon={Package} label="Módulos activos" value={String(modules)} note="Herramientas habilitadas"/>
      <StatCard icon={ClipboardList} label="Organización" value="A tu ritmo" note="Prepará tus próximos pasos"/>
      <StatCard icon={Sparkles} label="Asistente IA" value="En preparación" note="Próximamente"/>
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
        <div className="flex min-h-[210px] flex-col items-center justify-center py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f0f5f1] text-[#7e9b88]"><ArrowDownLeft size={22}/></span>
          <p className="mt-4 text-sm font-semibold text-[#46594d]">Todavía no hay actividad</p>
          <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#8b9790]">Cuando registres operaciones, vas a encontrar acá un resumen de los movimientos recientes.</p>
        </div>
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

function ModuleView({ slug, enabled }: { slug: string; enabled: boolean }) {
  const module = moduleCatalog.find((item) => item.slug === slug);
  if (!module) return <EmptyModules/>;
  const Icon = moduleIcons[module.slug] ?? Package;
  return <div className="mx-auto max-w-3xl"><Link href="/app?section=operations" className="text-xs font-semibold text-[#397552] hover:underline">← Volver a operaciones</Link><div className="mt-5 rounded-2xl border border-[#e5ebe7] bg-white p-6 sm:p-9"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><Icon size={23}/></span><div className="mt-5 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold text-[#263b30]">{module.name}</h1><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${enabled ? "bg-[#eaf5ee] text-[#347253]" : "bg-[#f2f3f2] text-[#77827b]"}`}>{enabled ? "Activo" : "Inactivo"}</span></div><p className="mt-2 text-sm leading-6 text-[#7d8a82]">{module.description}</p><div className="mt-7 rounded-xl border border-dashed border-[#dce6df] bg-[#fafcfb] p-5"><p className="text-sm font-semibold text-[#405748]">Estamos preparando esta herramienta</p><p className="mt-1 text-sm leading-6 text-[#839087]">El módulo ya forma parte de la estructura de tu negocio. Su interfaz operativa se incorporará en una próxima etapa; todavía no registra ni modifica datos.</p><Link href="/app?section=settings" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#397552] hover:underline">Administrar módulos <ArrowRight size={15}/></Link></div></div></div>;
}

function ReportsView() {
  return <div className="mx-auto max-w-3xl rounded-2xl border border-[#e5ebe7] bg-white p-7 sm:p-10"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><BarChart3 size={23}/></span><h1 className="mt-5 text-2xl font-semibold text-[#263b30]">Informes de tu negocio</h1><p className="mt-2 text-sm leading-6 text-[#7d8a82]">Acá vas a poder entender ventas, costos, rentabilidad y evolución de tu actividad.</p><div className="mt-6 rounded-xl border border-dashed border-[#dce6df] bg-[#fafcfb] p-5"><p className="text-sm font-semibold text-[#405748]">Los informes llegarán con los datos operativos</p><p className="mt-1 text-sm leading-6 text-[#839087]">Todavía no hay registros operativos conectados para generar estadísticas confiables. Preferimos mostrarte esto claramente antes que inventar números.</p></div></div>;
}

function AssistantView() {
  return <div className="mx-auto max-w-3xl rounded-2xl border border-[#e5ebe7] bg-white p-7 sm:p-10"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><Sparkles size={23}/></span><h1 className="mt-5 text-2xl font-semibold text-[#263b30]">Tu asistente de negocio</h1><p className="mt-2 text-sm leading-6 text-[#7d8a82]">La idea es que puedas consultar información, recibir recomendaciones y delegar tareas repetitivas con permisos y controles claros.</p><div className="mt-6 rounded-xl border border-dashed border-[#dce6df] bg-[#fafcfb] p-5"><p className="text-sm font-semibold text-[#405748]">Estamos construyendo el asistente</p><p className="mt-1 text-sm leading-6 text-[#839087]">Todavía no está conectado a tus datos ni puede ejecutar acciones. Primero estamos preparando la estructura y los permisos para hacerlo de forma segura.</p></div></div>;
}

function SettingsView(props: Props & { industry: (typeof industries)[Industry]; isManager: boolean }) {
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-[#263b30]">Configuración</h1><p className="mt-2 text-sm text-[#7d8a82]">Todo lo importante de tu cuenta y tu negocio, en un solo lugar.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Store size={18} className="text-[#397552]"/> Tu espacio de trabajo</h2><p className="mt-1 text-xs text-[#89958e]">Nombre y rubro del negocio activo.</p>{props.activeBusiness && <div className="mt-5 rounded-xl bg-[#f7faf8] p-4"><p className="text-sm font-semibold text-[#354a3b]">{props.activeBusiness.name}</p><p className="mt-1 text-xs text-[#849087]">{props.industry.label} · {props.activeRole ?? "miembro"}</p></div>}<div className="mt-5"><h3 className="text-sm font-semibold text-[#405448]">Tus espacios</h3><div className="mt-2 space-y-2">{props.businesses.map((business) => <div key={business.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e9eeeb] p-3"><span className="min-w-0 truncate text-sm text-[#52645a]">{business.name}</span>{business.id === props.activeBusiness?.id ? <span className="shrink-0 text-[10px] font-semibold text-[#397552]">Activo</span> : <form action={switchBusiness}><input type="hidden" name="businessId" value={business.id}/><button className="text-xs font-semibold text-[#397552] hover:underline">Cambiar</button></form>}</div>)}</div></div>
        <details className="mt-5 rounded-xl border border-[#e7ece9] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#405448]">Crear otro espacio</summary><form action={createBusiness} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-[#52645a]">Nombre<input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi estudio" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"/></label><label className="block text-xs font-semibold text-[#52645a]">Rubro<select name="industry" required defaultValue="" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal"><option value="" disabled>Seleccioná un rubro</option>{Object.entries(industries).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label><button className="rounded-xl bg-[#176b4f] px-4 py-2.5 text-xs font-semibold text-white">Crear espacio</button></form></details>
        {props.activeBusiness && props.activeRole === "owner" && <details className="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-4"><summary className="cursor-pointer text-sm font-semibold text-red-800">Zona de peligro: eliminar espacio</summary><p className="mt-2 text-xs leading-5 text-red-800/80">Esta acción es permanente y elimina el espacio y sus datos asociados.</p><DeleteBusinessForm businessId={props.activeBusiness.id} businessName={props.activeBusiness.name}/></details>}
      </section>
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Package size={18} className="text-[#397552]"/> Módulos y herramientas</h2><p className="mt-1 text-xs text-[#89958e]">Mostrá solo las herramientas que realmente necesitás.</p><div className="mt-5 space-y-3">{moduleGroups.map((group) => <details key={group.title} open className="rounded-xl border border-[#e9eeeb] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#405448]">{group.title}</summary><div className="mt-3 space-y-3">{group.slugs.map((slug) => { const module = moduleCatalog.find((item) => item.slug === slug); if (!module) return null; const on = props.enabledModules[slug] ?? false; return <div key={slug} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-[#52645a]">{module.name}</p><p className="text-[11px] text-[#8b9790]">{module.description}</p></div>{props.isManager && props.activeBusiness ? <form action={setBusinessModuleEnabled}><input type="hidden" name="businessId" value={props.activeBusiness?.id ?? ""}/><input type="hidden" name="moduleSlug" value={slug}/><input type="hidden" name="enabled" value={String(!on)}/><button className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${on ? "border border-[#dce5e0] text-[#66766c]" : "bg-[#176b4f] text-white"}`}>{on ? "Desactivar" : "Activar"}</button></form> : <span className="text-[10px] text-[#8b9790]">{on ? "Activo" : "Inactivo"}</span>}</div>; })}</div></details>)}</div><p className="mt-4 text-[11px] leading-5 text-[#89958e]">Desactivar un módulo oculta su acceso, pero no elimina sus datos.</p></section>
      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 sm:p-7 xl:col-span-2"><h2 className="flex items-center gap-2 text-base font-semibold text-[#304638]"><Users size={18} className="text-[#397552]"/> Tu perfil</h2><p className="mt-1 text-xs text-[#89958e]">Información de tu cuenta personal.</p><form action={updateProfile} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-xs font-semibold text-[#52645a]">Nombre<input name="fullName" defaultValue={props.fullName} required minLength={2} maxLength={80} placeholder="Tu nombre" className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"/></label><div><p className="text-xs font-semibold text-[#52645a]">Email</p><p className="mt-1.5 rounded-xl bg-[#f6f8f7] px-3 py-2.5 text-sm text-[#718078]">{props.email}</p></div><button className="rounded-xl border border-[#dce5e0] px-4 py-2.5 text-xs font-semibold text-[#3f5a49] hover:border-[#397552]">Guardar perfil</button></form></section>
    </div>
  </div>;
}

function EmptyWorkspace() {
  return <div className="mx-auto max-w-xl rounded-2xl border border-[#e5ebe7] bg-white p-8 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#397552]"><Store size={22}/></span><h1 className="mt-4 text-xl font-semibold text-[#304638]">Creá tu primer espacio</h1><p className="mt-2 text-sm leading-6 text-[#839087]">Cada espacio representa un negocio y mantiene su propia configuración.</p><Link href="/app?section=settings" className="mt-5 inline-flex rounded-xl bg-[#176b4f] px-4 py-2.5 text-sm font-semibold text-white">Empezar</Link></div>;
}

function EmptyModules() {
  return <div className="rounded-2xl border border-dashed border-[#dce6df] bg-white p-10 text-center"><Package size={25} className="mx-auto text-[#8da596]"/><p className="mt-3 text-sm font-semibold text-[#52645a]">No hay herramientas activas en esta sección</p><p className="mt-1 text-xs text-[#89958e]">Podés habilitarlas desde Configuración.</p><Link href="/app?section=settings" className="mt-4 inline-flex text-xs font-semibold text-[#397552] hover:underline">Ir a configuración <ArrowRight size={13}/></Link></div>;
}
