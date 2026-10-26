import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  createSignedAdminSessionCookieValue,
  getAuthenticatedAdmin,
} from "@/lib/auth";
import { getServerEnv, isLiveSupabaseConfigured } from "@/lib/env";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/store-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers);
  const rate = checkRateLimit({
    key: `admin-login:${ip}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${rate.retryAfterSeconds}s and try again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid login input." },
        { status: 400 }
      );
    }

    const { email, password, totpCode } = parsed.data;
    const env = getServerEnv();
    let authenticatedUser: {
      id: string;
      email: string;
      role: "admin";
      mfaVerified: boolean;
    } | null = null;

    if (isLiveSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, role, mfa_enabled")
            .eq("id", data.user.id)
            .single();

          if (!profile || profile.role !== "admin") {
            await supabase.auth.signOut();
            return NextResponse.json(
              { error: "Access denied. Admin role required." },
              { status: 403 }
            );
          }

          if (profile.mfa_enabled && !totpCode) {
            return NextResponse.json(
              { error: "2FA authenticator code is required for this account." },
              { status: 401 }
            );
          }

          authenticatedUser = {
            id: profile.id,
            email: profile.email,
            role: "admin",
            mfaVerified: true,
          };
        }
      }
    }

    // Fallback to configured local/demo admin credentials
    if (
      !authenticatedUser &&
      email.toLowerCase() === env.DEMO_ADMIN_EMAIL.toLowerCase() &&
      password === env.DEMO_ADMIN_PASSWORD
    ) {
      authenticatedUser = {
        id: "00000000-0000-0000-0000-000000000099",
        email: env.DEMO_ADMIN_EMAIL,
        role: "admin",
        mfaVerified: Boolean(totpCode) || true,
      };
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    const signedCookieValue =
      createSignedAdminSessionCookieValue(authenticatedUser);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, signedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    recordAuditLog({
      actorId: authenticatedUser.id,
      action: "admin.login",
      entityType: "session",
      entityId: authenticatedUser.id,
      metadata: { email: authenticatedUser.email },
    });

    return NextResponse.json({
      ok: true,
      user: {
        email: authenticatedUser.email,
        role: authenticatedUser.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process login request." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const admin = await getAuthenticatedAdmin();
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  if (isLiveSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  if (admin) {
    recordAuditLog({
      actorId: admin.id,
      action: "admin.logout",
      entityType: "session",
      entityId: admin.id,
    });
  }

  return NextResponse.json({ ok: true });
}
