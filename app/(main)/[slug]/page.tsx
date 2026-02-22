import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getClubBySlug, getClubMembers, isClubMember } from "@/app/lib/db/club";
import {
  getClubRecentEvents,
  getEventReadWatermarks,
} from "@/app/lib/db/event";
import {
  getClubSeasons,
  getSeasonPlayerCounts,
  getPlayerEnrolledSeasonIds,
  isIndividualSeason,
} from "@/app/lib/db/season";
import {
  mapEventRowsToTimeline,
  buildTimeLabels,
} from "@/app/lib/event-mapper";
import type { TimelineEvent } from "@/components/domain/event-timeline";
import { imageUrl } from "@/app/lib/image-url";
import { ClubDetailView } from "./club-detail-view";

export const metadata: Metadata = { title: "Verein" };

type ClubPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const club = await getClubBySlug(sql, slug);
  if (!club) notFound();

  if (!(await isClubMember(sql, player.id, club.id))) {
    redirect("/feed");
  }

  const [members, seasons] = await Promise.all([
    getClubMembers(sql, club.id),
    getClubSeasons(sql, club.id),
  ]);

  // Recent activity is supplementary — degrade gracefully on failure
  let recentActivity: TimelineEvent[] = [];
  try {
    const [recentEventRows, watermarks, t] = await Promise.all([
      getClubRecentEvents(sql, club.id, 5),
      getEventReadWatermarks(sql, player.id, [club.id]),
      getTranslations("match"),
    ]);
    recentActivity = mapEventRowsToTimeline(recentEventRows, {
      watermarks,
      timeLabels: buildTimeLabels(t),
    });
  } catch (e) {
    console.error(`Failed to load recent activity for club ${club.id}:`, e);
  }

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
      clubSlug={club.slug}
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
      recentActivity={recentActivity}
      seasons={visibleSeasons.map((s) => ({
        id: s.id,
        slug: s.slug,
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
        clubId: club.id,
      }))}
      members={members.map((m) => ({
        playerId: m.playerId,
        playerSlug: m.playerSlug,
        firstName: m.firstName,
        lastName: m.lastName,
        imageId: imageUrl(m.imageId),
        role: m.role,
      }))}
    />
  );
}
