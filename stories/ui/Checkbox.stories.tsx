import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { Checkbox } from "@/components/ui/checkbox";

const meta = preview.meta({
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Unchecked = meta.story({
  args: { label: "Option" },
});

export const Checked = meta.story({
  args: { label: "Option", defaultChecked: true },
});

export const WithLabel = meta.story({
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
});

export const CheckedWithLabel = meta.story({
  args: { label: "AGB akzeptiert", defaultChecked: true },
});

export const Disabled = meta.story({
  args: { label: "Nicht verfügbar", disabled: true },
});

export const DisabledChecked = meta.story({
  args: { label: "Gesperrt", disabled: true, defaultChecked: true },
});
