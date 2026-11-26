import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccountSubscription } from "@/lib/subscription-server";
import { serializeCsv } from "@/lib/record-insights";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const cookieStore = await cookies();
  const preferredId = cookieStore.get("metricasur_active_business")?.value;
  const membershipQuery = supabase.from("business_memberships").select("business_id").eq("user_id", user.id);
  const { data: membership } = preferredId
    ? await membershipQuery.eq("business_id", preferredId).maybeSingle()
    : await membershipQuery.limit(1).maybeSingle();
  if (!membership) return new Response("No autorizado", { status: 403 });

  const { data: business } = await supabase.from("businesses")
    .select("created_by").eq("id", membership.business_id).maybeSingle();
  if (!business?.created_by) return new Response("No autorizado", { status: 403 });

  const subscription = await getAccountSubscription(supabase, business.created_by);
  if (subscription.error || !subscription.data?.plan.canExport) {
    return new Response("La exportación está disponible desde Pro.", { status: 403 });
  }

  const scope = new URL(request.url).searchParams.get("scope") ?? "records";
  const { data: records, error } = await supabase
    .from("business_records")
    .select("module_slug, title, description, status, amount, quantity, due_date, category, reference, metadata, created_at")
    .eq("business_id", membership.business_id)
    .order("created_at", { ascending: false });
  if (error) return new Response("No se pudieron cargar los datos.", { status: 500 });

  const customerRows = scope === "customers";
  const rows = customerRows
    ? [
        ["Nombre", "Empresa", "CUIT/DNI", "Email", "Teléfono", "WhatsApp", "Dirección", "Ciudad", "Provincia", "Tipo", "Estado comercial", "Notas"],
        ...(records ?? []).filter((record) => record.module_slug === "customers").map((record) => {
          const metadata = record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? record.metadata as Record<string, unknown> : {};
          return [record.title, metadata.company, metadata.taxId, metadata.email, metadata.phone, metadata.whatsapp, metadata.address, metadata.city, metadata.province, metadata.customerType, metadata.relationshipStatus, metadata.notes];
        }),
      ]
    : [
        ["Modulo", "Titulo", "Descripcion", "Estado", "Importe ARS", "Cantidad", "Fecha", "Categoria", "Referencia", "Creado"],
        ...(records ?? []).map((record) => [record.module_slug, record.title, record.description, record.status, record.amount ?? "", record.quantity ?? "", record.due_date ?? "", record.category, record.reference, record.created_at]),
      ];

  return new Response("\uFEFF" + serializeCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metricasur-${customerRows ? "clientes" : "registros"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
