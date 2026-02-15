# Admin Club Dashboard (US-ADMIN-01) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the club admin dashboard page at `/admin/club/[id]` with stats, active seasons, overdue matches, action buttons, and invite link section.

**Architecture:** Server component fetches data + checks admin role, passes to a client view component. Three new admin data-layer queries in a new `admin.ts` file. Navigation integration via existing `adminItems` prop on `AppShell`. Most UI components already exist (`StatBlock`, `Card`, `PageLayout`, `ClubJoinCard`).

**Tech Stack:** Next.js 16 App Router, postgres.js, next-intl, Heroicons, Tailwind CSS

**Existing assets:**
- `stories/pages/ClubDashboard.stories.tsx` — Storybook prototype of the exact design
- `components/stat-block.tsx` — stat display component
- `components/page-layout.tsx` — page title/subtitle layout
- `components/domain/club-join-card.tsx` — invite code display (admin mode)
- `components/qr-code.tsx` — QR code component
- `stories/pages/_page-wrapper.tsx` — already has `isAdmin` prop + `ShieldCheckIcon` admin nav
- `nav.manageClub` — translation key already exists in both locales

---

### Task 1: Add admin data-layer queries

**Files:**
- Create: `app/lib/db/admin.ts`

**Step 1: Create `app/lib/db/admin.ts` with three query functions**

```typescript
import type { Sql } from "../db";

// ── Types ──────────────────────────────────────────────

export type ClubStats = {
  playerCount: number;
  activeSeasonCount: number;
  openChallengeCount: number;
};

export type AdminSeasonSummary = {
  id: number;
  name: string;
  playerCount: number;
  openChallengeCount: number;
  overdueMatchCount: number;
};

export type OverdueMatch = {
  id: number;
  seasonId: number;
  player1Name: string;
  player2Name: string;
  daysSinceCreated: number;
};

// ── Queries ────────────────────────────────────────────

export async function getClubStats(
  sql: Sql,
  clubId: number,
): Promise<ClubStats> {
  const [row] = await sql`
    SELECT
      (SELECT COUNT(*) FROM club_members WHERE club_id = ${clubId})::int AS "playerCount",
      (SELECT COUNT(*) FROM seasons WHERE club_id = ${clubId} AND status = 'active')::int AS "activeSeasonCount",
      (SELECT COUNT(*) FROM season_matches sm
       JOIN seasons s ON s.id = sm.season_id
       WHERE s.club_id = ${clubId} AND sm.status IN ('challenged', 'date_set'))::int AS "openChallengeCount"
  `;

  return row as ClubStats;
}

export async function getActiveSeasonsWithStats(
  sql: Sql,
  clubId: number,
): Promise<AdminSeasonSummary[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.name,
      COALESCE(array_length(
        (SELECT results FROM season_standings WHERE season_id = s.id ORDER BY id DESC LIMIT 1),
        1
      ), 0)::int AS "playerCount",
      (SELECT COUNT(*) FROM season_matches
       WHERE season_id = s.id AND status IN ('challenged', 'date_set'))::int AS "openChallengeCount",
      (SELECT COUNT(*) FROM season_matches
       WHERE season_id = s.id
         AND status IN ('challenged', 'date_set')
         AND created < NOW() - (s.match_deadline_days || ' days')::interval)::int AS "overdueMatchCount"
    FROM seasons s
    WHERE s.club_id = ${clubId} AND s.status = 'active'
    ORDER BY s.created DESC
  `;

  return rows as AdminSeasonSummary[];
}

