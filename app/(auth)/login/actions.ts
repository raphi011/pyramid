"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getPlayerByEmail, createMagicLink } from "@/app/lib/auth";
import { sendMagicLinkEmail } from "@/app/lib/email";
import { fullName } from "@/lib/utils";
import { parseFormData } from "@/app/lib/action-utils";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = parseFormData(loginSchema, formData);
  if (!parsed.success) {
    return { error: "login.error.emailRequired" };
  }
  const { email } = parsed.data;

  try {
    const player = await getPlayerByEmail(email);

    // Only send email if player exists (enumeration protection: always redirect)
    if (player) {
      const token = await createMagicLink(player.id);
      const emailResult = await sendMagicLinkEmail(
        player.email,
        fullName(player.firstName, player.lastName),
        token,
      );

      if (!emailResult.success) {
        console.error("Failed to send magic link email:", {
          playerId: player.id,
          error: emailResult.error,
        });
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    return { error: "login.error.generic" };
  }

  // redirect() throws — must be outside try/catch
  redirect("/check-email");
}
