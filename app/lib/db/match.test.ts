import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedSeason,
  seedTeam,
  seedMatch,
  seedStandings,
  seedDateProposal,
} from "./seed";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  createChallenge,
  getMatchesBySeason,
  getMatchesByTeam,
  getOpenMatches,
  getMatchById,
  getDateProposals,
  createDateProposal,
  acceptDateProposal,
  declineDateProposal,
  enterMatchResult,
  confirmMatchResult,
  updateStandingsAfterResult,
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

// ── getMatchById ──────────────────────────────────

describe("getMatchById", () => {
  it("returns match detail with extra fields", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "md1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "md2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const gameAt = new Date("2026-03-15T10:00:00Z");
      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "date_set",
        gameAt,
      });

      const match = await getMatchById(tx, matchId);
      expect(match).not.toBeNull();
      expect(match!.id).toBe(matchId);
      expect(match!.team1PlayerId).toBe(p1);
      expect(match!.team2PlayerId).toBe(p2);
      expect(match!.seasonBestOf).toBe(3); // default from seedSeason
      expect(match!.clubId).toBe(clubId);
      expect(match!.gameAt).toEqual(gameAt);
      expect(match!.team1Name).toBe("Alice");
      expect(match!.team2Name).toBe("Bob");
    });
  });

  it("returns null for non-existent match", async () => {
    await db.withinTransaction(async (tx) => {
      const match = await getMatchById(tx, 99999);
      expect(match).toBeNull();
    });
  });
});

// ── getDateProposals ──────────────────────────────

describe("getDateProposals", () => {
  it("returns proposals with player names, ordered by created ASC", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "dp1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "dp2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
      });

      await seedDateProposal(tx, matchId, p1, {
        proposedDatetime: new Date("2026-03-01T10:00:00Z"),
        status: "pending",
      });
      await seedDateProposal(tx, matchId, p2, {
        proposedDatetime: new Date("2026-03-02T14:00:00Z"),
        status: "declined",
      });

      const proposals = await getDateProposals(tx, matchId);
      expect(proposals).toHaveLength(2);
      expect(proposals[0].proposedByName).toBe("Alice");
      expect(proposals[0].status).toBe("pending");
      expect(proposals[1].proposedByName).toBe("Bob");
      expect(proposals[1].status).toBe("declined");
    });
  });
});

// ── createDateProposal ────────────────────────────

describe("createDateProposal", () => {
  it("inserts proposal and creates event for opponent", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "cdp1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "cdp2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
      });

      const proposedDatetime = new Date("2026-04-01T09:00:00Z");
      const proposalId = await createDateProposal(
        tx,
        matchId,
        clubId,
        seasonId,
        p1,
        p2,
        proposedDatetime,
      );

      expect(proposalId).toBeGreaterThan(0);

      const proposals = await getDateProposals(tx, matchId);
      expect(proposals).toHaveLength(1);
      expect(proposals[0].proposedBy).toBe(p1);
      expect(proposals[0].proposedDatetime).toEqual(proposedDatetime);

      // Verify event
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} AND event_type = 'date_proposed'
      `;
      expect(events).toHaveLength(1);
      expect(events[0].player_id).toBe(p1);
      expect(events[0].target_player_id).toBe(p2);
    });
  });
});

// ── acceptDateProposal ────────────────────────────

describe("acceptDateProposal", () => {
  it("accepts proposal, dismisses others, sets match status and game_at", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "adp1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "adp2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
      });

      const dt1 = new Date("2026-03-01T10:00:00Z");
      const dt2 = new Date("2026-03-02T14:00:00Z");
      const proposal1 = await seedDateProposal(tx, matchId, p1, {
        proposedDatetime: dt1,
      });
      const proposal2 = await seedDateProposal(tx, matchId, p1, {
        proposedDatetime: dt2,
      });

      // p2 accepts proposal1
      await acceptDateProposal(
        tx,
        proposal1,
        matchId,
        clubId,
        seasonId,
        p2,
        p1,
      );

      // Verify proposal statuses
      const proposals = await getDateProposals(tx, matchId);
      const accepted = proposals.find((p) => p.id === proposal1);
      const dismissed = proposals.find((p) => p.id === proposal2);
      expect(accepted!.status).toBe("accepted");
      expect(dismissed!.status).toBe("dismissed");

      // Verify match updated
      const [match] = await tx`
        SELECT status, game_at FROM season_matches WHERE id = ${matchId}
      `;
      expect(match.status).toBe("date_set");
      expect(match.game_at).toEqual(dt1);

      // Verify event
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} AND event_type = 'date_accepted'
      `;
      expect(events).toHaveLength(1);
      expect(events[0].player_id).toBe(p2);
      expect(events[0].target_player_id).toBe(p1);
    });
  });
});

