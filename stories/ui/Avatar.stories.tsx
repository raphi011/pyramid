import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@/components/ui/avatar";

const meta: Meta<typeof Avatar> = {
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
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  args: { name: "Max Mustermann" },
};

export const WithImage: Story = {
  args: {
    name: "Anna Schmidt",
    src: "https://i.pravatar.cc/80?u=anna",
  },
};

export const Small: Story = {
  args: { name: "Tim Berg", size: "sm" },
};

export const Large: Story = {
  args: { name: "Tim Berg", size: "lg" },
};

export const ExtraLarge: Story = {
  args: { name: "Tim Berg", size: "xl" },
};

export const Available: Story = {
  args: { name: "Max Mustermann", status: "available" },
};

export const Challenged: Story = {
  args: { name: "Max Mustermann", status: "challenged" },
};

export const Unavailable: Story = {
  args: { name: "Max Mustermann", status: "unavailable" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar name="SM" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Verfügbar" status="available" />
      <Avatar name="Gefordert" status="challenged" />
      <Avatar name="Abwesend" status="unavailable" />
      <Avatar name="Kein Status" />
    </div>
  ),
};
