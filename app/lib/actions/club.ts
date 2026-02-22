"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getPlayerClubs,
  hasOpenChallengesInClub,
  leaveClub,
} from "@/app/lib/db/club";
import type { ActionResult } from "@/app/lib/action-result";

const clubIdSchema = z.number().int().positive();

export async function leaveClubAction(clubId: number): Promise<ActionResult> {
  const parsed = clubIdSchema.safeParse(clubId);
  if (!parsed.success) {
    return { error: "settings.error.invalidInput" };
  }
  const validClubId = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "settings.error.notAuthenticated" };
  }

  let shouldRedirectToJoin = false;

  try {
    const result: { error: string } | null = await sql.begin(async (tx) => {
      // Guard: last admin check — lock admin rows
      const memberRole = await tx`
        SELECT role FROM club_members
        WHERE player_id = ${player.id} AND club_id = ${validClubId}
        FOR UPDATE
      `;

      if (memberRole.length === 0) {
        return { error: "settings.error.invalidInput" };
      }

      if ((memberRole[0] as { role: string }).role === "admin") {
        const admins = await tx`
          SELECT player_id FROM club_members
          WHERE club_id = ${validClubId} AND role = 'admin'
          FOR UPDATE
        `;
        if (admins.length < 2) {
          return { error: "settings.error.lastAdmin" };
        }
      }

      // Guard: open challenges
      const hasOpen = await hasOpenChallengesInClub(tx, player.id, validClubId);
      if (hasOpen) {
        return { error: "settings.error.openChallenge" };
      }

      await leaveClub(tx, player.id, validClubId);

      // Check if the player has any clubs left
      const remaining = await getPlayerClubs(tx, player.id);
      if (remaining.length === 0) {
        shouldRedirectToJoin = true;
      }

      return null;
    });

    if (result) {
      return { error: result.error };
    }
  } catch (error) {
    console.error("[leaveClubAction] Failed for clubId:", validClubId, error);
    return { error: "settings.error.serverError" };
  }

  revalidatePath("/settings");

  if (shouldRedirectToJoin) {
    redirect("/");
  }

  return { success: true };
}
