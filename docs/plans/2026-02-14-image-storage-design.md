# Image Storage Design

## Goal

Move image storage from inline `BYTEA` columns to a dedicated `images` table with a storage abstraction layer (Postgres now, S3-compatible later). Support images for: player avatars, club logos, match photos. Prepare for future comment image uploads.

## Database Schema

### New `images` table

```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data BYTEA NOT NULL,
    content_type TEXT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    size_bytes INT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

UUID PK so image IDs in public URLs (`/api/images/{uuid}`) are unguessable.

### Modified tables

- `player`: drop `photo_data BYTEA`, add `image_id UUID REFERENCES images(id)`
- `clubs`: drop `logo_data BYTEA`, add `image_id UUID REFERENCES images(id)`
- `season_matches`: add `image_id UUID REFERENCES images(id)`

No migration — edit `001_initial_schema.sql` directly and `db:reset`.

## API Endpoints

### `GET /api/images/[id]`

- Looks up image by UUID
- Returns raw bytes with `Content-Type` and `Cache-Control: public, max-age=86400`
- 404 if not found
- No auth required (UUIDs are unguessable)

### `POST /api/images`

- Accepts `multipart/form-data` with single file field
- Validates: JPEG/PNG/WebP/GIF, max 10MB raw upload
- Resizes via `sharp` to max 800x800 (aspect ratio preserved), outputs WebP
- Stores in `images` table
- Returns `{ id: uuid }`
- Auth required (session check)

## Storage Abstraction

```typescript
// app/lib/image-storage.ts
interface ImageStorage {
  store(file: Buffer, contentType: string): Promise<StoredImage>;
  get(id: string): Promise<StoredImage | null>;
  delete(id: string): Promise<void>;
}

type StoredImage = {
  id: string;
  data: Buffer;
  contentType: string;
  width: number;
  height: number;
  sizeBytes: number;
};
```

Ship `PostgresImageStorage`. Add `S3ImageStorage` later by implementing the same interface.

## Image Processing

- Dependency: `sharp`
- Pipeline: validate MIME → resize to fit 800x800 → convert to WebP → store
- Metadata (width, height, size_bytes) stored alongside for future use

## Client Integration

- Helper: `imageUrl(imageId: string | null): string | null` → `/api/images/${imageId}` or `null`
- `Avatar` component already accepts `src?: string | null` — pass image URL directly
- Profile edit, club settings, match detail get file upload fields

## Scope

### This PR

- Edit `001_initial_schema.sql`: add `images` table, swap BYTEA→FK on player/clubs, add FK on season_matches
- `ImageStorage` interface + `PostgresImageStorage`
- `sharp` dependency
- `POST /api/images` (upload + resize)
- `GET /api/images/[id]` (serve)
- Wire profile photo upload in profile edit form
- Wire club logo upload in club settings
- Wire match photo upload in match detail
- Update avatar/logo rendering to use new image URLs
- Update `docs/database.mdx` and `docs/user-stories.md`

### Future (user story only)

**US-COMMENT-IMG: Upload image in match comment**

Precondition: User is a participant in the match.

Flow:
1. User writes a comment on a match → taps image icon → file picker opens
2. Selects image → uploaded via `POST /api/images`, returns UUID
3. Comment stored with image reference (new `image_id` FK on `match_comments`)
4. Comment displays inline image thumbnail, tappable to view full-size

Edge cases:
- Upload fails → show error toast, comment text preserved
- Image too large → client shows size error before upload
- Multiple images → not supported in v1, one image per comment
