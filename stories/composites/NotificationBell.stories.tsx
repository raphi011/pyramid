import type { Meta, StoryObj } from "@storybook/react";
import { NotificationBell } from "@/components/notification-bell";

const meta: Meta<typeof NotificationBell> = {
  title: "Extended/NotificationBell",
  component: NotificationBell,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

export const NoNotifications: Story = {
  args: { onClick: () => {} },
};

export const WithCount: Story = {
  args: { count: 3, onClick: () => {} },
};

export const HighCount: Story = {
  args: { count: 42, onClick: () => {} },
};

export const Pulsing: Story = {
  args: { count: 1, pulsing: true, onClick: () => {} },
};
