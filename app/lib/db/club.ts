import { generateInviteCode } from "../crypto";
import { slugify } from "../slug";
import type { Sql } from "../db";
import {
  isUniqueViolation,
  SlugConflictError,
  ReservedSlugError,
} from "./errors";
import { isReservedClubSlug } from "../reserved-slugs";

// ── Types ──────────────────────────────────────────────

export type ClubRole = "player" | "admin";

export type Club = {
  id: number;
  name: string;
  slug: string;
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
  clubSlug: string;
  clubImageId: string | null;
  role: ClubRole;
};

// ── Queries ────────────────────────────────────────────

export async function getClubByInviteCode(
  sql: Sql,
  code: string,
): Promise<Club | null> {
  const rows = await sql`
    SELECT
      id, name, slug, invite_code AS "inviteCode",
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
      id, name, slug, invite_code AS "inviteCode",
      url, phone_number AS "phoneNumber",
      address, city, zip, country,
      image_id::text AS "imageId",
      is_disabled AS "isDisabled"
    FROM clubs
    WHERE id = ${id}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getClubBySlug(
  sql: Sql,
  slug: string,
): Promise<Club | null> {
  const rows = await sql`
    SELECT
      id, name, slug, invite_code AS "inviteCode",
      url, phone_number AS "phoneNumber",
      address, city, zip, country,
      image_id::text AS "imageId",
      is_disabled AS "isDisabled"
    FROM clubs
    WHERE slug = ${slug}
  `;

  return rows.length > 0 ? (rows[0] as Club) : null;
}

export async function getPlayerClubs(
  sql: Sql,
  playerId: number,
): Promise<ClubMembership[]> {
  const rows = await sql<ClubMembership[]>`
    SELECT c.id AS "clubId", c.name AS "clubName", c.slug AS "clubSlug",
           c.image_id::text AS "clubImageId", cm.role
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

export async function getClubSlug(
  sql: Sql,
  clubId: number,
): Promise<string | null> {
  const rows = await sql`SELECT slug FROM clubs WHERE id = ${clubId}`;
  return rows.length > 0 ? (rows[0].slug as string) : null;
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
): Promise<{ id: number; slug: string; inviteCode: string }> {
  const code = inviteCode ?? generateInviteCode();
  const slug = slugify(name);
  if (isReservedClubSlug(slug)) throw new ReservedSlugError();

  try {
    const [row] = await sql`
      INSERT INTO clubs (name, slug, invite_code, is_disabled, created)
      VALUES (${name}, ${slug}, ${code}, false, NOW())
      RETURNING id
    `;

    return { id: row.id as number, slug, inviteCode: code };
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError();
    throw error;
  }
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

// ── Update club ──────────────────────────────────

export type UpdateClubData = {
  name: string;
  url: string;
  phoneNumber: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  imageId: string | null;
};

export async function updateClub(
  sql: Sql,
  clubId: number,
  data: UpdateClubData,
): Promise<{ count: number; slug: string }> {
  const slug = slugify(data.name);
  if (isReservedClubSlug(slug)) throw new ReservedSlugError();

  try {
    const result = await sql`
      UPDATE clubs
      SET
        name = ${data.name},
        slug = ${slug},
        url = ${data.url},
        phone_number = ${data.phoneNumber},
        address = ${data.address},
        city = ${data.city},
        zip = ${data.zip},
        country = ${data.country},
        image_id = ${data.imageId}
      WHERE id = ${clubId}
    `;

    return { count: result.count, slug };
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugConflictError();
    throw error;
  }
}

export async function getClubImageId(
  sql: Sql,
  clubId: number,
): Promise<string | null> {
  const rows = await sql`
    SELECT image_id::text AS "imageId" FROM clubs WHERE id = ${clubId}
  `;
  return rows.length > 0 ? (rows[0].imageId as string | null) : null;
}

// ── Regenerate invite code ───────────────────────

export async function regenerateClubInviteCode(
  sql: Sql,
  clubId: number,
): Promise<string | null> {
  const code = generateInviteCode();
  const rows = await sql`
    UPDATE clubs
    SET invite_code = ${code}
    WHERE id = ${clubId}
    RETURNING invite_code AS "inviteCode"
  `;

  return rows.length > 0 ? (rows[0].inviteCode as string) : null;
}

// ── Leave club ────────────────────────────────

export async function hasOpenChallengesInClub(
  sql: Sql,
  playerId: number,
  clubId: number,
): Promise<boolean> {
  const [row] = await sql`
    SELECT 1
    FROM season_matches sm
    JOIN seasons s ON s.id = sm.season_id
    JOIN teams t ON t.id IN (sm.team1_id, sm.team2_id)
    JOIN team_players tp ON tp.team_id = t.id
    WHERE tp.player_id = ${playerId}
      AND s.club_id = ${clubId}
      AND s.status = 'active'
      AND sm.status IN ('challenged', 'date_set', 'pending_confirmation')
    LIMIT 1
  `;
  return !!row;
}

export async function leaveClub(
  sql: Sql,
  playerId: number,
  clubId: number,
): Promise<void> {
  // Opt out all teams the player belongs to in active seasons of this club
  await sql`
    UPDATE teams t
    SET opted_out = true
    FROM team_players tp, seasons s
    WHERE tp.team_id = t.id
      AND s.id = t.season_id
      AND tp.player_id = ${playerId}
      AND s.club_id = ${clubId}
      AND s.status = 'active'
  `;

  // Remove club membership
  await sql`
    DELETE FROM club_members
    WHERE player_id = ${playerId} AND club_id = ${clubId}
  `;
}
