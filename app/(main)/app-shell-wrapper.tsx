"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BoltIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";

type Club = { id: number; name: string };

type AppShellWrapperProps = {
  player: { id: number; name: string };
  clubs: [Club, ...Club[]];
  activeMatchId: number | null;
  unreadCount: number;
  children: React.ReactNode;
};

export function AppShellWrapper({
  player,
  clubs,
  activeMatchId,
  unreadCount,
  children,
}: AppShellWrapperProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [activeClubId, setActiveClubId] = useState<number>(clubs[0].id);

  const navItems = [
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: unreadCount },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
  ];

  const sidebarItems = [
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: unreadCount },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
  ];

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      profile={{ name: player.name, href: "/profile" }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      fab={
        activeMatchId != null
          ? {
              icon: <BoltIcon />,
              label: t("activeChallenge"),
              onClick: () => router.push(`/matches/${activeMatchId}`),
              variant: "active" as const,
            }
          : {
              icon: <PlusIcon />,
              label: t("challenge"),
              onClick: () => router.push("/rankings?challenge=true"),
            }
      }
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