// ── declineDateProposal ───────────────────────────

describe("declineDateProposal", () => {
  it("sets proposal status to declined", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ddp1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "ddp2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "challenged",
      });

      const proposalId = await seedDateProposal(tx, matchId, p1);

      await declineDateProposal(tx, proposalId);

      const proposals = await getDateProposals(tx, matchId);
      expect(proposals[0].status).toBe("declined");
    });
  });
});

// ── enterMatchResult ──────────────────────────────

describe("enterMatchResult", () => {
  it("sets scores, status, result_entered_by, and creates event", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "emr1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "emr2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "date_set",
      });

      await enterMatchResult(
        tx,
        matchId,
        p1,
        [6, 7],
        [3, 5],
        t1,
        clubId,
        seasonId,
        p2,
      );

      const [match] = await tx`
        SELECT status, team1_score, team2_score, winner_team_id, result_entered_by, result_entered_at
        FROM season_matches WHERE id = ${matchId}
      `;
      expect(match.status).toBe("pending_confirmation");
      expect(match.team1_score).toEqual([6, 7]);
      expect(match.team2_score).toEqual([3, 5]);
      expect(match.winner_team_id).toBe(t1);
      expect(match.result_entered_by).toBe(p1);
      expect(match.result_entered_at).toBeTruthy();

      // Verify event
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} AND event_type = 'result_entered'
      `;
      expect(events).toHaveLength(1);
      expect(events[0].target_player_id).toBe(p2);
    });
  });
});

// ── confirmMatchResult ────────────────────────────

describe("confirmMatchResult", () => {
  it("completes match and creates public result event", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "cmr1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "cmr2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await seedMatch(tx, seasonId, t1, t2, {
        status: "pending_confirmation",
        winnerTeamId: t1,
        resultEnteredBy: p1,
        team1Score: [6, 6],
        team2Score: [3, 4],
      });

      const result = await confirmMatchResult(
        tx,
        matchId,
        p2,
        clubId,
        seasonId,
      );

      expect(result.winnerTeamId).toBe(t1);
      expect(result.team1Id).toBe(t1);
      expect(result.team2Id).toBe(t2);

      const [match] = await tx`
        SELECT status, confirmed_by FROM season_matches WHERE id = ${matchId}
      `;
      expect(match.status).toBe("completed");
      expect(match.confirmed_by).toBe(p2);

      // Verify public event
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} AND event_type = 'result'
      `;
      expect(events).toHaveLength(1);
    });
  });
});

// ── updateStandingsAfterResult ────────────────────

describe("updateStandingsAfterResult", () => {
  it("swaps ranks when challenger wins", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "usr1@example.com");
      const p2 = await seedPlayer(tx, "usr2@example.com");
      const p3 = await seedPlayer(tx, "usr3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // Initial standings: t1=rank1, t2=rank2, t3=rank3
      await seedStandings(tx, seasonId, [t1, t2, t3]);

      // t3 (challenger, rank 3) challenges t2 (rank 2) and wins
      const matchId = await seedMatch(tx, seasonId, t3, t2, {
        status: "completed",
        winnerTeamId: t3,
      });

      await updateStandingsAfterResult(tx, seasonId, matchId, t3, t2, t3);

      // New order: t1, t3, t2 (t3 moved to rank 2)
      const [latest] = await tx`
        SELECT results, match_id FROM season_standings
        WHERE season_id = ${seasonId}
        ORDER BY id DESC LIMIT 1
      `;
      expect(latest.results).toEqual([t1, t3, t2]);
      expect(latest.match_id).toBe(matchId);
    });
  });

  it("records snapshot without swap when challengee wins", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "usr4@example.com");
      const p2 = await seedPlayer(tx, "usr5@example.com");
      const p3 = await seedPlayer(tx, "usr6@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // Initial standings: t1=rank1, t2=rank2, t3=rank3
      await seedStandings(tx, seasonId, [t1, t2, t3]);

      // t3 (challenger) challenges t2, but t2 (challengee) wins
      const matchId = await seedMatch(tx, seasonId, t3, t2, {
        status: "completed",
        winnerTeamId: t2,
      });

      await updateStandingsAfterResult(tx, seasonId, matchId, t2, t3, t3);

      // Order unchanged: t1, t2, t3
      const [latest] = await tx`
        SELECT results, match_id FROM season_standings
        WHERE season_id = ${seasonId}
        ORDER BY id DESC LIMIT 1
      `;
      expect(latest.results).toEqual([t1, t2, t3]);
      expect(latest.match_id).toBe(matchId);
    });
  });
});
