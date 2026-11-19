import { ArrowRight, BarChart3, CalendarDays, Check, CheckCircle2, ClipboardList, Layers3, MessageCircle, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";

const features = [
  { icon: Users, title: "Clientes y relaciones", text: "La información importante de las personas con las que trabajás, siempre ordenada." },
  { icon: ClipboardList, title: "Tareas y proyectos", text: "Pendientes claros, prioridades y próximos pasos para que nada quede colgado." },
  { icon: CalendarDays, title: "Agenda inteligente", text: "Turnos, reuniones y fechas importantes en un mismo calendario." },
  { icon: Wallet, title: "Finanzas del negocio", text: "Una visión simple de ingresos, gastos y lo que necesitás tener presente." },
  { icon: BarChart3, title: "Indicadores útiles", text: "Información concreta para entender cómo viene tu actividad y decidir mejor." },
  { icon: Layers3, title: "Herramientas por rubro", text: "Activá las funciones que tienen sentido para tu forma de trabajar." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#" className="flex items-center gap-3" aria-label="MétricaSur, inicio">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#16785a] text-white"><BarChart3 size={22} /></span>
          <span className="text-xl font-bold tracking-tight text-[#17211f]">métrica<span className="text-[#16785a]">sur</span></span>
        </a>
        <nav className="hidden gap-8 text-sm font-medium text-[#687570] md:flex">
          <a className="hover:text-[#16785a]" href="#funciones">Funciones</a>
          <a className="hover:text-[#16785a]" href="#como-funciona">Cómo funciona</a>
          <a className="hover:text-[#16785a]" href="#vision">Nuestra idea</a>
        </nav>
        <a href="mailto:hola@metricasur.com" className="inline-flex items-center gap-2 rounded-full border border-[#dce5e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#24513f] hover:border-[#16785a]">Hablemos <ArrowRight size={16}/></a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-32 lg:pt-20">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dcebe3] bg-[#edf6f1] px-3.5 py-2 text-xs font-semibold tracking-wide text-[#246449]"><Sparkles size={14}/> GESTIÓN QUE SE ADAPTA A VOS</div>
          <h1 className="text-5xl leading-[1.08] font-semibold tracking-[-0.055em] text-[#17211f] sm:text-6xl lg:text-[4.35rem]">Tu negocio tiene su forma.<span className="mt-2 block text-[#16785a]">Tu gestión también.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#687570]">Clientes, tareas, agenda y operaciones en un solo lugar. Una plataforma que entiende qué hacés y se organiza alrededor de tu manera de trabajar.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="mailto:hola@metricasur.com?subject=Quiero%20conocer%20M%C3%A9tricaSur" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16785a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#16785a]/15 hover:bg-[#105c45]">Conocer el proyecto <ArrowRight size={17}/></a>
            <a href="#funciones" className="inline-flex items-center justify-center rounded-full border border-[#dce5e0] bg-white px-6 py-3.5 text-sm font-semibold text-[#34443d]">Explorar funciones</a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#687570]">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#16785a]"/> Simple de usar</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#16785a]"/> Adaptable por rubro</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#16785a]"/> Asistido por IA</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[570px]">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[#dcefe5] blur-3xl"/>
          <div className="absolute -bottom-16 -left-12 size-64 rounded-full bg-[#e8eee8] blur-3xl"/>
          <div className="relative rounded-[28px] border border-[#e4eae6] bg-white p-3 shadow-[0_30px_90px_rgba(30,58,46,0.12)]">
            <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
              <div className="flex items-center gap-2.5"><span className="size-2.5 rounded-full bg-[#16785a]"/><span className="text-sm font-semibold text-[#26352e]">Tu espacio de trabajo</span></div>
              <span className="rounded-full bg-[#edf6f1] px-3 py-1 text-[11px] font-semibold text-[#246449]">Vista general</span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-medium text-[#84918b]">TU NEGOCIO · HOY</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#17211f]">Buen día 👋</h2><p className="mt-1 text-sm text-[#687570]">Esto es lo que pasa en tu negocio.</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf6f1] text-[#16785a]"><Sparkles size={19}/></span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {[["Tareas","08","+2 hoy"],["Clientes","24","Activos"],["Turnos","05","Esta semana"]].map(([label,value,note])=><div key={label} className="rounded-2xl border border-[#edf0ee] bg-[#fbfcfb] p-3"><p className="text-[11px] font-medium text-[#84918b]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#20342a]">{value}</p><p className="mt-1 text-[10px] text-[#829087]">{note}</p></div>)}
              </div>
              <div className="mt-5 rounded-2xl bg-[#f5f8f6] p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#293a31]">Para hoy</p><span className="text-xs text-[#718078]">2 de 4 completadas</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e1e9e4]"><div className="h-full w-1/2 rounded-full bg-[#29936d]"/></div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3"><span className="flex size-[18px] items-center justify-center rounded-md border border-[#29936d] bg-[#29936d] text-white"><Check size={12}/></span><span className="text-xs text-[#87928c] line-through">Enviar propuesta a Martina</span></div>
                  <div className="flex items-center gap-3"><span className="flex size-[18px] items-center justify-center rounded-md border border-[#29936d] bg-[#29936d] text-white"><Check size={12}/></span><span className="text-xs text-[#87928c] line-through">Confirmar reunión de las 15:00</span></div>
                  <div className="flex items-center gap-3"><span className="size-[18px] rounded-md border border-[#cbd6cf] bg-white"/><span className="text-xs font-medium text-[#3b4b42]">Revisar pedidos pendientes</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#dcebe3] bg-[#f1f8f4] p-3.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#16785a]"><MessageCircle size={17}/></span>
                <div className="flex-1"><p className="text-xs font-semibold text-[#28533f]">Tu asistente está listo</p><p className="mt-0.5 text-[11px] text-[#6c8175]">¿Qué necesitás resolver hoy?</p></div>
                <ArrowRight size={16} className="text-[#6c9b83]"/>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#edf0ee] px-4 py-3 text-[10px] text-[#98a39d]"><span>MÉTRICASUR · VISTA DE EJEMPLO</span><span className="inline-flex items-center gap-1"><ShieldCheck size={12}/> Tus datos, bajo tu control</span></div>
          </div>
        </div>
      </section>

      <section id="funciones" className="border-y border-[#e8ede9] bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.16em] text-[#16785a]">UN SOLO LUGAR, LO IMPORTANTE</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#17211f] sm:text-4xl">Las herramientas que tu negocio necesita.</h2><p className="mt-4 text-base leading-7 text-[#687570]">Una base común para organizar el día a día, con herramientas que se ajustan a cada actividad. Sin funciones de más ni sistemas imposibles de aprender.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({icon:Icon,title,text})=><article key={title} className="group rounded-2xl border border-[#e8ede9] bg-[#fdfefd] p-6 transition hover:-translate-y-1 hover:border-[#c8dfd2] hover:shadow-lg"><span className="flex size-11 items-center justify-center rounded-xl bg-[#edf6f1] text-[#16785a] group-hover:bg-[#16785a] group-hover:text-white"><Icon size={21}/></span><h3 className="mt-5 text-base font-semibold text-[#26352e]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#748079]">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10">
        <div><p className="text-xs font-bold tracking-[0.16em] text-[#16785a]">HECHO PARA TU REALIDAD</p><h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.04em] text-[#17211f] sm:text-4xl">No tenés que adaptar tu negocio al sistema.</h2><p className="mt-5 max-w-lg text-base leading-7 text-[#687570]">Primero entendemos cómo trabajás. Después armamos un espacio con las herramientas adecuadas para tu actividad, tus objetivos y tu equipo.</p></div>
        <div className="space-y-3">
          {["Contanos qué hacés y cómo trabajás.","MétricaSur te propone las herramientas adecuadas.","Empezá a organizar tu negocio desde un solo lugar."].map((step,index)=><div key={step} className="flex items-center gap-4 rounded-2xl border border-[#e7ede9] bg-white p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-[#edf6f1] text-sm font-bold text-[#16785a]">0{index+1}</span><p className="text-sm font-medium leading-6 text-[#34443d]">{step}</p><CheckCircle2 size={18} className="ml-auto shrink-0 text-[#83b49b]"/></div>)}
        </div>
      </section>

      <section id="vision" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#153f30] px-7 py-12 text-white sm:px-12 sm:py-16">
          <div className="absolute -right-20 -top-40 size-96 rounded-full border border-white/10"/><div className="absolute -right-4 -top-24 size-64 rounded-full border border-white/10"/>
          <div className="relative max-w-2xl"><p className="text-xs font-bold tracking-[0.16em] text-[#a9d8bf]">UNA IDEA EN CONSTRUCCIÓN</p><h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl">Más tiempo para hacer crecer tu negocio. Menos tiempo tratando de organizarlo.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-[#c1d7ca]">MétricaSur está naciendo para acompañar a quienes emprenden y trabajan todos los días. Queremos construirlo escuchando a las personas que lo van a usar.</p><a href="mailto:hola@metricasur.com" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#174532] hover:bg-[#e9f4ee]">Sumate a la conversación <ArrowRight size={16}/></a></div>
        </div>
      </section>

      <footer className="border-t border-[#e5ebe7] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-xs text-[#87928c] sm:flex-row sm:items-center sm:justify-between lg:px-10"><span className="font-semibold text-[#43554a]">métricasur</span><span>Una forma más simple de gestionar tu negocio.</span><span>© {new Date().getFullYear()} MétricaSur</span></div></footer>
    </main>
  );
}
