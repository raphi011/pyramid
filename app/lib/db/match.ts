import { cache } from "react";
import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type MatchStatus =
  | "challenged"
  | "date_set"
  | "pending_confirmation"
  | "completed"
  | "withdrawn"
  | "forfeited"
  | "disputed";

export type Match = {
  id: number;
  seasonId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  winnerTeamId: number | null;
  team1Score: number[] | null;
  team2Score: number[] | null;
  status: MatchStatus;
  challengeText: string;
  created: Date;
};

export type MatchDetail = Match & {
  gameAt: Date | null;
  resultEnteredBy: number | null;
  resultEnteredAt: Date | null;
  confirmedBy: number | null;
  team1PlayerId: number;
  team2PlayerId: number;
  seasonBestOf: number;
  clubId: number;
};

export type DateProposal = {
  id: number;
  matchId: number;
  proposedBy: number;
  proposedByName: string;
  proposedDatetime: Date;
  status: string;
  created: Date;
};

export type HeadToHeadRecord = {
  opponentTeamId: number;
  opponentName: string;
  wins: number;
  losses: number;
};

export type MatchComment = {
  id: number;
  matchId: number;
  playerId: number;
  playerName: string;
  comment: string;
  created: Date;
  editedAt: Date | null;
};

// ── Errors ─────────────────────────────────────────────

export class ChallengeConflictError extends Error {
  constructor(teamId: number) {
    super(`Team ${teamId} already has an open challenge`);
    this.name = "ChallengeConflictError";
  }
}

// ── Shared SQL fragments ───────────────────────────────

const MATCH_SELECT = `
  sm.id,
  sm.season_id AS "seasonId",
  sm.team1_id AS "team1Id",
  sm.team2_id AS "team2Id",
  p1.name AS "team1Name",
  p2.name AS "team2Name",
  sm.winner_team_id AS "winnerTeamId",
  sm.team1_score AS "team1Score",
  sm.team2_score AS "team2Score",
  sm.status,
  sm.challenge_text AS "challengeText",
  sm.created
`;

const MATCH_JOIN = `
  FROM season_matches sm
  JOIN teams t1 ON t1.id = sm.team1_id
  JOIN team_players tp1 ON tp1.team_id = t1.id
  JOIN player p1 ON p1.id = tp1.player_id
  JOIN teams t2 ON t2.id = sm.team2_id
  JOIN team_players tp2 ON tp2.team_id = t2.id
  JOIN player p2 ON p2.id = tp2.player_id
`;

function toMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as number,
    seasonId: row.seasonId as number,
    team1Id: row.team1Id as number,
    team2Id: row.team2Id as number,
    team1Name: row.team1Name as string,
    team2Name: row.team2Name as string,
    winnerTeamId: (row.winnerTeamId as number) ?? null,
    team1Score: (row.team1Score as number[]) ?? null,
    team2Score: (row.team2Score as number[]) ?? null,
    status: row.status as MatchStatus,
    challengeText: row.challengeText as string,
    created: row.created as Date,
  };
}

const MATCH_DETAIL_SELECT = `
  ${MATCH_SELECT},
  sm.game_at AS "gameAt",
  sm.result_entered_by AS "resultEnteredBy",
  sm.result_entered_at AS "resultEnteredAt",
  sm.confirmed_by AS "confirmedBy",
  tp1.player_id AS "team1PlayerId",
  tp2.player_id AS "team2PlayerId",
  s.best_of AS "seasonBestOf",
  s.club_id AS "clubId"
`;

const MATCH_DETAIL_JOIN = `
  ${MATCH_JOIN}
  JOIN seasons s ON s.id = sm.season_id
`;

function toMatchDetail(row: Record<string, unknown>): MatchDetail {
  return {
    ...toMatch(row),
    gameAt: (row.gameAt as Date) ?? null,
    resultEnteredBy: (row.resultEnteredBy as number) ?? null,
    resultEnteredAt: (row.resultEnteredAt as Date) ?? null,
    confirmedBy: (row.confirmedBy as number) ?? null,
    team1PlayerId: row.team1PlayerId as number,
    team2PlayerId: row.team2PlayerId as number,
    seasonBestOf: row.seasonBestOf as number,
    clubId: row.clubId as number,
  };
}

// ── Queries ────────────────────────────────────────────

async function queryTeamsWithOpenChallenge(
  sql: Sql,
  seasonId: number,
): Promise<Set<number>> {
  const rows = await sql`
    SELECT team1_id, team2_id
    FROM season_matches
    WHERE season_id = ${seasonId}
      AND status IN ('challenged', 'date_set')
  `;

  const ids = new Set<number>();
  for (const row of rows) {
    ids.add(row.team1_id as number);
    ids.add(row.team2_id as number);
  }
  return ids;
}

