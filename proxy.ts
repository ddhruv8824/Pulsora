import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function proxy(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (cookie && cookie === (await accessToken(password))) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Enter the demo password first." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the login page/API and static assets.
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
