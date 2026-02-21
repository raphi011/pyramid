"use server";

import { z } from "zod";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { upsertNotificationPreferences } from "@/app/lib/db/auth";
import type { ActionResult } from "@/app/lib/action-result";

const prefsSchema = z.object({
  emailEnabled: z.boolean(),
  challengeEmails: z.boolean(),
  resultEmails: z.boolean(),
  reminderEmails: z.boolean(),
});

export async function updateNotificationPreferencesAction(
  prefs: unknown,
): Promise<ActionResult> {
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) {
    return { error: "settings.error.invalidInput" };
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "settings.error.notAuthenticated" };
  }

  try {
    await upsertNotificationPreferences(sql, player.id, parsed.data);
  } catch (e) {
    console.error("updateNotificationPreferencesAction failed:", e);
    return { error: "settings.error.serverError" };
  }

  return { success: true };
}