export async function getOverdueMatches(
  sql: Sql,
  clubId: number,
): Promise<OverdueMatch[]> {
  const rows = await sql`
    SELECT
      sm.id,
      sm.season_id AS "seasonId",
      CONCAT(p1.first_name, ' ', p1.last_name) AS "player1Name",
      CONCAT(p2.first_name, ' ', p2.last_name) AS "player2Name",
      EXTRACT(DAY FROM NOW() - sm.created)::int AS "daysSinceCreated"
    FROM season_matches sm
    JOIN seasons s ON s.id = sm.season_id
    JOIN teams t1 ON t1.id = sm.team1_id
    JOIN team_players tp1 ON tp1.team_id = t1.id
    JOIN player p1 ON p1.id = tp1.player_id
    JOIN teams t2 ON t2.id = sm.team2_id
    JOIN team_players tp2 ON tp2.team_id = t2.id
    JOIN player p2 ON p2.id = tp2.player_id
    WHERE s.club_id = ${clubId}
      AND sm.status IN ('challenged', 'date_set')
      AND sm.created < NOW() - (s.match_deadline_days || ' days')::interval
    ORDER BY sm.created ASC
  `;

  return rows as OverdueMatch[];
}
```

**Step 2: Commit**

```
feat: add admin data-layer queries for club dashboard
```

---

### Task 2: Add DB integration tests for admin queries

**Files:**
- Create: `app/lib/db/admin.test.ts`
- Modify: `app/lib/db/seed.ts` (add optional `created` param to `seedMatch`)

**Step 1: Extend `seedMatch` in `seed.ts` to accept optional `created` param**

In `app/lib/db/seed.ts`, add `created?: Date` to the options object of `seedMatch` and use it instead of `NOW()` when provided:

```typescript
export async function seedMatch(
  tx: Tx,
  seasonId: number,
  team1Id: number,
  team2Id: number,
  {
    status = "completed",
    winnerTeamId,
    resultEnteredBy,
    team1Score,
    team2Score,
    gameAt,
    created,  // NEW
  }: {
    status?: string;
    winnerTeamId?: number;
    resultEnteredBy?: number;
    team1Score?: number[];
    team2Score?: number[];
    gameAt?: Date;
    created?: Date;  // NEW
  } = {},
): Promise<number> {
  const [row] = created
    ? await tx`
        INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, result_entered_by, team1_score, team2_score, game_at, status, created)
        VALUES (${seasonId}, ${team1Id}, ${team2Id}, ${winnerTeamId ?? null}, ${resultEnteredBy ?? null}, ${team1Score ?? null}, ${team2Score ?? null}, ${gameAt ?? null}, ${status}, ${created})
        RETURNING id
      `
    : await tx`
        INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, result_entered_by, team1_score, team2_score, game_at, status, created)
        VALUES (${seasonId}, ${team1Id}, ${team2Id}, ${winnerTeamId ?? null}, ${resultEnteredBy ?? null}, ${team1Score ?? null}, ${team2Score ?? null}, ${gameAt ?? null}, ${status}, NOW())
        RETURNING id
      `;
  return row.id as number;
}
```

**Step 2: Write `admin.test.ts`**

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedClubMember,
  seedSeason,
  seedTeam,
  seedMatch,
  seedStandings,
} from "./seed";
import {
  getClubStats,
  getActiveSeasonsWithStats,
  getOverdueMatches,
} from "./admin";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getClubStats ─────────────────────────────────────

describe("getClubStats", () => {
  it("returns zeroes for empty club", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const stats = await getClubStats(tx, clubId);
      expect(stats).toEqual({
        playerCount: 0,
        activeSeasonCount: 0,
        openChallengeCount: 0,
      });
    });
  });

  it("counts players, active seasons, and open challenges", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "s1@test.com");
      const p2 = await seedPlayer(tx, "s2@test.com");
      const p3 = await seedPlayer(tx, "s3@test.com");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);
      await seedClubMember(tx, p3, clubId);

      const season = await seedSeason(tx, clubId, { status: "active" });
      await seedSeason(tx, clubId, { status: "ended" }); // should not count

      const t1 = await seedTeam(tx, season, [p1]);
      const t2 = await seedTeam(tx, season, [p2]);
      await seedMatch(tx, season, t1, t2, { status: "challenged" });
      await seedMatch(tx, season, t1, t2, { status: "completed" }); // should not count

      const stats = await getClubStats(tx, clubId);
      expect(stats).toEqual({
        playerCount: 3,
        activeSeasonCount: 1,
        openChallengeCount: 1,
      });
    });
  });
});

// ── getActiveSeasonsWithStats ────────────────────────

describe("getActiveSeasonsWithStats", () => {
  it("returns empty array when no active seasons", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const result = await getActiveSeasonsWithStats(tx, clubId);
      expect(result).toEqual([]);
    });
  });

  it("returns season with player count and challenge stats", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "as1@test.com");
      const p2 = await seedPlayer(tx, "as2@test.com");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const season = await seedSeason(tx, clubId, {
        name: "Summer 2026",
        status: "active",
      });
      const t1 = await seedTeam(tx, season, [p1]);
      const t2 = await seedTeam(tx, season, [p2]);
      await seedStandings(tx, season, [t1, t2]);
      await seedMatch(tx, season, t1, t2, { status: "challenged" });

      const result = await getActiveSeasonsWithStats(tx, clubId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "Summer 2026",
          playerCount: 2,
          openChallengeCount: 1,
          overdueMatchCount: 0,
        }),
      );
    });
  });

  it("counts overdue matches correctly", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "od1@test.com");
      const p2 = await seedPlayer(tx, "od2@test.com");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const season = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, season, [p1]);
      const t2 = await seedTeam(tx, season, [p2]);
      await seedStandings(tx, season, [t1, t2]);

      // Overdue match (created 30 days ago, deadline is 14 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await seedMatch(tx, season, t1, t2, {
        status: "challenged",
        created: thirtyDaysAgo,
      });

      const result = await getActiveSeasonsWithStats(tx, clubId);
      expect(result[0].overdueMatchCount).toBe(1);
    });
  });
});

// ── getOverdueMatches ────────────────────────────────

describe("getOverdueMatches", () => {
  it("returns empty array when no overdue matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const result = await getOverdueMatches(tx, clubId);
      expect(result).toEqual([]);
    });
  });

  it("returns overdue match with player names and day count", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "om1@test.com", "Felix", "Wagner");
      const p2 = await seedPlayer(tx, "om2@test.com", "Paul", "Becker");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const season = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, season, [p1]);
      const t2 = await seedTeam(tx, season, [p2]);

      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      await seedMatch(tx, season, t1, t2, {
        status: "challenged",
        created: twentyDaysAgo,
      });

      const result = await getOverdueMatches(tx, clubId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          player1Name: "Felix Wagner",
          player2Name: "Paul Becker",
        }),
      );
      expect(result[0].daysSinceCreated).toBeGreaterThanOrEqual(19);
    });
  });

  it("does not return non-overdue matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const p1 = await seedPlayer(tx, "nm1@test.com");
      const p2 = await seedPlayer(tx, "nm2@test.com");
      await seedClubMember(tx, p1, clubId);
      await seedClubMember(tx, p2, clubId);

      const season = await seedSeason(tx, clubId, { status: "active" });
      const t1 = await seedTeam(tx, season, [p1]);
      const t2 = await seedTeam(tx, season, [p2]);

      // Recent match (not overdue)
      await seedMatch(tx, season, t1, t2, { status: "challenged" });

      const result = await getOverdueMatches(tx, clubId);
      expect(result).toEqual([]);
    });
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `bun run test:db -- --run`
Expected: All admin tests pass.

**Step 4: Commit**

```
test: add DB integration tests for admin dashboard queries
```

---

### Task 3: Add admin translations

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`

