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
