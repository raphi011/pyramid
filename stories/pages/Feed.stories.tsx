"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { EventTimeline } from "@/components/domain/event-timeline";
import { Button } from "@/components/ui/button";
import { allEvents, currentPlayer } from "./_mock-data";

const meta: Meta = {
  title: "Pages/Neuigkeiten",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

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

export const Default: Story = {
  render: () => <NeuigkeitenPage />,
};

export const Loading: Story = {
  render: () => <NeuigkeitenPage events={[]} loading />,
};

export const Empty: Story = {
  render: () => <NeuigkeitenPage events={[]} />,
};

export const AllRead: Story = {
  render: () => (
    <NeuigkeitenPage
      events={allEvents.map((e) => ({ ...e, unread: false }))}
    />
  ),
};

export const SingleClub: Story = {
  render: () => (
    <PageWrapper activeHref="/neuigkeiten" singleClub>
      <PageLayout title="Neuigkeiten">
        <div className="space-y-4">
          <EventTimeline events={allEvents} highlightName={currentPlayer.name} />
        </div>
      </PageLayout>
    </PageWrapper>
  ),
};
