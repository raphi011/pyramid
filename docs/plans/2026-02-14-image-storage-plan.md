# Image Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move image storage to a dedicated `images` table with a storage abstraction layer, wire up profile photo upload, and thread avatar URLs through all existing views.

**Architecture:** New `images` table with UUID PK stores processed image bytes. An `ImageStorage` interface abstracts DB vs S3. `sharp` handles server-side resize to WebP. Two API routes handle upload and serving. Existing `avatarSrc` props on domain components get wired up via a new `image_id` FK on `player`/`clubs`/`season_matches`.

**Tech Stack:** sharp (image processing), Next.js API routes, postgres.js, existing component library

---

### Task 1: Update database schema

**Files:**
- Modify: `db/migrations/001_initial_schema.sql`
- Modify: `db/seed.ts`

**Step 1: Add images table and update FKs in schema**

Edit `db/migrations/001_initial_schema.sql`:

1. Add new `images` table BEFORE the `clubs` table (since `clubs` will reference it):

```sql
-----------------------------------------------
-- 0. images
-----------------------------------------------
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

2. In `clubs` table: replace `logo_data BYTEA,` with `image_id UUID REFERENCES images(id),`

3. In `player` table: replace `photo_data BYTEA,` with `image_id UUID REFERENCES images(id),`

4. In `season_matches` table: add `image_id UUID REFERENCES images(id),` after the `game_at` column

**Step 2: Update seed.ts delete order**

In `db/seed.ts`, add `await tx\`DELETE FROM images\`;` after the `DELETE FROM player` line (images has no FKs pointing to it, so delete last).

**Step 3: Run db:reset**

```bash
bun run db:reset
```

Expected: Clean schema recreated with `images` table.

**Step 4: Run db:seed**

```bash
bun run db:seed
```

Expected: Seed completes successfully (no image data seeded, `image_id` columns are NULL).

**Step 5: Commit**

```bash
git add db/migrations/001_initial_schema.sql db/seed.ts
git commit -m "feat: add images table, replace BYTEA columns with image_id FK"
```

---

### Task 2: Install sharp and create image processing utility

**Files:**
- Create: `app/lib/image-processing.ts`

**Step 1: Install sharp**

```bash
bun add sharp && bun add -D @types/sharp
```

**Step 2: Create image processing module**

Create `app/lib/image-processing.ts`:

```typescript
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
```

**Step 3: Commit**

```bash
git add app/lib/image-processing.ts package.json bun.lock
git commit -m "feat: add sharp dependency and image processing utility"
```

---

### Task 3: Create ImageStorage interface and Postgres implementation

**Files:**
- Create: `app/lib/image-storage.ts`

**Step 1: Write the image storage module**

Create `app/lib/image-storage.ts`:

```typescript
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
```

Note: passing `sql` as a parameter follows the existing repo pattern (all DB functions accept `Sql | TransactionSql`).

**Step 2: Commit**

```bash
git add app/lib/image-storage.ts
git commit -m "feat: add ImageStorage interface with Postgres implementation"
```

---

### Task 4: Create GET /api/images/[id] endpoint

**Files:**
- Create: `app/api/images/[id]/route.ts`

**Step 1: Create the image serving route**

Create `app/api/images/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { postgresImageStorage } from "@/app/lib/image-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Basic UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const image = await postgresImageStorage.get(sql, id);
  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(image.data, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(image.sizeBytes),
    },
  });
}
```

**Step 2: Commit**

```bash
git add app/api/images/[id]/route.ts
git commit -m "feat: add GET /api/images/[id] endpoint to serve images"
```

---

### Task 5: Create POST /api/images endpoint

**Files:**
- Create: `app/api/images/route.ts`

**Step 1: Create the image upload route**

Create `app/api/images/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { processImage, ImageValidationError } from "@/app/lib/image-processing";
import { postgresImageStorage } from "@/app/lib/image-storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer, file.type);
    const id = await postgresImageStorage.store(sql, processed);

    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof ImageValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Image upload failed:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/images/route.ts
git commit -m "feat: add POST /api/images endpoint with resize and validation"
```

---

### Task 6: Thread image_id through player queries and profile

**Files:**
- Modify: `app/lib/db/auth.ts` — add `imageId` to `PlayerProfile` type and `getPlayerProfile` query
- Modify: `app/lib/actions/profile.ts` — add `updateProfileImage` action
- Modify: `app/(main)/profile/page.tsx` — pass `avatarSrc` to view
- Modify: `app/(main)/profile/profile-view.tsx` — add photo upload to edit dialog

