import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubscriptionPlan, type PlanId, type SubscriptionPlan } from "./subscriptions";

type SubscriptionRow = {
  plan: string;
  status: string;
  started_at: string;
  renews_at: string | null;
  free_plan_grandfathered: boolean;
};

export type SubscriptionSnapshot = Omit<SubscriptionRow, "plan"> & {
  plan: SubscriptionPlan;
};

async function getOwnedBusinessIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ids: string[]; error: unknown }> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("created_by", userId);
  return { ids: data?.map((business) => business.id) ?? [], error };
}

export async function getAccountSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: SubscriptionSnapshot | null; error: unknown }> {
  const { data, error } = await supabase
    .from("account_subscriptions")
    .select("plan, status, started_at, renews_at, free_plan_grandfathered")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { data: null, error };
  return { data: { ...data, plan: getSubscriptionPlan(data.plan) }, error: null };
}

export async function getMonthlyRecordUsage(
  supabase: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<{ count: number; error: unknown }> {
  const { ids, error: businessError } = await getOwnedBusinessIds(supabase, userId);
  if (businessError) return { count: 0, error: businessError };
  if (!ids.length) return { count: 0, error: null };

  const { start, end } = getUtcMonthBounds(now);
  const { count, error } = await supabase
    .from("business_records")
    .select("id", { count: "exact", head: true })
    .in("business_id", ids)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  return { count: count ?? 0, error };
}

export function getUtcMonthBounds(now: Date): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

export async function getUserPlanContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ plan: SubscriptionPlan; businessCount: number; error: unknown }> {
  const [{ ids, error: businessError }, subscription] = await Promise.all([
    getOwnedBusinessIds(supabase, userId),
    getAccountSubscription(supabase, userId),
  ]);

  if (businessError) {
    return { plan: getSubscriptionPlan("free"), businessCount: 0, error: businessError };
  }
  if (subscription.error) {
    return { plan: getSubscriptionPlan("free"), businessCount: ids.length, error: subscription.error };
  }
  if (!subscription.data) {
    return {
      plan: getSubscriptionPlan("free"),
      businessCount: ids.length,
      error: new Error("Missing account subscription"),
    };
  }

  return { plan: subscription.data.plan, businessCount: ids.length, error: null };
}

export function planRank(plan: PlanId): number {
  return plan === "business" ? 2 : plan === "pro" ? 1 : 0;
}
