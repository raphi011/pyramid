import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getClubBySlug, getPlayerRole } from "@/app/lib/db/club";
import { getSeasonBySlug } from "@/app/lib/db/season";
import {
  getSeasonDetail,
  getSeasonPlayerCount,
  getSeasonOptedOutCount,
} from "@/app/lib/db/admin";
import { routes } from "@/app/lib/routes";
import { SeasonManagementView } from "./season-management-view";
import {
  updateSeasonAction,
  startSeasonAction,
  endSeasonAction,
} from "./actions";

type PageProps = {
  params: Promise<{ slug: string; seasonSlug: string }>;
};

export default async function SeasonManagementPage({ params }: PageProps) {
  const { slug, seasonSlug } = await params;

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const club = await getClubBySlug(sql, slug);
  if (!club) redirect("/feed");

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") {
    redirect("/feed");
  }

  const seasonRow = await getSeasonBySlug(sql, club.id, seasonSlug);
  if (!seasonRow) redirect(routes.admin.club(club.slug));

  const [season, playerCount, optedOutCount] = await Promise.all([
    getSeasonDetail(sql, seasonRow.id),
    getSeasonPlayerCount(sql, seasonRow.id),
    getSeasonOptedOutCount(sql, seasonRow.id),
  ]);

  if (!season) {
    redirect(routes.admin.club(club.slug));
  }

  return (
    <SeasonManagementView
      season={season}
      playerCount={playerCount}
      optedOutCount={optedOutCount}
      clubId={club.id}
      clubSlug={club.slug}
      seasonSlug={seasonSlug}
      inviteCode={season.inviteCode}
      appUrl={process.env.APP_URL || "http://localhost:3000"}
      updateAction={updateSeasonAction}
      startAction={startSeasonAction}
      endAction={endSeasonAction}
    />
  );
}
