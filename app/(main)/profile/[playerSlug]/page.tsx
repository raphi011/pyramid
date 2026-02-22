import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerProfile, getPlayerBySlug } from "@/app/lib/db/auth";
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
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
} from "@/app/lib/db/match";
import { canChallenge, computeMovement } from "@/app/lib/pyramid";
import type { SeasonStatsScope } from "./shared";
import { PlayerDetailView } from "./player-detail-view";

type PlayerPageProps = {
  params: Promise<{ playerSlug: string }>;
};

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { playerSlug } = await params;
  const playerRow = await getPlayerBySlug(sql, playerSlug);
  if (!playerRow) return { title: "Spieler" };

  return { title: `${playerRow.firstName} ${playerRow.lastName}` };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerSlug } = await params;
  const playerRow = await getPlayerBySlug(sql, playerSlug);
  if (!playerRow) notFound();
  const targetPlayerId = playerRow.id;

  const viewer = await getCurrentPlayer();
  if (!viewer) redirect("/login");

  // If viewing own profile, redirect to /profile
  if (viewer.id === targetPlayerId) redirect("/profile");

  const targetProfile = await getPlayerProfile(sql, targetPlayerId);
  if (!targetProfile) notFound();

  // Privacy gate: viewer must share at least one club with target
  const viewerClubs = await getPlayerClubs(sql, viewer.id);
  const targetClubs = await getPlayerClubs(sql, targetPlayerId);
  const viewerClubIds = new Set(viewerClubs.map((c) => c.clubId));
  const sharedClub = targetClubs.find((c) => viewerClubIds.has(c.clubId));
  if (!sharedClub) notFound();

  const clubId = sharedClub.clubId;

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
  let challengeEligible = false;
  let seasonId: number | null = null;
  let targetTeamId: number | null = null;
  const seasons = await getActiveSeasons(sql, clubId);

  if (seasons.length > 0) {
    const season = seasons[0];
    seasonId = season.id;

    targetTeamId = await getPlayerTeamId(sql, targetPlayerId, season.id);
    const viewerTeamId = await getPlayerTeamId(sql, viewer.id, season.id);

    if (targetTeamId) {
      const [standingsData, winsLossesMap, history, recent, h2h] =
        await Promise.all([
          getStandingsWithPlayers(sql, season.id),
          getTeamWinsLosses(sql, season.id),
          getRankHistory(sql, season.id, targetTeamId),
          getRecentMatchesByTeam(sql, season.id, targetTeamId, 5),
          getHeadToHeadRecords(sql, season.id, targetTeamId),
        ]);

      const { players, previousResults } = standingsData;
      const currentResults = players.map((p) => p.teamId);
      const rankedPlayer = players.find((p) => p.teamId === targetTeamId);
      const wl = winsLossesMap.get(targetTeamId) ?? { wins: 0, losses: 0 };
      const movement = computeMovement(
        targetTeamId,
        currentResults,
        previousResults,
      );

      seasonStats = {
        rank: rankedPlayer?.rank ?? 0,
        wins: wl.wins,
        losses: wl.losses,
        trend: movement,
        trendValue:
          movement === "up"
            ? `+${(previousResults ? previousResults.indexOf(targetTeamId) + 1 : 0) - (rankedPlayer?.rank ?? 0)}`
            : movement === "down"
              ? `${(rankedPlayer?.rank ?? 0) - (previousResults ? previousResults.indexOf(targetTeamId) + 1 : 0)}`
              : "",
      };
      rankHistory = history;
      recentMatches = recent;
      headToHead = h2h;

      // Check challenge eligibility
      if (viewerTeamId && rankedPlayer) {
        const viewerRank = players.find((p) => p.teamId === viewerTeamId)?.rank;
        if (viewerRank) {
          const [openTeams, unavailableTeams] = await Promise.all([
            getTeamsWithOpenChallenge(sql, season.id),
            getUnavailableTeamIds(sql, season.id),
          ]);

          challengeEligible =
            canChallenge(viewerRank, rankedPlayer.rank) &&
            !openTeams.has(viewerTeamId) &&
            !openTeams.has(targetTeamId) &&
            !unavailableTeams.has(viewerTeamId) &&
            !unavailableTeams.has(targetTeamId);
        }
      }
    }
  }

  // Club scope
  const clubTeams = await getPlayerSeasonTeams(sql, targetPlayerId, clubId);
  const clubWL =
    clubTeams.length > 0
      ? await getAggregatedWinsLosses(
          sql,
          clubTeams.map((t) => t.teamId),
        )
      : { wins: 0, losses: 0 };

  // All scope
  const allTeams = await getPlayerSeasonTeams(sql, targetPlayerId);
  const allWL =
    allTeams.length > 0
      ? await getAggregatedWinsLosses(
          sql,
          allTeams.map((t) => t.teamId),
        )
      : { wins: 0, losses: 0 };

  return (
    <PlayerDetailView
      profile={targetProfile}
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
      canChallenge={challengeEligible}
      seasonId={seasonId}
      targetTeamId={targetTeamId}
      clubSlug={sharedClub.clubSlug}
      seasonSlug={seasons.length > 0 ? seasons[0].slug : null}
    />
  );
}
