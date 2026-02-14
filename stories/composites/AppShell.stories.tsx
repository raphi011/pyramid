"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import type { AdminMessage } from "@/components/admin-banner";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";

const meta = preview.meta({
  title: "Composites/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

function useNavItems() {
  const t = useTranslations("nav");
  return {
    navItems: [
      { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
      { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
    ],
    sidebarItems: [
      { icon: <BellIcon />, label: t("news"), href: "/feed", badge: 3 },
      { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
      { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
    ],
    adminItems: [
      {
        icon: <ShieldCheckIcon />,
        label: t("manageClub"),
        href: "/admin/club/1",
      },
    ],
    fabLabel: t("challenge"),
  };
}

function AppShellDemo() {
  const { navItems, sidebarItems, fabLabel } = useNavItems();
  const t = useTranslations("ranking");
  const tChallenge = useTranslations("challenge");
  const [active, setActive] = useState("/rankings");
  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      activeHref={active}
      onNavigate={setActive}
      fab={{
        icon: <PlusIcon />,
        label: fabLabel,
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout
        title={t("title")}
        subtitle={t("seasonSubtitle", { year: "2026", club: "TC Musterstadt" })}
        action={<Button size="sm">{tChallenge("title")}</Button>}
      >
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pyramide wird hier angezeigt. Versuche die Viewport-Größe zu
              ändern, um zwischen Mobile und Desktop zu wechseln.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Zweite Karte als Platzhalter.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    </AppShell>
  );
}

export const Default = meta.story({
  render: () => <AppShellDemo />,
});

function AppShellWithMessages() {
  const { navItems, sidebarItems, fabLabel } = useNavItems();
  const t = useTranslations("ranking");
  const [messages, setMessages] = useState<AdminMessage[]>([
    {
      id: "1",
      variant: "info",
      title: "Platz 3 ist diese Woche gesperrt",
      description:
        "Aufgrund von Wartungsarbeiten steht Platz 3 bis Freitag nicht zur Verfügung.",
    },
    {
      id: "2",
      variant: "warning",
      title: "Saisonende am 30. Juni",
      description:
        "Bitte alle offenen Herausforderungen bis dahin abschließen.",
    },
  ]);

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      activeHref="/rankings"
      messages={messages}
      onDismissMessage={(id) =>
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }
      fab={{
        icon: <PlusIcon />,
        label: fabLabel,
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout
        title={t("title")}
        subtitle={t("seasonSubtitle", { year: "2026", club: "TC Musterstadt" })}
      >
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admin-Nachrichten werden oberhalb des Seiteninhalts angezeigt.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    </AppShell>
  );
}

export const WithMessages = meta.story({
  render: () => <AppShellWithMessages />,
});

function AppShellWithAdmin() {
  const { navItems, sidebarItems, adminItems, fabLabel } = useNavItems();
  const t = useTranslations("nav");
  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      adminItems={adminItems}
      activeHref="/admin/club/1"
      fab={{
        icon: <PlusIcon />,
        label: fabLabel,
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout title={t("manageClub")} subtitle="TC Musterstadt">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admin-Dashboard-Inhalt.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    </AppShell>
  );
}

export const WithAdmin = meta.story({
  render: () => <AppShellWithAdmin />,
});
