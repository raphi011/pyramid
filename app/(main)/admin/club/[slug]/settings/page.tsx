import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubBySlug } from "@/app/lib/db/club";
import { imageUrl } from "@/app/lib/image-url";
import { ClubSettingsView } from "./club-settings-view";
import {
  updateClubSettingsAction,
  regenerateInviteCodeAction,
} from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClubSettingsPage({ params }: PageProps) {
  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const { slug } = await params;
  const club = await getClubBySlug(sql, slug);
  if (!club) {
    redirect("/feed");
  }

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") {
    redirect("/feed");
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
