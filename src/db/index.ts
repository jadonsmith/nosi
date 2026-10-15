import "server-only";
import type { SQL } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/lib/env";

export type DB = PostgresJsDatabase<typeof schema>;

// Store the handle on globalThis so every server module graph (RSC layer,
// route handlers, proxy) shares ONE connection. Matters for the dev-only
// PGlite driver, which is single-connection per data directory.
const globalForDb = globalThis as unknown as { __nosiDb?: Promise<DB> };

async function create(): Promise<DB> {
  if (env.databaseUrl) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(env.databaseUrl, { max: 10, prepare: false });
    return drizzle(client, { schema });
  }

  // Local dev / no external Postgres: embedded WASM Postgres persisted to ./.pglite
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = await PGlite.create({
    dataDir: process.env.NOSI_PGLITE_DIR || ".pglite",
    relaxedDurability: true,
  });
  return drizzle(client, { schema }) as unknown as DB;
}

/** Lazily-initialised, process-wide singleton database handle. */
export function getDb(): Promise<DB> {
  if (!globalForDb.__nosiDb) globalForDb.__nosiDb = create();
  return globalForDb.__nosiDb;
}

/**
 * Run a raw SQL query and return plain rows, normalising the shape
 * difference between the postgres-js driver (returns an array) and
 * the PGlite driver (returns `{ rows }`).
 */
export async function rawRows<T = Record<string, unknown>>(
  db: DB,
  query: SQL,
): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  const maybe = res as { rows?: T[] };
  return maybe.rows ?? [];
}
