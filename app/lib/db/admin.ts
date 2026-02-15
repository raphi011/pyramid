import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type ClubStats = {
  playerCount: number;
  activeSeasonCount: number;
  openChallengeCount: number;
};

export type AdminSeasonSummary = {
  id: number;
  name: string;
  playerCount: number;
  openChallengeCount: number;
  overdueMatchCount: number;
};

export type OverdueMatch = {
  id: number;
  seasonId: number;
  player1Name: string;
  player2Name: string;
  daysSinceCreated: number;
};

// ── Queries ────────────────────────────────────────────

export async function getClubStats(
  sql: Sql,
  clubId: number,
): Promise<ClubStats> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM club_members WHERE club_id = ${clubId})
        AS "playerCount",
      (SELECT COUNT(*)::int FROM seasons WHERE club_id = ${clubId} AND status = 'active')
        AS "activeSeasonCount",
      (SELECT COUNT(*)::int
       FROM season_matches sm
       JOIN seasons s ON s.id = sm.season_id
       WHERE s.club_id = ${clubId}
         AND s.status = 'active'
         AND sm.status IN ('challenged', 'date_set'))
        AS "openChallengeCount"
  `;

  return rows[0] as ClubStats;
}

export async function getActiveSeasonsWithStats(
  sql: Sql,
  clubId: number,
): Promise<AdminSeasonSummary[]> {
  const rows = await sql<AdminSeasonSummary[]>`
    SELECT
      s.id,
      s.name,
      COALESCE(
        (SELECT array_length(ss.results, 1)
         FROM season_standings ss
         WHERE ss.season_id = s.id
         ORDER BY ss.id DESC
         LIMIT 1),
        0
      )::int AS "playerCount",
      (SELECT COUNT(*)::int
       FROM season_matches sm
       WHERE sm.season_id = s.id
         AND sm.status IN ('challenged', 'date_set'))
        AS "openChallengeCount",
      (SELECT COUNT(*)::int
       FROM season_matches sm
       WHERE sm.season_id = s.id
         AND sm.status IN ('challenged', 'date_set')
         AND sm.created < NOW() - (s.match_deadline_days || ' days')::interval)
        AS "overdueMatchCount"
    FROM seasons s
    WHERE s.club_id = ${clubId} AND s.status = 'active'
    ORDER BY s.created DESC
  `;

  return rows as AdminSeasonSummary[];
}

export async function getOverdueMatches(
  sql: Sql,
  clubId: number,
): Promise<OverdueMatch[]> {
  const rows = await sql<OverdueMatch[]>`
    SELECT
      sm.id,
      sm.season_id AS "seasonId",
      CONCAT(p1.first_name, ' ', p1.last_name) AS "player1Name",
      CONCAT(p2.first_name, ' ', p2.last_name) AS "player2Name",
      (NOW()::date - sm.created::date) AS "daysSinceCreated"
    FROM season_matches sm
    JOIN seasons s ON s.id = sm.season_id
    JOIN teams t1 ON t1.id = sm.team1_id
    JOIN team_players tp1 ON tp1.team_id = t1.id
    JOIN player p1 ON p1.id = tp1.player_id
    JOIN teams t2 ON t2.id = sm.team2_id
    JOIN team_players tp2 ON tp2.team_id = t2.id
    JOIN player p2 ON p2.id = tp2.player_id
    WHERE s.club_id = ${clubId}
      AND sm.status IN ('challenged', 'date_set')
      AND sm.created < NOW() - (s.match_deadline_days || ' days')::interval
    ORDER BY sm.created ASC
  `;

  return rows as OverdueMatch[];
}
