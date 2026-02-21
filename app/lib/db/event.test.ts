import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedClubMember,
  seedSeason,
  seedTeam,
  seedMatch,
  seedEvent,
  seedEventRead,
} from "./seed";
import { getUnreadCount, getEventReadWatermarks, markAsRead } from "./event";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getUnreadCount ───────────────────────────────────

describe("getUnreadCount", () => {
  it("returns 0 when no events", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "unread-empty@example.com");

      const count = await getUnreadCount(tx, p1, [clubId]);
      expect(count).toBe(0);
    });
  });

  it("counts all events when no watermark", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "unread-no-wm@example.com");
      const p2 = await seedPlayer(tx, "unread-no-wm2@example.com");

      // 1 public + 1 personal for p1
      await seedEvent(tx, clubId, { playerId: p2, eventType: "challenge" });
      await seedEvent(tx, clubId, {
        playerId: p2,
        targetPlayerId: p1,
        eventType: "challenged",
      });

      const count = await getUnreadCount(tx, p1, [clubId]);
      expect(count).toBe(2);
    });
  });

  it("respects watermark per club", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx, { name: "Club 1" });
      const club2 = await seedClub(tx, { name: "Club 2" });
      const p1 = await seedPlayer(tx, "unread-wm@example.com");
      const p2 = await seedPlayer(tx, "unread-wm2@example.com");

      // Event in club1 at 10:00
      await seedEvent(tx, club1, {
        playerId: p2,
        eventType: "challenge",
        created: new Date("2026-01-01T10:00:00Z"),
      });

      // Set watermark for club1 to 11:00 (after the event)
      await seedEventRead(tx, p1, club1, new Date("2026-01-01T11:00:00Z"));

      // Event in club2 at 12:00 (no watermark for club2)
      await seedEvent(tx, club2, {
        playerId: p2,
        eventType: "challenge",
        created: new Date("2026-01-01T12:00:00Z"),
      });

      const count = await getUnreadCount(tx, p1, [club1, club2]);
      // club1: 0 (watermark after event), club2: 1 (no watermark)
      expect(count).toBe(1);
    });
  });

  it("includes personal events in count", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "unread-personal@example.com");
      const p2 = await seedPlayer(tx, "unread-personal2@example.com");

      await seedEvent(tx, clubId, { playerId: p2, eventType: "challenge" });
      await seedEvent(tx, clubId, {
        playerId: p2,
        targetPlayerId: p1,
        eventType: "challenged",
      });
      // Personal event for someone else — should NOT count for p1
      await seedEvent(tx, clubId, {
        playerId: p1,
        targetPlayerId: p2,
        eventType: "challenged",
      });

      const count = await getUnreadCount(tx, p1, [clubId]);
      expect(count).toBe(2); // 1 public + 1 personal for p1
    });
  });
});

// ── getEventReadWatermarks ───────────────────────────

describe("getEventReadWatermarks", () => {
  it("returns watermarks per club", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx, { name: "Club A" });
      const club2 = await seedClub(tx, { name: "Club B" });
      const p1 = await seedPlayer(tx, "wm1@example.com");

      const date1 = new Date("2026-01-15T10:00:00Z");
      const date2 = new Date("2026-01-16T14:00:00Z");
      await seedEventRead(tx, p1, club1, date1);
      await seedEventRead(tx, p1, club2, date2);

      const watermarks = await getEventReadWatermarks(tx, p1, [club1, club2]);
      expect(watermarks.size).toBe(2);
      expect(watermarks.get(club1)).toEqual(date1);
      expect(watermarks.get(club2)).toEqual(date2);
    });
  });

  it("returns empty map when no watermarks", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "wm-empty@example.com");

      const watermarks = await getEventReadWatermarks(tx, p1, [clubId]);
      expect(watermarks.size).toBe(0);
    });
  });
});

// ── markAsRead ───────────────────────────────────────

describe("markAsRead", () => {
  it("creates watermark rows", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "mark1@example.com");

      await markAsRead(tx, p1, [clubId]);

      const rows = await tx`
        SELECT * FROM event_reads
        WHERE player_id = ${p1} AND club_id = ${clubId}
      `;
      expect(rows).toHaveLength(1);
      expect(rows[0].last_read_at).toBeInstanceOf(Date);
    });
  });

  it("updates existing watermark", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "mark2@example.com");

      const oldDate = new Date("2020-01-01T00:00:00Z");
      await seedEventRead(tx, p1, clubId, oldDate);

      await markAsRead(tx, p1, [clubId]);

      const rows = await tx`
        SELECT last_read_at FROM event_reads
        WHERE player_id = ${p1} AND club_id = ${clubId}
      `;
      expect(rows[0].last_read_at.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  it("reduces unread count to 0", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "mark3@example.com");
      const p2 = await seedPlayer(tx, "mark4@example.com");

      await seedEvent(tx, clubId, { playerId: p2, eventType: "challenge" });
      await seedEvent(tx, clubId, {
        playerId: p2,
        targetPlayerId: p1,
        eventType: "challenged",
      });

      // Before marking
      const before = await getUnreadCount(tx, p1, [clubId]);
      expect(before).toBe(2);

      await markAsRead(tx, p1, [clubId]);

      // After marking
      const after = await getUnreadCount(tx, p1, [clubId]);
      expect(after).toBe(0);
    });
  });

  it("handles multiple clubs", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx, { name: "Club X" });
      const club2 = await seedClub(tx, { name: "Club Y" });
      const p1 = await seedPlayer(tx, "mark-multi@example.com");

      await markAsRead(tx, p1, [club1, club2]);

      const rows = await tx`
        SELECT * FROM event_reads WHERE player_id = ${p1}
      `;
      expect(rows).toHaveLength(2);
    });
  });
});
