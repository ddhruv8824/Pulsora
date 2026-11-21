import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function POST(req: Request) {
  const expected = process.env.DEMO_PASSWORD;
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!expected) return NextResponse.json({ ok: true });
  if (!password || password !== expected) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, await accessToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
