import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import {
  getSeasonDetail,
  getSeasonPlayerCount,
  getSeasonOptedOutCount,
} from "@/app/lib/db/admin";
import { SeasonManagementView } from "./season-management-view";
import {
  updateSeasonAction,
  startSeasonAction,
  endSeasonAction,
} from "./actions";

type PageProps = {
  params: Promise<{ id: string; seasonId: string }>;
};

export default async function SeasonManagementPage({ params }: PageProps) {
  const { id, seasonId: seasonIdParam } = await params;
  const clubId = Number(id);
  const seasonId = Number(seasonIdParam);

  if (Number.isNaN(clubId) || Number.isNaN(seasonId)) {
    redirect("/rankings");
  }

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") {
    redirect("/rankings");
  }

  const [season, playerCount, optedOutCount] = await Promise.all([
    getSeasonDetail(sql, seasonId),
    getSeasonPlayerCount(sql, seasonId),
    getSeasonOptedOutCount(sql, seasonId),
  ]);

  if (!season) {
    redirect(`/admin/club/${clubId}`);
  }

  return (
    <SeasonManagementView
      season={season}
      playerCount={playerCount}
      optedOutCount={optedOutCount}
      clubId={clubId}
      updateAction={updateSeasonAction}
      startAction={startSeasonAction}
      endAction={endSeasonAction}
    />
  );
}
