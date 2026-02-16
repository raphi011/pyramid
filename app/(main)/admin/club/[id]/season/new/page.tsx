import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubById } from "@/app/lib/db/club";
import { getSeasonMembers, getPreviousSeasons } from "@/app/lib/db/admin";
import { CreateSeasonView } from "./create-season-view";
import { createSeasonAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreateSeasonPage({ params }: PageProps) {
  const { id } = await params;
  const clubId = Number(id);

  if (Number.isNaN(clubId)) {
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

  const club = await getClubById(sql, clubId);
  if (!club) {
    redirect("/rankings");
  }

  const [members, previousSeasons] = await Promise.all([
    getSeasonMembers(sql, clubId),
    getPreviousSeasons(sql, clubId),
  ]);

  return (
    <CreateSeasonView
      clubId={clubId}
      members={members}
      previousSeasons={previousSeasons}
      createAction={createSeasonAction}
    />
  );
}
