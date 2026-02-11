import type { Meta, StoryObj } from "@storybook/react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: "Spieler herausfordern",
    children: <Button>Fordern</Button>,
  },
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip content="Rang basiert auf den letzten 30 Tagen">
      <button className="text-slate-400 hover:text-slate-600">
        <InformationCircleIcon className="size-5" />
      </button>
    </Tooltip>
  ),
};
