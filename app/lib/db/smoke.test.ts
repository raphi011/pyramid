import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";

const db = withTestDb();

afterAll(async () => {
  await db.cleanup();
});

describe("database smoke test", () => {
  it("connects to the database", async () => {
    const [{ result }] = await db.sql`SELECT 1 as result`;
    expect(result).toBe(1);
  });

  it("has all 15 app tables", async () => {
    const tables = await db.sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tableNames = tables.map((t) => t.table_name);

    expect(tableNames).toContain("clubs");
    expect(tableNames).toContain("player");
    expect(tableNames).toContain("club_members");
    expect(tableNames).toContain("seasons");
    expect(tableNames).toContain("teams");
    expect(tableNames).toContain("team_players");
    expect(tableNames).toContain("season_matches");
    expect(tableNames).toContain("match_comments");
    expect(tableNames).toContain("date_proposals");
    expect(tableNames).toContain("season_standings");
    expect(tableNames).toContain("events");
    expect(tableNames).toContain("event_reads");
    expect(tableNames).toContain("notification_preferences");
    expect(tableNames).toContain("magic_links");
    expect(tableNames).toContain("sessions");
  });
});

describe("transaction isolation", () => {
  it("rolls back inserts after test", async () => {
    await db.withinTransaction(async (tx) => {
      await tx`
        INSERT INTO player (name, email_address, created)
        VALUES ('Test Player', 'isolation-test@example.com', NOW())
      `;
      const [row] = await tx`
        SELECT name FROM player WHERE email_address = 'isolation-test@example.com'
      `;
      expect(row.name).toBe("Test Player");
    });

    // Verify it was rolled back
    const rows = await db.sql`
      SELECT * FROM player WHERE email_address = 'isolation-test@example.com'
    `;
    expect(rows).toHaveLength(0);
  });
});
