# Root-Level Club Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move club slugs to root-level URLs (`/utv-obersdorf` instead of `/club/utv-obersdorf`), nest admin and season routes under the club slug, add player slug support, and enforce reserved slug validation.

**Architecture:** Use Next.js dynamic `[slug]` segments at root level inside the `(main)` route group. Static routes (`feed/`, `admin/`, `settings/`, `profile/`) resolve before `[slug]`. Under `[slug]`, static `admin/` resolves before `[seasonSlug]`. Reserved slug validation is enforced at creation/update time in DB layer.

**Tech Stack:** Next.js 16 App Router, PostgreSQL, postgres.js, Zod

---

### Task 1: Add reserved slug validation module

**Files:**
- Create: `app/lib/reserved-slugs.ts`
- Test: `app/lib/reserved-slugs.test.ts`

**Step 1: Write the test**

```ts
// app/lib/reserved-slugs.test.ts
import { describe, it, expect } from "bun:test";
import { isReservedClubSlug, isReservedSeasonSlug } from "./reserved-slugs";

describe("isReservedClubSlug", () => {
  it("returns true for reserved root-level slugs", () => {
    expect(isReservedClubSlug("feed")).toBe(true);
    expect(isReservedClubSlug("admin")).toBe(true);
    expect(isReservedClubSlug("settings")).toBe(true);
    expect(isReservedClubSlug("profile")).toBe(true);
    expect(isReservedClubSlug("login")).toBe(true);
    expect(isReservedClubSlug("api")).toBe(true);
  });

  it("returns false for non-reserved slugs", () => {
    expect(isReservedClubSlug("utv-obersdorf")).toBe(false);
    expect(isReservedClubSlug("tc-musterstadt")).toBe(false);
  });
});

describe("isReservedSeasonSlug", () => {
  it("returns true for reserved club-level slugs", () => {
    expect(isReservedSeasonSlug("admin")).toBe(true);
  });

  it("returns false for non-reserved slugs", () => {
    expect(isReservedSeasonSlug("sommer-2025")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test app/lib/reserved-slugs.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```ts
// app/lib/reserved-slugs.ts
const RESERVED_CLUB_SLUGS = new Set([
  "feed",
  "admin",
  "settings",
  "profile",
  "login",
  "check-email",
  "join",
  "season",
  "onboarding",
  "api",
]);

const RESERVED_SEASON_SLUGS = new Set([
  "admin",
]);

export function isReservedClubSlug(slug: string): boolean {
  return RESERVED_CLUB_SLUGS.has(slug);
}

export function isReservedSeasonSlug(slug: string): boolean {
  return RESERVED_SEASON_SLUGS.has(slug);
}
```

**Step 4: Run test to verify it passes**

Run: `bun test app/lib/reserved-slugs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/reserved-slugs.ts app/lib/reserved-slugs.test.ts
git commit -m "feat: add reserved slug validation module"
```

---

### Task 2: Enforce reserved slugs in club create/update

**Files:**
- Modify: `app/lib/db/club.ts` — `createClub()` and `updateClub()`
- Modify: `app/lib/db/club.test.ts` — add reserved slug tests

**Step 1: Add a `ReservedSlugError` to `app/lib/db/errors.ts`**

Read `app/lib/db/errors.ts` first. Add:

```ts
export class ReservedSlugError extends Error {
  constructor() {
    super("Slug conflicts with reserved route");
    this.name = "ReservedSlugError";
  }
}
```

**Step 2: Add reserved slug check to `createClub()` and `updateClub()` in `app/lib/db/club.ts`**

Import `isReservedClubSlug` from `../reserved-slugs`. In both functions, after `const slug = slugify(name)`, add:

```ts
if (isReservedClubSlug(slug)) throw new ReservedSlugError();
```

**Step 3: Add tests to `app/lib/db/club.test.ts`**

Add tests that verify `createClub` and `updateClub` throw `ReservedSlugError` when the name slugifies to a reserved word (e.g., name `"Feed"` → slug `"feed"`).

**Step 4: Run tests**

Run: `bun run test:db`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/db/errors.ts app/lib/db/club.ts app/lib/db/club.test.ts
git commit -m "feat: reject reserved slugs on club create/update"
```

