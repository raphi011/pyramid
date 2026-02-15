"use server";

import { z } from "zod";
import { getCurrentPlayer, setThemeCookie } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { updatePlayerTheme, type Theme } from "@/app/lib/db/auth";

const themeSchema = z.enum(["auto", "light", "dark"]);

export type ThemeResult = { success: true } | { error: string };

export async function updateThemeAction(theme: string): Promise<ThemeResult> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) {
    return { error: "settings.error.invalidTheme" };
  }
  const validTheme = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "settings.error.notAuthenticated" };
  }

  try {
    const count = await updatePlayerTheme(sql, player.id, validTheme);
    if (count === 0) {
      return { error: "settings.error.notAuthenticated" };
    }
    await setThemeCookie(validTheme);
  } catch (e) {
    console.error("updateThemeAction failed:", e);
    return { error: "settings.error.serverError" };
  }

  return { success: true };
}
