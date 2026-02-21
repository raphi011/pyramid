import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedClubMember,
  seedSeason,
  seedTeam,
  seedStandings,
  seedMatch,
} from "./seed";
import {
  getActiveSeasons,
  getSeasonById,
  getSeasonBySlug,
  getSeasonSlug,
  getLatestStandings,
  isPlayerEnrolledInSeason,
  isIndividualSeason,
  enrollPlayerInIndividualSeason,
  addTeamToStandings,
  createNewPlayerEvent,
  autoEnrollInActiveSeasons,
  getStandingsWithPlayers,
  getTeamWinsLosses,
  getPlayerTeamId,
  getRankHistory,
  getPlayerSeasonTeams,
  getSeasonByInviteCode,
  createSeason,
} from "./season";
import { SlugConflictError } from "./errors";
const db = withTestDb();

afterAll(() => db.cleanup());

// ── getActiveSeasons ─────────────────────────────────

describe("getActiveSeasons", () => {
  it("returns active seasons only", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      await seedSeason(tx, clubId, { name: "Active", status: "active" });
      await seedSeason(tx, clubId, { name: "Draft", status: "draft" });
      await seedSeason(tx, clubId, { name: "Ended", status: "ended" });

      const seasons = await getActiveSeasons(tx, clubId);
      expect(seasons).toHaveLength(1);
      expect(seasons[0].name).toBe("Active");
      expect(seasons[0].status).toBe("active");
    });
  });

  it("scoped to club", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx);
      const club2 = await seedClub(tx);
      await seedSeason(tx, club1, { name: "Club1 Season", status: "active" });
      await seedSeason(tx, club2, { name: "Club2 Season", status: "active" });

      const seasons = await getActiveSeasons(tx, club1);
      expect(seasons).toHaveLength(1);
      expect(seasons[0].name).toBe("Club1 Season");
    });
  });

  it("returns empty when no active seasons", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      await seedSeason(tx, clubId, { status: "draft" });

      const seasons = await getActiveSeasons(tx, clubId);
      expect(seasons).toEqual([]);
    });
  });
});

// ── getSeasonById ────────────────────────────────────

describe("getSeasonById", () => {
  it("returns season with all fields", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, {
        name: "Einzel 2025",
        status: "active",
        minTeamSize: 1,
        maxTeamSize: 1,
      });

      const season = await getSeasonById(tx, seasonId);
      expect(season).toEqual(
        expect.objectContaining({
          id: seasonId,
          clubId,
          name: "Einzel 2025",
          status: "active",
          minTeamSize: 1,
          maxTeamSize: 1,
          bestOf: 3,
          matchDeadlineDays: 14,
          reminderAfterDays: 7,
          requiresResultConfirmation: false,
          openEnrollment: true,
        }),
      );
    });
  });

  it("returns openEnrollment false when set", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, {
        openEnrollment: false,
      });

      const season = await getSeasonById(tx, seasonId);
      expect(season!.openEnrollment).toBe(false);
    });
  });

  it("returns null when not found", async () => {
    await db.withinTransaction(async (tx) => {
      const season = await getSeasonById(tx, 999999);
      expect(season).toBeNull();
    });
  });
});

// ── isIndividualSeason ───────────────────────────────

describe("isIndividualSeason", () => {
  it("returns true for individual season (maxTeamSize = 1)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, { maxTeamSize: 1 });
      const season = (await getSeasonById(tx, seasonId))!;
      expect(isIndividualSeason(season)).toBe(true);
    });
  });

  it("returns false for team season (maxTeamSize > 1)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, {
        minTeamSize: 2,
        maxTeamSize: 2,
      });
      const season = (await getSeasonById(tx, seasonId))!;
      expect(isIndividualSeason(season)).toBe(false);
    });
  });
});

// ── getLatestStandings ───────────────────────────────

describe("getLatestStandings", () => {
  it("returns latest standings snapshot", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "s1@example.com");
      const p2 = await seedPlayer(tx, "s2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      await seedStandings(tx, seasonId, [t1, t2]);

      const standings = await getLatestStandings(tx, seasonId);
      expect(standings).not.toBeNull();
      expect(standings!.results).toEqual([t1, t2]);
    });
  });

  it("returns null when no standings exist", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const standings = await getLatestStandings(tx, seasonId);
      expect(standings).toBeNull();
    });
  });

  it("returns most recent after multiple snapshots", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "multi1@example.com");
      const p2 = await seedPlayer(tx, "multi2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // First snapshot: [t1]
      await seedStandings(tx, seasonId, [t1]);
      // Second snapshot: [t1, t2] — this should be "latest"
      await seedStandings(tx, seasonId, [t1, t2]);

      const standings = await getLatestStandings(tx, seasonId);
      expect(standings!.results).toEqual([t1, t2]);
    });
  });
});

