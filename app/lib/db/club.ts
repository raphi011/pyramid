import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type ClubRole = "player" | "admin";

export type Club = {
  id: number;
  name: string;
  inviteCode: string;
  isDisabled: boolean;
};

export type ClubMembership = {
  clubId: number;
  clubName: string;
  role: ClubRole;
};

// ── Queries ────────────────────────────────────────────

export async function getClubByInviteCode(
  sql: Sql,
  code: string,
): Promise<Club | null> {
  const rows = await sql`
    SELECT id, name, invite_code AS "inviteCode", is_disabled AS "isDisabled"
    FROM clubs
    WHERE invite_code = ${code}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getClubById(sql: Sql, id: number): Promise<Club | null> {
  const rows = await sql`
    SELECT id, name, invite_code AS "inviteCode", is_disabled AS "isDisabled"
    FROM clubs
    WHERE id = ${id}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getPlayerClubs(
  sql: Sql,
  playerId: number,
): Promise<ClubMembership[]> {
  const rows = await sql`
    SELECT c.id AS "clubId", c.name AS "clubName", cm.role
    FROM club_members cm
    JOIN clubs c ON c.id = cm.club_id
    WHERE cm.player_id = ${playerId}
  `;

  return rows as ClubMembership[];
}

export async function getPlayerRole(
  sql: Sql,
  playerId: number,
  clubId: number,
): Promise<ClubRole | null> {
  const rows = await sql`
    SELECT role FROM club_members
    WHERE player_id = ${playerId} AND club_id = ${clubId}
  `;

  return rows.length > 0 ? (rows[0].role as ClubRole) : null;
}

export async function isClubMember(
  sql: Sql,
  playerId: number,
  clubId: number,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM club_members
    WHERE player_id = ${playerId} AND club_id = ${clubId}
  `;

  return rows.length > 0;
}

export async function joinClub(
  sql: Sql,
  playerId: number,
  clubId: number,
  role: ClubRole = "player",
): Promise<{ alreadyMember: boolean }> {
  const rows = await sql`
    INSERT INTO club_members (player_id, club_id, role, created)
    VALUES (${playerId}, ${clubId}, ${role}, NOW())
    ON CONFLICT (player_id, club_id) DO NOTHING
    RETURNING player_id
  `;

  return { alreadyMember: rows.length === 0 };
}
