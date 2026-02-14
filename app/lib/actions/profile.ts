"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  updatePlayerProfile,
  updatePlayerImage,
  getPlayerImageId,
} from "@/app/lib/db/auth";
import { postgresImageStorage } from "@/app/lib/image-storage";

export type ProfileResult = { success: true } | { error: string };

export async function updateProfileAction(
  formData: FormData,
): Promise<ProfileResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const phoneNumber = ((formData.get("phoneNumber") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();

  if (!name) {
    return { error: "profile.error.nameRequired" };
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "profile.error.notAuthenticated" };
  }

  try {
    const count = await updatePlayerProfile(sql, player.id, {
      name,
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
