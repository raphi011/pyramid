import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, within, userEvent, expect } from "storybook/test";
import { SeasonSelector } from "@/components/domain/season-selector";

const meta: Meta<typeof SeasonSelector> = {
  title: "Domain/SeasonSelector",
  component: SeasonSelector,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onChange: fn(),
  },
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const select = canvas.getByRole("combobox");
    await expect(select).toHaveValue("2026");

    // Select an archived season
    await userEvent.selectOptions(select, "2025");
    await expect(args.onChange).toHaveBeenCalledWith("2025");
  },
};
