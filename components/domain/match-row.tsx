"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MatchStatus =
  | "challenged"
  | "date_set"
  | "completed"
  | "withdrawn"
  | "forfeited";

type MatchRowProps = {
  player1: { name: string; avatarSrc?: string | null };
  player2: { name: string; avatarSrc?: string | null };
  status: MatchStatus;
  winnerId?: "player1" | "player2";
  scores?: [number, number][];
  date?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

const statusConfig: Record<
  MatchStatus,
  { label: string; variant: BadgeVariant }
> = {
  challenged: { label: "Offen", variant: "pending" },
  date_set: { label: "Geplant", variant: "info" },
  completed: { label: "Beendet", variant: "win" },
  withdrawn: { label: "Zurückgezogen", variant: "info" },
  forfeited: { label: "Aufgegeben", variant: "loss" },
};

function MatchRow({
  player1,
  player2,
  status,
  winnerId,
  scores,
  date,
  selected,
  onClick,
  className,
}: MatchRowProps) {
  const config = statusConfig[status];
  const isMuted = status === "withdrawn" || status === "forfeited";

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-left",
        "transition-shadow duration-150",
        selected
          ? "relative z-10 ring-2 ring-court-500 bg-court-50/50 dark:bg-court-950/30"
          : "ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900",
        onClick && "hover:shadow-sm",
        isMuted && "opacity-60",
        className,
      )}
    >
      {/* Player avatars */}
      <div className="flex -space-x-0.5">
        <Avatar name={player1.name} src={player1.avatarSrc} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
        <Avatar name={player2.name} src={player2.avatarSrc} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
      </div>

      {/* Names + date */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          <span className={cn(winnerId === "player1" && "font-bold")}>
            {player1.name}
          </span>
          {" vs "}
          <span className={cn(winnerId === "player2" && "font-bold")}>
            {player2.name}
          </span>
        </p>
        {date && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
        )}
      </div>

      {/* Scores */}
      {scores && scores.length > 0 && (
        <div className="flex gap-1.5">
          {scores.map(([s1, s2], i) => (
            <span
              key={i}
              className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300"
            >
              {s1}:{s2}
            </span>
          ))}
        </div>
      )}

      {/* Status badge */}
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    </button>
  );
}

export { MatchRow };
export type { MatchRowProps, MatchStatus };
