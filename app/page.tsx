import { redirect } from "next/navigation";
import { getCurrentPlayer } from "./lib/auth";
import { getPlayerClubs } from "./lib/db/club";
import { sql } from "./lib/db";
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

  // Redirect to join if not a member of any club
  let hasClubs = true;
  try {
    const clubs = await getPlayerClubs(sql, currentPlayer.id);
    hasClubs = clubs.length > 0;
  } catch (error) {
    console.error("Failed to check club membership:", error);
  }
  if (!hasClubs) {
    redirect("/join");
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
