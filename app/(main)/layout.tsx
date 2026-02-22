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
import { imageUrl } from "../lib/image-url";
import { routes } from "../lib/routes";
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
  const clubIds = clubs.map((c) => c.clubId);

  // Fetch navigation seasons and unread count in parallel
  // Non-essential for page rendering — degrade to empty nav on failure
  let navSeasons: Awaited<ReturnType<typeof getNavigationSeasons>> = [];
  let unreadCount = 0;
  if (clubs.length > 0) {
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
  }

  // Check if player has an active match (for FAB navigation)
  // Non-essential — fallback to default "Challenge" FAB on failure
  let activeMatchUrl: string | null = null;
  if (clubs.length > 0) {
    try {
      const activeSeasons = await getActiveSeasons(sql, clubs[0].clubId);
      if (activeSeasons.length > 0) {
        const firstSeason = activeSeasons[0];
        const teamId = await getPlayerTeamId(sql, player.id, firstSeason.id);
        if (teamId) {
          const matchId = await getActiveMatchId(sql, firstSeason.id, teamId);
          if (matchId) {
            activeMatchUrl = routes.match(
              clubs[0].clubSlug,
              firstSeason.slug,
              matchId,
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `[layout] Failed to fetch active match for player ${player.id}:`,
        error,
      );
    }
  }

  // Build clubs with seasons and roles for navigation
  const seasonsByClub = new Map<
    number,
    { id: number; name: string; slug: string; status: string }[]
  >();
  for (const s of navSeasons) {
    const arr = seasonsByClub.get(s.clubId) ?? [];
    arr.push({ id: s.id, name: s.name, slug: s.slug, status: s.status });
    seasonsByClub.set(s.clubId, arr);
  }

  const clubsWithSeasons = clubs.map((c) => ({
    id: c.clubId,
    name: c.clubName,
    slug: c.clubSlug,
    role: c.role,
    imageSrc: imageUrl(c.clubImageId),
    seasons: seasonsByClub.get(c.clubId) ?? [],
  }));

  return (
    <Suspense>
      <AppShellWrapper
        player={{
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          isAppAdmin: player.isAppAdmin,
        }}
        clubs={clubsWithSeasons}
        activeMatchUrl={activeMatchUrl}
        unreadCount={unreadCount}
      >
        {children}
      </AppShellWrapper>
    </Suspense>
  );
}
