"use client";

import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { EventTimeline } from "@/components/domain/event-timeline";
import { Button } from "@/components/ui/button";
import { allEvents, currentPlayer } from "./_mock-data";

const meta = preview.meta({
  title: "Pages/Neuigkeiten",
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "heading-order", enabled: false }, { id: "color-contrast", enabled: false }] } },
  },
});

export default meta;

function NeuigkeitenPage({
  events = allEvents,
  loading = false,
}: {
  events?: typeof allEvents;
  loading?: boolean;
}) {
  return (
    <PageWrapper activeHref="/neuigkeiten">
      <PageLayout title="Neuigkeiten">
        <div className="space-y-4">
          <EventTimeline events={events} highlightName={currentPlayer.name} loading={loading} />
          {events.length > 0 && !loading && (
            <Button variant="ghost" className="w-full">
              Mehr laden...
            </Button>
          )}
        </div>
      </PageLayout>
    </PageWrapper>
  );
}

export const Default = meta.story({
  render: () => <NeuigkeitenPage />,
});

export const Loading = meta.story({
  render: () => <NeuigkeitenPage events={[]} loading />,
});

export const Empty = meta.story({
  render: () => <NeuigkeitenPage events={[]} />,
});

export const AllRead = meta.story({
  render: () => (
    <NeuigkeitenPage
      events={allEvents.map((e) => ({ ...e, unread: false }))}
    />
  ),
});

export const SingleClub = meta.story({
  render: () => (
    <PageWrapper activeHref="/neuigkeiten" singleClub>
      <PageLayout title="Neuigkeiten">
        <div className="space-y-4">
          <EventTimeline events={allEvents} highlightName={currentPlayer.name} />
        </div>
      </PageLayout>
    </PageWrapper>
  ),
});
