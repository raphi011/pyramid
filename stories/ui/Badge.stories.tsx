import preview from "#.storybook/preview";
import { Badge } from "@/components/ui/badge";

const meta = preview.meta({
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["win", "loss", "pending", "rank", "info", "subtle"],
    },
    size: { control: "select", options: ["sm", "default"] },
  },
});

export default meta;

export const Win = meta.story({
  args: { variant: "win", children: "Sieg" },
});

export const Loss = meta.story({
  args: { variant: "loss", children: "Niederlage" },
});

export const Pending = meta.story({
  args: { variant: "pending", children: "Offen" },
});

export const Rank = meta.story({
  args: { variant: "rank", children: "#1" },
});

export const Info = meta.story({
  args: { variant: "info", children: "Info" },
});

export const Subtle = meta.story({
  args: { variant: "subtle", children: "Herausforderung" },
});

export const Small = meta.story({
  args: { variant: "win", size: "sm", children: "W" },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="win">Sieg</Badge>
      <Badge variant="loss">Niederlage</Badge>
      <Badge variant="pending">Offen</Badge>
      <Badge variant="rank">#1</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="subtle">Herausforderung</Badge>
    </div>
  ),
});
