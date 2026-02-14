import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  processImage,
  validateFileSize,
  ImageValidationError,
  MAX_DIMENSION,
} from "./image-processing";

// ── Helpers ───────────────────────────────────────────

async function createTestImage(
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp" | "gif" = "jpeg",
): Promise<Buffer> {
  const s = sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  });
  return s[format]().toBuffer();
}

// ── validateFileSize ──────────────────────────────────

describe("validateFileSize", () => {
  it("accepts files at the 10MB limit", () => {
    expect(() => validateFileSize(10 * 1024 * 1024)).not.toThrow();
  });

  it("rejects files over 10MB", () => {
    expect(() => validateFileSize(10 * 1024 * 1024 + 1)).toThrow(
      ImageValidationError,
    );
  });
});

// ── processImage ──────────────────────────────────────

describe("processImage", () => {
  it("accepts JPEG and converts to WebP", async () => {
    const input = await createTestImage(100, 100, "jpeg");
    const result = await processImage(input);

    expect(result.contentType).toBe("image/webp");
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.sizeBytes).toBe(result.data.byteLength);
    expect(result.data.byteLength).toBeGreaterThan(0);
  });

  it("accepts PNG", async () => {
    const input = await createTestImage(50, 50, "png");
    const result = await processImage(input);
    expect(result.contentType).toBe("image/webp");
  });

  it("accepts WebP", async () => {
    const input = await createTestImage(50, 50, "webp");
    const result = await processImage(input);
    expect(result.contentType).toBe("image/webp");
  });

  it("accepts GIF", async () => {
    const input = await createTestImage(50, 50, "gif");
    const result = await processImage(input);
    expect(result.contentType).toBe("image/webp");
  });

  it("rejects non-image data", async () => {
    const garbage = Buffer.from("this is not an image");
    await expect(processImage(garbage)).rejects.toThrow(ImageValidationError);
  });

  it("rejects unsupported formats (TIFF)", async () => {
    const tiff = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .tiff()
      .toBuffer();

    await expect(processImage(tiff)).rejects.toThrow(ImageValidationError);
  });

  it("resizes images larger than MAX_DIMENSION", async () => {
    const input = await createTestImage(1600, 1200, "jpeg");
    const result = await processImage(input);

    expect(result.width).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(result.height).toBeLessThanOrEqual(MAX_DIMENSION);
    // Aspect ratio preserved: 1600x1200 → 800x600
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("does not upscale small images", async () => {
    const input = await createTestImage(50, 30, "jpeg");
    const result = await processImage(input);
    expect(result.width).toBe(50);
    expect(result.height).toBe(30);
  });

  it("rejects oversized files before processing", async () => {
    // Create a buffer that exceeds 10MB
    const huge = Buffer.alloc(10 * 1024 * 1024 + 1);
    await expect(processImage(huge)).rejects.toThrow(ImageValidationError);
  });
});
