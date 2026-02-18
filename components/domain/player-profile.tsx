"use client";

import { useTranslations } from "next-intl";
import { PencilIcon } from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatBlock } from "@/components/stat-block";
import { cn } from "@/lib/utils";

type PlayerProfileProps = {
  name: string;
  avatarSrc?: string | null;
  rank: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  unavailable?: boolean;
  unavailableUntil?: string | null;
  isOwnProfile?: boolean;
  canChallenge?: boolean;
  onEdit?: () => void;
  onChallenge?: () => void;
  rankChartSlot?: React.ReactNode;
  className?: string;
};

function PlayerProfile({
  name,
  avatarSrc,
  rank,
  wins,
  losses,
  totalMatches,
  winRate,
  trend,
  trendValue,
  unavailable,
  unavailableUntil,
  isOwnProfile,
  canChallenge,
  onEdit,
  onChallenge,
  rankChartSlot,
  className,
}: PlayerProfileProps) {
  const t = useTranslations("profile");

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar name={name} src={avatarSrc} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {name}
            </h2>
            {unavailable && (
              <Badge variant="info">
                {unavailableUntil
                  ? t("unavailableUntil", { date: unavailableUntil })
                  : t("unavailableIndefinitely")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {t("rank", { rank })}
          </p>
          <div className="mt-3 flex gap-2">
            {isOwnProfile && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <PencilIcon className="size-4" />
                {t("edit")}
              </Button>
            )}
            {!isOwnProfile && canChallenge && onChallenge && (
              <Button size="sm" onClick={onChallenge}>
                {t("challenge")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBlock
          label={t("rankLabel")}
          value={rank}
          trend={trend}
          trendValue={trendValue}
        />
        <StatBlock label={t("winsLabel")} value={wins} />
        <StatBlock label={t("lossesLabel")} value={losses} />
        <StatBlock label={t("winRateLabel")} value={winRate} />
      </div>

      {/* Rank chart slot */}
      {rankChartSlot}
    </div>
  );
}

export { PlayerProfile };
export type { PlayerProfileProps };
