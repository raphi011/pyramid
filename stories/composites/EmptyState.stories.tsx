import preview from "#.storybook/preview";
import { fn } from "storybook/test";
import {
  TrophyIcon,
  CalendarDaysIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/empty-state";

const meta = preview.meta({
  title: "Composites/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const WithAction = meta.story({
  args: {
    icon: <TrophyIcon />,
    title: "Keine Rangliste",
    description:
      "Es gibt noch keine aktive Saison. Erstelle eine neue Saison um loszulegen.",
    action: { label: "Saison erstellen", onClick: fn() },
  },
});

export const WithoutAction = meta.story({
  args: {
    icon: <CalendarDaysIcon />,
    title: "Keine Spiele",
    description: "Es sind noch keine Spiele in dieser Saison eingetragen.",
  },
});

export const NotificationsEmpty = meta.story({
  args: {
    icon: <BellIcon />,
    title: "Keine Neuigkeiten",
    description: "Sobald etwas passiert, wirst du hier benachrichtigt.",
  },
});
