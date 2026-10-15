import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hosts } from "@/db/schema";
import { getHostDetail } from "@/lib/queries";
import { isAuthed } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ hostname: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { hostname } = await ctx.params;
  const range = new URL(req.url).searchParams.get("range");
  const detail = await getHostDetail(decodeURIComponent(hostname), range);
  if (!detail) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(detail, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { hostname } = await ctx.params;
  const db = await getDb();
  await db.delete(hosts).where(eq(hosts.hostname, decodeURIComponent(hostname)));
  return NextResponse.json({ ok: true });
}

const Patch = z.object({
  label: z.string().max(120).nullable().optional(),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lon: z.coerce.number().min(-180).max(180).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { hostname } = await ctx.params;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 422 });
  }
  const patch = parsed.data;
  const set: Record<string, unknown> = {};
  if ("label" in patch) set.label = patch.label ?? null;
  if ("lat" in patch) set.lat = patch.lat ?? null;
  if ("lon" in patch) set.lon = patch.lon ?? null;
  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const db = await getDb();
  const [row] = await db
    .update(hosts)
    .set(set)
    .where(eq(hosts.hostname, decodeURIComponent(hostname)))
    .returning();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, host: row });
}
