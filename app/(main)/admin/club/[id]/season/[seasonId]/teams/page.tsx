import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import {
  getSeasonDetail,
  getTeamsWithMembers,
  getUnassignedPlayers,
} from "@/app/lib/db/admin";
import { TeamManagementView } from "./team-management-view";
import { createTeamAction, deleteTeamAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string; seasonId: string }>;
};

export default async function TeamManagementPage({ params }: PageProps) {
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

  const [season, teams, unassignedPlayers] = await Promise.all([
    getSeasonDetail(sql, seasonId),
    getTeamsWithMembers(sql, seasonId),
    getUnassignedPlayers(sql, seasonId, clubId),
  ]);

  if (!season) {
    redirect(`/admin/club/${clubId}`);
  }

  return (
    <TeamManagementView
      seasonName={season.name}
      teams={teams}
      unassignedPlayers={unassignedPlayers}
      clubId={clubId}
      seasonId={seasonId}
      createAction={createTeamAction}
      deleteAction={deleteTeamAction}
    />
  );
}
