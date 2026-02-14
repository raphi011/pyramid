import { redirect } from "next/navigation";
import { getCurrentPlayer } from "../lib/auth";
import { getPlayerClubs } from "../lib/db/club";
import { getActiveSeasons, getPlayerTeamId } from "../lib/db/season";
import { getActiveMatchId } from "../lib/db/match";
import { getUnreadCount } from "../lib/db/event";
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

  // Check if player has an active match (for FAB navigation)
  // Non-essential — fallback to default "Challenge" FAB on failure
  let activeMatchId: number | null = null;
  try {
    const activeSeasons = await getActiveSeasons(sql, clubs[0].clubId);
    if (activeSeasons.length > 0) {
      const firstSeason = activeSeasons[0];
      const teamId = await getPlayerTeamId(sql, player.id, firstSeason.id);
      if (teamId) {
        activeMatchId = await getActiveMatchId(sql, firstSeason.id, teamId);
      }
    }
  } catch (error) {
    console.error(
      `[layout] Failed to fetch active match for player ${player.id}:`,
      error,
    );
  }

  // Fetch unread notification count
  const clubIds = clubs.map((c) => c.clubId);
  const unreadCount = await getUnreadCount(sql, player.id, clubIds);

  return (
    <AppShellWrapper
      player={{ id: player.id, name: player.name }}
      clubs={
        clubs.map((c) => ({ id: c.clubId, name: c.clubName })) as [
          { id: number; name: string },
          ...{ id: number; name: string }[],
        ]
      }
      activeMatchId={activeMatchId}
      unreadCount={unreadCount}
    >
      {children}
    </AppShellWrapper>
  );
}
