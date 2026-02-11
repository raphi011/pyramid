"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TrophyIcon,
  BoltIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { SidebarNav } from "@/components/sidebar-nav";

const meta: Meta<typeof SidebarNav> = {
  title: "Composites/SidebarNav",
  component: SidebarNav,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof SidebarNav>;

const sidebarItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rankings" },
  { icon: <BoltIcon />, label: "Spiele", href: "/matches" },
  { icon: <UserIcon />, label: "Profil", href: "/profile" },
  { icon: <Cog6ToothIcon />, label: "Einstellungen", href: "/settings" },
];

const adminItems = [
  { icon: <ShieldCheckIcon />, label: "Club verwalten", href: "/admin/club/1" },
];

function SidebarDemo() {
  const [active, setActive] = useState("/rankings");
  return (
    <div className="h-[600px]">
      <SidebarNav
        items={sidebarItems}
        activeHref={active}
        onNavigate={setActive}
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <SidebarDemo />,
};

export const WithAdmin: Story = {
  render: () => (
    <div className="h-[600px]">
      <SidebarNav
        items={sidebarItems}
        adminItems={adminItems}
        activeHref="/admin/club/1"
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
      />
    </div>
  ),
};
