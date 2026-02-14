import preview from "#.storybook/preview";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const meta = preview.meta({
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({
  render: () => (
    <Popover trigger={<Button variant="outline">Info</Button>}>
      <div className="w-56">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Pyramiden-Regeln
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Du kannst Spieler in der gleichen Reihe oder eine Reihe darüber
          herausfordern.
        </p>
      </div>
    </Popover>
  ),
});
