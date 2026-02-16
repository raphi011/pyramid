import type { Sql } from "../db";

// ── Shared value types ─────────────────────────────────

export type BestOf = 1 | 3 | 5 | 7;

// ── Types ──────────────────────────────────────────────

export type ClubStats = {
  memberCount: number;
  activeSeasonCount: number;
  openChallengeCount: number;
};

export type AdminSeasonSummary = {
  id: number;
  name: string;
  teamCount: number;
  openChallengeCount: number;
  overdueMatchCount: number;
};

export type OverdueMatch = {
  id: number;
  seasonId: number;
  team1Name: string;
  team2Name: string;
  daysOverdue: number;
};

// ── Create Season types ───────────────────────────────

export type SeasonMember = {
  id: number;
  name: string;
};

export type PreviousSeason = {
  id: number;
  name: string;
};

// ── Season Management types ───────────────────────────

export type SeasonStatus = "draft" | "active" | "ended";

export type SeasonDetail = {
  id: number;
  name: string;
  status: SeasonStatus;
  bestOf: BestOf;
  matchDeadlineDays: number;
  reminderDays: number;
  requiresResultConfirmation: boolean;
  openEnrollment: boolean;
  isTeamSeason: boolean;
};

// ── Member Management types ───────────────────────────

export type ClubMember = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "player";
};

// ── Team Management types ─────────────────────────────

export type TeamMember = {
  id: number;
  name: string;
};

export type Team = {
  id: number;
  name: string;
  members: TeamMember[];
};

// ── Announcements types ───────────────────────────────

export type PastAnnouncement = {
  id: number;
  message: string;
  sentBy: string;
  sentAt: string; // ISO 8601 timestamp
  emailed: boolean;
};

// ── App Admin types ───────────────────────────────────

export type AppStats = {
  totalClubs: number;
  totalPlayers: number;
  totalSeasons: number;
};

export type AdminClub = {
  id: number;
  name: string;
  memberCount: number;
  isDisabled: boolean;
  adminEmail: string | null;
};

export type AppAdmin = {
  id: number;
  email: string;
};

// ── Queries ────────────────────────────────────────────

export async function getClubStats(
  sql: Sql,
  clubId: number,
): Promise<ClubStats> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM club_members WHERE club_id = ${clubId})
        AS "memberCount",
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

  if (rows.length === 0) {
    throw new Error(`getClubStats: no rows returned for clubId=${clubId}`);
  }

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
      (SELECT COUNT(*)::int FROM teams t
       WHERE t.season_id = s.id AND t.opted_out = false)
        AS "teamCount",
      (SELECT COUNT(*)::int
       FROM season_matches sm
       WHERE sm.season_id = s.id
         AND sm.status IN ('challenged', 'date_set'))
        AS "openChallengeCount",
      (SELECT COUNT(*)::int
       FROM season_matches sm
       WHERE sm.season_id = s.id
         AND sm.status IN ('challenged', 'date_set')
         AND sm.created < NOW() - (COALESCE(s.match_deadline_days, 14) || ' days')::interval)
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
      COALESCE(
        (SELECT CONCAT(p.first_name, ' ', p.last_name)
         FROM team_players tp JOIN player p ON p.id = tp.player_id
         WHERE tp.team_id = sm.team1_id LIMIT 1),
        'Unknown'
      ) AS "team1Name",
      COALESCE(
        (SELECT CONCAT(p.first_name, ' ', p.last_name)
         FROM team_players tp JOIN player p ON p.id = tp.player_id
         WHERE tp.team_id = sm.team2_id LIMIT 1),
        'Unknown'
      ) AS "team2Name",
      (NOW()::date - sm.created::date) - COALESCE(s.match_deadline_days, 14) AS "daysOverdue"
    FROM season_matches sm
    JOIN seasons s ON s.id = sm.season_id
    WHERE s.club_id = ${clubId}
      AND sm.status IN ('challenged', 'date_set')
      AND sm.created < NOW() - (COALESCE(s.match_deadline_days, 14) || ' days')::interval
    ORDER BY sm.created ASC
  `;

  return rows as OverdueMatch[];
}

// ── Club Member queries ──────────────────────────────

export async function getClubMembers(
  sql: Sql,
  clubId: number,
): Promise<ClubMember[]> {
  const rows = await sql<ClubMember[]>`
    SELECT
      p.id,
      CONCAT(p.first_name, ' ', p.last_name) AS name,
      p.email_address AS email,
      CASE WHEN p.image_id IS NOT NULL
        THEN '/api/images/' || p.image_id
        ELSE NULL
      END AS "avatarUrl",
      cm.role
    FROM club_members cm
    JOIN player p ON p.id = cm.player_id
    WHERE cm.club_id = ${clubId}
    ORDER BY cm.role DESC, p.first_name ASC
  `;

  return rows as ClubMember[];
}

export async function getSeasonMembers(
  sql: Sql,
  clubId: number,
): Promise<SeasonMember[]> {
  const rows = await sql<SeasonMember[]>`
    SELECT
      p.id,
      CONCAT(p.first_name, ' ', p.last_name) AS name
    FROM club_members cm
    JOIN player p ON p.id = cm.player_id
    WHERE cm.club_id = ${clubId}
    ORDER BY p.first_name ASC
  `;

  return rows as SeasonMember[];
}

// ── Season queries ───────────────────────────────────

export async function getPreviousSeasons(
  sql: Sql,
  clubId: number,
): Promise<PreviousSeason[]> {
  const rows = await sql<PreviousSeason[]>`
    SELECT id, name
    FROM seasons
    WHERE club_id = ${clubId}
    ORDER BY created DESC
  `;

  return rows as PreviousSeason[];
}

export async function getSeasonDetail(
  sql: Sql,
  seasonId: number,
): Promise<SeasonDetail | null> {
  const rows = await sql<SeasonDetail[]>`
    SELECT
      id,
      name,
      status,
      best_of AS "bestOf",
      match_deadline_days AS "matchDeadlineDays",
      reminder_after_days AS "reminderDays",
      requires_result_confirmation AS "requiresResultConfirmation",
      open_enrollment AS "openEnrollment",
      (max_team_size > 1) AS "isTeamSeason"
    FROM seasons
    WHERE id = ${seasonId}
  `;

  return (rows[0] as SeasonDetail) ?? null;
}

export async function getSeasonPlayerCount(
  sql: Sql,
  seasonId: number,
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM teams
    WHERE season_id = ${seasonId} AND opted_out = false
  `;

  return (rows[0] as { count: number }).count;
}