**Step 1: Add `adminDashboard` namespace to both locale files**

Add after the `"settings"` block in both files:

**`de.json`:**
```json
"adminDashboard": {
  "title": "Club verwalten",
  "players": "Spieler",
  "seasons": "Saisons",
  "openChallenges": "Offene Spiele",
  "activeSeasons": "Aktive Saisons",
  "noActiveSeasons": "Keine aktiven Saisons",
  "noActiveSeasonsDesc": "Erstelle eine neue Saison, um loszulegen.",
  "playerCount": "{count, plural, one {# Spieler} other {# Spieler}}",
  "matchCount": "{count, plural, one {# Spiel} other {# Spiele}}",
  "overdueCount": "{count, plural, one {# \u00fcberf\u00e4llig} other {# \u00fcberf\u00e4llig}}",
  "manage": "Verwalten",
  "overdueMatches": "\u00dcberf\u00e4llige Spiele",
  "daysOverdue": "{days, plural, one {# Tag \u00fcberf\u00e4llig} other {# Tage \u00fcberf\u00e4llig}}",
  "nudge": "Erinnern",
  "resolve": "L\u00f6sen",
  "actions": "Aktionen",
  "manageMembers": "Mitglieder verwalten",
  "createSeason": "Saison erstellen",
  "sendAnnouncement": "Ank\u00fcndigung senden",
  "clubSettings": "Club-Einstellungen",
  "accessDenied": "Kein Zugriff",
  "accessDeniedDesc": "Du hast keine Adminrechte f\u00fcr diesen Club."
}
```

