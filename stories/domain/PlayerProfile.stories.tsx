import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PlayerProfile } from "@/components/domain/player-profile";

const meta: Meta<typeof PlayerProfile> = {
  title: "Domain/PlayerProfile",
  component: PlayerProfile,
  tags: ["autodocs"],
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
type Story = StoryObj<typeof PlayerProfile>;

export const OwnProfile: Story = {
  args: {
    name: "Max Mustermann",
    rank: 3,
    wins: 12,
    losses: 5,
    totalMatches: 17,
    winRate: "71%",
    trend: "up",
    trendValue: "+2",
    isOwnProfile: true,
    onEdit: fn(),
  },
};

export const OtherPlayer: Story = {
  args: {
    name: "Anna Schmidt",
    rank: 2,
    wins: 8,
    losses: 1,
    totalMatches: 9,
    winRate: "89%",
    canChallenge: true,
    onChallenge: fn(),
  },
};

export const Unavailable: Story = {
  args: {
    name: "Erik Meier",
    rank: 7,
    wins: 2,
    losses: 6,
    totalMatches: 8,
    winRate: "25%",
    trend: "down",
    trendValue: "-3",
    unavailable: true,
  },
};
