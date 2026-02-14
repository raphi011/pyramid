"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { EventTimeline } from "@/components/domain/event-timeline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/components/domain/event-timeline";
import { loadMoreFeedEventsAction, loadFeedForClubAction } from "./actions";

type Club = { id: number; name: string };

type FeedViewProps = {
  initialEvents: TimelineEvent[];
  initialHasMore: boolean;
  initialCursor: string | null;
  clubs: Club[];
  playerName: string;
};

export function FeedView({
  initialEvents,
  initialHasMore,
  initialCursor,
  clubs,
  playerName,
}: FeedViewProps) {
  const t = useTranslations("feed");
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [activeClubId, setActiveClubId] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  const showClubFilter = clubs.length > 1;

  function handleClubFilter(clubId: number) {
    setActiveClubId(clubId);
    startTransition(async () => {
      const result = await loadFeedForClubAction(clubId);
      if ("error" in result) return;
      setEvents(result.events);
      setHasMore(result.hasMore);
      setCursor(result.cursor);
    });
  }

  function handleLoadMore() {
    if (!cursor) return;

    const clubIds =
      activeClubId === 0 ? clubs.map((c) => c.id) : [activeClubId];

    startTransition(async () => {
      const result = await loadMoreFeedEventsAction(clubIds, cursor);
      if ("error" in result) return;
      setEvents((prev) => [...prev, ...result.events]);
      setHasMore(result.hasMore);
      setCursor(result.cursor);
    });
  }

  return (
    <PageLayout title={t("title")}>
      {showClubFilter && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill
            label={t("allClubs")}
            active={activeClubId === 0}
            onClick={() => handleClubFilter(0)}
          />
          {clubs.map((club) => (
            <FilterPill
              key={club.id}
              label={club.name}
              active={activeClubId === club.id}
              onClick={() => handleClubFilter(club.id)}
            />
          ))}
        </div>
      )}

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

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-court-600 text-white dark:bg-court-500"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      )}
    >
      {label}
    </button>
  );
}