**`en.json`:**
```json
"adminDashboard": {
  "title": "Manage club",
  "players": "Players",
  "seasons": "Seasons",
  "openChallenges": "Open challenges",
  "activeSeasons": "Active seasons",
  "noActiveSeasons": "No active seasons",
  "noActiveSeasonsDesc": "Create a new season to get started.",
  "playerCount": "{count, plural, one {# player} other {# players}}",
  "matchCount": "{count, plural, one {# match} other {# matches}}",
  "overdueCount": "{count} overdue",
  "manage": "Manage",
  "overdueMatches": "Overdue matches",
  "daysOverdue": "{days, plural, one {# day overdue} other {# days overdue}}",
  "nudge": "Nudge",
  "resolve": "Resolve",
  "actions": "Actions",
  "manageMembers": "Manage members",
  "createSeason": "Create season",
  "sendAnnouncement": "Send announcement",
  "clubSettings": "Club settings",
  "accessDenied": "Access denied",
  "accessDeniedDesc": "You don't have admin permissions for this club."
}
```

**Step 2: Commit**

```
feat: add admin dashboard translations (de/en)
```

---

### Task 4: Create admin dashboard view component

**Files:**
- Create: `app/(main)/admin/club/[id]/admin-dashboard-view.tsx`

**Step 1: Create the client view component**

This closely follows the Storybook prototype in `stories/pages/ClubDashboard.stories.tsx` but uses translations and real prop types.

```typescript
"use client";

import { useTranslations } from "next-intl";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { StatBlock } from "@/components/stat-block";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubJoinCard } from "@/components/domain/club-join-card";
import { QRCode } from "@/components/qr-code";
import type { ClubStats, AdminSeasonSummary, OverdueMatch } from "@/lib/db/admin";

type AdminDashboardViewProps = {
  clubId: number;
  clubName: string;
  inviteCode: string;
  stats: ClubStats;
  seasons: AdminSeasonSummary[];
  overdueMatches: OverdueMatch[];
};

export function AdminDashboardView({
  clubId,
  clubName,
  inviteCode,
  stats,
  seasons,
  overdueMatches,
}: AdminDashboardViewProps) {
  const t = useTranslations("adminDashboard");

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PageLayout title={t("title")} subtitle={clubName}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="mt-0">
            <StatBlock label={t("players")} value={stats.playerCount} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="mt-0">
            <StatBlock label={t("seasons")} value={stats.activeSeasonCount} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="mt-0">
            <StatBlock
              label={t("openChallenges")}
              value={stats.openChallengeCount}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active seasons */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activeSeasons")}</CardTitle>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("noActiveSeasonsDesc")}
            </p>
          ) : (
            <div className="space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {season.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {t("playerCount", { count: season.playerCount })}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {t("matchCount", { count: season.openChallengeCount })}
                      </span>
                      {season.overdueMatchCount > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="text-red-600 dark:text-red-400">
                            {t("overdueCount", {
                              count: season.overdueMatchCount,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    {t("manage")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue matches */}
      {overdueMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("overdueMatches")}</CardTitle>
            <CardAction>
              <Badge variant="loss">{overdueMatches.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/30"
                >
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="size-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {m.player1Name} vs {m.player2Name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {t("daysOverdue", { days: m.daysSinceCreated })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>
                      {t("nudge")}
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      {t("resolve")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="justify-start" disabled>
              <UserGroupIcon className="size-5" />
              {t("manageMembers")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <CalendarDaysIcon className="size-5" />
              {t("createSeason")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <MegaphoneIcon className="size-5" />
              {t("sendAnnouncement")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Cog6ToothIcon className="size-5" />
              {t("clubSettings")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite section */}
      <ClubJoinCard
        mode="admin"
        clubCode={inviteCode}
        onCopy={() => navigator.clipboard.writeText(inviteCode)}
        qrSlot={
          appUrl ? (
            <QRCode
              value={`${appUrl}/join?code=${inviteCode}`}
              size="md"
            />
          ) : undefined
        }
      />
    </PageLayout>
  );
}
```

**Step 2: Commit**

```
feat: add admin dashboard view component
```

