/**
 * Simulate live agents by POSTing a fresh heartbeat for every demo host
 * every 15s. Point it at a running NOSI instance to watch the dashboard
 * update in real time.
 *
 *   npm run demo:agents
 *   NOSI_URL=http://localhost:3000 INGEST_TOKEN=... npm run demo:agents
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const URL_BASE = process.env.NOSI_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const TOKEN = process.env.INGEST_TOKEN?.trim() ?? "dev-ingest-token-change-me";
const INTERVAL_MS = Number(process.env.DEMO_INTERVAL_MS ?? 15000);

const HOSTS = [
  { host: "digitalocean-vm1.jadon.me", memTotalKb: 1_003_520, diskTotalKb: 26_214_400, cpu: 6, mem: 0.29, disk: 0.73 },
  { host: "google-vm1.jadon.me", memTotalKb: 2_006_016, diskTotalKb: 31_457_280, cpu: 3, mem: 0.16, disk: 0.19 },
  { host: "oracle-vm1.jadon.me", memTotalKb: 8_069_120, diskTotalKb: 49_283_072, cpu: 4, mem: 0.43, disk: 0.29 },
  { host: "oracle-vm2.jadon.me", memTotalKb: 8_069_120, diskTotalKb: 49_283_072, cpu: 12, mem: 0.32, disk: 0.41 },
  { host: "oracle-arm1.jadon.me", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, cpu: 5, mem: 0.05, disk: 0.18 },
  { host: "oracle-arm2.jadon.me", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, cpu: 4, mem: 0.04, disk: 0.18 },
  { host: "oracle-arm3.jadon.me", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, cpu: 3, mem: 0.03, disk: 0.18 },
  { host: "oracle-arm4.jadon.me", memTotalKb: 24_641_536, diskTotalKb: 51_380_224, cpu: 4, mem: 0.04, disk: 0.19 },
];

const wobble = (b: number, s: number, lo = 0, hi = 100) =>
  Math.min(hi, Math.max(lo, b + (Math.random() - 0.5) * s));

async function tick() {
  const stamp = new Date().toLocaleTimeString();
  const results = await Promise.allSettled(
    HOSTS.map(async (h) => {
      const cpu = Number(wobble(h.cpu, 20, 0.3, 99).toFixed(1));
      const memUsed = Math.round(h.memTotalKb * wobble(h.mem, 0.06, 0.02, 0.95));
      const diskFree = Math.round(h.diskTotalKb * (1 - wobble(h.disk, 0.01, 0.05, 0.97)));
      const res = await fetch(`${URL_BASE}/api/report`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          host: h.host,
          time: Math.floor(Date.now() / 1000),
          cpu_pct: cpu,
          mem_total_kb: h.memTotalKb,
          mem_used_kb: memUsed,
          disk_total_kb: h.diskTotalKb,
          disk_free_kb: diskFree,
          load1: Number((cpu / 100).toFixed(2)),
          load5: Number((cpu / 110).toFixed(2)),
          load15: Number((cpu / 120).toFixed(2)),
          uptime_s: 86400 * 7 + Math.floor(Date.now() / 1000) % 100000,
        }),
      });
      if (!res.ok) throw new Error(`${h.host} -> ${res.status}`);
    }),
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected");
  console.log(`[${stamp}] ${ok}/${HOSTS.length} heartbeats sent`);
  for (const f of failed) console.warn("   ", (f as PromiseRejectedResult).reason?.message ?? f);
}

console.log(`demo agents -> ${URL_BASE}/api/report every ${INTERVAL_MS / 1000}s`);
tick();
setInterval(tick, INTERVAL_MS);
