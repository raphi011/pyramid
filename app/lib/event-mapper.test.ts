import { describe, it, expect, vi } from "vitest";
import { mapEventRowsToTimeline } from "./event-mapper";
import type { EventRow, EventType } from "@/app/lib/db/event";

const NOW = new Date("2026-02-14T12:00:00Z");

function makeRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: 1,
    clubId: 10,
    seasonId: 20,
    matchId: 30,
    playerId: 100,
    targetPlayerId: null,
    eventType: "challenge",
    metadata: {},
    created: new Date("2026-02-14T11:00:00Z"),
    actorName: "Alice",
    targetName: null,
    clubName: "Test Club",
    clubSlug: "test-club",
    seasonSlug: "season-1",
    team1Id: 1,
    team2Id: 2,
    winnerTeamId: null,
    team1Score: null,
    team2Score: null,
    team1Name: "Alice",
    team2Name: "Bob",
    ...overrides,
  };
}

const defaultOpts = {
  watermarks: new Map<number, Date>(),
  now: NOW,
  todayLabel: "Today",
  yesterdayLabel: "Yesterday",
  timeLabels: {
    justNow: "just now",
    minutes: (n: number) => `${n}m ago`,
    hours: (n: number) => `${n}h ago`,
    days: (n: number) => `${n}d ago`,
  },
};

describe("mapEventRowsToTimeline", () => {
  it("maps challenge event", () => {
    const rows = [makeRow({ eventType: "challenge" })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      type: "challenge",
      challenger: { name: "Alice" },
      challengee: { name: "Bob" },
    });
  });

  it("maps result event with scores and winnerId=player1", () => {
    const rows = [
      makeRow({
        eventType: "result",
        team1Score: [6, 7],
        team2Score: [4, 5],
        winnerTeamId: 1,
        team1Id: 1,
        team2Id: 2,
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "result",
      winnerId: "player1",
      scores: [
        [6, 4],
        [7, 5],
      ],
      player1: { name: "Alice" },
      player2: { name: "Bob" },
    });
  });

  it("maps result event with winnerId=player2", () => {
    const rows = [
      makeRow({
        eventType: "result",
        team1Score: [4, 5],
        team2Score: [6, 7],
        winnerTeamId: 2,
        team1Id: 1,
        team2Id: 2,
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "result",
      winnerId: "player2",
    });
  });

  it("maps challenged event as personal", () => {
    const rows = [
      makeRow({
        eventType: "challenged",
        targetPlayerId: 200,
        targetName: "Bob",
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "challenged",
      personal: true,
      challenger: { name: "Alice" },
      challengee: { name: "Bob" },
    });
  });

  it("maps date_proposed with proposedDate from metadata", () => {
    const rows = [
      makeRow({
        eventType: "date_proposed",
        targetPlayerId: 200,
        targetName: "Bob",
        metadata: { proposedDatetime: "2026-03-01T10:00:00Z" },
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "date_proposed",
      personal: true,
      proposedDate: "2026-03-01T10:00:00Z",
    });
  });

  it("maps date_accepted with acceptedDate from metadata", () => {
    const rows = [
      makeRow({
        eventType: "date_accepted",
        targetPlayerId: 200,
        targetName: "Bob",
        metadata: { acceptedDatetime: "2026-03-01T10:00:00Z" },
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "date_accepted",
      personal: true,
      acceptedDate: "2026-03-01T10:00:00Z",
    });
  });

  it("maps new_player with startingRank from metadata", () => {
    const rows = [
      makeRow({
        eventType: "new_player",
        matchId: null,
        metadata: { startingRank: 5 },
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "new_player",
      player: { name: "Alice" },
      startingRank: 5,
    });
  });

  it("maps result_entered with scores", () => {
    const rows = [
      makeRow({
        eventType: "result_entered",
        targetPlayerId: 200,
        targetName: "Bob",
        team1Score: [6, 3],
        team2Score: [4, 6],
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "result_entered",
      personal: true,
      player1: { name: "Alice" },
      player2: { name: "Bob" },
      scores: [
        [6, 4],
        [3, 6],
      ],
    });
  });

  it("maps announcement event", () => {
    const rows = [
      makeRow({
        eventType: "announcement",
        metadata: { message: "Tournament starts Monday!" },
        matchId: null,
      }),
    ];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result[0]).toMatchObject({
      type: "announcement",
      message: "Tournament starts Monday!",
      adminName: "Alice",
    });
  });

  // ── Unknown event types ─────────────────────────

  it("skips unknown event types and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Cast simulates a DB returning a type not yet in the EventType union
    const rows = [makeRow({ eventType: "some_future_type" as EventType })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);

    expect(result).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown event type"),
    );
    warnSpy.mockRestore();
  });

  // ── Unread flag ──────────────────────────────────

  it("sets unread=true when event is after watermark", () => {
    const watermarks = new Map([[10, new Date("2026-02-14T10:00:00Z")]]);
    const rows = [makeRow({ created: new Date("2026-02-14T11:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, {
      ...defaultOpts,
      watermarks,
    });
    expect(result[0].unread).toBe(true);
  });

  it("sets unread=false when event is before watermark", () => {
    const watermarks = new Map([[10, new Date("2026-02-14T12:00:00Z")]]);
    const rows = [makeRow({ created: new Date("2026-02-14T11:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, {
      ...defaultOpts,
      watermarks,
    });
    expect(result[0].unread).toBe(false);
  });

  it("sets unread=true when no watermark exists", () => {
    const rows = [makeRow()];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].unread).toBe(true);
  });

  // ── Href ─────────────────────────────────────────

  it("generates match href when matchId present", () => {
    const rows = [makeRow({ matchId: 42 })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].href).toBe("/test-club/season-1/matches/42");
  });

  it("generates no href when matchId is null", () => {
    const rows = [makeRow({ matchId: null })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].href).toBeUndefined();
  });

  // ── Date grouping ────────────────────────────────

  it("groups today events using todayLabel", () => {
    const rows = [makeRow({ created: new Date("2026-02-14T10:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].group).toBe("Today");
  });

  it("groups yesterday events using yesterdayLabel", () => {
    const rows = [makeRow({ created: new Date("2026-02-13T10:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].group).toBe("Yesterday");
  });

  it("uses German defaults when no date group labels provided", () => {
    const rows = [makeRow({ created: new Date("2026-02-14T10:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, {
      watermarks: new Map(),
      now: NOW,
      timeLabels: defaultOpts.timeLabels,
    });
    expect(result[0].group).toBe("Heute");
  });

  it("groups older events by locale date", () => {
    const rows = [makeRow({ created: new Date("2026-02-10T10:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, {
      ...defaultOpts,
      locale: "en-US",
    });
    expect(result[0].group).not.toBe("Today");
    expect(result[0].group).not.toBe("Yesterday");
    expect(result[0].group).toBeTruthy();
  });

  // ── Time formatting ──────────────────────────────

  it("formats recent time as relative", () => {
    const rows = [makeRow({ created: new Date("2026-02-14T11:30:00Z") })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].time).toBe("30m ago");
  });

  it("formats hours ago", () => {
    const rows = [makeRow({ created: new Date("2026-02-14T09:00:00Z") })];
    const result = mapEventRowsToTimeline(rows, defaultOpts);
    expect(result[0].time).toBe("3h ago");
  });

  // ── Empty input ──────────────────────────────────

  it("returns empty array for empty input", () => {
    const result = mapEventRowsToTimeline([], defaultOpts);
    expect(result).toEqual([]);
  });
});
