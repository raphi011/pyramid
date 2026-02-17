"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { PyramidLogo } from "@/components/pyramid-logo";
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

type SidebarNavProps = {
  items: SidebarItem[];
  adminItems?: SidebarItem[];
  profile?: ProfileInfo;
  activeHref: string;
  onNavigate?: (href: string) => void;
  clubSwitcher?: React.ReactNode;
  fab?: FabAction;
  className?: string;
};

function SidebarNav({
  items,
  adminItems,
  profile,
  activeHref,
  onNavigate,
  clubSwitcher,
  fab,
  className,
}: SidebarNavProps) {
  const tCommon = useTranslations("common");

  return (
    <nav
      className={cn(
        "flex h-full w-60 flex-col",
        "bg-white ring-1 ring-slate-200",
        "dark:bg-slate-900 dark:ring-slate-800",
        className,
      )}
    >
      <div className="flex items-center gap-4 px-6 pt-4 pb-6">
        <div className="flex size-5 items-center justify-center">
          <PyramidLogo size="sm" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          Pyramid
        </span>
      </div>

      <div className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <SidebarButton
            key={item.href}
            item={item}
            active={activeHref === item.href}
            onNavigate={onNavigate}
          />
        ))}

        {adminItems && adminItems.length > 0 && (
          <>
            <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />
            <p className="px-3 pb-1 pt-2 text-xs font-medium tracking-wide text-slate-500">
              {tCommon("admin")}
            </p>
            {adminItems.map((item) => (
              <SidebarButton
                key={item.href}
                item={item}
                active={activeHref === item.href}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}

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

      <div className="border-t border-slate-200 px-3 dark:border-slate-800">
        {clubSwitcher && <div className="pt-3">{clubSwitcher}</div>}
        {profile && (
          <div className="py-3">
            <button
              onClick={() => onNavigate?.(profile.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                activeHref === profile.href
                  ? "bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
              aria-current={activeHref === profile.href ? "page" : undefined}
            >
              <Avatar name={profile.name} src={profile.avatarSrc} size="sm" />
              <span>{profile.name}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function SidebarButton({
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

export { SidebarNav };
export type { SidebarNavProps, SidebarItem, ProfileInfo };
