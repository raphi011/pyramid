import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <div className="text-sm text-slate-600">Oben</div>
        <div className="py-3">
          <Story />
        </div>
        <div className="text-sm text-slate-600">Unten</div>
      </div>
    ),
  ],
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  decorators: [
    (Story) => (
      <div className="flex h-8 items-center gap-3">
        <span className="text-sm text-slate-600">Links</span>
        <Story />
        <span className="text-sm text-slate-600">Rechts</span>
      </div>
    ),
  ],
};
