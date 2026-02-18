"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { startSeason } from "@/app/lib/db/season";
import type { ActionResult } from "@/app/lib/action-result";

// ── Schemas ─────────────────────────────────────────────

const VALID_BEST_OF = [1, 3, 5, 7] as const;

const updateSeasonSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  bestOf: z.coerce
    .number()
    .int()
    .refine((v) => VALID_BEST_OF.includes(v as 1)),
  matchDeadlineDays: z.coerce.number().int().min(1).max(90),
  reminderDays: z.coerce.number().int().min(1).max(90),
  requiresConfirmation: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  openEnrollment: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

const seasonLifecycleSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
});

// ── Actions ─────────────────────────────────────────────

export async function updateSeasonAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(updateSeasonSchema, formData);
  if (!parsed.success) {
    return { error: "seasonManagement.error.invalidInput" };
  }

  const {
    seasonId,
    clubId,
    name,
    bestOf,
    matchDeadlineDays,
    reminderDays,
    requiresConfirmation,
    openEnrollment,
  } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "seasonManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    const result = await sql`
      UPDATE seasons
      SET
        name = ${name},
        best_of = ${bestOf},
        match_deadline_days = ${matchDeadlineDays},
        reminder_after_days = ${reminderDays},
        requires_result_confirmation = ${requiresConfirmation},
        open_enrollment = ${openEnrollment}
      WHERE id = ${seasonId} AND club_id = ${clubId}
    `;

    if (result.count === 0) {
      return { error: "seasonManagement.error.seasonNotFound" };
    }
  } catch (error) {
    console.error("[updateSeasonAction] Failed:", { seasonId, clubId, error });
    return { error: "seasonManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}`);
  return { success: true };
}

export async function startSeasonAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(seasonLifecycleSchema, formData);
  if (!parsed.success) {
    return { error: "seasonManagement.error.invalidInput" };
  }

  const { seasonId, clubId } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "seasonManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    const updated = await startSeason(sql, seasonId, clubId);
    if (!updated) {
      return { error: "seasonManagement.error.seasonNotDraft" };
    }
  } catch (error) {
    console.error("[startSeasonAction] Failed:", { seasonId, clubId, error });
    return { error: "seasonManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}`);
  return { success: true };
}

export async function endSeasonAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(seasonLifecycleSchema, formData);
  if (!parsed.success) {
    return { error: "seasonManagement.error.invalidInput" };
  }

  const { seasonId, clubId } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "seasonManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    const result = await sql`
      UPDATE seasons
      SET status = 'ended', ended_at = NOW()
      WHERE id = ${seasonId} AND club_id = ${clubId} AND status = 'active'
    `;

    if (result.count === 0) {
      return { error: "seasonManagement.error.seasonNotActive" };
    }
  } catch (error) {
    console.error("[endSeasonAction] Failed:", { seasonId, clubId, error });
    return { error: "seasonManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}`);
  return { success: true };
}
