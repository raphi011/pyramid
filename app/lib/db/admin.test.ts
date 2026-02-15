import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedClubMember,
  seedSeason,
  seedTeam,
  seedMatch,
  seedStandings,
} from "./seed";
import {
  getClubStats,
  getActiveSeasonsWithStats,
  getOverdueMatches,
} from "./admin";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getClubStats ──────────────────────────────────────

describe("getClubStats", () => {
  it("returns zeroes for empty club", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Empty Club" });

      const stats = await getClubStats(tx, clubId);
      expect(stats).toEqual({
        playerCount: 0,
        activeSeasonCount: 0,
        openChallengeCount: 0,
      });
    });
  });

  it("counts players, active seasons, and open challenges correctly", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Active Club" });

      // 3 club members
      const p1 = await seedPlayer(tx, "stats-p1@example.com", "Alice", "A");
      const p2 = await seedPlayer(tx, "stats-p2@example.com", "Bob", "B");
      const p3 = await seedPlayer(tx, "stats-p3@example.com", "Carol", "C");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);

      // 2 active seasons, 1 ended (should be excluded)
      const activeSeason1 = await seedSeason(tx, clubId, {
        name: "Active 1",
        status: "active",
      });
      const activeSeason2 = await seedSeason(tx, clubId, {
        name: "Active 2",
        status: "active",
      });
      const endedSeason = await seedSeason(tx, clubId, {
        name: "Ended",
        status: "ended",
      });

      // Teams for matches
      const t1 = await seedTeam(tx, activeSeason1, [p1]);
      const t2 = await seedTeam(tx, activeSeason1, [p2]);
      const t3 = await seedTeam(tx, activeSeason2, [p1]);
      const t4 = await seedTeam(tx, activeSeason2, [p3]);
      const t5 = await seedTeam(tx, endedSeason, [p1]);
      const t6 = await seedTeam(tx, endedSeason, [p2]);

      // Open challenges: 1 "challenged" + 1 "date_set" = 2 open
      await seedMatch(tx, activeSeason1, t1, t2, { status: "challenged" });
      await seedMatch(tx, activeSeason2, t3, t4, { status: "date_set" });

      // Completed match (should be excluded from open count)
      await seedMatch(tx, activeSeason1, t1, t2, {
        status: "completed",
        winnerTeamId: t1,
      });

      // Match in ended season (should still count since query counts all club matches with open status)
      await seedMatch(tx, endedSeason, t5, t6, { status: "challenged" });

      const stats = await getClubStats(tx, clubId);
      expect(stats).toEqual({
        playerCount: 3,
        activeSeasonCount: 2,
        openChallengeCount: 3, // 2 in active seasons + 1 in ended season
      });
    });
  });
});

// ── getActiveSeasonsWithStats ─────────────────────────

describe("getActiveSeasonsWithStats", () => {
  it("returns empty array when no active seasons", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "No Seasons Club" });

      // Add an ended season to verify it's excluded
      await seedSeason(tx, clubId, { name: "Ended", status: "ended" });

      const seasons = await getActiveSeasonsWithStats(tx, clubId);
      expect(seasons).toEqual([]);
    });
  });

  it("returns season with correct player count, open challenges, and overdue matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Stats Club" });

      const p1 = await seedPlayer(tx, "season-p1@example.com", "Dan", "D");
      const p2 = await seedPlayer(tx, "season-p2@example.com", "Eve", "E");
      const p3 = await seedPlayer(tx, "season-p3@example.com", "Frank", "F");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);

      const seasonId = await seedSeason(tx, clubId, {
        name: "Spring 2026",
        status: "active",
      });

      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // Standings with 3 teams
      await seedStandings(tx, seasonId, [t1, t2, t3]);

      // 1 recent open challenge (not overdue)
      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      // 1 overdue challenge (30 days ago, deadline is 14 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await seedMatch(tx, seasonId, t2, t3, {
        status: "challenged",
        created: thirtyDaysAgo,
      });

      // 1 completed match (should be excluded)
      await seedMatch(tx, seasonId, t1, t3, {
        status: "completed",
        winnerTeamId: t1,
      });

      const seasons = await getActiveSeasonsWithStats(tx, clubId);
      expect(seasons).toHaveLength(1);
      expect(seasons[0]).toEqual({
        id: seasonId,
        name: "Spring 2026",
        playerCount: 3,
        openChallengeCount: 2, // recent + overdue
        overdueMatchCount: 1, // only the 30-day-old one
      });
    });
  });
});

// ── getOverdueMatches ─────────────────────────────────

describe("getOverdueMatches", () => {
  it("returns empty array when no overdue matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "No Overdue Club" });
      const p1 = await seedPlayer(tx, "noover-p1@example.com", "Gina", "G");
      const p2 = await seedPlayer(tx, "noover-p2@example.com", "Hank", "H");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const seasonId = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // Recent challenge (not overdue)
      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      const overdue = await getOverdueMatches(tx, clubId);
      expect(overdue).toEqual([]);
    });
  });

  it("returns overdue match with correct player names and day count", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Overdue Club" });
      const p1 = await seedPlayer(tx, "over-p1@example.com", "Iris", "I");
      const p2 = await seedPlayer(tx, "over-p2@example.com", "Jack", "J");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const seasonId = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
        created: twentyDaysAgo,
      });

      const overdue = await getOverdueMatches(tx, clubId);
      expect(overdue).toHaveLength(1);
      expect(overdue[0]).toEqual({
        id: matchId,
        seasonId,
        player1Name: "Iris I",
        player2Name: "Jack J",
        daysSinceCreated: expect.any(Number),
      });
      // Should be approximately 20 days (allow +-1 for clock differences)
      expect(overdue[0].daysSinceCreated).toBeGreaterThanOrEqual(19);
      expect(overdue[0].daysSinceCreated).toBeLessThanOrEqual(21);
    });
  });

  it("does not return recent (non-overdue) matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Mixed Club" });
      const p1 = await seedPlayer(tx, "mix-p1@example.com", "Kate", "K");
      const p2 = await seedPlayer(tx, "mix-p2@example.com", "Leo", "L");
      const p3 = await seedPlayer(tx, "mix-p3@example.com", "Mona", "M");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);

      const seasonId = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // Overdue match (30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const overdueMatchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "date_set",
        created: thirtyDaysAgo,
      });

      // Recent match (not overdue, created just now)
      await seedMatch(tx, seasonId, t2, t3, { status: "challenged" });

      // Completed match (should never appear regardless of age)
      await seedMatch(tx, seasonId, t1, t3, {
        status: "completed",
        winnerTeamId: t1,
        created: thirtyDaysAgo,
      });

      const overdue = await getOverdueMatches(tx, clubId);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe(overdueMatchId);
    });
  });
});