// ── isPlayerEnrolledInSeason ─────────────────────────

describe("isPlayerEnrolledInSeason", () => {
  it("returns true when enrolled", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "enrolled@example.com");
      await seedTeam(tx, seasonId, [playerId]);

      expect(await isPlayerEnrolledInSeason(tx, playerId, seasonId)).toBe(true);
    });
  });

  it("returns false when not enrolled", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "notenrolled@example.com");

      expect(await isPlayerEnrolledInSeason(tx, playerId, seasonId)).toBe(
        false,
      );
    });
  });
});

// ── enrollPlayerInIndividualSeason ───────────────────

describe("enrollPlayerInIndividualSeason", () => {
  it("creates team and team_players, returns teamId", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "enroll@example.com");

      const teamId = await enrollPlayerInIndividualSeason(
        tx,
        playerId,
        seasonId,
      );

      expect(teamId).toBeGreaterThan(0);

      // Verify team exists
      const [team] = await tx`SELECT * FROM teams WHERE id = ${teamId}`;
      expect(team.season_id).toBe(seasonId);

      // Verify team_players link
      const [tp] = await tx`
        SELECT * FROM team_players WHERE team_id = ${teamId} AND player_id = ${playerId}
      `;
      expect(tp).toBeDefined();
    });
  });
});

// ── addTeamToStandings ───────────────────────────────

describe("addTeamToStandings", () => {
  it("appends to existing standings", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "at1@example.com");
      const p2 = await seedPlayer(tx, "at2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedStandings(tx, seasonId, [t1]);
      const rank = await addTeamToStandings(tx, seasonId, t2);

      expect(rank).toBe(2);
      const standings = await getLatestStandings(tx, seasonId);
      expect(standings!.results).toEqual([t1, t2]);
    });
  });

  it("creates first standings if none exist", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "first@example.com");
      const teamId = await seedTeam(tx, seasonId, [playerId]);

      const rank = await addTeamToStandings(tx, seasonId, teamId);

      expect(rank).toBe(1);
      const standings = await getLatestStandings(tx, seasonId);
      expect(standings!.results).toEqual([teamId]);
    });
  });

  it("preserves history (old snapshot still exists)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "hist1@example.com");
      const p2 = await seedPlayer(tx, "hist2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedStandings(tx, seasonId, [t1]);
      await addTeamToStandings(tx, seasonId, t2);

      const rows =
        await tx`SELECT results FROM season_standings WHERE season_id = ${seasonId} ORDER BY created ASC`;
      expect(rows).toHaveLength(2);
      expect(rows[0].results).toEqual([t1]);
      expect(rows[1].results).toEqual([t1, t2]);
    });
  });
});

// ── createNewPlayerEvent ─────────────────────────────

describe("createNewPlayerEvent", () => {
  it("creates event with correct type, club, player, and metadata", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "event@example.com", "New Player");

      const eventId = await createNewPlayerEvent(tx, clubId, playerId, {
        playerName: "New Player",
      });

      expect(eventId).toBeGreaterThan(0);

      const [event] = await tx`SELECT * FROM events WHERE id = ${eventId}`;
      expect(event.club_id).toBe(clubId);
      expect(event.player_id).toBe(playerId);
      expect(event.event_type).toBe("new_player");
      expect(event.metadata).toEqual({ playerName: "New Player" });
      expect(event.season_id).toBeNull();
    });
  });

  it("persists seasonId when provided", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(
        tx,
        "event-season@example.com",
        "Season",
        "Player",
      );

      const eventId = await createNewPlayerEvent(
        tx,
        clubId,
        playerId,
        { firstName: "Season", lastName: "Player" },
        seasonId,
      );

      const [event] = await tx`SELECT * FROM events WHERE id = ${eventId}`;
      expect(event.season_id).toBe(seasonId);
    });
  });
});

// ── autoEnrollInActiveSeasons ────────────────────────

