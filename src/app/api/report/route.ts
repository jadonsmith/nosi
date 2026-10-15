import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hosts, heartbeats } from "@/db/schema";
import { env } from "@/lib/env";
import { geolocate } from "@/lib/geo";
import { guessProvider } from "@/lib/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const nn = z.coerce.number().nonnegative();

const Payload = z.object({
  host: z.string().min(1).max(255),
  time: z.coerce.number().optional(),
  cpu_pct: z.coerce.number().min(0).max(100),
  mem_total_kb: nn,
  mem_used_kb: nn,
  disk_total_kb: nn,
  disk_free_kb: nn,
  load1: z.coerce.number().optional(),
  load5: z.coerce.number().optional(),
  load15: z.coerce.number().optional(),
  uptime_s: nn.optional(),
  provider: z.string().max(64).optional(),
});

function tokenOk(req: NextRequest): boolean {
  if (!env.ingestToken) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(header)?.[1];
  const provided = (bearer ?? req.headers.get("x-nosi-token") ?? "").trim();
  if (provided.length !== env.ingestToken.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ env.ingestToken.charCodeAt(i);
  }
  return diff === 0;
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  if (!tokenOk(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = Payload.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const p = parsed.data;
  const db = await getDb();
  const ip = clientIp(req);
  const providerGuess = p.provider ?? guessProvider(p.host);
  const seenAt = new Date();

  const existing = await db.query.hosts.findFirst({
    where: eq(hosts.hostname, p.host),
  });

  let host;
  if (existing) {
    [host] = await db
      .update(hosts)
      .set({
        lastSeen: seenAt,
        ip: ip ?? existing.ip,
        provider: existing.provider ?? providerGuess,
      })
      .where(eq(hosts.id, existing.id))
      .returning();
  } else {
    [host] = await db
      .insert(hosts)
      .values({
        hostname: p.host,
        provider: providerGuess,
        ip,
        firstSeen: seenAt,
        lastSeen: seenAt,
      })
      .returning();
  }

  await db.insert(heartbeats).values({
    hostId: host!.id,
    ts: seenAt,
    agentTs: p.time ? new Date(p.time * 1000) : null,
    cpuPct: p.cpu_pct,
    memTotalKb: Math.round(p.mem_total_kb),
    memUsedKb: Math.round(p.mem_used_kb),
    diskTotalKb: Math.round(p.disk_total_kb),
    diskFreeKb: Math.round(p.disk_free_kb),
    load1: p.load1 ?? null,
    load5: p.load5 ?? null,
    load15: p.load15 ?? null,
    uptimeS: p.uptime_s != null ? Math.round(p.uptime_s) : null,
  });

  if (env.geolocate && host!.lat == null && ip) {
    geolocate(ip)
      .then(async (g) => {
        if (!g) return;
        await db
          .update(hosts)
          .set({ lat: g.lat, lon: g.lon, city: g.city, country: g.country })
          .where(eq(hosts.id, host!.id));
      })
      .catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    host: p.host,
    received_at: seenAt.toISOString(),
  });
}
