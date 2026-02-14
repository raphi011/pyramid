"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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
  if (!player) return { error: "feed.error.serverError" };

  const clubs = await getPlayerClubs(sql, player.id);
  const clubIds = clubs.map((c) => c.clubId);

  const parsed = parseCursor(cursor);
  if (!parsed) return { error: "feed.error.serverError" };

  try {
    const [rows, watermarks, t] = await Promise.all([
      getNotifications(sql, player.id, clubIds, parsed, PAGE_SIZE + 1),
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
    const nextCursor = lastRow ? serializeCursor(lastRow) : null;

    return { events, hasMore, cursor: nextCursor };
  } catch (e) {
    console.error("loadMoreNotificationsAction failed:", e);
    return { error: "feed.error.serverError" };
  }
}

export async function markAllReadAction(): Promise<
  { success: true } | { error: string }
> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "feed.error.serverError" };

  try {
    const clubs = await getPlayerClubs(sql, player.id);
    const clubIds = clubs.map((c) => c.clubId);

    await markAsRead(sql, player.id, clubIds);

    revalidatePath("/notifications");
    revalidatePath("/feed");

    return { success: true };
  } catch (e) {
    console.error("markAllReadAction failed:", e);
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
