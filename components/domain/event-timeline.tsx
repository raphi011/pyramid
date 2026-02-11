"use client";

import { useEffect, useRef } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  EventItem,
  eventConfig,
  type EventType,
  type EventContextData,
} from "@/components/domain/event-item";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string | number;
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
  player?: { name: string; avatarSrc?: string | null };
  group?: string;
  unread?: boolean;
  href?: string;
  context?: EventContextData;
};

type EventTimelineProps = {
  events: TimelineEvent[];
  highlightName?: string;
  loading?: boolean;
  onRead?: (ids: (string | number)[]) => void;
  className?: string;
};

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2" role="separator">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function SeasonBanner({
  type,
  title,
  description,
  timestamp,
}: {
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
}) {
  const config = eventConfig[type];

  return (
    <div className="my-2 rounded-2xl border-y border-dashed border-slate-200 bg-slate-50 py-5 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-court-100 text-court-700 dark:bg-court-900 dark:text-court-300 [&_svg]:size-5">
        {config.icon}
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </p>
      {description && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {timestamp}
      </p>
    </div>
  );
}

function EventTimeline({
  events,
  highlightName,
  loading,
  onRead,
  className,
}: EventTimelineProps) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current || !onRead) return;
    const unreadIds = events.filter((e) => e.unread).map((e) => e.id);
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
        title="Keine Neuigkeiten"
        description="Sobald etwas passiert, wirst du hier benachrichtigt."
        className={className}
      />
    );
  }

  let lastGroup: string | undefined;

  return (
    <div className={cn(className)}>
      {events.map((event, index) => {
        const showGroupHeader = event.group !== undefined && event.group !== lastGroup;
        lastGroup = event.group;

        const isSeasonEvent =
          event.type === "season_start" || event.type === "season_end";

        return (
          <div key={event.id}>
            {showGroupHeader && !isSeasonEvent && <DateSeparator label={event.group!} />}
            {isSeasonEvent ? (
              <SeasonBanner
                type={event.type}
                title={event.title}
                description={event.description}
                timestamp={event.timestamp}
              />
            ) : (
              <EventItem
                type={event.type}
                title={event.title}
                description={event.description}
                timestamp={event.timestamp}
                player={event.player}
                unread={event.unread}
                highlightName={highlightName}
                href={event.href}
                context={event.context}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { EventTimeline };
export type { EventTimelineProps, TimelineEvent, EventContextData };
