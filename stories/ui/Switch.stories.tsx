import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { Switch } from "@/components/ui/switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const toggle = canvas.getByRole("switch");
    await expect(toggle).not.toBeChecked();

    // Toggle on
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();

    // Toggle off
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
  },
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
