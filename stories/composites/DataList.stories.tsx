import type { Meta, StoryObj } from "@storybook/react";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { DataList } from "@/components/data-list";

const meta: Meta = {
  title: "Composites/DataList",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const sampleItems = [
  { id: 1, name: "Max Mustermann", rank: 1 },
  { id: 2, name: "Anna Schmidt", rank: 2 },
  { id: 3, name: "Tom Weber", rank: 3 },
  { id: 4, name: "Lisa Müller", rank: 4 },
];

export const WithItems: Story = {
  render: () => (
    <DataList
      items={sampleItems}
      keyExtractor={(item) => item.id}
      renderItem={(item) => (
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {item.name}
          </span>
          <span className="text-xs text-slate-500">Rang {item.rank}</span>
        </div>
      )}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <DataList
      items={[]}
      loading
      loadingCount={4}
      keyExtractor={(_, i) => i}
      renderItem={() => null}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataList
      items={[]}
      keyExtractor={(_, i) => i}
      renderItem={() => null}
      empty={{
        icon: <TrophyIcon />,
        title: "Keine Spieler",
        description: "Es sind noch keine Spieler in dieser Saison.",
        action: { label: "Spieler einladen", onClick: () => {} },
      }}
    />
  ),
};