describe("autoEnrollInActiveSeasons", () => {
  it("enrolls in all active individual seasons", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "auto@example.com");
      await seedClubMember(tx, playerId, clubId);
      const seasonId = await seedSeason(tx, clubId, {
        name: "Einzel",
        status: "active",
      });

      const enrollments = await autoEnrollInActiveSeasons(tx, playerId, clubId);

      expect(enrollments).toHaveLength(1);
      expect(enrollments[0]).toEqual(
        expect.objectContaining({ seasonId, seasonName: "Einzel" }),
      );
      expect(enrollments[0].teamId).toBeGreaterThan(0);

      // Verify standings were updated
      const standings = await getLatestStandings(tx, seasonId);
      expect(standings!.results).toContain(enrollments[0].teamId);
    });
  });

  it("skips team seasons (maxTeamSize > 1)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "skip-team@example.com");
      await seedClubMember(tx, playerId, clubId);
      await seedSeason(tx, clubId, {
        name: "Doppel",
        status: "active",
        minTeamSize: 2,
        maxTeamSize: 2,
      });

      const enrollments = await autoEnrollInActiveSeasons(tx, playerId, clubId);

      expect(enrollments).toEqual([]);
    });
  });

  it("returns empty when no active seasons", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "no-seasons@example.com");
      await seedClubMember(tx, playerId, clubId);
      await seedSeason(tx, clubId, { status: "draft" });

      const enrollments = await autoEnrollInActiveSeasons(tx, playerId, clubId);

      expect(enrollments).toEqual([]);
    });
  });

  it("skips already-enrolled player (idempotent)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "double@example.com");
      await seedClubMember(tx, playerId, clubId);
      const seasonId = await seedSeason(tx, clubId, {
        name: "Einzel",
        status: "active",
      });

      const first = await autoEnrollInActiveSeasons(tx, playerId, clubId);
      expect(first).toHaveLength(1);

      const second = await autoEnrollInActiveSeasons(tx, playerId, clubId);
      expect(second).toEqual([]);

      // Verify only one team in standings
      const standings = await getLatestStandings(tx, seasonId);
      expect(standings!.results).toHaveLength(1);
    });
  });

  it("enrolls in multiple active individual seasons independently", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "multi-season@example.com");
      await seedClubMember(tx, playerId, clubId);

      const s1 = await seedSeason(tx, clubId, {
        name: "Einzel",
        status: "active",
      });
      const s2 = await seedSeason(tx, clubId, {
        name: "Einzel Sommer",
        status: "active",
      });
      // Also add a team season that should be skipped
      await seedSeason(tx, clubId, {
        name: "Doppel",
        status: "active",
        minTeamSize: 2,
        maxTeamSize: 2,
      });

      const enrollments = await autoEnrollInActiveSeasons(tx, playerId, clubId);

      expect(enrollments).toHaveLength(2);

      const seasonIds = enrollments.map((e) => e.seasonId).sort();
      expect(seasonIds).toEqual([s1, s2].sort());

      // Verify each season has independent standings
      const standings1 = await getLatestStandings(tx, s1);
      const standings2 = await getLatestStandings(tx, s2);

      const team1 = enrollments.find((e) => e.seasonId === s1)!.teamId;
      const team2 = enrollments.find((e) => e.seasonId === s2)!.teamId;

      expect(standings1!.results).toEqual([team1]);
      expect(standings2!.results).toEqual([team2]);

      // Teams should be different
      expect(team1).not.toBe(team2);
    });
  });
});

// ── getStandingsWithPlayers ──────────────────────────

describe("getStandingsWithPlayers", () => {
  it("returns ranked players in standings order", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "sp1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "sp2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      await seedStandings(tx, seasonId, [t1, t2]);

      const { players, previousResults } = await getStandingsWithPlayers(
        tx,
        seasonId,
      );

      expect(players).toHaveLength(2);
      expect(players[0]).toEqual(
        expect.objectContaining({
          teamId: t1,
          playerId: p1,
          firstName: "Alice",
          lastName: "Player",
          rank: 1,
        }),
      );
      expect(players[1]).toEqual(
        expect.objectContaining({
          teamId: t2,
          playerId: p2,
          firstName: "Bob",
          lastName: "Player",
          rank: 2,
        }),
      );
      expect(previousResults).toBeNull();
    });
  });

  it("returns previous standings for movement computation", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "mv1@example.com");
      const p2 = await seedPlayer(tx, "mv2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedStandings(tx, seasonId, [t1, t2]);
      await seedStandings(tx, seasonId, [t2, t1]); // Swapped

      const { players, previousResults } = await getStandingsWithPlayers(
        tx,
        seasonId,
      );

      expect(players[0].teamId).toBe(t2);
      expect(players[1].teamId).toBe(t1);
      expect(previousResults).toEqual([t1, t2]);
    });
  });

  it("returns empty when no standings", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const { players } = await getStandingsWithPlayers(tx, seasonId);
      expect(players).toEqual([]);
    });
  });
});

