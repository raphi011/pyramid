"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/mobile-nav";
import { FloatingFab } from "@/components/floating-fab";
import {
  SidebarNav,
  type ProfileInfo,
  type NavClub,
} from "@/components/sidebar-nav";
import { AdminBanner, type AdminMessage } from "@/components/admin-banner";

type AppShellProps = {
  children: React.ReactNode;
  clubs: [NavClub, ...NavClub[]];
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
  unreadCount: number;
  className?: string;
};

const STORAGE_KEY = "pyramid:nav:clubs";

function AppShell({
  children,
  clubs,
  profile,
  activeHref,
  onNavigate,
  fab,
  messages,
  onDismissMessage,
  unreadCount,
  className,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const tNav = useTranslations("nav");

  // Expanded club IDs — persisted to localStorage.
  // Initialize with all clubs expanded (matches SSR), then restore from
  // localStorage after hydration to avoid a hydration mismatch.
  const [expandedClubIds, setExpandedClubIds] = useState<Set<number>>(
    () => new Set(clubs.map((c) => c.id)),
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time hydration from localStorage
          setExpandedClubIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleToggleClub = useCallback((clubId: number) => {
    setExpandedClubIds((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) {
        next.delete(clubId);
      } else {
        next.add(clubId);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <div
      className={cn("min-h-screen bg-slate-50 dark:bg-slate-950", className)}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60">
        <SidebarNav
          clubs={clubs}
          expandedClubIds={expandedClubIds}
          onToggleClub={handleToggleClub}
          profile={profile}
          activeHref={activeHref}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
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

        {/* App title */}
        <span className="text-base font-bold text-slate-900 dark:text-white">
          Pyramid
        </span>

        {/* Notification bell */}
        <button
          onClick={() => onNavigate?.("/feed")}
          className="relative flex size-11 items-center justify-center rounded-xl text-slate-700 dark:text-slate-300"
          aria-label={
            unreadCount > 0 ? tNav("news") + ` (${unreadCount})` : tNav("news")
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
        clubs={clubs}
        expandedClubIds={expandedClubIds}
        onToggleClub={handleToggleClub}
        profile={profile}
        activeHref={activeHref}
        unreadCount={unreadCount}
        onNavigate={onNavigate}
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
