import postgres from "postgres";

/** Accepts both a root connection and a transaction handle. */
export type Sql = postgres.Sql | postgres.TransactionSql;

// Cache the connection on globalThis to survive Next.js HMR in development.
// Without this, every hot-reload creates a new pool (10 connections each),
// quickly exhausting PostgreSQL's max_connections limit.
// Note: after a DB restart (e.g. docker-compose down/up), restart the dev server
// to replace the stale cached connection.
const globalForDb = globalThis as unknown as { sql: postgres.Sql | undefined };

function createSql(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "See CLAUDE.md for local database setup instructions.",
    );
  }
  return postgres(url, { max: 10, idle_timeout: 20 });
}

const sql = globalForDb.sql ?? createSql();

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export { sql };
