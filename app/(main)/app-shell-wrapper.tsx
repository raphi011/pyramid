"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BoltIcon,
  BellIcon,
  BellAlertIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { ClubSwitcher } from "@/components/club-switcher";
import { fullName } from "@/lib/utils";

type Club = { id: number; name: string };

type AppShellWrapperProps = {
  player: { id: number; firstName: string; lastName: string };
  clubs: [Club, ...Club[]];
  activeMatchId: number | null;
  unreadCount: number;
  adminClubId: number | null;
  children: React.ReactNode;
};

export function AppShellWrapper({
  player,
  clubs,
  activeMatchId,
  unreadCount,
  adminClubId,
  children,
}: AppShellWrapperProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [activeClubId, setActiveClubId] = useState<number>(clubs[0].id);

  const activeClubName =
    clubs.find((c) => c.id === activeClubId)?.name ?? clubs[0].name;

  const sidebarItems = [
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: unreadCount },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
  ];

  const mobileNavItems = [
    { icon: <BellIcon />, label: t("news"), href: "/feed", badge: unreadCount },
    { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
    { icon: <BoltIcon />, label: t("matches"), href: "/matches" },
    {
      icon: <BellAlertIcon />,
      label: t("notifications"),
      href: "/notifications",
      badge: unreadCount,
    },
    { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
  ];

  const adminItems = adminClubId
    ? [
        {
          icon: <ShieldCheckIcon />,
          label: t("manageClub"),
          href: `/admin/club/${adminClubId}`,
        },
      ]
    : undefined;

  return (
    <AppShell
      sidebarItems={sidebarItems}
      mobileNavItems={mobileNavItems}
      adminItems={adminItems}
      activeClubName={activeClubName}
      activeClubId={activeClubId}
      unreadCount={unreadCount}
      profile={{
        name: fullName(player.firstName, player.lastName),
        href: "/profile",
      }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      fab={
        activeMatchId != null
          ? {
              icon: <BoltIcon />,
              label: t("activeChallenge"),
              onClick: () => router.push(`/matches/${activeMatchId}`),
              variant: "active",
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
