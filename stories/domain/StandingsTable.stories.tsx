import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { StandingsTable } from "@/components/domain/standings-table";
import { sixStandingsPlayers } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/StandingsTable",
  component: StandingsTable,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onPlayerClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  args: {
    players: sixStandingsPlayers,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // All 6 players render
    const rows = canvas.getAllByRole("button");
    await expect(rows).toHaveLength(6);

    // First player (rank 1) is visible
    await expect(canvas.getAllByText("Julia Fischer").length).toBeGreaterThan(0);

    // Click a row and verify callback fires with player data
    await userEvent.click(rows[2]);
    await expect(args.onPlayerClick).toHaveBeenCalledOnce();
  },
});

export const WithChallengeableRows = meta.story({
  args: {
    players: sixStandingsPlayers.map((p) => ({
      ...p,
      challengeable: p.rank === 1 || p.rank === 2,
    })),
  },
});
