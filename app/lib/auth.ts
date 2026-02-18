import "server-only";
import { cookies } from "next/headers";
import { sql } from "./db";
import * as authRepo from "./db/auth";
import type { Theme } from "./db/auth";
import { env } from "./env";

// Re-export from server-only-free module so existing imports keep working
export { generateToken, generateInviteCode } from "./crypto";
import { generateToken } from "./crypto";

const SESSION_COOKIE_NAME = "session_token";
const THEME_COOKIE_NAME = "theme";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 7;
const THEME_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export async function createMagicLink(playerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
  );

  await authRepo.createMagicLink(sql, playerId, token, expiresAt);

  return token;
}

export async function verifyMagicLink(
  token: string,
): Promise<{ playerId: number } | null> {
  return authRepo.verifyMagicLink(sql, token);
}

export async function createSession(playerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await authRepo.createSession(sql, playerId, token, expiresAt);

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
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

  return authRepo.getSessionByToken(sql, token);
}

export async function getCurrentPlayer(): Promise<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAppAdmin: boolean;
} | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return authRepo.getPlayerById(sql, session.playerId);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await authRepo.deleteSessionByToken(sql, token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getPlayerByEmail(email: string): Promise<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
} | null> {
  return authRepo.getPlayerByEmail(sql, email);
}

export async function setThemeCookie(theme: Theme): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    httpOnly: false, // readable by inline <script> for FOUC prevention
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THEME_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getThemeCookie(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;
  if (value === "light" || value === "dark") return value;
  return "auto";
}
