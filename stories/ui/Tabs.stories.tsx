import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { Tabs } from "@/components/ui/tabs";

const meta = preview.meta({
  title: "UI/Tabs",
  component: Tabs,
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

export const TwoTabs = meta.story({
  args: {
    items: [
      {
        label: "Pyramide",
        content: (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pyramiden-Ansicht der aktuellen Rangliste.
          </p>
        ),
      },
      {
        label: "Tabelle",
        content: (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tabellarische Ansicht mit Statistiken.
          </p>
        ),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // First tab content visible
    await expect(canvas.getByText("Pyramiden-Ansicht der aktuellen Rangliste.")).toBeInTheDocument();

    // Click second tab
    await userEvent.click(canvas.getByRole("tab", { name: "Tabelle" }));

    // Second tab content visible
    await expect(canvas.getByText("Tabellarische Ansicht mit Statistiken.")).toBeInTheDocument();
  },
});

export const FourTabs = meta.story({
  args: {
    items: [
      { label: "Alle", content: <p className="text-sm text-slate-600">Alle Spiele</p> },
      { label: "Offen", content: <p className="text-sm text-slate-600">Offene Forderungen</p> },
      { label: "Laufend", content: <p className="text-sm text-slate-600">Laufende Spiele</p> },
      { label: "Beendet", content: <p className="text-sm text-slate-600">Abgeschlossene Spiele</p> },
    ],
  },
});
