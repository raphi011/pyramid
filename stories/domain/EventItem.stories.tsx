import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventItem, type EventItemProps } from "@/components/domain/event-item";

const meta: Meta<typeof EventItem> = {
  title: "Domain/EventItem",
  component: EventItem,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    type: {
      control: "select",
      options: ["result", "challenge", "withdrawal", "forfeit", "new_player", "unavailable"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventItem>;

export const Result: Story = {
  args: {
    type: "result",
    player1: { name: "Max Mustermann" },
    player2: { name: "Anna Schmidt" },
    winnerId: "player1",
    scores: [[6, 4], [3, 6], [7, 5]],
    rankBefore: 5,
    rankAfter: 3,
    time: "14:30",
  },
};

export const Challenge: Story = {
  args: {
    type: "challenge",
    challenger: { name: "Tom Weber" },
    challengee: { name: "Anna Schmidt" },
    time: "11:45",
  },
};

export const Withdrawal: Story = {
  args: {
    type: "withdrawal",
    player: { name: "Max Mustermann" },
    opponent: { name: "Anna Schmidt" },
    reason: "Terminkonflikt",
    time: "16:20",
  },
};

export const WithdrawalNoReason: Story = {
  args: {
    type: "withdrawal",
    player: { name: "Max Mustermann" },
    opponent: { name: "Anna Schmidt" },
    time: "16:20",
  },
};

export const Forfeit: Story = {
  args: {
    type: "forfeit",
    player: { name: "Lisa Müller" },
    opponent: { name: "Tom Weber" },
    reason: "Verletzung",
    time: "09:15",
  },
};

export const NewPlayer: Story = {
  args: {
    type: "new_player",
    player: { name: "Sarah Hoffmann" },
    startingRank: 12,
    time: "10:30",
  },
};

export const UnavailableWithDate: Story = {
  args: {
    type: "unavailable",
    player: { name: "Erik Meier" },
    returnDate: "20.03.2026",
    time: "12:00",
  },
};

export const AvailableAgain: Story = {
  args: {
    type: "unavailable",
    player: { name: "Sophie Hoffmann" },
    time: "15:45",
  },
};

export const AllTypes: Story = {
  render: () => {
    const events: EventItemProps[] = [
      { type: "result", player1: { name: "Max M." }, player2: { name: "Anna S." }, winnerId: "player1", scores: [[6, 4], [3, 6], [7, 5]], rankBefore: 5, rankAfter: 3, time: "14:30" },
      { type: "challenge", challenger: { name: "Tom W." }, challengee: { name: "Lisa M." }, time: "11:45" },
      { type: "withdrawal", player: { name: "Felix W." }, opponent: { name: "Anna Schmidt" }, reason: "Terminkonflikt", time: "16:20" },
      { type: "forfeit", player: { name: "Marie K." }, opponent: { name: "Tom Weber" }, reason: "Verletzung", time: "09:15" },
      { type: "new_player", player: { name: "Sarah H." }, startingRank: 12, time: "10:30" },
      { type: "unavailable", player: { name: "Erik M." }, returnDate: "20.03.2026", time: "12:00" },
      { type: "unavailable", player: { name: "Sophie H." }, time: "15:45" },
    ];
    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {events.map((e, i) => (
          <EventItem key={i} {...e} />
        ))}
      </div>
    );
  },
};
