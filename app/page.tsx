import { redirect } from "next/navigation";
import { getCurrentPlayer } from "./lib/auth";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const currentPlayer = await getCurrentPlayer();

  if (!currentPlayer) {
    redirect("/login");
  }

  // Redirect to onboarding if profile incomplete
  if (!currentPlayer.name.trim()) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Willkommen, {currentPlayer.name}!
      </h1>
      <p className="text-slate-500 dark:text-slate-400">
        Dashboard kommt bald.
      </p>
      <LogoutButton />
    </main>
  );
}
