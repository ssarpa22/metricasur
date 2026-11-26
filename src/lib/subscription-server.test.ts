import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAccountSubscription,
  getMonthlyRecordUsage,
  getUtcMonthBounds,
  getUserPlanContext,
  planRank,
} from "./subscription-server";

const row = {
  plan: "pro",
  status: "active",
  started_at: "2026-01-01T00:00:00.000Z",
  renews_at: null,
  free_plan_grandfathered: false,
  business_count: 2,
  monthly_record_count: 17,
};

function buildSupabase(response: { data?: unknown; error?: unknown }): SupabaseClient {
  return {
    rpc: () => Promise.resolve(response),
  } as unknown as SupabaseClient;
}

describe("getUtcMonthBounds", () => {
  it("returns half-open UTC calendar month boundaries", () => {
    const { start, end } = getUtcMonthBounds(new Date("2026-12-31T23:59:59.000Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("planRank", () => {
  it("orders free below pro below business", () => {
    expect(planRank("free")).toBe(0);
    expect(planRank("pro")).toBe(1);
    expect(planRank("business")).toBe(2);
  });
});

describe("account subscription context", () => {
  it("maps the account plan and excludes aggregate counters from the snapshot", async () => {
    const supabase = buildSupabase({ data: [row], error: null });
    const { data, error } = await getAccountSubscription(supabase, "account-1");
    expect(error).toBeNull();
    expect(data?.plan.id).toBe("pro");
    expect(data?.plan.priceUsdMonthly).toBe(12);
    expect(data).not.toHaveProperty("business_count");
  });

  it("returns account-wide monthly record usage", async () => {
    const supabase = buildSupabase({ data: [row], error: null });
    const { count, error } = await getMonthlyRecordUsage(supabase, "account-1");
    expect(count).toBe(17);
    expect(error).toBeNull();
  });

  it("returns the account plan and aggregate business count", async () => {
    const supabase = buildSupabase({ data: [row], error: null });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "account-1");
    expect(error).toBeNull();
    expect(plan.id).toBe("pro");
    expect(businessCount).toBe(2);
  });

  it("surfaces RPC errors instead of silently treating the account as Free", async () => {
    const supabase = buildSupabase({ data: null, error: { message: "db down" } });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "account-1");
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(0);
    expect(error).toEqual({ message: "db down" });
  });

  it("reports a missing account subscription", async () => {
    const supabase = buildSupabase({ data: [], error: null });
    const { data, error } = await getAccountSubscription(supabase, "account-1");
    expect(data).toBeNull();
    expect(error).toBeNull();
  });
});
