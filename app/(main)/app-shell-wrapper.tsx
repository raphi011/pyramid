"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlusIcon, BoltIcon } from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { fullName } from "@/lib/utils";
import type { NavClub } from "@/components/sidebar-nav";

type AppShellWrapperProps = {
  player: { id: number; firstName: string; lastName: string };
  clubs: [NavClub, ...NavClub[]];
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
  const searchParams = useSearchParams();

  return (
    <AppShell
      clubs={clubs}
      activeHref={pathname}
      activeSearchParams={searchParams}
      unreadCount={unreadCount}
      profile={{
        name: fullName(player.firstName, player.lastName),
        href: "/profile",
      }}
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
    >
      {children}
    </AppShell>
  );
}
