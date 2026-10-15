import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(url
    ? { dbCredentials: { url } }
    : { driver: "pglite", dbCredentials: { url: ".pglite" } }),
  strict: true,
  verbose: true,
});
