import postgres from "postgres";

// Cache the connection on globalThis to survive Next.js HMR in development.
// Without this, every hot-reload creates a new pool (10 connections each),
// quickly exhausting PostgreSQL's max_connections limit.
const globalForDb = globalThis as unknown as { sql: postgres.Sql | undefined };

const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export { sql };
