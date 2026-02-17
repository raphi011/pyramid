"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { FloatingFab } from "@/components/floating-fab";
import {
  SidebarNav,
  type SidebarItem,
  type ProfileInfo,
} from "@/components/sidebar-nav";
import { AdminBanner, type AdminMessage } from "@/components/admin-banner";

type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  mobileNavItems: SidebarItem[];
  adminItems?: SidebarItem[];
  profile?: ProfileInfo;
  activeHref: string;
  onNavigate?: (href: string) => void;
  fab?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "active";
  };
  messages?: AdminMessage[];
  onDismissMessage?: (id: string) => void;
  clubSwitcher?: React.ReactNode;
  activeClubName: string;
  activeClubId: number;
  unreadCount: number;
  className?: string;
};

function AppShell({
  children,
  sidebarItems,
  mobileNavItems,
  adminItems,
  profile,
  activeHref,
  onNavigate,
  fab,
  messages,
  onDismissMessage,
  clubSwitcher,
  activeClubName,
  activeClubId,
  unreadCount,
  className,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const tNav = useTranslations("nav");

  return (
    <div
      className={cn("min-h-screen bg-slate-50 dark:bg-slate-950", className)}
    >
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
        {/* Hamburger */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex size-11 items-center justify-center rounded-xl text-slate-700 dark:text-slate-300"
          aria-label={tNav("openMenu")}
        >
          <Bars3Icon className="size-6" />
        </button>

        {/* Club name */}
        <button
          onClick={() => onNavigate?.(`/club/${activeClubId}`)}
          className="min-w-0 flex-1 px-2"
        >
          <span className="block truncate text-center text-base font-bold text-slate-900 dark:text-white">
            {activeClubName}
          </span>
        </button>

        {/* Notification bell */}
        <button
          onClick={() => onNavigate?.("/notifications")}
          className="relative flex size-11 items-center justify-center rounded-xl text-slate-700 dark:text-slate-300"
          aria-label={
            unreadCount > 0
              ? tNav("notifications") + ` (${unreadCount})`
              : tNav("notifications")
          }
        >
          <BellIcon className="size-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-court-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Main content */}
      <main
        className={cn(
          "@container px-4 pb-24 pt-2",
          "lg:ml-60 lg:px-6 lg:pb-6 lg:pt-6",
        )}
      >
        <div className="mx-auto max-w-2xl">
          {messages && messages.length > 0 && (
            <div className="mb-4 space-y-2">
              {messages.map((msg) => (
                <AdminBanner key={msg.id} {...msg} onClose={onDismissMessage} />
              ))}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile nav overlay */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        items={mobileNavItems}
        adminItems={adminItems}
        profile={profile}
        activeHref={activeHref}
        onNavigate={onNavigate}
        clubSwitcher={clubSwitcher}
      />

      {/* Floating FAB (mobile only) */}
      {fab && (
        <div className="lg:hidden">
          <FloatingFab {...fab} />
        </div>
      )}
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
