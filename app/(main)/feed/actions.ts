"use server";

import { getTranslations } from "next-intl/server";
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
  if (!player) return { error: "feed.error.serverError" };

  const clubs = await getPlayerClubs(sql, player.id);
  const playerClubIds = new Set(clubs.map((c) => c.clubId));
  const validClubIds = clubIds.filter((id) => playerClubIds.has(id));

  if (validClubIds.length === 0) {
    return { events: [], hasMore: false, cursor: null };
  }

  const parsed = parseCursor(cursor);
  if (!parsed) return { error: "feed.error.serverError" };

  try {
    const [rows, watermarks, t] = await Promise.all([
      getFeedEvents(sql, validClubIds, parsed, PAGE_SIZE + 1),
      getEventReadWatermarks(sql, player.id, validClubIds),
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
    const nextCursor = lastRow ? serializeCursor(lastRow) : null;

    return { events, hasMore, cursor: nextCursor };
  } catch (e) {
    console.error("loadMoreFeedEventsAction failed:", e);
    return { error: "feed.error.serverError" };
  }
}

export async function loadFeedForClubAction(
  clubId: number,
): Promise<LoadMoreResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "feed.error.serverError" };

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

  try {
    const [rows, watermarks, t] = await Promise.all([
      getFeedEvents(sql, validClubIds, null, PAGE_SIZE + 1),
      getEventReadWatermarks(sql, player.id, validClubIds),
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
    const nextCursor = lastRow ? serializeCursor(lastRow) : null;

    return { events, hasMore, cursor: nextCursor };
  } catch (e) {
    console.error("loadFeedForClubAction failed:", e);
    return { error: "feed.error.serverError" };
  }
}

// Cursor format: "ISO_DATE|ID"
function serializeCursor(row: { created: Date; id: number }): string {
  return `${row.created.toISOString()}|${row.id}`;
}

function parseCursor(cursor: string): { created: Date; id: number } | null {
  const parts = cursor.split("|");
  if (parts.length !== 2) return null;
  const created = new Date(parts[0]);
  const id = parseInt(parts[1], 10);
  if (isNaN(created.getTime()) || !Number.isInteger(id)) return null;
  return { created, id };
}
