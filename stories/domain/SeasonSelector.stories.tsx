import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { SeasonSelector } from "@/components/domain/season-selector";
import { seasonsWithDraft } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/SeasonSelector",
  component: SeasonSelector,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onChange: fn(),
  },
});

export default meta;

export const SingleSeason = meta.story({
  args: {
    seasons: [
      {
        id: "2026",
        slug: "saison-2026",
        name: "Saison 2026",
        status: "active",
      },
    ],
    value: "saison-2026",
  },
});

export const MultipleActive = meta.story({
  args: {
    seasons: [
      {
        id: "2026-singles",
        slug: "einzel-2026",
        name: "Einzel 2026",
        status: "active",
      },
      {
        id: "2026-doubles",
        slug: "doppel-2026",
        name: "Doppel 2026",
        status: "active",
      },
    ],
    value: "einzel-2026",
  },
});

export const WithArchived = meta.story({
  args: {
    seasons: [
      {
        id: "2026",
        slug: "saison-2026",
        name: "Saison 2026",
        status: "active",
      },
      { id: "2025", slug: "saison-2025", name: "Saison 2025", status: "ended" },
      { id: "2024", slug: "saison-2024", name: "Saison 2024", status: "ended" },
    ],
    value: "saison-2026",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const select = canvas.getByRole("combobox");
    await expect(select).toHaveValue("saison-2026");

    // Select an archived season
    await userEvent.selectOptions(select, "saison-2025");
    await expect(args.onChange).toHaveBeenCalledWith("saison-2025");
  },
});

export const WithDraftSeason = meta.story({
  args: {
    seasons: seasonsWithDraft,
    value: "s1",
  },
});
