import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import { seedPlayer, seedClub, seedClubMember } from "./seed";
import {
  getClubByInviteCode,
  getClubById,
  getPlayerClubs,
  getPlayerRole,
  isClubMember,
  joinClub,
} from "./club";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getClubByInviteCode ──────────────────────────────

describe("getClubByInviteCode", () => {
  it("returns club when invite code matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, {
        name: "Tennis Club",
        inviteCode: "TENNIS-123",
      });
      const club = await getClubByInviteCode(tx, "TENNIS-123");
      expect(club).toEqual({
        id: clubId,
        name: "Tennis Club",
        inviteCode: "TENNIS-123",
        isDisabled: false,
      });
    });
  });

  it("returns null when not found", async () => {
    await db.withinTransaction(async (tx) => {
      const club = await getClubByInviteCode(tx, "NONEXISTENT");
      expect(club).toBeNull();
    });
  });

  it("returns disabled club (caller decides what to do)", async () => {
    await db.withinTransaction(async (tx) => {
      await seedClub(tx, { inviteCode: "DISABLED-1", isDisabled: true });
      const club = await getClubByInviteCode(tx, "DISABLED-1");
      expect(club).not.toBeNull();
      expect(club!.isDisabled).toBe(true);
    });
  });
});

// ── getClubById ──────────────────────────────────────

describe("getClubById", () => {
  it("returns club when found", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "Lookup Club" });
      const club = await getClubById(tx, clubId);
      expect(club).toEqual(
        expect.objectContaining({ id: clubId, name: "Lookup Club" }),
      );
    });
  });

  it("returns null when not found", async () => {
    await db.withinTransaction(async (tx) => {
      const club = await getClubById(tx, 999999);
      expect(club).toBeNull();
    });
  });
});

// ── getPlayerClubs ───────────────────────────────────

describe("getPlayerClubs", () => {
  it("returns single club membership", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "clubs@example.com");
      const clubId = await seedClub(tx, { name: "My Club" });
      await seedClubMember(tx, playerId, clubId, "player");

      const clubs = await getPlayerClubs(tx, playerId);
      expect(clubs).toEqual([
        { clubId, clubName: "My Club", role: "player" },
      ]);
    });
  });

  it("returns multiple club memberships", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "multi@example.com");
      const club1 = await seedClub(tx, { name: "Club A" });
      const club2 = await seedClub(tx, { name: "Club B" });
      await seedClubMember(tx, playerId, club1, "player");
      await seedClubMember(tx, playerId, club2, "admin");

      const clubs = await getPlayerClubs(tx, playerId);
      expect(clubs).toHaveLength(2);
      expect(clubs).toEqual(
        expect.arrayContaining([
          { clubId: club1, clubName: "Club A", role: "player" },
          { clubId: club2, clubName: "Club B", role: "admin" },
        ]),
      );
    });
  });

  it("returns empty array when player has no clubs", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "lonely@example.com");
      const clubs = await getPlayerClubs(tx, playerId);
      expect(clubs).toEqual([]);
    });
  });
});

// ── getPlayerRole ────────────────────────────────────

describe("getPlayerRole", () => {
  it("returns player role", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "role-p@example.com");
      const clubId = await seedClub(tx);
      await seedClubMember(tx, playerId, clubId, "player");

      const role = await getPlayerRole(tx, playerId, clubId);
      expect(role).toBe("player");
    });
  });

  it("returns admin role", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "role-a@example.com");
      const clubId = await seedClub(tx);
      await seedClubMember(tx, playerId, clubId, "admin");

      const role = await getPlayerRole(tx, playerId, clubId);
      expect(role).toBe("admin");
    });
  });

  it("returns null for non-member", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "role-none@example.com");
      const clubId = await seedClub(tx);

      const role = await getPlayerRole(tx, playerId, clubId);
      expect(role).toBeNull();
    });
  });
});

// ── isClubMember ─────────────────────────────────────

describe("isClubMember", () => {
  it("returns true when member", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "member@example.com");
      const clubId = await seedClub(tx);
      await seedClubMember(tx, playerId, clubId);

      expect(await isClubMember(tx, playerId, clubId)).toBe(true);
    });
  });

  it("returns false when not member", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "notmember@example.com");
      const clubId = await seedClub(tx);

      expect(await isClubMember(tx, playerId, clubId)).toBe(false);
    });
  });
});

// ── joinClub ─────────────────────────────────────────

describe("joinClub", () => {
  it("joins with default player role", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "join@example.com");
      const clubId = await seedClub(tx);

      const result = await joinClub(tx, playerId, clubId);
      expect(result).toEqual({ alreadyMember: false });

      const role = await getPlayerRole(tx, playerId, clubId);
      expect(role).toBe("player");
    });
  });

  it("joins with explicit admin role", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "join-admin@example.com");
      const clubId = await seedClub(tx);

      const result = await joinClub(tx, playerId, clubId, "admin");
      expect(result).toEqual({ alreadyMember: false });

      const role = await getPlayerRole(tx, playerId, clubId);
      expect(role).toBe("admin");
    });
  });

  it("returns alreadyMember on duplicate", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "dup@example.com");
      const clubId = await seedClub(tx);

      await joinClub(tx, playerId, clubId);
      const result = await joinClub(tx, playerId, clubId);
      expect(result).toEqual({ alreadyMember: true });
    });
  });
});
