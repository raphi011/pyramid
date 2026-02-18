import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

// ── Mutations ─────────────────────────────────────────

/**
 * Upsert a player by email address.
 * If a player with the given email already exists, the row is returned unchanged
 * (the no-op UPDATE ensures RETURNING works on both insert and conflict paths).
 */
export async function createPlayer(
  sql: Sql,
  {
    email,
    firstName,
    lastName,
  }: { email: string; firstName: string; lastName: string },
): Promise<Player> {
  const [row] = await sql`
    INSERT INTO player (first_name, last_name, email_address, created)
    VALUES (${firstName}, ${lastName}, ${email}, NOW())
    ON CONFLICT (email_address) DO UPDATE SET email_address = EXCLUDED.email_address
    RETURNING id, first_name AS "firstName", last_name AS "lastName", email_address AS email
  `;

  return {
    id: row.id as number,
    firstName: row.firstName as string,
    lastName: row.lastName as string,
    email: row.email as string,
  };
}
