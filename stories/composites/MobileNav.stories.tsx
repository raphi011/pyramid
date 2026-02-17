"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  BellIcon,
  BellAlertIcon,
  BoltIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { MobileNav } from "@/components/mobile-nav";
import { mobileViewport } from "../viewports";

const meta = preview.meta({
  title: "Composites/MobileNav",
  component: MobileNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ...mobileViewport,
  },
});

export default meta;

function useMobileNavItems(unreadCount = 0) {
  const t = useTranslations("nav");
  return {
    items: [
      {
        icon: <BellIcon />,
        label: t("news"),
        href: "/feed",
        badge: unreadCount,
      },
      { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
      { icon: <BoltIcon />, label: t("matches"), href: "/matches" },
      {
        icon: <BellAlertIcon />,
        label: t("notifications"),
        href: "/notifications",
        badge: unreadCount,
      },
      { icon: <Cog6ToothIcon />, label: t("settings"), href: "/settings" },
    ],
    adminItems: [
      {
        icon: <ShieldCheckIcon />,
        label: t("manageClub"),
        href: "/admin/club/1",
      },
    ],
  };
}

function MobileNavDefault() {
  const { items } = useMobileNavItems();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("/rankings");

  return (
    <div className="relative h-[667px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-court-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open Menu
        </button>
        <p className="mt-2 text-sm text-slate-500">Active: {active}</p>
      </div>
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        activeHref={active}
        onNavigate={(href) => setActive(href)}
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
        profile={{
          name: "Max Mustermann",
          href: "/profile",
        }}
      />
    </div>
  );
}

export const Default = meta.story({
  render: () => <MobileNavDefault />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Dialog starts open — verify nav items visible
    await expect(await body.findByText("Rangliste")).toBeInTheDocument();
    await expect(body.getByText("Neuigkeiten")).toBeInTheDocument();

    // Click close button
    await userEvent.click(body.getByRole("button", { name: "Menü schließen" }));

    // Re-open
    await userEvent.click(canvas.getByText("Open Menu"));

    // Navigate to feed
    await userEvent.click(await body.findByText("Neuigkeiten"));

    // Active route should update
    await expect(canvas.getByText("Active: /feed")).toBeInTheDocument();
  },
});

function MobileNavWithAdmin() {
  const { items, adminItems } = useMobileNavItems(3);
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-[667px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-court-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open Menu
        </button>
      </div>
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        adminItems={adminItems}
        activeHref="/feed"
        onNavigate={() => {}}
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
        profile={{
          name: "Anna Admin",
          href: "/profile",
        }}
      />
    </div>
  );
}

export const WithAdminItems = meta.story({
  render: () => <MobileNavWithAdmin />,
});

function MobileNavWithBadge() {
  const { items } = useMobileNavItems(5);
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-[667px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-court-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open Menu
        </button>
      </div>
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        activeHref="/rankings"
        onNavigate={() => {}}
        clubSwitcher={
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TC Musterstadt
          </div>
        }
        profile={{
          name: "Max Mustermann",
          href: "/profile",
        }}
      />
    </div>
  );
}

export const WithUnreadBadge = meta.story({
  render: () => <MobileNavWithBadge />,
});

function MobileNavSingleClub() {
  const { items } = useMobileNavItems();
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-[667px] bg-slate-50 dark:bg-slate-950">
      <div className="p-4">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-court-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open Menu
        </button>
      </div>
      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        activeHref="/rankings"
        onNavigate={() => {}}
        profile={{
          name: "Max Mustermann",
          href: "/profile",
        }}
      />
    </div>
  );
}

export const SingleClub = meta.story({
  render: () => <MobileNavSingleClub />,
});
