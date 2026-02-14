"use client";

import { useTranslations } from "next-intl";
import { TrophyIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type PlayerCardVariant =
  | "default"
  | "current"
  | "challengeable"
  | "challenged"
  | "unavailable";

type PlayerCardProps = {
  name: string;
  rank: number;
  avatarSrc?: string | null;
  wins?: number;
  losses?: number;
  variant?: PlayerCardVariant;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
};

const variantStyles: Record<PlayerCardVariant, string> = {
  default:
    "bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
  current:
    "bg-white ring-1 ring-slate-200 border-b-2 border-court-500 dark:bg-slate-900 dark:ring-slate-800 dark:border-court-400",
  challengeable:
    "bg-court-50/50 ring-1 ring-court-300 dark:bg-court-950/50 dark:ring-court-700",
  challenged:
    "bg-white ring-1 ring-slate-200 opacity-50 dark:bg-slate-900 dark:ring-slate-800",
  unavailable: "bg-slate-100 text-slate-500 opacity-60 dark:bg-slate-800",
};

function PlayerCard({
  name,
  rank,
  avatarSrc,
  wins,
  losses,
  variant = "default",
  compact = false,
  onClick,
  className,
}: PlayerCardProps) {
  const t = useTranslations("ranking");
  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-left",
          "transition-all duration-150",
          onClick &&
            "cursor-pointer hover:shadow-md hover:ring-slate-300 dark:hover:ring-slate-600",
          variantStyles[variant],
          className,
        )}
      >
        <span
          className={cn(
            "text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400",
          )}
        >
          {rank}
        </span>
        <Avatar name={name} src={avatarSrc} size="sm" />
        <span
          className={cn(
            "truncate text-sm font-medium text-slate-900 dark:text-white",
            variant === "unavailable" && "text-slate-500",
          )}
        >
          {name}
        </span>
        {rank === 1 && (
          <TrophyIcon
            className="size-4 shrink-0 text-trophy-500"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl p-3 text-left",
        "transition-shadow duration-150",
        onClick && "hover:shadow-sm",
        variantStyles[variant],
        className,
      )}
    >
      <span className="w-6 text-center text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400">
        {rank}
      </span>
      <Avatar name={name} src={avatarSrc} size="md" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold text-slate-900 dark:text-white",
            variant === "unavailable" && "text-slate-500",
          )}
        >
          {name}
        </p>
        {(wins != null || losses != null) && (
          <p
            className={cn(
              "text-xs text-slate-500 dark:text-slate-400",
              variant === "unavailable" && "text-slate-300",
            )}
          >
            {t("winsLosses", { wins: wins ?? 0, losses: losses ?? 0 })}
          </p>
        )}
      </div>
      {rank === 1 && (
        <TrophyIcon
          className="size-5 shrink-0 text-trophy-500"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export { PlayerCard };
export type { PlayerCardProps, PlayerCardVariant };
