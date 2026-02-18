import type postgres from "postgres";
import { getLatestStandings } from "@/app/lib/db/season";
import { getUnavailableTeamIds, createChallenge } from "@/app/lib/db/match";
import {
  assertLegalChallenge,
  PyramidValidationError,
} from "@/app/lib/pyramid";

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

export type ChallengeTeamOpts = {
  challengerTeamId: number;
  challengeeTeamId: number;
  challengerPlayerId: number;
  challengeePlayerId: number;
  challengeText: string;
};

/**
 * Validates pyramid rules and unavailability, then creates a challenge.
 * Delegates open-challenge checks + advisory lock to createChallenge (DB layer).
 */
export async function challengeTeam(
  tx: postgres.TransactionSql,
  seasonId: number,
  clubId: number,
  opts: ChallengeTeamOpts,
): Promise<number> {
  const {
    challengerTeamId,
    challengeeTeamId,
    challengerPlayerId,
    challengeePlayerId,
    challengeText,
  } = opts;

  const standings = await getLatestStandings(tx, seasonId);
  if (!standings) {
    throw new IllegalChallengeError("No standings found for season");
  }

  try {
    assertLegalChallenge(standings.results, challengerTeamId, challengeeTeamId);
  } catch (e) {
    if (e instanceof PyramidValidationError) {
      throw new IllegalChallengeError(e.message);
    }
    throw e;
  }

  const unavailable = await getUnavailableTeamIds(tx, seasonId);
  if (unavailable.has(challengerTeamId)) {
    throw new UnavailableTeamError(challengerTeamId);
  }
  if (unavailable.has(challengeeTeamId)) {
    throw new UnavailableTeamError(challengeeTeamId);
  }

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
