import { cookies } from "next/headers";
import { sql } from "./db";
import * as authRepo from "./db/auth";
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

  return authRepo.getSessionByToken(sql, token);
}

export async function getCurrentPlayer(): Promise<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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

export async function getPlayerByEmail(
  email: string,
): Promise<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
} | null> {
  return authRepo.getPlayerByEmail(sql, email);
}
