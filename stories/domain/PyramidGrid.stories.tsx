import preview from "#.storybook/preview";
import { fn } from "storybook/test";
import { PyramidGrid } from "@/components/domain/pyramid-grid";
import { tenPyramidPlayers } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/PyramidGrid",
  component: PyramidGrid,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onPlayerClick: fn(),
  },
});

export default meta;

export const TenPlayers = meta.story({
  args: {
    players: tenPyramidPlayers,
  },
});

export const WithHighlights = meta.story({
  args: {
    players: [
      { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0 },
      { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1, variant: "challengeable" as const },
      { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, variant: "current" as const },
      { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3, variant: "challenged" as const },
      { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4 },
      { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5, variant: "unavailable" as const },
    ],
  },
});

export const SmallPyramid = meta.story({
  args: {
    players: [
      { id: 1, name: "Julia Fischer", rank: 1 },
      { id: 2, name: "Anna Schmidt", rank: 2 },
      { id: 3, name: "Tom Weber", rank: 3, variant: "current" as const },
    ],
  },
});
