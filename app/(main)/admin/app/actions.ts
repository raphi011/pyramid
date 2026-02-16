"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { parseFormData } from "@/app/lib/action-utils";

// ── Result type ─────────────────────────────────────────

export type ActionResult = { success: true } | { error: string };

// ── Schemas ─────────────────────────────────────────────

const toggleClubDisabledSchema = z.object({
  clubId: z.coerce.number().int().positive(),
});

const addAppAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const removeAppAdminSchema = z.object({
  adminId: z.coerce.number().int().positive(),
});

// ── Helpers ─────────────────────────────────────────────

async function requireAppAdmin(): Promise<
  { id: number; error?: undefined } | { id?: undefined; error: string }
> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "appAdmin.error.unauthorized" };
  if (!player.isAppAdmin) return { error: "appAdmin.error.unauthorized" };
  return { id: player.id };
}

// ── Actions ─────────────────────────────────────────────

export async function toggleClubDisabledAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseFormData(toggleClubDisabledSchema, formData);
  if (!parsed.success) {
    return { error: "appAdmin.error.invalidInput" };
  }
  const { clubId } = parsed.data;

  const auth = await requireAppAdmin();
  if (auth.error) return { error: auth.error };

  await sql`
    UPDATE clubs SET is_disabled = NOT is_disabled WHERE id = ${clubId}
  `;

  revalidatePath("/admin/app");
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

  const auth = await requireAppAdmin();
  if (auth.error) return { error: auth.error };

  const rows = await sql`
    UPDATE player SET is_app_admin = true
    WHERE email_address = ${email}
    RETURNING id
  `;

  if (rows.length === 0) {
    return { error: "appAdmin.error.playerNotFound" };
  }

  revalidatePath("/admin/app");
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

  const auth = await requireAppAdmin();
  if (auth.error) return { error: auth.error };

  // Cannot remove self
  if (adminId === auth.id) {
    return { error: "appAdmin.error.cannotRemoveSelf" };
  }

  await sql`
    UPDATE player SET is_app_admin = false WHERE id = ${adminId}
  `;

  revalidatePath("/admin/app");
  return { success: true };
}
