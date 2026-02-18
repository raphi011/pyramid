import type postgres from "postgres";
import {
  getMatchById,
  enterMatchResult,
  confirmMatchResult,
  updateStandingsAfterResult,
  forfeitMatch,
} from "@/app/lib/db/match";
import { validateScores } from "@/app/lib/validate-scores";

export class InvalidScoresError extends Error {
  constructor() {
    super("Invalid scores");
    this.name = "InvalidScoresError";
  }
}

/**
 * Validates scores, computes the winner, and enters the match result.
 */
export async function submitResult(
  tx: postgres.TransactionSql,
  matchId: number,
  enteredBy: number,
  team1Score: number[],
  team2Score: number[],
): Promise<void> {
  const match = await getMatchById(tx, matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  // Validate scores against season's best-of setting
  if (!validateScores(team1Score, team2Score, match.seasonBestOf)) {
    throw new InvalidScoresError();
  }

  // Compute winner from game wins
  let team1Wins = 0;
  let team2Wins = 0;
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] > team2Score[i]) team1Wins++;
    else team2Wins++;
  }
  const winnerTeamId = team1Wins > team2Wins ? match.team1Id : match.team2Id;

  // Derive opponent
  const opponentPlayerId =
    enteredBy === match.team1PlayerId
      ? match.team2PlayerId
      : match.team1PlayerId;

  await enterMatchResult(
    tx,
    matchId,
    enteredBy,
    team1Score,
    team2Score,
    winnerTeamId,
    match.clubId,
    match.seasonId,
    opponentPlayerId,
  );
}

/**
 * Confirms a match result and updates standings in one operation.
 */
export async function confirmResult(
  tx: postgres.TransactionSql,
  matchId: number,
  confirmedBy: number,
): Promise<void> {
  const match = await getMatchById(tx, matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  const { winnerTeamId, team1Id, team2Id } = await confirmMatchResult(
    tx,
    matchId,
    confirmedBy,
    match.clubId,
    match.seasonId,
  );

  // team1 is always the challenger
  const challengerTeamId = team1Id;
  const loserTeamId = winnerTeamId === team1Id ? team2Id : team1Id;

  await updateStandingsAfterResult(
    tx,
    match.seasonId,
    matchId,
    winnerTeamId,
    loserTeamId,
    challengerTeamId,
  );
}

/**
 * Forfeits a match and updates standings in one operation.
 */
export async function forfeitAndUpdateStandings(
  tx: postgres.TransactionSql,
  matchId: number,
  forfeitedBy: number,
): Promise<void> {
  const match = await getMatchById(tx, matchId);
  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  // Derive opponent from the forfeiting player
  const isTeam1 = forfeitedBy === match.team1PlayerId;
  const opponentPlayerId = isTeam1 ? match.team2PlayerId : match.team1PlayerId;
  const opponentTeamId = isTeam1 ? match.team2Id : match.team1Id;

  const { winnerTeamId, team1Id, team2Id } = await forfeitMatch(
    tx,
    matchId,
    forfeitedBy,
    match.clubId,
    match.seasonId,
    opponentPlayerId,
    opponentTeamId,
  );

  const loserTeamId = winnerTeamId === team1Id ? team2Id : team1Id;
  const challengerTeamId = team1Id; // team1 is always the challenger

  await updateStandingsAfterResult(
    tx,
    match.seasonId,
    matchId,
    winnerTeamId,
    loserTeamId,
    challengerTeamId,
  );
}
