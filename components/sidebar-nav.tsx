"use client";

import Link from "next/link";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PyramidLogo } from "@/components/pyramid-logo";
import { ClubNavSection } from "@/components/club-nav-section";
import { cn } from "@/lib/utils";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
};

type ProfileInfo = {
  name: string;
  avatarSrc?: string | null;
  href: string;
};

type FabAction = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "active";
};

type NavSeason = { id: number; name: string; slug: string; status: string };
type NavClub = {
  id: number;
  name: string;
  slug: string;
  role: string;
  seasons: NavSeason[];
};

type SidebarNavProps = {
  clubs: NavClub[];
  expandedClubIds: Set<number>;
  onToggleClub: (clubId: number) => void;
  profile?: ProfileInfo;
  activeHref: string;
  unreadCount: number;
  onNavigate?: (href: string) => void;
  fab?: FabAction;
  className?: string;
};

function SidebarNav({
  clubs,
  expandedClubIds,
  onToggleClub,
  profile,
  activeHref,
  unreadCount,
  onNavigate,
  fab,
  className,
}: SidebarNavProps) {
  const t = useTranslations("nav");

  return (
    <nav
      className={cn(
        "flex h-full w-60 flex-col",
        "bg-white ring-1 ring-slate-200",
        "dark:bg-slate-900 dark:ring-slate-800",
        className,
      )}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-4 px-6 pt-4 pb-4 transition-opacity hover:opacity-80"
      >
        <div className="flex size-5 items-center justify-center">
          <PyramidLogo size="sm" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          Pyramid
        </span>
      </Link>

      {/* News link */}
      <div className="px-3">
        <NavButton
          item={{
            icon: <BellIcon />,
            label: t("news"),
            href: "/feed",
            badge: unreadCount,
          }}
          active={activeHref === "/feed"}
          onNavigate={onNavigate}
        />
      </div>

      <Separator className="mx-3 my-2" />

      {/* Club sections */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3">
        {clubs.map((club) => (
          <ClubNavSection
            key={club.id}
            club={club}
            expanded={expandedClubIds.has(club.id)}
            onToggle={() => onToggleClub(club.id)}
            collapsible={clubs.length > 1}
            activeHref={activeHref}
            onNavigate={onNavigate}
          />
        ))}

        {/* FAB */}
        {fab && (
          <div className="pt-2">
            <button
              onClick={fab.onClick}
              disabled={fab.disabled}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5",
                "text-sm font-semibold",
                "transition-colors",
                "disabled:opacity-50",
                "[&_svg]:size-5 [&_svg]:shrink-0",
                fab.variant === "active"
                  ? "bg-trophy-400 text-white hover:bg-trophy-500"
                  : "bg-court-500 text-white hover:bg-court-600",
              )}
            >
              {fab.icon}
              <span>{fab.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom: Settings + Profile */}
      <div className="px-3">
        <Separator />

        <div className="py-2">
          <NavButton
            item={{
              icon: <Cog6ToothIcon />,
              label: t("settings"),
              href: "/settings",
            }}
            active={activeHref === "/settings"}
            onNavigate={onNavigate}
          />
        </div>

        {profile && (
          <div className="pb-3">
            <ProfileButton
              profile={profile}
              active={activeHref === profile.href}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>
    </nav>
  );
}

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: SidebarItem;
  active: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-150",
        active
          ? "bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-400"
          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
        "[&_svg]:size-5 [&_svg]:shrink-0",
      )}
      aria-current={active ? "page" : undefined}
    >
      {item.icon}
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </button>
  );
}

function ProfileButton({
  profile,
  active,
  onNavigate,
}: {
  profile: ProfileInfo;
  active: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate?.(profile.href)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-150",
        active
          ? "bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-400"
          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Avatar name={profile.name} src={profile.avatarSrc} size="sm" />
      <span>{profile.name}</span>
    </button>
  );
}

export { SidebarNav, NavButton, ProfileButton };
export type { SidebarNavProps, SidebarItem, ProfileInfo, NavSeason, NavClub };
