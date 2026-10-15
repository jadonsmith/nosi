import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  if (!env.adminPassword || password !== env.adminPassword) {
    return NextResponse.json(
      { ok: false, error: "invalid password" },
      { status: 401 },
    );
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
