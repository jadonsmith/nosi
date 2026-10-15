/**
 * Populate the database with a fleet of demo hosts and a few hours of
 * heartbeats so every view has something to show. Safe to re-run: it
 * clears the demo hosts first.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
import { inArray } from "drizzle-orm";
import { hosts, heartbeats } from "../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

interface DemoHost {
  hostname: string;
  provider: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  memTotalKb: number;
  diskTotalKb: number;
  baseCpu: number;
  baseMem: number; // fraction used 0..1
  baseDisk: number; // fraction used 0..1
}

const FLEET: DemoHost[] = [
  { hostname: "digitalocean-vm1.jadon.me", provider: "DigitalOcean", lat: 40.71, lon: -74.0, city: "New York", country: "United States", memTotalKb: 1_003_520, diskTotalKb: 26_214_400, baseCpu: 6, baseMem: 0.29, baseDisk: 0.73 },
  { hostname: "google-vm1.jadon.me", provider: "Google Cloud", lat: 37.42, lon: -122.08, city: "Mountain View", country: "United States", memTotalKb: 2_006_016, diskTotalKb: 31_457_280, baseCpu: 3, baseMem: 0.16, baseDisk: 0.19 },
  { hostname: "oracle-vm1.jadon.me", provider: "Oracle Cloud", lat: 51.51, lon: -0.13, city: "London", country: "United Kingdom", memTotalKb: 8_069_120, diskTotalKb: 49_283_072, baseCpu: 4, baseMem: 0.43, baseDisk: 0.29 },
  { hostname: "oracle-vm2.jadon.me", provider: "Oracle Cloud", lat: 50.11, lon: 8.68, city: "Frankfurt", country: "Germany", memTotalKb: 8_069_120, diskTotalKb: 49_283_072, baseCpu: 12, baseMem: 0.32, baseDisk: 0.41 },
  { hostname: "oracle-arm1.jadon.me", provider: "Oracle Cloud", lat: 1.35, lon: 103.82, city: "Singapore", country: "Singapore", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, baseCpu: 5, baseMem: 0.05, baseDisk: 0.18 },
  { hostname: "oracle-arm2.jadon.me", provider: "Oracle Cloud", lat: 35.68, lon: 139.69, city: "Tokyo", country: "Japan", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, baseCpu: 4, baseMem: 0.04, baseDisk: 0.18 },
  { hostname: "oracle-arm3.jadon.me", provider: "Oracle Cloud", lat: -33.87, lon: 151.21, city: "Sydney", country: "Australia", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, baseCpu: 3, baseMem: 0.03, baseDisk: 0.18 },
  { hostname: "oracle-arm4.jadon.me", provider: "Oracle Cloud", lat: 19.08, lon: 72.88, city: "Mumbai", country: "India", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, baseCpu: 4, baseMem: 0.04, baseDisk: 0.19 },
];

const HOURS = 4;
const STEP_SECONDS = 60;

function jitter(base: number, spread: number, min = 0, max = Infinity): number {
  return Math.min(max, Math.max(min, base + (Math.random() - 0.5) * spread));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function connect(): Promise<{ db: any; close: () => Promise<unknown> }> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { max: 1 });
    return { db: drizzle(client), close: () => client.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = await PGlite.create({
    dataDir: process.env.NOSI_PGLITE_DIR || ".pglite",
  });
  return { db: drizzle(client), close: () => client.close() };
}

async function main() {
  const { db, close } = await connect();

  const names = FLEET.map((h) => h.hostname);
  await db.delete(hosts).where(inArray(hosts.hostname, names));

  const now = Date.now();
  let totalBeats = 0;

  for (const h of FLEET) {
    const firstSeen = new Date(now - HOURS * 3600_000);
    const [host] = await db
      .insert(hosts)
      .values({
        hostname: h.hostname,
        provider: h.provider,
        lat: h.lat,
        lon: h.lon,
        city: h.city,
        country: h.country,
        firstSeen,
        lastSeen: new Date(now),
      })
      .returning();

    const beats: (typeof heartbeats.$inferInsert)[] = [];
    let cpu = h.baseCpu;
    let memFrac = h.baseMem;

    for (let s = HOURS * 3600; s >= 0; s -= STEP_SECONDS) {
      cpu = jitter(cpu * 0.7 + h.baseCpu * 0.3, 14, 0.2, 99);
      if (Math.random() < 0.04) cpu = jitter(45, 40, 5, 99); // occasional spike
      memFrac = jitter(memFrac * 0.9 + h.baseMem * 0.1, 0.03, 0.02, 0.97);
      const diskNow = jitter(h.baseDisk, 0.004, 0.05, 0.98);
      const ts = new Date(now - s * 1000);
      beats.push({
        hostId: host.id,
        ts,
        agentTs: ts,
        cpuPct: Number(cpu.toFixed(1)),
        memTotalKb: h.memTotalKb,
        memUsedKb: Math.round(h.memTotalKb * memFrac),
        diskTotalKb: h.diskTotalKb,
        diskFreeKb: Math.round(h.diskTotalKb * (1 - diskNow)),
        load1: Number(jitter(cpu / 100, 0.2, 0, 8).toFixed(2)),
        load5: Number(jitter(cpu / 110, 0.15, 0, 8).toFixed(2)),
        load15: Number(jitter(cpu / 120, 0.1, 0, 8).toFixed(2)),
        uptimeS:
          3600 * 24 * (3 + Math.floor(Math.random() * 40)) +
          (HOURS * 3600 - s),
      });
    }

    for (let i = 0; i < beats.length; i += 200) {
      await db.insert(heartbeats).values(beats.slice(i, i + 200));
    }
    totalBeats += beats.length;
    console.log(`  ${h.hostname}: ${beats.length} heartbeats`);
  }

  await close();
  console.log(`seeded ${FLEET.length} hosts, ${totalBeats} heartbeats`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
