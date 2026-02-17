"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
};

type BottomNavProps = {
  items: NavItem[];
  activeHref: string;
  onNavigate?: (href: string) => void;
  fab?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "active";
  };
  className?: string;
};

function BottomNav({
  items,
  activeHref,
  onNavigate,
  fab,
  className,
}: BottomNavProps) {
  const midpoint = Math.floor(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "bg-white/95 backdrop-blur-sm",
        "ring-1 ring-slate-200",
        "dark:bg-slate-900/95 dark:ring-slate-800",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div className="flex items-end justify-around px-2 pt-1">
        {leftItems.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            active={activeHref === item.href}
            onNavigate={onNavigate}
          />
        ))}

        {fab && (
          <div className="flex flex-col items-center -mt-3 pb-2">
            <button
              onClick={fab.onClick}
              disabled={fab.disabled}
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                "shadow-lg",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:shadow-sm",
                "[&_svg]:size-6",
                fab.variant === "active"
                  ? "bg-trophy-400 text-white active:bg-trophy-500"
                  : "bg-court-500 text-white active:bg-court-700 active:shadow-md",
              )}
              aria-label={fab.label}
            >
              {fab.icon}
            </button>
            <span
              className={cn(
                "mt-0.5 text-[10px] font-medium",
                fab.variant === "active"
                  ? "text-trophy-500 dark:text-trophy-400"
                  : "text-court-600 dark:text-court-400",
              )}
            >
              {fab.label}
            </span>
          </div>
        )}

        {rightItems.map((item) => (
          <NavButton
            key={item.href}
            item={item}
            active={activeHref === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        "relative flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-2",
        "text-slate-500 transition-colors duration-150",
        active && "text-court-600 dark:text-court-400",
        "[&_svg]:size-6",
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <motion.div
          layoutId="bottom-nav-indicator"
          className="absolute -top-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-court-500"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span className="relative">
        {item.icon}
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  );
}

export { BottomNav };
export type { BottomNavProps, NavItem };
