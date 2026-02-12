"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  default: "bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
  current: "bg-court-500 text-white ring-0",
  challengeable: "bg-court-50 ring-2 ring-court-400 dark:bg-court-950 dark:ring-court-500",
  challenged: "bg-orange-50 ring-2 ring-orange-400 dark:bg-orange-950 dark:ring-orange-500",
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
  const isCurrent = variant === "current";

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-left",
          "transition-shadow duration-150",
          onClick && "cursor-pointer hover:shadow-sm",
          variantStyles[variant],
          className,
        )}
      >
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            isCurrent ? "text-white/70" : "text-slate-500 dark:text-slate-400",
          )}
        >
          {rank}
        </span>
        <Avatar
          name={name}
          src={avatarSrc}
          size="sm"
          className={cn(isCurrent && "bg-court-600 text-white")}
        />
        <span
          className={cn(
            "truncate text-sm font-medium",
            isCurrent
              ? "text-white"
              : "text-slate-900 dark:text-white",
            variant === "unavailable" && "text-slate-500",
          )}
        >
          {name}
        </span>
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
        onClick && "cursor-pointer hover:shadow-sm",
        variantStyles[variant],
        className,
      )}
    >
      <span
        className={cn(
          "w-6 text-center text-sm font-bold tabular-nums",
          isCurrent ? "text-white/70" : "text-slate-500 dark:text-slate-400",
        )}
      >
        {rank}
      </span>
      <Avatar
        name={name}
        src={avatarSrc}
        size="md"
        className={cn(isCurrent && "bg-court-600 text-white")}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isCurrent
              ? "text-white"
              : "text-slate-900 dark:text-white",
            variant === "unavailable" && "text-slate-500",
          )}
        >
          {name}
        </p>
        {(wins != null || losses != null) && (
          <p
            className={cn(
              "text-xs",
              isCurrent
                ? "text-white/70"
                : "text-slate-500 dark:text-slate-400",
              variant === "unavailable" && "text-slate-300",
            )}
          >
            {t("winsLosses", { wins: wins ?? 0, losses: losses ?? 0 })}
          </p>
        )}
      </div>
      {rank === 1 && (
        <Badge variant="rank" size="sm">
          #1
        </Badge>
      )}
    </button>
  );
}

export { PlayerCard };
export type { PlayerCardProps, PlayerCardVariant };
