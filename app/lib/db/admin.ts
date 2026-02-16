import type { Sql } from "../db";

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
  bestOf: number;
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
  sentAt: string;
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
  adminEmail: string;
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
      (SELECT CONCAT(p.first_name, ' ', p.last_name)
       FROM team_players tp JOIN player p ON p.id = tp.player_id
       WHERE tp.team_id = sm.team1_id LIMIT 1) AS "team1Name",
      (SELECT CONCAT(p.first_name, ' ', p.last_name)
       FROM team_players tp JOIN player p ON p.id = tp.player_id
       WHERE tp.team_id = sm.team2_id LIMIT 1) AS "team2Name",
      (NOW()::date - sm.created::date) - s.match_deadline_days AS "daysOverdue"
    FROM season_matches sm
    JOIN seasons s ON s.id = sm.season_id
    WHERE s.club_id = ${clubId}
      AND sm.status IN ('challenged', 'date_set')
      AND sm.created < NOW() - (s.match_deadline_days || ' days')::interval
    ORDER BY sm.created ASC
  `;

  return rows as OverdueMatch[];
}
