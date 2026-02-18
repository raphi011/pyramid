import { generateInviteCode } from "../crypto";
import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type ClubRole = "player" | "admin";

export type Club = {
  id: number;
  name: string;
  inviteCode: string;
  url: string;
  phoneNumber: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  imageId: string | null;
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
    SELECT
      id, name, invite_code AS "inviteCode",
      url, phone_number AS "phoneNumber",
      address, city, zip, country,
      image_id::text AS "imageId",
      is_disabled AS "isDisabled"
    FROM clubs
    WHERE invite_code = ${code}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getClubById(sql: Sql, id: number): Promise<Club | null> {
  const rows = await sql`
    SELECT
      id, name, invite_code AS "inviteCode",
      url, phone_number AS "phoneNumber",
      address, city, zip, country,
      image_id::text AS "imageId",
      is_disabled AS "isDisabled"
    FROM clubs
    WHERE id = ${id}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getPlayerClubs(
  sql: Sql,
  playerId: number,
): Promise<ClubMembership[]> {
  const rows = await sql<ClubMembership[]>`
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

// ── Club members ──────────────────────────────────────

export type ClubMember = {
  playerId: number;
  firstName: string;
  lastName: string;
  imageId: string | null;
  role: ClubRole;
};

export async function getClubMembers(
  sql: Sql,
  clubId: number,
): Promise<ClubMember[]> {
  const rows = await sql`
    SELECT
      p.id AS "playerId",
      p.first_name AS "firstName",
      p.last_name AS "lastName",
      p.image_id::text AS "imageId",
      cm.role
    FROM club_members cm
    JOIN player p ON p.id = cm.player_id
    WHERE cm.club_id = ${clubId}
    ORDER BY
      CASE WHEN cm.role = 'admin' THEN 0 ELSE 1 END,
      p.first_name, p.last_name
  `;

  return rows.map((r) => ({
    playerId: r.playerId as number,
    firstName: r.firstName as string,
    lastName: r.lastName as string,
    imageId: (r.imageId as string) ?? null,
    role: r.role as ClubRole,
  }));
}

// ── Create club ──────────────────────────────────────

export async function createClub(
  sql: Sql,
  { name, inviteCode }: { name: string; inviteCode?: string },
): Promise<{ id: number; inviteCode: string }> {
  const code = inviteCode ?? generateInviteCode();

  const [row] = await sql`
    INSERT INTO clubs (name, invite_code, is_disabled, created)
    VALUES (${name}, ${code}, false, NOW())
    RETURNING id
  `;

  return { id: row.id as number, inviteCode: code };
}

// ── Join club ─────────────────────────────────────────

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
