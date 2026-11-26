import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { next: vi.fn((request: NextRequest) => ({ request, cookies: { set: vi.fn() } })) },
}));

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { proxy } from "./proxy";

const createServerClientMock = vi.mocked(createServerClient);
const nextMock = vi.mocked(NextResponse.next);

const request = {
  cookies: { getAll: vi.fn((): { name: string; value: string }[] => []), set: vi.fn() },
} as unknown as NextRequest;

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
});

describe("proxy", () => {
  it("passes the request through when supabase env is missing", async () => {
    withEnv(
      { NEXT_PUBLIC_SUPABASE_URL: undefined, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined },
      async () => {
        const response = await proxy(request);
        expect(nextMock).toHaveBeenCalledWith({ request });
        expect(createServerClientMock).not.toHaveBeenCalled();
        expect(response).toBe(nextMock.mock.results[0].value);
      },
    );
  });

  it("creates the supabase client and loads the user when env is present", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "1" } }, error: null });
    createServerClientMock.mockReturnValue({ auth: { getUser: mockGetUser } });

    withEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      },
      async () => {
        const response = await proxy(request);
        expect(createServerClientMock).toHaveBeenCalledWith(
          "https://example.supabase.co",
          "anon-key",
          expect.anything(),
        );
        expect(mockGetUser).toHaveBeenCalled();
        expect(response).toBe(nextMock.mock.results[0].value);
      },
    );
  });
});
