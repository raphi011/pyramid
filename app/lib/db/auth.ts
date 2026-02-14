import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type PlayerProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
  imageId: string | null;
  unavailableFrom: Date | null;
  unavailableUntil: Date | null;
};

// ── Queries ────────────────────────────────────────────

export async function getPlayerByEmail(
  sql: Sql,
  email: string,
): Promise<Player | null> {
  const rows = await sql`
    SELECT id, first_name AS "firstName", last_name AS "lastName", email_address AS email FROM player
    WHERE LOWER(email_address) = LOWER(${email})
  `;

  return rows.length > 0
    ? {
        id: rows[0].id,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
        email: rows[0].email,
      }
    : null;
}

export async function getPlayerById(
  sql: Sql,
  playerId: number,
): Promise<Player | null> {
  const rows = await sql`
    SELECT id, first_name AS "firstName", last_name AS "lastName", email_address AS email FROM player
    WHERE id = ${playerId}
  `;

  return rows.length > 0
    ? {
        id: rows[0].id,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
        email: rows[0].email,
      }
    : null;
}

export async function getPlayerProfile(
  sql: Sql,
  playerId: number,
): Promise<PlayerProfile | null> {
  const rows = await sql`
    SELECT
      id,
      first_name AS "firstName",
      last_name AS "lastName",
      email_address AS "email",
      phone_number AS "phoneNumber",
      bio,
      image_id::text AS "imageId",
      unavailable_from AS "unavailableFrom",
      unavailable_until AS "unavailableUntil"
    FROM player
    WHERE id = ${playerId}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as number,
    firstName: row.firstName as string,
    lastName: row.lastName as string,
    email: row.email as string,
    phoneNumber: row.phoneNumber as string,
    bio: row.bio as string,
    imageId: (row.imageId as string) ?? null,
    unavailableFrom: (row.unavailableFrom as Date) ?? null,
    unavailableUntil: (row.unavailableUntil as Date) ?? null,
  };
}

export async function updatePlayerProfile(
  sql: Sql,
  playerId: number,
  {
    firstName,
    lastName,
    phoneNumber,
    bio,
  }: { firstName: string; lastName: string; phoneNumber: string; bio: string },
): Promise<number> {
  const result = await sql`
    UPDATE player
    SET
      first_name = ${firstName},
      last_name = ${lastName},
      phone_number = ${phoneNumber},
      bio = ${bio}
    WHERE id = ${playerId}
  `;
  return result.count;
}

export async function getPlayerImageId(
  sql: Sql,
  playerId: number,
): Promise<string | null> {
  const [row] = await sql`
    SELECT image_id::text AS "imageId" FROM player WHERE id = ${playerId}
  `;
  return (row?.imageId as string) ?? null;
}

export async function updatePlayerImage(
  sql: Sql,
  playerId: number,
  imageId: string | null,
): Promise<number> {
  const result = await sql`
    UPDATE player
    SET image_id = ${imageId}
    WHERE id = ${playerId}
  `;
  return result.count;
}

export async function createMagicLink(
  sql: Sql,
  playerId: number,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await sql`
    INSERT INTO magic_links (player_id, token, expires_at)
    VALUES (${playerId}, ${token}, ${expiresAt.toISOString()})
    ON CONFLICT (player_id)
    DO UPDATE SET token = ${token}, expires_at = ${expiresAt.toISOString()}, created_at = CURRENT_TIMESTAMP
  `;
}

export async function verifyMagicLink(
  sql: Sql,
  token: string,
): Promise<{ playerId: number } | null> {
  const rows = await sql`
    DELETE FROM magic_links
    WHERE token = ${token} AND expires_at > NOW()
    RETURNING player_id
  `;

  return rows.length > 0 ? { playerId: rows[0].player_id } : null;
}

export async function createSession(
  sql: Sql,
  playerId: number,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await sql`
    INSERT INTO sessions (player_id, token, expires_at)
    VALUES (${playerId}, ${token}, ${expiresAt.toISOString()})
  `;
}

export async function getSessionByToken(
  sql: Sql,
  token: string,
): Promise<{ playerId: number } | null> {
  const rows = await sql`
    SELECT player_id FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `;

  return rows.length > 0 ? { playerId: rows[0].player_id } : null;
}

export async function deleteSessionByToken(
  sql: Sql,
  token: string,
): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}
