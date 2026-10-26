import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(""),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().optional().default("false"),
  RESEND_API_KEY: z.string().optional().default(""),
  NOTIFICATION_FROM_EMAIL: z
    .string()
    .optional()
    .default("orders@eshalbakes.pk"),
  DEMO_ADMIN_EMAIL: z.string().email().optional().default("admin@eshalbakes.pk"),
  DEMO_ADMIN_PASSWORD: z.string().optional().default("KarachiBaker#2026!"),
  DEMO_SESSION_SECRET: z
    .string()
    .min(16)
    .optional()
    .default("eshaal-bakes-local-hmac-secret-change-in-production-32bytes"),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}

export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: getServerEnv() must never be imported or called in client browser code."
    );
  }
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

/**
 * Returns true if a live Supabase instance is configured (non-placeholder URL & keys).
 */
export function isLiveSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    Boolean(url) &&
    Boolean(anon) &&
    !url.includes("your-project-id.supabase.co") &&
    !anon.includes("your-anon-key-here")
  );
}
