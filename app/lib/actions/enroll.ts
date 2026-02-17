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

const enrollSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
});

export type EnrollResult = { success: true } | { error: string };

export async function enrollInSeasonAction(
  formData: FormData,
): Promise<EnrollResult> {
  const parsed = parseFormData(enrollSchema, formData);
  if (!parsed.success) {
    return { error: "enrollment.error.invalidInput" };
  }
  const { seasonId, clubId } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "enrollment.error.notAuthenticated" };
  }

  // IDOR prevention: verify player belongs to this club
  if (!(await isClubMember(sql, player.id, clubId))) {
    return { error: "enrollment.error.notAuthenticated" };
  }

  const season = await getSeasonById(sql, seasonId);
  if (!season || season.status !== "active" || season.clubId !== clubId) {
    return { error: "enrollment.error.seasonNotActive" };
  }

  if (!season.openEnrollment) {
    return { error: "enrollment.error.enrollmentClosed" };
  }

  if (!isIndividualSeason(season)) {
    return { error: "enrollment.error.teamSeason" };
  }

  if (await isPlayerEnrolledInSeason(sql, player.id, seasonId)) {
    return { error: "enrollment.error.alreadyEnrolled" };
  }

  await sql.begin(async (tx) => {
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

  revalidatePath("/rankings");

  return { success: true };
}
