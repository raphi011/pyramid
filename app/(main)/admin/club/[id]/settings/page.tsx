import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubById } from "@/app/lib/db/club";
import { imageUrl } from "@/app/lib/image-url";
import { ClubSettingsView } from "./club-settings-view";
import {
  updateClubSettingsAction,
  regenerateInviteCodeAction,
} from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClubSettingsPage({ params }: PageProps) {
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

  return (
    <ClubSettingsView
      club={club}
      avatarSrc={imageUrl(club.imageId)}
      updateAction={updateClubSettingsAction}
      regenerateAction={regenerateInviteCodeAction}
    />
  );
}
