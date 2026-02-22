"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
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

const mockClubs = [
  {
    id: 1,
    slug: "tc-musterstadt",
    name: "TC Musterstadt",
    role: "player" as const,
    imageSrc: null,
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
    role: "player" as const,
    imageSrc: null,
    seasons: [
      { id: 3, slug: "herbst-2026", name: "Herbst 2026", status: "active" },
    ],
  },
];

function MobileNavDefault() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("/tc-musterstadt/sommer-2026");
  const [expanded, setExpanded] = useState(new Set([1, 2]));

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
        clubs={mockClubs}
        expandedClubIds={expanded}
        onToggleClub={(id) =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        activeHref={active}
        unreadCount={3}
        onNavigate={(href) => setActive(href)}
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

    // Dialog starts open — verify club section visible (Avatar sr-only span also renders the name)
    const clubNames = await body.findAllByText("TC Musterstadt");
    await expect(clubNames.length).toBeGreaterThanOrEqual(1);
    await expect(
      body.getAllByText("Sommer 2026").length,
    ).toBeGreaterThanOrEqual(1);

    // Click close button
    await userEvent.click(body.getByRole("button", { name: "Menü schließen" }));

    // Re-open
    await userEvent.click(canvas.getByText("Open Menu"));

    // Navigate to feed via News link
    await userEvent.click(await body.findByText("Neuigkeiten"));

    // Active route should update
    await expect(canvas.getByText("Active: /feed")).toBeInTheDocument();
  },
});

function MobileNavWithAdmin() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(new Set([1, 2]));

  const adminClubs = [
    { ...mockClubs[0], role: "admin" as const },
    mockClubs[1],
  ];

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
        clubs={adminClubs}
        expandedClubIds={expanded}
        onToggleClub={(id) =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        activeHref="/feed"
        unreadCount={3}
        onNavigate={() => {}}
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

function MobileNavSingleClub() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(new Set([1]));

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
        clubs={[mockClubs[0]]}
        expandedClubIds={expanded}
        onToggleClub={(id) =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        activeHref="/tc-musterstadt/sommer-2026"
        unreadCount={0}
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
