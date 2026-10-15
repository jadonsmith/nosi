import "server-only";
import { sql } from "drizzle-orm";
import { getDb, rawRows } from "@/db";
import { env } from "./env";
import { statusFromAge, pct } from "./metrics";
import type {
  HostSummary,
  HostsResponse,
  HostDetailResponse,
  MetricRange,
  SeriesPoint,
} from "./types";

interface LatestRow {
  hostname: string;
  label: string | null;
  provider: string | null;
  ip: string | null;
  lat: number | null;
  lon: number | null;
  city: string | null;
  country: string | null;
  first_seen: string;
  ts: string;
  cpu_pct: number;
  mem_total_kb: number;
  mem_used_kb: number;
  disk_total_kb: number;
  disk_free_kb: number;
  load1: number | null;
  load5: number | null;
  load15: number | null;
  uptime_s: number | null;
  seconds_ago: number;
}

function toSummary(r: LatestRow): HostSummary {
  const secondsAgo = Number(r.seconds_ago);
  const memUsedKb = Number(r.mem_used_kb);
  const memTotalKb = Number(r.mem_total_kb);
  const diskTotalKb = Number(r.disk_total_kb);
  const diskFreeKb = Number(r.disk_free_kb);
  return {
    hostname: r.hostname,
    label: r.label,
    provider: r.provider,
    ip: r.ip,
    lat: r.lat == null ? null : Number(r.lat),
    lon: r.lon == null ? null : Number(r.lon),
    city: r.city,
    country: r.country,
    status: statusFromAge(secondsAgo, env.staleMinutes, env.downMinutes),
    lastSeen: new Date(r.ts).toISOString(),
    secondsAgo,
    cpuPct: Number(r.cpu_pct),
    memPct: pct(memUsedKb, memTotalKb),
    diskPct: pct(diskTotalKb - diskFreeKb, diskTotalKb),
    memUsedKb,
    memTotalKb,
    diskFreeKb,
    diskTotalKb,
    load1: r.load1 == null ? null : Number(r.load1),
    load5: r.load5 == null ? null : Number(r.load5),
    load15: r.load15 == null ? null : Number(r.load15),
    uptimeS: r.uptime_s == null ? null : Number(r.uptime_s),
    spark: [],
  };
}

export async function getHostSummaries(): Promise<HostsResponse> {
  const db = await getDb();

  const latest = await rawRows<LatestRow>(
    db,
    sql`
      select distinct on (h.id)
        h.hostname, h.label, h.provider, h.ip, h.lat, h.lon, h.city, h.country,
        h.first_seen,
        hb.ts, hb.cpu_pct, hb.mem_total_kb, hb.mem_used_kb,
        hb.disk_total_kb, hb.disk_free_kb,
        hb.load1, hb.load5, hb.load15, hb.uptime_s,
        extract(epoch from (now() - hb.ts)) as seconds_ago
      from hosts h
      join heartbeats hb on hb.host_id = h.id
      order by h.id, hb.ts desc
    `,
  );

  const sparks = await rawRows<{ hostname: string; cpu_pct: number }>(
    db,
    sql`
      select h.hostname, x.cpu_pct
      from hosts h
      join lateral (
        select cpu_pct, ts
        from heartbeats hb
        where hb.host_id = h.id
        order by hb.ts desc
        limit 48
      ) x on true
      order by h.hostname, x.ts asc
    `,
  );
  const sparkMap = new Map<string, number[]>();
  for (const s of sparks) {
    const arr = sparkMap.get(s.hostname) ?? [];
    arr.push(Number(s.cpu_pct));
    sparkMap.set(s.hostname, arr);
  }

  const hosts = latest
    .map(toSummary)
    .map((h) => ({ ...h, spark: sparkMap.get(h.hostname) ?? [] }))
    .sort((a, b) => a.hostname.localeCompare(b.hostname));

  return {
    hosts,
    now: new Date().toISOString(),
    thresholds: {
      staleMinutes: env.staleMinutes,
      downMinutes: env.downMinutes,
    },
  };
}

const RANGE_SPEC: Record<MetricRange, { seconds: number; bucket: number }> = {
  "1h": { seconds: 3600, bucket: 60 },
  "6h": { seconds: 6 * 3600, bucket: 300 },
  "24h": { seconds: 24 * 3600, bucket: 900 },
  "7d": { seconds: 7 * 86400, bucket: 3600 },
  "30d": { seconds: 30 * 86400, bucket: 6 * 3600 },
};