// Cached version deduplicates within a single server request (layout + page)
export const getTeamsWithOpenChallenge = cache(queryTeamsWithOpenChallenge);

export async function getUnavailableTeamIds(
  sql: Sql,
  seasonId: number,
): Promise<Set<number>> {
  const rows = await sql`
    SELECT DISTINCT t.id AS team_id
    FROM teams t
    JOIN team_players tp ON tp.team_id = t.id
    JOIN player p ON p.id = tp.player_id
    WHERE t.season_id = ${seasonId}
      AND p.unavailable_from IS NOT NULL
      AND p.unavailable_until IS NOT NULL
      AND p.unavailable_from <= NOW()
      AND p.unavailable_until >= NOW()
  `;

  const ids = new Set<number>();
  for (const row of rows) {
    ids.add(row.team_id as number);
  }
  return ids;
}

export async function createChallenge(
  tx: postgres.TransactionSql,
  seasonId: number,
  clubId: number,
  team1Id: number,
  team2Id: number,
  challengerId: number,
  challengeeId: number,
  challengeText: string,
): Promise<number> {
  // Serialize concurrent challenges for this season
  await tx`SELECT pg_advisory_xact_lock(${seasonId})`;

  // Re-check for open challenges inside the lock
  const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
  if (openTeams.has(team1Id)) {
    throw new ChallengeConflictError(team1Id);
  }
  if (openTeams.has(team2Id)) {
    throw new ChallengeConflictError(team2Id);
  }

  // Insert the match
  const [match] = await tx`
    INSERT INTO season_matches (season_id, team1_id, team2_id, status, challenge_text, created)
    VALUES (${seasonId}, ${team1Id}, ${team2Id}, 'challenged', ${challengeText}, NOW())
    RETURNING id
  `;
  const matchId = match.id as number;

  // Public event: "challenge" (visible in club feed)
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${challengerId}, 'challenge', ${tx.json({})}, NOW())
  `;

  // Personal event: "challenged" (notification for challengee)
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${challengerId}, ${challengeeId}, 'challenged', ${tx.json({})}, NOW())
  `;

  return matchId;
}

export async function getMatchesBySeason(
  sql: Sql,
  seasonId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 ORDER BY sm.created DESC`,
    [seasonId],
  );

  return rows.map(toMatch);
}

export async function getMatchesByTeam(
  sql: Sql,
  seasonId: number,
  teamId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 AND (sm.team1_id = $2 OR sm.team2_id = $2) ORDER BY sm.created DESC`,
    [seasonId, teamId],
  );

  return rows.map(toMatch);
}

export async function getOpenMatches(
  sql: Sql,
  seasonId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 AND sm.status IN ('challenged', 'date_set') ORDER BY sm.created DESC`,
    [seasonId],
  );

  return rows.map(toMatch);
}

export async function getMatchById(
  sql: Sql,
  matchId: number,
): Promise<MatchDetail | null> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_DETAIL_SELECT} ${MATCH_DETAIL_JOIN} WHERE sm.id = $1`,
    [matchId],
  );

  return rows.length > 0 ? toMatchDetail(rows[0]) : null;
}

export async function getDateProposals(
  sql: Sql,
  matchId: number,
): Promise<DateProposal[]> {
  const rows = await sql`
    SELECT
      dp.id,
      dp.match_id AS "matchId",
      dp.proposed_by AS "proposedBy",
      p.name AS "proposedByName",
      dp.proposed_datetime AS "proposedDatetime",
      dp.status,
      dp.created
    FROM date_proposals dp
    JOIN player p ON p.id = dp.proposed_by
    WHERE dp.match_id = ${matchId}
    ORDER BY dp.created ASC
  `;

  return rows.map((row) => ({
    id: row.id as number,
    matchId: row.matchId as number,
    proposedBy: row.proposedBy as number,
    proposedByName: row.proposedByName as string,
    proposedDatetime: row.proposedDatetime as Date,
    status: row.status as string,
    created: row.created as Date,
  }));
}

export async function getMatchComments(
  sql: Sql,
  matchId: number,
): Promise<MatchComment[]> {
  const rows = await sql`
    SELECT
      mc.id,
      mc.match_id AS "matchId",
      mc.player_id AS "playerId",
      p.name AS "playerName",
      mc.comment,
      mc.created,
      mc.edited_at AS "editedAt"
    FROM match_comments mc
    JOIN player p ON p.id = mc.player_id
    WHERE mc.match_id = ${matchId}
    ORDER BY mc.created ASC
  `;

  return rows.map((row) => ({
    id: row.id as number,
    matchId: row.matchId as number,
    playerId: row.playerId as number,
    playerName: row.playerName as string,
    comment: row.comment as string,
    created: row.created as Date,
    editedAt: (row.editedAt as Date) ?? null,
  }));
}

