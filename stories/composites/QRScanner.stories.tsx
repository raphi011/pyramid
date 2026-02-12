import preview from "#.storybook/preview";
import { fn } from "storybook/test";
import { QRScanner } from "@/components/qr-scanner";

const meta = preview.meta({
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
});

export default meta;

export const Idle = meta.story({
  args: {
    status: "idle",
    onStart: fn(),
  },
});

export const Scanning = meta.story({
  args: {
    status: "scanning",
  },
});

export const Denied = meta.story({
  args: {
    status: "denied",
  },
});

export const Success = meta.story({
  args: {
    status: "success",
    onResult: "ABC123",
  },
});
