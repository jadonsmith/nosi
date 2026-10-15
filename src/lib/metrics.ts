export type HostStatus = "healthy" | "stale" | "down";

export function statusFromAge(
  secondsAgo: number,
  staleMinutes: number,
  downMinutes: number,
): HostStatus {
  if (secondsAgo >= downMinutes * 60) return "down";
  if (secondsAgo >= staleMinutes * 60) return "stale";
  return "healthy";
}

export const STATUS_LABEL: Record<HostStatus, string> = {
  healthy: "online",
  stale: "stale",
  down: "offline",
};

/** Percent 0..100, clamped, safe against zero/nonsense totals. */
export function pct(used: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

/** "green / amber / red" bucket for a 0..100 usage value. */
export function loadBucket(value: number): "ok" | "warn" | "down" {
  if (value >= 90) return "down";
  if (value >= 70) return "warn";
  return "ok";
}

export function fmtKb(kb: number): string {
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let v = kb;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = v < 10 && i > 0 ? 1 : 0;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function fmtAgo(secondsAgo: number): string {
  if (secondsAgo < 10) return "just now";
  if (secondsAgo < 60) return `${Math.floor(secondsAgo)}s ago`;
  const m = Math.floor(secondsAgo / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const days = Math.floor(h / 24);
  return `${days}d ${h % 24}h ago`;
}
