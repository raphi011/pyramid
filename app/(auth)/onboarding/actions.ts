"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/app/lib/auth";
import { updatePlayerProfile } from "@/app/lib/db/auth";
import { sql } from "@/app/lib/db";
import { parseFormData } from "@/app/lib/action-utils";

const onboardingSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z
    .string()
    .default("")
    .transform((v) => v.trim()),
});

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

  const parsed = parseFormData(onboardingSchema, formData);
  if (!parsed.success) {
    const t = await getTranslations("onboarding");
    return { error: t("nameRequired") };
  }
  const { firstName, lastName, phone: phoneNumber } = parsed.data;

  try {
    const count = await updatePlayerProfile(sql, session.playerId, {
      firstName,
      lastName,
      phoneNumber,
      bio: "",
    });
    if (count === 0) {
      const t = await getTranslations("onboarding");
      return { error: t("serverError") };
    }
  } catch (error) {
    console.error("Onboarding profile update failed:", error);
    const t = await getTranslations("onboarding");
    return { error: t("serverError") };
  }

  redirect("/");
}
