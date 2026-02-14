"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/app/lib/auth";
import { updatePlayerProfile } from "@/app/lib/db/auth";
import { getPlayerClubs } from "@/app/lib/db/club";
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
    const t = await getTranslations("onboarding");
    return { error: t("nameRequired") };
  }

  await updatePlayerProfile(sql, session.playerId, {
    name,
    phoneNumber,
    bio: "",
  });

  let hasClubs = false;
  try {
    const clubs = await getPlayerClubs(sql, session.playerId);
    hasClubs = clubs.length > 0;
  } catch (error) {
    console.error("Failed to check clubs after onboarding:", error);
  }

  redirect(hasClubs ? "/" : "/join");
}
