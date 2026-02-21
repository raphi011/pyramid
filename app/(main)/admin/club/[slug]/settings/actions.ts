"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import {
  updateClub,
  getClubImageId,
  regenerateClubInviteCode,
} from "@/app/lib/db/club";
import { postgresImageStorage } from "@/app/lib/image-storage";
import type { ActionResult, ActionResultWith } from "@/app/lib/action-result";
import { SlugConflictError } from "@/app/lib/db/errors";

class ClubNotFoundError extends Error {}

function revalidateClub(clubSlug: string) {
  revalidatePath(`/admin/club/${clubSlug}/settings`);
  revalidatePath(`/admin/club/${clubSlug}`);
  revalidatePath(`/club/${clubSlug}`);
}

// ── Schemas ─────────────────────────────────────────────

const optionalTrimmed = z
  .string()
  .default("")
  .transform((v) => v.trim());

const updateClubSettingsSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  url: optionalTrimmed.pipe(
    z.string().refine((v) => v === "" || URL.canParse(v), "Invalid URL"),
  ),
  phoneNumber: optionalTrimmed,
  address: optionalTrimmed,
  city: optionalTrimmed,
  zip: optionalTrimmed,
  country: optionalTrimmed,
  imageId: z
    .string()
    .default("")
    .transform((v) => v.trim() || null),
});

const regenerateInviteCodeSchema = z.object({
  clubId: z.coerce.number().int().positive(),
});

// ── Actions ─────────────────────────────────────────────

export async function updateClubSettingsAction(
  formData: FormData,
): Promise<ActionResultWith<{ slug: string }>> {
  const parsed = parseFormData(updateClubSettingsSchema, formData);
  if (!parsed.success) {
    if (parsed.fieldErrors.url) {
      return { error: "clubSettings.error.invalidUrl" };
    }
    return { error: "clubSettings.error.nameRequired" };
  }

  const { clubId, imageId, ...data } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "clubSettings.error.unauthorized",
  );
  if (authCheck.error !== null) return { error: authCheck.error };
  const oldSlug = authCheck.clubSlug;

  let newSlug: string;

  try {
    newSlug = await sql.begin(async (tx) => {
      const oldImageId = await getClubImageId(tx, clubId);
      const { count, slug } = await updateClub(tx, clubId, {
        ...data,
        imageId,
      });
      if (count === 0) throw new ClubNotFoundError();
      if (oldImageId && oldImageId !== imageId) {
        await postgresImageStorage.delete(tx, oldImageId);
      }
      return slug;
    });
  } catch (error) {
    if (error instanceof ClubNotFoundError) {
      return { error: "clubSettings.error.notFound" };
    }
    if (error instanceof SlugConflictError) {
      return { error: "clubSettings.error.nameTaken" };
    }
    console.error("[updateClubSettingsAction] Failed:", { clubId, error });
    return { error: "clubSettings.error.serverError" };
  }

  revalidateClub(oldSlug);
  if (newSlug !== oldSlug) {
    revalidateClub(newSlug);
  }
  return { success: true, slug: newSlug };
}

export async function regenerateInviteCodeAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(regenerateInviteCodeSchema, formData);
  if (!parsed.success) {
    return { error: "clubSettings.error.serverError" };
  }

  const { clubId } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "clubSettings.error.unauthorized",
  );
  if (authCheck.error !== null) return { error: authCheck.error };

  try {
    const updated = await regenerateClubInviteCode(sql, clubId);
    if (!updated) {
      return { error: "clubSettings.error.notFound" };
    }
  } catch (error) {
    console.error("[regenerateInviteCodeAction] Failed:", { clubId, error });
    return { error: "clubSettings.error.serverError" };
  }

  revalidateClub(authCheck.clubSlug);
  return { success: true };
}