// ── Mutations ─────────────────────────────────────────

export async function createDateProposal(
  tx: postgres.TransactionSql,
  matchId: number,
  clubId: number,
  seasonId: number,
  proposedBy: number,
  opponentPlayerId: number,
  proposedDatetime: Date,
): Promise<number> {
  const [row] = await tx`
    INSERT INTO date_proposals (match_id, proposed_by, proposed_datetime, status, created)
    VALUES (${matchId}, ${proposedBy}, ${proposedDatetime}, 'pending', NOW())
    RETURNING id
  `;

  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${proposedBy}, ${opponentPlayerId}, 'date_proposed', ${tx.json({})}, NOW())
  `;

  return row.id as number;
}

export async function acceptDateProposal(
  tx: postgres.TransactionSql,
  proposalId: number,
  matchId: number,
  clubId: number,
  seasonId: number,
  acceptedBy: number,
  proposerPlayerId: number,
): Promise<void> {
  // Atomically accept the proposal — only if it belongs to this match and is still pending
  const accepted = await tx`
    UPDATE date_proposals SET status = 'accepted'
    WHERE id = ${proposalId} AND match_id = ${matchId} AND status = 'pending'
    RETURNING proposed_datetime
  `;

  if (accepted.length === 0) {
    throw new Error(
      `Proposal ${proposalId} not found, not pending, or does not belong to match ${matchId}`,
    );
  }

  // Dismiss all other pending proposals for this match
  await tx`
    UPDATE date_proposals SET status = 'dismissed'
    WHERE match_id = ${matchId} AND id != ${proposalId} AND status = 'pending'
  `;

  // Update match status and game_at
  await tx`
    UPDATE season_matches
    SET status = 'date_set', game_at = ${accepted[0].proposed_datetime}
    WHERE id = ${matchId}
      AND status IN ('challenged', 'date_set')
  `;

  // Create personal event for the proposer
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${acceptedBy}, ${proposerPlayerId}, 'date_accepted', ${tx.json({})}, NOW())
  `;
}

export async function declineDateProposal(
  tx: postgres.TransactionSql,
  proposalId: number,
  matchId: number,
): Promise<void> {
  const result = await tx`
    UPDATE date_proposals SET status = 'declined'
    WHERE id = ${proposalId} AND match_id = ${matchId} AND status = 'pending'
  `;

  if (result.count === 0) {
    throw new Error(
      `Proposal ${proposalId} not found, not pending, or does not belong to match ${matchId}`,
    );
  }
}

export async function enterMatchResult(
  tx: postgres.TransactionSql,
  matchId: number,
  resultEnteredBy: number,
  team1Score: number[],
  team2Score: number[],
  winnerTeamId: number,
  clubId: number,
  seasonId: number,
  opponentPlayerId: number,
): Promise<void> {
  const result = await tx`
    UPDATE season_matches
    SET
      team1_score = ${team1Score},
      team2_score = ${team2Score},
      winner_team_id = ${winnerTeamId},
      result_entered_by = ${resultEnteredBy},
      result_entered_at = NOW(),
      status = 'pending_confirmation'
    WHERE id = ${matchId}
      AND status IN ('challenged', 'date_set')
  `;

  if (result.count === 0) {
    throw new Error(
      `Match ${matchId} could not be updated (status may have changed concurrently)`,
    );
  }

  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${resultEnteredBy}, ${opponentPlayerId}, 'result_entered', ${tx.json({})}, NOW())
  `;
}

export async function confirmMatchResult(
  tx: postgres.TransactionSql,
  matchId: number,
  confirmedBy: number,
  clubId: number,
  seasonId: number,
): Promise<{ winnerTeamId: number; team1Id: number; team2Id: number }> {
  const rows = await tx`
    UPDATE season_matches
    SET status = 'completed', confirmed_by = ${confirmedBy}
    WHERE id = ${matchId}
      AND status = 'pending_confirmation'
    RETURNING winner_team_id AS "winnerTeamId", team1_id AS "team1Id", team2_id AS "team2Id"
  `;

  if (rows.length === 0) {
    throw new Error(
      `Match ${matchId} is not in pending_confirmation status (may have been confirmed already)`,
    );
  }

  const match = rows[0];

  // Public result event
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${confirmedBy}, 'result', ${tx.json({})}, NOW())
  `;

  return {
    winnerTeamId: match.winnerTeamId as number,
    team1Id: match.team1Id as number,
    team2Id: match.team2Id as number,
  };
}

