"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/app/lib/db/match";

// ── Types ──────────────────────────────────────────────

type MatchCardProps = {
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score?: number[] | null;
  team2Score?: number[] | null;
  created: Date;
  isInvolved?: boolean;
  onClick?: () => void;
  className?: string;
};

// ── Status → badge config ──────────────────────────────

type StatusConfig = {
  key: string;
  variant: BadgeVariant;
};

function getStatusConfig(
  status: MatchStatus,
  isInvolved: boolean,
): StatusConfig {
  switch (status) {
    case "challenged":
      return { key: "statusChallenged", variant: "pending" };
    case "date_set":
      return { key: "statusDateSet", variant: "info" };
    case "pending_confirmation":
      return isInvolved
        ? { key: "statusPendingConfirmation", variant: "pending" }
        : { key: "statusDateSet", variant: "info" };
    case "disputed":
      return isInvolved
        ? { key: "statusDisputed", variant: "loss" }
        : { key: "statusChallenged", variant: "pending" };
    case "completed":
      return { key: "statusCompleted", variant: "win" };
    case "withdrawn":
      return { key: "statusWithdrawn", variant: "subtle" };
    case "forfeited":
      return { key: "statusForfeited", variant: "loss" };
  }
}

// ── Relative time ──────────────────────────────────────

function relativeTime(
  date: Date,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return t("timeJustNow");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("timeMinutes", { minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("timeHours", { hours });

  const days = Math.floor(hours / 24);
  return t("timeDays", { days });
}

// ── Score formatting ───────────────────────────────────

function formatScore(team1Score: number[], team2Score: number[]): string {
  return team1Score.map((s, i) => `${s}-${team2Score[i]}`).join(", ");
}

// ── Component ──────────────────────────────────────────

function MatchCard({
  team1Name,
  team2Name,
  status,
  team1Score,
  team2Score,
  created,
  isInvolved = false,
  onClick,
  className,
}: MatchCardProps) {
  const t = useTranslations("match");
  const { key, variant } = getStatusConfig(status, isInvolved);

  const hasScore =
    status === "completed" &&
    team1Score != null &&
    team2Score != null &&
    team1Score.length > 0;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex w-full items-center gap-3 px-1 py-3 text-left",
        "transition-colors duration-150",
        onClick && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className,
      )}
    >
      {/* Left: names + score */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {team1Name}
          <span className="mx-1.5 text-slate-400">vs</span>
          {team2Name}
        </p>
        {hasScore && (
          <p className="text-xs tabular-nums text-slate-500">
            {formatScore(team1Score!, team2Score!)}
          </p>
        )}
      </div>

      {/* Right: badge + time */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <Badge variant={variant} size="sm">
          {t(key)}
        </Badge>
        <span className="text-[10px] text-slate-400">
          {relativeTime(created, t)}
        </span>
      </div>
    </button>
  );
}

export { MatchCard };
export type { MatchCardProps };
