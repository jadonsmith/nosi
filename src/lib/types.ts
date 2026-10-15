import type { HostStatus } from "./metrics";

export interface HostSummary {
  hostname: string;
  label: string | null;
  provider: string | null;
  ip: string | null;
  lat: number | null;
  lon: number | null;
  city: string | null;
  country: string | null;
  status: HostStatus;
  lastSeen: string; // ISO
  secondsAgo: number;
  cpuPct: number;
  memPct: number;
  diskPct: number;
  memUsedKb: number;
  memTotalKb: number;
  diskFreeKb: number;
  diskTotalKb: number;
  load1: number | null;
  load5: number | null;
  load15: number | null;
  uptimeS: number | null;
  spark: number[]; // recent CPU %, oldest -> newest
}

export interface HostsResponse {
  hosts: HostSummary[];
  now: string;
  thresholds: { staleMinutes: number; downMinutes: number };
}

export type MetricRange = "1h" | "6h" | "24h" | "7d" | "30d";

export interface SeriesPoint {
  t: string; // ISO bucket start
  cpu: number | null;
  mem: number | null;
  disk: number | null;
  load1: number | null;
}

export interface HostDetailResponse {
  host: {
    hostname: string;
    label: string | null;
    provider: string | null;
    ip: string | null;
    lat: number | null;
    lon: number | null;
    city: string | null;
    country: string | null;
    firstSeen: string;
    status: HostStatus;
    secondsAgo: number;
    latest: {
      cpuPct: number;
      memPct: number;
      diskPct: number;
      memUsedKb: number;
      memTotalKb: number;
      diskFreeKb: number;
      diskTotalKb: number;
      load1: number | null;
      load5: number | null;
      load15: number | null;
      uptimeS: number | null;
    } | null;
  };
  range: MetricRange;
  series: SeriesPoint[];
}
