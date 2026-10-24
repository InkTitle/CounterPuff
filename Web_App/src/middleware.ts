import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const USER_PREFIXES = ["/home", "/ebook", "/method", "/sos", "/progress", "/community", "/account", "/onboarding"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_PAGES = ["/login", "/signup"];

function isPrefixed(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("cp_session")?.value;
  let role: string | null = null;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      role = (payload.role as string) ?? null;
    } catch {
      role = null;
    }
  }

  if (isPrefixed(path, USER_PREFIXES) || isPrefixed(path, ADMIN_PREFIXES)) {
    if (!token || !role) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (isPrefixed(path, ADMIN_PREFIXES) && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  if (isPrefixed(path, AUTH_PAGES) && token && role) {
    const url = req.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/ebook",
    "/ebook/:path*",
    "/method",
    "/method/:path*",
    "/sos",
    "/sos/:path*",
    "/progress",
    "/progress/:path*",
    "/community",
    "/community/:path*",
    "/account",
    "/account/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
