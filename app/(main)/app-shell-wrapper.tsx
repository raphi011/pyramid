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
  clubs: [Club, ...Club[]];
  hasOpenChallenge: boolean;
  unreadCount: number;
  children: React.ReactNode;
};

export function AppShellWrapper({
  player,
  clubs,
  hasOpenChallenge,
  unreadCount,
  children,
}: AppShellWrapperProps) {
  const t = useTranslations("nav");
  const tChallenge = useTranslations("challenge");
  const pathname = usePathname();
  const router = useRouter();
  const [activeClubId, setActiveClubId] = useState<number>(clubs[0].id);
  const [fabToast, setFabToast] = useState<string | null>(null);

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
    <>
      <AppShell
        navItems={navItems}
        sidebarItems={sidebarItems}
        profile={{ name: player.name, href: "/profile" }}
        activeHref={pathname}
        onNavigate={(href) => router.push(href)}
        fab={{
          icon: <PlusIcon />,
          label: t("challenge"),
          onClick: () => {
            if (hasOpenChallenge) {
              setFabToast(tChallenge("fabDisabledMessage"));
              setTimeout(() => setFabToast(null), 3000);
            } else {
              router.push("/rankings?challenge=true");
            }
          },
          disabled: false,
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
      {fabToast && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {fabToast}
        </div>
      )}
    </>
  );
}
