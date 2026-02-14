import type { EventRow } from "@/app/lib/db/event";
import type { TimelineEvent } from "@/components/domain/event-timeline";

type MapperOptions = {
  watermarks: Map<number, Date>;
  locale?: string;
  now?: Date;
  todayLabel?: string;
  yesterdayLabel?: string;
};

export function mapEventRowsToTimeline(
  rows: EventRow[],
  opts: MapperOptions,
): TimelineEvent[] {
  const now = opts.now ?? new Date();
  const results: TimelineEvent[] = [];

  for (const row of rows) {
    const event = mapSingleEvent(row, opts.watermarks, now, opts);
    if (event) results.push(event);
  }

  return results;
}

function mapSingleEvent(
  row: EventRow,
  watermarks: Map<number, Date>,
  now: Date,
  opts: MapperOptions,
): TimelineEvent | null {
  const watermark = watermarks.get(row.clubId);
  const unread = watermark ? row.created > watermark : true;
  const time = formatRelativeTime(row.created, now);
  const group = formatDateGroup(row.created, now, opts);
  const groupDate = row.created.toLocaleDateString(opts.locale ?? "de-AT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const href = computeHref(row);

  const base = { time, unread, href, group, groupDate };

  switch (row.eventType) {
    case "result":
      return {
        id: row.id,
        type: "result",
        player1: { name: row.team1Name ?? "" },
        player2: { name: row.team2Name ?? "" },
        winnerId: row.winnerTeamId === row.team1Id ? "player1" : "player2",
        scores: zipScores(row.team1Score, row.team2Score),
        ...base,
      };

    case "challenge":
      return {
        id: row.id,
        type: "challenge",
        challenger: { name: row.team1Name ?? row.actorName ?? "" },
        challengee: { name: row.team2Name ?? "" },
        ...base,
      };

    case "challenged":
      return {
        id: row.id,
        type: "challenged",
        challenger: { name: row.actorName ?? "" },
        challengee: { name: row.targetName ?? "" },
        personal: true,
        ...base,
      };

    case "withdrawal":
      return {
        id: row.id,
        type: "withdrawal",
        player: { name: row.team1Name ?? row.actorName ?? "" },
        opponent: { name: row.team2Name ?? "" },
        ...base,
      };

    case "forfeit":
      return {
        id: row.id,
        type: "forfeit",
        player: { name: row.team1Name ?? row.actorName ?? "" },
        opponent: { name: row.team2Name ?? "" },
        ...base,
      };

    case "new_player":
      return {
        id: row.id,
        type: "new_player",
        player: { name: row.actorName ?? "" },
        startingRank: (row.metadata?.startingRank as number) ?? 0,
        ...base,
      };

    case "unavailable":
      return {
        id: row.id,
        type: "unavailable",
        player: { name: row.actorName ?? "" },
        returnDate: (row.metadata?.returnDate as string) ?? undefined,
        ...base,
      };

    case "challenge_accepted":
      return {
        id: row.id,
        type: "challenge_accepted",
        challenger: { name: row.targetName ?? "" },
        challengee: { name: row.actorName ?? "" },
        personal: true,
        ...base,
      };

    case "challenge_withdrawn":
      return {
        id: row.id,
        type: "challenge_withdrawn",
        player: { name: row.actorName ?? "" },
        opponent: { name: row.targetName ?? "" },
        personal: true,
        ...base,
      };

    case "date_proposed":
      return {
        id: row.id,
        type: "date_proposed",
        player: { name: row.actorName ?? "" },
        opponent: { name: row.targetName ?? "" },
        proposedDate: (row.metadata?.proposedDatetime as string) ?? "",
        personal: true,
        ...base,
      };

    case "date_accepted":
      return {
        id: row.id,
        type: "date_accepted",
        player: { name: row.actorName ?? "" },
        opponent: { name: row.targetName ?? "" },
        acceptedDate: (row.metadata?.acceptedDatetime as string) ?? "",
        personal: true,
        ...base,
      };

    case "date_reminder":
      return {
        id: row.id,
        type: "date_reminder",
        player: { name: row.actorName ?? "" },
        opponent: { name: row.targetName ?? "" },
        daysLeft: (row.metadata?.daysLeft as number) ?? 0,
        personal: true,
        ...base,
      };

    case "result_entered":
      return {
        id: row.id,
        type: "result_entered",
        player1: { name: row.actorName ?? "" },
        player2: { name: row.targetName ?? "" },
        scores: zipScores(row.team1Score, row.team2Score),
        personal: true,
        ...base,
      };

    case "result_confirmed":
      return {
        id: row.id,
        type: "result_confirmed",
        player1: { name: row.actorName ?? "" },
        player2: { name: row.targetName ?? "" },
        scores: zipScores(row.team1Score, row.team2Score),
        personal: true,
        ...base,
      };

    case "result_disputed":
      return {
        id: row.id,
        type: "result_disputed",
        player1: { name: row.actorName ?? "" },
        player2: { name: row.targetName ?? "" },
        personal: true,
        ...base,
      };

    case "announcement":
      return {
        id: row.id,
        type: "announcement",
        message: (row.metadata?.message as string) ?? "",
        adminName: row.actorName ?? "",
        ...base,
      };

    case "deadline_exceeded":
      return {
        id: row.id,
        type: "deadline_exceeded",
        player: { name: row.actorName ?? "" },
        opponent: { name: row.targetName ?? "" },
        daysOver: (row.metadata?.daysOver as number) ?? 0,
        personal: true,
        ...base,
      };

    case "season_start":
      return {
        id: row.id,
        type: "season_start",
        seasonName: (row.metadata?.seasonName as string) ?? "",
        playerCount: (row.metadata?.playerCount as number) ?? 0,
        time,
        group,
        groupDate,
      };

    case "season_end":
      return {
        id: row.id,
        type: "season_end",
        seasonName: (row.metadata?.seasonName as string) ?? "",
        winnerName: (row.metadata?.winnerName as string) ?? "",
        time,
        group,
        groupDate,
      };

    default:
      console.warn(
        `Unknown event type "${row.eventType}" for event id=${row.id}. Skipping.`,
      );
      return null;
  }
}

// ── Helpers ────────────────────────────────────────────

function zipScores(
  team1Score: number[] | null,
  team2Score: number[] | null,
): [number, number][] {
  if (!team1Score || !team2Score) return [];
  return team1Score.map((s1, i) => [s1, team2Score[i]] as [number, number]);
}

function computeHref(row: EventRow): string | undefined {
  if (row.matchId) return `/matches/${row.matchId}`;
  return undefined;
}

function formatRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatDateGroup(
  date: Date,
  now: Date,
  opts: Pick<MapperOptions, "locale" | "todayLabel" | "yesterdayLabel">,
): string {
  const eventDate = startOfDay(date);
  const today = startOfDay(now);

  const diffMs = today.getTime() - eventDate.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return opts.todayLabel ?? "Heute";
  if (diffDays === 1) return opts.yesterdayLabel ?? "Gestern";

  return date.toLocaleDateString(opts.locale ?? "de-AT", {
    day: "numeric",
    month: "long",
  });
}

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}
