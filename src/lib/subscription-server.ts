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

export async function getBusinessSubscription(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ data: SubscriptionSnapshot | null; error: unknown }> {
  const { data, error } = await supabase
    .from("business_subscriptions")
    .select("plan, status, started_at, renews_at, free_plan_grandfathered")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) return { data: null, error };
  return { data: { ...data, plan: getSubscriptionPlan(data.plan) }, error: null };
}

export async function getMonthlyRecordUsage(
  supabase: SupabaseClient,
  businessId: string,
  now = new Date(),
): Promise<{ count: number; error: unknown }> {
  const { start, end } = getUtcMonthBounds(now);
  const { count, error } = await supabase
    .from("business_records")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
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
  const { data: memberships, error: membershipError } = await supabase
    .from("business_memberships")
    .select("business_id, role")
    .eq("user_id", userId);

  if (membershipError) return { plan: getSubscriptionPlan("free"), businessCount: 0, error: membershipError };

  const businessIds = memberships
    ?.filter((membership) => membership.role === "owner" || membership.role === "admin")
    .map((membership) => membership.business_id) ?? [];
  if (!businessIds.length) return { plan: getSubscriptionPlan("free"), businessCount: 0, error: null };

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("business_subscriptions")
    .select("plan")
    .in("business_id", businessIds);

  if (subscriptionError) return { plan: getSubscriptionPlan("free"), businessCount: businessIds.length, error: subscriptionError };
  if ((subscriptions?.length ?? 0) !== businessIds.length) {
    return { plan: getSubscriptionPlan("free"), businessCount: businessIds.length, error: new Error("Missing subscription for a managed business") };
  }

  const plans = subscriptions?.map((subscription) => getSubscriptionPlan(subscription.plan)) ?? [];
  const plan = plans.sort((a, b) => planRank(b.id) - planRank(a.id))[0] ?? getSubscriptionPlan("free");
  return { plan, businessCount: businessIds.length, error: null };
}

export function planRank(plan: PlanId): number {
  return plan === "business" ? 2 : plan === "pro" ? 1 : 0;
}
