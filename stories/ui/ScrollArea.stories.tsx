import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "@/components/ui/scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/Scroll Area",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-2xl p-4 ring-1 ring-slate-200">
      <div className="space-y-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            Eintrag {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      orientation="horizontal"
      className="w-64 rounded-2xl p-4 ring-1 ring-slate-200"
    >
      <div className="flex gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 rounded-xl bg-slate-50 px-6 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
