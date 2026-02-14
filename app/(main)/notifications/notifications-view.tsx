"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { EventTimeline } from "@/components/domain/event-timeline";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "@/components/domain/event-timeline";
import { loadMoreNotificationsAction, markAllReadAction } from "./actions";

type NotificationsViewProps = {
  initialEvents: TimelineEvent[];
  initialHasMore: boolean;
  initialCursor: string | null;
  playerName: string;
  hasUnread: boolean;
};

export function NotificationsView({
  initialEvents,
  initialHasMore,
  initialCursor,
  playerName,
  hasUnread,
}: NotificationsViewProps) {
  const t = useTranslations("feed");
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [showUnread, setShowUnread] = useState(hasUnread);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!cursor) return;

    startTransition(async () => {
      const result = await loadMoreNotificationsAction(cursor);
      if ("error" in result) return;
      setEvents((prev) => [...prev, ...result.events]);
      setHasMore(result.hasMore);
      setCursor(result.cursor);
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllReadAction();
      if ("error" in result) return;
      setShowUnread(false);
      setEvents((prev) => prev.map((e) => ({ ...e, unread: false })));
    });
  }

  return (
    <PageLayout
      title={t("notificationsTitle")}
      action={
        showUnread ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            {t("markAllRead")}
          </Button>
        ) : undefined
      }
    >
      <EventTimeline
        events={events}
        highlightName={playerName}
        loading={isPending && events.length === 0}
      />

      {hasMore && events.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {t("loadMore")}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
