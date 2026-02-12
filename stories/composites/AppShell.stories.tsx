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
