import { describe, expect, it } from "vitest";
import { getServerEnv, getPublicEnv } from "./env";

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

describe("getServerEnv", () => {
  it("parses server environment with safe defaults", () => {
    withEnv(
      {
        NEXT_PUBLIC_SITE_URL: "https://metricasur.example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        AI_PROVIDER: "openai",
        AI_API_KEY: "sk-test",
        METRICASUR_FREE_REGISTRATION_ENABLED: "false",
      },
      () => {
        const env = getServerEnv();
        expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://metricasur.example.com");
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
        expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
        expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role");
        expect(env.AI_PROVIDER).toBe("openai");
        expect(env.AI_API_KEY).toBe("sk-test");
        expect(env.METRICASUR_FREE_REGISTRATION_ENABLED).toBe("false");
      },
    );
  });

  it("defaults free registration to true when missing", () => {
    withEnv({ METRICASUR_FREE_REGISTRATION_ENABLED: undefined }, () => {
      expect(getServerEnv().METRICASUR_FREE_REGISTRATION_ENABLED).toBe("true");
    });
  });

  it("transforms empty urls to undefined", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: "", NEXT_PUBLIC_SUPABASE_URL: "" }, () => {
      const env = getServerEnv();
      expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    });
  });

  it("rejects invalid urls", () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }, () => {
      expect(() => getServerEnv()).toThrow();
    });
  });
});

describe("getPublicEnv", () => {
  it("returns only public fields", () => {
    withEnv(
      {
        NEXT_PUBLIC_SITE_URL: "https://metricasur.example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "secret-must-not-leak",
      },
      () => {
        const env = getPublicEnv();
        expect(env).toEqual({
          NEXT_PUBLIC_SITE_URL: "https://metricasur.example.com",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        });
      },
    );
  });

  it("transforms empty anon key to undefined", () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }, () => {
      expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
    });
  });

  it("rejects invalid public url", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: "bad url" }, () => {
      expect(() => getPublicEnv()).toThrow();
    });
  });
});
