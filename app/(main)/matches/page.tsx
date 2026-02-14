import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import {
  getActiveSeasons,
  getSeasonById,
  getPlayerTeamId,
} from "@/app/lib/db/season";
import { getMatchesBySeason } from "@/app/lib/db/match";
import { MatchesView } from "./matches-view";
import type { Season } from "@/app/lib/db/season";

type MatchesPageProps = {
  searchParams: Promise<{ season?: string }>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const { season: seasonParam } = await searchParams;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const clubs = await getPlayerClubs(sql, player.id);
  if (clubs.length === 0) redirect("/join");

  const clubId = clubs[0].clubId;

  const seasons = await getActiveSeasons(sql, clubId);

  if (seasons.length === 0) {
    return (
      <MatchesView
        seasons={[]}
        currentSeasonId={null}
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

  // Fetch matches and current player's team in parallel
  const [matches, currentTeamId] = await Promise.all([
    getMatchesBySeason(sql, season.id),
    getPlayerTeamId(sql, player.id, season.id),
  ]);

  // Serialize Date to ISO string before passing to client component
  const serializedMatches = matches.map((m) => ({
    id: m.id,
    team1Id: m.team1Id,
    team2Id: m.team2Id,
    team1Name: m.team1Name,
    team2Name: m.team2Name,
    status: m.status,
    team1Score: m.team1Score,
    team2Score: m.team2Score,
    created: m.created.toISOString(),
  }));

  return (
    <MatchesView
      seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
      currentSeasonId={season.id}
      matches={serializedMatches}
      currentTeamId={currentTeamId}
    />
  );
}
