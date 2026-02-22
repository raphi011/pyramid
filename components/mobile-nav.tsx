"use client";

import { Fragment } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { ClubNavSection } from "@/components/club-nav-section";
import {
  NavButton,
  ProfileButton,
  type ProfileInfo,
  type NavClub,
} from "@/components/sidebar-nav";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  clubs: NavClub[];
  expandedClubIds: Set<number>;
  onToggleClub: (clubId: number) => void;
  profile?: ProfileInfo;
  activeHref: string;
  unreadCount: number;
  onNavigate?: (href: string) => void;
};

function MobileNav({
  open,
  onClose,
  clubs,
  expandedClubIds,
  onToggleClub,
  profile,
  activeHref,
  unreadCount,
  onNavigate,
}: MobileNavProps) {
  const tNav = useTranslations("nav");

  function handleNavigate(href: string) {
    onNavigate?.(href);
    onClose();
  }

  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog
        onClose={onClose}
        className="relative z-50"
        aria-label={tNav("menuLabel")}
      >
        {/* Fullscreen panel */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-250"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogPanel className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <Link
                href="/"
                onClick={onClose}
                className="text-base font-bold text-slate-900 transition-opacity hover:opacity-80 dark:text-white"
              >
                Pyramid
              </Link>
              <button
                onClick={onClose}
                className={cn(
                  "ml-3 flex size-11 shrink-0 items-center justify-center rounded-xl",
                  "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
                aria-label={tNav("closeMenu")}
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <Separator />

            {/* Nav items */}
            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              {/* News link */}
              <NavButton
                item={{
                  icon: <BellIcon />,
                  label: tNav("news"),
                  href: "/feed",
                  badge: unreadCount,
                }}
                active={activeHref === "/feed"}
                onNavigate={handleNavigate}
              />

              <Separator className="my-2" />

              {/* Club sections */}
              {clubs.map((club) => (
                <ClubNavSection
                  key={club.id}
                  club={club}
                  expanded={expandedClubIds.has(club.id)}
                  onToggle={() => onToggleClub(club.id)}
                  collapsible={clubs.length > 1}
                  activeHref={activeHref}
                  onNavigate={handleNavigate}
                />
              ))}

              <Separator className="my-2" />

              <NavButton
                item={{
                  icon: <Cog6ToothIcon />,
                  label: tNav("settings"),
                  href: "/settings",
                }}
                active={activeHref === "/settings"}
                onNavigate={handleNavigate}
              />
            </div>

            {/* Profile at bottom */}
            {profile && (
              <div className="px-3 py-3">
                <Separator className="mb-3" />
                <ProfileButton
                  profile={profile}
                  active={activeHref === profile.href}
                  onNavigate={handleNavigate}
                />
              </div>
            )}
          </DialogPanel>
        </TransitionChild>
      </HeadlessDialog>
    </Transition>
  );
}

export { MobileNav };
export type { MobileNavProps };
