import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { DataList } from "@/components/data-list";

const meta = preview.meta({
  title: "Composites/DataList",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
});

export default meta;

const sampleItems = [
  { id: 1, name: "Max Mustermann", rank: 1 },
  { id: 2, name: "Anna Schmidt", rank: 2 },
  { id: 3, name: "Tom Weber", rank: 3 },
  { id: 4, name: "Lisa Müller", rank: 4 },
];

export const WithItems = meta.story({
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All 4 items render
    await expect(canvas.getByText("Max Mustermann")).toBeInTheDocument();
    await expect(canvas.getByText("Anna Schmidt")).toBeInTheDocument();
    await expect(canvas.getByText("Tom Weber")).toBeInTheDocument();
    await expect(canvas.getByText("Lisa Müller")).toBeInTheDocument();

    // Separators between items (3 for 4 items)
    const separators = canvas.getAllByRole("separator");
    await expect(separators).toHaveLength(3);
  },
});

export const Loading = meta.story({
  render: () => (
    <DataList
      items={[]}
      loading
      loadingCount={4}
      keyExtractor={(_, i) => i}
      renderItem={() => null}
    />
  ),
});

export const Empty = meta.story({
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Empty state renders with title and action button
    await expect(canvas.getByText("Keine Spieler")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Spieler einladen" })).toBeInTheDocument();
  },
});
