import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import {
  getMatchById,
  getDateProposals,
  getMatchComments,
} from "@/app/lib/db/match";
import { getStandingsWithPlayers } from "@/app/lib/db/season";
import { getPlayerRole } from "@/app/lib/db/club";
import { MatchDetailView } from "./match-detail-view";

type MatchDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MatchDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const matchId = Number(id);
  if (!matchId || Number.isNaN(matchId)) return { title: "Spiel" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { title: "Spiel" };

  return { title: `${match.team1Name} vs ${match.team2Name}` };
}

export default async function MatchDetailPage({
  params,
}: MatchDetailPageProps) {
  const { id } = await params;
  const matchId = Number(id);

  if (!matchId || Number.isNaN(matchId)) notFound();

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const match = await getMatchById(sql, matchId);
  if (!match) notFound();

  const [proposals, comments, standings, clubRole] = await Promise.all([
    getDateProposals(sql, matchId),
    getMatchComments(sql, matchId),
    getStandingsWithPlayers(sql, match.seasonId),
    getPlayerRole(sql, player.id, match.clubId),
  ]);

  const isAdmin = clubRole === "admin";

  // Determine user role
  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  const userRole: "team1" | "team2" | "spectator" = isTeam1
    ? "team1"
    : isTeam2
      ? "team2"
      : "spectator";

  // Resolve ranks
  const team1Rank =
    standings.players.find((p) => p.teamId === match.team1Id)?.rank ?? null;
  const team2Rank =
    standings.players.find((p) => p.teamId === match.team2Id)?.rank ?? null;

  return (
    <MatchDetailView
      match={{
        id: match.id,
        seasonId: match.seasonId,
        team1Id: match.team1Id,
        team2Id: match.team2Id,
        team1Name: match.team1Name,
        team2Name: match.team2Name,
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        winnerTeamId: match.winnerTeamId,
        status: match.status,
        created: match.created.toISOString(),
        gameAt: match.gameAt?.toISOString() ?? null,
        resultEnteredBy: match.resultEnteredBy,
        confirmedBy: match.confirmedBy,
        team1PlayerId: match.team1PlayerId,
        team2PlayerId: match.team2PlayerId,
        seasonBestOf: match.seasonBestOf,
        clubId: match.clubId,
        imageId: match.imageId,
      }}
      proposals={proposals.map((p) => ({
        id: p.id,
        matchId: p.matchId,
        proposedBy: p.proposedBy,
        proposedByName: p.proposedByName,
        proposedDatetime: p.proposedDatetime.toISOString(),
        status: p.status,
        created: p.created.toISOString(),
      }))}
      comments={comments.map((c) => ({
        id: c.id,
        matchId: c.matchId,
        playerId: c.playerId,
        playerName: c.playerName,
        comment: c.comment,
        created: c.created.toISOString(),
        editedAt: c.editedAt?.toISOString() ?? null,
      }))}
      userRole={userRole}
      currentPlayerId={player.id}
      team1Rank={team1Rank}
      team2Rank={team2Rank}
      isAdmin={isAdmin}
    />
  );
}
