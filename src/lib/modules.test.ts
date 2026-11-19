import { describe, expect, it } from "vitest";
import { getModuleDefinition, getRecommendedModules, moduleCatalog, moduleSlugSchema } from "./modules";

describe("industry module catalog", () => {
  it("contains unique, valid module identifiers", () => {
    const slugs = moduleCatalog.map((module) => module.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => moduleSlugSchema.safeParse(slug).success)).toBe(true);
  });

  it("recommends different modules for different industries", () => {
    const butcher = getRecommendedModules("butcher").map((module) => module.slug);
    const freelancer = getRecommendedModules("freelancer").map((module) => module.slug);

    expect(butcher).toContain("inventory");
    expect(butcher).toContain("waste_tracking");
    expect(butcher).not.toContain("time_tracking");
    expect(freelancer).toContain("projects");
    expect(freelancer).toContain("time_tracking");
    expect(freelancer).not.toContain("inventory");
  });

  it("provides a safe fallback catalog for other industries", () => {
    expect(getRecommendedModules("other").map((module) => module.slug)).toEqual(["customers", "tasks"]);
  });

  it("returns no definition for an unknown module", () => {
    expect(getModuleDefinition("run_arbitrary_code")).toBeUndefined();
  });
});
