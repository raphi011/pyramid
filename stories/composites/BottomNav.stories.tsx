"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { BottomNav } from "@/components/bottom-nav";

const meta = preview.meta({
  title: "Composites/BottomNav",
  component: BottomNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "iPhoneSE" },
  },
});

export default meta;

function BottomNavDemo() {
  const t = useTranslations("nav");
  const [active, setActive] = useState("/feed");
  const navItems = [
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
  ];
  return (
    <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <p className="text-sm text-slate-500">Active tab: {active}</p>
      </div>
      <BottomNav
        items={navItems}
        activeHref={active}
        onNavigate={setActive}
        fab={{
          icon: <PlusIcon />,
          label: t("challenge"),
          onClick: () => {},
        }}
      />
    </div>
  );
}

export const Default = meta.story({
  render: () => <BottomNavDemo />,
});

function BottomNavWithBadge() {
  const t = useTranslations("nav");
  const navItems = [
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 5 },
  ];
  return (
    <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
      <BottomNav
        items={navItems}
        activeHref="/rankings"
        fab={{
          icon: <PlusIcon />,
          label: t("challenge"),
          onClick: () => {},
        }}
      />
    </div>
  );
}

export const WithBadge = meta.story({
  render: () => <BottomNavWithBadge />,
});

function BottomNavFABDisabled() {
  const t = useTranslations("nav");
  const navItems = [
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
  ];
  return (
    <div className="relative h-[600px] bg-slate-50 dark:bg-slate-950">
      <BottomNav
        items={navItems}
        activeHref="/feed"
        fab={{
          icon: <PlusIcon />,
          label: t("challenge"),
          onClick: () => {},
          disabled: true,
        }}
      />
    </div>
  );
}

export const FABDisabled = meta.story({
  render: () => <BottomNavFABDisabled />,
});