// ── getTeamWinsLosses ────────────────────────────────

describe("getTeamWinsLosses", () => {
  it("counts wins and losses from completed matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "wl1@example.com");
      const p2 = await seedPlayer(tx, "wl2@example.com");
      const p3 = await seedPlayer(tx, "wl3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // t1 beats t2
      await seedMatch(tx, seasonId, t1, t2, { winnerTeamId: t1 });
      // t1 beats t3
      await seedMatch(tx, seasonId, t1, t3, { winnerTeamId: t1 });
      // t3 beats t2
      await seedMatch(tx, seasonId, t3, t2, { winnerTeamId: t3 });
      // Non-completed match (should not count)
      await seedMatch(tx, seasonId, t2, t3, { status: "challenged" });

      const wl = await getTeamWinsLosses(tx, seasonId);

      expect(wl.get(t1)).toEqual({ wins: 2, losses: 0 });
      expect(wl.get(t2)).toEqual({ wins: 0, losses: 2 });
      expect(wl.get(t3)).toEqual({ wins: 1, losses: 1 });
    });
  });

  it("returns empty map when no matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const wl = await getTeamWinsLosses(tx, seasonId);
      expect(wl.size).toBe(0);
    });
  });

  it("scoped to season (ignores other season matches)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const s1 = await seedSeason(tx, clubId);
      const s2 = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "scope1@example.com");
      const p2 = await seedPlayer(tx, "scope2@example.com");
      const t1 = await seedTeam(tx, s1, [p1]);
      const t2 = await seedTeam(tx, s1, [p2]);
      const t3 = await seedTeam(tx, s2, [p1]);
      const t4 = await seedTeam(tx, s2, [p2]);
      await seedMatch(tx, s1, t1, t2, { winnerTeamId: t1 });
      await seedMatch(tx, s2, t3, t4, { winnerTeamId: t4 });

      const wl = await getTeamWinsLosses(tx, s1);
      expect(wl.size).toBe(2);
      expect(wl.has(t3)).toBe(false);
      expect(wl.has(t4)).toBe(false);
    });
  });
});

// ── getPlayerTeamId ─────────────────────────────────

describe("getPlayerTeamId", () => {
  it("returns team id for enrolled player", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "tid@example.com");
      const teamId = await seedTeam(tx, seasonId, [playerId]);

      const result = await getPlayerTeamId(tx, playerId, seasonId);
      expect(result).toBe(teamId);
    });
  });

  it("returns null when not enrolled", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const playerId = await seedPlayer(tx, "notid@example.com");

      const result = await getPlayerTeamId(tx, playerId, seasonId);
      expect(result).toBeNull();
    });
  });
});

// ── getRankHistory ──────────────────────────────

describe("getRankHistory", () => {
  it("returns chronological rank history", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "rh1@example.com");
      const p2 = await seedPlayer(tx, "rh2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // First snapshot: t1=rank1, t2=rank2
      await seedStandings(tx, seasonId, [t1, t2]);
      // Second snapshot: t2=rank1, t1=rank2 (swapped)
      await seedStandings(tx, seasonId, [t2, t1]);

      const history = await getRankHistory(tx, seasonId, t1);
      expect(history).toHaveLength(2);
      expect(history[0].rank).toBe(1);
      expect(history[1].rank).toBe(2);
      expect(history[0].date).toBeTruthy();
    });
  });

  it("returns empty when no standings", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const history = await getRankHistory(tx, seasonId, 99999);
      expect(history).toEqual([]);
    });
  });
});

// ── getPlayerSeasonTeams ────────────────────────

