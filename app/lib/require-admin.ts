import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";

type AdminResult =
  | { id: number; clubSlug: string; error: null }
  | { id: null; clubSlug: null; error: string };

/**
 * Verify the current user is an admin of the given club.
 * Returns the player id and club slug on success, or an i18n error key on failure.
 */
export async function requireClubAdmin(
  clubId: number,
  errorKey: string,
): Promise<AdminResult> {
  const player = await getCurrentPlayer();
  if (!player) return { id: null, clubSlug: null, error: errorKey };

  const rows = await sql`
    SELECT c.slug
    FROM club_members cm
    JOIN clubs c ON c.id = cm.club_id
    WHERE cm.player_id = ${player.id}
      AND cm.club_id = ${clubId}
      AND cm.role = 'admin'
  `;

  if (rows.length === 0) return { id: null, clubSlug: null, error: errorKey };

  return { id: player.id, clubSlug: rows[0].slug as string, error: null };
}

/**
 * Verify the current user is an app-level admin.
 * Returns the player id on success or an i18n error key on failure.
 */
export async function requireAppAdmin(
  errorKey: string,
): Promise<{ id: number; error: null } | { id: null; error: string }> {
  const player = await getCurrentPlayer();
  if (!player) return { id: null, error: errorKey };
  if (!player.isAppAdmin) return { id: null, error: errorKey };

  return { id: player.id, error: null };
}
