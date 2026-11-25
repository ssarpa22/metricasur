import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { industrySchema, type Industry } from "@/lib/industries";
import { AppShell } from "./app-shell";
import { moduleSlugSchema } from "@/lib/modules";
import { getBusinessSubscription, getMonthlyRecordUsage } from "@/lib/subscription-server";
import { getSubscriptionPlan } from "@/lib/subscriptions";

type AppPageProps = {
  searchParams: Promise<{ error?: string; created?: string; profile?: string; modules?: string; deleted?: string; saved?: string; deletedRecord?: string; section?: string }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6"><div className="max-w-lg rounded-3xl border border-[#e4eae6] bg-white p-8"><h1 className="text-xl font-semibold text-[#17211f]">Conectá Supabase para continuar</h1><p className="mt-3 text-sm leading-6 text-[#687570]">Completá las variables de Supabase en <code>.env.local</code> y reiniciá el servidor de desarrollo.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-[#16785a] px-5 py-3 text-sm font-semibold text-white">Volver al inicio</Link></div></main>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships, error: membershipsError } = await supabase.from("business_memberships").select("business_id, role").eq("user_id", user.id);
  if (membershipsError) return <main className="mx-auto max-w-3xl px-6 py-20"><p className="text-sm text-red-700">No pudimos cargar tus espacios de trabajo. Actualizá la página para intentar de nuevo.</p></main>;

  const businessIds = memberships?.map((membership) => membership.business_id) ?? [];
  const { data: businessRows, error: businessesError } = businessIds.length
    ? await supabase.from("businesses").select("id, name, industry, created_at").in("id", businessIds).order("created_at")
    : { data: [], error: null };
  const businesses = (businessRows ?? []) as { id: string; name: string; industry: string; created_at: string }[];
  const cookieStore = await cookies();
  const preferredId = cookieStore.get("metricasur_active_business")?.value;
  const activeBusiness = businesses.find((business) => business.id === preferredId) ?? businesses[0] ?? null;
  const activeRole = memberships?.find((membership) => membership.business_id === activeBusiness?.id)?.role ?? null;
  const subscriptionResult = activeBusiness
    ? await getBusinessSubscription(supabase, activeBusiness.id)
    : { data: null, error: null };
  const usageResult = activeBusiness
    ? await getMonthlyRecordUsage(supabase, activeBusiness.id)
    : { count: 0, error: null };
  const subscription = subscriptionResult.data ?? {
    plan: getSubscriptionPlan("free"),
    status: "active",
    started_at: new Date().toISOString(),
    renews_at: null,
    free_plan_grandfathered: false,
  };
  const { data: installations, error: installationsError } = activeBusiness
    ? await supabase.from("business_modules").select("module_slug, enabled").eq("business_id", activeBusiness.id)
    : { data: [], error: null };
  const enabledModules = Object.fromEntries((installations ?? []).map((item) => [item.module_slug, item.enabled])) as Record<string, boolean>;
  const selectedModule = moduleSlugSchema.safeParse(params.section);
  const { data: allRecordRows, error: recordsError } = activeBusiness
    ? await supabase.from("business_records").select("id, module_slug, title, description, status, amount, quantity, due_date, category, reference, metadata, created_at").eq("business_id", activeBusiness.id).order("created_at", { ascending: false }).limit(500)
    : { data: [], error: null };

  // Never disguise a failed database request as a genuinely empty workspace.
  if (businessesError) console.error("[MétricaSur] No se pudieron cargar los negocios:", businessesError);
  if (installationsError) console.error("[MétricaSur] No se pudieron cargar los módulos:", installationsError);
  if (recordsError) console.error("[MétricaSur] No se pudieron cargar los registros:", recordsError);
  const dataIssue = businessesError
    ? "No pudimos cargar tus espacios de trabajo. Revisá la conexión con Supabase y las migraciones."
    : installationsError
      ? "No pudimos cargar los módulos de este negocio. Es posible que falte aplicar una migración de Supabase."
      : recordsError
        ? "No pudimos cargar los registros. Es posible que falte aplicar una migración de Supabase."
        : subscriptionResult.error || usageResult.error
          ? "No pudimos cargar el estado de suscripción de este negocio. Es posible que falte aplicar la migración de suscripciones."
          : undefined;
  const allRecords = (allRecordRows ?? []).map((record) => ({
    ...record,
    amount: record.amount === null ? null : Number(record.amount),
    quantity: record.quantity === null ? null : Number(record.quantity),
    status: record.status as "open" | "in_progress" | "completed" | "cancelled",
    metadata: record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? record.metadata as Record<string, unknown> : {},
  }));
  const records = selectedModule.success && enabledModules[selectedModule.data]
    ? allRecords.filter((record) => record.module_slug === selectedModule.data).slice(0,200)
    : [];
  const parsedIndustry = industrySchema.safeParse(activeBusiness?.industry);
  const activeIndustry: Industry = parsedIndustry.success ? parsedIndustry.data : "other";
  const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";
  const firstName = fullName.trim().split(/\\s+/)[0] || user.email?.split("@")[0] || "ahí";

  return <AppShell
    firstName={firstName}
    fullName={fullName}
    email={user.email ?? ""}
    businesses={businesses}
    activeBusiness={activeBusiness}
    activeRole={activeRole}
    activeIndustry={activeIndustry}
    enabledModules={enabledModules}
    subscription={{
      plan: subscription.plan,
      status: subscription.status,
      startedAt: subscription.started_at,
      renewsAt: subscription.renews_at,
      freePlanGrandfathered: subscription.free_plan_grandfathered,
      monthlyRecords: usageResult.count,
      businessCount: memberships?.filter((membership) => membership.role === "owner" || membership.role === "admin").length ?? 0,
    }}
    moduleSetupMissing={Boolean(activeBusiness && !installationsError && (installations ?? []).length === 0)}
    records={records}
    allRecords={allRecords}
    section={params.section ?? "home"}
    notices={{ error: params.error, dataIssue, created: params.created, profile: params.profile, modules: params.modules, deleted: params.deleted, saved: params.saved, deletedRecord: params.deletedRecord }}
  />;
}
