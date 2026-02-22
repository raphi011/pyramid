import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";

export const metadata: Metadata = { title: "Profil" };
import { sql } from "@/app/lib/db";
import { getPlayerProfile } from "@/app/lib/db/auth";
import { getPlayerClubs } from "@/app/lib/db/club";
import {
  getActiveSeasons,
  getStandingsWithPlayers,
  getTeamWinsLosses,
  getPlayerTeamId,
  getRankHistory,
  getPlayerSeasonTeams,
} from "@/app/lib/db/season";
import {
  getRecentMatchesByTeam,
  getHeadToHeadRecords,
  getAggregatedWinsLosses,
} from "@/app/lib/db/match";
import { computeMovement } from "@/app/lib/pyramid";
import type { SeasonStatsScope } from "./[playerSlug]/shared";
import { imageUrl } from "@/app/lib/image-url";
import { ProfileView } from "./profile-view";

export default async function ProfilePage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const profile = await getPlayerProfile(sql, player.id);
  if (!profile) redirect("/login");

  const clubs = await getPlayerClubs(sql, player.id);
  const clubId = clubs[0]?.clubId ?? null;

  // Default stats
  let seasonStats: SeasonStatsScope = {
    rank: 0,
    wins: 0,
    losses: 0,
    trend: "none",
    trendValue: "",
  };
  let rankHistory: { date: string; rank: number; matchId: number }[] = [];
  let recentMatches: Awaited<ReturnType<typeof getRecentMatchesByTeam>> = [];
  let headToHead: Awaited<ReturnType<typeof getHeadToHeadRecords>> = [];
  let seasonId: number | null = null;

  const seasons = clubId ? await getActiveSeasons(sql, clubId) : [];

  if (seasons.length > 0) {
    const season = seasons[0];
    seasonId = season.id;

    const teamId = await getPlayerTeamId(sql, player.id, season.id);

    if (teamId) {
      const [standingsData, winsLossesMap, history, recent, h2h] =
        await Promise.all([
          getStandingsWithPlayers(sql, season.id),
          getTeamWinsLosses(sql, season.id),
          getRankHistory(sql, season.id, teamId),
          getRecentMatchesByTeam(sql, season.id, teamId, 5),
          getHeadToHeadRecords(sql, season.id, teamId),
        ]);

      const { players, previousResults } = standingsData;
      const currentResults = players.map((p) => p.teamId);
      const rankedPlayer = players.find((p) => p.teamId === teamId);
      const wl = winsLossesMap.get(teamId) ?? { wins: 0, losses: 0 };
      const movement = computeMovement(teamId, currentResults, previousResults);

      seasonStats = {
        rank: rankedPlayer?.rank ?? 0,
        wins: wl.wins,
        losses: wl.losses,
        trend: movement,
        trendValue:
          movement === "up"
            ? `+${(previousResults ? previousResults.indexOf(teamId) + 1 : 0) - (rankedPlayer?.rank ?? 0)}`
            : movement === "down"
              ? `${(rankedPlayer?.rank ?? 0) - (previousResults ? previousResults.indexOf(teamId) + 1 : 0)}`
              : "",
      };
      rankHistory = history;
      recentMatches = recent;
      headToHead = h2h;
    }
  }

  // Club scope: aggregate across all seasons in this club
  const clubTeams = clubId
    ? await getPlayerSeasonTeams(sql, player.id, clubId)
    : [];
  const clubWL =
    clubTeams.length > 0
      ? await getAggregatedWinsLosses(
          sql,
          clubTeams.map((t) => t.teamId),
        )
      : { wins: 0, losses: 0 };

  // All scope: aggregate across all clubs/seasons
  const allTeams = await getPlayerSeasonTeams(sql, player.id);
  const allWL =
    allTeams.length > 0
      ? await getAggregatedWinsLosses(
          sql,
          allTeams.map((t) => t.teamId),
        )
      : { wins: 0, losses: 0 };

  return (
    <ProfileView
      profile={profile}
      avatarSrc={imageUrl(profile.imageId)}
      clubs={clubs}
      seasonStats={seasonStats}
      clubStats={clubWL}
      allStats={allWL}
      rankHistory={rankHistory}
      recentMatches={recentMatches.map((m) => ({
        id: m.id,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        status: m.status,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        created: m.created.toISOString(),
      }))}
      headToHead={headToHead}
      seasonId={seasonId}
    />
  );
}
