import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { Switch } from "@/components/ui/switch";

const meta = preview.meta({
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Off = meta.story({
  args: { label: "Option" },
});

export const On = meta.story({
  args: { label: "Option", defaultChecked: true },
});

export const WithLabel = meta.story({
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
});

export const OnWithLabel = meta.story({
  args: { label: "Benachrichtigungen", defaultChecked: true },
});

export const Disabled = meta.story({
  args: { label: "Nicht verfügbar", disabled: true },
});

export const DisabledOn = meta.story({
  args: { label: "Gesperrt", disabled: true, defaultChecked: true },
});
