import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventItem, type EventType } from "@/components/domain/event-item";

const meta: Meta<typeof EventItem> = {
  title: "Domain/EventItem",
  component: EventItem,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    type: {
      control: "select",
      options: ["result", "challenge", "withdrawal", "forfeit", "rank_change", "new_player", "season_start", "season_end", "unavailable"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventItem>;

export const Result: Story = {
  args: {
    type: "result",
    title: "Max M. hat gegen Anna S. gewonnen",
    description: "6:4, 3:6, 7:5",
    timestamp: "vor 2 Stunden",
    player: { name: "Max Mustermann" },
  },
};

export const Challenge: Story = {
  args: {
    type: "challenge",
    title: "Tom W. hat Anna S. herausgefordert",
    timestamp: "vor 5 Stunden",
    player: { name: "Tom Weber" },
  },
};

export const Withdrawal: Story = {
  args: {
    type: "withdrawal",
    title: "Herausforderung zurückgezogen",
    description: "Max M. → Anna S.",
    timestamp: "gestern",
  },
};

export const Forfeit: Story = {
  args: {
    type: "forfeit",
    title: "Lisa M. hat aufgegeben",
    description: "Frist abgelaufen. Rang getauscht.",
    timestamp: "vor 2 Tagen",
    player: { name: "Lisa Müller" },
  },
};

export const RankChange: Story = {
  args: {
    type: "rank_change",
    title: "Max M. ist auf Rang 3 aufgestiegen",
    timestamp: "vor 3 Tagen",
    player: { name: "Max Mustermann" },
  },
};

export const NewPlayer: Story = {
  args: {
    type: "new_player",
    title: "Sarah H. ist dem Verein beigetreten",
    timestamp: "vor 1 Woche",
    player: { name: "Sarah Hoffmann" },
  },
};

export const SeasonStart: Story = {
  args: {
    type: "season_start",
    title: "Saison 2026 gestartet",
    description: "12 Spieler sind angemeldet.",
    timestamp: "01.01.2026",
  },
};

export const SeasonEnd: Story = {
  args: {
    type: "season_end",
    title: "Saison 2025 beendet",
    description: "Sieger: Julia Fischer",
    timestamp: "31.12.2025",
  },
};

export const Unavailable: Story = {
  args: {
    type: "unavailable",
    title: "Erik M. ist bis 20.03. abwesend",
    timestamp: "vor 1 Tag",
    player: { name: "Erik Meier" },
  },
};

export const AllTypes: Story = {
  render: () => {
    const events: { type: EventType; title: string; timestamp: string }[] = [
      { type: "result", title: "Ergebnis eingetragen", timestamp: "vor 1h" },
      { type: "challenge", title: "Neue Herausforderung", timestamp: "vor 2h" },
      { type: "withdrawal", title: "Rückzug", timestamp: "vor 3h" },
      { type: "forfeit", title: "Aufgabe", timestamp: "vor 4h" },
      { type: "rank_change", title: "Rangänderung", timestamp: "vor 5h" },
      { type: "new_player", title: "Neuer Spieler", timestamp: "vor 6h" },
      { type: "season_start", title: "Saison gestartet", timestamp: "vor 7h" },
      { type: "season_end", title: "Saison beendet", timestamp: "vor 8h" },
      { type: "unavailable", title: "Abwesenheit", timestamp: "vor 9h" },
    ];
    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {events.map((e) => (
          <EventItem key={e.type} {...e} />
        ))}
      </div>
    );
  },
};