**Step 1: Update PlayerProfile type and query**

In `app/lib/db/auth.ts`:

1. Add `imageId: string | null;` to the `PlayerProfile` type.

2. In `getPlayerProfile`, add `image_id AS "imageId"` to the SELECT and include it in the return object:

```typescript
export type PlayerProfile = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  bio: string;
  imageId: string | null;
  unavailableFrom: Date | null;
  unavailableUntil: Date | null;
};
```

Update the query:
```sql
SELECT
  id,
  name,
  email_address AS "email",
  phone_number AS "phoneNumber",
  bio,
  image_id::text AS "imageId",
  unavailable_from AS "unavailableFrom",
  unavailable_until AS "unavailableUntil"
FROM player
WHERE id = ${playerId}
```

And include `imageId: (row.imageId as string) ?? null` in the return.

**Step 2: Add updatePlayerImage DB function**

In `app/lib/db/auth.ts`, add:

```typescript
export async function updatePlayerImage(
  sql: Sql,
  playerId: number,
  imageId: string | null,
): Promise<number> {
  const result = await sql`
    UPDATE player
    SET image_id = ${imageId}
    WHERE id = ${playerId}
  `;
  return result.count;
}
```

**Step 3: Add updateProfileImageAction server action**

In `app/lib/actions/profile.ts`, add:

```typescript
import { updatePlayerImage } from "@/app/lib/db/auth";

export async function updateProfileImageAction(
  imageId: string | null,
): Promise<ProfileResult> {
  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "profile.error.notAuthenticated" };
  }

  try {
    await updatePlayerImage(sql, player.id, imageId);
  } catch (e) {
    console.error("updateProfileImageAction failed:", e);
    return { error: "profile.error.serverError" };
  }

  revalidatePath("/profile");
  revalidatePath("/rankings");

  return { success: true };
}
```

**Step 4: Pass avatarSrc in profile page**

In `app/(main)/profile/page.tsx`, import `imageUrl` from `@/app/lib/image-storage` and add to the ProfileView props:

```typescript
import { imageUrl } from "@/app/lib/image-storage";

// In the return:
<ProfileView
  profile={profile}
  avatarSrc={imageUrl(profile.imageId)}
  // ... rest of props unchanged
/>
```

**Step 5: Add photo upload to profile-view.tsx**

In `app/(main)/profile/profile-view.tsx`:

1. Add `avatarSrc: string | null;` to `ProfileViewProps`.

2. Add `updateProfileImageAction` import.

3. Pass `avatarSrc` to the `PlayerProfile` component:
```tsx
<PlayerProfile
  name={profile.name}
  avatarSrc={avatarSrc}
  // ... other props
/>
```

4. Add an avatar upload section in the edit dialog (before the name field). This uses a hidden file input + a button that triggers it:

```tsx
// State for image upload
const [isUploading, setIsUploading] = useState(false);

const handleImageUpload = useCallback(
  async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/images", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? t("error.serverError"));
        return;
      }
      const { id } = await res.json();
      const result = await updateProfileImageAction(id);
      if ("error" in result) {
        setEditError(t(`error.${result.error.split(".").pop()}`));
      } else {
        router.refresh();
      }
    } catch {
      setEditError(t("error.serverError"));
    } finally {
      setIsUploading(false);
    }
  },
  [t, router],
);
```

Add in the edit dialog form, before the name FormField:

```tsx
<div className="flex flex-col items-center gap-2">
  <Avatar name={profile.name} src={avatarSrc} size="xl" />
  <label className="cursor-pointer text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400">
    {isUploading ? t("uploading") : t("changePhoto")}
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={handleImageUpload}
      disabled={isUploading || isPending}
    />
  </label>
</div>
```

**Step 6: Add translations**

Check `messages/de.json` and `messages/en.json` for the `profile` namespace and add:
- `"changePhoto"`: `"Foto ändern"` / `"Change photo"`
- `"uploading"`: `"Wird hochgeladen…"` / `"Uploading…"`

**Step 7: Commit**

```bash
git add app/lib/db/auth.ts app/lib/actions/profile.ts app/(main)/profile/page.tsx app/(main)/profile/profile-view.tsx messages/
git commit -m "feat: wire up profile photo upload with image storage"
```

