"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { ReorderableList } from "@/components/reorderable-list";

const meta = preview.meta({
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
});

export default meta;

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

export const Default = meta.story({
  render: () => <ReorderDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All 5 players render in order
    await expect(canvas.getByText("Julia Fischer")).toBeInTheDocument();
    await expect(canvas.getByText("Anna Schmidt")).toBeInTheDocument();
    await expect(canvas.getByText("Tom Weber")).toBeInTheDocument();
    await expect(canvas.getByText("Lisa Müller")).toBeInTheDocument();
    await expect(canvas.getByText("Max Braun")).toBeInTheDocument();

    // Drag handles are present (one per item)
    const dragHandles = canvas.getAllByRole("button", { name: /ziehen/i });
    await expect(dragHandles).toHaveLength(5);
  },
});

export const Empty = meta.story({
  render: () => (
    <ReorderableList items={[]} onReorder={() => {}} renderItem={() => null} />
  ),
});
