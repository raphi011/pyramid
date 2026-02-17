"use client";

import { Fragment } from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  NavButton,
  type SidebarItem,
  type ProfileInfo,
} from "@/components/sidebar-nav";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  items: SidebarItem[];
  adminItems?: SidebarItem[];
  profile?: ProfileInfo;
  activeHref: string;
  onNavigate?: (href: string) => void;
  clubSwitcher?: React.ReactNode;
};

function MobileNav({
  open,
  onClose,
  items,
  adminItems,
  profile,
  activeHref,
  onNavigate,
  clubSwitcher,
}: MobileNavProps) {
  const tCommon = useTranslations("common");
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
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-250"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        {/* Slide-from-left panel */}
        <div className="fixed inset-y-0 left-0 z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-250"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-slate-900">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">{clubSwitcher}</div>
                <button
                  onClick={onClose}
                  className="ml-3 flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={tNav("closeMenu")}
                >
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              {/* Separator */}
              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              {/* Nav items */}
              <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                {items.map((item) => (
                  <NavButton
                    key={item.href}
                    item={item}
                    active={activeHref === item.href}
                    onNavigate={handleNavigate}
                  />
                ))}

                {adminItems && adminItems.length > 0 && (
                  <>
                    <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />
                    <p className="px-3 pb-1 pt-2 text-xs font-medium tracking-wide text-slate-500">
                      {tCommon("admin")}
                    </p>
                    {adminItems.map((item) => (
                      <NavButton
                        key={item.href}
                        item={item}
                        active={activeHref === item.href}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Profile at bottom */}
              {profile && (
                <div className="px-3 py-3">
                  <div className="mb-3 h-px bg-slate-200 dark:bg-slate-800" />
                  <button
                    onClick={() => handleNavigate(profile.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      "transition-colors duration-150",
                      activeHref === profile.href
                        ? "bg-court-50 text-court-700 dark:bg-court-950 dark:text-court-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
                    )}
                    aria-current={
                      activeHref === profile.href ? "page" : undefined
                    }
                  >
                    <Avatar
                      name={profile.name}
                      src={profile.avatarSrc}
                      size="sm"
                    />
                    <span>{profile.name}</span>
                  </button>
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

export { MobileNav };
export type { MobileNavProps };
