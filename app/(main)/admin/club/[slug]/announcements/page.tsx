import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubBySlug } from "@/app/lib/db/club";
import { getPastAnnouncements } from "@/app/lib/db/admin";
import { AnnouncementsView } from "./announcements-view";
import { sendAnnouncementAction } from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AnnouncementsPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const club = await getClubBySlug(sql, slug);
  if (!club) {
    redirect("/feed");
  }

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") {
    redirect("/feed");
  }

  const pastAnnouncements = await getPastAnnouncements(sql, club.id);

  return (
    <AnnouncementsView
      clubId={club.id}
      pastAnnouncements={pastAnnouncements}
      sendAction={sendAnnouncementAction}
    />
  );
}
