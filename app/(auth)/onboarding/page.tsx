import { redirect } from "next/navigation";
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