---

### Task 3: Enforce reserved slugs in season create/update

**Files:**
- Modify: `app/lib/db/season.ts` — `createSeason()` and `updateSeason()`

**Step 1: Add reserved slug check**

Import `isReservedSeasonSlug` from `../reserved-slugs` and `ReservedSlugError` from `./errors`. After slug generation, add:

```ts
if (isReservedSeasonSlug(slug)) throw new ReservedSlugError();
```

**Step 2: Run tests**

Run: `bun run test:db`
Expected: PASS

**Step 3: Commit**

```bash
git add app/lib/db/season.ts
git commit -m "feat: reject reserved slugs on season create/update"
```

---

### Task 4: Add player slug DB migration and queries

**Files:**
- Create: `db/migrations/NNN_add_player_slug.sql` (use next available number)
- Modify: `app/lib/db/auth.ts` — add slug field to queries, add `getPlayerBySlug()`, add `generateUniquePlayerSlug()`

**Step 1: Write migration**

```sql
ALTER TABLE player ADD COLUMN slug TEXT NOT NULL DEFAULT '';

-- Backfill existing players with slugified names
-- This is a best-effort backfill; collisions are handled by appending suffixes
-- Run the backfill via application code after migration

CREATE UNIQUE INDEX player_slug_unique ON player (slug) WHERE slug != '';
```

**Step 2: Add `getPlayerBySlug()` query to `app/lib/db/auth.ts`**

```ts
export async function getPlayerBySlug(
  sql: Sql,
  slug: string,
): Promise<{ id: number; firstName: string; lastName: string } | null> {
  const rows = await sql`
    SELECT id, first_name AS "firstName", last_name AS "lastName"
    FROM player WHERE slug = ${slug}
  `;
  return rows.length > 0 ? (rows[0] as { id: number; firstName: string; lastName: string }) : null;
}
```

**Step 3: Add `generateUniquePlayerSlug()` to `app/lib/db/auth.ts`**

```ts
import { slugify } from "../slug";

export async function generateUniquePlayerSlug(
  sql: Sql,
  firstName: string,
  lastName: string,
): Promise<string> {
  const base = slugify(`${firstName} ${lastName}`);
  // Check if base slug is available
  const [existing] = await sql`SELECT 1 FROM player WHERE slug = ${base}`;
  if (!existing) return base;

  // Find next available numeric suffix
  const rows = await sql`
    SELECT slug FROM player WHERE slug LIKE ${base + '-%'}
  `;
  const usedNumbers = new Set(
    rows
      .map((r) => {
        const suffix = (r.slug as string).slice(base.length + 1);
        return parseInt(suffix, 10);
      })
      .filter((n) => !isNaN(n)),
  );

  let n = 2;
  while (usedNumbers.has(n)) n++;
  return `${base}-${n}`;
}
```

**Step 4: Update `updatePlayerProfile()` to regenerate slug when name changes**

In the existing `updatePlayerProfile()` function, add slug regeneration. Generate the new slug via `generateUniquePlayerSlug()` and include it in the UPDATE.

**Step 5: Run migration and tests**

Run: `bun run db:migrate && bun run test:db`
Expected: PASS

**Step 6: Commit**

```bash
git add db/migrations/ app/lib/db/auth.ts
git commit -m "feat: add player slug column and generation"
```

---

### Task 5: Backfill player slugs in seed data

**Files:**
- Modify: `app/lib/db/seed.ts` — add slug generation for seeded players

**Step 1: Update seed to include player slugs**

In `seed.ts`, after players are created, generate slugs for each player using `generateUniquePlayerSlug()` and update them.

**Step 2: Test**

Run: `bun run db:reset && bun run db:seed`
Expected: Players have slug values

**Step 3: Commit**

```bash
git add app/lib/db/seed.ts
git commit -m "feat: generate player slugs in seed data"
```

---

### Task 6: Update `routes.ts`

**Files:**
- Modify: `app/lib/routes.ts`

**Step 1: Update route helpers**