---

### Task 7: Thread image_id through standings and rankings

**Files:**
- Modify: `app/lib/db/season.ts` — add `imageId` to `RankedPlayer`, update query
- Modify: `app/(main)/rankings/page.tsx` — pass `avatarSrc` through to pyramid/standings players
- Modify: `app/(main)/player/[id]/page.tsx` — pass `avatarSrc` if player page exists

**Step 1: Update RankedPlayer and getStandingsWithPlayers**

In `app/lib/db/season.ts`:

1. Add `imageId: string | null;` to `RankedPlayer`.

2. In `getStandingsWithPlayers`, update the batch query to include `image_id`:

```sql
SELECT
  t.id AS "teamId",
  p.id AS "playerId",
  p.name,
  p.image_id::text AS "imageId"
FROM teams t
JOIN team_players tp ON tp.team_id = t.id
JOIN player p ON p.id = tp.player_id
WHERE t.id = ANY(${currentResults})
```

3. Update the `teamMap` to store `imageId`:
```typescript
teamMap.set(teamId, {
  playerId: row.playerId as number,
  name: row.name as string,
  imageId: (row.imageId as string) ?? null,
});
```

4. Include in the `players.push(...)`:
```typescript
players.push({
  teamId,
  playerId: info.playerId,
  name: info.name,
  imageId: info.imageId,
  rank: i + 1,
});
```

**Step 2: Pass avatarSrc in rankings page**

In `app/(main)/rankings/page.tsx`, import `imageUrl` and add `avatarSrc` to both `pyramidPlayers` and `standingsPlayers` mappings:

```typescript
import { imageUrl } from "@/app/lib/image-storage";

// In pyramidPlayers map:
return {
  // ... existing fields
  avatarSrc: imageUrl(p.imageId),
};

// In standingsPlayers map:
return {
  // ... existing fields
  avatarSrc: imageUrl(p.imageId),
};
```

**Step 3: Commit**

```bash
git add app/lib/db/season.ts app/(main)/rankings/page.tsx
git commit -m "feat: thread avatarSrc through standings and rankings views"
```

---

### Task 8: Add match photo support

**Files:**
- Modify: `app/lib/db/match.ts` — add `imageId` to `MatchDetail` type, update `getMatchById`
- Modify: `app/lib/actions/match.ts` — add `uploadMatchImageAction`
- Modify: `app/(main)/matches/[id]/page.tsx` — pass image data
- Modify: `app/(main)/matches/[id]/match-detail-view.tsx` — add image display and upload

**Step 1: Update MatchDetail type and getMatchById**

In `app/lib/db/match.ts`:

1. Add `imageId: string | null;` to `MatchDetail` type.

2. In `getMatchById`, add `sm.image_id::text AS "imageId"` to the SELECT and include it in the return mapping.

**Step 2: Add updateMatchImage DB function**

In `app/lib/db/match.ts`, add:

```typescript
export async function updateMatchImage(
  sql: Sql,
  matchId: number,
  imageId: string | null,
): Promise<number> {
  const result = await sql`
    UPDATE season_matches
    SET image_id = ${imageId}
    WHERE id = ${matchId}
  `;
  return result.count;
}
```

**Step 3: Add uploadMatchImageAction server action**

In `app/lib/actions/match.ts`, add:

```typescript
import { updateMatchImage } from "@/app/lib/db/match";

export async function uploadMatchImageAction(
  matchId: number,
  imageId: string | null,
): Promise<MatchActionResult> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "matchDetail.error.notParticipant" };

  const match = await getMatchById(sql, matchId);
  if (!match) return { error: "matchDetail.error.notFound" };

  // Must be a participant
  const isTeam1 = player.id === match.team1PlayerId;
  const isTeam2 = player.id === match.team2PlayerId;
  if (!isTeam1 && !isTeam2) {
    return { error: "matchDetail.error.notParticipant" };
  }

  try {
    await updateMatchImage(sql, matchId, imageId);
  } catch (e) {
    console.error("uploadMatchImageAction failed:", e);
    return { error: "matchDetail.error.serverError" };
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
```

**Step 4: Pass imageId in match detail page**

In `app/(main)/matches/[id]/page.tsx`, import `imageUrl` and pass it to `MatchDetailView`:

```typescript
import { imageUrl } from "@/app/lib/image-storage";

// In the match prop:
imageId: match.imageId,
imageSrc: imageUrl(match.imageId),
```

