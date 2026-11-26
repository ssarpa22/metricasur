import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./server";

const createServerClientMock = vi.mocked(createServerClient);
const cookiesMock = vi.mocked(cookies);

const mockCookieStore = { getAll: vi.fn(() => []), set: vi.fn() } as unknown as Awaited<ReturnType<typeof cookies>>;

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

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue(mockCookieStore);
  createServerClientMock.mockReturnValue({ auth: { getUser: vi.fn() } } as unknown as SupabaseClient);
});

describe("createSupabaseServerClient", () => {
  it("throws when supabase is not configured", async () => {
    withEnv(
      { NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined },
      async () => {
        await expect(createSupabaseServerClient()).rejects.toThrow(
          "Supabase no está configurado",
        );
      },
    );
  });

  it("creates the client with the public env and cookie store when configured", async () => {
    withEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      },
      async () => {
        const client = await createSupabaseServerClient();
        expect(cookiesMock).toHaveBeenCalled();
        expect(createServerClientMock).toHaveBeenCalledWith(
          "https://example.supabase.co",
          "anon-key",
          expect.objectContaining({ cookies: expect.any(Object) }),
        );
        expect(client).toBe(createServerClientMock.mock.results[0].value);
      },
    );
  });
});
