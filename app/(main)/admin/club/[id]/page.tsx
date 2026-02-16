import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { env } from "@/app/lib/env";
import { getPlayerRole, getClubById } from "@/app/lib/db/club";
import {
  getClubStats,
  getActiveSeasonsWithStats,
  getOverdueMatches,
} from "@/app/lib/db/admin";
import { AdminDashboardView } from "./admin-dashboard-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
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

  const [stats, seasons, overdueMatches] = await Promise.all([
    getClubStats(sql, clubId),
    getActiveSeasonsWithStats(sql, clubId),
    getOverdueMatches(sql, clubId),
  ]);

  return (
    <AdminDashboardView
      clubId={clubId}
      clubName={club.name}
      inviteCode={club.inviteCode}
      appUrl={env.APP_URL}
      stats={stats}
      seasons={seasons}
      overdueMatches={overdueMatches}
    />
  );
}
