import "server-only";

export interface Geo {
  lat: number;
  lon: number;
  city: string | null;
  country: string | null;
}

/** Best-effort IP geolocation via ip-api.com (no key, ~45 req/min free). */
export async function geolocate(ip: string): Promise<Geo | null> {
  if (!ip || isPrivate(ip)) return null;
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,lat,lon,city,country`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      status?: string;
      lat?: number;
      lon?: number;
      city?: string;
      country?: string;
    };
    if (j.status !== "success" || j.lat == null || j.lon == null) return null;
    return {
      lat: j.lat,
      lon: j.lon,
      city: j.city ?? null,
      country: j.country ?? null,
    };
  } catch {
    return null;
  }
}

function isPrivate(ip: string): boolean {
  return /^(10\.|127\.|0\.|192\.168\.|169\.254\.|::1$|::ffff:|f[cd]|172\.(1[6-9]|2\d|3[01])\.)/i.test(
    ip,
  );
}
