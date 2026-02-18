import type postgres from "postgres";
import { getLatestStandings } from "@/app/lib/db/season";
import { getUnavailableTeamIds, createChallenge } from "@/app/lib/db/match";
import { assertLegalChallenge } from "@/app/lib/pyramid";

export class IllegalChallengeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalChallengeError";
  }
}

export class UnavailableTeamError extends Error {
  constructor(teamId: number) {
    super(`Team ${teamId} is currently unavailable`);
    this.name = "UnavailableTeamError";
  }
}

/**
 * Validates pyramid rules and unavailability, then creates a challenge.
 * Delegates open-challenge checks + advisory lock to createChallenge (DB layer).
 */
export async function challengeTeam(
  tx: postgres.TransactionSql,
  seasonId: number,
  clubId: number,
  challengerTeamId: number,
  challengeeTeamId: number,
  challengerPlayerId: number,
  challengeePlayerId: number,
  challengeText: string,
): Promise<number> {
  // 1. Get current standings
  const standings = await getLatestStandings(tx, seasonId);
  if (!standings) {
    throw new IllegalChallengeError("No standings found for season");
  }

  // 2. Validate pyramid reachability
  try {
    assertLegalChallenge(standings.results, challengerTeamId, challengeeTeamId);
  } catch (e) {
    throw new IllegalChallengeError((e as Error).message);
  }

  // 3. Check unavailability
  const unavailable = await getUnavailableTeamIds(tx, seasonId);
  if (unavailable.has(challengerTeamId)) {
    throw new UnavailableTeamError(challengerTeamId);
  }
  if (unavailable.has(challengeeTeamId)) {
    throw new UnavailableTeamError(challengeeTeamId);
  }

  // 4. Create challenge (handles open-challenge check + advisory lock + events)
  return createChallenge(
    tx,
    seasonId,
    clubId,
    challengerTeamId,
    challengeeTeamId,
    challengerPlayerId,
    challengeePlayerId,
    challengeText,
  );
}
