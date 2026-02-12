import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  TrophyIcon,
  CalendarDaysIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/empty-state";

const meta: Meta<typeof EmptyState> = {
  title: "Composites/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const WithAction: Story = {
  args: {
    icon: <TrophyIcon />,
    title: "Keine Rangliste",
    description: "Es gibt noch keine aktive Saison. Erstelle eine neue Saison um loszulegen.",
    action: { label: "Saison erstellen", onClick: fn() },
  },
};

export const WithoutAction: Story = {
  args: {
    icon: <CalendarDaysIcon />,
    title: "Keine Spiele",
    description: "Es sind noch keine Spiele in dieser Saison eingetragen.",
  },
};

export const NotificationsEmpty: Story = {
  args: {
    icon: <BellIcon />,
    title: "Keine Neuigkeiten",
    description: "Sobald etwas passiert, wirst du hier benachrichtigt.",
  },
};