```ts
export const routes = {
  club: (slug: string) => `/${slug}`,
  season: (clubSlug: string, seasonSlug: string) =>
    `/${clubSlug}/${seasonSlug}`,
  match: (clubSlug: string, seasonSlug: string, id: number) =>
    `/${clubSlug}/${seasonSlug}/matches/${id}`,
  player: (playerSlug: string) => `/profile/${playerSlug}`,
  admin: {
    club: (slug: string) => `/${slug}/admin`,
    settings: (slug: string) => `/${slug}/admin/settings`,
    members: (slug: string) => `/${slug}/admin/members`,
    announcements: (slug: string) => `/${slug}/admin/announcements`,
    newSeason: (slug: string) => `/${slug}/admin/new-season`,
    season: (clubSlug: string, seasonSlug: string) =>
      `/${clubSlug}/admin/${seasonSlug}`,
    teams: (clubSlug: string, seasonSlug: string) =>
      `/${clubSlug}/admin/${seasonSlug}/teams`,
  },
} as const;
```

**Step 2: Commit**

```bash
git add app/lib/routes.ts
git commit -m "refactor: update route helpers for root-level club routing"
```

---

### Task 7: Enrich event mapper and match actions with slug context

The `computeHref()` function in `event-mapper.ts` currently builds `/matches/${matchId}` but now needs `/${clubSlug}/${seasonSlug}/matches/${matchId}`. Similarly, match server actions use `revalidatePath("/matches/${matchId}")`.

**Files:**
- Modify: `app/lib/event-mapper.ts` — `computeHref()` needs club/season slugs
- Modify: `app/lib/db/event.ts` — enrich `EventRow` with `clubSlug` and `seasonSlug`
- Modify: `app/lib/actions/match.ts` — update `revalidatePath()` calls

**Step 1: Add `clubSlug` and `seasonSlug` to `EventRow`**

In `app/lib/db/event.ts`, add to `EventRow` type:
```ts
clubSlug: string;
seasonSlug: string | null;
```

Update the `EVENT_SELECT` SQL to include `c.slug AS "clubSlug"` and `s.slug AS "seasonSlug"` (the join to `clubs` may already exist via `club_id`; add join to `seasons` if needed).

**Step 2: Update `computeHref()` in `event-mapper.ts`**

```ts
function computeHref(row: EventRow): string | undefined {
  if (row.matchId && row.clubSlug && row.seasonSlug) {
    return routes.match(row.clubSlug, row.seasonSlug, row.matchId);
  }
  return undefined;
}
```

Import `routes` from `@/app/lib/routes`.

**Step 3: Update match actions `revalidatePath()` calls**

In `app/lib/actions/match.ts`, each action currently calls:
```ts
revalidatePath(`/matches/${matchId}`);
revalidatePath("/club", "layout");
```

The match object has `clubId` and `seasonId`. Look up club slug and season slug. Use `getClubSlug()` and add a `getSeasonSlug()` function. Then revalidate:
```ts
const clubSlug = await getClubSlug(sql, match.clubId);
const seasonSlug = await getSeasonSlug(sql, match.seasonId);
if (clubSlug && seasonSlug) {
  revalidatePath(routes.match(clubSlug, seasonSlug, matchId));
  revalidatePath(routes.season(clubSlug, seasonSlug));
}
```

**Step 4: Add `getSeasonSlug()` to `app/lib/db/season.ts`**

```ts
export async function getSeasonSlug(sql: Sql, seasonId: number): Promise<string | null> {
  const rows = await sql`SELECT slug FROM seasons WHERE id = ${seasonId}`;
  return rows.length > 0 ? (rows[0].slug as string) : null;
}
```

**Step 5: Run tests**

Run: `bun run test:db`
Expected: PASS

**Step 6: Commit**

```bash
git add app/lib/event-mapper.ts app/lib/db/event.ts app/lib/actions/match.ts app/lib/db/season.ts
git commit -m "feat: enrich event/match data with slug context for new routing"
```

---

### Task 8: Update remaining server actions

**Files:**
- Modify: `app/lib/actions/profile.ts` — update `revalidatePath` calls
- Modify: `app/lib/actions/enroll.ts` — update `revalidatePath` calls
- Modify: `app/lib/actions/challenge.ts` — update `revalidatePath` calls

