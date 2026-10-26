import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "eshaal_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedAdminPage =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isProtectedAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth");

  if (!isProtectedAdminPage && !isProtectedAdminApi) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (!sessionToken && !hasSupabaseCookie) {
    if (isProtectedAdminApi) {
      return NextResponse.json(
        { error: "Unauthorized: Admin authentication required." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