export function normalizeRange(input: string | null | undefined): MetricRange {
  if (input && input in RANGE_SPEC) return input as MetricRange;
  return "24h";
}

export async function getHostDetail(
  hostname: string,
  rangeInput: string | null | undefined,
): Promise<HostDetailResponse | null> {
  const db = await getDb();
  const range = normalizeRange(rangeInput);
  const { seconds, bucket } = RANGE_SPEC[range];

  const [row] = await rawRows<LatestRow>(
    db,
    sql`
      select distinct on (h.id)
        h.hostname, h.label, h.provider, h.ip, h.lat, h.lon, h.city, h.country,
        h.first_seen,
        hb.ts, hb.cpu_pct, hb.mem_total_kb, hb.mem_used_kb,
        hb.disk_total_kb, hb.disk_free_kb,
        hb.load1, hb.load5, hb.load15, hb.uptime_s,
        extract(epoch from (now() - hb.ts)) as seconds_ago
      from hosts h
      join heartbeats hb on hb.host_id = h.id
      where h.hostname = ${hostname}
      order by h.id, hb.ts desc
    `,
  );

  // Host may exist with no heartbeats yet.
  const bare = await rawRows<{
    hostname: string;
    label: string | null;
    provider: string | null;
    ip: string | null;
    lat: number | null;
    lon: number | null;
    city: string | null;
    country: string | null;
    first_seen: string;
  }>(
    db,
    sql`select hostname, label, provider, ip, lat, lon, city, country, first_seen
        from hosts where hostname = ${hostname} limit 1`,
  );
  if (!row && bare.length === 0) return null;

  const seriesRows = await rawRows<{
    bucket: string;
    cpu: number | null;
    mem: number | null;
    disk: number | null;
    load1: number | null;
  }>(
    db,
    sql`
      select
        to_timestamp(floor(extract(epoch from hb.ts) / ${bucket}) * ${bucket}) as bucket,
        avg(hb.cpu_pct) as cpu,
        avg(hb.mem_used_kb::float8 / nullif(hb.mem_total_kb, 0) * 100) as mem,
        avg((hb.disk_total_kb - hb.disk_free_kb)::float8 / nullif(hb.disk_total_kb, 0) * 100) as disk,
        avg(hb.load1) as load1
      from heartbeats hb
      join hosts h on h.id = hb.host_id
      where h.hostname = ${hostname}
        and hb.ts >= now() - make_interval(secs => ${seconds})
      group by 1
      order by 1 asc
    `,
  );

  const series: SeriesPoint[] = seriesRows.map((s) => ({
    t: new Date(s.bucket).toISOString(),
    cpu: s.cpu == null ? null : Number(s.cpu),
    mem: s.mem == null ? null : Number(s.mem),
    disk: s.disk == null ? null : Number(s.disk),
    load1: s.load1 == null ? null : Number(s.load1),
  }));

  const meta = row ?? { ...bare[0], ts: null, seconds_ago: Number.MAX_SAFE_INTEGER };
  const summary = row ? toSummary(row) : null;

  return {
    host: {
      hostname: meta.hostname,
      label: meta.label,
      provider: meta.provider,
      ip: meta.ip,
      lat: meta.lat == null ? null : Number(meta.lat),
      lon: meta.lon == null ? null : Number(meta.lon),
      city: meta.city,
      country: meta.country,
      firstSeen: new Date(meta.first_seen).toISOString(),
      status: summary?.status ?? "down",
      secondsAgo: summary?.secondsAgo ?? Number.MAX_SAFE_INTEGER,
      latest: summary
        ? {
            cpuPct: summary.cpuPct,
            memPct: summary.memPct,
            diskPct: summary.diskPct,
            memUsedKb: summary.memUsedKb,
            memTotalKb: summary.memTotalKb,
            diskFreeKb: summary.diskFreeKb,
            diskTotalKb: summary.diskTotalKb,
            load1: summary.load1,
            load5: summary.load5,
            load15: summary.load15,
            uptimeS: summary.uptimeS,
          }
        : null,
    },
    range,
    series,
  };
}
