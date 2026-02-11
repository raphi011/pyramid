"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TrophyIcon,
  PlusIcon,
  BoltIcon,
  UserIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { BottomNav } from "@/components/bottom-nav";

const meta: Meta<typeof BottomNav> = {
  title: "Composites/BottomNav",
  component: BottomNav,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile" },
  },
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

const navItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rankings" },
  { icon: <BoltIcon />, label: "Spiele", href: "/matches" },
  { icon: <UserIcon />, label: "Profil", href: "/profile" },
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
      { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 5 },
      { icon: <TrophyIcon />, label: "Rangliste", href: "/rankings" },
      { icon: <BoltIcon />, label: "Spiele", href: "/matches" },
      { icon: <UserIcon />, label: "Profil", href: "/profile" },
    ];
    return (
      <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
        <BottomNav
          items={itemsWithBadge}
          activeHref="/rankings"
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
