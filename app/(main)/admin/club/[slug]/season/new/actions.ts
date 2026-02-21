"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { createSeason, InvalidSourceSeasonError } from "@/app/lib/db/season";
import { SlugConflictError } from "@/app/lib/db/errors";
import { routes } from "@/app/lib/routes";
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
  if (authCheck.error !== null) return { error: authCheck.error };

  let seasonSlug: string;

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
    seasonSlug = result.seasonSlug;
  } catch (error) {
    if (error instanceof InvalidSourceSeasonError) {
      return { error: "createSeason.error.invalidSourceSeason" };
    }
    if (error instanceof SlugConflictError) {
      return { error: "createSeason.error.nameTaken" };
    }
    console.error("[createSeasonAction] Failed:", { clubId, error });
    return { error: "createSeason.error.serverError" };
  }

  redirect(routes.admin.season(authCheck.clubSlug, seasonSlug));
}
