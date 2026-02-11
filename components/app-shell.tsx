"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import {
  SidebarNav,
  type SidebarItem,
  type ProfileInfo,
} from "@/components/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  sidebarItems: SidebarItem[];
  adminItems?: SidebarItem[];
  profile?: ProfileInfo;
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
  profile,
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
          profile={profile}
          activeHref={activeHref}
          onNavigate={onNavigate}
          clubSwitcher={clubSwitcher}
          fab={fab}
        />
      </div>

      {/* Mobile top bar */}
      <header
        className={cn(
          "sticky top-0 z-40 flex items-center justify-between px-4 py-2",
          "bg-white/95 backdrop-blur-sm",
          "dark:bg-slate-950/95",
          "lg:hidden",
        )}
      >
        <div className="min-w-0 flex-1">{clubSwitcher}</div>
        {profile && (
          <button
            onClick={() => onNavigate?.(profile.href)}
            className="ml-3 shrink-0"
            aria-label="Profil"
          >
            <Avatar name={profile.name} src={profile.avatarSrc} size="sm" />
          </button>
        )}
      </header>

      {/* Main content */}
      <main
        className={cn(
          "@container px-4 pb-24 pt-2",
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
