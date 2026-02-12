import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    // Check via label click
    await userEvent.click(canvas.getByText("Benachrichtigungen aktivieren"));
    await expect(checkbox).toBeChecked();

    // Uncheck
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
  },
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
