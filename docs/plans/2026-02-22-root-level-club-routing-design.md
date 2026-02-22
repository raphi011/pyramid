# Root-Level Club Routing Design

## Goal

Move club slugs to the root URL level. `/utv-obersdorf` loads the club instead of `/club/utv-obersdorf`. Static reserved paths (`/feed`, `/admin`, `/settings`, `/profile`) take priority. Club and season slugs that collide with reserved words are rejected at creation time.

## URL Mapping

| Purpose | Old URL | New URL |
|---|---|---|
| Feed | `/feed` | `/feed` |
| App admin | `/admin/app` | `/admin` |
| Settings | `/settings` | `/settings` |
| Player profile | `/player/[id]` | `/profile/[playerSlug]` |
| Club detail | `/club/[slug]` | `/[slug]` |
| Season overview | `/club/[slug]/season/[seasonSlug]/rankings` | `/[slug]/[seasonSlug]` |
| Match detail | `/matches/[id]` | `/[slug]/[seasonSlug]/matches/[id]` |
| Club admin dashboard | `/admin/club/[slug]` | `/[slug]/admin` |
| Club admin settings | `/admin/club/[slug]/settings` | `/[slug]/admin/settings` |
| Club admin members | `/admin/club/[slug]/members` | `/[slug]/admin/members` |
| Club admin announcements | `/admin/club/[slug]/announcements` | `/[slug]/admin/announcements` |
| Club admin season | `/admin/club/[slug]/season/[seasonSlug]` | `/[slug]/admin/[seasonSlug]` |
| Club admin season teams | `/admin/club/[slug]/season/[seasonSlug]/teams` | `/[slug]/admin/[seasonSlug]/teams` |
| New season | `/admin/club/[slug]/season/new` | `/[slug]/admin/new-season` |

## Approach

Use Next.js `[slug]` dynamic segments at root level. Next.js resolves static routes before dynamic ones, so `/feed` always wins over `[slug]`. Same principle applies under `[slug]` — `admin/` is a static folder resolved before `[seasonSlug]`.

## File System Structure

```
app/(main)/
  feed/page.tsx                              # /feed (reserved)
  admin/page.tsx                             # /admin (reserved, app admin)
  settings/page.tsx                          # /settings (reserved)
  profile/[playerSlug]/page.tsx              # /profile/max-mustermann (reserved)
  [slug]/                                    # club slug (dynamic)
    page.tsx                                 # /utv-obersdorf (club detail)
    admin/                                   # /utv-obersdorf/admin (static)
      page.tsx                               # club admin dashboard
      settings/page.tsx
      members/page.tsx
      announcements/page.tsx
      new-season/page.tsx
      [seasonSlug]/                          # /utv-obersdorf/admin/sommer-2025
        page.tsx
        teams/page.tsx
    [seasonSlug]/                            # /utv-obersdorf/sommer-2025
      page.tsx                               # season overview (rankings)
      matches/[id]/page.tsx                  # match detail
```

## Reserved Slug Lists

### Root-level (club slugs cannot be these)

`feed`, `admin`, `settings`, `profile`, `login`, `check-email`, `join`, `season`, `onboarding`, `api`

### Club-level (season slugs cannot be these)

`admin`

Enforcement: reject in `createClub`/`updateClub` and `createSeason`/`updateSeason`. Export as constants from `app/lib/reserved-slugs.ts`.

## Player Slugs

- Add `slug` column to `player` table (TEXT NOT NULL DEFAULT '')
- Generate on name set (onboarding): `slugify(firstName + " " + lastName)`
- Dedup with numeric suffix: `max-mustermann`, `max-mustermann-2`
- Update when player name changes

## routes.ts

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

## Proxy Updates

Update `proxy.ts` PUBLIC_ROUTES — the existing list stays valid since auth routes (`/login`, `/join`, etc.) are unchanged. The `[slug]` pages are protected by the `(main)` layout's auth check.

## Migration Notes

- Delete old route folders: `app/(main)/club/`, `app/(main)/admin/club/`, `app/(main)/matches/`, `app/(main)/player/`
- Move `app/(main)/admin/app/` to `app/(main)/admin/page.tsx`
- Update all `revalidatePath()` calls in server actions
- Update all `redirect()` calls
- Update navigation components (sidebar, mobile nav) to use new `routes.*` helpers
- DB migration: add `player.slug` column, backfill from existing names
