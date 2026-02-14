import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import { seedPlayer, seedClub, seedSeason, seedTeam, seedMatch } from "./seed";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  createChallenge,
  getMatchesBySeason,
  getMatchesByTeam,
  getOpenMatches,
  ChallengeConflictError,
} from "./match";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getTeamsWithOpenChallenge ────────────────────────

describe("getTeamsWithOpenChallenge", () => {
  it("returns teams with open challenges", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "oc1@example.com");
      const p2 = await seedPlayer(tx, "oc2@example.com");
      const p3 = await seedPlayer(tx, "oc3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams.has(t1)).toBe(true);
      expect(openTeams.has(t2)).toBe(true);
      expect(openTeams.has(t3)).toBe(false);
    });
  });

  it("includes date_set matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ds1@example.com");
      const p2 = await seedPlayer(tx, "ds2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, { status: "date_set" });

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams.has(t1)).toBe(true);
      expect(openTeams.has(t2)).toBe(true);
    });
  });

  it("returns empty set when no open challenges", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "no1@example.com");
      const p2 = await seedPlayer(tx, "no2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, {
        status: "completed",
        winnerTeamId: t1,
      });

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams.size).toBe(0);
    });
  });

  it("scoped to season", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const s1 = await seedSeason(tx, clubId);
      const s2 = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "sc1@example.com");
      const p2 = await seedPlayer(tx, "sc2@example.com");
      const t1 = await seedTeam(tx, s1, [p1]);
      const t2 = await seedTeam(tx, s1, [p2]);
      const t3 = await seedTeam(tx, s2, [p1]);
      const t4 = await seedTeam(tx, s2, [p2]);

      await seedMatch(tx, s1, t1, t2, { status: "challenged" });
      await seedMatch(tx, s2, t3, t4, { status: "challenged" });

      const openTeamsS1 = await getTeamsWithOpenChallenge(tx, s1);
      expect(openTeamsS1.has(t1)).toBe(true);
      expect(openTeamsS1.has(t2)).toBe(true);
      expect(openTeamsS1.has(t3)).toBe(false);
      expect(openTeamsS1.has(t4)).toBe(false);
    });
  });
});

// ── getUnavailableTeamIds ───────────────────────────

describe("getUnavailableTeamIds", () => {
  it("returns teams with currently unavailable players", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ua1@example.com");
      const p2 = await seedPlayer(tx, "ua2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // Mark p1 as currently unavailable
      await tx`
        UPDATE player
        SET unavailable_from = NOW() - INTERVAL '1 day',
            unavailable_until = NOW() + INTERVAL '7 days'
        WHERE id = ${p1}
      `;

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable.has(t1)).toBe(true);
      expect(unavailable.has(t2)).toBe(false);
    });
  });

  it("excludes past unavailability", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "past1@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);

      // Unavailability already ended
      await tx`
        UPDATE player
        SET unavailable_from = NOW() - INTERVAL '14 days',
            unavailable_until = NOW() - INTERVAL '1 day'
        WHERE id = ${p1}
      `;

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable.has(t1)).toBe(false);
    });
  });

  it("returns empty set when no unavailable players", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "avail1@example.com");
      await seedTeam(tx, seasonId, [p1]);

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable.size).toBe(0);
    });
  });
});

// ── createChallenge ─────────────────────────────────

