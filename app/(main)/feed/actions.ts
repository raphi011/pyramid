"use server";

import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import { getFeedEvents, getEventReadWatermarks } from "@/app/lib/db/event";
import { mapEventRowsToTimeline } from "@/app/lib/event-mapper";
import type { TimelineEvent } from "@/components/domain/event-timeline";

const PAGE_SIZE = 20;

export type LoadMoreResult =
  | { events: TimelineEvent[]; hasMore: boolean; cursor: string | null }
  | { error: string };

export async function loadMoreFeedEventsAction(
  clubIds: number[],
  cursor: string,
): Promise<LoadMoreResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Not authenticated" };

  const clubs = await getPlayerClubs(sql, player.id);
  const playerClubIds = new Set(clubs.map((c) => c.clubId));
  const validClubIds = clubIds.filter((id) => playerClubIds.has(id));

  if (validClubIds.length === 0) {
    return { events: [], hasMore: false, cursor: null };
  }

  const cursorDate = new Date(cursor);
  if (isNaN(cursorDate.getTime())) {
    return { error: "Invalid cursor" };
  }

  const rows = await getFeedEvents(
    sql,
    validClubIds,
    cursorDate,
    PAGE_SIZE + 1,
  );
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const watermarks = await getEventReadWatermarks(sql, player.id, validClubIds);
  const events = mapEventRowsToTimeline(pageRows, { watermarks });

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = lastRow ? lastRow.created.toISOString() : null;

  return { events, hasMore, cursor: nextCursor };
}

export async function loadFeedForClubAction(
  clubId: number,
): Promise<LoadMoreResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Not authenticated" };

  const clubs = await getPlayerClubs(sql, player.id);
  const playerClubIds = new Set(clubs.map((c) => c.clubId));

  const validClubIds =
    clubId === 0
      ? clubs.map((c) => c.clubId)
      : playerClubIds.has(clubId)
        ? [clubId]
        : [];

  if (validClubIds.length === 0) {
    return { events: [], hasMore: false, cursor: null };
  }

  const rows = await getFeedEvents(sql, validClubIds, null, PAGE_SIZE + 1);
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const watermarks = await getEventReadWatermarks(sql, player.id, validClubIds);
  const events = mapEventRowsToTimeline(pageRows, { watermarks });

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = lastRow ? lastRow.created.toISOString() : null;

  return { events, hasMore, cursor: nextCursor };
}
