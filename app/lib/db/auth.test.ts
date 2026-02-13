import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import { seedPlayer } from "./seed";
import {
  getPlayerByEmail,
  getPlayerById,
  updatePlayerProfile,
  createMagicLink,
  verifyMagicLink,
  createSession,
  getSessionByToken,
  deleteSessionByToken,
} from "./auth";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getPlayerByEmail ───────────────────────────────────

describe("getPlayerByEmail", () => {
  it("returns player when email matches (case-insensitive)", async () => {
    await db.withinTransaction(async (tx) => {
      await seedPlayer(tx, "Alice@Example.com", "Alice");
      const player = await getPlayerByEmail(tx, "alice@example.com");
      expect(player).toEqual(
        expect.objectContaining({ name: "Alice", email: "Alice@Example.com" }),
      );
    });
  });

  it("returns null when email not found", async () => {
    await db.withinTransaction(async (tx) => {
      const player = await getPlayerByEmail(tx, "nobody@example.com");
      expect(player).toBeNull();
    });
  });
});

// ── getPlayerById ──────────────────────────────────────

describe("getPlayerById", () => {
  it("returns player when found", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "byid@example.com", "ById");
      const player = await getPlayerById(tx, id);
      expect(player).toEqual(
        expect.objectContaining({ id, name: "ById", email: "byid@example.com" }),
      );
    });
  });

  it("returns null when not found", async () => {
    await db.withinTransaction(async (tx) => {
      const player = await getPlayerById(tx, 999999);
      expect(player).toBeNull();
    });
  });
});

// ── updatePlayerProfile ────────────────────────────────

describe("updatePlayerProfile", () => {
  it("updates name and phone_number", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "update@example.com", "Old Name");
      await updatePlayerProfile(tx, id, {
        name: "New Name",
        phoneNumber: "+49 123",
      });
      const [row] = await tx`SELECT name, phone_number FROM player WHERE id = ${id}`;
      expect(row.name).toBe("New Name");
      expect(row.phone_number).toBe("+49 123");
    });
  });

  it("leaves other fields unchanged", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "keep@example.com", "Keep");
      await updatePlayerProfile(tx, id, { name: "Updated" });
      const [row] = await tx`SELECT name, email_address, bio FROM player WHERE id = ${id}`;
      expect(row.name).toBe("Updated");
      expect(row.email_address).toBe("keep@example.com");
      expect(row.bio).toBe("");
    });
  });
});

// ── createMagicLink + verifyMagicLink ──────────────────

describe("magic links", () => {
  it("creates and verifies a magic link", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "magic@example.com");
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await createMagicLink(tx, id, "token-abc", expires);

      const result = await verifyMagicLink(tx, "token-abc");
      expect(result).toEqual({ playerId: id });
    });
  });

  it("UPSERT replaces existing link for same player", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "upsert@example.com");
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await createMagicLink(tx, id, "token-first", expires);
      await createMagicLink(tx, id, "token-second", expires);

      // First token should no longer exist
      const first = await verifyMagicLink(tx, "token-first");
      expect(first).toBeNull();

      // Second token should work
      const second = await verifyMagicLink(tx, "token-second");
      expect(second).toEqual({ playerId: id });
    });
  });

  it("returns null for expired token", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "expired@example.com");
      const expired = new Date(Date.now() - 1000);
      await createMagicLink(tx, id, "token-expired", expired);

      const result = await verifyMagicLink(tx, "token-expired");
      expect(result).toBeNull();
    });
  });

  it("returns null for nonexistent token", async () => {
    await db.withinTransaction(async (tx) => {
      const result = await verifyMagicLink(tx, "does-not-exist");
      expect(result).toBeNull();
    });
  });

  it("returns null on second call (replay protection)", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "replay@example.com");
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await createMagicLink(tx, id, "token-replay", expires);

      const first = await verifyMagicLink(tx, "token-replay");
      expect(first).toEqual({ playerId: id });

      const second = await verifyMagicLink(tx, "token-replay");
      expect(second).toBeNull();
    });
  });
});

// ── Sessions ───────────────────────────────────────────

describe("sessions", () => {
  it("creates and retrieves a session", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "session@example.com");
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await createSession(tx, id, "sess-token", expires);

      const result = await getSessionByToken(tx, "sess-token");
      expect(result).toEqual({ playerId: id });
    });
  });

  it("returns null for expired session", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "sess-exp@example.com");
      const expired = new Date(Date.now() - 1000);
      await createSession(tx, id, "sess-expired", expired);

      const result = await getSessionByToken(tx, "sess-expired");
      expect(result).toBeNull();
    });
  });

  it("returns null for nonexistent token", async () => {
    await db.withinTransaction(async (tx) => {
      const result = await getSessionByToken(tx, "no-such-session");
      expect(result).toBeNull();
    });
  });

  it("delete removes the session", async () => {
    await db.withinTransaction(async (tx) => {
      const id = await seedPlayer(tx, "del-sess@example.com");
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await createSession(tx, id, "sess-delete", expires);

      await deleteSessionByToken(tx, "sess-delete");
      const result = await getSessionByToken(tx, "sess-delete");
      expect(result).toBeNull();
    });
  });
});
