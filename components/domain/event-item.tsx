import { useTranslations } from "next-intl";
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
  CalendarIcon,
  ArrowRightIcon,
} from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
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

type EventContextData = {
  scores?: [number, number][];
  player1Name?: string;
  player2Name?: string;
  winnerId?: "player1" | "player2";
  rankBefore?: number;
  rankAfter?: number;
  startingRank?: number;
  returnDate?: string;
  challengedPlayer?: string;
};

type EventItemProps = {
  type: EventType;
  title: string;
  description?: string;
  timestamp: string;
  player?: { name: string; avatarSrc?: string | null };
  unread?: boolean;
  highlightName?: string;
  href?: string;
  context?: EventContextData;
  className?: string;
};

const eventConfig: Record<EventType, { icon: React.ReactNode }> = {
  result: { icon: <TrophyIcon /> },
  challenge: { icon: <BoltIcon /> },
  withdrawal: { icon: <ArrowUturnLeftIcon /> },
  forfeit: { icon: <ExclamationTriangleIcon /> },
  rank_change: { icon: <ArrowsUpDownIcon /> },
  new_player: { icon: <UserPlusIcon /> },
  season_start: { icon: <PlayIcon /> },
  season_end: { icon: <StopIcon /> },
  unavailable: { icon: <PauseIcon /> },
};

function EventDetail({
  type,
  context,
}: {
  type: EventType;
  context: EventContextData;
}) {
  const t = useTranslations("events");

  switch (type) {
    case "result":
      if (context.scores && context.scores.length > 0) {
        return (
          <div className="flex gap-1.5">
            {context.scores.map(([s1, s2], i) => (
              <span
                key={i}
                className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300"
              >
                {s1}:{s2}
              </span>
            ))}
          </div>
        );
      }
      return null;

    case "rank_change":
      if (context.rankBefore != null && context.rankAfter != null) {
        return (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>{context.rankBefore}</span>
            <ArrowRightIcon className="size-4 text-slate-400" />
            <span>{context.rankAfter}</span>
          </div>
        );
      }
      return null;

    case "new_player":
      if (context.startingRank != null) {
        return (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("startsAtRank", { rank: context.startingRank })}
          </span>
        );
      }
      return null;

    case "unavailable":
      if (context.returnDate) {
        return (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="size-3.5" />
            {t("until", { date: context.returnDate })}
          </span>
        );
      }
      return null;

    case "withdrawal":
      if (context.challengedPlayer) {
        return (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("against", { player: context.challengedPlayer })}
          </span>
        );
      }
      return null;

    case "forfeit":
      if (context.challengedPlayer) {
        return (
          <div className="space-y-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("against", { player: context.challengedPlayer })}
            </span>
            {context.rankBefore != null && context.rankAfter != null && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{context.rankBefore}</span>
                <ArrowRightIcon className="size-3.5 text-slate-400" />
                <span>{context.rankAfter}</span>
              </div>
            )}
          </div>
        );
      }
      return null;

    default:
      return null;
  }
}

function HighlightedText({
  text,
  name,
}: {
  text: string;
  name?: string;
}) {
  if (!name) return <>{text}</>;
  const index = text.indexOf(name);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="underline decoration-court-500 decoration-2 underline-offset-2">
        {name}
      </span>
      {text.slice(index + name.length)}
    </>
  );
}

function EventItem({
  type,
  title,
  description,
  timestamp,
  player,
  unread,
  highlightName,
  href,
  context,
  className,
}: EventItemProps) {
  const config = eventConfig[type];
  const hasDetail = context != null;

  const innerContent = (
    <>
      {/* Icon or avatar with optional unread badge */}
      <div className="relative shrink-0">
        {player ? (
          <Avatar name={player.name} src={player.avatarSrc} size="sm" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 [&_svg]:size-4">
            {config.icon}
          </span>
        )}
        {unread && (
          <span className="absolute bottom-0 right-0 size-2 rounded-full bg-court-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          <HighlightedText text={title} name={highlightName} />
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {timestamp}
        </p>
      </div>

      {/* Detail column — desktop only */}
      {hasDetail && (
        <div className="hidden items-center md:flex md:w-48 md:justify-end">
          <EventDetail type={type} context={context} />
        </div>
      )}
    </>
  );

  const sharedClassName = cn(
    "flex items-start gap-3 md:gap-6 rounded-xl px-3 py-3",
    href &&
      "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150",
    className,
  );

  if (href) {
    return (
      <a href={href} className={sharedClassName}>
        {innerContent}
      </a>
    );
  }

  return <div className={sharedClassName}>{innerContent}</div>;
}

export { EventItem, eventConfig };
export type { EventItemProps, EventType, EventContextData };
