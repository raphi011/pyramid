import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type SeasonStatus = "draft" | "active" | "ended";

export type Season = {
  id: number;
  clubId: number;
  name: string;
  status: SeasonStatus;
  minTeamSize: number;
  maxTeamSize: number;
  bestOf: number;
  matchDeadlineDays: number;
  reminderAfterDays: number;
  requiresResultConfirmation: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
};

export type TeamEnrollment = {
  teamId: number;
  seasonId: number;
  seasonName: string;
};

export type RankHistoryPoint = {
  date: string;
  rank: number;
};

export type PlayerSeasonTeam = {
  seasonId: number;
  teamId: number;
  seasonName: string;
  clubId: number;
};

export type RankedPlayer = {
  teamId: number;
  playerId: number;
  name: string;
  imageId: string | null;
  rank: number;
};

export type WinsLosses = { wins: number; losses: number };

// ── Helpers ────────────────────────────────────────────

export function isIndividualSeason(season: Season): boolean {
  return season.maxTeamSize === 1;
}

function toSeason(row: Record<string, unknown>): Season {
  return {
    id: row.id as number,
    clubId: row.clubId as number,
    name: row.name as string,
    status: row.status as SeasonStatus,
    minTeamSize: row.minTeamSize as number,
    maxTeamSize: row.maxTeamSize as number,
    bestOf: row.bestOf as number,
    matchDeadlineDays: row.matchDeadlineDays as number,
    reminderAfterDays: row.reminderAfterDays as number,
    requiresResultConfirmation: row.requiresResultConfirmation as boolean,
    startedAt: (row.startedAt as Date) ?? null,
    endedAt: (row.endedAt as Date) ?? null,
  };
}

// ── Queries ────────────────────────────────────────────

export async function getActiveSeasons(
  sql: Sql,
  clubId: number,
): Promise<Season[]> {
  const rows = await sql`
    SELECT
      id,
      club_id AS "clubId",
      name,
      status,
      min_team_size AS "minTeamSize",
      max_team_size AS "maxTeamSize",
      best_of AS "bestOf",
      match_deadline_days AS "matchDeadlineDays",
      reminder_after_days AS "reminderAfterDays",
      requires_result_confirmation AS "requiresResultConfirmation",
      started_at AS "startedAt",
      ended_at AS "endedAt"
    FROM seasons
    WHERE club_id = ${clubId} AND status = 'active'
  `;

  return rows.map(toSeason);
}

export async function getSeasonById(
  sql: Sql,
  id: number,
): Promise<Season | null> {
  const rows = await sql`
    SELECT
      id,
      club_id AS "clubId",
      name,
      status,
      min_team_size AS "minTeamSize",
      max_team_size AS "maxTeamSize",
      best_of AS "bestOf",
      match_deadline_days AS "matchDeadlineDays",
      reminder_after_days AS "reminderAfterDays",
      requires_result_confirmation AS "requiresResultConfirmation",
      started_at AS "startedAt",
      ended_at AS "endedAt"
    FROM seasons
    WHERE id = ${id}
  `;

  return rows.length > 0 ? toSeason(rows[0]) : null;
}

export async function getLatestStandings(
  sql: Sql,
  seasonId: number,
): Promise<{ id: number; results: number[] } | null> {
  const rows = await sql`
    SELECT id, results
    FROM season_standings
    WHERE season_id = ${seasonId}
    ORDER BY id DESC
    LIMIT 1
  `;

  return rows.length > 0
    ? { id: rows[0].id, results: rows[0].results as number[] }
    : null;
}

