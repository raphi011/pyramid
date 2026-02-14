import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./db/test-helpers";
import { seedPlayer } from "./db/seed";
import { postgresImageStorage } from "./image-storage";
import type { ProcessedImage } from "./image-processing";

const db = withTestDb();

afterAll(() => db.cleanup());

function makeImage(overrides: Partial<ProcessedImage> = {}): ProcessedImage {
  return {
    data: Buffer.from([0x52, 0x49, 0x46, 0x46]), // minimal bytes
    contentType: "image/webp",
    width: 100,
    height: 100,
    sizeBytes: 4,
    ...overrides,
  };
}

// ── store + get round-trip ────────────────────────────

describe("postgresImageStorage", () => {
  it("stores and retrieves an image with all fields intact", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "img@example.com");
      const image = makeImage();
      const id = await postgresImageStorage.store(tx, image, playerId);

      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      const stored = await postgresImageStorage.get(tx, id);
      expect(stored).not.toBeNull();
      expect(stored!.id).toBe(id);
      expect(Buffer.compare(stored!.data, image.data)).toBe(0);
      expect(stored!.contentType).toBe("image/webp");
      expect(stored!.width).toBe(100);
      expect(stored!.height).toBe(100);
      expect(stored!.sizeBytes).toBe(4);
    });
  });

  it("returns null for nonexistent UUID", async () => {
    await db.withinTransaction(async (tx) => {
      const stored = await postgresImageStorage.get(
        tx,
        "00000000-0000-0000-0000-000000000000",
      );
      expect(stored).toBeNull();
    });
  });

  // ── delete ──────────────────────────────────────────

  it("deletes an image so get returns null", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "del@example.com");
      const id = await postgresImageStorage.store(tx, makeImage(), playerId);

      await postgresImageStorage.delete(tx, id);

      const stored = await postgresImageStorage.get(tx, id);
      expect(stored).toBeNull();
    });
  });

  it("delete is idempotent for nonexistent image", async () => {
    await db.withinTransaction(async (tx) => {
      await expect(
        postgresImageStorage.delete(tx, "00000000-0000-0000-0000-000000000000"),
      ).resolves.toBeUndefined();
    });
  });

  // ── isOwnedBy ──────────────────────────────────────

  it("isOwnedBy returns true for the uploader", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "owner@example.com");
      const id = await postgresImageStorage.store(tx, makeImage(), playerId);

      expect(await postgresImageStorage.isOwnedBy(tx, id, playerId)).toBe(true);
    });
  });

  it("isOwnedBy returns false for a different player", async () => {
    await db.withinTransaction(async (tx) => {
      const uploader = await seedPlayer(tx, "uploader@example.com");
      const other = await seedPlayer(tx, "other@example.com");
      const id = await postgresImageStorage.store(tx, makeImage(), uploader);

      expect(await postgresImageStorage.isOwnedBy(tx, id, other)).toBe(false);
    });
  });

  it("isOwnedBy returns false for nonexistent image", async () => {
    await db.withinTransaction(async (tx) => {
      const playerId = await seedPlayer(tx, "nobody@example.com");
      expect(
        await postgresImageStorage.isOwnedBy(
          tx,
          "00000000-0000-0000-0000-000000000000",
          playerId,
        ),
      ).toBe(false);
    });
  });
});
