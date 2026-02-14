import type postgres from "postgres";
import type { ProcessedImage } from "./image-processing";

type Sql = postgres.Sql | postgres.TransactionSql;

export type StoredImage = ProcessedImage & {
  id: string;
};

export interface ImageStorage {
  store(sql: Sql, image: ProcessedImage): Promise<string>;
  get(sql: Sql, id: string): Promise<StoredImage | null>;
  delete(sql: Sql, id: string): Promise<void>;
}

export const postgresImageStorage: ImageStorage = {
  async store(sql: Sql, image: ProcessedImage): Promise<string> {
    const [row] = await sql`
      INSERT INTO images (data, content_type, width, height, size_bytes)
      VALUES (${image.data}, ${image.contentType}, ${image.width}, ${image.height}, ${image.sizeBytes})
      RETURNING id
    `;
    return row.id as string;
  },

  async get(sql: Sql, id: string): Promise<StoredImage | null> {
    const rows = await sql`
      SELECT id, data, content_type AS "contentType", width, height, size_bytes AS "sizeBytes"
      FROM images
      WHERE id = ${id}
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id as string,
      data: row.data as Buffer,
      contentType: row.contentType as string,
      width: row.width as number,
      height: row.height as number,
      sizeBytes: row.sizeBytes as number,
    };
  },

  async delete(sql: Sql, id: string): Promise<void> {
    await sql`DELETE FROM images WHERE id = ${id}`;
  },
};

export function imageUrl(imageId: string | null | undefined): string | null {
  if (!imageId) return null;
  return `/api/images/${imageId}`;
}
