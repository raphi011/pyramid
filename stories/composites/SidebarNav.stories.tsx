"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { SidebarNav } from "@/components/sidebar-nav";

const meta = preview.meta({
  title: "Composites/SidebarNav",
  component: SidebarNav,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
});

export default meta;

const mockClubs = [
  {
    id: 1,
    name: "TC Musterstadt",
    role: "player",
    seasons: [
      { id: 1, name: "Sommer 2026", status: "active" },
      { id: 2, name: "Winter 2025/26", status: "ended" },
    ],
  },
  {
    id: 2,
    name: "SC Grünwald",
    role: "player",
    seasons: [{ id: 3, name: "Herbst 2026", status: "active" }],
  },
];

function SidebarDemo() {
  const t = useTranslations("nav");
  const [active, setActive] = useState("/rankings");
  const [expanded, setExpanded] = useState(new Set([1, 2]));
  return (
    <div className="h-[600px]">
      <SidebarNav
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
        activeSeasonId={1}
        unreadCount={3}
        onNavigate={setActive}
        fab={{
          icon: <PlusIcon />,
          label: t("challenge"),
          onClick: () => {},
        }}
      />
    </div>
  );
}

export const Default = meta.story({
  render: () => <SidebarDemo />,
});

function SidebarWithAdmin() {
  const [expanded, setExpanded] = useState(new Set([1, 2]));
  return (
    <div className="h-[600px]">
      <SidebarNav
        clubs={[{ ...mockClubs[0], role: "admin" }, mockClubs[1]]}
        expandedClubIds={expanded}
        onToggleClub={(id) =>
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        activeHref="/admin/club/1"
        activeSeasonId={null}
        unreadCount={0}
      />
    </div>
  );
}

export const WithAdmin = meta.story({
  render: () => <SidebarWithAdmin />,
});