**Step 1: Update `profile.ts`**

Replace `revalidatePath("/club", "layout")` with broader revalidation. Since the club pages are now under `[slug]`, use `revalidatePath("/", "layout")` or specific club paths.

**Step 2: Update `enroll.ts`**

`routes.rankings()` no longer exists — update to `routes.season()`:
```ts
revalidatePath(routes.season(clubSlug ?? "", season.slug));
```
Remove the `/club` layout revalidation.

**Step 3: Update `challenge.ts`**

Same as enroll — use `routes.season()`:
```ts
revalidatePath(routes.season(clubSlug ?? "", season.slug));
```

**Step 4: Run lint**

Run: `bun run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/actions/profile.ts app/lib/actions/enroll.ts app/lib/actions/challenge.ts
git commit -m "refactor: update server action revalidation paths for new routing"
```

---

### Task 9: Restructure file system — move route folders

This is the largest task. Move/create the new route folder structure.

**Files:**
- Create: `app/(main)/[slug]/page.tsx` — copy from `app/(main)/club/[slug]/page.tsx`, adjust imports
- Create: `app/(main)/[slug]/[seasonSlug]/page.tsx` — move from `app/(main)/club/[slug]/season/[seasonSlug]/rankings/page.tsx`
- Create: `app/(main)/[slug]/[seasonSlug]/matches/[id]/page.tsx` — move from `app/(main)/matches/[id]/page.tsx`
- Create: `app/(main)/[slug]/admin/page.tsx` — move from `app/(main)/admin/club/[slug]/page.tsx`
- Create: `app/(main)/[slug]/admin/settings/page.tsx` — move from `app/(main)/admin/club/[slug]/settings/page.tsx`
- Create: `app/(main)/[slug]/admin/members/page.tsx` — move from `app/(main)/admin/club/[slug]/members/page.tsx`
- Create: `app/(main)/[slug]/admin/announcements/page.tsx` — move from `app/(main)/admin/club/[slug]/announcements/page.tsx`
- Create: `app/(main)/[slug]/admin/new-season/page.tsx` — move from `app/(main)/admin/club/[slug]/season/new/page.tsx`
- Create: `app/(main)/[slug]/admin/[seasonSlug]/page.tsx` — move from `app/(main)/admin/club/[slug]/season/[seasonSlug]/page.tsx`
- Create: `app/(main)/[slug]/admin/[seasonSlug]/teams/page.tsx` — move from `app/(main)/admin/club/[slug]/season/[seasonSlug]/teams/page.tsx`
- Move: `app/(main)/admin/app/` → `app/(main)/admin/` (app admin becomes `/admin`)
- Create: `app/(main)/profile/[playerSlug]/page.tsx` — replaces `app/(main)/player/[id]/page.tsx`
- Delete: `app/(main)/club/` (old club routes)
- Delete: `app/(main)/admin/club/` (old admin club routes)
- Delete: `app/(main)/matches/` (old match routes)
- Delete: `app/(main)/player/` (old player routes)

**Important:** All view components (e.g., `club-detail-view.tsx`, `admin-dashboard-view.tsx`) and their colocated server actions stay alongside their page files — they move too.

**Step 1: Create new folder structure and move files**

Use `git mv` to move files and preserve history. The view components, server actions, and any other colocated files move with their pages.

**Step 2: Update all import paths in moved files**

Relative imports (`./club-detail-view`, `./actions`) will stay the same since view files move with pages. But `@/app/...` imports pointing to other moved files need updating.

**Step 3: Update page params**

The match detail page now receives `{ slug, seasonSlug, id }` instead of just `{ id }`. The rankings page receives `{ slug, seasonSlug }` instead of `{ slug, seasonSlug }` (same keys, different nesting). The player page receives `{ playerSlug }` instead of `{ id }`.

For the match detail page, add slug params and pass them to the view if needed for back-navigation links.

For the player profile page (`profile/[playerSlug]/page.tsx`), look up the player by slug via `getPlayerBySlug()` instead of numeric ID.

**Step 4: Update admin page server actions**

The colocated server actions in admin pages use `revalidatePath()` with old paths. Update all to use `routes.*` helpers.

