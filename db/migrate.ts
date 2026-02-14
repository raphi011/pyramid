import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
// Ensures TransactionSql module augmentation is in compilation scope (see app/lib/db.ts)
import type { Sql as _Sql } from "../app/lib/db";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sql`SELECT filename FROM schema_migrations`;
  return new Set(rows.map((r) => r.filename));
}

async function reset() {
  console.log("Resetting database...");
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("Schema dropped and recreated.");
}

async function migrate() {
  const isReset = process.argv.includes("--reset");

  if (isReset) {
    await reset();
  }

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    console.log(`Applying: ${file}`);
    const filePath = join(migrationsDir, file);
    const content = await readFile(filePath, "utf-8");

    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      });
    } catch (err) {
      throw new Error(
        `Migration ${file} failed (transaction rolled back). ` +
          `${count} migration(s) applied before this failure.\n` +
          `Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    count++;
  }

  if (count === 0) {
    console.log("No new migrations to apply.");
  } else {
    console.log(`Applied ${count} migration(s).`);
  }
}

migrate()
  .catch((err) => {
    if (
      err instanceof Error &&
      (err.message.includes("ECONNREFUSED") ||
        err.message.includes("ENOTFOUND"))
    ) {
      console.error(
        "Migration failed: Cannot connect to database.\n" +
          "Is Postgres running? Try: docker compose up -d",
      );
    } else {
      console.error("Migration failed:", err);
    }
    process.exitCode = 1;
  })
  .finally(() => sql.end());
