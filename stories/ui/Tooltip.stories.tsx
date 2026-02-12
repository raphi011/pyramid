import preview from "#.storybook/preview";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const meta = preview.meta({
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const Default = meta.story({
  args: {
    content: "Spieler herausfordern",
    children: <Button>Fordern</Button>,
  },
});

export const WithIcon = meta.story({
  render: () => (
    <Tooltip content="Rang basiert auf den letzten 30 Tagen">
      <button className="text-slate-400 hover:text-slate-600" aria-label="Info">
        <InformationCircleIcon className="size-5" />
      </button>
    </Tooltip>
  ),
});
