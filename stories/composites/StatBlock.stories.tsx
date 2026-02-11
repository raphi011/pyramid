import type { Meta, StoryObj } from "@storybook/react";
import { StatBlock } from "@/components/stat-block";

const meta: Meta<typeof StatBlock> = {
  title: "Composites/StatBlock",
  component: StatBlock,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof StatBlock>;

export const NumberValue: Story = {
  args: {
    label: "Aktueller Rang",
    value: 3,
  },
};

export const TrendUp: Story = {
  args: {
    label: "Siege",
    value: 12,
    trend: "up",
    trendValue: "+3",
  },
};

export const TrendDown: Story = {
  args: {
    label: "Rang",
    value: 7,
    trend: "down",
    trendValue: "-2",
  },
};

export const Neutral: Story = {
  args: {
    label: "Spiele gesamt",
    value: 24,
    trend: "neutral",
  },
};

export const StatGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <StatBlock label="Rang" value={3} trend="up" trendValue="+2" />
      <StatBlock label="Siege" value={12} trend="up" trendValue="+3" />
      <StatBlock label="Niederlagen" value={5} trend="down" trendValue="+1" />
      <StatBlock label="Spiele" value={17} trend="neutral" />
    </div>
  ),
};
