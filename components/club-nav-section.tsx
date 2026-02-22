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
import { routes } from "@/app/lib/routes";

type ClubNavSectionProps = {
  club: {
    id: number;
    name: string;
    slug: string;
    role: string;
    seasons: NavSeason[];
  };
  expanded: boolean;
  onToggle: () => void;
  collapsible?: boolean;
  activeHref: string;
  onNavigate?: (href: string) => void;
};

function ClubNavSection({
  club,
  expanded,
  onToggle,
  collapsible = true,
  activeHref,
  onNavigate,
}: ClubNavSectionProps) {
  const t = useTranslations("nav");

  const clubOverviewHref = routes.club(club.slug);
  const adminHref = routes.admin.club(club.slug);

  const showContent = !collapsible || expanded;

  return (
    <div>
      {/* Club header — collapsible toggle or static label */}
      {collapsible ? (
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
      ) : (
        <div
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
            "text-slate-700",
            "dark:text-slate-300",
          )}
        >
          <Avatar name={club.name} size="sm" />
          <span className="flex-1 text-left truncate">{club.name}</span>
        </div>
      )}

      {/* Content panel */}
      {showContent && (
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
                href: routes.rankings(club.slug, season.slug),
              }}
              active={activeHref === routes.rankings(club.slug, season.slug)}
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
