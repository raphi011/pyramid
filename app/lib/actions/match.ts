"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getMatchById,
  getDateProposals,
  createDateProposal,
  acceptDateProposal,
  declineDateProposal,
  removeDateProposal,
  withdrawMatch,
  disputeMatchResult,
  MatchStatusConflictError,
  createMatchComment,
  updateMatchImage,
  getMatchImageId,
} from "@/app/lib/db/match";
import {
  submitResult,
  confirmResult,
  forfeitAndUpdateStandings,
  InvalidScoresError,
} from "@/app/lib/domain/match";
import { postgresImageStorage } from "@/app/lib/image-storage";
import { parseFormData } from "@/app/lib/action-utils";
import { getClubSlug } from "@/app/lib/db/club";
import { getSeasonSlug } from "@/app/lib/db/season";
import { routes } from "@/app/lib/routes";

export type MatchActionResult = { success: true } | { error: string };

async function revalidateMatch(
  matchId: number,
  clubId: number,
  seasonId: number,
) {
  try {
    const [clubSlug, seasonSlug] = await Promise.all([
      getClubSlug(sql, clubId),
      getSeasonSlug(sql, seasonId),
    ]);
    if (clubSlug && seasonSlug) {
      revalidatePath(routes.match(clubSlug, seasonSlug, matchId));
      revalidatePath(routes.season(clubSlug, seasonSlug));
    } else {
      console.error(
        `[revalidateMatch] Missing slug for match ${matchId}: clubSlug=${clubSlug}, seasonSlug=${seasonSlug}`,
      );
    }
  } catch (error) {
    console.error(
      `[revalidateMatch] Failed to revalidate match ${matchId}:`,
      error,
    );
  }
}

// ── Schemas ──────────────────────────────────────────

const matchIdSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

const proposalAndMatchSchema = z.object({
  proposalId: z.coerce.number().int().positive(),
  matchId: z.coerce.number().int().positive(),
});

const proposeDateSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  proposedDatetime: z
    .string()
    .min(1)
    .transform((v, ctx) => {
      const d = new Date(v);
      if (isNaN(d.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
        return z.NEVER;
      }
      return d;
    }),
});

const scoreArray = z
  .string()
  .transform((v, ctx) => {
    try {
      return JSON.parse(v) as unknown;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
      return z.NEVER;
    }
  })
  .pipe(z.array(z.number().int().min(0)));

const enterResultSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  team1Score: scoreArray,
  team2Score: scoreArray,
  imageId: z.string().default(""),
});

const EMPTY = "empty" as const;
const TOO_LONG = "too_long" as const;

const disputeSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1, EMPTY).max(500, TOO_LONG),
});

const commentSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  comment: z.string().trim().min(1, EMPTY).max(2000, TOO_LONG),
});

// ── Propose Date ──────────────────────────────────────

