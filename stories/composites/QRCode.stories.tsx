import preview from "#.storybook/preview";
import { QRCode } from "@/components/qr-code";

const meta = preview.meta({
  title: "Extended/QRCode",
  component: QRCode,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({
  args: {
    value: "ABC123",
    label: "Einladungscode: ABC123",
  },
});

export const Small = meta.story({
  args: {
    value: "XYZ789",
    size: "sm",
  },
});

export const Large = meta.story({
  args: {
    value: "https://pyramid.example.com/join/ABC123",
    size: "lg",
    label: "QR-Code scannen zum Beitreten",
  },
});
