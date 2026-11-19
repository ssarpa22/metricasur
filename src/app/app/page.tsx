import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart3, Building2, ChevronDown, LogOut, Plus, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createBusiness, signOut, switchBusiness, updateProfile } from "./actions";

type AppPageProps = {
  searchParams: Promise<{ error?: string; created?: string; profile?: string }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
        <div className="max-w-lg rounded-3xl border border-[#e4eae6] bg-white p-8">
          <h1 className="text-xl font-semibold text-[#17211f]">Conectá Supabase para continuar</h1>
          <p className="mt-3 text-sm leading-6 text-[#687570]">Completá las variables de Supabase en <code>.env.local</code> y reiniciá el servidor de desarrollo.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-[#16785a] px-5 py-3 text-sm font-semibold text-white">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships, error: membershipsError } = await supabase
    .from("business_memberships")
    .select("business_id, role")
    .eq("user_id", user.id);

  if (membershipsError) {
    return <main className="mx-auto max-w-3xl px-6 py-20"><p className="text-sm text-red-700">No pudimos cargar tus espacios de trabajo. Actualizá la página para intentar de nuevo.</p></main>;
  }

  const businessIds = memberships?.map((membership) => membership.business_id) ?? [];
  const { data: businesses } = businessIds.length
    ? await supabase.from("businesses").select("id, name, created_at").in("id", businessIds).order("created_at")
    : { data: [] };

  const cookieStore = await cookies();
  const preferredBusinessId = cookieStore.get("metricasur_active_business")?.value;
  const activeBusiness = businesses?.find((business) => business.id === preferredBusinessId) ?? businesses?.[0] ?? null;
  const activeRole = memberships?.find((membership) => membership.business_id === activeBusiness?.id)?.role;
  const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";
  const firstName = fullName.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "ahí";

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-[#e5ebe7] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#16785a] text-white"><BarChart3 size={21} /></span>
            <span className="text-xl font-bold tracking-tight text-[#17211f]">métrica<span className="text-[#16785a]">sur</span></span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-[#e1e8e3] px-3.5 py-2.5 text-sm font-medium text-[#53635a] transition hover:border-[#c6d8cc] hover:text-[#16785a]"><LogOut size={16}/> Salir</button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="mb-9">
          <p className="text-xs font-bold tracking-[0.16em] text-[#16785a]">TU ESPACIO DE TRABAJO</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17211f] sm:text-4xl">Buen día, {firstName} 👋</h1>
          <p className="mt-3 text-sm leading-6 text-[#687570]">Desde acá vas a poder organizar tus negocios y elegir en cuál trabajar.</p>
        </div>

        {params.error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</p>}
        {params.created && <p role="status" className="mb-6 rounded-xl border border-[#cfe6d8] bg-[#edf6f1] px-4 py-3 text-sm text-[#24513f]">Tu espacio de trabajo está creado. ¡Vamos a ponerlo en marcha!</p>}
        {params.profile && <p role="status" className="mb-6 rounded-xl border border-[#cfe6d8] bg-[#edf6f1] px-4 py-3 text-sm text-[#24513f]">Tu perfil se actualizó correctamente.</p>}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-[#e4eae6] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#34443d]"><Building2 size={17} className="text-[#16785a]"/> Tus negocios</div>
                <p className="mt-1 text-xs text-[#84918b]">Cada espacio mantiene sus propios datos y miembros.</p>
              </div>
              <span className="rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-semibold text-[#246449]">{businesses?.length ?? 0} {(businesses?.length ?? 0) === 1 ? "espacio" : "espacios"}</span>
            </div>

            {activeBusiness ? (
              <>
                <div className="mt-6 rounded-2xl border border-[#cfe6d8] bg-[#f4f9f6] p-5">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-[#6d8979]">ESPACIO ACTIVO</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#203b2e]">{activeBusiness.name}</h2>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#6e8176]"><span className="rounded-full bg-white px-2.5 py-1 capitalize">{activeRole ?? "miembro"}</span><span>Este es el contexto seleccionado para trabajar.</span></div>
                </div>
                {(businesses?.length ?? 0) > 1 && (
                  <form action={switchBusiness} className="mt-5">
                    <label className="block text-sm font-medium text-[#34443d]">Cambiar de espacio</label>
                    <div className="relative mt-2">
                      <select name="businessId" defaultValue={activeBusiness.id} className="w-full appearance-none rounded-xl border border-[#dce5e0] bg-white px-4 py-3 pr-10 text-sm text-[#34443d] outline-none focus:border-[#16785a]">
                        {businesses?.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#84918b]"/>
                    </div>
                    <button type="submit" className="mt-3 rounded-xl border border-[#dce5e0] px-4 py-2.5 text-sm font-semibold text-[#345344] hover:border-[#16785a]">Cambiar espacio</button>
                  </form>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#cbd8cf] bg-[#fbfdfb] px-5 py-8 text-center">
                <Building2 size={28} className="mx-auto text-[#8eaa99]"/>
                <h2 className="mt-3 text-base font-semibold text-[#34443d]">Todavía no tenés un negocio creado</h2>
                <p className="mt-2 text-sm leading-6 text-[#7a8980]">Creá tu primer espacio de trabajo para empezar a organizar tu actividad.</p>
              </div>
            )}

            <div className="mt-7 border-t border-[#edf0ee] pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#34443d]"><Plus size={16} className="text-[#16785a]"/> Crear otro negocio</h3>
              <form action={createBusiness} className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input name="name" required minLength={2} maxLength={120} placeholder="Ej. Mi estudio, Local del centro..." className="min-w-0 flex-1 rounded-xl border border-[#dce5e0] px-4 py-3 text-sm outline-none focus:border-[#16785a]"/>
                <button type="submit" className="rounded-xl bg-[#16785a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#105c45]">Crear espacio</button>
              </form>
            </div>
          </section>

          <section className="h-fit rounded-3xl border border-[#e4eae6] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#34443d]"><UserRound size={17} className="text-[#16785a]"/> Tu perfil</div>
            <p className="mt-1 text-xs text-[#84918b]">La información básica de tu cuenta.</p>
            <form action={updateProfile} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-[#34443d]">Nombre
                <input name="fullName" defaultValue={fullName} required minLength={2} maxLength={80} placeholder="Tu nombre" className="mt-2 w-full rounded-xl border border-[#dce5e0] px-4 py-3 text-sm outline-none focus:border-[#16785a]"/>
              </label>
              <div className="block text-sm font-medium text-[#34443d]">Email
                <p className="mt-2 rounded-xl bg-[#f5f8f6] px-4 py-3 text-sm font-normal text-[#718078]">{user.email}</p>
              </div>
              <button type="submit" className="w-full rounded-xl border border-[#dce5e0] px-4 py-3 text-sm font-semibold text-[#345344] transition hover:border-[#16785a]">Guardar perfil</button>
            </form>
          </section>
        </div>
        <p className="mt-8 text-center text-xs text-[#9aa59f]">MétricaSur está en construcción. Próximamente vas a encontrar acá las herramientas de gestión de tu negocio.</p>
      </div>
    </main>
  );
}
