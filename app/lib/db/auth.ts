import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type Player = {
  id: number;
  name: string;
  email: string;
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

export async function updatePlayerProfile(
  sql: Sql,
  playerId: number,
  { name, phoneNumber }: { name: string; phoneNumber?: string },
): Promise<void> {
  if (phoneNumber !== undefined) {
    await sql`
      UPDATE player
      SET name = ${name}, phone_number = ${phoneNumber}
      WHERE id = ${playerId}
    `;
  } else {
    await sql`
      UPDATE player SET name = ${name} WHERE id = ${playerId}
    `;
  }
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
