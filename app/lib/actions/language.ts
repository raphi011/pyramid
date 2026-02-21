"use server";

import { z } from "zod";
import { getCurrentPlayer, setLocaleCookie } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { updatePlayerLanguage } from "@/app/lib/db/auth";
import type { ActionResult } from "@/app/lib/action-result";

const localeSchema = z.enum(["de", "en"]);

export async function updateLanguageAction(
  language: string,
): Promise<ActionResult> {
  const parsed = localeSchema.safeParse(language);
  if (!parsed.success) {
    return { error: "settings.error.invalidInput" };
  }
  const locale = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "settings.error.notAuthenticated" };
  }

  try {
    const count = await updatePlayerLanguage(sql, player.id, locale);
    if (count === 0) {
      return { error: "settings.error.notAuthenticated" };
    }
    await setLocaleCookie(locale);
  } catch (e) {
    console.error("updateLanguageAction failed:", e);
    return { error: "settings.error.serverError" };
  }

  return { success: true };
}