describe("getPlayerSeasonTeams", () => {
  it("returns all team enrollments for player", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const s1 = await seedSeason(tx, clubId, { name: "Season A" });
      const s2 = await seedSeason(tx, clubId, { name: "Season B" });
      const playerId = await seedPlayer(tx, "pst@example.com");
      const t1 = await seedTeam(tx, s1, [playerId]);
      const t2 = await seedTeam(tx, s2, [playerId]);

      const teams = await getPlayerSeasonTeams(tx, playerId);
      expect(teams).toHaveLength(2);

      const teamIds = teams.map((t) => t.teamId).sort();
      expect(teamIds).toEqual([t1, t2].sort());
    });
  });

  it("filters by club when clubId provided", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx);
      const club2 = await seedClub(tx);
      const s1 = await seedSeason(tx, club1, { name: "Club1 Season" });
      const s2 = await seedSeason(tx, club2, { name: "Club2 Season" });
      const playerId = await seedPlayer(tx, "pst-club@example.com");
      await seedTeam(tx, s1, [playerId]);
      await seedTeam(tx, s2, [playerId]);

      const teams = await getPlayerSeasonTeams(tx, playerId, club1);
      expect(teams).toHaveLength(1);
      expect(teams[0].clubId).toBe(club1);
    });
  });

  it("returns empty when no enrollments", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "pst-none@example.com");
      const teams = await getPlayerSeasonTeams(tx, playerId);
      expect(teams).toEqual([]);
    });
  });
});

// ── getSeasonByInviteCode ────────────────────────

describe("getSeasonByInviteCode", () => {
  it("returns season with club info when invite code matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "My Club" });
      const seasonId = await seedSeason(tx, clubId, {
        name: "Spring 2026",
        inviteCode: "ABC123",
        status: "active",
        openEnrollment: true,
      });
      const result = await getSeasonByInviteCode(tx, "ABC123");
      expect(result).not.toBeNull();
      expect(result!.id).toBe(seasonId);
      expect(result!.name).toBe("Spring 2026");
      expect(result!.clubName).toBe("My Club");
      expect(result!.clubId).toBe(clubId);
    });
  });

  it("returns null for non-existent code", async () => {
    await db.withinTransaction(async (tx) => {
      const result = await getSeasonByInviteCode(tx, "ZZZZZ1");
      expect(result).toBeNull();
    });
  });

  it("returns null for empty invite code", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      await seedSeason(tx, clubId, { inviteCode: "" });
      const result = await getSeasonByInviteCode(tx, "");
      expect(result).toBeNull();
    });
  });
});

// ── getSeasonBySlug ─────────────────────────────────

describe("getSeasonBySlug", () => {
  it("returns season when slug matches within club", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, { name: "Spring 2026" });
      const season = await getSeasonBySlug(tx, clubId, "spring-2026");
      expect(season).toEqual(
        expect.objectContaining({
          id: seasonId,
          name: "Spring 2026",
          slug: "spring-2026",
        }),
      );
    });
  });

  it("returns null when slug not found", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const season = await getSeasonBySlug(tx, clubId, "nonexistent");
      expect(season).toBeNull();
    });
  });

  it("isolates slugs across clubs", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx);
      const club2 = await seedClub(tx);
      const s1 = await seedSeason(tx, club1, { name: "Same Name" });
      await seedSeason(tx, club2, { name: "Same Name" });

      const season = await getSeasonBySlug(tx, club1, "same-name");
      expect(season).not.toBeNull();
      expect(season!.id).toBe(s1);
      expect(season!.clubId).toBe(club1);
    });
  });
});

// ── getSeasonSlug ───────────────────────────────────

describe("getSeasonSlug", () => {
  it("returns slug when season exists", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId, { name: "Slug Season" });
      const slug = await getSeasonSlug(tx, seasonId);
      expect(slug).toBe("slug-season");
    });
  });

  it("returns null when season does not exist", async () => {
    await db.withinTransaction(async (tx) => {
      const slug = await getSeasonSlug(tx, 999999);
      expect(slug).toBeNull();
    });
  });
});

// ── createSeason slug collision ─────────────────────

describe("createSeason", () => {
  it("throws SlugConflictError on duplicate slug within club", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "cs-dup@example.com");
      await seedClubMember(tx, playerId, clubId);

      const baseOpts = {
        name: "Duplicate Season",
        type: "individual" as const,
        teamSize: 1,
        bestOf: 3,
        matchDeadlineDays: 14,
        reminderDays: 7,
        requiresConfirmation: false,
        openEnrollment: true,
        startingRanks: "empty" as const,
      };

      await createSeason(tx, clubId, baseOpts);
      await expect(createSeason(tx, clubId, baseOpts)).rejects.toThrow(
        SlugConflictError,
      );
    });
  });
});
