"use client";

import { useState } from "react";
import {
  TrophyIcon,
  PlusIcon,
  BoltIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";
import { clubs } from "./_mock-data";

const navItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rankings" },
  { icon: <BoltIcon />, label: "Spiele", href: "/matches" },
  { icon: <UserIcon />, label: "Profil", href: "/profile" },
];

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

type PageWrapperProps = {
  activeHref: string;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function PageWrapper({ activeHref, isAdmin, children }: PageWrapperProps) {
  const [active, setActive] = useState(activeHref);
  const [activeClub, setActiveClub] = useState<string | number>("c1");

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      adminItems={isAdmin ? adminItems : undefined}
      activeHref={active}
      onNavigate={setActive}
      fab={{
        icon: <PlusIcon />,
        label: "Fordern",
        onClick: () => {},
      }}
      clubSwitcher={
        <ClubSwitcher
          clubs={clubs}
          activeClubId={activeClub}
          onSwitch={setActiveClub}
        />
      }
    >
      {children}
    </AppShell>
  );
}