export async function updateStandingsAfterResult(
  tx: postgres.TransactionSql,
  seasonId: number,
  matchId: number,
  winnerTeamId: number,
  loserTeamId: number,
  challengerTeamId: number,
): Promise<void> {
  await tx`SELECT pg_advisory_xact_lock(${seasonId})`;

  const latestRows = await tx`
    SELECT results FROM season_standings
    WHERE season_id = ${seasonId}
    ORDER BY id DESC LIMIT 1
  `;

  const results: number[] =
    latestRows.length > 0 ? [...(latestRows[0].results as number[])] : [];

  // If challenger won, swap positions
  if (winnerTeamId === challengerTeamId) {
    const challengerIdx = results.indexOf(challengerTeamId);
    const challengeeIdx = results.indexOf(loserTeamId);

    if (challengerIdx === -1 || challengeeIdx === -1) {
      throw new Error(
        `Cannot update standings: team not found in rankings (season=${seasonId}, challenger=${challengerTeamId}@${challengerIdx}, loser=${loserTeamId}@${challengeeIdx})`,
      );
    }

    // Remove challenger from current position
    results.splice(challengerIdx, 1);
    // Insert challenger at challengee's position
    results.splice(challengeeIdx, 0, challengerTeamId);
  }

  // Always insert a new snapshot (even if no swap — records the match)
  await tx`
    INSERT INTO season_standings (season_id, match_id, results, created)
    VALUES (${seasonId}, ${matchId}, ${results}, NOW())
  `;
}

// ── Profile queries ─────────────────────────────

export async function getHeadToHeadRecords(
  sql: Sql,
  seasonId: number,
  teamId: number,
): Promise<HeadToHeadRecord[]> {
  const rows = await sql`
    SELECT
      opponent_id AS "opponentTeamId",
      (SELECT p.name FROM team_players tp JOIN player p ON p.id = tp.player_id WHERE tp.team_id = opponent_id LIMIT 1) AS "opponentName",
      SUM(CASE WHEN is_winner THEN 1 ELSE 0 END)::int AS wins,
      SUM(CASE WHEN NOT is_winner THEN 1 ELSE 0 END)::int AS losses
    FROM (
      SELECT
        team2_id AS opponent_id,
        (winner_team_id = team1_id) AS is_winner
      FROM season_matches
      WHERE season_id = ${seasonId} AND team1_id = ${teamId} AND status = 'completed'
      UNION ALL
      SELECT
        team1_id AS opponent_id,
        (winner_team_id = team2_id) AS is_winner
      FROM season_matches
      WHERE season_id = ${seasonId} AND team2_id = ${teamId} AND status = 'completed'
    ) matches
    GROUP BY opponent_id
    ORDER BY (SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) + SUM(CASE WHEN NOT is_winner THEN 1 ELSE 0 END)) DESC
  `;

  return rows.map((row) => ({
    opponentTeamId: row.opponentTeamId as number,
    opponentName: row.opponentName as string,
    wins: row.wins as number,
    losses: row.losses as number,
  }));
}

export async function getRecentMatchesByTeam(
  sql: Sql,
  seasonId: number,
  teamId: number,
  limit = 5,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 AND (sm.team1_id = $2 OR sm.team2_id = $2) ORDER BY sm.created DESC LIMIT $3`,
    [seasonId, teamId, limit],
  );

  return rows.map(toMatch);
}

export async function getAggregatedWinsLosses(
  sql: Sql,
  teamIds: number[],
): Promise<{ wins: number; losses: number }> {
  if (teamIds.length === 0) return { wins: 0, losses: 0 };

  const rows = await sql`
    SELECT
      COALESCE(SUM(wins), 0)::int AS wins,
      COALESCE(SUM(losses), 0)::int AS losses
    FROM (
      SELECT
        team_id,
        COUNT(*) FILTER (WHERE is_winner) AS wins,
        COUNT(*) FILTER (WHERE NOT is_winner) AS losses
      FROM (
        SELECT team1_id AS team_id, (winner_team_id = team1_id) AS is_winner
        FROM season_matches
        WHERE status = 'completed' AND team1_id = ANY(${teamIds})
        UNION ALL
        SELECT team2_id AS team_id, (winner_team_id = team2_id) AS is_winner
        FROM season_matches
        WHERE status = 'completed' AND team2_id = ANY(${teamIds})
      ) matches
      GROUP BY team_id
    ) stats
  `;

  return {
    wins: rows[0].wins as number,
    losses: rows[0].losses as number,
  };
}
