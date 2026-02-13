import { redirect } from "next/navigation";
import { getCurrentPlayer } from "../lib/auth";
import { getPlayerClubs } from "../lib/db/club";
import { getActiveSeasons, getPlayerTeamId } from "../lib/db/season";
import { getTeamsWithOpenChallenge } from "../lib/db/match";
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

  // Check if player has open challenge (for FAB state)
  let hasOpenChallenge = false;
  const activeSeasons = await getActiveSeasons(sql, clubs[0].clubId);
  if (activeSeasons.length > 0) {
    const firstSeason = activeSeasons[0];
    const teamId = await getPlayerTeamId(sql, player.id, firstSeason.id);
    if (teamId) {
      const openTeams = await getTeamsWithOpenChallenge(sql, firstSeason.id);
      hasOpenChallenge = openTeams.has(teamId);
    }
  }

  return (
    <AppShellWrapper
      player={{ id: player.id, name: player.name }}
      clubs={clubs.map((c) => ({ id: c.clubId, name: c.clubName }))}
      hasOpenChallenge={hasOpenChallenge}
    >
      {children}
    </AppShellWrapper>
  );
}
