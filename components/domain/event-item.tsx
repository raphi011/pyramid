import {
  TrophyIcon,
  BoltIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  ArrowsUpDownIcon,
  UserPlusIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
} from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventType =
  | "result"
  | "challenge"
  | "withdrawal"
  | "forfeit"
  | "rank_change"
  | "new_player"
  | "season_start"
  | "season_end"
  | "unavailable";

type EventItemProps = {
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
  player?: { name: string; avatarSrc?: string | null };
  className?: string;
};

const eventConfig: Record<
  EventType,
  { icon: React.ReactNode; badge: BadgeVariant; badgeLabel: string }
> = {
  result: {
    icon: <TrophyIcon />,
    badge: "win",
    badgeLabel: "Ergebnis",
  },
  challenge: {
    icon: <BoltIcon />,
    badge: "pending",
    badgeLabel: "Forderung",
  },
  withdrawal: {
    icon: <ArrowUturnLeftIcon />,
    badge: "info",
    badgeLabel: "Rückzug",
  },
  forfeit: {
    icon: <ExclamationTriangleIcon />,
    badge: "loss",
    badgeLabel: "Aufgabe",
  },
  rank_change: {
    icon: <ArrowsUpDownIcon />,
    badge: "pending",
    badgeLabel: "Rangänderung",
  },
  new_player: {
    icon: <UserPlusIcon />,
    badge: "info",
    badgeLabel: "Neuer Spieler",
  },
  season_start: {
    icon: <PlayIcon />,
    badge: "win",
    badgeLabel: "Saisonstart",
  },
  season_end: {
    icon: <StopIcon />,
    badge: "info",
    badgeLabel: "Saisonende",
  },
  unavailable: {
    icon: <PauseIcon />,
    badge: "info",
    badgeLabel: "Abwesend",
  },
};

function EventItem({
  type,
  title,
  description,
  timestamp,
  player,
  className,
}: EventItemProps) {
  const config = eventConfig[type];

  return (
    <div
      className={cn(
        "flex gap-3 py-3",
        className,
      )}
    >
      {/* Icon or avatar */}
      {player ? (
        <Avatar name={player.name} src={player.avatarSrc} size="sm" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 [&_svg]:size-4">
          {config.icon}
        </span>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </p>
          <Badge variant={config.badge} size="sm">
            {config.badgeLabel}
          </Badge>
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {timestamp}
        </p>
      </div>
    </div>
  );
}

export { EventItem };
export type { EventItemProps, EventType };
