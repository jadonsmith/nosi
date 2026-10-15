/**
 * Apply pending Drizzle migrations to whichever database is configured.
 *   - DATABASE_URL set  -> that Postgres
 *   - DATABASE_URL blank -> embedded PGlite at ./.pglite
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(url, { max: 1 });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: "./drizzle" });
    await client.end();
    console.log("migrations applied to", url.replace(/:[^:@/]+@/, ":****@"));
    return;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = await PGlite.create({
    dataDir: process.env.NOSI_PGLITE_DIR || ".pglite",
  });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.close();
  console.log("migrations applied to embedded PGlite (./.pglite)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
