"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
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

const mockClubs: [
  {
    id: number;
    slug: string;
    name: string;
    role: string;
    seasons: { id: number; slug: string; name: string; status: string }[];
  },
  ...{
    id: number;
    slug: string;
    name: string;
    role: string;
    seasons: { id: number; slug: string; name: string; status: string }[];
  }[],
] = [
  {
    id: 1,
    slug: "tc-musterstadt",
    name: "TC Musterstadt",
    role: "player",
    seasons: [
      { id: 1, slug: "sommer-2026", name: "Sommer 2026", status: "active" },
      {
        id: 2,
        slug: "winter-2025-26",
        name: "Winter 2025/26",
        status: "ended",
      },
    ],
  },
  {
    id: 2,
    slug: "sc-gruenwald",
    name: "SC Grünwald",
    role: "player",
    seasons: [
      { id: 3, slug: "herbst-2026", name: "Herbst 2026", status: "active" },
    ],
  },
];

const adminClubs: typeof mockClubs = [
  { ...mockClubs[0], role: "admin" },
  mockClubs[1],
];

function AppShellDemo() {
  const t = useTranslations("ranking");
  const tChallenge = useTranslations("challenge");
  const tNav = useTranslations("nav");
  const [active, setActive] = useState(
    "/club/tc-musterstadt/season/sommer-2026/rankings",
  );
  return (
    <AppShell
      clubs={mockClubs}
      activeHref={active}
      onNavigate={setActive}
      unreadCount={3}
      fab={{
        icon: <PlusIcon />,
        label: tNav("challenge"),
        onClick: () => {},
      }}
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
  const t = useTranslations("ranking");
  const tNav = useTranslations("nav");
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
      clubs={mockClubs}
      activeHref="/club/tc-musterstadt/season/sommer-2026/rankings"
      unreadCount={3}
      messages={messages}
      onDismissMessage={(id) =>
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }
      fab={{
        icon: <PlusIcon />,
        label: tNav("challenge"),
        onClick: () => {},
      }}
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
  const tNav = useTranslations("nav");
  return (
    <AppShell
      clubs={adminClubs}
      activeHref="/admin/club/1"
      unreadCount={0}
      fab={{
        icon: <PlusIcon />,
        label: tNav("challenge"),
        onClick: () => {},
      }}
    >
      <PageLayout title={tNav("manageClub")} subtitle="TC Musterstadt">
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
