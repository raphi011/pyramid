"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { updatePlayerProfile } from "@/app/lib/db/auth";

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
