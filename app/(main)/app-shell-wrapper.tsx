"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlusIcon, BoltIcon } from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { fullName } from "@/lib/utils";
import type { NavClub } from "@/components/sidebar-nav";

type AppShellWrapperProps = {
  player: {
    id: number;
    firstName: string;
    lastName: string;
    isAppAdmin: boolean;
  };
  clubs: NavClub[];
  activeMatchUrl: string | null;
  unreadCount: number;
  children: React.ReactNode;
};

/**
 * Check if the current path is a season/rankings page (/{clubSlug}/{seasonSlug}).
 * Matches any path that starts with a known club slug and has exactly one more segment.
 */
function isSeasonPage(pathname: string, clubs: NavClub[]): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return false;
  return clubs.some((c) => c.slug === segments[0]);
}

export function AppShellWrapper({
  player,
  clubs,
  activeMatchUrl,
  unreadCount,
  children,
}: AppShellWrapperProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell
      clubs={clubs}
      isAppAdmin={player.isAppAdmin}
      activeHref={pathname}
      unreadCount={unreadCount}
      profile={{
        name: fullName(player.firstName, player.lastName),
        href: "/profile",
      }}
      onNavigate={(href) => router.push(href)}
      fab={
        activeMatchUrl != null
          ? {
              icon: <BoltIcon />,
              label: t("activeChallenge"),
              onClick: () => router.push(activeMatchUrl),
              variant: "active",
            }
          : isSeasonPage(pathname, clubs)
            ? {
                icon: <PlusIcon />,
                label: t("challenge"),
                onClick: () => router.push(`${pathname}?challenge=true`),
              }
            : undefined
      }
    >
      {children}
    </AppShell>
  );
}
