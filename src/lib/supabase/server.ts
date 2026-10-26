import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getServerEnv, isLiveSupabaseConfigured } from "@/lib/env";

if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY VIOLATION: src/lib/supabase/server.ts must never be bundled in client code."
  );
}

export async function createSupabaseServerClient() {
  if (!isLiveSupabaseConfigured()) {
    return null;
  }
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...(options as Record<string, unknown>),
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              })
            );
          } catch {
            // Ignore when called from a Server Component render
          }
        },
      },
    }
  );
}

/**
 * Server-only Supabase Service Role client.
 * Never exposed to the browser bundle.
 */
export function createSupabaseServiceRoleClient() {
  if (!isLiveSupabaseConfigured()) {
    return null;
  }
  const env = getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service role operations.");
  }
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
