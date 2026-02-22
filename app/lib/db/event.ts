import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type EventType =
  | "challenge"
  | "challenged"
  | "challenge_accepted"
  | "challenge_withdrawn"
  | "result"
  | "result_entered"
  | "result_confirmed"
  | "result_disputed"
  | "withdrawal"
  | "forfeit"
  | "date_proposed"
  | "date_accepted"
  | "date_reminder"
  | "deadline_exceeded"
  | "new_player"
  | "unavailable"
  | "announcement"
  | "season_start"
  | "season_end";

export type EventRow = {
  id: number;
  clubId: number;
  seasonId: number | null;
  matchId: number | null;
  playerId: number | null;
  targetPlayerId: number | null;
  eventType: EventType;
  metadata: Record<string, unknown>;
  created: Date;
  actorName: string | null;
  targetName: string | null;
  clubName: string;
  clubSlug: string;
  seasonSlug: string | null;
  team1Id: number | null;
  team2Id: number | null;
  winnerTeamId: number | null;
  team1Score: number[] | null;
  team2Score: number[] | null;
  team1Name: string | null;
  team2Name: string | null;
};

// ── Shared SQL fragments ───────────────────────────────

const EVENT_SELECT = `
  e.id,
  e.club_id AS "clubId",
  e.season_id AS "seasonId",
  e.match_id AS "matchId",
  e.player_id AS "playerId",
  e.target_player_id AS "targetPlayerId",
  e.event_type AS "eventType",
  e.metadata,
  e.created,
  (actor.first_name || ' ' || actor.last_name) AS "actorName",
  (target.first_name || ' ' || target.last_name) AS "targetName",
  c.name AS "clubName",
  c.slug AS "clubSlug",
  s.slug AS "seasonSlug",
  sm.team1_id AS "team1Id",
  sm.team2_id AS "team2Id",
  sm.winner_team_id AS "winnerTeamId",
  sm.team1_score AS "team1Score",
  sm.team2_score AS "team2Score",
  t1names.name AS "team1Name",
  t2names.name AS "team2Name"
`;

// Use LATERAL string_agg to collapse team player names into a single value,
// avoiding Cartesian product for doubles/team matches.
const EVENT_JOIN = `
  FROM events e
  JOIN clubs c ON c.id = e.club_id
  LEFT JOIN seasons s ON s.id = e.season_id
  LEFT JOIN player actor ON actor.id = e.player_id
  LEFT JOIN player target ON target.id = e.target_player_id
  LEFT JOIN season_matches sm ON sm.id = e.match_id
  LEFT JOIN LATERAL (
    SELECT string_agg(p.first_name || ' ' || p.last_name, ' / ' ORDER BY p.id) AS name
    FROM team_players tp JOIN player p ON p.id = tp.player_id
    WHERE tp.team_id = sm.team1_id
  ) t1names ON TRUE
  LEFT JOIN LATERAL (
    SELECT string_agg(p.first_name || ' ' || p.last_name, ' / ' ORDER BY p.id) AS name
    FROM team_players tp JOIN player p ON p.id = tp.player_id
    WHERE tp.team_id = sm.team2_id
  ) t2names ON TRUE
`;

function toEventRow(row: Record<string, unknown>): EventRow {
  return {
    id: row.id as number,
    clubId: row.clubId as number,
    seasonId: (row.seasonId as number) ?? null,
    matchId: (row.matchId as number) ?? null,
    playerId: (row.playerId as number) ?? null,
    targetPlayerId: (row.targetPlayerId as number) ?? null,
    eventType: row.eventType as EventType,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created: row.created as Date,
    actorName: (row.actorName as string) ?? null,
    targetName: (row.targetName as string) ?? null,
    clubName: row.clubName as string,
    clubSlug: row.clubSlug as string,
    seasonSlug: (row.seasonSlug as string) ?? null,
    team1Id: (row.team1Id as number) ?? null,
    team2Id: (row.team2Id as number) ?? null,
    winnerTeamId: (row.winnerTeamId as number) ?? null,
    team1Score: (row.team1Score as number[]) ?? null,
    team2Score: (row.team2Score as number[]) ?? null,
    team1Name: (row.team1Name as string) ?? null,
    team2Name: (row.team2Name as string) ?? null,
  };
}

