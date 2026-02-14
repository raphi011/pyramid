import sharp from "sharp";

const MAX_DIMENSION = 800;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export type ProcessedImage = {
  data: Buffer;
  contentType: string;
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

export function validateMimeType(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageValidationError(
      `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, GIF`,
    );
  }
}

export function validateFileSize(bytes: number): void {
  if (bytes > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      `File too large: ${Math.round(bytes / 1024 / 1024)}MB. Maximum: 10MB`,
    );
  }
}

export async function processImage(
  input: Buffer,
  mimeType: string,
): Promise<ProcessedImage> {
  validateMimeType(mimeType);
  validateFileSize(input.byteLength);

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
