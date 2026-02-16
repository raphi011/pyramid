"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import { parseFormData } from "@/app/lib/action-utils";

// ── Result type ─────────────────────────────────────────

export type ActionResult = { success: true } | { error: string };

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
        .map(Number),
    ),
});

const deleteTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
});

// ── Helpers ─────────────────────────────────────────────

async function requireAdmin(clubId: number): Promise<{ error?: string }> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "teamManagement.error.unauthorized" };

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") return { error: "teamManagement.error.unauthorized" };

  return {};
}

// ── Actions ─────────────────────────────────────────────

export async function createTeamAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(createTeamSchema, formData);
  if (!parsed.success) {
    return { error: "teamManagement.error.invalidInput" };
  }

  const { seasonId, clubId, name, memberIds } = parsed.data;

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql.begin(async (tx) => {
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
  } catch {
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

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM team_players WHERE team_id = ${teamId}
      `;
      await tx`
        DELETE FROM teams WHERE id = ${teamId} AND season_id = ${seasonId}
      `;
    });
  } catch {
    return { error: "teamManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}/teams`);
  return { success: true };
}
