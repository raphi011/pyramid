"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import { parseFormData } from "@/app/lib/action-utils";

// ── Result type ─────────────────────────────────────────

export type ActionResult = { success: true } | { error: string };

// ── Schemas ─────────────────────────────────────────────

const inviteMemberSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1),
});

const updateMemberRoleSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  role: z.enum(["admin", "player"]),
});

const removeMemberSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
});

// ── Helpers ─────────────────────────────────────────────

async function requireAdmin(clubId: number): Promise<{ error?: string }> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "memberManagement.error.unauthorized" };

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") return { error: "memberManagement.error.unauthorized" };

  return {};
}

async function getAdminCount(clubId: number): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM club_members
    WHERE club_id = ${clubId} AND role = 'admin'
  `;
  return (rows[0] as { count: number }).count;
}

// ── Actions ─────────────────────────────────────────────

export async function inviteMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(inviteMemberSchema, formData);
  if (!parsed.success) {
    return { error: "memberManagement.error.invalidInput" };
  }
  const { clubId, email, name } = parsed.data;

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  // Check if player with this email already exists
  const existingPlayers = await sql`
    SELECT id FROM player WHERE email_address = ${email}
  `;

  let playerId: number;

  if (existingPlayers.length > 0) {
    playerId = (existingPlayers[0] as { id: number }).id;
  } else {
    // Create new player: first word = firstName, rest = lastName
    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    const inserted = await sql`
      INSERT INTO player (first_name, last_name, email_address, created)
      VALUES (${firstName}, ${lastName}, ${email}, NOW())
      RETURNING id
    `;
    playerId = (inserted[0] as { id: number }).id;
  }

  // Check if already a member
  const existing = await sql`
    SELECT 1 FROM club_members
    WHERE player_id = ${playerId} AND club_id = ${clubId}
  `;

  if (existing.length > 0) {
    return { error: "memberManagement.error.alreadyMember" };
  }

  await sql`
    INSERT INTO club_members (player_id, club_id, role, created)
    VALUES (${playerId}, ${clubId}, 'player', NOW())
  `;

  revalidatePath(`/admin/club/${clubId}/members`);
  return { success: true };
}

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(updateMemberRoleSchema, formData);
  if (!parsed.success) {
    return { error: "memberManagement.error.invalidInput" };
  }
  const { clubId, memberId, role } = parsed.data;

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  // If demoting to player, ensure at least 1 admin remains
  if (role === "player") {
    const adminCount = await getAdminCount(clubId);
    if (adminCount < 2) {
      return { error: "memberManagement.error.lastAdmin" };
    }
  }

  await sql`
    UPDATE club_members
    SET role = ${role}
    WHERE player_id = ${memberId} AND club_id = ${clubId}
  `;

  revalidatePath(`/admin/club/${clubId}/members`);
  return { success: true };
}

export async function removeMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(removeMemberSchema, formData);
  if (!parsed.success) {
    return { error: "memberManagement.error.invalidInput" };
  }
  const { clubId, memberId } = parsed.data;

  const authCheck = await requireAdmin(clubId);
  if (authCheck.error) return { error: authCheck.error };

  // Check if removing an admin — ensure at least 1 admin remains
  const memberRole = await sql`
    SELECT role FROM club_members
    WHERE player_id = ${memberId} AND club_id = ${clubId}
  `;

  if (
    memberRole.length > 0 &&
    (memberRole[0] as { role: string }).role === "admin"
  ) {
    const adminCount = await getAdminCount(clubId);
    if (adminCount < 2) {
      return { error: "memberManagement.error.lastAdmin" };
    }
  }

  await sql`
    DELETE FROM club_members
    WHERE player_id = ${memberId} AND club_id = ${clubId}
  `;

  revalidatePath(`/admin/club/${clubId}/members`);
  return { success: true };
}
