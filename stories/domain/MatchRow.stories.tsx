import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MatchRow } from "@/components/domain/match-row";

const meta: Meta<typeof MatchRow> = {
  title: "Domain/MatchRow",
  component: MatchRow,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: ["challenged", "date_set", "completed", "withdrawn", "forfeited"],
    },
    position: {
      control: "radio",
      options: ["first", "middle", "last", "only"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MatchRow>;

const p1 = { name: "Max Mustermann" };
const p2 = { name: "Anna Schmidt" };

export const Challenged: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "challenged",
  },
};

export const DateSet: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "date_set",
    date: "Sa, 15.03.2026",
  },
};

export const CompletedWin: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "completed",
    winnerId: "player1",
    scores: [[6, 4], [3, 6], [7, 5]],
    date: "12.03.2026",
  },
};

export const CompletedLoss: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "completed",
    winnerId: "player2",
    scores: [[4, 6], [2, 6]],
    date: "10.03.2026",
  },
};

export const Withdrawn: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "withdrawn",
    date: "08.03.2026",
  },
};

export const Forfeited: Story = {
  args: {
    player1: p1,
    player2: p2,
    status: "forfeited",
    date: "05.03.2026",
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="space-y-3">
      <MatchRow player1={p1} player2={p2} status="challenged" onClick={fn()} />
      <MatchRow player1={p1} player2={p2} status="date_set" date="Sa, 15.03." onClick={fn()} />
      <MatchRow player1={p1} player2={p2} status="completed" winnerId="player1" scores={[[6,4],[7,5]]} />
      <MatchRow player1={p1} player2={p2} status="withdrawn" />
      <MatchRow player1={p1} player2={p2} status="forfeited" />
    </div>
  ),
};
