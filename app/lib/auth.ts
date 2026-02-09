import { cookies } from "next/headers";
import { sql } from "./db";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "session_token";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 7;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createMagicLink(playerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
  );

  // UPSERT: inserts new or replaces existing (UNIQUE on player_id ensures single active link)
  await sql`
    INSERT INTO magic_links (player_id, token, expires_at)
    VALUES (${playerId}, ${token}, ${expiresAt.toISOString()})
    ON CONFLICT (player_id)
    DO UPDATE SET token = ${token}, expires_at = ${expiresAt.toISOString()}, created_at = CURRENT_TIMESTAMP
  `;

  return token;
}

export async function verifyMagicLink(
  token: string
): Promise<{ playerId: number } | null> {
  // Atomic: delete and return in one query to prevent replay attacks
  const result = await sql`
    DELETE FROM magic_links
    WHERE token = ${token} AND expires_at > NOW()
    RETURNING player_id
  `;

  if (result.length === 0) {
    return null;
  }

  return { playerId: result[0].player_id };
}

export async function createSession(playerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await sql`
    INSERT INTO sessions (player_id, token, expires_at)
    VALUES (${playerId}, ${token}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getSession(): Promise<{ playerId: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const result = await sql`
    SELECT player_id FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `;

  if (result.length === 0) {
    return null;
  }

  return { playerId: result[0].player_id };
}

export async function getCurrentPlayer(): Promise<{
  id: number;
  name: string;
  email: string;
} | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const result = await sql`
    SELECT id, name, email FROM player
    WHERE id = ${session.playerId}
  `;

  if (result.length === 0) {
    return null;
  }

  return {
    id: result[0].id,
    name: result[0].name,
    email: result[0].email,
  };
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getPlayerByEmail(
  email: string
): Promise<{ id: number; name: string; email: string } | null> {
  const result = await sql`
    SELECT id, name, email FROM player
    WHERE LOWER(email) = LOWER(${email})
  `;

  if (result.length === 0) {
    return null;
  }

  return {
    id: result[0].id,
    name: result[0].name,
    email: result[0].email,
  };
}
