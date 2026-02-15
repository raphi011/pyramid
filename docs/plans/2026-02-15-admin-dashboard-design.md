# Admin Club Dashboard Design (US-ADMIN-01)

## Scope

Dashboard overview page only — stats, active seasons, overdue matches, action buttons, invite link. Linked pages (member management, create season, announcements, club settings) are future stories.

## Route & Layout

- **Route**: `app/(main)/admin/club/[id]/page.tsx`
- Inside existing `(main)` layout — shares AppShell, sidebar, bottom nav
- Server component checks `getPlayerRole(sql, player.id, clubId)` — redirects to `/rankings` if not admin
- Desktop sidebar: "Admin" item via existing `adminItems` prop on `SidebarNav`
- Mobile: admin link from settings page or profile (no bottom nav change)

## Navigation Integration

- `(main)/layout.tsx` extended to detect admin clubs from `getPlayerClubs()` result (role = admin)
- `AppShellWrapper` receives `adminClubId` and conditionally passes `adminItems` to `AppShell`
- Admin sidebar item: shield icon, "Admin" label, href `/admin/club/[id]`

## Dashboard Sections

### 1. Quick Stats (3 cards in a row)

| Stat | Source |
|------|--------|
| Players | `COUNT(*) FROM club_members WHERE club_id = $id` |
| Active Seasons | `COUNT(*) FROM seasons WHERE club_id = $id AND status = 'active'` |
| Open Challenges | `COUNT(*) FROM season_matches sm JOIN seasons s ON ... WHERE s.club_id = $id AND sm.status IN ('challenged', 'date_set')` |

### 2. Active Seasons (list of cards)

Each card shows:
- Season name
- Player/team count (teams in standings)
- Open challenge count
- Overdue match warning badge (matches where `created + match_deadline_days < NOW()`)
- "Manage" link (→ `/admin/club/[id]/season/[seasonId]`, placeholder for now)

### 3. Overdue Matches (cards)

Matches past `match_deadline_days` without resolution:
- Both player names (avatar + name)
- Days since challenge created
- "Nudge" button (disabled — US-ADMIN-14)
- "Resolve" button (disabled — US-ADMIN-15)

Hidden if no overdue matches exist.

### 4. Actions (button grid)

- Manage members → `/admin/club/[id]/members` (placeholder)
- Create season → `/admin/club/[id]/season/new` (placeholder)
- Send announcement → `/admin/club/[id]/announcements` (placeholder)
- Club settings → `/admin/club/[id]/settings` (placeholder)

All navigate to future pages. For now, links work but pages show "Coming soon" or similar.

### 5. Invite Link

- Display `clubs.invite_code` in styled code display
- Copy button (copies join URL to clipboard)
- "Regenerate code" button (disabled — US-ADMIN-13)

## Data Layer

New functions in `app/lib/db/`:

```typescript
// club.ts additions
getClubStats(sql, clubId): Promise<{ playerCount, activeSeasonCount, openChallengeCount }>

// admin.ts (new file)
getActiveSeasonsWithStats(sql, clubId): Promise<AdminSeasonSummary[]>
getOverdueMatches(sql, clubId): Promise<OverdueMatch[]>
```

## Component Structure

```
app/(main)/admin/club/[id]/
  page.tsx                      # Server component: auth + data fetching
  admin-dashboard-view.tsx      # Client view: renders all sections

components/domain/
  stat-card.tsx                 # Reusable stat display (number + label + icon)
  season-admin-card.tsx         # Season summary for admin dashboard
  overdue-match-card.tsx        # Overdue match with nudge/resolve actions
```

## Translations

Add `admin` namespace to `messages/de.json` and `messages/en.json` for all admin-related strings.

## Storybook

Stories for:
- `StatCard` — default, various numbers
- `SeasonAdminCard` — with/without overdue, varying counts
- `OverdueMatchCard` — with player info
- `AdminDashboardView` — full dashboard with mock data
