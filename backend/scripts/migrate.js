import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const files = (await readdir(join(root, "migrations"))).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const file of files) {
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE version=$1", [file]);
    if (exists.rowCount) continue;
    const sql = await readFile(join(root, "migrations", file), "utf8");
    await client.query("BEGIN");
    try { await client.query(sql); await client.query("INSERT INTO schema_migrations(version) VALUES($1)", [file]); await client.query("COMMIT"); console.log(`Applied ${file}`); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  }
} finally { await client.end(); }
