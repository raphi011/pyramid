"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import { updatePlayerProfile } from "@/app/lib/db/auth";
import { sql } from "@/app/lib/db";

export type OnboardingState = {
  error?: string;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const name = (formData.get("name") as string)?.trim();
  const phoneNumber = (formData.get("phone") as string)?.trim() ?? "";

  if (!name) {
    return { error: "Name ist erforderlich" };
  }

  await updatePlayerProfile(sql, session.playerId, { name, phoneNumber });

  redirect("/");
}
