"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { BottomNav } from "@/components/bottom-nav";

const meta: Meta<typeof BottomNav> = {
  title: "Composites/BottomNav",
  component: BottomNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "iPhoneSE" },
  },
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

const navItems = [
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
];

function BottomNavDemo() {
  const [active, setActive] = useState("/neuigkeiten");
  return (
    <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <p className="text-sm text-slate-500">Aktiver Tab: {active}</p>
      </div>
      <BottomNav
        items={navItems}
        activeHref={active}
        onNavigate={setActive}
        fab={{
          icon: <PlusIcon />,
          label: "Fordern",
          onClick: () => {},
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <BottomNavDemo />,
};

export const WithBadge: Story = {
  render: () => {
    const itemsWithBadge = [
      { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
      { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 5 },
    ];
    return (
      <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
        <BottomNav
          items={itemsWithBadge}
          activeHref="/rangliste"
          fab={{
            icon: <PlusIcon />,
            label: "Fordern",
            onClick: () => {},
          }}
        />
      </div>
    );
  },
};

export const FABDisabled: Story = {
  render: () => (
    <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
      <BottomNav
        items={navItems}
        activeHref="/neuigkeiten"
        fab={{
          icon: <PlusIcon />,
          label: "Fordern",
          onClick: () => {},
          disabled: true,
        }}
      />
    </div>
  ),
};
