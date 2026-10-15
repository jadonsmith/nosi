import "server-only";

function bool(v: string | undefined, def: boolean): boolean {
  if (v == null || v === "") return def;
  return /^(1|true|yes|on)$/i.test(v.trim());
}

function num(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
  ingestToken: process.env.INGEST_TOKEN?.trim() ?? "",
  adminPassword: process.env.ADMIN_PASSWORD?.trim() ?? "",
  sessionSecret:
    process.env.SESSION_SECRET?.trim() ||
    "insecure-dev-secret-change-me-0000000000000000",
  staleMinutes: num(process.env.NOSI_STALE_MINUTES, 2),
  downMinutes: num(process.env.NOSI_DOWN_MINUTES, 10),
  geolocate: bool(process.env.NOSI_GEOLOCATE, true),
  isProd: process.env.NODE_ENV === "production",
};
