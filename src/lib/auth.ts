import crypto from "crypto";
import { cookies } from "next/headers";
import { getServerEnv, isLiveSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "eshaal_admin_session";

export interface AdminSessionUser {
  id: string;
  email: string;
  role: "admin";
  mfaVerified: boolean;
}

function signTokenPayload(payload: AdminSessionUser, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifySignedAdminToken(
  token: string,
  secret: string
): AdminSessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [data, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as AdminSessionUser;
    if (parsed.role !== "admin" || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSignedAdminSessionCookieValue(
  user: AdminSessionUser
): string {
  const env = getServerEnv();
  return signTokenPayload(user, env.DEMO_SESSION_SECRET);
}

/**
 * Verifies admin authentication & `role === 'admin'` on the server.
 * Used inside every admin server route handler and protected layout (defense-in-depth alongside middleware).
 */
export async function getAuthenticatedAdmin(): Promise<AdminSessionUser | null> {
  const env = getServerEnv();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (sessionCookie) {
    const verified = verifySignedAdminToken(
      sessionCookie,
      env.DEMO_SESSION_SECRET
    );
    if (verified) {
      return verified;
    }
  }

  if (isLiveSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, role, mfa_enabled")
          .eq("id", user.id)
          .single();

        if (profile && profile.role === "admin") {
          return {
            id: profile.id,
            email: profile.email,
            role: "admin",
            mfaVerified: true,
          };
        }
      }
    }
  }

  return null;
}
