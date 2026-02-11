"use client";

import { useState } from "react";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";
import { clubs, currentPlayer } from "./_mock-data";

const navItems = [
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
];

const sidebarItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <Cog6ToothIcon />, label: "Einstellungen", href: "/settings" },
];

const adminItems = [
  { icon: <ShieldCheckIcon />, label: "Club verwalten", href: "/admin/club/1" },
];

type PageWrapperProps = {
  activeHref: string;
  isAdmin?: boolean;
  singleClub?: boolean;
  children: React.ReactNode;
};

export function PageWrapper({ activeHref, isAdmin, singleClub, children }: PageWrapperProps) {
  const [active, setActive] = useState(activeHref);
  const [activeClub, setActiveClub] = useState<string | number>("c1");

  const displayClubs = singleClub ? [clubs[0]] : clubs;

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      adminItems={isAdmin ? adminItems : undefined}
      profile={{ name: currentPlayer.name, href: "/profile" }}
      activeHref={active}
      onNavigate={setActive}
      fab={{
        icon: <PlusIcon />,
        label: "Fordern",
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
