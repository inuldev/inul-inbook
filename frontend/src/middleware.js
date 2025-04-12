import { NextResponse } from "next/server";

const publicRoutes = ["/user-login", "/user-register", "/forgot-password"];
const specialRoutes = ["/google-callback"]; // Rute khusus yang tidak perlu redirect

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and special routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    specialRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Cek token dari berbagai sumber
  const token = request.cookies.get("token");
  const devToken = request.cookies.get("dev_token");
  const hasToken = token || devToken;

  // Redirect to login if no token and trying to access protected route
  if (!isPublicRoute && !hasToken) {
    const loginUrl = new URL("/user-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if has token and trying to access public route
  // Tambahkan pengecekan untuk mencegah loop redirect
  if (
    isPublicRoute &&
    hasToken &&
    !request.nextUrl.searchParams.has("noredirect")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
