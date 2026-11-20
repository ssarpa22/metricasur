"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { industrySchema } from "@/lib/industries";
import { getRecommendedModules } from "@/lib/modules";
import { moduleSlugSchema } from "@/lib/modules";

const ACTIVE_BUSINESS_COOKIE = "metricasur_active_business";

function appError(message: string): never {
  redirect(`/app?error=${encodeURIComponent(message)}`);
}

export async function createBusiness(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const industry = industrySchema.safeParse(formData.get("industry"));

  if (name.length < 2 || name.length > 120) appError("El nombre debe tener entre 2 y 120 caracteres.");
  if (!industry.success) appError("Seleccioná un rubro válido de la lista.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessId, error } = await supabase.rpc("create_business", {
    p_name: name,
    p_industry: industry.data,
  });
  if (error || !businessId) appError("No se pudo crear el espacio. Revisá los datos e intentá nuevamente.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app?created=1");
}

export async function switchBusiness(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) appError("Seleccioná un espacio de trabajo.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The cookie is only a preference. Membership is always verified server-side.
  const { data: membership, error } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership) appError("No tenés acceso a ese espacio de trabajo.");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, membership.business_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app");
}

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 80) appError("El nombre debe tener entre 2 y 80 caracteres.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (error) appError("No se pudo actualizar tu perfil.");

  redirect("/app?profile=updated");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
  redirect("/login");
}



export async function restoreRecommendedBusinessModules(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) {
    appError("El espacio de trabajo seleccionado no es válido.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) {
    appError("Solo el propietario o un administrador puede instalar módulos.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("industry")
    .eq("id", businessId)
    .maybeSingle();
  const industry = industrySchema.safeParse(business?.industry);
  if (businessError || !industry.success) {
    appError("No pudimos identificar el rubro del negocio. Revisá la configuración e intentá nuevamente.");
  }

  const recommended = getRecommendedModules(industry.data);
  const { error } = await supabase.from("business_modules").upsert(
    recommended.map((module) => ({
      business_id: businessId,
      module_slug: module.slug,
      installed_by: user.id,
    })),
    { onConflict: "business_id,module_slug", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[MétricaSur] No se pudieron restaurar los módulos:", error);
    appError("No se pudieron instalar los módulos. Verificá que las migraciones de Supabase estén aplicadas.");
  }

  redirect("/app?section=settings&modules=updated");
}

export async function setBusinessModuleEnabled(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  const moduleSlug = moduleSlugSchema.safeParse(formData.get("moduleSlug"));
  const enabledValue = formData.get("enabled");
  if (enabledValue !== "true" && enabledValue !== "false") appError("El estado del módulo no es válido.");
  const enabled = enabledValue === "true";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) {
    appError("El espacio de trabajo seleccionado no es válido.");
  }
  if (!moduleSlug.success) appError("El módulo seleccionado no es válido.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) {
    appError("No tenés permisos para modificar los módulos de este negocio.");
  }

  const { error } = await supabase.from("business_modules").upsert(
    {
      business_id: businessId,
      module_slug: moduleSlug.data,
      enabled,
      installed_by: user.id,
    },
    { onConflict: "business_id,module_slug" },
  );

  if (error) appError("No se pudo actualizar el módulo. Intentá nuevamente.");
  redirect("/app?modules=updated");
}


export async function deleteBusiness(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId)) {
    appError("El espacio de trabajo seleccionado no es válido.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The database RPC rechecks that this user is the workspace owner.
  const { error } = await supabase.rpc("delete_business", { p_business_id: businessId });
  if (error) {
    if (error.code === "42501") appError("Solo el propietario puede eliminar este espacio de trabajo.");
    appError("No se pudo eliminar el espacio. Actualizá la página e intentá nuevamente.");
  }

  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value === businessId) {
    cookieStore.delete(ACTIVE_BUSINESS_COOKIE);
  }

  redirect("/app?deleted=1");
}
