import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { env } from "@/app/lib/env";
import { getPlayerRole, getClubBySlug } from "@/app/lib/db/club";
import {
  getClubStats,
  getActiveSeasonsWithStats,
  getOverdueMatches,
} from "@/app/lib/db/admin";
import { AdminDashboardView } from "./admin-dashboard-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const club = await getClubBySlug(sql, slug);
  if (!club) redirect("/feed");

  const role = await getPlayerRole(sql, player.id, club.id);
  if (role !== "admin") redirect("/feed");

  const [stats, seasons, overdueMatches] = await Promise.all([
    getClubStats(sql, club.id),
    getActiveSeasonsWithStats(sql, club.id),
    getOverdueMatches(sql, club.id),
  ]);

  return (
    <AdminDashboardView
      clubSlug={club.slug}
      clubName={club.name}
      inviteCode={club.inviteCode}
      appUrl={env.APP_URL}
      stats={stats}
      seasons={seasons}
      overdueMatches={overdueMatches}
    />
  );
}
