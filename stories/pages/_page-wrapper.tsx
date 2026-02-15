"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";
import { fullName } from "@/lib/utils";
import { clubs, currentPlayer } from "./_mock-data";

type PageWrapperProps = {
  activeHref: string;
  isAdmin?: boolean;
  singleClub?: boolean;
  children: React.ReactNode;
};

export function PageWrapper({
  activeHref,
  isAdmin,
  singleClub,
  children,
}: PageWrapperProps) {
  const t = useTranslations("nav");
  const [active, setActive] = useState(activeHref);
  const [activeClub, setActiveClub] = useState<string | number>("c1");

  const displayClubs = singleClub ? [clubs[0]] : clubs;

  const navItems = [
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
  ];

  const sidebarItems = [
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
  ];

  const adminItems = [
    {
      icon: <ShieldCheckIcon />,
      label: t("manageClub"),
      href: "/admin/club/1",
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      adminItems={isAdmin ? adminItems : undefined}
      profile={{
        name: fullName(currentPlayer.firstName, currentPlayer.lastName),
        href: "/profile",
      }}
      activeHref={active}
      onNavigate={setActive}
      fab={{
        icon: <PlusIcon />,
        label: t("challenge"),
        onClick: () => {},
      }}
      clubSwitcher={
        <ClubSwitcher
          clubs={displayClubs}
          activeClubId={activeClub}
          onSwitch={setActiveClub}
        />
      }
    >
      {children}
    </AppShell>
  );
}