export async function isPlayerEnrolledInSeason(
  sql: Sql,
  playerId: number,
  seasonId: number,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1
    FROM team_players tp
    JOIN teams t ON t.id = tp.team_id
    WHERE tp.player_id = ${playerId} AND t.season_id = ${seasonId}
  `;

  return rows.length > 0;
}

export async function enrollPlayerInIndividualSeason(
  sql: Sql,
  playerId: number,
  seasonId: number,
): Promise<number> {
  const [team] = await sql`
    INSERT INTO teams (season_id, name, opted_out, created)
    VALUES (${seasonId}, '', false, NOW())
    RETURNING id
  `;
  const teamId = team.id as number;

  await sql`
    INSERT INTO team_players (team_id, player_id, created)
    VALUES (${teamId}, ${playerId}, NOW())
  `;

  return teamId;
}

export async function addTeamToStandings(
  tx: postgres.TransactionSql,
  seasonId: number,
  teamId: number,
): Promise<void> {
  // Advisory lock serializes concurrent standings modifications per season
  await tx`SELECT pg_advisory_xact_lock(${seasonId})`;

  await tx`
    INSERT INTO season_standings (season_id, results, created)
    SELECT
      ${seasonId},
      COALESCE(
        (SELECT results FROM season_standings
         WHERE season_id = ${seasonId}
         ORDER BY id DESC LIMIT 1),
        '{}'::int[]
      ) || ${teamId}::int,
      NOW()
  `;
}

export async function createNewPlayerEvent(
  sql: Sql,
  clubId: number,
  playerId: number,
  metadata: Record<string, unknown>,
): Promise<number> {
  const [row] = await sql`
    INSERT INTO events (club_id, player_id, event_type, metadata, created)
    VALUES (${clubId}, ${playerId}, 'new_player', ${sql.json(metadata)}, NOW())
    RETURNING id
  `;

  return row.id as number;
}

// ── Rankings queries ──────────────────────────────────

export async function getStandingsWithPlayers(
  sql: Sql,
  seasonId: number,
): Promise<{ players: RankedPlayer[]; previousResults: number[] | null }> {
  // Fetch the two most recent standings (current + previous for movement)
  const snapshots = await sql`
    SELECT id, results
    FROM season_standings
    WHERE season_id = ${seasonId}
    ORDER BY id DESC
    LIMIT 2
  `;

  if (snapshots.length === 0) {
    return { players: [], previousResults: null };
  }

  const currentResults = snapshots[0].results as number[];
  const previousResults =
    snapshots.length > 1 ? (snapshots[1].results as number[]) : null;

  if (currentResults.length === 0) {
    return { players: [], previousResults };
  }

  // Batch-fetch team → player info for all team IDs
  const teamPlayerRows = await sql`
    SELECT
      t.id AS "teamId",
      p.id AS "playerId",
      p.name,
      p.image_id::text AS "imageId"
    FROM teams t
    JOIN team_players tp ON tp.team_id = t.id
    JOIN player p ON p.id = tp.player_id
    WHERE t.id = ANY(${currentResults})
  `;

  // Index by teamId for fast lookup (individual seasons only — one player per team)
  const teamMap = new Map<
    number,
    { playerId: number; name: string; imageId: string | null }
  >();
  for (const row of teamPlayerRows) {
    const teamId = row.teamId as number;
    if (teamMap.has(teamId)) {
      console.warn(
        `getStandingsWithPlayers: multiple players for team ${teamId} — only individual seasons are currently supported`,
      );
    }
    teamMap.set(teamId, {
      playerId: row.playerId as number,
      name: row.name as string,
      imageId: (row.imageId as string) ?? null,
    });
  }

  // Map results array position → rank (1-based)
  const players: RankedPlayer[] = [];
  for (let i = 0; i < currentResults.length; i++) {
    const teamId = currentResults[i];
    const info = teamMap.get(teamId);
    if (!info) {
      console.error(
        `getStandingsWithPlayers: team ${teamId} in standings for season ${seasonId} not found in DB`,
      );
      continue;
    }

    players.push({
      teamId,
      playerId: info.playerId,
      name: info.name,
      imageId: info.imageId,
      rank: i + 1,
    });
  }

  return { players, previousResults };
}

export async function getTeamWinsLosses(
  sql: Sql,
  seasonId: number,
): Promise<Map<number, WinsLosses>> {
  const rows = await sql`
    SELECT team_id AS "teamId", wins, losses
    FROM (
      SELECT
        team_id,
        COUNT(*) FILTER (WHERE is_winner) AS wins,
        COUNT(*) FILTER (WHERE NOT is_winner) AS losses
      FROM (
        SELECT team1_id AS team_id, (winner_team_id = team1_id) AS is_winner
        FROM season_matches
        WHERE season_id = ${seasonId} AND status = 'completed'
        UNION ALL
        SELECT team2_id AS team_id, (winner_team_id = team2_id) AS is_winner
        FROM season_matches
        WHERE season_id = ${seasonId} AND status = 'completed'
      ) matches
      GROUP BY team_id
    ) stats
  `;

  const map = new Map<number, WinsLosses>();
  for (const row of rows) {
    map.set(row.teamId as number, {
      wins: Number(row.wins),
      losses: Number(row.losses),
    });
  }
  return map;
}

export async function getPlayerTeamId(
  sql: Sql,
  playerId: number,
  seasonId: number,
): Promise<number | null> {
  const rows = await sql`
    SELECT t.id
    FROM teams t
    JOIN team_players tp ON tp.team_id = t.id
    WHERE tp.player_id = ${playerId} AND t.season_id = ${seasonId}
    LIMIT 1
  `;
  return rows.length > 0 ? (rows[0].id as number) : null;
}

export async function autoEnrollInActiveSeasons(
  tx: postgres.TransactionSql,
  playerId: number,
  clubId: number,
): Promise<TeamEnrollment[]> {
  const seasons = await getActiveSeasons(tx, clubId);
  const enrollments: TeamEnrollment[] = [];

  for (const season of seasons) {
    if (!isIndividualSeason(season)) continue;
    if (await isPlayerEnrolledInSeason(tx, playerId, season.id)) continue;

    const teamId = await enrollPlayerInIndividualSeason(
      tx,
      playerId,
      season.id,
    );
    await addTeamToStandings(tx, season.id, teamId);

    enrollments.push({
      teamId,
      seasonId: season.id,
      seasonName: season.name,
    });
  }

  return enrollments;
}

// ── Profile queries ─────────────────────────────

export async function getRankHistory(
  sql: Sql,
  seasonId: number,
  teamId: number,
): Promise<RankHistoryPoint[]> {
  const rows = await sql`
    SELECT
      created,
      array_position(results, ${teamId}) AS rank
    FROM season_standings
    WHERE season_id = ${seasonId}
      AND ${teamId} = ANY(results)
    ORDER BY created ASC
  `;

  return rows.map((row) => ({
    date: (row.created as Date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    rank: row.rank as number,
  }));
}

export async function getPlayerSeasonTeams(
  sql: Sql,
  playerId: number,
  clubId?: number,
): Promise<PlayerSeasonTeam[]> {
  const rows = await sql`
    SELECT
      s.id AS "seasonId",
      t.id AS "teamId",
      s.name AS "seasonName",
      s.club_id AS "clubId"
    FROM teams t
    JOIN team_players tp ON tp.team_id = t.id
    JOIN seasons s ON s.id = t.season_id
    WHERE tp.player_id = ${playerId}
      ${clubId !== undefined ? sql`AND s.club_id = ${clubId}` : sql``}
  `;

  return rows.map((row) => ({
    seasonId: row.seasonId as number,
    teamId: row.teamId as number,
    seasonName: row.seasonName as string,
    clubId: row.clubId as number,
  }));
}
