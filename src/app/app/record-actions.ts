"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moduleSlugSchema } from "@/lib/modules";
import { isValidDateOnly } from "@/lib/date-validation";
import { validateCustomerMetadata } from "@/lib/customer-metadata";
import { getAccountSubscription, getMonthlyRecordUsage } from "@/lib/subscription-server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(slug: string, message: string): never {
  redirect(`/app?section=${encodeURIComponent(slug)}&error=${encodeURIComponent(message)}`);
}
function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }

function readCustomerMetadata(data: FormData, slug: string) {
  if (slug !== "customers") return undefined;
  const result = validateCustomerMetadata(data);
  if (!result.success) fail(slug, result.message);
  return result.metadata;
}

async function authorize(businessId: string, slug: string) {
  if (!uuid.test(businessId)) fail(slug, "El espacio seleccionado no es válido.");
  const parsed = moduleSlugSchema.safeParse(slug);
  if (!parsed.success) fail("home", "El módulo seleccionado no es válido.");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("business_memberships")
    .select("business_id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
  if (!membership) fail(slug, "No tenés acceso a este espacio de trabajo.");
  const { data: business } = await supabase.from("businesses")
    .select("created_by").eq("id", businessId).maybeSingle();
  if (!business?.created_by) fail(slug, "No pudimos verificar la cuenta propietaria del negocio.");
  const { data: module } = await supabase.from("business_modules")
    .select("enabled").eq("business_id", businessId).eq("module_slug", slug).maybeSingle();
  if (!module?.enabled) fail(slug, "Este módulo está desactivado. Podés habilitarlo desde Configuración.");
  return { supabase, user, accountOwnerId: business.created_by };
}

export async function createBusinessRecord(formData: FormData) {
  const businessId = value(formData, "businessId");
  const slug = value(formData, "moduleSlug");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const reference = value(formData, "reference");
  const status = value(formData, "status") || "open";
  const amountRaw = value(formData, "amount");
  const quantityRaw = value(formData, "quantity");
  const dueDate = value(formData, "dueDate");
  if (title.length < 1 || title.length > 160) fail(slug, "El título debe tener entre 1 y 160 caracteres.");
  if (description.length > 4000 || category.length > 80 || reference.length > 120) fail(slug, "Uno de los campos supera el largo permitido.");
  if (!["open", "in_progress", "completed", "cancelled"].includes(status)) fail(slug, "El estado no es válido.");
  const amount = amountRaw ? Number(amountRaw) : null;
  const quantity = quantityRaw ? Number(quantityRaw) : null;
  if ((amount !== null && (!Number.isFinite(amount) || amount < 0)) || (quantity !== null && (!Number.isFinite(quantity) || quantity < 0))) fail(slug, "Importe o cantidad no válidos.");
  if (dueDate && !isValidDateOnly(dueDate)) fail(slug, "La fecha no es válida.");
  const metadata = readCustomerMetadata(formData, slug);
  const { supabase, user, accountOwnerId } = await authorize(businessId, slug);
  const subscription = await getAccountSubscription(supabase, accountOwnerId);
  if (subscription.error || !subscription.data) fail(slug, "No pudimos verificar la suscripción de tu cuenta.");
  const usage = await getMonthlyRecordUsage(supabase, accountOwnerId);
  if (usage.error) fail(slug, "No pudimos verificar el uso mensual de registros.");
  if (subscription.data.plan.maxMonthlyRecords !== null && usage.count >= subscription.data.plan.maxMonthlyRecords) {
    fail(slug, `Alcanzaste el límite mensual de ${subscription.data.plan.maxMonthlyRecords} registros de tu plan ${subscription.data.plan.name}. Revisá Suscripción para ampliar el límite.`);
  }
  const { error } = await supabase.from("business_records").insert({
    business_id: businessId, module_slug: slug, title, description, category, reference,
    status, amount, quantity, due_date: dueDate || null, created_by: user.id,
    ...(metadata ? { metadata } : {}),
  });
  if (error) fail(slug, "No se pudo guardar el registro. Revisá los datos e intentá nuevamente.");
  redirect(`/app?section=${encodeURIComponent(slug)}&saved=1`);
}

export async function updateBusinessRecordStatus(formData: FormData) {
  const businessId = value(formData, "businessId");
  const slug = value(formData, "moduleSlug");
  const recordId = value(formData, "recordId");
  const status = value(formData, "status");
  if (!uuid.test(recordId) || !["open", "in_progress", "completed", "cancelled"].includes(status)) fail(slug, "La actualización no es válida.");
  const { supabase } = await authorize(businessId, slug);
  const { error } = await supabase.from("business_records").update({ status })
    .eq("id", recordId).eq("business_id", businessId).eq("module_slug", slug);
  if (error) fail(slug, "No se pudo actualizar el estado.");
  redirect(`/app?section=${encodeURIComponent(slug)}&saved=1`);
}

export async function deleteBusinessRecord(formData: FormData) {
  const businessId = value(formData, "businessId");
  const slug = value(formData, "moduleSlug");
  const recordId = value(formData, "recordId");
  if (!uuid.test(recordId)) fail(slug, "El registro seleccionado no es válido.");
  const { supabase } = await authorize(businessId, slug);
  const { error } = await supabase.from("business_records").delete()
    .eq("id", recordId).eq("business_id", businessId).eq("module_slug", slug);
  if (error) fail(slug, "No se pudo eliminar el registro.");
  redirect(`/app?section=${encodeURIComponent(slug)}&deleted=1`);
}

export async function updateBusinessRecord(formData: FormData) {
  const businessId = value(formData, "businessId");
  const slug = value(formData, "moduleSlug");
  const recordId = value(formData, "recordId");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const category = value(formData, "category");
  const reference = value(formData, "reference");
  const status = value(formData, "status");
  const amountRaw = value(formData, "amount");
  const quantityRaw = value(formData, "quantity");
  const dueDate = value(formData, "dueDate");
  if (!uuid.test(recordId) || title.length < 1 || title.length > 160) fail(slug, "Revisá el título del registro.");
  if (description.length > 4000 || category.length > 80 || reference.length > 120) fail(slug, "Uno de los campos supera el largo permitido.");
  if (!["open", "in_progress", "completed", "cancelled"].includes(status)) fail(slug, "El estado no es válido.");
  const amount = amountRaw ? Number(amountRaw) : null;
  const quantity = quantityRaw ? Number(quantityRaw) : null;
  if ((amount !== null && (!Number.isFinite(amount) || amount < 0)) || (quantity !== null && (!Number.isFinite(quantity) || quantity < 0))) fail(slug, "Importe o cantidad no válidos.");
  if (dueDate && !isValidDateOnly(dueDate)) fail(slug, "La fecha no es válida.");
  const metadata = readCustomerMetadata(formData, slug);
  const { supabase } = await authorize(businessId, slug);
  const { error } = await supabase.from("business_records").update({
    title, description, category, reference, status, amount, quantity, due_date: dueDate || null,
    ...(metadata ? { metadata } : {}),
  }).eq("id", recordId).eq("business_id", businessId).eq("module_slug", slug);
  if (error) fail(slug, "No se pudieron guardar los cambios.");
  redirect(`/app?section=${encodeURIComponent(slug)}&saved=1`);
}
