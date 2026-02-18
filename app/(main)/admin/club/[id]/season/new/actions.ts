"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { createSeason } from "@/app/lib/db/season";
import type { ActionResultWith } from "@/app/lib/action-result";

type CreateSeasonResult = ActionResultWith<{ seasonId: number }>;

// ── Schema ──────────────────────────────────────────────

const VALID_BEST_OF = [1, 3, 5, 7] as const;

const createSeasonSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  type: z.enum(["individual", "team"]),
  teamSize: z.coerce.number().int().min(1).max(4).default(1),
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
  startingRanks: z.enum(["empty", "from_season"]),
  fromSeasonId: z.coerce.number().int().positive().optional(),
  excludedMembers: z
    .string()
    .default("")
    .transform((v) =>
      v === ""
        ? []
        : v
            .split(",")
            .map(Number)
            .filter((n) => !Number.isNaN(n)),
    ),
});

// ── Action ──────────────────────────────────────────────

export async function createSeasonAction(
  formData: FormData,
): Promise<CreateSeasonResult> {
  const parsed = parseFormData(createSeasonSchema, formData);
  if (!parsed.success) {
    return { error: "createSeason.error.invalidInput" };
  }

  const {
    clubId,
    name,
    type,
    teamSize,
    bestOf,
    matchDeadlineDays,
    reminderDays,
    requiresConfirmation,
    openEnrollment,
    startingRanks,
    fromSeasonId,
    excludedMembers,
  } = parsed.data;

  // Require fromSeasonId when copying from previous season
  if (startingRanks === "from_season" && fromSeasonId == null) {
    return { error: "createSeason.error.missingSourceSeason" };
  }

  const authCheck = await requireClubAdmin(
    clubId,
    "createSeason.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  let seasonId: number;

  try {
    const result = await sql.begin(async (tx) =>
      createSeason(tx, clubId, {
        name,
        type,
        teamSize,
        bestOf,
        matchDeadlineDays,
        reminderDays,
        requiresConfirmation,
        openEnrollment,
        startingRanks,
        fromSeasonId,
        excludedMembers,
      }),
    );
    seasonId = result.seasonId;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SOURCE_SEASON") {
      return { error: "createSeason.error.invalidSourceSeason" };
    }
    console.error("[createSeasonAction] Failed:", { clubId, error });
    return { error: "createSeason.error.serverError" };
  }

  // IMPORTANT: redirect() throws — must stay OUTSIDE the try-catch above
  redirect(`/admin/club/${clubId}/season/${seasonId}`);
}
