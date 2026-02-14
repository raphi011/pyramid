"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import {
  getNotifications,
  getEventReadWatermarks,
  markAsRead,
} from "@/app/lib/db/event";
import { mapEventRowsToTimeline } from "@/app/lib/event-mapper";
import type { TimelineEvent } from "@/components/domain/event-timeline";

const PAGE_SIZE = 20;

export type LoadMoreNotificationsResult =
  | { events: TimelineEvent[]; hasMore: boolean; cursor: string | null }
  | { error: string };

export async function loadMoreNotificationsAction(
  cursor: string,
): Promise<LoadMoreNotificationsResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Not authenticated" };

  const clubs = await getPlayerClubs(sql, player.id);
  const clubIds = clubs.map((c) => c.clubId);

  const cursorDate = new Date(cursor);
  if (isNaN(cursorDate.getTime())) {
    return { error: "Invalid cursor" };
  }

  const rows = await getNotifications(
    sql,
    player.id,
    clubIds,
    cursorDate,
    PAGE_SIZE + 1,
  );
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const watermarks = await getEventReadWatermarks(sql, player.id, clubIds);
  const events = mapEventRowsToTimeline(pageRows, { watermarks });

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = lastRow ? lastRow.created.toISOString() : null;

  return { events, hasMore, cursor: nextCursor };
}

export async function markAllReadAction(): Promise<
  { success: true } | { error: string }
> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Not authenticated" };

  const clubs = await getPlayerClubs(sql, player.id);
  const clubIds = clubs.map((c) => c.clubId);

  await markAsRead(sql, player.id, clubIds);

  revalidatePath("/notifications");
  revalidatePath("/feed");

  return { success: true };
}
