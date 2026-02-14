"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getMatchById,
  getDateProposals,
  createDateProposal,
  acceptDateProposal,
  declineDateProposal,
  enterMatchResult,
  confirmMatchResult,
  updateStandingsAfterResult,
  createMatchComment,
} from "@/app/lib/db/match";
import { validateScores } from "@/app/lib/validate-scores";

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

  const parsedDate = new Date(proposedDatetime);
  if (isNaN(parsedDate.getTime())) {
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

  try {
    await sql.begin(async (tx) => {
      await createDateProposal(
        tx,
        matchId,
        match.clubId,
        match.seasonId,
        player.id,
        opponentPlayerId,
        parsedDate,
      );
    });
  } catch (e) {
    console.error("proposeDateAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/rankings");

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

  if (match.status !== "challenged" && match.status !== "date_set") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  // Verify the current player is not accepting their own proposal
  const proposals = await getDateProposals(sql, matchId);
  const proposal = proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.proposedBy === player.id) {
    return { error: "matchDetail.error.proposalNotFound" };
  }

  try {
    await sql.begin(async (tx) => {
      await acceptDateProposal(
        tx,
        proposalId,
        matchId,
        match.clubId,
        match.seasonId,
        player.id,
        proposal.proposedBy,
      );
    });
  } catch (e) {
    console.error("acceptDateAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/rankings");

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

  if (match.status !== "challenged" && match.status !== "date_set") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  try {
    await sql.begin(async (tx) => {
      await declineDateProposal(tx, proposalId, matchId);
    });
  } catch (e) {
    console.error("declineDateAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/rankings");

  return { success: true };
}

// ── Enter Result ──────────────────────────────────────

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

  try {
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
  } catch (e) {
    console.error("enterResultAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/rankings");

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

  try {
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
  } catch (e) {
    console.error("confirmResultAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/rankings");

  return { success: true };
}

// ── Post Comment ─────────────────────────────────────

export async function postCommentAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const matchId = Number(formData.get("matchId"));
  const comment = (formData.get("comment") as string | null) ?? "";

  if (!matchId) {
    return { error: "matchDetail.error.notFound" };
  }

  const trimmed = comment.trim();
  if (!trimmed) {
    return { error: "matchDetail.error.commentEmpty" };
  }
  if (trimmed.length > 2000) {
    return { error: "matchDetail.error.commentTooLong" };
  }

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  // Must be a participant
  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  try {
    await createMatchComment(sql, matchId, player.id, trimmed);
  } catch (e) {
    console.error("postCommentAction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);

  return { success: true };
}
