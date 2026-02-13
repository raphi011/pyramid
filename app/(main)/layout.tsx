import { redirect } from "next/navigation";
import { getCurrentPlayer } from "../lib/auth";
import { getPlayerClubs } from "../lib/db/club";
import { sql } from "../lib/db";
import { AppShellWrapper } from "./app-shell-wrapper";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  if (!player.name.trim()) {
    redirect("/onboarding");
  }

  const clubs = await getPlayerClubs(sql, player.id);

  if (clubs.length === 0) {
    redirect("/join");
  }

  return (
    <AppShellWrapper
      player={{ id: player.id, name: player.name }}
      clubs={clubs.map((c) => ({ id: c.clubId, name: c.clubName }))}
    >
      {children}
    </AppShellWrapper>
  );
}
