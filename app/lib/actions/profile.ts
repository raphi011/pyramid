"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  updatePlayerProfile,
  updatePlayerImage,
  getPlayerImageId,
} from "@/app/lib/db/auth";
import { postgresImageStorage } from "@/app/lib/image-storage";
import { parseFormData } from "@/app/lib/action-utils";

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .default("")
    .transform((v) => v.trim()),
  bio: z
    .string()
    .default("")
    .transform((v) => v.trim()),
});

export type ProfileResult = { success: true } | { error: string };

export async function updateProfileAction(
  formData: FormData,
): Promise<ProfileResult> {
  const parsed = parseFormData(updateProfileSchema, formData);
  if (!parsed.success) {
    return { error: "profile.error.nameRequired" };
  }
  const { firstName, lastName, phoneNumber, bio } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "profile.error.notAuthenticated" };
  }

  try {
    const count = await updatePlayerProfile(sql, player.id, {
      firstName,
      lastName,
      phoneNumber,
      bio,
    });
    if (count === 0) {
      return { error: "profile.error.notAuthenticated" };
    }
  } catch (e) {
    console.error("updateProfileAction failed:", e);
    return { error: "profile.error.serverError" };
  }

  revalidatePath("/profile");

  return { success: true };
}

export async function updateProfileImageAction(
  imageId: string | null,
): Promise<ProfileResult> {
  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "profile.error.notAuthenticated" };
  }

  // Verify the image belongs to the current player
  if (imageId) {
    const owned = await postgresImageStorage.isOwnedBy(sql, imageId, player.id);
    if (!owned) return { error: "profile.error.serverError" };
  }

  try {
    await sql.begin(async (tx) => {
      const oldImageId = await getPlayerImageId(tx, player.id);
      const count = await updatePlayerImage(tx, player.id, imageId);
      if (count === 0) throw new Error(`Player ${player.id} not found`);
      if (oldImageId && oldImageId !== imageId) {
        await postgresImageStorage.delete(tx, oldImageId);
      }
    });
  } catch (e) {
    console.error("updateProfileImageAction failed:", e);
    return { error: "profile.error.serverError" };
  }

  revalidatePath("/profile");
  revalidatePath("/rankings");

  return { success: true };
}
