import { describe, expect, it } from "vitest";
import { isFreeRegistrationEnabled } from "./subscription-runtime";

function withEnv(value: string | undefined, run: () => void) {
  const key = "METRICASUR_FREE_REGISTRATION_ENABLED";
  const previous = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
}

describe("isFreeRegistrationEnabled", () => {
  it("defaults to enabled when missing", () => {
    withEnv(undefined, () => {
      expect(isFreeRegistrationEnabled()).toBe(true);
    });
  });

  it("is enabled for any value other than false", () => {
    withEnv("true", () => {
      expect(isFreeRegistrationEnabled()).toBe(true);
    });
    withEnv("unexpected", () => {
      expect(isFreeRegistrationEnabled()).toBe(true);
    });
  });

  it("is disabled when explicitly false", () => {
    withEnv("false", () => {
      expect(isFreeRegistrationEnabled()).toBe(false);
    });
  });
});
