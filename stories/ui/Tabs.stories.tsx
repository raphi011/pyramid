import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "@/components/ui/tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
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
type Story = StoryObj<typeof Tabs>;

export const TwoTabs: Story = {
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
};

export const FourTabs: Story = {
  args: {
    items: [
      { label: "Alle", content: <p className="text-sm text-slate-600">Alle Spiele</p> },
      { label: "Offen", content: <p className="text-sm text-slate-600">Offene Forderungen</p> },
      { label: "Laufend", content: <p className="text-sm text-slate-600">Laufende Spiele</p> },
      { label: "Beendet", content: <p className="text-sm text-slate-600">Abgeschlossene Spiele</p> },
    ],
  },
};
