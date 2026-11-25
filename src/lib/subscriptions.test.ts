import { describe, expect, it } from "vitest";
import { getSubscriptionPlan, isPlanAtLeast, subscriptionPlans } from "./subscriptions";
import { getUtcMonthBounds } from "./subscription-server";
import { isFreeRegistrationEnabled } from "./subscription-runtime";

describe("subscription plans", () => {
  it("defines the three supported plans centrally", () => {
    expect(Object.keys(subscriptionPlans)).toEqual(["free", "pro", "business"]);
    expect(subscriptionPlans.free.priceUsdMonthly).toBe(0);
    expect(subscriptionPlans.pro.priceUsdMonthly).toBe(12);
    expect(subscriptionPlans.business.priceUsdMonthly).toBe(29);
  });

  it("falls back safely to Free for unknown persisted values", () => {
    expect(getSubscriptionPlan("unknown").id).toBe("free");
    expect(getSubscriptionPlan("toString").id).toBe("free");
  });

  it("orders entitlements from Free to Business", () => {
    expect(isPlanAtLeast("free", "pro")).toBe(false);
    expect(isPlanAtLeast("pro", "free")).toBe(true);
    expect(isPlanAtLeast("business", "pro")).toBe(true);
  });

  it("uses half-open UTC calendar month boundaries", () => {
    const { start, end } = getUtcMonthBounds(new Date("2026-12-31T23:59:59.000Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("keeps Free registration enabled for missing or malformed configuration", () => {
    const previous = process.env.METRICASUR_FREE_REGISTRATION_ENABLED;
    try {
      delete process.env.METRICASUR_FREE_REGISTRATION_ENABLED;
      expect(isFreeRegistrationEnabled()).toBe(true);
      process.env.METRICASUR_FREE_REGISTRATION_ENABLED = "unexpected";
      expect(isFreeRegistrationEnabled()).toBe(true);
      process.env.METRICASUR_FREE_REGISTRATION_ENABLED = "false";
      expect(isFreeRegistrationEnabled()).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.METRICASUR_FREE_REGISTRATION_ENABLED;
      else process.env.METRICASUR_FREE_REGISTRATION_ENABLED = previous;
    }
  });
});
