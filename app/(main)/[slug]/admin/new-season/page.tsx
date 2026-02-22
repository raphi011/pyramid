import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubBySlug } from "@/app/lib/db/club";
import { getSeasonMembers, getPreviousSeasons } from "@/app/lib/db/admin";
import { CreateSeasonView } from "./create-season-view";
import { createSeasonAction } from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CreateSeasonPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const club = await getClubBySlug(sql, slug);
  if (!club) redirect("/feed");

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") redirect("/feed");

  const [members, previousSeasons] = await Promise.all([
    getSeasonMembers(sql, club.id),
    getPreviousSeasons(sql, club.id),
  ]);

  return (
    <CreateSeasonView
      clubId={club.id}
      clubSlug={club.slug}
      members={members}
      previousSeasons={previousSeasons}
      createAction={createSeasonAction}
    />
  );
}
