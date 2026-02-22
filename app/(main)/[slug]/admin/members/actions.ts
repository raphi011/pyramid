"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { routes } from "@/app/lib/routes";
import { getOrCreatePlayer } from "@/app/lib/db/player";
import type { ActionResult } from "@/app/lib/action-result";

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

// ── Actions ─────────────────────────────────────────────

export async function inviteMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(inviteMemberSchema, formData);
  if (!parsed.success) {
    return { error: "memberManagement.error.invalidInput" };
  }
  const { clubId, email, name } = parsed.data;

  const authCheck = await requireClubAdmin(
    clubId,
    "memberManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    await sql.begin(async (tx) => {
      const parts = name.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ") || "";

      const player = await getOrCreatePlayer(tx, {
        email,
        firstName,
        lastName,
      });

      // Add to club — ON CONFLICT prevents duplicate membership
      const memberRows = await tx`
        INSERT INTO club_members (player_id, club_id, role, created)
        VALUES (${player.id}, ${clubId}, 'player', NOW())
        ON CONFLICT (player_id, club_id) DO NOTHING
        RETURNING player_id
      `;

      if (memberRows.length === 0) {
        throw new Error("ALREADY_MEMBER");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_MEMBER") {
      return { error: "memberManagement.error.alreadyMember" };
    }
    console.error("[inviteMemberAction] Failed:", { clubId, email, error });
    return { error: "memberManagement.error.serverError" };
  }

  revalidatePath(routes.admin.members(authCheck.clubSlug ?? ""));
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

  const authCheck = await requireClubAdmin(
    clubId,
    "memberManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    const result = await sql.begin(async (tx) => {
      // If demoting to player, lock admin rows and check count
      if (role === "player") {
        const admins = await tx`
          SELECT player_id FROM club_members
          WHERE club_id = ${clubId} AND role = 'admin'
          FOR UPDATE
        `;
        if (admins.length < 2) {
          return { error: "memberManagement.error.lastAdmin" as const };
        }
      }

      return tx`
        UPDATE club_members
        SET role = ${role}
        WHERE player_id = ${memberId} AND club_id = ${clubId}
      `;
    });

    if (result && "error" in result) {
      return { error: result.error };
    }
  } catch (error) {
    console.error("[updateMemberRoleAction] Failed:", {
      clubId,
      memberId,
      role,
      error,
    });
    return { error: "memberManagement.error.serverError" };
  }

  revalidatePath(routes.admin.members(authCheck.clubSlug ?? ""));
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

  const authCheck = await requireClubAdmin(
    clubId,
    "memberManagement.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  try {
    const result = await sql.begin(async (tx) => {
      // Check if removing an admin — lock and ensure at least 1 remains
      const memberRole = await tx`
        SELECT role FROM club_members
        WHERE player_id = ${memberId} AND club_id = ${clubId}
        FOR UPDATE
      `;

      if (
        memberRole.length > 0 &&
        (memberRole[0] as { role: string }).role === "admin"
      ) {
        const admins = await tx`
          SELECT player_id FROM club_members
          WHERE club_id = ${clubId} AND role = 'admin'
          FOR UPDATE
        `;
        if (admins.length < 2) {
          return { error: "memberManagement.error.lastAdmin" as const };
        }
      }

      return tx`
        DELETE FROM club_members
        WHERE player_id = ${memberId} AND club_id = ${clubId}
      `;
    });

    if (result && "error" in result) {
      return { error: result.error };
    }
  } catch (error) {
    console.error("[removeMemberAction] Failed:", { clubId, memberId, error });
    return { error: "memberManagement.error.serverError" };
  }

  revalidatePath(routes.admin.members(authCheck.clubSlug ?? ""));
  return { success: true };
}
