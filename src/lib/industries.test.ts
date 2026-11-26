import { describe, expect, it } from "vitest";
import { industrySchema, industries, type Industry } from "./industries";

describe("industrySchema", () => {
  it("accepts every defined industry", () => {
    const values: Industry[] = [
      "retail",
      "food_service",
      "butcher",
      "greengrocer",
      "beauty",
      "healthcare",
      "professional_services",
      "freelancer",
      "construction",
      "manufacturing",
      "other",
    ];
    expect(values.every((value) => industrySchema.safeParse(value).success)).toBe(true);
  });

  it("rejects invalid industries", () => {
    expect(industrySchema.safeParse("").success).toBe(false);
    expect(industrySchema.safeParse("Retail").success).toBe(false);
    expect(industrySchema.safeParse("restaurante").success).toBe(false);
  });
});

describe("industries", () => {
  it("covers every industry from the schema", () => {
    const defined = [...(industrySchema.options as unknown as string[])];
    expect(Object.keys(industries).sort()).toEqual(defined.sort());
  });

  it("provides label, description, focus and priorities for each industry", () => {
    for (const industry of Object.keys(industries) as Industry[]) {
      const entry = industries[industry];
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe("string");
      expect(typeof entry.focus).toBe("string");
      expect(Array.isArray(entry.priorities)).toBe(true);
      expect(entry.priorities.length).toBeGreaterThan(0);
    }
  });
});
