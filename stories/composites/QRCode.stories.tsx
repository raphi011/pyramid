import type { Meta, StoryObj } from "@storybook/react-vite";
import { QRCode } from "@/components/qr-code";

const meta: Meta<typeof QRCode> = {
  title: "Extended/QRCode",
  component: QRCode,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof QRCode>;

export const Default: Story = {
  args: {
    value: "ABC123",
    label: "Einladungscode: ABC123",
  },
};

export const Small: Story = {
  args: {
    value: "XYZ789",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    value: "https://pyramid.example.com/join/ABC123",
    size: "lg",
    label: "QR-Code scannen zum Beitreten",
  },
};
