"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { SidebarNav } from "@/components/sidebar-nav";

const meta = preview.meta({
  title: "Composites/SidebarNav",
  component: SidebarNav,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

const sidebarItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <Cog6ToothIcon />, label: "Einstellungen", href: "/settings" },
];

const adminItems = [
  { icon: <ShieldCheckIcon />, label: "Club verwalten", href: "/admin/club/1" },
];

function SidebarDemo() {
  const [active, setActive] = useState("/rangliste");
  return (
    <div className="h-[600px]">
      <SidebarNav
        items={sidebarItems}
        activeHref={active}
        onNavigate={setActive}
        fab={{
          icon: <PlusIcon />,
          label: "Fordern",
          onClick: () => {},
        }}
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
      />
    </div>
  );
}

export const Default = meta.story({
  render: () => <SidebarDemo />,
});

export const WithAdmin = meta.story({
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
});
