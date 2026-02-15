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
        memberCount: 0,
        activeSeasonCount: 0,
        openChallengeCount: 0,
      });
    });
  });

  it("counts members, active seasons, and open challenges correctly", async () => {
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

      // Match in ended season (excluded — openChallengeCount only counts active seasons)
      await seedMatch(tx, endedSeason, t5, t6, { status: "challenged" });

      const stats = await getClubStats(tx, clubId);
      expect(stats).toEqual({
        memberCount: 3,
        activeSeasonCount: 2,
        openChallengeCount: 2, // only active seasons counted
      });
    });
  });

  it("counts members scoped to club (cross-club isolation)", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx, { name: "Club A" });
      const club2 = await seedClub(tx, { name: "Club B" });

      const p1 = await seedPlayer(
        tx,
        "cross-p1@example.com",
        "Shared",
        "Player",
      );
      const p2 = await seedPlayer(tx, "cross-p2@example.com", "Only", "A");
      const p3 = await seedPlayer(tx, "cross-p3@example.com", "Only", "B");

      // p1 is member of both clubs
      await seedClubMember(tx, p1, club1);
      await seedClubMember(tx, p2, club1);
      await seedClubMember(tx, p1, club2);
      await seedClubMember(tx, p3, club2);

      const stats1 = await getClubStats(tx, club1);
      const stats2 = await getClubStats(tx, club2);

      expect(stats1.memberCount).toBe(2);
      expect(stats2.memberCount).toBe(2);
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

  it("returns season with correct team count, open challenges, and overdue matches", async () => {
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

      // Standings with 3 teams (no longer used for teamCount, but kept for completeness)
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
        teamCount: 3,
        openChallengeCount: 2, // recent + overdue
        overdueMatchCount: 1, // only the 30-day-old one
      });
    });
  });

  it("counts teams from teams table (works without standings)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "No Standings Club" });

      const p1 = await seedPlayer(tx, "ns-p1@example.com", "Ann", "A");
      const p2 = await seedPlayer(tx, "ns-p2@example.com", "Ben", "B");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const seasonId = await seedSeason(tx, clubId, {
        name: "New Season",
        status: "active",
      });

      // Teams enrolled but no standings snapshot yet
      await seedTeam(tx, seasonId, [p1]);
      await seedTeam(tx, seasonId, [p2]);

      const seasons = await getActiveSeasonsWithStats(tx, clubId);
      expect(seasons).toHaveLength(1);
      expect(seasons[0].teamCount).toBe(2);
    });
  });

  it("excludes opted-out teams from teamCount", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Opted Out Club" });

      const p1 = await seedPlayer(tx, "opt-p1@example.com", "Cara", "C");
      const p2 = await seedPlayer(tx, "opt-p2@example.com", "Dina", "D");
      const p3 = await seedPlayer(tx, "opt-p3@example.com", "Eli", "E");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);

      const seasonId = await seedSeason(tx, clubId, { status: "active" });
      await seedTeam(tx, seasonId, [p1]);
      await seedTeam(tx, seasonId, [p2]);
      await seedTeam(tx, seasonId, [p3], { optedOut: true });

      const seasons = await getActiveSeasonsWithStats(tx, clubId);
      expect(seasons[0].teamCount).toBe(2);
    });
  });

  it("respects custom match_deadline_days for overdue count", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Custom Deadline Club" });

      const p1 = await seedPlayer(tx, "dl-p1@example.com", "Fay", "F");
      const p2 = await seedPlayer(tx, "dl-p2@example.com", "Gil", "G");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      // Season with 7-day deadline
      const shortDeadline = await seedSeason(tx, clubId, {
        name: "Short",
        status: "active",
        matchDeadlineDays: 7,
      });
      // Season with 21-day deadline
      const longDeadline = await seedSeason(tx, clubId, {
        name: "Long",
        status: "active",
        matchDeadlineDays: 21,
      });

      const st1 = await seedTeam(tx, shortDeadline, [p1]);
      const st2 = await seedTeam(tx, shortDeadline, [p2]);
      const lt1 = await seedTeam(tx, longDeadline, [p1]);
      const lt2 = await seedTeam(tx, longDeadline, [p2]);

      // Match created 10 days ago — overdue in 7-day season, not in 21-day
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await seedMatch(tx, shortDeadline, st1, st2, {
        status: "challenged",
        created: tenDaysAgo,
      });
      await seedMatch(tx, longDeadline, lt1, lt2, {
        status: "challenged",
        created: tenDaysAgo,
      });

      const seasons = await getActiveSeasonsWithStats(tx, clubId);
      const short = seasons.find((s) => s.name === "Short")!;
      const long = seasons.find((s) => s.name === "Long")!;

      expect(short.overdueMatchCount).toBe(1);
      expect(long.overdueMatchCount).toBe(0);
    });
  });

  it("isolates seasons by club", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx, { name: "Iso Club A" });
      const club2 = await seedClub(tx, { name: "Iso Club B" });

      const p1 = await seedPlayer(tx, "iso-p1@example.com", "Hana", "H");
      await seedClubMember(tx, p1, club1);
      await seedClubMember(tx, p1, club2);

      await seedSeason(tx, club1, { name: "Club A Season", status: "active" });
      await seedSeason(tx, club2, { name: "Club B Season", status: "active" });

      const seasons1 = await getActiveSeasonsWithStats(tx, club1);
      const seasons2 = await getActiveSeasonsWithStats(tx, club2);

      expect(seasons1).toHaveLength(1);
      expect(seasons1[0].name).toBe("Club A Season");
      expect(seasons2).toHaveLength(1);
      expect(seasons2[0].name).toBe("Club B Season");
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

  it("returns overdue match with correct team names and days overdue", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Overdue Club" });
      const p1 = await seedPlayer(tx, "over-p1@example.com", "Iris", "I");
      const p2 = await seedPlayer(tx, "over-p2@example.com", "Jack", "J");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      // Default deadline is 14 days
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
        team1Name: "Iris I",
        team2Name: "Jack J",
        daysOverdue: expect.any(Number),
      });
      // 20 days created - 14 day deadline = ~6 days overdue
      expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(5);
      expect(overdue[0].daysOverdue).toBeLessThanOrEqual(7);
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

  it("returns exactly 1 row for doubles team matches (no cartesian product)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Doubles Club" });

      const p1 = await seedPlayer(tx, "dbl-p1@example.com", "Amy", "A");
      const p2 = await seedPlayer(tx, "dbl-p2@example.com", "Beth", "B");
      const p3 = await seedPlayer(tx, "dbl-p3@example.com", "Carl", "C");
      const p4 = await seedPlayer(tx, "dbl-p4@example.com", "Dave", "D");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);
      await seedClubMember(tx, p4, clubId);

      const seasonId = await seedSeason(tx, clubId, {
        status: "active",
        minTeamSize: 2,
        maxTeamSize: 2,
      });

      // Two 2-player teams
      const team1 = await seedTeam(tx, seasonId, [p1, p2]);
      const team2 = await seedTeam(tx, seasonId, [p3, p4]);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await seedMatch(tx, seasonId, team1, team2, {
        status: "challenged",
        created: thirtyDaysAgo,
      });

      const overdue = await getOverdueMatches(tx, clubId);
      // Must be exactly 1, not 4 (which would happen with cartesian JOIN)
      expect(overdue).toHaveLength(1);
    });
  });

  it("respects custom match_deadline_days", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Custom Deadline Club" });

      const p1 = await seedPlayer(tx, "cdl-p1@example.com", "Nora", "N");
      const p2 = await seedPlayer(tx, "cdl-p2@example.com", "Oscar", "O");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      // 7-day deadline
      const seasonId = await seedSeason(tx, clubId, {
        status: "active",
        matchDeadlineDays: 7,
      });
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // Match created 10 days ago — overdue with 7-day deadline
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
        created: tenDaysAgo,
      });

      const overdue = await getOverdueMatches(tx, clubId);
      expect(overdue).toHaveLength(1);
      // 10 days - 7 day deadline = ~3 days overdue
      expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(2);
      expect(overdue[0].daysOverdue).toBeLessThanOrEqual(4);
    });
  });
});
