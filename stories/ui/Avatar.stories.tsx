import preview from "#.storybook/preview";
import { Avatar } from "@/components/ui/avatar";

const meta = preview.meta({
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    status: {
      control: "select",
      options: [undefined, "available", "challenged", "unavailable"],
    },
  },
});

export default meta;

export const Initials = meta.story({
  args: { name: "Max Mustermann" },
});

export const WithImage = meta.story({
  args: {
    name: "Anna Schmidt",
    src: "https://i.pravatar.cc/80?u=anna",
  },
});

export const Small = meta.story({
  args: { name: "Tim Berg", size: "sm" },
});

export const Large = meta.story({
  args: { name: "Tim Berg", size: "lg" },
});

export const ExtraLarge = meta.story({
  args: { name: "Tim Berg", size: "xl" },
});

export const Available = meta.story({
  args: { name: "Max Mustermann", status: "available" },
});

export const Challenged = meta.story({
  args: { name: "Max Mustermann", status: "challenged" },
});

export const Unavailable = meta.story({
  args: { name: "Max Mustermann", status: "unavailable" },
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar name="SM" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
    </div>
  ),
});

export const AllStatuses = meta.story({
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Verfügbar" status="available" />
      <Avatar name="Gefordert" status="challenged" />
      <Avatar name="Abwesend" status="unavailable" />
      <Avatar name="Kein Status" />
    </div>
  ),
});
