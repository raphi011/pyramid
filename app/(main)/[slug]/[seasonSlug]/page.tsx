import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getClubBySlug, isClubMember } from "@/app/lib/db/club";
import {
  getClubSeasons,
  getSeasonBySlug,
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
import { imageUrl } from "@/app/lib/image-url";
import { RankingsView } from "./rankings-view";

export const metadata: Metadata = { title: "Rangliste" };

type RankingsPageProps = {
  params: Promise<{ slug: string; seasonSlug: string }>;
};

export default async function RankingsPage({ params }: RankingsPageProps) {
  const { slug, seasonSlug } = await params;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const club = await getClubBySlug(sql, slug);
  if (!club) redirect("/feed");

  const isMember = await isClubMember(sql, player.id, club.id);
  if (!isMember) redirect("/feed");

  const season = await getSeasonBySlug(sql, club.id, seasonSlug);
  if (!season) redirect("/feed");

  const seasons = await getClubSeasons(sql, club.id);

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
  const isArchived = season.status === "ended";

  // Find current player's team and rank
  const currentTeamId = await getPlayerTeamId(sql, player.id, season.id);
  const currentPlayerRank =
    currentTeamId !== null
      ? (players.find((p) => p.teamId === currentTeamId)?.rank ?? null)
      : null;

  // Map to component shapes
  function getPlayerVariant(
    teamId: number,
    rank: number,
  ): "default" | "current" | "unavailable" | "challengeable" | "challenged" {
    if (isArchived) return "default";
    if (teamId === currentTeamId) return "current";
    if (unavailableTeams.has(teamId)) return "unavailable";
    if (
      currentPlayerRank !== null &&
      currentTeamId !== null &&
      canChallenge(currentPlayerRank, rank) &&
      !openChallengeTeams.has(teamId) &&
      !openChallengeTeams.has(currentTeamId) &&
      !unavailableTeams.has(currentTeamId)
    ) {
      return "challengeable";
    }
    if (openChallengeTeams.has(teamId)) return "challenged";
    return "default";
  }

  const pyramidPlayers = players.map((p) => {
    const wl = winsLossesMap.get(p.teamId) ?? { wins: 0, losses: 0 };

    return {
      id: p.teamId,
      playerId: p.playerId,
      playerSlug: p.playerSlug,
      firstName: p.firstName,
      lastName: p.lastName,
      rank: p.rank,
      wins: wl.wins,
      losses: wl.losses,
      variant: getPlayerVariant(p.teamId, p.rank),
      avatarSrc: imageUrl(p.imageId),
    };
  });

  const standingsPlayers = players.map((p) => {
    const wl = winsLossesMap.get(p.teamId) ?? { wins: 0, losses: 0 };
    const movement = computeMovement(p.teamId, currentResults, previousResults);
    const challengeable = isArchived
      ? false
      : currentPlayerRank !== null &&
        currentTeamId !== null &&
        canChallenge(currentPlayerRank, p.rank) &&
        p.teamId !== currentTeamId &&
        !openChallengeTeams.has(p.teamId) &&
        !openChallengeTeams.has(currentTeamId) &&
        !unavailableTeams.has(p.teamId) &&
        !unavailableTeams.has(currentTeamId);

    return {
      id: p.teamId,
      playerId: p.playerId,
      playerSlug: p.playerSlug,
      firstName: p.firstName,
      lastName: p.lastName,
      rank: p.rank,
      wins: wl.wins,
      losses: wl.losses,
      movement,
      challengeable,
      unavailable: unavailableTeams.has(p.teamId),
      avatarSrc: imageUrl(p.imageId),
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

    let winnerId: "player1" | "player2" | undefined;
    if (m.winnerTeamId === m.team1Id) winnerId = "player1";
    else if (m.winnerTeamId === m.team2Id) winnerId = "player2";
    else if (m.winnerTeamId !== null) {
      console.error(
        `[rankings] Match ${m.id}: winnerTeamId=${m.winnerTeamId} matches neither team1Id=${m.team1Id} nor team2Id=${m.team2Id}`,
      );
    }

    return {
      id: m.id,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      player1: { name: m.team1Name },
      player2: { name: m.team2Name },
      status: m.status,
      winnerId,
      scores,
      date: m.created.toISOString(),
    };
  });

  return (
    <RankingsView
      seasons={seasons.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        status: s.status,
      }))}
      currentSeasonSlug={season.slug}
      clubName={club.name}
      clubSlug={club.slug}
      clubId={club.id}
      seasonId={season.id}
      pyramidPlayers={pyramidPlayers}
      standingsPlayers={standingsPlayers}
      matches={matches}
      currentTeamId={currentTeamId}
      openEnrollment={season.openEnrollment}
      isIndividual={season.maxTeamSize === 1}
      isArchived={isArchived}
    />
  );
}
