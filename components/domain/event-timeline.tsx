"use client";

import { BellIcon } from "@heroicons/react/24/outline";
import { DataList } from "@/components/data-list";
import { EventItem, type EventType } from "@/components/domain/event-item";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string | number;
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
  player?: { name: string; avatarSrc?: string | null };
};

type EventTimelineProps = {
  events: TimelineEvent[];
  loading?: boolean;
  className?: string;
};

function EventTimeline({
  events,
  loading,
  className,
}: EventTimelineProps) {
  return (
    <DataList
      items={events}
      loading={loading}
      loadingCount={5}
      keyExtractor={(event) => event.id}
      renderItem={(event) => (
        <EventItem
          type={event.type}
          title={event.title}
          description={event.description}
          timestamp={event.timestamp}
          player={event.player}
        />
      )}
      empty={{
        icon: <BellIcon />,
        title: "Keine Neuigkeiten",
        description: "Sobald etwas passiert, wirst du hier benachrichtigt.",
      }}
      className={cn(className)}
    />
  );
}

export { EventTimeline };
export type { EventTimelineProps, TimelineEvent };
