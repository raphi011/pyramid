import preview from "#.storybook/preview";
import { Separator } from "@/components/ui/separator";

const meta = preview.meta({
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Horizontal = meta.story({
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
});

export const Vertical = meta.story({
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
});
