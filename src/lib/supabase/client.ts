"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, isLiveSupabaseConfigured } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!isLiveSupabaseConfigured()) {
    return null;
  }
  const env = getPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
