import type { Meta, StoryObj } from "@storybook/react";
import { StandingsTable } from "@/components/domain/standings-table";

const meta: Meta<typeof StandingsTable> = {
  title: "Domain/StandingsTable",
  component: StandingsTable,
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
type Story = StoryObj<typeof StandingsTable>;

const players = [
  { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0, movement: "up" as const },
  { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1, movement: "none" as const },
  { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, movement: "down" as const },
  { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3, movement: "up" as const },
  { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4, movement: "none" as const },
  { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5, movement: "down" as const },
];

export const Default: Story = {
  args: {
    players,
    onPlayerClick: () => {},
  },
};

export const WithChallengeableRows: Story = {
  args: {
    players: players.map((p) => ({
      ...p,
      challengeable: p.rank === 1 || p.rank === 2,
    })),
    onPlayerClick: () => {},
  },
};
