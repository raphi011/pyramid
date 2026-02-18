import type postgres from "postgres";
import {
  setPlayerUnavailability,
  cancelPlayerUnavailability,
  getPlayerProfile,
} from "@/app/lib/db/auth";
import { getActiveSeasons, getPlayerTeamId } from "@/app/lib/db/season";
import { getTeamsWithOpenChallenge } from "@/app/lib/db/match";

// ── Errors ────────────────────────────────────────────

export class AlreadyUnavailableError extends Error {
  constructor() {
    super("Player is already unavailable");
    this.name = "AlreadyUnavailableError";
  }
}

export class NotUnavailableError extends Error {
  constructor() {
    super("Player is not currently unavailable");
    this.name = "NotUnavailableError";
  }
}

export class InvalidDateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDateRangeError";
  }
}

export class HasOpenChallengeError extends Error {
  constructor() {
    super("Player has an open challenge");
    this.name = "HasOpenChallengeError";
  }
}

// ── Domain functions ──────────────────────────────────

export async function setUnavailability(
  tx: postgres.TransactionSql,
  playerId: number,
  clubs: { clubId: number }[],
  opts: { from: Date; until: Date | null; reason: string },
): Promise<void> {
  // 1. Validate date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = new Date(opts.from);
  fromDate.setHours(0, 0, 0, 0);

  if (fromDate < today) {
    throw new InvalidDateRangeError("From date must be today or in the future");
  }

  if (opts.until) {
    const untilDate = new Date(opts.until);
    untilDate.setHours(0, 0, 0, 0);
    if (untilDate < fromDate) {
      throw new InvalidDateRangeError(
        "Until date must be on or after from date",
      );
    }
  }

  // 2. Check player is not already unavailable
  const profile = await getPlayerProfile(tx, playerId);
  if (profile?.unavailableFrom) {
    throw new AlreadyUnavailableError();
  }

  // 3. Check player has no open challenge in any active season
  for (const { clubId } of clubs) {
    const seasons = await getActiveSeasons(tx, clubId);
    for (const season of seasons) {
      const teamId = await getPlayerTeamId(tx, playerId, season.id);
      if (!teamId) continue;

      const openTeams = await getTeamsWithOpenChallenge(tx, season.id);
      if (openTeams.has(teamId)) {
        throw new HasOpenChallengeError();
      }
    }
  }

  // 4. Write unavailability
  await setPlayerUnavailability(tx, playerId, {
    from: opts.from,
    until: opts.until,
    reason: opts.reason,
  });

  // 5. Create public 'unavailable' event per club
  const returnDate = opts.until ? opts.until.toISOString() : null;
  for (const { clubId } of clubs) {
    await tx`
      INSERT INTO events (club_id, player_id, event_type, metadata, created)
      VALUES (${clubId}, ${playerId}, 'unavailable', ${tx.json({ returnDate })}, NOW())
    `;
  }
}

export async function cancelUnavailability(
  tx: postgres.TransactionSql,
  playerId: number,
  clubs: { clubId: number }[],
): Promise<void> {
  // 1. Check player is currently unavailable
  const profile = await getPlayerProfile(tx, playerId);
  if (!profile?.unavailableFrom) {
    throw new NotUnavailableError();
  }

  // 2. Clear unavailability
  await cancelPlayerUnavailability(tx, playerId);

  // 3. Create 'available' event per club (no returnDate = available again)
  for (const { clubId } of clubs) {
    await tx`
      INSERT INTO events (club_id, player_id, event_type, metadata, created)
      VALUES (${clubId}, ${playerId}, 'unavailable', ${tx.json({ returnDate: null })}, NOW())
    `;
  }
}
