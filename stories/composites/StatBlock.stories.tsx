import preview from "#.storybook/preview";
import { StatBlock } from "@/components/stat-block";

const meta = preview.meta({
  title: "Composites/StatBlock",
  component: StatBlock,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    trend: {
      control: "select",
      options: [undefined, "up", "down", "neutral"],
    },
  },
});

export default meta;

export const NumberValue = meta.story({
  args: {
    label: "Aktueller Rang",
    value: 3,
  },
});

export const TrendUp = meta.story({
  args: {
    label: "Siege",
    value: 12,
    trend: "up",
    trendValue: "+3",
  },
});

export const TrendDown = meta.story({
  args: {
    label: "Rang",
    value: 7,
    trend: "down",
    trendValue: "-2",
  },
});

export const Neutral = meta.story({
  args: {
    label: "Spiele gesamt",
    value: 24,
    trend: "neutral",
  },
});

export const StatGrid = meta.story({
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <StatBlock label="Rang" value={3} trend="up" trendValue="+2" />
      <StatBlock label="Siege" value={12} trend="up" trendValue="+3" />
      <StatBlock label="Niederlagen" value={5} trend="down" trendValue="+1" />
      <StatBlock label="Spiele" value={17} trend="neutral" />
    </div>
  ),
});
