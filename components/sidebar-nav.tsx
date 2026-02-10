"use client";

import { cn } from "@/lib/utils";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
};

type SidebarNavProps = {
  items: SidebarItem[];
  adminItems?: SidebarItem[];
  activeHref: string;
  onNavigate?: (href: string) => void;
  clubSwitcher?: React.ReactNode;
  className?: string;
};

function SidebarNav({
  items,
  adminItems,
  activeHref,
  onNavigate,
  clubSwitcher,
  className,
}: SidebarNavProps) {
  return (
    <nav
      className={cn(
        "flex h-full w-60 flex-col",
        "bg-white ring-1 ring-slate-200",
        "dark:bg-slate-900 dark:ring-slate-800",
        className,
      )}
    >
      {clubSwitcher && (
        <div className="p-4 pb-2">{clubSwitcher}</div>
      )}

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
            <p className="px-3 pb-1 pt-2 text-xs font-medium tracking-wide text-slate-400">
              Admin
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
        <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </button>
  );
}

export { SidebarNav };
export type { SidebarNavProps, SidebarItem };