export async function proposeDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(proposeDateSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.invalidInput" };
  const { matchId, proposedDatetime: parsedDate } = parsed.data;

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

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Accept Date ───────────────────────────────────────

export async function acceptDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(proposalAndMatchSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.proposalNotFound" };
  const { proposalId, matchId } = parsed.data;

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

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Decline Date ──────────────────────────────────────

export async function declineDateAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(proposalAndMatchSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.proposalNotFound" };
  const { proposalId, matchId } = parsed.data;

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

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Remove Date Proposal ─────────────────────────────

export async function removeDateProposalAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(proposalAndMatchSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.proposalNotFound" };
  const { proposalId, matchId } = parsed.data;

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
      await removeDateProposal(tx, proposalId, matchId, player.id);
    });
  } catch (e) {
    console.error("removeDateProposalAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Enter Result ──────────────────────────────────────

export async function enterResultAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(enterResultSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.invalidScores" };
  const { matchId, team1Score, team2Score } = parsed.data;
  const imageId = parsed.data.imageId || null;

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

  if (imageId) {
    const owned = await postgresImageStorage.isOwnedBy(sql, imageId, player.id);
    if (!owned) return { error: "matchDetail.error.serverError" };
  }

  try {
    await sql.begin(async (tx) => {
      await submitResult(tx, matchId, player.id, team1Score, team2Score);
      if (imageId) {
        await updateMatchImage(tx, matchId, imageId);
      }
    });
  } catch (e) {
    if (e instanceof InvalidScoresError) {
      return { error: "matchDetail.error.invalidScores" };
    }
    console.error("enterResultAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Confirm Result ────────────────────────────────────

export async function confirmResultAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(matchIdSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.notFound" };
  const { matchId } = parsed.data;

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
      await confirmResult(tx, matchId, player.id);
    });
  } catch (e) {
    console.error("confirmResultAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Withdraw ─────────────────────────────────────

export async function withdrawAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(matchIdSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.notFound" };
  const { matchId } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  if (match.status !== "challenged" && match.status !== "date_set") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  // Only the challenger (team1) can withdraw
  if (player.id !== match.team1PlayerId) {
    return { error: "matchDetail.error.notChallenger" };
  }

  try {
    await sql.begin(async (tx) => {
      await withdrawMatch(
        tx,
        matchId,
        player.id,
        match.clubId,
        match.seasonId,
        match.team2PlayerId,
      );
    });
  } catch (e) {
    if (e instanceof MatchStatusConflictError) {
      return { error: "matchDetail.error.statusConflict" };
    }
    console.error("withdrawAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Forfeit ──────────────────────────────────────

export async function forfeitAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(matchIdSchema, formData);
  if (!parsed.success) return { error: "matchDetail.error.notFound" };
  const { matchId } = parsed.data;

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
      await forfeitAndUpdateStandings(tx, matchId, player.id);
    });
  } catch (e) {
    if (e instanceof MatchStatusConflictError) {
      return { error: "matchDetail.error.statusConflict" };
    }
    console.error("forfeitAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Dispute ──────────────────────────────────────

export async function disputeAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(disputeSchema, formData);
  if (!parsed.success) {
    if (parsed.fieldErrors.reason === TOO_LONG)
      return { error: "matchDetail.error.disputeReasonTooLong" };
    if (parsed.fieldErrors.reason === EMPTY)
      return { error: "matchDetail.error.disputeReasonEmpty" };
    return { error: "matchDetail.error.notFound" };
  }
  const { matchId, reason } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  if (match.status !== "pending_confirmation") {
    return { error: "matchDetail.error.invalidStatus" };
  }

  // Cannot dispute your own result entry
  if (match.resultEnteredBy === player.id) {
    return { error: "matchDetail.error.cannotDisputeOwn" };
  }

  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  const opponentPlayerId = isTeam1 ? match.team2PlayerId : match.team1PlayerId;

  try {
    await sql.begin(async (tx) => {
      await disputeMatchResult(
        tx,
        matchId,
        player.id,
        match.clubId,
        match.seasonId,
        opponentPlayerId,
        reason,
      );
    });
  } catch (e) {
    if (e instanceof MatchStatusConflictError) {
      return { error: "matchDetail.error.statusConflict" };
    }
    console.error("disputeAction transaction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}

// ── Upload Match Image ───────────────────────────────

export async function uploadMatchImageAction(
  matchId: number,
  imageId: string | null,
): Promise<MatchActionResult> {
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

  // Verify the image belongs to the current player
  if (imageId) {
    const owned = await postgresImageStorage.isOwnedBy(sql, imageId, player.id);
    if (!owned) return { error: "matchDetail.error.serverError" };
  }

  try {
    await sql.begin(async (tx) => {
      const oldImageId = await getMatchImageId(tx, matchId);
      const count = await updateMatchImage(tx, matchId, imageId);
      if (count === 0) throw new Error(`Match ${matchId} not found`);
      if (oldImageId && oldImageId !== imageId) {
        await postgresImageStorage.delete(tx, oldImageId);
      }
    });
  } catch (e) {
    console.error("uploadMatchImageAction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);
  return { success: true };
}

// ── Post Comment ─────────────────────────────────────

export async function postCommentAction(
  formData: FormData,
): Promise<MatchActionResult> {
  const parsed = parseFormData(commentSchema, formData);
  if (!parsed.success) {
    if (parsed.fieldErrors.comment === TOO_LONG)
      return { error: "matchDetail.error.commentTooLong" };
    if (parsed.fieldErrors.comment === EMPTY)
      return { error: "matchDetail.error.commentEmpty" };
    return { error: "matchDetail.error.notFound" };
  }
  const { matchId, comment } = parsed.data;

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
    await sql.begin(async (tx) => {
      await createMatchComment(tx, matchId, player.id, comment);
    });
  } catch (e) {
    console.error("postCommentAction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  await revalidateMatch(matchId, match.clubId, match.seasonId);

  return { success: true };
}
