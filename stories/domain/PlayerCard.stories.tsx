import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { PlayerCard } from "@/components/domain/player-card";

const meta = preview.meta({
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
});

export default meta;

export const Default = meta.story({
  args: {
    name: "Max Mustermann",
    rank: 3,
    wins: 5,
    losses: 2,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Player name is visible
    await expect(canvas.getAllByText("Max Mustermann").length).toBeGreaterThan(0);

    // Click the card and verify callback fires
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Current = meta.story({
  args: {
    name: "Max Mustermann",
    rank: 3,
    wins: 5,
    losses: 2,
    variant: "current",
  },
});

export const Challengeable = meta.story({
  args: {
    name: "Anna Schmidt",
    rank: 2,
    wins: 8,
    losses: 1,
    variant: "challengeable",
  },
});

export const Challenged = meta.story({
  args: {
    name: "Tom Weber",
    rank: 4,
    wins: 3,
    losses: 4,
    variant: "challenged",
  },
});

export const Unavailable = meta.story({
  args: {
    name: "Lisa Müller",
    rank: 6,
    wins: 2,
    losses: 3,
    variant: "unavailable",
  },
});

export const Compact = meta.story({
  args: {
    name: "Max Mustermann",
    rank: 3,
    variant: "current",
    compact: true,
  },
});

export const RankOne = meta.story({
  args: {
    name: "Julia Fischer",
    rank: 1,
    wins: 12,
    losses: 0,
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="space-y-3 w-72">
      <PlayerCard name="Max Mustermann" rank={1} wins={12} losses={0} />
      <PlayerCard name="Max Mustermann" rank={3} wins={5} losses={2} variant="current" />
      <PlayerCard name="Anna Schmidt" rank={2} wins={8} losses={1} variant="challengeable" onClick={fn()} />
      <PlayerCard name="Tom Weber" rank={4} wins={3} losses={4} variant="challenged" />
      <PlayerCard name="Lisa Müller" rank={6} wins={2} losses={3} variant="unavailable" />
    </div>
  ),
});
