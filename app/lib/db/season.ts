import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type Season = {
  id: number;
  clubId: number;
  name: string;
  status: string;
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

  return rows as Season[];
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

  return rows.length > 0 ? (rows[0] as Season) : null;
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
  sql: Sql,
  seasonId: number,
  teamId: number,
): Promise<void> {
  const latest = await getLatestStandings(sql, seasonId);
  const updated = latest ? [...latest.results, teamId] : [teamId];

  await sql`
    INSERT INTO season_standings (season_id, results, created)
    VALUES (${seasonId}, ${updated}, NOW())
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

export async function autoEnrollInActiveSeasons(
  sql: Sql,
  playerId: number,
  clubId: number,
): Promise<TeamEnrollment[]> {
  const seasons = await getActiveSeasons(sql, clubId);
  const enrollments: TeamEnrollment[] = [];

  for (const season of seasons) {
    // Skip team seasons — they require manual team selection
    if (season.maxTeamSize > 1) continue;

    const teamId = await enrollPlayerInIndividualSeason(
      sql,
      playerId,
      season.id,
    );
    await addTeamToStandings(sql, season.id, teamId);

    enrollments.push({
      teamId,
      seasonId: season.id,
      seasonName: season.name,
    });
  }

  return enrollments;
}
