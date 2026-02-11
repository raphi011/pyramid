import type { Meta, StoryObj } from "@storybook/react";
import { PyramidGrid } from "@/components/domain/pyramid-grid";

const meta: Meta<typeof PyramidGrid> = {
  title: "Domain/PyramidGrid",
  component: PyramidGrid,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PyramidGrid>;

const tenPlayers = [
  { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0 },
  { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1 },
  { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, variant: "current" as const },
  { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3 },
  { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4 },
  { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5 },
  { id: 7, name: "Erik Meier", rank: 7, wins: 2, losses: 6 },
  { id: 8, name: "Clara Bauer", rank: 8, wins: 2, losses: 3 },
  { id: 9, name: "Lukas Richter", rank: 9, wins: 1, losses: 5 },
  { id: 10, name: "Marie Wagner", rank: 10, wins: 0, losses: 7 },
];

export const TenPlayers: Story = {
  args: {
    players: tenPlayers,
    onPlayerClick: () => {},
  },
};

export const WithHighlights: Story = {
  args: {
    players: [
      { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0 },
      { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1, variant: "challengeable" as const },
      { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, variant: "current" as const },
      { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3, variant: "challenged" as const },
      { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4 },
      { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5, variant: "unavailable" as const },
    ],
    onPlayerClick: () => {},
  },
};

export const SmallPyramid: Story = {
  args: {
    players: [
      { id: 1, name: "Julia Fischer", rank: 1 },
      { id: 2, name: "Anna Schmidt", rank: 2 },
      { id: 3, name: "Tom Weber", rank: 3, variant: "current" as const },
    ],
  },
};
