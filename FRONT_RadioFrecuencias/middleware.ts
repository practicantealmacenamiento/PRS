import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const protectedPaths = ["/prestamos", "/historico", "/admin"];

  if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p)) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/prestamos/:path*", "/historico/:path*", "/admin/:path*"],
};
