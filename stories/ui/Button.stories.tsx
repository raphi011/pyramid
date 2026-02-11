import type { Meta, StoryObj } from "@storybook/react";
import {
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "outline", "destructive", "ghost"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "Primary Button" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Löschen" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Small: Story = {
  args: { size: "sm", children: "Small" },
};

export const Large: Story = {
  args: { size: "lg", children: "Large" },
};

export const Loading: Story = {
  args: { loading: true, children: "Laden..." },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const WithIconLeft: Story = {
  args: {
    children: (
      <>
        <PlusIcon />
        Erstellen
      </>
    ),
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Weiter
        <ArrowRightIcon />
      </>
    ),
  },
};

export const DestructiveWithIcon: Story = {
  args: {
    variant: "destructive",
    children: (
      <>
        <TrashIcon />
        Löschen
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
