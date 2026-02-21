import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "../lib/auth";
import { getPlayerClubs } from "../lib/db/club";
import {
  getActiveSeasons,
  getPlayerTeamId,
  getNavigationSeasons,
} from "../lib/db/season";
import { getActiveMatchId } from "../lib/db/match";
import { getUnreadCount } from "../lib/db/event";
import { sql } from "../lib/db";
import { assertNonEmpty } from "../lib/assert";
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

  if (!player.firstName.trim()) {
    redirect("/onboarding");
  }

  const clubs = await getPlayerClubs(sql, player.id);

  if (clubs.length === 0) {
    redirect("/join");
  }

  const clubIds = clubs.map((c) => c.clubId);

  // Fetch navigation seasons and unread count in parallel
  // Non-essential for page rendering — degrade to empty nav on failure
  let navSeasons: Awaited<ReturnType<typeof getNavigationSeasons>> = [];
  let unreadCount = 0;
  try {
    [navSeasons, unreadCount] = await Promise.all([
      getNavigationSeasons(sql, player.id, clubIds),
      getUnreadCount(sql, player.id, clubIds),
    ]);
  } catch (error) {
    console.error(
      `[layout] Failed to fetch navigation data for player ${player.id}:`,
      error,
    );
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

  // Build clubs with seasons and roles for navigation
  const seasonsByClub = new Map<
    number,
    { id: number; name: string; status: string }[]
  >();
  for (const s of navSeasons) {
    const arr = seasonsByClub.get(s.clubId) ?? [];
    arr.push({ id: s.id, name: s.name, status: s.status });
    seasonsByClub.set(s.clubId, arr);
  }

  const clubsWithSeasons = assertNonEmpty(
    clubs.map((c) => ({
      id: c.clubId,
      name: c.clubName,
      role: c.role,
      seasons: seasonsByClub.get(c.clubId) ?? [],
    })),
  );

  return (
    <Suspense>
      <AppShellWrapper
        player={{
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
        }}
        clubs={clubsWithSeasons}
        activeMatchId={activeMatchId}
        unreadCount={unreadCount}
      >
        {children}
      </AppShellWrapper>
    </Suspense>
  );
}