// ── Queries ────────────────────────────────────────────

export async function getUnreadCount(
  sql: Sql,
  playerId: number,
  clubIds: number[],
): Promise<number> {
  if (clubIds.length === 0) return 0;

  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM events e
    LEFT JOIN event_reads er
      ON er.player_id = ${playerId} AND er.club_id = e.club_id
    WHERE e.club_id = ANY(${clubIds})
      AND (e.target_player_id IS NULL OR e.target_player_id = ${playerId})
      AND e.player_id IS DISTINCT FROM ${playerId}
      AND (er.last_read_at IS NULL OR e.created > er.last_read_at)
  `;

  return (rows[0].count as number) ?? 0;
}

export async function getEventReadWatermarks(
  sql: Sql,
  playerId: number,
  clubIds: number[],
): Promise<Map<number, Date>> {
  if (clubIds.length === 0) return new Map();

  const rows = await sql`
    SELECT club_id AS "clubId", last_read_at AS "lastReadAt"
    FROM event_reads
    WHERE player_id = ${playerId}
      AND club_id = ANY(${clubIds})
  `;

  const map = new Map<number, Date>();
  for (const row of rows) {
    map.set(row.clubId as number, row.lastReadAt as Date);
  }
  return map;
}

export async function getTimelineEvents(
  sql: Sql,
  playerId: number,
  clubIds: number[],
  cursor: { created: Date; id: number } | null,
  limit: number,
): Promise<EventRow[]> {
  if (clubIds.length === 0) return [];

  const cursorClause = cursor
    ? `AND (e.created, e.id) < ($3, $4) ORDER BY e.created DESC, e.id DESC LIMIT $5`
    : `ORDER BY e.created DESC, e.id DESC LIMIT $3`;

  const params = cursor
    ? [playerId, clubIds, cursor.created, cursor.id, limit]
    : [playerId, clubIds, limit];

  const rows = await sql.unsafe(
    `SELECT ${EVENT_SELECT}
     ${EVENT_JOIN}
     WHERE e.club_id = ANY($2)
       AND (e.target_player_id IS NULL OR e.target_player_id = $1)
       AND e.player_id IS DISTINCT FROM $1
       ${cursorClause}`,
    params,
  );

  return rows.map(toEventRow);
}

export async function getMatchEvents(
  sql: Sql,
  matchId: number,
): Promise<EventRow[]> {
  const rows = await sql.unsafe(
    `SELECT ${EVENT_SELECT}
     ${EVENT_JOIN}
     WHERE e.match_id = $1
     ORDER BY e.created ASC, e.id ASC`,
    [matchId],
  );
  return rows.map(toEventRow);
}

export async function getClubRecentEvents(
  sql: Sql,
  clubId: number,
  limit: number,
): Promise<EventRow[]> {
  const rows = await sql.unsafe(
    `SELECT ${EVENT_SELECT}
     ${EVENT_JOIN}
     WHERE e.club_id = $1
     ORDER BY e.created DESC, e.id DESC
     LIMIT $2`,
    [clubId, limit],
  );
  return rows.map(toEventRow);
}

export async function markAsRead(
  sql: Sql,
  playerId: number,
  clubIds: number[],
): Promise<void> {
  if (clubIds.length === 0) return;

  await sql`
    INSERT INTO event_reads (player_id, club_id, last_read_at)
    SELECT ${playerId}, unnest(${clubIds}::int[]), NOW()
    ON CONFLICT (player_id, club_id)
    DO UPDATE SET last_read_at = NOW()
  `;
}
