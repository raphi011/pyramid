import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, within, userEvent, expect } from "storybook/test";
import { NotificationBell } from "@/components/notification-bell";

const meta: Meta<typeof NotificationBell> = {
  title: "Extended/NotificationBell",
  component: NotificationBell,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

export const NoNotifications: Story = {};

export const WithCount: Story = {
  args: { count: 3 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Badge count should be visible
    await expect(canvas.getByText("3")).toBeInTheDocument();

    // Click the bell
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const HighCount: Story = {
  args: { count: 42 },
};

export const Pulsing: Story = {
  args: { count: 1, pulsing: true },
};
