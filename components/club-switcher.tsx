"use client";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Club = {
  id: string | number;
  name: string;
  avatarSrc?: string | null;
};

type ClubSwitcherProps = {
  clubs: Club[];
  activeClubId: string | number;
  onSwitch: (clubId: string | number) => void;
  className?: string;
};

function ClubSwitcher({
  clubs,
  activeClubId,
  onSwitch,
  className,
}: ClubSwitcherProps) {
  const activeClub = clubs.find((c) => c.id === activeClubId) ?? clubs[0];

  if (clubs.length <= 1) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2",
          "bg-slate-100 dark:bg-slate-800",
          className,
        )}
      >
        <Avatar name={activeClub.name} src={activeClub.avatarSrc} size="sm" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {activeClub.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu
      align="left"
      trigger={
        <button
          aria-label={`${activeClub.name} – Verein wechseln`}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2",
            "bg-slate-100 transition-colors hover:bg-slate-200",
            "dark:bg-slate-800 dark:hover:bg-slate-700",
            className,
          )}
        >
          <Avatar name={activeClub.name} src={activeClub.avatarSrc} size="sm" />
          <span className="flex-1 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
            {activeClub.name}
          </span>
          <ChevronDownIcon className="size-4 text-slate-500" />
        </button>
      }
    >
      {clubs.map((club, idx) => (
        <div key={club.id}>
          {idx > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => onSwitch(club.id)}
            icon={
              <Avatar name={club.name} src={club.avatarSrc} size="sm" />
            }
          >
            <span className="flex items-center gap-2">
              {club.name}
              {club.id === activeClubId && (
                <span className="size-1.5 rounded-full bg-court-500" />
              )}
            </span>
          </DropdownMenuItem>
        </div>
      ))}
    </DropdownMenu>
  );
}

export { ClubSwitcher };
export type { ClubSwitcherProps, Club };
