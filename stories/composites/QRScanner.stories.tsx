import type { Meta, StoryObj } from "@storybook/react";
import { QRScanner } from "@/components/qr-scanner";

const meta: Meta<typeof QRScanner> = {
  title: "Extended/QRScanner",
  component: QRScanner,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof QRScanner>;

export const Idle: Story = {
  args: {
    status: "idle",
    onStart: () => {},
  },
};

export const Scanning: Story = {
  args: {
    status: "scanning",
  },
};

export const Denied: Story = {
  args: {
    status: "denied",
  },
};

export const Success: Story = {
  args: {
    status: "success",
    onResult: "ABC123",
  },
};
