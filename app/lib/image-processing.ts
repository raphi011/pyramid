import "server-only";
import sharp from "sharp";

export const MAX_DIMENSION = 800;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export type ProcessedImage = {
  data: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export function validateFileSize(bytes: number): void {
  if (bytes > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      `File too large: ${Math.round(bytes / 1024 / 1024)}MB. Maximum: 10MB`,
    );
  }
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  validateFileSize(input.byteLength);

  // Detect actual format from buffer content, not client-supplied MIME type
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new ImageValidationError("File does not appear to be a valid image");
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new ImageValidationError(
      `Unsupported image format: ${metadata.format ?? "unknown"}. Allowed: JPEG, PNG, WebP, GIF`,
    );
  }

  const processed = await sharp(input)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  return {
    data: processed.data,
    contentType: "image/webp",
    width: processed.info.width,
    height: processed.info.height,
    sizeBytes: processed.data.byteLength,
  };
}
