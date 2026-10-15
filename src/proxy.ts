import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET?.trim() ||
    "insecure-dev-secret-change-me-0000000000000000",
);

export const config = { matcher: ["/admin/:path*"] };

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("nosi_session")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (ok) return NextResponse.next();

  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
