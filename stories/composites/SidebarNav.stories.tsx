"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
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

function useSidebarItems() {
  const t = useTranslations("nav");
  return {
    sidebarItems: [
      { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
      { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
      { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
    ],
    adminItems: [
      {
        icon: <ShieldCheckIcon />,
        label: t("manageClub"),
        href: "/admin/club/1",
      },
    ],
    fabLabel: t("challenge"),
  };
}

function SidebarDemo() {
  const { sidebarItems, fabLabel } = useSidebarItems();
  const [active, setActive] = useState("/rankings");
  return (
    <div className="h-[600px]">
      <SidebarNav
        items={sidebarItems}
        activeHref={active}
        onNavigate={setActive}
        fab={{
          icon: <PlusIcon />,
          label: fabLabel,
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

function SidebarWithAdmin() {
  const { sidebarItems, adminItems } = useSidebarItems();
  return (
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
  );
}

export const WithAdmin = meta.story({
  render: () => <SidebarWithAdmin />,
});
