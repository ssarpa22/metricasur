import { describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "./config";

function withEnv(updates: Record<string, string | undefined>, run: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(updates)) {
    previous[key] = process.env[key];
    if (updates[key] === undefined) delete process.env[key];
    else process.env[key] = updates[key];
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("isSupabaseConfigured", () => {
  it("is true when both public keys are set", () => {
    withEnv(
      { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key" },
      () => {
        expect(isSupabaseConfigured()).toBe(true);
      },
    );
  });

  it("is false when the url is missing", () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key" }, () => {
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  it("is false when the anon key is missing", () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }, () => {
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  it("is false when both keys are empty strings", () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }, () => {
      expect(isSupabaseConfigured()).toBe(false);
    });
  });
});
