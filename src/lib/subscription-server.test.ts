import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAccountSubscription,
  getMonthlyRecordUsage,
  getUtcMonthBounds,
  getUserPlanContext,
  planRank,
} from "./subscription-server";

type DbResponse = { data?: any; error?: unknown; count?: number };
type Chain = {
  select: (...args: unknown[]) => Chain;
  eq: (...args: unknown[]) => Chain;
  in: (...args: unknown[]) => Chain;
  gte: (...args: unknown[]) => Chain;
  lt: (...args: unknown[]) => Chain;
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
});

describe("planRank", () => {
  it("orders free below pro below business", () => {
    expect(planRank("free")).toBe(0);
    expect(planRank("pro")).toBe(1);
    expect(planRank("business")).toBe(2);
  });
});

describe("getAccountSubscription", () => {
  it("loads the subscription by account owner", async () => {
    const row = {
      plan: "pro",
      status: "active",
      started_at: "2026-01-01T00:00:00.000Z",
      renews_at: null,
      free_plan_grandfathered: false,
    };
    const supabase = buildSupabase({ account_subscriptions: { data: row } });
    const { data, error } = await getAccountSubscription(supabase, "user-1");
    expect(error).toBeNull();
    expect(data?.plan.id).toBe("pro");
    expect(data?.plan.priceUsdMonthly).toBe(12);
  });

  it("returns the database error without silently granting a plan", async () => {
    const supabase = buildSupabase({ account_subscriptions: { error: { message: "db down" } } });
    const { data, error } = await getAccountSubscription(supabase, "user-1");
    expect(data).toBeNull();
    expect(error).toEqual({ message: "db down" });
  });
});

describe("getMonthlyRecordUsage", () => {
  it("counts records across every business owned by the account", async () => {
    const supabase = buildSupabase({
      businesses: { data: [{ id: "biz-1" }, { id: "biz-2" }] },
      business_records: { count: 17, error: null },
    });
    const { count, error } = await getMonthlyRecordUsage(supabase, "user-1", new Date("2026-12-15T10:00:00.000Z"));
    expect(count).toBe(17);
    expect(error).toBeNull();
  });

  it("returns zero when the account has no businesses", async () => {
    const supabase = buildSupabase({ businesses: { data: [] } });
    const { count, error } = await getMonthlyRecordUsage(supabase, "user-1");
    expect(count).toBe(0);
    expect(error).toBeNull();
  });

  it("surfaces errors loading owned businesses", async () => {
    const supabase = buildSupabase({ businesses: { error: { message: "db down" } } });
    const { count, error } = await getMonthlyRecordUsage(supabase, "user-1");
    expect(count).toBe(0);
    expect(error).toEqual({ message: "db down" });
  });
});

describe("getUserPlanContext", () => {
  it("returns the account plan and counts businesses created by that account", async () => {
    const supabase = buildSupabase({
      businesses: { data: [{ id: "biz-1" }, { id: "biz-2" }] },
      account_subscriptions: {
        data: {
          plan: "business",
          status: "active",
          started_at: "2026-01-01T00:00:00.000Z",
          renews_at: null,
          free_plan_grandfathered: false,
        },
      },
    });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(error).toBeNull();
    expect(plan.id).toBe("business");
    expect(businessCount).toBe(2);
  });

  it("reports a missing account subscription as an error", async () => {
    const supabase = buildSupabase({
      businesses: { data: [{ id: "biz-1" }] },
      account_subscriptions: { data: null, error: null },
    });
    const { plan, businessCount, error } = await getUserPlanContext(supabase, "user-1");
    expect(plan.id).toBe("free");
    expect(businessCount).toBe(1);
    expect(error).toBeInstanceOf(Error);
  });
});
