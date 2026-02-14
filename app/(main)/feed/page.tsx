import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import {
  getFeedEvents,
  getEventReadWatermarks,
  markAsRead,
} from "@/app/lib/db/event";
import { mapEventRowsToTimeline } from "@/app/lib/event-mapper";
import { FeedView } from "./feed-view";

const PAGE_SIZE = 20;

export default async function FeedPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const clubs = await getPlayerClubs(sql, player.id);
  if (clubs.length === 0) redirect("/join");

  const clubIds = clubs.map((c) => c.clubId);

  const [rows, watermarks, t] = await Promise.all([
    getFeedEvents(sql, clubIds, null, PAGE_SIZE + 1),
    getEventReadWatermarks(sql, player.id, clubIds),
    getTranslations("feed"),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const events = mapEventRowsToTimeline(pageRows, {
    watermarks,
    todayLabel: t("today"),
    yesterdayLabel: t("yesterday"),
  });

  const lastRow = pageRows[pageRows.length - 1];
  const cursor = lastRow
    ? `${lastRow.created.toISOString()}|${lastRow.id}`
    : null;

  // Mark feed as read AFTER computing timeline so initial render shows unread indicators
  try {
    await markAsRead(sql, player.id, clubIds);
  } catch (e) {
    console.error("Failed to mark feed as read:", e);
  }

  return (
    <FeedView
      initialEvents={events}
      initialHasMore={hasMore}
      initialCursor={cursor}
      clubs={clubs.map((c) => ({ id: c.clubId, name: c.clubName }))}
      playerName={`${player.firstName} ${player.lastName}`}
    />
  );
}
