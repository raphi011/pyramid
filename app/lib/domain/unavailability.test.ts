import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "../db/test-helpers";
import {
  seedPlayer,
  seedClub,
  seedClubMember,
  seedSeason,
  seedTeam,
  seedMatch,
} from "../db/seed";
import { getPlayerProfile } from "../db/auth";
import {
  setUnavailability,
  cancelUnavailability,
  AlreadyUnavailableError,
  NotUnavailableError,
  InvalidDateRangeError,
  HasOpenChallengeError,
} from "./unavailability";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── setUnavailability ──────────────────────────────────

describe("setUnavailability", () => {
  it("sets unavailability dates and creates event", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-set@test.com");
      await seedClubMember(tx, playerId, clubId);

      await setUnavailability(tx, playerId, [{ clubId }], {
        from: new Date("2026-03-01"),
        until: new Date("2026-03-15"),
        reason: "Vacation",
      });

      const profile = await getPlayerProfile(tx, playerId);
      expect(profile!.unavailableFrom).toBeTruthy();
      expect(profile!.unavailableUntil).toBeTruthy();
      expect(profile!.unavailableReason).toBe("Vacation");

      // Verify event created
      const events = await tx`
        SELECT * FROM events
        WHERE player_id = ${playerId} AND event_type = 'unavailable'
      `;
      expect(events.length).toBe(1);
      expect((events[0].metadata as Record<string, unknown>).returnDate).toBe(
        "2026-03-15T00:00:00.000Z",
      );
    });
  });

  it("supports indefinite unavailability (no until date)", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-indef@test.com");
      await seedClubMember(tx, playerId, clubId);

      await setUnavailability(tx, playerId, [{ clubId }], {
        from: new Date("2026-03-01"),
        until: null,
        reason: "Injury",
      });

      const profile = await getPlayerProfile(tx, playerId);
      expect(profile!.unavailableFrom).toBeTruthy();
      expect(profile!.unavailableUntil).toBeNull();

      const events = await tx`
        SELECT * FROM events
        WHERE player_id = ${playerId} AND event_type = 'unavailable'
      `;
      expect(events.length).toBe(1);
      expect(
        (events[0].metadata as Record<string, unknown>).returnDate,
      ).toBeNull();
    });
  });

  it("throws InvalidDateRangeError when until < from", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-range@test.com");
      await seedClubMember(tx, playerId, clubId);

      await expect(
        setUnavailability(tx, playerId, [{ clubId }], {
          from: new Date("2026-03-15"),
          until: new Date("2026-03-01"),
          reason: "",
        }),
      ).rejects.toThrow(InvalidDateRangeError);
    });
  });

  it("throws AlreadyUnavailableError when already unavailable", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-already@test.com");
      await seedClubMember(tx, playerId, clubId);

      // Set unavailability first
      await tx`
        UPDATE player
        SET unavailable_from = NOW(),
            unavailable_until = NOW() + INTERVAL '7 days'
        WHERE id = ${playerId}
      `;

      await expect(
        setUnavailability(tx, playerId, [{ clubId }], {
          from: new Date("2026-04-01"),
          until: null,
          reason: "",
        }),
      ).rejects.toThrow(AlreadyUnavailableError);
    });
  });

  it("throws HasOpenChallengeError when player has open challenge", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "unavail-challenge1@test.com");
      const p2 = await seedPlayer(tx, "unavail-challenge2@test.com");
      await seedClubMember(tx, p1, clubId);
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      await expect(
        setUnavailability(tx, p1, [{ clubId }], {
          from: new Date("2026-03-01"),
          until: null,
          reason: "",
        }),
      ).rejects.toThrow(HasOpenChallengeError);
    });
  });

  it("creates events for multiple clubs", async () => {
    await db.withinTransaction(async (tx) => {
      const club1 = await seedClub(tx);
      const club2 = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-multi@test.com");
      await seedClubMember(tx, playerId, club1);
      await seedClubMember(tx, playerId, club2);

      await setUnavailability(
        tx,
        playerId,
        [{ clubId: club1 }, { clubId: club2 }],
        {
          from: new Date("2026-03-01"),
          until: new Date("2026-03-15"),
          reason: "",
        },
      );

      const events = await tx`
        SELECT * FROM events
        WHERE player_id = ${playerId} AND event_type = 'unavailable'
      `;
      expect(events.length).toBe(2);
    });
  });
});

// ── cancelUnavailability ───────────────────────────────

describe("cancelUnavailability", () => {
  it("clears unavailability and creates available-again event", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-cancel@test.com");
      await seedClubMember(tx, playerId, clubId);

      // Set unavailability first
      await tx`
        UPDATE player
        SET unavailable_from = NOW(),
            unavailable_until = NOW() + INTERVAL '7 days',
            unavailable_reason = 'Vacation'
        WHERE id = ${playerId}
      `;

      await cancelUnavailability(tx, playerId, [{ clubId }]);

      const profile = await getPlayerProfile(tx, playerId);
      expect(profile!.unavailableFrom).toBeNull();
      expect(profile!.unavailableUntil).toBeNull();
      expect(profile!.unavailableReason).toBe("");

      const events = await tx`
        SELECT * FROM events
        WHERE player_id = ${playerId} AND event_type = 'unavailable'
      `;
      expect(events.length).toBe(1);
      expect(
        (events[0].metadata as Record<string, unknown>).returnDate,
      ).toBeNull();
    });
  });

  it("throws NotUnavailableError when not unavailable", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const playerId = await seedPlayer(tx, "unavail-nocancel@test.com");
      await seedClubMember(tx, playerId, clubId);

      await expect(
        cancelUnavailability(tx, playerId, [{ clubId }]),
      ).rejects.toThrow(NotUnavailableError);
    });
  });
});