Action files to update:
- `[slug]/admin/settings/actions.ts`
- `[slug]/admin/members/actions.ts`
- `[slug]/admin/announcements/actions.ts`
- `[slug]/admin/[seasonSlug]/actions.ts`
- `[slug]/admin/[seasonSlug]/teams/actions.ts`
- `[slug]/admin/new-season/actions.ts`

For each, replace hard-coded path strings with `routes.*` calls.

**Step 5: Move app admin**

Move `app/(main)/admin/app/page.tsx` → `app/(main)/admin/page.tsx` and its colocated files. Update `revalidatePath("/admin/app")` → `revalidatePath("/admin")` in its actions.

**Step 6: Verify build**

Run: `bun run build`
Expected: Build succeeds (may have TypeScript errors to fix)

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: restructure routes for root-level club slugs"
```

---

### Task 10: Update navigation components

**Files:**
- Modify: `components/club-nav-section.tsx`
- Modify: `components/sidebar-nav.tsx`
- Modify: `components/mobile-nav.tsx`

**Step 1: Update `club-nav-section.tsx`**

The season link currently uses `routes.rankings(club.slug, season.slug)`. Update to `routes.season(club.slug, season.slug)`.

**Step 2: Update sidebar and mobile nav**

Replace `"/admin/app"` with `"/admin"` in both `sidebar-nav.tsx` and `mobile-nav.tsx`.

**Step 3: Run lint and build**

Run: `bun run lint && bun run build`
Expected: PASS

**Step 4: Commit**

```bash
git add components/club-nav-section.tsx components/sidebar-nav.tsx components/mobile-nav.tsx
git commit -m "refactor: update navigation components for new route structure"
```

---

### Task 11: Update `app-shell-wrapper.tsx` and view components with hard-coded paths

**Files:**
- Modify: `app/(main)/app-shell-wrapper.tsx` — update match URL
- Modify: view components that use `router.push("/matches/...")` or `router.push("/player/...")`

**Step 1: Update `app-shell-wrapper.tsx`**

The FAB currently does `router.push(\`/matches/${activeMatchId}\`)`. This now needs club+season slugs. The layout already has the clubs data — pass club/season slug for the active match.

In `app/(main)/layout.tsx`, when determining `activeMatchId`, also capture the club slug and season slug. Pass `activeMatchHref` (the full route) instead of just `activeMatchId`.

**Step 2: Update profile/player view components**

Views like `profile-view.tsx` and `player-detail-view.tsx` that use `router.push(\`/matches/${matchId}\`)` need club+season context. The match data already includes the season context. Either:
- Pass club/season slugs as props to the view
- Or refactor to use `<Link>` with pre-computed hrefs passed from the server component

**Step 3: Run build**

Run: `bun run build`
Expected: PASS

**Step 4: Commit**

```bash
git add app/(main)/app-shell-wrapper.tsx app/(main)/layout.tsx
git commit -m "refactor: update app shell and view components for new match URLs"
```

---

### Task 12: Update app admin view

**Files:**
- Modify: the app admin view (now at `app/(main)/admin/app-admin-view.tsx`)

**Step 1: Update club links**

Replace `<Link href={\`/admin/club/${club.id}\`}>` with `<Link href={routes.admin.club(club.slug)}>`.

The admin view receives clubs by ID — ensure it also receives the slug. Check the page data loading.

**Step 2: Commit**

```bash
git add app/(main)/admin/
git commit -m "refactor: update app admin view for new routes"
```

---

### Task 13: Update proxy.ts

**Files:**
- Modify: `proxy.ts`

**Step 1: Review public routes**

The `PUBLIC_ROUTES` list doesn't need significant changes since auth routes stay the same. However, verify that the catch-all `[slug]` under `(main)` doesn't interfere — it shouldn't, since `(main)` layout redirects unauthenticated users.

No changes needed if all public routes are still under `(auth)` group or `/api`.

**Step 2: Commit (if changes needed)**

---

### Task 14: Update root page redirect

**Files:**
- Modify: `app/page.tsx`

**Step 1: Verify redirect target**

Currently redirects to `/feed`. This is still correct.

No changes needed.

---

### Task 15: Update Storybook stories

**Files:**
- Modify: All story files that reference old paths

Story files to update (update `activeHref`, `href`, import paths):
- `stories/composites/AppShell.stories.tsx`
- `stories/composites/SidebarNav.stories.tsx`
- `stories/composites/MobileNav.stories.tsx`
- `stories/pages/MatchDetail.stories.tsx` — update import from new location
- `stories/pages/Rankings.stories.tsx` — update import
- `stories/pages/ClubDetail.stories.tsx` — update import
- `stories/pages/ClubDashboard.stories.tsx` — update import + `activeHref`
- `stories/pages/CreateSeason.stories.tsx` — update import + `activeHref`
- `stories/pages/SeasonManagement.stories.tsx` — update import + `activeHref`
- `stories/pages/Announcements.stories.tsx` — update import + `activeHref`
- `stories/pages/TeamManagement.stories.tsx` — update import + `activeHref`
- `stories/pages/MemberManagement.stories.tsx` — update import + `activeHref`
- `stories/__fixtures__/events.ts` — update `href` values from `/matches/` and `/player/`

**Step 1: Update imports and paths**

For each story, update:
- Import paths from `@/app/(main)/admin/club/[slug]/...` → `@/app/(main)/[slug]/admin/...`
- Import paths from `@/app/(main)/club/[slug]/...` → `@/app/(main)/[slug]/...`
- `activeHref="/admin/club/1"` → `activeHref="/tc-musterstadt/admin"`
- Event fixture hrefs from `/matches/1` → `/<club>/<season>/matches/1`

**Step 2: Run Storybook tests**

Run: `bun run test:ci`
Expected: PASS

**Step 3: Commit**

```bash
git add stories/
git commit -m "refactor: update Storybook stories for new route structure"
```

---

### Task 16: Update onboarding to generate player slug

**Files:**
- Modify: `app/(auth)/onboarding/actions.ts`

**Step 1: Generate slug on onboarding**

After `updatePlayerProfile()`, call `generateUniquePlayerSlug()` and save it:

```ts
const slug = await generateUniquePlayerSlug(sql, firstName, lastName);
await sql`UPDATE player SET slug = ${slug} WHERE id = ${session.playerId}`;
```

**Step 2: Commit**

```bash
git add app/(auth)/onboarding/actions.ts
git commit -m "feat: generate player slug during onboarding"
```

---

### Task 17: Update profile action to regenerate slug on name change

**Files:**
- Modify: `app/lib/actions/profile.ts`

**Step 1: Regenerate slug when name changes**

In `updateProfileAction()`, after the profile update, regenerate the player slug:

```ts
const newSlug = await generateUniquePlayerSlug(sql, firstName, lastName);
await sql`UPDATE player SET slug = ${newSlug} WHERE id = ${player.id}`;
```

**Step 2: Commit**

```bash
git add app/lib/actions/profile.ts
git commit -m "feat: regenerate player slug on name change"
```

---

### Task 18: Update `not-found.tsx` for dynamic club slug

**Files:**
- Create: `app/(main)/[slug]/not-found.tsx` — 404 for invalid club slugs

**Step 1: Create club-specific not-found page**

The `[slug]` page.tsx should call `notFound()` when `getClubBySlug()` returns null. Add a `not-found.tsx` in the `[slug]` folder.

**Step 2: Commit**

```bash
git add app/(main)/[slug]/not-found.tsx
git commit -m "feat: add club-specific 404 page"
```

---

### Task 19: Final verification

**Step 1: Run full test suite**

```bash
bun run lint
bunx tsc --noEmit
bun run build
bun run test:db
bun run test:ci
```

**Step 2: Manual verification**

- Navigate to `/<club-slug>` — shows club detail
- Navigate to `/<club-slug>/<season-slug>` — shows season rankings
- Navigate to `/feed` — shows feed (not treated as club slug)
- Navigate to `/admin` — shows app admin
- Navigate to `/settings` — shows settings
- Navigate to `/nonexistent-club` — shows 404
- Navigate to `/<club-slug>/admin` — shows club admin
- Navigate to `/profile/<player-slug>` — shows player profile

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: final adjustments for root-level routing"
```
