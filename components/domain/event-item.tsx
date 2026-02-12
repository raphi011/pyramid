import { useTranslations } from "next-intl";
import {
  TrophyIcon,
  BoltIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  PauseIcon,
  CalendarIcon,
} from "@heroicons/react/20/solid";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────

type PlayerRef = { name: string; avatarSrc?: string | null };

type EventItemBase = {
  time: string;
  unread?: boolean;
  highlightName?: string;
  href?: string;
  className?: string;
};

type ResultEvent = EventItemBase & {
  type: "result";
  player1: PlayerRef;
  player2: PlayerRef;
  winnerId: "player1" | "player2";
  scores: [number, number][];
  rankBefore?: number;
  rankAfter?: number;
};

type ChallengeEvent = EventItemBase & {
  type: "challenge";
  challenger: PlayerRef;
  challengee: PlayerRef;
};

type WithdrawalEvent = EventItemBase & {
  type: "withdrawal";
  player: PlayerRef;
  opponent: PlayerRef;
  reason?: string;
};

type ForfeitEvent = EventItemBase & {
  type: "forfeit";
  player: PlayerRef;
  opponent: PlayerRef;
  reason?: string;
};

type NewPlayerEvent = EventItemBase & {
  type: "new_player";
  player: PlayerRef;
  startingRank: number;
};

type UnavailableEvent = EventItemBase & {
  type: "unavailable";
  player: PlayerRef;
  returnDate?: string;
};

type EventItemProps =
  | ResultEvent
  | ChallengeEvent
  | WithdrawalEvent
  | ForfeitEvent
  | NewPlayerEvent
  | UnavailableEvent;

// ── Icon config ─────────────────────────────────

const eventIcons: Record<EventItemProps["type"], React.ReactNode> = {
  result: <TrophyIcon />,
  challenge: <BoltIcon />,
  withdrawal: <ArrowUturnLeftIcon />,
  forfeit: <ExclamationTriangleIcon />,
  new_player: <UserPlusIcon />,
  unavailable: <PauseIcon />,
};

// ── Helpers ─────────────────────────────────────

function getAvatarPlayer(event: EventItemProps): PlayerRef {
  switch (event.type) {
    case "result":
      return event.winnerId === "player1" ? event.player1 : event.player2;
    case "challenge":
      return event.challenger;
    case "withdrawal":
    case "forfeit":
    case "new_player":
    case "unavailable":
      return event.player;
  }
}

function useEventTitle(event: EventItemProps): string {
  const t = useTranslations("events");

  switch (event.type) {
    case "result": {
      const winner =
        event.winnerId === "player1" ? event.player1.name : event.player2.name;
      const loser =
        event.winnerId === "player1" ? event.player2.name : event.player1.name;
      return t("resultTitle", { winner, loser });
    }
    case "challenge":
      return t("challengeTitle", {
        challenger: event.challenger.name,
        challengee: event.challengee.name,
      });
    case "withdrawal":
      return t("withdrawalTitle", {
        player: event.player.name,
        opponent: event.opponent.name,
      });
    case "forfeit":
      return t("forfeitTitle", {
        player: event.player.name,
        opponent: event.opponent.name,
      });
    case "new_player":
      return t("newPlayerTitle", { player: event.player.name });
    case "unavailable":
      return event.returnDate
        ? t("unavailableTitle", { player: event.player.name })
        : t("availableTitle", { player: event.player.name });
  }
}

// ── Inline detail ───────────────────────────────

function EventDetail({ event }: { event: EventItemProps }) {
  const t = useTranslations("events");

  switch (event.type) {
    case "result": {
      const winnerName =
        event.winnerId === "player1"
          ? event.player1.name
          : event.player2.name;

      return (
        <p className="mt-1 text-xs">
          {event.scores.map(([s1, s2], i) => {
            const winnerScore =
              event.winnerId === "player1" ? s1 : s2;
            const loserScore =
              event.winnerId === "player1" ? s2 : s1;
            const wonSet = winnerScore > loserScore;

            return (
              <span key={i} className="tabular-nums">
                {i > 0 && " "}
                <span
                  className={
                    wonSet
                      ? "font-bold text-court-600 dark:text-court-400"
                      : "font-bold text-red-600 dark:text-red-400"
                  }
                >
                  {winnerScore}
                </span>
                <span className="text-slate-500">:</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {loserScore}
                </span>
              </span>
            );
          })}
          {event.rankBefore != null && event.rankAfter != null && (
            <span className="text-slate-500 dark:text-slate-400">
              {", "}
              {t("rankUp", {
                player: winnerName,
                rankBefore: event.rankBefore,
                rankAfter: event.rankAfter,
              })}
            </span>
          )}
        </p>
      );
    }

    case "new_player":
      return (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("startsAtRank", { rank: event.startingRank })}
        </p>
      );

    case "unavailable":
      if (event.returnDate) {
        return (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <CalendarIcon className="size-3.5" />
            {t("until", { date: event.returnDate })}
          </p>
        );
      }
      return null;

    case "withdrawal":
    case "forfeit":
      if (event.reason) {
        return (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {event.reason}
          </p>
        );
      }
      return null;

    case "challenge":
      return null;
  }
}

// ── Highlighted text ────────────────────────────

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
      <mark className="rounded-sm bg-court-100 px-0.5 text-inherit dark:bg-court-900/50">
        {name}
      </mark>
      {text.slice(index + name.length)}
    </>
  );
}

// ── Component ───────────────────────────────────

function EventItem(props: EventItemProps) {
  const { time, unread, highlightName, href, className } = props;
  const title = useEventTitle(props);
  const avatarPlayer = getAvatarPlayer(props);

  const innerContent = (
    <>
      {/* Avatar + mobile time */}
      <div className="shrink-0">
        <Avatar
          name={avatarPlayer.name}
          src={avatarPlayer.avatarSrc}
          size="sm"
        />
        <p className="mt-1 text-center text-[11px] tabular-nums text-slate-500 dark:text-slate-400 md:hidden">
          {time}
        </p>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {unread && (
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-court-500 align-middle" />
            )}
            <HighlightedText text={title} name={highlightName} />
          </p>
          <span className="ml-4 hidden shrink-0 text-xs text-slate-500 dark:text-slate-400 md:block">
            {time}
          </span>
        </div>
        <EventDetail event={props} />
      </div>
    </>
  );

  const sharedClassName = cn(
    "flex items-start gap-3 md:gap-6 rounded-xl px-3 py-3",
    unread && "bg-court-50/50 dark:bg-court-950/20",
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

export { EventItem, eventIcons };
export type { EventItemProps, PlayerRef };
