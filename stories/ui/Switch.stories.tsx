import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/ui/switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Off: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const WithLabel: Story = {
  args: { label: "Dark Mode" },
};

export const OnWithLabel: Story = {
  args: { label: "Benachrichtigungen", defaultChecked: true },
};

export const Disabled: Story = {
  args: { label: "Nicht verfügbar", disabled: true },
};

export const DisabledOn: Story = {
  args: { label: "Gesperrt", disabled: true, defaultChecked: true },
};
