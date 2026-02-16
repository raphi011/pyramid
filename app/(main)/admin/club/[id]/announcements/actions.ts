"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import { parseFormData } from "@/app/lib/action-utils";

// ── Result type ─────────────────────────────────────────

export type ActionResult = { success: true } | { error: string };

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

  const player = await getCurrentPlayer();
  if (!player) return { error: "announcements.error.unauthorized" };

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") return { error: "announcements.error.unauthorized" };

  await sql`
    INSERT INTO events (club_id, player_id, event_type, metadata, created)
    VALUES (
      ${clubId},
      ${player.id},
      'announcement',
      ${sql.json({ message, emailed: sendAsEmail })},
      NOW()
    )
  `;

  // TODO: If sendAsEmail is true, send email blast to all club members

  revalidatePath(`/admin/club/${clubId}/announcements`);
  return { success: true };
}
