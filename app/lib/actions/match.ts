"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getMatchById,
  createDateProposal,
  acceptDateProposal,
  declineDateProposal,
  enterMatchResult,
  confirmMatchResult,
  updateStandingsAfterResult,
} from "@/app/lib/db/match";

export type MatchActionResult = { success: true } | { error: string };

// ── Propose Date ──────────────────────────────────────

export async function proposeDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = Number(formData.get("matchId"));
  const proposedDatetime = formData.get("proposedDatetime") as string;

  if (!matchId || !proposedDatetime) {
    return { error: "matchDetail.error.invalidInput" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  if (match.status !== "challenged" && match.status !== "date_set") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  // Must be a participant
  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  const opponentPlayerId = isTeam1 ? match.team2PlayerId : match.team1PlayerId;

  await sql.begin(async (tx) => {
    await createDateProposal(
      tx,
      matchId,
      match.clubId,
      match.seasonId,
      player.id,
      opponentPlayerId,
      new Date(proposedDatetime),
    );
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");

  return { success: true };
}

// ── Accept Date ───────────────────────────────────────

export async function acceptDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const proposalId = Number(formData.get("proposalId"));
  const matchId = Number(formData.get("matchId"));

  if (!proposalId || !matchId) {
    return { error: "matchDetail.error.proposalNotFound" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  const proposerPlayerId = isTeam1 ? match.team2PlayerId : match.team1PlayerId;

  await sql.begin(async (tx) => {
    await acceptDateProposal(
      tx,
      proposalId,
      matchId,
      match.clubId,
      match.seasonId,
      player.id,
      proposerPlayerId,
    );
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");

  return { success: true };
}

// ── Decline Date ──────────────────────────────────────

export async function declineDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const proposalId = Number(formData.get("proposalId"));
  const matchId = Number(formData.get("matchId"));

  if (!proposalId || !matchId) {
    return { error: "matchDetail.error.proposalNotFound" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  await sql.begin(async (tx) => {
    await declineDateProposal(tx, proposalId);
  });

  revalidatePath(`/matches/${matchId}`);

  return { success: true };
}

// ── Enter Result ──────────────────────────────────────

function validateScores(
  team1Score: number[],
  team2Score: number[],
  bestOf: number,
): boolean {
  if (team1Score.length !== team2Score.length) return false;
  if (team1Score.length === 0) return false;

  // Each game must have a clear winner (no ties)
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] === team2Score[i]) return false;
    if (team1Score[i] < 0 || team2Score[i] < 0) return false;
  }

  // Count games won by each team
  let team1Wins = 0;
  let team2Wins = 0;
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] > team2Score[i]) team1Wins++;
    else team2Wins++;
  }

  // One team must have won the majority
  const majority = Math.ceil(bestOf / 2);
  if (team1Wins !== majority && team2Wins !== majority) return false;

  // The match should have ended when one team reached majority
  // (no extra games played after someone already won)
  const totalGames = team1Score.length;
  if (totalGames > bestOf) return false;

  // Verify the winning game is the last one
  let runningT1 = 0;
  let runningT2 = 0;
  for (let i = 0; i < totalGames; i++) {
    if (team1Score[i] > team2Score[i]) runningT1++;
    else runningT2++;

    // If someone reached majority before the last game, invalid
    if (
      i < totalGames - 1 &&
      (runningT1 >= majority || runningT2 >= majority)
    ) {
      return false;
    }
  }

  return true;
}

export async function enterResultAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = Number(formData.get("matchId"));
  const team1ScoreRaw = formData.get("team1Score") as string;
  const team2ScoreRaw = formData.get("team2Score") as string;

  if (!matchId || !team1ScoreRaw || !team2ScoreRaw) {
    return { error: "matchDetail.error.invalidScores" };
  }

  let team1Score: number[];
  let team2Score: number[];
  try {
    team1Score = JSON.parse(team1ScoreRaw);
    team2Score = JSON.parse(team2ScoreRaw);
  } catch {
    return { error: "matchDetail.error.invalidScores" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  if (match.status !== "challenged" && match.status !== "date_set") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  if (!validateScores(team1Score, team2Score, match.seasonBestOf)) {
    return { error: "matchDetail.error.invalidScores" };
  }

  // Determine winner
  let team1Wins = 0;
  let team2Wins = 0;
  for (let i = 0; i < team1Score.length; i++) {
    if (team1Score[i] > team2Score[i]) team1Wins++;
    else team2Wins++;
  }
  const winnerTeamId = team1Wins > team2Wins ? match.team1Id : match.team2Id;

  const opponentPlayerId = isTeam1 ? match.team2PlayerId : match.team1PlayerId;

  await sql.begin(async (tx) => {
    await enterMatchResult(
      tx,
      matchId,
      player.id,
      team1Score,
      team2Score,
      winnerTeamId,
      match.clubId,
      match.seasonId,
      opponentPlayerId,
    );
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");

  return { success: true };
}

// ── Confirm Result ────────────────────────────────────

export async function confirmResultAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = Number(formData.get("matchId"));

  if (!matchId) {
    return { error: "matchDetail.error.notFound" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  if (match.status !== "pending_confirmation") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  if (match.resultEnteredBy === player.id) {
    return { error: "matchDetail.error.cannotConfirmOwn" };
  }

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  await sql.begin(async (tx) => {
    const { winnerTeamId, team1Id, team2Id } = await confirmMatchResult(
      tx,
      matchId,
      player.id,
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
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath("/rankings");

  return { success: true };
}
