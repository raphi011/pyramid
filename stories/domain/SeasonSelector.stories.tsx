import type { Meta, StoryObj } from "@storybook/react";
import { SeasonSelector } from "@/components/domain/season-selector";

const meta: Meta<typeof SeasonSelector> = {
  title: "Domain/SeasonSelector",
  component: SeasonSelector,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof SeasonSelector>;

export const SingleSeason: Story = {
  args: {
    seasons: [{ id: "2026", name: "Saison 2026" }],
    value: "2026",
  },
};

export const MultipleActive: Story = {
  args: {
    seasons: [
      { id: "2026-singles", name: "Einzel 2026" },
      { id: "2026-doubles", name: "Doppel 2026" },
    ],
    value: "2026-singles",
  },
};

export const WithArchived: Story = {
  args: {
    seasons: [
      { id: "2026", name: "Saison 2026" },
      { id: "2025", name: "Saison 2025", archived: true },
      { id: "2024", name: "Saison 2024", archived: true },
    ],
    value: "2026",
  },
};