export async function getSeasonOptedOutCount(
  sql: Sql,
  seasonId: number,
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM teams
    WHERE season_id = ${seasonId} AND opted_out = true
  `;

  return (rows[0] as { count: number }).count;
}

// ── Team queries ─────────────────────────────────────

export async function getTeamsWithMembers(
  sql: Sql,
  seasonId: number,
): Promise<Team[]> {
  const teamRows = await sql<{ id: number; name: string }[]>`
    SELECT id, name
    FROM teams
    WHERE season_id = ${seasonId}
    ORDER BY name ASC
  `;

  if (teamRows.length === 0) return [];

  const teamIds = teamRows.map((t) => t.id);

  const memberRows = await sql<{ teamId: number; id: number; name: string }[]>`
    SELECT
      tp.team_id AS "teamId",
      p.id,
      CONCAT(p.first_name, ' ', p.last_name) AS name
    FROM team_players tp
    JOIN player p ON p.id = tp.player_id
    WHERE tp.team_id = ANY(${teamIds})
    ORDER BY p.first_name ASC
  `;

  const membersByTeam = new Map<number, TeamMember[]>();
  for (const row of memberRows) {
    const list = membersByTeam.get(row.teamId) ?? [];
    list.push({ id: row.id, name: row.name });
    membersByTeam.set(row.teamId, list);
  }

  return teamRows.map((t) => ({
    id: t.id,
    name: t.name,
    members: membersByTeam.get(t.id) ?? [],
  }));
}

export async function getUnassignedPlayers(
  sql: Sql,
  seasonId: number,
  clubId: number,
): Promise<TeamMember[]> {
  const rows = await sql<TeamMember[]>`
    SELECT
      p.id,
      CONCAT(p.first_name, ' ', p.last_name) AS name
    FROM club_members cm
    JOIN player p ON p.id = cm.player_id
    WHERE cm.club_id = ${clubId}
      AND p.id NOT IN (
        SELECT tp.player_id
        FROM team_players tp
        JOIN teams t ON t.id = tp.team_id
        WHERE t.season_id = ${seasonId}
      )
    ORDER BY p.first_name ASC
  `;

  return rows as TeamMember[];
}

// ── Announcement queries ─────────────────────────────

export async function getPastAnnouncements(
  sql: Sql,
  clubId: number,
): Promise<PastAnnouncement[]> {
  const rows = await sql<PastAnnouncement[]>`
    SELECT
      e.id,
      e.metadata->>'message' AS message,
      CONCAT(p.first_name, ' ', p.last_name) AS "sentBy",
      e.created::text AS "sentAt",
      COALESCE((e.metadata->>'emailed')::bool, false) AS emailed
    FROM events e
    LEFT JOIN player p ON p.id = e.player_id
    WHERE e.club_id = ${clubId}
      AND e.event_type = 'announcement'
    ORDER BY e.created DESC
  `;

  return rows as PastAnnouncement[];
}

// ── App Admin queries ────────────────────────────────

export async function getAppStats(sql: Sql): Promise<AppStats> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM clubs) AS "totalClubs",
      (SELECT COUNT(*)::int FROM player) AS "totalPlayers",
      (SELECT COUNT(*)::int FROM seasons) AS "totalSeasons"
  `;

  return rows[0] as AppStats;
}

export async function getAdminClubs(sql: Sql): Promise<AdminClub[]> {
  const rows = await sql<AdminClub[]>`
    SELECT
      c.id,
      c.name,
      (SELECT COUNT(*)::int FROM club_members WHERE club_id = c.id)
        AS "memberCount",
      c.is_disabled AS "isDisabled",
      (SELECT p.email_address
       FROM club_members cm
       JOIN player p ON p.id = cm.player_id
       WHERE cm.club_id = c.id AND cm.role = 'admin'
       ORDER BY cm.created ASC
       LIMIT 1) AS "adminEmail"
    FROM clubs c
    ORDER BY c.name ASC
  `;

  return rows as AdminClub[];
}

export async function getAppAdmins(sql: Sql): Promise<AppAdmin[]> {
  const rows = await sql<AppAdmin[]>`
    SELECT
      id,
      email_address AS email
    FROM player
    WHERE is_app_admin = true
    ORDER BY id ASC
  `;

  return rows as AppAdmin[];
}
