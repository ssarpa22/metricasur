import { z } from "zod";

const optionalUrl = z.string().trim().url().optional().or(z.literal("").transform(() => undefined));
const optionalSecret = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));

const serverSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  AI_PROVIDER: optionalSecret,
  AI_API_KEY: optionalSecret,
  METRICASUR_FREE_REGISTRATION_ENABLED: z.enum(["true", "false"]).optional().default("true"),
});

export function getServerEnv() {
  return serverSchema.parse(process.env);
}

export function getPublicEnv() {
  return z.object({
    NEXT_PUBLIC_SITE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  }).parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
