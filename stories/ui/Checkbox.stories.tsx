import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const WithLabel: Story = {
  args: { label: "Benachrichtigungen aktivieren" },
};

export const CheckedWithLabel: Story = {
  args: { label: "AGB akzeptiert", defaultChecked: true },
};

export const Disabled: Story = {
  args: { label: "Nicht verfügbar", disabled: true },
};

export const DisabledChecked: Story = {
  args: { label: "Gesperrt", disabled: true, defaultChecked: true },
};
