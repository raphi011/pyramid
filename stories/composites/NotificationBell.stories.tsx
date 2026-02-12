import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { NotificationBell } from "@/components/notification-bell";

const meta = preview.meta({
  title: "Extended/NotificationBell",
  component: NotificationBell,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
});

export default meta;

export const NoNotifications = meta.story({});

export const WithCount = meta.story({
  args: { count: 3 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Badge count should be visible
    await expect(canvas.getByText("3")).toBeInTheDocument();

    // Click the bell
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClick).toHaveBeenCalled();
  },
});

export const HighCount = meta.story({
  args: { count: 42 },
});

export const Pulsing = meta.story({
  args: { count: 1, pulsing: true },
});
