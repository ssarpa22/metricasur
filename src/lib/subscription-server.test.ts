import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBusinessSubscription,
  getMonthlyRecordUsage,
  getUtcMonthBounds,
  getUserPlanContext,
  planRank,
} from "./subscription-server";

type DbResponse = { data?: unknown; error?: unknown; count?: number };

type Chain = {
  select: () => Chain;
  eq: () => Chain;
  in: () => Chain;
  gte: () => Chain;
  lt: () => Chain;
  maybeSingle: () => Chain;
} & PromiseLike<DbResponse>;

function makeChain(response: DbResponse): Chain {
  const chain: Chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    gte: () => chain,
    lt: () => chain,
    maybeSingle: () => chain,
    then: undefined as never,
  };
  const promise = Promise.resolve(response);
  chain.then = promise.then.bind(promise);
  return chain;
}

function buildSupabase(tables: Record<string, DbResponse>): SupabaseClient {
  const from: SupabaseClient["from"] = (
    (table: string) => makeChain(tables[table] ?? { data: null, error: null })
  ) as unknown as SupabaseClient["from"];
  return { from } as unknown as SupabaseClient;
}

describe("getUtcMonthBounds", () => {
  it("returns half-open UTC calendar month boundaries", () => {
    const { start, end } = getUtcMonthBounds(new Date("2026-12-31T23:59:59.000Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("handles any day of the month", () => {
    const { start, end } = getUtcMonthBounds(new Date("2026-06-15T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("planRank", () => {
  it("orders free below pro below business", () => {
    expect(planRank("free")).toBe(0);
    expect(planRank("pro")).toBe(1);
    expect(planRank("business")).toBe(2);
  });
});

describe("getBusinessSubscription", () => {
  it("maps the stored plan to a subscription plan", async () => {
    const row = {
      plan: "pro",
      status: "active",
      started_at: "2026-01-01T00:00:00.000Z",
      renews_at: null,
      free_plan_grandfathered: false,
    };
    const supabase = buildSupabase({ business_subscriptions: { data: row } });
    const { data, error } = await getBusinessSubscription(supabase, "biz-1");
    expect(error).toBeNull();
    expect((data as { plan: { id: string } }).plan.id).toBe("pro");
    expect((data as { plan: { priceUsdMonthly: number } }).plan.priceUsdMonthly).toBe(12);
  });

  it("returns null data and the error when the query fails", async () => {
    const supabase = buildSupabase({ business_subscriptions: { error: { message: "db down" } } });
    const { data, error } = await getBusinessSubscription(supabase, "biz-1");
    expect(data).toBeNull();
    expect(error).toEqual({ message: "db down" });
  });

  it("returns null data when no subscription exists", async () => {
    const supabase = buildSupabase({ business_subscriptions: { data: null, error: null } });
    const { data, error } = await getBusinessSubscription(supabase, "biz-1");
    expect(data).toBeNull();
    expect(error).toBeNull();
  });
});

describe("getMonthlyRecordUsage", () => {
  it("returns the exact count for the current UTC month", async () => {
    const supabase = buildSupabase({ business_records: { count: 7, error: null } });
    const { count, error } = await getMonthlyRecordUsage(supabase, "biz-1", new Date("2026-12-15T10:00:00.000Z"));
    expect(count).toBe(7);
    expect(error).toBeNull();
  });

  it("returns zero count and the error when the query fails", async () => {
    const supabase = buildSupabase({ business_records: { error: { message: "db down" } } });
    const { count, error } = await getMonthlyRecordUsage(supabase, "biz-1");
    expect(count).toBe(0);
    expect(error).toEqual({ message: "db down" });
  });
});

describe("getUserPlanContext", () => {
  it("picks the highest plan among owner or admin memberships", async () => {
    const memberships = [
      { business_id: "biz-1", role: "owner" },
      { business_id: "biz-2", role: "member" },
      { business_id: "biz-3", role: "admin" },
    ];
    const subscriptions = [
      { plan: "free" },
      { plan: "business" },
    ];
    const supabase = buildSupabase({
      business_memberships: { data: memberships },
      business_subscriptions: { data: subscriptions },
    });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(error).toBeNull();
    expect(plan.id).toBe("business");
    expect(businessCount).toBe(2);
  });

  it("returns free plan with zero businesses when there are no memberships", async () => {
    const supabase = buildSupabase({ business_memberships: { data: [] } });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(error).toBeNull();
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(0);
  });

  it("returns the membership error when it fails", async () => {
    const supabase = buildSupabase({ business_memberships: { error: { message: "db down" } } });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(0);
    expect(error).toEqual({ message: "db down" });
  });

  it("returns the subscription error when it fails", async () => {
    const supabase = buildSupabase({
      business_memberships: { data: [{ business_id: "biz-1", role: "owner" }] },
      business_subscriptions: { error: { message: "db down" } },
    });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(1);
    expect(error).toEqual({ message: "db down" });
  });

  it("returns an error when a managed business lacks a subscription", async () => {
    const supabase = buildSupabase({
      business_memberships: { data: [{ business_id: "biz-1", role: "owner" }, { business_id: "biz-2", role: "owner" }] },
      business_subscriptions: { data: [{ plan: "pro" }] },
    });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(2);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Missing subscription for a managed business");
  });
});
