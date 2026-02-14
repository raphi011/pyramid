import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import {
  getActiveSeasons,
  getSeasonById,
  getStandingsWithPlayers,
  getTeamWinsLosses,
  getPlayerTeamId,
} from "@/app/lib/db/season";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  getMatchesBySeason,
} from "@/app/lib/db/match";
import { canChallenge, computeMovement } from "@/app/lib/pyramid";
import { RankingsView } from "./rankings-view";
import type { Season } from "@/app/lib/db/season";

type RankingsPageProps = {
  searchParams: Promise<{ season?: string }>;
};

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const { season: seasonParam } = await searchParams;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const clubs = await getPlayerClubs(sql, player.id);
  if (clubs.length === 0) redirect("/join");

  const clubId = clubs[0].clubId;
  const clubName = clubs[0].clubName;

  const seasons = await getActiveSeasons(sql, clubId);

  if (seasons.length === 0) {
    return (
      <RankingsView
        seasons={[]}
        currentSeasonId={null}
        clubName={clubName}
        pyramidPlayers={[]}
        standingsPlayers={[]}
        currentPlayerTeamId={null}
        hasOpenChallenge={false}
        matches={[]}
        currentTeamId={null}
      />
    );
  }

  // Resolve selected season (from URL param or default to first)
  let season: Season | null = null;
  if (seasonParam) {
    const seasonId = parseInt(seasonParam, 10);
    if (!Number.isNaN(seasonId) && seasonId > 0) {
      season = await getSeasonById(sql, seasonId);
    }
  }
  if (!season || season.clubId !== clubId) {
    season = seasons[0];
  }

  // Fetch standings, wins/losses, open challenges, unavailability, and matches in parallel
  const [
    standingsData,
    winsLossesMap,
    openChallengeTeams,
    unavailableTeams,
    dbMatches,
  ] = await Promise.all([
    getStandingsWithPlayers(sql, season.id),
    getTeamWinsLosses(sql, season.id),
    getTeamsWithOpenChallenge(sql, season.id),
    getUnavailableTeamIds(sql, season.id),
    getMatchesBySeason(sql, season.id),
  ]);

  const { players, previousResults } = standingsData;
  const currentResults = players.map((p) => p.teamId);

  // Find current player's team and rank
  const currentTeamId = await getPlayerTeamId(sql, player.id, season.id);
  const currentPlayerRank =
    currentTeamId !== null
      ? (players.find((p) => p.teamId === currentTeamId)?.rank ?? null)
      : null;

  // Map to component shapes
  const pyramidPlayers = players.map((p) => {
    const wl = winsLossesMap.get(p.teamId) ?? { wins: 0, losses: 0 };
    const variant =
      p.teamId === currentTeamId
        ? ("current" as const)
        : unavailableTeams.has(p.teamId)
          ? ("unavailable" as const)
          : currentPlayerRank !== null &&
              currentTeamId !== null &&
              canChallenge(currentPlayerRank, p.rank) &&
              !openChallengeTeams.has(p.teamId) &&
              !openChallengeTeams.has(currentTeamId) &&
              !unavailableTeams.has(currentTeamId)
            ? ("challengeable" as const)
            : openChallengeTeams.has(p.teamId)
              ? ("challenged" as const)
              : ("default" as const);

    return {
      id: p.teamId,
      name: p.name,
      rank: p.rank,
      wins: wl.wins,
      losses: wl.losses,
      variant,
    };
  });

  const standingsPlayers = players.map((p) => {
    const wl = winsLossesMap.get(p.teamId) ?? { wins: 0, losses: 0 };
    const movement = computeMovement(p.teamId, currentResults, previousResults);
    const challengeable =
      currentPlayerRank !== null &&
      currentTeamId !== null &&
      canChallenge(currentPlayerRank, p.rank) &&
      p.teamId !== currentTeamId &&
      !openChallengeTeams.has(p.teamId) &&
      !openChallengeTeams.has(currentTeamId) &&
      !unavailableTeams.has(p.teamId) &&
      !unavailableTeams.has(currentTeamId);

    return {
      id: p.teamId,
      name: p.name,
      rank: p.rank,
      wins: wl.wins,
      losses: wl.losses,
      movement,
      challengeable,
    };
  });

  // Map DB matches to MatchRow shape
  const matches = dbMatches.map((m) => {
    const scores: [number, number][] | undefined =
      m.team1Score && m.team2Score
        ? m.team1Score.map(
            (s1, i) => [s1, m.team2Score![i]] as [number, number],
          )
        : undefined;

    const winnerId: "player1" | "player2" | undefined = m.winnerTeamId
      ? m.winnerTeamId === m.team1Id
        ? "player1"
        : "player2"
      : undefined;

    return {
      id: m.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      player1: { name: m.team1Name },
      player2: { name: m.team2Name },
      status: m.status,
      winnerId,
      scores,
      date: m.created.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  });

  return (
    <RankingsView
      seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
      currentSeasonId={season.id}
      clubName={clubName}
      pyramidPlayers={pyramidPlayers}
      standingsPlayers={standingsPlayers}
      currentPlayerTeamId={currentTeamId}
      hasOpenChallenge={
        currentTeamId !== null && openChallengeTeams.has(currentTeamId)
      }
      matches={matches}
      currentTeamId={currentTeamId}
    />
  );
}
