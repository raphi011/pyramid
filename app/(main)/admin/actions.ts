"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sql } from "@/app/lib/db";
import { requireAppAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { createClub, joinClub } from "@/app/lib/db/club";
import { getOrCreatePlayer } from "@/app/lib/db/player";
import type { ActionResult } from "@/app/lib/action-result";

// ── Schemas ─────────────────────────────────────────────

const toggleClubDisabledSchema = z.object({
  clubId: z.coerce.number().int().positive(),
});

const createClubSchema = z.object({
  name: z.string().trim().min(1).max(100),
  adminEmail: z.string().trim().toLowerCase().email(),
});

const addAppAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const removeAppAdminSchema = z.object({
  adminId: z.coerce.number().int().positive(),
});

// ── Actions ─────────────────────────────────────────────

export async function createClubAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(createClubSchema, formData);
  if (!parsed.success) {
    return { error: "appAdmin.error.invalidInput" };
  }
  const { name, adminEmail } = parsed.data;

  const auth = await requireAppAdmin("appAdmin.error.unauthorized");
  if (auth.error) return { error: auth.error };

  try {
    await sql.begin(async (tx) => {
      const club = await createClub(tx, { name });
      const player = await getOrCreatePlayer(tx, {
        email: adminEmail,
        firstName: "",
        lastName: "",
      });
      await joinClub(tx, player.id, club.id, "admin");
    });
  } catch (error) {
    console.error("[createClubAction] Failed:", { name, adminEmail, error });
    return { error: "appAdmin.error.clubCreationFailed" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleClubDisabledAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(toggleClubDisabledSchema, formData);
  if (!parsed.success) {
    return { error: "appAdmin.error.invalidInput" };
  }
  const { clubId } = parsed.data;

  const auth = await requireAppAdmin("appAdmin.error.unauthorized");
  if (auth.error) return { error: auth.error };

  try {
    const result = await sql`
      UPDATE clubs SET is_disabled = NOT is_disabled WHERE id = ${clubId}
    `;

    if (result.count === 0) {
      return { error: "appAdmin.error.clubNotFound" };
    }
  } catch (error) {
    console.error("[toggleClubDisabledAction] Failed:", { clubId, error });
    return { error: "appAdmin.error.serverError" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function addAppAdminAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(addAppAdminSchema, formData);
  if (!parsed.success) {
    return { error: "appAdmin.error.invalidInput" };
  }
  const { email } = parsed.data;

  const auth = await requireAppAdmin("appAdmin.error.unauthorized");
  if (auth.error) return { error: auth.error };

  try {
    const rows = await sql`
      UPDATE player SET is_app_admin = true
      WHERE email_address = ${email}
      RETURNING id
    `;

    if (rows.length === 0) {
      return { error: "appAdmin.error.playerNotFound" };
    }
  } catch (error) {
    console.error("[addAppAdminAction] Failed:", { email, error });
    return { error: "appAdmin.error.serverError" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeAppAdminAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(removeAppAdminSchema, formData);
  if (!parsed.success) {
    return { error: "appAdmin.error.invalidInput" };
  }
  const { adminId } = parsed.data;

  const auth = await requireAppAdmin("appAdmin.error.unauthorized");
  if (auth.error) return { error: auth.error };

  // Cannot remove self
  if (adminId === auth.id) {
    return { error: "appAdmin.error.cannotRemoveSelf" };
  }

  try {
    // Ensure at least 1 app admin remains after removal
    const result = await sql.begin(async (tx) => {
      const admins = await tx`
        SELECT id FROM player WHERE is_app_admin = true FOR UPDATE
      `;
      if (admins.length < 2) {
        return { error: "appAdmin.error.lastAdmin" as const };
      }

      return tx`
        UPDATE player SET is_app_admin = false WHERE id = ${adminId}
      `;
    });

    if (result && "error" in result) {
      return { error: result.error };
    }
  } catch (error) {
    console.error("[removeAppAdminAction] Failed:", { adminId, error });
    return { error: "appAdmin.error.serverError" };
  }

  revalidatePath("/admin");
  return { success: true };
}
