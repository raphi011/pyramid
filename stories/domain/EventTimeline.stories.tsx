import type { Meta, StoryObj } from "@storybook/react";
import { EventTimeline } from "@/components/domain/event-timeline";

const meta: Meta<typeof EventTimeline> = {
  title: "Domain/EventTimeline",
  component: EventTimeline,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventTimeline>;

const sampleEvents = [
  {
    id: 1,
    type: "result" as const,
    title: "Max M. hat gegen Anna S. gewonnen",
    description: "6:4, 7:5",
    timestamp: "vor 2 Stunden",
    player: { name: "Max Mustermann" },
  },
  {
    id: 2,
    type: "challenge" as const,
    title: "Tom W. fordert Lisa M. heraus",
    timestamp: "vor 5 Stunden",
    player: { name: "Tom Weber" },
  },
  {
    id: 3,
    type: "rank_change" as const,
    title: "Max M. steigt auf Rang 3",
    timestamp: "vor 6 Stunden",
    player: { name: "Max Mustermann" },
  },
  {
    id: 4,
    type: "new_player" as const,
    title: "Sarah H. ist beigetreten",
    timestamp: "gestern",
    player: { name: "Sarah Hoffmann" },
  },
];

export const Default: Story = {
  args: { events: sampleEvents },
};

export const Loading: Story = {
  args: { events: [], loading: true },
};

export const Empty: Story = {
  args: { events: [] },
};
