"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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

const meta: Meta<typeof AppShell> = {
  title: "Composites/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const navItems = [
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
];

const sidebarItems = [
  { icon: <BellIcon />, label: "Neuigkeiten", href: "/neuigkeiten", badge: 3 },
  { icon: <TrophyIcon />, label: "Rangliste", href: "/rangliste" },
  { icon: <Cog6ToothIcon />, label: "Einstellungen", href: "/settings" },
];

const adminItems = [
  { icon: <ShieldCheckIcon />, label: "Club verwalten", href: "/admin/club/1" },
];

function AppShellDemo() {
  const [active, setActive] = useState("/rangliste");
  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      activeHref={active}
      onNavigate={setActive}
      fab={{
        icon: <PlusIcon />,
        label: "Fordern",
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout
        title="Rangliste"
        subtitle="Saison 2026 — TC Musterstadt"
        action={<Button size="sm">Herausfordern</Button>}
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

export const Default: Story = {
  render: () => <AppShellDemo />,
};

function AppShellWithMessages() {
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
      description: "Bitte alle offenen Herausforderungen bis dahin abschließen.",
    },
  ]);

  return (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      activeHref="/rangliste"
      messages={messages}
      onDismissMessage={(id) =>
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }
      fab={{
        icon: <PlusIcon />,
        label: "Fordern",
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout title="Rangliste" subtitle="Saison 2026 — TC Musterstadt">
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

export const WithMessages: Story = {
  render: () => <AppShellWithMessages />,
};

export const WithAdmin: Story = {
  render: () => (
    <AppShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      adminItems={adminItems}
      activeHref="/admin/club/1"
      fab={{
        icon: <PlusIcon />,
        label: "Fordern",
        onClick: () => {},
      }}
      clubSwitcher={
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TC Musterstadt
        </div>
      }
    >
      <PageLayout title="Club verwalten" subtitle="TC Musterstadt">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admin-Dashboard-Inhalt.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    </AppShell>
  ),
};
