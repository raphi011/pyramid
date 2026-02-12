import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventTimeline, type TimelineEvent } from "@/components/domain/event-timeline";

const meta: Meta<typeof EventTimeline> = {
  title: "Domain/EventTimeline",
  component: EventTimeline,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventTimeline>;

const sampleEvents: TimelineEvent[] = [
  {
    id: 1,
    type: "result",
    player1: { name: "Max Mustermann" },
    player2: { name: "Anna Schmidt" },
    winnerId: "player1",
    scores: [[6, 4], [7, 5]],
    rankBefore: 5,
    rankAfter: 3,
    time: "14:30",
    group: "Heute",
    groupDate: "12.02.2026",
  },
  {
    id: 2,
    type: "challenge",
    challenger: { name: "Tom Weber" },
    challengee: { name: "Lisa Müller" },
    time: "11:45",
    group: "Heute",
    groupDate: "12.02.2026",
  },
  {
    id: 3,
    type: "new_player",
    player: { name: "Sarah Hoffmann" },
    startingRank: 12,
    time: "10:30",
    group: "Gestern",
    groupDate: "11.02.2026",
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

export const WithSeasonEvents: Story = {
  args: {
    events: [
      ...sampleEvents,
      {
        id: 5,
        type: "season_start",
        seasonName: "Sommer 2026",
        playerCount: 24,
        time: "08:00",
        group: "Letzte Woche",
        groupDate: "05.02.2026",
      },
      {
        id: 6,
        type: "season_end",
        seasonName: "Winter 2025/26",
        winnerName: "Julia Fischer",
        time: "17:00",
        group: "Vor 2 Wochen",
        groupDate: "29.01.2026",
      },
    ],
  },
};
