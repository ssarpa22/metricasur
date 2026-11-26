import type { SupabaseClient } from "@supabase/supabase-js";
import { getSubscriptionPlan, type PlanId, type SubscriptionPlan } from "./subscriptions";

type SubscriptionContextRow = {
  plan: string;
  status: string;
  started_at: string;
  renews_at: string | null;
  free_plan_grandfathered: boolean;
  business_count: number;
  monthly_record_count: number;
};

export type SubscriptionSnapshot = Omit<SubscriptionContextRow, "plan" | "business_count" | "monthly_record_count"> & {
  plan: SubscriptionPlan;
};

async function getAccountContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ row: SubscriptionContextRow | null; error: unknown }> {
  const { data, error } = await supabase.rpc("get_account_subscription_context", {
    p_account_user_id: userId,
  });
  if (error) return { row: null, error };
  return { row: (data?.[0] as SubscriptionContextRow | undefined) ?? null, error: null };
}

export async function getAccountSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: SubscriptionSnapshot | null; error: unknown }> {
  const { row, error } = await getAccountContext(supabase, userId);
  if (error || !row) return { data: null, error };
  const subscription = {
    status: row.status,
    started_at: row.started_at,
    renews_at: row.renews_at,
    free_plan_grandfathered: row.free_plan_grandfathered,
  };
  return { data: { ...subscription, plan: getSubscriptionPlan(row.plan) }, error: null };
}

export async function getMonthlyRecordUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ count: number; error: unknown }> {
  const { row, error } = await getAccountContext(supabase, userId);
  return { count: row?.monthly_record_count ?? 0, error };
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
  const { row, error } = await getAccountContext(supabase, userId);
  if (error) {
    return { plan: getSubscriptionPlan("free"), businessCount: 0, error };
  }
  if (!row) {
    return {
      plan: getSubscriptionPlan("free"),
      businessCount: 0,
      error: new Error("Missing account subscription"),
    };
  }
  return {
    plan: getSubscriptionPlan(row.plan),
    businessCount: row.business_count,
    error: null,
  };
}

export function planRank(plan: PlanId): number {
  return plan === "business" ? 2 : plan === "pro" ? 1 : 0;
}
