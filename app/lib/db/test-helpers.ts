import postgres from "postgres";
// Ensures TransactionSql module augmentation is in compilation scope (see app/lib/db.ts)
import type { Sql as _Sql } from "../db";

export const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

/**
 * Creates a test database context with transaction-based isolation.
 *
 * Usage:
 *   const db = withTestDb();
 *   afterAll(() => db.cleanup());
 *
 *   it("does something", async () => {
 *     await db.withinTransaction(async (tx) => {
 *       await tx`INSERT INTO player ...`;
 *       const rows = await tx`SELECT ...`;
 *       expect(rows).toHaveLength(1);
 *     });
 *     // Transaction rolled back — no data leaks
 *   });
 */
export function withTestDb() {
  const sql = postgres(DATABASE_URL);

  return {
    sql,
    async cleanup() {
      await sql.end();
    },
    /**
     * Runs a function within a transaction that always rolls back.
     * Data inserted inside is visible within the callback but gone after.
     */
    async withinTransaction<T>(
      fn: (tx: postgres.TransactionSql) => Promise<T>,
    ): Promise<T> {
      let result: T | undefined;
      let called = false;
      try {
        await sql.begin("READ WRITE", async (tx) => {
          result = await fn(tx);
          called = true;
          throw new RollbackError();
        });
      } catch (e) {
        if (!(e instanceof RollbackError)) throw e;
      }
      if (!called) {
        throw new Error(
          "withinTransaction: callback never executed — transaction may not have started",
        );
      }
      return result as T;
    },
  };
}

class RollbackError extends Error {
  constructor() {
    super("ROLLBACK");
  }
}
