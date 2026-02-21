"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { fullName } from "@/lib/utils";
import { currentPlayer } from "./_mock-data";

type PageWrapperProps = {
  activeHref: string;
  isAdmin?: boolean;
  singleClub?: boolean;
  children: React.ReactNode;
};

type Club = {
  id: number;
  name: string;
  role: string;
  seasons: { id: number; name: string; status: string }[];
};

const mockSearchParams =
  new URLSearchParams() as unknown as import("next/navigation").ReadonlyURLSearchParams;

export function PageWrapper({
  activeHref,
  isAdmin,
  singleClub,
  children,
}: PageWrapperProps) {
  const t = useTranslations("nav");
  const [active, setActive] = useState(activeHref);

  const clubs = useMemo((): [Club, ...Club[]] => {
    const club1: Club = {
      id: 1,
      name: "TC Musterstadt",
      role: isAdmin ? "admin" : "player",
      seasons: [
        { id: 1, name: "Sommer 2026", status: "active" },
        { id: 2, name: "Winter 2025/26", status: "ended" },
      ],
    };

    if (singleClub) return [club1];

    const club2: Club = {
      id: 2,
      name: "SC Grünwald",
      role: "player",
      seasons: [{ id: 3, name: "Herbst 2026", status: "active" }],
    };

    return [club1, club2];
  }, [isAdmin, singleClub]);

  return (
    <AppShell
      clubs={clubs}
      profile={{
        name: fullName(currentPlayer.firstName, currentPlayer.lastName),
        href: "/profile",
      }}
      activeHref={active}
      activeSearchParams={mockSearchParams}
      onNavigate={setActive}
      unreadCount={3}
      fab={{
        icon: <PlusIcon />,
        label: t("challenge"),
        onClick: () => {},
      }}
    >
      {children}
    </AppShell>
  );
}
