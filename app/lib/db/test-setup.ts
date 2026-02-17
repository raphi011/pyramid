// Set DATABASE_URL before any module that imports env.ts is resolved.
// Must be at the top — vitest runs setupFiles before test module loading.
process.env.DATABASE_URL ??=
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

import { beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { DATABASE_URL } from "./test-helpers";

const sql = postgres(DATABASE_URL);

beforeAll(async () => {
  try {
    const [{ result }] = await sql`SELECT 1 as result`;
    if (result !== 1) {
      throw new Error("Unexpected result from SELECT 1");
    }
  } catch (err) {
    throw new Error(
      "Database not reachable. Run: docker compose up -d && bun run db:migrate\n" +
        `Cause: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
});

afterAll(async () => {
  await sql.end();
});
