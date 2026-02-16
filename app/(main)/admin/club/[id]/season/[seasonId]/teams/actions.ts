"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import type { ActionResult } from "@/app/lib/action-result";

export type { ActionResult };

// ── Schemas ─────────────────────────────────────────────

const createTeamSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  memberIds: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(Number)
        .filter((n) => !Number.isNaN(n)),
    ),
});

const deleteTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
});

// ── Actions ─────────────────────────────────────────────

export async function createTeamAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(createTeamSchema, formData);
  if (!parsed.success) {
    return { error: "teamManagement.error.invalidInput" };
  }

  const { seasonId, clubId, name, memberIds } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "teamManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql.begin(async (tx) => {
      // Verify season belongs to this club
      const seasonCheck = await tx`
        SELECT 1 FROM seasons WHERE id = ${seasonId} AND club_id = ${clubId}
      `;
      if (seasonCheck.length === 0) {
        throw new Error("SEASON_NOT_FOUND");
      }

      const inserted = await tx`
        INSERT INTO teams (season_id, name, opted_out, created)
        VALUES (${seasonId}, ${name}, false, NOW())
        RETURNING id
      `;

      const teamId = (inserted[0] as { id: number }).id;

      for (const playerId of memberIds) {
        await tx`
          INSERT INTO team_players (team_id, player_id, created)
          VALUES (${teamId}, ${playerId}, NOW())
        `;
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_NOT_FOUND") {
      return { error: "teamManagement.error.seasonNotFound" };
    }
    console.error("[createTeamAction] Failed:", { seasonId, clubId, error });
    return { error: "teamManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}/teams`);
  return { success: true };
}

export async function deleteTeamAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(deleteTeamSchema, formData);
  if (!parsed.success) {
    return { error: "teamManagement.error.invalidInput" };
  }

  const { teamId, seasonId, clubId } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "teamManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql.begin(async (tx) => {
      // Verify season belongs to this club
      const seasonCheck = await tx`
        SELECT 1 FROM seasons WHERE id = ${seasonId} AND club_id = ${clubId}
      `;
      if (seasonCheck.length === 0) {
        throw new Error("SEASON_NOT_FOUND");
      }

      // Only delete team_players for a team that belongs to this season
      await tx`
        DELETE FROM team_players
        WHERE team_id = ${teamId}
          AND team_id IN (SELECT id FROM teams WHERE season_id = ${seasonId})
      `;
      await tx`
        DELETE FROM teams WHERE id = ${teamId} AND season_id = ${seasonId}
      `;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SEASON_NOT_FOUND") {
      return { error: "teamManagement.error.seasonNotFound" };
    }
    console.error("[deleteTeamAction] Failed:", {
      teamId,
      seasonId,
      clubId,
      error,
    });
    return { error: "teamManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}/teams`);
  return { success: true };
}
