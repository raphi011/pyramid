"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { isClubMember } from "@/app/lib/db/club";
import {
  getSeasonById,
  isPlayerEnrolledInSeason,
  isIndividualSeason,
  enrollPlayerInIndividualSeason,
  addTeamToStandings,
  createNewPlayerEvent,
} from "@/app/lib/db/season";
import { parseFormData } from "@/app/lib/action-utils";
import type { ActionResult } from "@/app/lib/action-result";

class AlreadyEnrolledError extends Error {}

const enrollSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
});

export async function enrollInSeasonAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(enrollSchema, formData);
  if (!parsed.success) {
    return { error: "error.invalidInput" };
  }
  const { seasonId, clubId } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "error.notAuthenticated" };
  }

  // IDOR prevention: verify player belongs to this club
  if (!(await isClubMember(sql, player.id, clubId))) {
    return { error: "error.notAuthenticated" };
  }

  const season = await getSeasonById(sql, seasonId);
  if (!season || season.status !== "active" || season.clubId !== clubId) {
    return { error: "error.seasonNotActive" };
  }

  if (!season.openEnrollment) {
    return { error: "error.enrollmentClosed" };
  }

  if (!isIndividualSeason(season)) {
    return { error: "error.teamSeason" };
  }

  if (await isPlayerEnrolledInSeason(sql, player.id, seasonId)) {
    return { error: "error.alreadyEnrolled" };
  }

  try {
    await sql.begin(async (tx) => {
      // Re-check inside transaction to prevent race condition
      if (await isPlayerEnrolledInSeason(tx, player.id, seasonId)) {
        throw new AlreadyEnrolledError();
      }
      const teamId = await enrollPlayerInIndividualSeason(
        tx,
        player.id,
        seasonId,
      );
      await addTeamToStandings(tx, seasonId, teamId);
      await createNewPlayerEvent(
        tx,
        clubId,
        player.id,
        { firstName: player.firstName, lastName: player.lastName },
        seasonId,
      );
    });
  } catch (e) {
    if (e instanceof AlreadyEnrolledError) {
      return { error: "error.alreadyEnrolled" };
    }
    console.error("enrollInSeasonAction transaction failed:", e);
    return { error: "error.serverError" };
  }

  revalidatePath("/rankings");
  revalidatePath("/club");

  return { success: true };
}