**Step 5: Update MatchDetailView**

In `app/(main)/matches/[id]/match-detail-view.tsx`:

1. Add `imageId: string | null;` and `imageSrc: string | null;` to `SerializedMatch`.

2. Import `uploadMatchImageAction`.

3. Add an image section after the match header card (before score). Show the match image if present, or an upload button if participant:

```tsx
{/* Match Photo */}
{(match.imageSrc || isParticipant) && (
  <Card>
    <CardHeader>
      <CardTitle>{t("matchPhoto")}</CardTitle>
    </CardHeader>
    <CardContent>
      {match.imageSrc ? (
        <img
          src={match.imageSrc}
          alt={t("matchPhoto")}
          className="w-full rounded-xl object-cover"
        />
      ) : null}
      {isParticipant && (
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-court-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-court-400 dark:hover:bg-slate-700">
          {t("uploadPhoto")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleMatchImageUpload}
            disabled={isPending}
          />
        </label>
      )}
    </CardContent>
  </Card>
)}
```

4. Add the upload handler (similar pattern to profile):

```tsx
const handleMatchImageUpload = useCallback(
  async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/images", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? t("error.serverError"));
          return;
        }
        const { id } = await res.json();
        const result = await uploadMatchImageAction(match.id, id);
        if ("error" in result) {
          setError(t(`error.${result.error.split(".").pop()}`));
        }
      } catch {
        setError(t("error.serverError"));
      }
    });
  },
  [match.id, t],
);
```

**Step 6: Add translations**

Add to `matchDetail` namespace:
- `"matchPhoto"`: `"Matchfoto"` / `"Match photo"`
- `"uploadPhoto"`: `"Foto hochladen"` / `"Upload photo"`

**Step 7: Commit**

```bash
git add app/lib/db/match.ts app/lib/actions/match.ts app/(main)/matches/[id]/page.tsx app/(main)/matches/[id]/match-detail-view.tsx messages/
git commit -m "feat: add match photo upload and display"
```

---

### Task 9: Update docs

**Files:**
- Modify: `docs/database.mdx` — update player/clubs/season_matches schema, add images table
- Modify: `docs/user-stories.md` — update US-PROF-03, add US-COMMENT-IMG

**Step 1: Update database.mdx**

Key changes:
- Add `images` table documentation with column descriptions
- Update `player` table: replace `photo_data BYTEA` with `image_id UUID REFERENCES images(id)`
- Update `clubs` table: replace `logo_data BYTEA` with `image_id UUID REFERENCES images(id)`
- Update `season_matches` table: add `image_id UUID REFERENCES images(id)`
- Update the "Avatar Serving" section to describe the new `/api/images/{uuid}` pattern instead of `/api/players/[id]/avatar`

**Step 2: Update user-stories.md**

1. Update US-PROF-03 to reference `image_id` and `POST /api/images` instead of direct `photo_data` BYTEA storage.

2. Add US-COMMENT-IMG user story at the end (from the design doc):

```markdown
### US-COMMENT-IMG: Upload image in match comment

**Precondition:** User is a participant in the match.

**Flow:**
1. User writes a comment on a match → taps image icon → file picker opens
2. Selects image → uploaded via `POST /api/images`, returns UUID
3. Comment stored with image reference (new `image_id` FK on `match_comments`)
4. Comment displays inline image thumbnail, tappable to view full-size

**Edge cases:**
- Upload fails → show error toast, comment text preserved
- Image too large → client shows size error before upload
- Multiple images → not supported in v1, one image per comment
```

**Step 3: Commit**

```bash
git add docs/database.mdx docs/user-stories.md
git commit -m "docs: update schema docs and user stories for image storage"
```

---

### Task 10: Verify and test end-to-end

**Step 1: Reset and seed the database**

```bash
bun run db:reset && bun run db:seed
```

**Step 2: Run lint**

```bash
bun run lint
```

**Step 3: Start dev server and test manually**

```bash
bun run dev
```

Test:
- Login → profile → edit → upload photo → verify avatar appears
- Navigate to rankings → verify avatars render (initials for players without photos)
- Navigate to match detail → upload match photo → verify it displays

**Step 4: Run existing tests**

```bash
bun run test:db
```

Ensure no regressions from schema changes.

**Step 5: Build check**

```bash
bun run build
```

Ensure no TypeScript/build errors.
