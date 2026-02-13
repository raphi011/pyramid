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
