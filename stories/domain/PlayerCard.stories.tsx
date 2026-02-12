import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PlayerCard } from "@/components/domain/player-card";

const meta: Meta<typeof PlayerCard> = {
  title: "Domain/PlayerCard",
  component: PlayerCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: [undefined, "current", "challengeable", "challenged", "unavailable"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlayerCard>;

export const Default: Story = {
  args: {
    name: "Max Mustermann",
    rank: 3,
    wins: 5,
    losses: 2,
  },
};

export const Current: Story = {
  args: {
    name: "Max Mustermann",
    rank: 3,
    wins: 5,
    losses: 2,
    variant: "current",
  },
};

export const Challengeable: Story = {
  args: {
    name: "Anna Schmidt",
    rank: 2,
    wins: 8,
    losses: 1,
    variant: "challengeable",
  },
};

export const Challenged: Story = {
  args: {
    name: "Tom Weber",
    rank: 4,
    wins: 3,
    losses: 4,
    variant: "challenged",
  },
};

export const Unavailable: Story = {
  args: {
    name: "Lisa Müller",
    rank: 6,
    wins: 2,
    losses: 3,
    variant: "unavailable",
  },
};

export const Compact: Story = {
  args: {
    name: "Max Mustermann",
    rank: 3,
    variant: "current",
    compact: true,
  },
};

export const RankOne: Story = {
  args: {
    name: "Julia Fischer",
    rank: 1,
    wins: 12,
    losses: 0,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-3 w-72">
      <PlayerCard name="Max Mustermann" rank={1} wins={12} losses={0} />
      <PlayerCard name="Max Mustermann" rank={3} wins={5} losses={2} variant="current" />
      <PlayerCard name="Anna Schmidt" rank={2} wins={8} losses={1} variant="challengeable" onClick={fn()} />
      <PlayerCard name="Tom Weber" rank={4} wins={3} losses={4} variant="challenged" />
      <PlayerCard name="Lisa Müller" rank={6} wins={2} losses={3} variant="unavailable" />
    </div>
  ),
};
