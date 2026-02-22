import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getClubBySlug, getPlayerRole } from "@/app/lib/db/club";
import { getSeasonBySlug } from "@/app/lib/db/season";
import {
  getSeasonDetail,
  getTeamsWithMembers,
  getUnassignedPlayers,
} from "@/app/lib/db/admin";
import { routes } from "@/app/lib/routes";
import { TeamManagementView } from "./team-management-view";
import { createTeamAction, deleteTeamAction } from "./actions";

type PageProps = {
  params: Promise<{ slug: string; seasonSlug: string }>;
};

export default async function TeamManagementPage({ params }: PageProps) {
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

  const [season, teams, unassignedPlayers] = await Promise.all([
    getSeasonDetail(sql, seasonRow.id),
    getTeamsWithMembers(sql, seasonRow.id),
    getUnassignedPlayers(sql, seasonRow.id, club.id),
  ]);

  if (!season) {
    redirect(routes.admin.club(club.slug));
  }

  return (
    <TeamManagementView
      seasonName={season.name}
      teams={teams}
      unassignedPlayers={unassignedPlayers}
      clubId={club.id}
      seasonId={seasonRow.id}
      clubSlug={club.slug}
      seasonSlug={seasonSlug}
      createAction={createTeamAction}
      deleteAction={deleteTeamAction}
    />
  );
}
