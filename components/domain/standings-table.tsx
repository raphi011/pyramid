"use client";

import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  TrophyIcon,
} from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn, fullName } from "@/lib/utils";

type StandingsPlayer = {
  id: string | number;
  playerId?: number;
  firstName: string;
  lastName: string;
  rank: number;
  avatarSrc?: string | null;
  wins: number;
  losses: number;
  movement?: "up" | "down" | "none";
  challengeable?: boolean;
  unavailable?: boolean;
};

type StandingsTableProps = {
  players: StandingsPlayer[];
  onPlayerClick?: (player: StandingsPlayer) => void;
  className?: string;
};

function StandingsTable({
  players,
  onPlayerClick,
  className,
}: StandingsTableProps) {
  const sorted = [...players].sort((a, b) => a.rank - b.rank);

  return (
    <div className={className}>
      {sorted.map((player, idx) => (
        <div key={player.id}>
          {idx > 0 && <Separator />}
          <button
            onClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
            disabled={!onPlayerClick}
            className={cn(
              "flex w-full items-center gap-3 px-1 py-3 text-left",
              "transition-colors duration-150",
              onPlayerClick && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              player.challengeable && "bg-court-50/50 dark:bg-court-950/30",
            )}
          >
            {/* Rank */}
            <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400">
              {player.rank}
            </span>

            {/* Movement */}
            <span className="w-4">
              {player.movement === "up" && (
                <ArrowUpIcon className="size-4 text-court-500" />
              )}
              {player.movement === "down" && (
                <ArrowDownIcon className="size-4 text-red-600" />
              )}
              {player.movement === "none" && (
                <MinusIcon className="size-4 text-slate-300 dark:text-slate-600" />
              )}
            </span>

            {/* Avatar + name */}
            <Avatar
              name={fullName(player.firstName, player.lastName)}
              src={player.avatarSrc}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-medium text-slate-900 dark:text-white",
                  player.unavailable && "text-slate-400 dark:text-slate-500",
                )}
              >
                {fullName(player.firstName, player.lastName)}
              </p>
            </div>

            {/* W/L */}
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {player.wins}S · {player.losses}N
            </span>

            {/* Rank 1 trophy */}
            {player.rank === 1 && (
              <TrophyIcon
                className="size-5 shrink-0 text-trophy-500"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export { StandingsTable };
export type { StandingsTableProps, StandingsPlayer };
