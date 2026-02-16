import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole, getClubById } from "@/app/lib/db/club";
import { getPastAnnouncements } from "@/app/lib/db/admin";
import { AnnouncementsView } from "./announcements-view";
import { sendAnnouncementAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AnnouncementsPage({ params }: PageProps) {
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

  const pastAnnouncements = await getPastAnnouncements(sql, clubId);

  return (
    <AnnouncementsView
      clubId={clubId}
      pastAnnouncements={pastAnnouncements}
      sendAction={sendAnnouncementAction}
    />
  );
}
