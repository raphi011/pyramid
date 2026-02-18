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
import { ChallengeConflictError } from "@/app/lib/db/match";
import {
  challengeTeam,
  IllegalChallengeError,
  UnavailableTeamError,
} from "@/app/lib/domain/challenge";
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

  // Find challengee player ID for the event
  const { players } = await getStandingsWithPlayers(sql, seasonId);
  const challengeePlayer = players.find((p) => p.teamId === challengeeTeamId);
  if (!challengeePlayer) {
    return { error: "challenge.error.invalidTarget" };
  }

  try {
    const matchId = await sql.begin(async (tx) => {
      return challengeTeam(tx, seasonId, season.clubId, {
        challengerTeamId,
        challengeeTeamId,
        challengerPlayerId: player.id,
        challengeePlayerId: challengeePlayer.playerId,
        challengeText,
      });
    });

    revalidatePath("/rankings");

    return { success: true, matchId };
  } catch (e) {
    if (e instanceof IllegalChallengeError) {
      return { error: "challenge.error.invalidTarget" };
    }
    if (e instanceof UnavailableTeamError) {
      return { error: "challenge.error.unavailable" };
    }
    if (e instanceof ChallengeConflictError) {
      return { error: "challenge.error.openChallenge" };
    }
    throw e;
  }
}
