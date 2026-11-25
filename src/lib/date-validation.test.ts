import { describe, expect, it } from "vitest";
import { isValidDateOnly } from "./date-validation";

describe("isValidDateOnly", () => {
  it("acepta fechas válidas", () => {
    expect(isValidDateOnly("2026-11-25")).toBe(true);
    expect(isValidDateOnly("2024-02-29")).toBe(true);
    expect(isValidDateOnly("2026-01-01")).toBe(true);
  });

  it("rechaza fechas inexistentes", () => {
    expect(isValidDateOnly("2026-99-99")).toBe(false);
    expect(isValidDateOnly("2026-02-29")).toBe(false);
    expect(isValidDateOnly("2026-04-31")).toBe(false);
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("2026-00-10")).toBe(false);
  });

  it("rechaza formatos incorrectos", () => {
    expect(isValidDateOnly("")).toBe(false);
    expect(isValidDateOnly("25-11-2026")).toBe(false);
    expect(isValidDateOnly("2026/11/25")).toBe(false);
    expect(isValidDateOnly("2026-1-5")).toBe(false);
    expect(isValidDateOnly("texto")).toBe(false);
  });
});
