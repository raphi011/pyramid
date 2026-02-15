"use server";

import { getCurrentPlayer, setThemeCookie } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { updatePlayerTheme, type Theme } from "@/app/lib/db/auth";

const VALID_THEMES: Theme[] = ["auto", "light", "dark"];

export type ThemeResult = { success: true } | { error: string };

export async function updateThemeAction(theme: string): Promise<ThemeResult> {
  if (!VALID_THEMES.includes(theme as Theme)) {
    return { error: "settings.error.invalidTheme" };
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "settings.error.notAuthenticated" };
  }

  try {
    const count = await updatePlayerTheme(sql, player.id, theme as Theme);
    if (count === 0) {
      return { error: "settings.error.notAuthenticated" };
    }
    await setThemeCookie(theme as Theme);
  } catch (e) {
    console.error("updateThemeAction failed:", e);
    return { error: "settings.error.serverError" };
  }

  return { success: true };
}
