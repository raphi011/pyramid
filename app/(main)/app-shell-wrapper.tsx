"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";

type Club = { id: number; name: string };

type AppShellWrapperProps = {
  player: { id: number; name: string };
  clubs: Club[];
  children: React.ReactNode;
};

export function AppShellWrapper({
  player,
  clubs,
  children,
}: AppShellWrapperProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [activeClubId, setActiveClubId] = useState<number>(clubs[0].id);

  const navItems = [
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rangliste" },
    { icon: <BellIcon />, label: t("news"), href: "/neuigkeiten" },
  ];

  const sidebarItems = [
    { icon: <BellIcon />, label: t("news"), href: "/neuigkeiten" },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rangliste" },
    { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
  ];

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      profile={{ name: player.name, href: "/profile" }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      fab={{
        icon: <PlusIcon />,
        label: t("challenge"),
        onClick: () => {},
        disabled: true,
      }}
      clubSwitcher={
        <ClubSwitcher
          clubs={clubs}
          activeClubId={activeClubId}
          onSwitch={(id) => setActiveClubId(id as number)}
        />
      }
    >
      {children}
    </AppShell>
  );
}
