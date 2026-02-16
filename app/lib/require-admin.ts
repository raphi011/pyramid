import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";

type AdminResult =
  | { id: number; error?: undefined }
  | { id?: undefined; error: string };

/**
 * Verify the current user is an admin of the given club.
 * Returns the player id on success or an i18n error key on failure.
 */
export async function requireClubAdmin(
  clubId: number,
  errorKey: string,
): Promise<AdminResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: errorKey };

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") return { error: errorKey };

  return { id: player.id };
}

/**
 * Verify the current user is an app-level admin.
 * Returns the player id on success or an i18n error key on failure.
 */
export async function requireAppAdmin(errorKey: string): Promise<AdminResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: errorKey };
  if (!player.isAppAdmin) return { error: errorKey };

  return { id: player.id };
}
