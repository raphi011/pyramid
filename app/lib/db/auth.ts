import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type Player = {
  id: number;
  name: string;
  email: string;
};

export type PlayerProfile = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  bio: string;
  unavailableFrom: Date | null;
  unavailableUntil: Date | null;
};

// ── Queries ────────────────────────────────────────────

export async function getPlayerByEmail(
  sql: Sql,
  email: string,
): Promise<Player | null> {
  const rows = await sql`
    SELECT id, name, email_address AS email FROM player
    WHERE LOWER(email_address) = LOWER(${email})
  `;

  return rows.length > 0
    ? { id: rows[0].id, name: rows[0].name, email: rows[0].email }
    : null;
}

export async function getPlayerById(
  sql: Sql,
  playerId: number,
): Promise<Player | null> {
  const rows = await sql`
    SELECT id, name, email_address AS email FROM player
    WHERE id = ${playerId}
  `;

  return rows.length > 0
    ? { id: rows[0].id, name: rows[0].name, email: rows[0].email }
    : null;
}

export async function getPlayerProfile(
  sql: Sql,
  playerId: number,
): Promise<PlayerProfile | null> {
  const rows = await sql`
    SELECT
      id,
      name,
      email_address AS "email",
      phone_number AS "phoneNumber",
      bio,
      unavailable_from AS "unavailableFrom",
      unavailable_until AS "unavailableUntil"
    FROM player
    WHERE id = ${playerId}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    email: row.email as string,
    phoneNumber: row.phoneNumber as string,
    bio: row.bio as string,
    unavailableFrom: (row.unavailableFrom as Date) ?? null,
    unavailableUntil: (row.unavailableUntil as Date) ?? null,
  };
}

export async function updatePlayerProfile(
  sql: Sql,
  playerId: number,
  {
    name,
    phoneNumber,
    bio,
  }: { name: string; phoneNumber?: string; bio?: string },
): Promise<void> {
  await sql`
    UPDATE player
    SET
      name = ${name},
      phone_number = COALESCE(${phoneNumber ?? null}, phone_number),
      bio = COALESCE(${bio ?? null}, bio)
    WHERE id = ${playerId}
  `;
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
