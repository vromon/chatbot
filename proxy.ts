import { type NextRequest, NextResponse } from "next/server";

// Auth/session is handled by FastAPI backend.
// This proxy just passes all requests through without auth checks.
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
