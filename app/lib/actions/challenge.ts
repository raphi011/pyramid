"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getSeasonById,
  getPlayerTeamId,
  getStandingsWithPlayers,
} from "@/app/lib/db/season";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  createChallenge,
  ChallengeConflictError,
} from "@/app/lib/db/match";
import { canChallenge } from "@/app/lib/pyramid";
import { parseFormData } from "@/app/lib/action-utils";

const createChallengeSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  challengeeTeamId: z.coerce.number().int().positive(),
  challengeText: z
    .string()
    .default("")
    .transform((v) => v.trim()),
});

export type ChallengeResult =
  | { success: true; matchId: number }
  | { error: string };

export async function createChallengeAction(
  formData: FormData,
): Promise<ChallengeResult> {
  const parsed = parseFormData(createChallengeSchema, formData);
  if (!parsed.success) {
    return { error: "challenge.error.invalidTarget" };
  }
  const { seasonId, challengeeTeamId, challengeText } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "challenge.error.notEnrolled" };
  }

  const season = await getSeasonById(sql, seasonId);
  if (!season || season.status !== "active") {
    return { error: "challenge.error.notActive" };
  }

  const challengerTeamId = await getPlayerTeamId(sql, player.id, seasonId);
  if (!challengerTeamId) {
    return { error: "challenge.error.notEnrolled" };
  }

  // Get current standings to check pyramid rules
  const { players } = await getStandingsWithPlayers(sql, seasonId);
  const challengerRank = players.find(
    (p) => p.teamId === challengerTeamId,
  )?.rank;
  const challengeeRank = players.find(
    (p) => p.teamId === challengeeTeamId,
  )?.rank;

  if (!challengerRank || !challengeeRank) {
    return { error: "challenge.error.invalidTarget" };
  }

  if (!canChallenge(challengerRank, challengeeRank)) {
    return { error: "challenge.error.invalidTarget" };
  }

  // Check open challenges
  const openTeams = await getTeamsWithOpenChallenge(sql, seasonId);
  if (openTeams.has(challengerTeamId) || openTeams.has(challengeeTeamId)) {
    return { error: "challenge.error.openChallenge" };
  }

  // Check unavailability
  const unavailable = await getUnavailableTeamIds(sql, seasonId);
  if (unavailable.has(challengerTeamId) || unavailable.has(challengeeTeamId)) {
    return { error: "challenge.error.unavailable" };
  }

  // Find challengee player ID for the event
  const challengeePlayer = players.find((p) => p.teamId === challengeeTeamId);
  if (!challengeePlayer) {
    return { error: "challenge.error.invalidTarget" };
  }

  try {
    const matchId = await sql.begin(async (tx) => {
      return createChallenge(
        tx,
        seasonId,
        season.clubId,
        challengerTeamId,
        challengeeTeamId,
        player.id,
        challengeePlayer.playerId,
        challengeText,
      );
    });

    revalidatePath("/rankings");

    return { success: true, matchId };
  } catch (e) {
    if (e instanceof ChallengeConflictError) {
      return { error: "challenge.error.openChallenge" };
    }
    throw e;
  }
}
