"use client";

import {
  ChevronDownIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { NavButton, type NavSeason } from "@/components/sidebar-nav";
import { cn } from "@/lib/utils";

type ClubNavSectionProps = {
  club: { id: number; name: string; role: string; seasons: NavSeason[] };
  expanded: boolean;
  onToggle: () => void;
  activeHref: string;
  activeSeasonId: number | null;
  onNavigate?: (href: string) => void;
};

function ClubNavSection({
  club,
  expanded,
  onToggle,
  activeHref,
  activeSeasonId,
  onNavigate,
}: ClubNavSectionProps) {
  const t = useTranslations("nav");

  const clubOverviewHref = `/club/${club.id}`;
  const adminHref = `/admin/club/${club.id}`;

  return (
    <div>
      {/* Club header toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
          "transition-colors duration-150",
          "text-slate-700 hover:bg-slate-50",
          "dark:text-slate-300 dark:hover:bg-slate-800",
        )}
        aria-expanded={expanded}
      >
        <Avatar name={club.name} size="sm" />
        <span className="flex-1 text-left truncate">{club.name}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-slate-400 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible panel */}
      {expanded && (
        <div className="ml-3 space-y-0.5 pt-0.5">
          <NavButton
            item={{
              icon: <ClipboardDocumentListIcon />,
              label: t("clubOverview"),
              href: clubOverviewHref,
            }}
            active={activeHref === clubOverviewHref}
            onNavigate={onNavigate}
          />

          {club.seasons.map((season) => (
            <NavButton
              key={season.id}
              item={{
                icon: <TrophyIcon />,
                label: season.name,
                href: `/rankings?season=${season.id}`,
              }}
              active={
                activeHref === "/rankings" && activeSeasonId === season.id
              }
              onNavigate={onNavigate}
            />
          ))}

          {club.role === "admin" && (
            <NavButton
              item={{
                icon: <ShieldCheckIcon />,
                label: t("manageClub"),
                href: adminHref,
              }}
              active={activeHref.startsWith(adminHref)}
              onNavigate={onNavigate}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { ClubNavSection };
export type { ClubNavSectionProps };
