import postgres from "postgres";
import crypto from "crypto";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

/**
 * Creates a test player with a unique email.
 * Returns player id and email.
 */
export async function createTestPlayer({
  name = "",
  emailPrefix = "e2e-test",
}: { name?: string; emailPrefix?: string } = {}) {
  const email = `${emailPrefix}-${crypto.randomUUID()}@test.local`;
  const [row] = await sql`
    INSERT INTO player (name, email_address, created)
    VALUES (${name}, ${email}, NOW())
    RETURNING id
  `;
  return { id: row.id as number, email };
}

/**
 * Creates a magic link token for a player.
 * Returns the token string.
 */
export async function createTestMagicLink(
  playerId: number,
  { expired = false }: { expired?: boolean } = {},
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = expired
    ? new Date(Date.now() - 1000)
    : new Date(Date.now() + 15 * 60 * 1000);

  await sql`
    INSERT INTO magic_links (player_id, token, expires_at)
    VALUES (${playerId}, ${token}, ${expiresAt.toISOString()})
    ON CONFLICT (player_id)
    DO UPDATE SET token = ${token}, expires_at = ${expiresAt.toISOString()}, created_at = CURRENT_TIMESTAMP
  `;

  return token;
}

/**
 * Removes a test player and all associated data.
 */
export async function cleanupTestPlayer(playerId: number) {
  await sql`DELETE FROM sessions WHERE player_id = ${playerId}`;
  await sql`DELETE FROM magic_links WHERE player_id = ${playerId}`;
  await sql`DELETE FROM player WHERE id = ${playerId}`;
}

/**
 * Close the database connection (call in afterAll).
 */
export async function closeDb() {
  await sql.end();
}
