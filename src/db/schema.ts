import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  bigserial,
  real,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

/** One row per monitored machine. Auto-created on first heartbeat. */
export const hosts = pgTable("hosts", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostname: text("hostname").notNull().unique(),
  label: text("label"),
  provider: text("provider"),
  ip: text("ip"),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  city: text("city"),
  country: text("country"),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
});

/** Time-series of resource samples reported by the agent. */
export const heartbeats = pgTable(
  "heartbeats",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => hosts.id, { onDelete: "cascade" }),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    agentTs: timestamp("agent_ts", { withTimezone: true }),
    cpuPct: real("cpu_pct").notNull(),
    memTotalKb: bigint("mem_total_kb", { mode: "number" }).notNull(),
    memUsedKb: bigint("mem_used_kb", { mode: "number" }).notNull(),
    diskTotalKb: bigint("disk_total_kb", { mode: "number" }).notNull(),
    diskFreeKb: bigint("disk_free_kb", { mode: "number" }).notNull(),
    load1: real("load1"),
    load5: real("load5"),
    load15: real("load15"),
    uptimeS: bigint("uptime_s", { mode: "number" }),
  },
  (t) => [
    index("heartbeats_host_ts_idx").on(t.hostId, t.ts.desc()),
    index("heartbeats_ts_idx").on(t.ts.desc()),
  ],
);

export type Host = typeof hosts.$inferSelect;
export type Heartbeat = typeof heartbeats.$inferSelect;
