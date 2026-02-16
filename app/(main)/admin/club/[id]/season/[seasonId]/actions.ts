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

const updateSeasonSchema = z.object({
  seasonId: z.coerce.number().int().positive(),
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  bestOf: z.coerce.number().int(),
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

// ── Helpers ─────────────────────────────────────────────

async function requireAdmin(clubId: number): Promise<{ error?: string }> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "seasonManagement.error.unauthorized" };

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") return { error: "seasonManagement.error.unauthorized" };

  return {};
}

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

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql`
      UPDATE seasons
      SET
        name = ${name},
        best_of = ${bestOf},
        match_deadline_days = ${matchDeadlineDays},
        reminder_after_days = ${reminderDays},
        requires_result_confirmation = ${requiresConfirmation},
        open_enrollment = ${openEnrollment}
      WHERE id = ${seasonId}
    `;
  } catch {
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

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql`
      UPDATE seasons
      SET status = 'active', started_at = NOW()
      WHERE id = ${seasonId} AND status = 'draft'
    `;
  } catch {
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

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql`
      UPDATE seasons
      SET status = 'ended', ended_at = NOW()
      WHERE id = ${seasonId} AND status = 'active'
    `;
  } catch {
    return { error: "seasonManagement.error.serverError" };
  }

  revalidatePath(`/admin/club/${clubId}/season/${seasonId}`);
  return { success: true };
}
