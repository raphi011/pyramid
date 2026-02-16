"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import type { ActionResult } from "@/app/lib/action-result";

export type { ActionResult };

// ── Schema ──────────────────────────────────────────────

const sendAnnouncementSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  message: z.string().trim().min(1).max(2000),
  sendAsEmail: z.string().transform((v) => v === "true"),
});

// ── Action ──────────────────────────────────────────────

export async function sendAnnouncementAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(sendAnnouncementSchema, formData);
  if (!parsed.success) {
    return { error: "announcements.error.invalidInput" };
  }
  const { clubId, message, sendAsEmail } = parsed.data;

  const auth = await requireClubAdmin(
    clubId,
    "announcements.error.unauthorized",
  );
  if (auth.error) return { error: auth.error };
  // auth.id is guaranteed to be a number after the error guard above
  const playerId = auth.id!;

  try {
    await sql`
      INSERT INTO events (club_id, player_id, event_type, metadata, created)
      VALUES (
        ${clubId},
        ${playerId},
        'announcement',
        ${sql.json({ message, emailed: sendAsEmail })},
        NOW()
      )
    `;
  } catch (error) {
    console.error("[sendAnnouncementAction] Failed:", { clubId, error });
    return { error: "announcements.error.serverError" };
  }

  // TODO: If sendAsEmail is true, send email blast to all club members

  revalidatePath(`/admin/club/${clubId}/announcements`);
  return { success: true };
}
