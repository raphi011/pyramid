"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { BellIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/empty-state";
import { EventItem, type EventItemProps } from "@/components/domain/event-item";
import { cn } from "@/lib/utils";

// ── Season event types (only used here) ─────────

type SeasonStartEvent = {
  type: "season_start";
  seasonName: string;
  playerCount: number;
  time: string;
};

type SeasonEndEvent = {
  type: "season_end";
  seasonName: string;
  winnerName: string;
  time: string;
};

type SeasonEvent = SeasonStartEvent | SeasonEndEvent;

function isSeasonEvent(
  event: EventItemProps | SeasonEvent,
): event is SeasonEvent {
  return event.type === "season_start" || event.type === "season_end";
}

// ── Timeline event (union of EventItem + Season) ─

type TimelineEvent = {
  id: string | number;
  group?: string;
  groupDate?: string;
} & (EventItemProps | SeasonEvent);

type EventTimelineProps = {
  events: TimelineEvent[];
  highlightName?: string;
  loading?: boolean;
  onRead?: (ids: (string | number)[]) => void;
  className?: string;
};

// ── Sub-components ──────────────────────────────

function DateSeparator({ label, date }: { label: string; date?: string }) {
  const labelContent = date ? (
    <Tooltip content={date}>
      <button
        type="button"
        className="cursor-default text-xs font-medium text-slate-400 dark:text-slate-500"
      >
        {label}
      </button>
    </Tooltip>
  ) : (
    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
      {label}
    </span>
  );

  return (
    <div className="flex items-center gap-3 py-2" role="separator">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      {labelContent}
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function SeasonBanner({ event }: { event: SeasonEvent }) {
  const t = useTranslations("events");

  const title =
    event.type === "season_start"
      ? t("seasonStartTitle", { season: event.seasonName })
      : t("seasonEndTitle", { season: event.seasonName });

  const description =
    event.type === "season_start"
      ? t("seasonStartDesc", { count: event.playerCount })
      : t("seasonEndDesc", { winner: event.winnerName });

  return (
    <div className="relative my-2 rounded-2xl border-y border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <span className="absolute right-3 top-3 text-xs text-slate-400 dark:text-slate-500">
        {event.time}
      </span>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}{event.type === "season_start" && " 🎉"}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ── Main component ──────────────────────────────

function EventTimeline({
  events,
  highlightName,
  loading,
  onRead,
  className,
}: EventTimelineProps) {
  const t = useTranslations("events");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current || !onRead) return;
    const unreadIds = events
      .filter((e) => !isSeasonEvent(e) && e.unread)
      .map((e) => e.id);
    if (unreadIds.length > 0) {
      calledRef.current = true;
      onRead(unreadIds);
    }
  }, [events, onRead]);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon />}
        title={t("noNews")}
        description={t("noNewsDesc")}
        className={className}
      />
    );
  }

  let lastGroup: string | undefined;

  return (
    <div className={cn(className)}>
      {events.map((event) => {
        const showGroupHeader =
          event.group !== undefined && event.group !== lastGroup;
        lastGroup = event.group;

        const isSeason = isSeasonEvent(event);

        return (
          <div key={event.id}>
            {showGroupHeader && !isSeason && (
              <DateSeparator label={event.group!} date={event.groupDate} />
            )}
            {isSeason ? (
              <SeasonBanner event={event} />
            ) : (
              <EventItem {...event} highlightName={highlightName} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { EventTimeline };
export type { EventTimelineProps, TimelineEvent, SeasonEvent };