---

### Task 5: Create admin dashboard server page

**Files:**
- Create: `app/(main)/admin/club/[id]/page.tsx`

**Step 1: Create server component with auth check and data fetching**

```typescript
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getPlayerRole, getClubById } from "@/lib/db/club";
import {
  getClubStats,
  getActiveSeasonsWithStats,
  getOverdueMatches,
} from "@/lib/db/admin";
import { sql } from "@/lib/db";
import { AdminDashboardView } from "./admin-dashboard-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { id } = await params;
  const clubId = Number(id);

  if (Number.isNaN(clubId)) {
    redirect("/rankings");
  }

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") {
    redirect("/rankings");
  }

  const club = await getClubById(sql, clubId);
  if (!club) {
    redirect("/rankings");
  }

  const [stats, seasons, overdueMatches] = await Promise.all([
    getClubStats(sql, clubId),
    getActiveSeasonsWithStats(sql, clubId),
    getOverdueMatches(sql, clubId),
  ]);

  return (
    <AdminDashboardView
      clubId={clubId}
      clubName={club.name}
      inviteCode={club.inviteCode}
      stats={stats}
      seasons={seasons}
      overdueMatches={overdueMatches}
    />
  );
}
```

**Step 2: Commit**

```
feat: add admin dashboard server page with auth check
```

---

### Task 6: Integrate admin navigation into app shell

**Files:**
- Modify: `app/(main)/layout.tsx`
- Modify: `app/(main)/app-shell-wrapper.tsx`

**Step 1: Pass admin club info from layout to wrapper**

In `app/(main)/layout.tsx`, find the first club where role = admin and pass it:

After `const clubs = await getPlayerClubs(sql, player.id);` add:
```typescript
const adminClub = clubs.find((c) => c.role === "admin");
```

Pass it to `AppShellWrapper`:
```tsx
<AppShellWrapper
  player={...}
  clubs={...}
  activeMatchId={activeMatchId}
  unreadCount={unreadCount}
  adminClubId={adminClub ? adminClub.clubId : null}
>
```

**Step 2: Update `AppShellWrapper` to accept `adminClubId` and render admin nav**

In `app/(main)/app-shell-wrapper.tsx`:

Add `adminClubId: number | null` to props type. Add `ShieldCheckIcon` import. Conditionally build `adminItems`:

```typescript
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

// In props type:
adminClubId: number | null;

// Inside component, after sidebarItems:
const adminItems = adminClubId
  ? [
      {
        icon: <ShieldCheckIcon />,
        label: t("manageClub"),
        href: `/admin/club/${adminClubId}`,
      },
    ]
  : undefined;
```

Pass `adminItems` to `<AppShell>`.

**Step 3: Commit**

```
feat: add admin navigation item to sidebar for club admins
```

---

### Task 7: Verify full flow and update Storybook story

**Files:**
- Modify: `stories/pages/ClubDashboard.stories.tsx` (update to use real view component)

**Step 1: Run dev server and verify manually**

Run: `bun run dev`
- Navigate to `/admin/club/[id]` as an admin user
- Verify stats, seasons, overdue matches, actions, invite link render
- Verify non-admins get redirected
- Verify admin nav item appears in sidebar

**Step 2: Update ClubDashboard story to use the real view component**

Replace the inline component in `stories/pages/ClubDashboard.stories.tsx` with:

```typescript
import { AdminDashboardView } from "@/app/(main)/admin/club/[id]/admin-dashboard-view";
```

And update the stories to pass real mock data props to `AdminDashboardView`.

**Step 3: Run lint and type check**

Run: `bun run lint && bunx tsc --noEmit`
Expected: No errors.

**Step 4: Run Storybook tests**

Run: `bun run test:ci`
Expected: All tests pass.

**Step 5: Commit**

```
feat: update ClubDashboard story to use real view component
```

---

### Task 8: Final verification and mark US-ADMIN-01 as done

**Step 1: Run all test suites**

Run: `bun run test:db -- --run && bun run lint && bunx tsc --noEmit`
Expected: All pass.

**Step 2: Mark user story as done**

In `docs/user-stories.mdx`, update the index table row for US-ADMIN-01 to add `Done` checkmark.

**Step 3: Commit**

```
docs: mark US-ADMIN-01 as done
```