describe("createChallenge", () => {
  it("creates match and events", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ch1@example.com", "Challenger");
      const p2 = await seedPlayer(tx, "ch2@example.com", "Challengee");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await createChallenge(
        tx,
        seasonId,
        clubId,
        t1,
        t2,
        p1,
        p2,
        "Let's play!",
      );

      expect(matchId).toBeGreaterThan(0);

      // Verify match
      const [match] = await tx`
        SELECT * FROM season_matches WHERE id = ${matchId}
      `;
      expect(match.season_id).toBe(seasonId);
      expect(match.team1_id).toBe(t1);
      expect(match.team2_id).toBe(t2);
      expect(match.status).toBe("challenged");
      expect(match.challenge_text).toBe("Let's play!");

      // Verify events
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} ORDER BY id
      `;
      expect(events).toHaveLength(2);

      // Public challenge event
      expect(events[0].event_type).toBe("challenge");
      expect(events[0].player_id).toBe(p1);
      expect(events[0].target_player_id).toBeNull();

      // Personal challenged event
      expect(events[1].event_type).toBe("challenged");
      expect(events[1].player_id).toBe(p1);
      expect(events[1].target_player_id).toBe(p2);
    });
  });

  it("throws ChallengeConflictError if team has open challenge", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "cf1@example.com");
      const p2 = await seedPlayer(tx, "cf2@example.com");
      const p3 = await seedPlayer(tx, "cf3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // t1 challenges t2
      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      // t1 tries to challenge t3 — should fail (t1 already has open challenge)
      await expect(
        createChallenge(tx, seasonId, clubId, t1, t3, p1, p3, ""),
      ).rejects.toThrow(ChallengeConflictError);

      // t3 tries to challenge t2 — should also fail (t2 already has open challenge)
      await expect(
        createChallenge(tx, seasonId, clubId, t3, t2, p3, p2, ""),
      ).rejects.toThrow(ChallengeConflictError);
    });
  });

  it("allows challenge when existing matches are completed", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ok1@example.com");
      const p2 = await seedPlayer(tx, "ok2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // Completed match — should not block
      await seedMatch(tx, seasonId, t1, t2, {
        status: "completed",
        winnerTeamId: t1,
      });

      const matchId = await createChallenge(
        tx,
        seasonId,
        clubId,
        t1,
        t2,
        p1,
        p2,
        "",
      );

      expect(matchId).toBeGreaterThan(0);
    });
  });
});

// ── getMatchesBySeason ──────────────────────────────

describe("getMatchesBySeason", () => {
  it("returns matches with player names", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ms1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "ms2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, {
        status: "completed",
        winnerTeamId: t1,
      });

      const matches = await getMatchesBySeason(tx, seasonId);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(
        expect.objectContaining({
          seasonId,
          team1Id: t1,
          team2Id: t2,
          team1Name: "Alice",
          team2Name: "Bob",
          winnerTeamId: t1,
          status: "completed",
        }),
      );
    });
  });

  it("returns empty array when no matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const matches = await getMatchesBySeason(tx, seasonId);
      expect(matches).toEqual([]);
    });
  });
});

// ── getMatchesByTeam ────────────────────────────────

describe("getMatchesByTeam", () => {
  it("filters to team (as team1 or team2)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "mt1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "mt2@example.com", "Bob");
      const p3 = await seedPlayer(tx, "mt3@example.com", "Charlie");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // t1 vs t2
      await seedMatch(tx, seasonId, t1, t2, {
        status: "completed",
        winnerTeamId: t1,
      });
      // t3 vs t1 (t1 as team2)
      await seedMatch(tx, seasonId, t3, t1, {
        status: "completed",
        winnerTeamId: t1,
      });
      // t2 vs t3 (t1 not involved)
      await seedMatch(tx, seasonId, t2, t3, {
        status: "completed",
        winnerTeamId: t2,
      });

      const matches = await getMatchesByTeam(tx, seasonId, t1);
      expect(matches).toHaveLength(2);

      const teamIds = matches.flatMap((m) => [m.team1Id, m.team2Id]);
      expect(teamIds).toContain(t1);
      // Should not include t2 vs t3 match
      expect(matches.every((m) => m.team1Id === t1 || m.team2Id === t1)).toBe(
        true,
      );
    });
  });
});

// ── getOpenMatches ──────────────────────────────────

describe("getOpenMatches", () => {
  it("returns only challenged and date_set matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "om1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "om2@example.com", "Bob");
      const p3 = await seedPlayer(tx, "om3@example.com", "Charlie");
      const p4 = await seedPlayer(tx, "om4@example.com", "Diana");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);
      const t4 = await seedTeam(tx, seasonId, [p4]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });
      await seedMatch(tx, seasonId, t3, t4, { status: "date_set" });
      // These should NOT appear
      await seedMatch(tx, seasonId, t1, t3, {
        status: "completed",
        winnerTeamId: t1,
      });

      const matches = await getOpenMatches(tx, seasonId);
      expect(matches).toHaveLength(2);
      expect(
        matches.every((m) => ["challenged", "date_set"].includes(m.status)),
      ).toBe(true);
    });
  });
});
