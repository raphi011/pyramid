"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReorderableList } from "@/components/reorderable-list";

const meta: Meta = {
  title: "Extended/ReorderableList",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

type Player = { id: string; name: string; rank: number };

function ReorderDemo() {
  const [items, setItems] = useState<Player[]>([
    { id: "1", name: "Julia Fischer", rank: 1 },
    { id: "2", name: "Anna Schmidt", rank: 2 },
    { id: "3", name: "Tom Weber", rank: 3 },
    { id: "4", name: "Lisa Müller", rank: 4 },
    { id: "5", name: "Max Braun", rank: 5 },
  ]);

  return (
    <ReorderableList
      items={items}
      onReorder={setItems}
      renderItem={(item, index) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tabular-nums text-slate-400">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {item.name}
          </span>
        </div>
      )}
    />
  );
}

export const Default: Story = {
  render: () => <ReorderDemo />,
};

export const Empty: Story = {
  render: () => (
    <ReorderableList
      items={[]}
      onReorder={() => {}}
      renderItem={() => null}
    />
  ),
};
