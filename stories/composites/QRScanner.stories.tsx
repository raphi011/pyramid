import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { QRScanner } from "@/components/qr-scanner";

const meta: Meta<typeof QRScanner> = {
  title: "Extended/QRScanner",
  component: QRScanner,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    status: {
      control: "select",
      options: ["idle", "scanning", "denied", "success"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof QRScanner>;

export const Idle: Story = {
  args: {
    status: "idle",
    onStart: fn(),
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
