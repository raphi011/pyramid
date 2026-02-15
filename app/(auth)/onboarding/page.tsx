import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Willkommen" };
import { getCurrentPlayer } from "@/app/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  // Already has both names — skip onboarding
  if (player.firstName.trim() && player.lastName.trim()) {
    redirect("/");
  }

  return <OnboardingForm />;
}
