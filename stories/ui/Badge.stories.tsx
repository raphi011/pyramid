import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["win", "loss", "pending", "rank", "info"],
    },
    size: { control: "select", options: ["sm", "default"] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Win: Story = {
  args: { variant: "win", children: "Sieg" },
};

export const Loss: Story = {
  args: { variant: "loss", children: "Niederlage" },
};

export const Pending: Story = {
  args: { variant: "pending", children: "Offen" },
};

export const Rank: Story = {
  args: { variant: "rank", children: "#1" },
};

export const Info: Story = {
  args: { variant: "info", children: "Info" },
};

export const Small: Story = {
  args: { variant: "win", size: "sm", children: "W" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="win">Sieg</Badge>
      <Badge variant="loss">Niederlage</Badge>
      <Badge variant="pending">Offen</Badge>
      <Badge variant="rank">#1</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
