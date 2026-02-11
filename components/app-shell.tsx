"use client";

import { cn } from "@/lib/utils";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { SidebarNav, type SidebarItem } from "@/components/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  sidebarItems: SidebarItem[];
  adminItems?: SidebarItem[];
  activeHref: string;
  onNavigate?: (href: string) => void;
  fab?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  clubSwitcher?: React.ReactNode;
  className?: string;
};

function AppShell({
  children,
  navItems,
  sidebarItems,
  adminItems,
  activeHref,
  onNavigate,
  fab,
  clubSwitcher,
  className,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-950", className)}>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60">
        <SidebarNav
          items={sidebarItems}
          adminItems={adminItems}
          activeHref={activeHref}
          onNavigate={onNavigate}
          clubSwitcher={clubSwitcher}
        />
      </div>

      {/* Main content */}
      <main
        className={cn(
          "px-4 pb-24 pt-4",
          "lg:pb-6 lg:pl-64 lg:pr-6 lg:pt-6",
        )}
      >
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav
          items={navItems}
          activeHref={activeHref}
          onNavigate={onNavigate}
          fab={fab}
        />
      </div>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
