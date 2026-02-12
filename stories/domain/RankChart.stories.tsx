import preview from "#.storybook/preview";
import { RankChart } from "@/components/domain/rank-chart";

const meta = preview.meta({
  title: "Extended/RankChart",
  component: RankChart,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Rising = meta.story({
  args: {
    data: [
      { date: "Jan", rank: 8 },
      { date: "Feb", rank: 6 },
      { date: "Mär", rank: 5 },
      { date: "Apr", rank: 3 },
      { date: "Mai", rank: 2 },
    ],
  },
});

export const Falling = meta.story({
  args: {
    data: [
      { date: "Jan", rank: 1 },
      { date: "Feb", rank: 2 },
      { date: "Mär", rank: 4 },
      { date: "Apr", rank: 5 },
      { date: "Mai", rank: 7 },
    ],
  },
});

export const Stable = meta.story({
  args: {
    data: [
      { date: "Jan", rank: 3 },
      { date: "Feb", rank: 3 },
      { date: "Mär", rank: 4 },
      { date: "Apr", rank: 3 },
      { date: "Mai", rank: 3 },
    ],
  },
});

export const Empty = meta.story({
  args: { data: [] },
});
