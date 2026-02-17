import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getClubById, getClubMembers, isClubMember } from "@/app/lib/db/club";
import {
  getClubSeasons,
  getSeasonPlayerCounts,
  getPlayerEnrolledSeasonIds,
  isIndividualSeason,
} from "@/app/lib/db/season";
import { imageUrl } from "@/app/lib/image-url";
import { ClubDetailView } from "./club-detail-view";

export const metadata: Metadata = { title: "Verein" };

type ClubPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClubPage({ params }: ClubPageProps) {
  const { id } = await params;
  const clubId = parseInt(id, 10);
  if (Number.isNaN(clubId) || clubId <= 0) redirect("/rankings");

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  if (!(await isClubMember(sql, player.id, clubId))) {
    redirect("/rankings");
  }

  const [club, members, seasons] = await Promise.all([
    getClubById(sql, clubId),
    getClubMembers(sql, clubId),
    getClubSeasons(sql, clubId),
  ]);

  if (!club) redirect("/rankings");

  // Filter seasons by visibility
  const seasonIds = seasons.map((s) => s.id);
  const enrolledSeasonIds =
    seasonIds.length > 0
      ? await getPlayerEnrolledSeasonIds(sql, player.id, seasonIds)
      : new Set<number>();

  const visibleSeasons = seasons.filter(
    (s) => s.visibility === "club" || enrolledSeasonIds.has(s.id),
  );

  // Fetch player counts for visible seasons
  const visibleSeasonIds = visibleSeasons.map((s) => s.id);
  const playerCounts =
    visibleSeasonIds.length > 0
      ? await getSeasonPlayerCounts(sql, visibleSeasonIds)
      : new Map<number, number>();

  return (
    <ClubDetailView
      club={{
        name: club.name,
        url: club.url,
        phoneNumber: club.phoneNumber,
        address: club.address,
        city: club.city,
        zip: club.zip,
        country: club.country,
        imageId: imageUrl(club.imageId),
      }}
      memberCount={members.length}
      seasons={visibleSeasons.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status as "active" | "ended",
        playerCount: playerCounts.get(s.id) ?? 0,
        isIndividual: isIndividualSeason(s),
        canEnroll:
          s.status === "active" &&
          s.openEnrollment &&
          s.visibility === "club" &&
          isIndividualSeason(s) &&
          !enrolledSeasonIds.has(s.id),
        isEnrolled: enrolledSeasonIds.has(s.id),
        clubId,
      }))}
      members={members.map((m) => ({
        playerId: m.playerId,
        firstName: m.firstName,
        lastName: m.lastName,
        imageId: imageUrl(m.imageId),
        role: m.role,
      }))}
    />
  );
}
