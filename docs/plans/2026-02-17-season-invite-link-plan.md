# Season Invite Link Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow club admins to share a link/QR code for a season; anyone with the link can join the season (new user, existing player, or authenticated member) — with OG meta tags for messenger previews.

**Architecture:** New `invite_code` column on `seasons` table. New `/season/join` public route with a client-side state machine (modeled after the existing `/join` club flow). Admin sees a share card on the season management page. QR code generated client-side with `qrcode.react`.

**Tech Stack:** Next.js 16 App Router, postgres.js, Zod, next-intl, qrcode.react

---

### Task 1: Database Migration — Add `invite_code` to seasons

**Files:**
- Create: `db/migrations/002_add_season_invite_code.sql`
- Modify: `app/lib/db/seed.ts` (add `inviteCode` param to `seedSeason`)

**Step 1: Write the migration**

```sql
ALTER TABLE seasons ADD COLUMN invite_code TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX seasons_invite_code_unique
  ON seasons (invite_code) WHERE invite_code != '';
```

Partial unique index: excludes empty string so existing rows don't conflict. New seasons will get a generated code.

**Step 2: Run migration**

Run: `bun run db:migrate`
Expected: Migration 002 applied successfully

**Step 3: Update seed helper**

In `app/lib/db/seed.ts`, add `inviteCode` to `seedSeason` params and INSERT:

```typescript
export async function seedSeason(
  tx: Tx,
  clubId: number,
  {
    name = "Test Season",
    status = "active",
    minTeamSize = 1,
    maxTeamSize = 1,
    matchDeadlineDays = 14,
    openEnrollment = true,
    visibility = "club",
    inviteCode = "",
  }: {
    name?: string;
    status?: string;
    minTeamSize?: number;
    maxTeamSize?: number;
    matchDeadlineDays?: number;
    openEnrollment?: boolean;
    visibility?: string;
    inviteCode?: string;
  } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO seasons (club_id, name, status, min_team_size, max_team_size, match_deadline_days, open_enrollment, visibility, invite_code, created)
    VALUES (${clubId}, ${name}, ${status}, ${minTeamSize}, ${maxTeamSize}, ${matchDeadlineDays}, ${openEnrollment}, ${visibility}, ${inviteCode}, NOW())
    RETURNING id
  `;
  return row.id as number;
}
```

**Step 4: Commit**

```bash
git add db/migrations/002_add_season_invite_code.sql app/lib/db/seed.ts
git commit -m "feat: add invite_code column to seasons table"
```

---

### Task 2: Invite Code Generation + Season Repo

**Files:**
- Modify: `app/lib/auth.ts` (add `generateInviteCode`)
- Modify: `app/lib/db/season.ts` (add `inviteCode` to Season type, add `getSeasonByInviteCode` query)
- Modify: `app/(main)/admin/club/[id]/season/new/actions.ts` (generate invite code on season creation)

**Step 1: Write failing test for `getSeasonByInviteCode`**

In `app/lib/db/season.test.ts`, add:

```typescript
import { getSeasonByInviteCode } from "./season";

describe("getSeasonByInviteCode", () => {
  it("returns season with club info when invite code matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx, { name: "My Club" });
      const seasonId = await seedSeason(tx, clubId, {
        name: "Spring 2026",
        inviteCode: "ABC123",
        status: "active",
        openEnrollment: true,
      });
      const result = await getSeasonByInviteCode(tx, "ABC123");
      expect(result).not.toBeNull();
      expect(result!.id).toBe(seasonId);
      expect(result!.name).toBe("Spring 2026");
      expect(result!.clubName).toBe("My Club");
      expect(result!.clubId).toBe(clubId);
    });
  });

  it("returns null for non-existent code", async () => {
    await db.withinTransaction(async (tx) => {
      const result = await getSeasonByInviteCode(tx, "ZZZZZ1");
      expect(result).toBeNull();
    });
  });

  it("returns null for empty invite code", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      await seedSeason(tx, clubId, { inviteCode: "" });
      const result = await getSeasonByInviteCode(tx, "");
      expect(result).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test:db -- --reporter=verbose -t "getSeasonByInviteCode"`
Expected: FAIL — `getSeasonByInviteCode` not found

**Step 3: Add `generateInviteCode` to `app/lib/auth.ts`**

After the existing `generateToken` function (line 17):

```typescript
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
```

**Step 4: Add `inviteCode` to Season type and add `getSeasonByInviteCode` in `app/lib/db/season.ts`**

Add `inviteCode: string` to the `Season` type (after `visibility`).

Update `toSeason` to include: `inviteCode: (row.inviteCode as string) ?? "",`

Add `invite_code AS "inviteCode"` to ALL existing queries that select from seasons (`getActiveSeasons`, `getSeasonById`, `getClubSeasons`).

Add new type and query:

```typescript
export type SeasonWithClub = Season & {
  clubName: string;
  clubImageId: string | null;
};

export async function getSeasonByInviteCode(
  sql: Sql,
  code: string,
): Promise<SeasonWithClub | null> {
  if (!code) return null;

  const rows = await sql`
    SELECT
      s.id,
      s.club_id AS "clubId",
      s.name,
      s.status,
      s.min_team_size AS "minTeamSize",
      s.max_team_size AS "maxTeamSize",
      s.best_of AS "bestOf",
      s.match_deadline_days AS "matchDeadlineDays",
      s.reminder_after_days AS "reminderAfterDays",
      s.requires_result_confirmation AS "requiresResultConfirmation",
      s.open_enrollment AS "openEnrollment",
      s.visibility,
      s.invite_code AS "inviteCode",
      s.previous_season_id AS "previousSeasonId",
      s.started_at AS "startedAt",
      s.ended_at AS "endedAt",
      c.name AS "clubName",
      c.image_id::text AS "clubImageId"
    FROM seasons s
    JOIN clubs c ON c.id = s.club_id
    WHERE s.invite_code = ${code}
  `;

  if (rows.length === 0) return null;

  return {
    ...toSeason(rows[0]),
    clubName: rows[0].clubName as string,
    clubImageId: (rows[0].clubImageId as string) ?? null,
  };
}
```

**Step 5: Run test to verify it passes**

Run: `bun run test:db -- --reporter=verbose -t "getSeasonByInviteCode"`
Expected: PASS

**Step 6: Generate invite code on season creation**

In `app/(main)/admin/club/[id]/season/new/actions.ts`:

1. Add import: `import { generateInviteCode } from "@/app/lib/auth";`
2. In the INSERT statement (line 106-120), add `invite_code` column and value:

```sql
INSERT INTO seasons (
  club_id, name, min_team_size, max_team_size, best_of,
  match_deadline_days, reminder_after_days,
  requires_result_confirmation, open_enrollment,
  invite_code, status, created
)
VALUES (
  ${clubId}, ${name}, ${minTeamSize}, ${maxTeamSize}, ${bestOf},
  ${matchDeadlineDays}, ${reminderDays},
  ${requiresConfirmation}, ${openEnrollment},
  ${generateInviteCode()}, 'draft', NOW()
)
RETURNING id
```

**Step 7: Run lint + type check**

Run: `bun run lint && bunx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add app/lib/auth.ts app/lib/db/season.ts app/lib/db/season.test.ts app/(main)/admin/club/[id]/season/new/actions.ts
git commit -m "feat: add invite code generation and season lookup by code"
```

---

### Task 3: Public Route + Season Join Page (Server Component)

**Files:**
- Modify: `proxy.ts` (add `/season` to PUBLIC_ROUTES)
- Create: `app/(auth)/season/join/page.tsx` (server component with `generateMetadata`)

**Step 1: Add `/season` to PUBLIC_ROUTES in `proxy.ts`**

In `proxy.ts:4-10`, add `"/season"` to the PUBLIC_ROUTES array:

```typescript
const PUBLIC_ROUTES = [
  "/login",
  "/check-email",
  "/join",
  "/season",
  "/api/auth",
  "/api/images",
];
```

**Step 2: Create the server page with OG metadata**

Create `app/(auth)/season/join/page.tsx`:

```typescript
import type { Metadata } from "next";
import { sql } from "@/app/lib/db";
import { getSeasonByInviteCode } from "@/app/lib/db/season";
import { SeasonJoinFlow } from "./season-join-flow";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { code } = await searchParams;
  if (!code) {
    return { title: "Saison beitreten" };
  }

  const season = await getSeasonByInviteCode(sql, code);
  if (!season) {
    return { title: "Saison beitreten" };
  }

  const imageUrl = season.clubImageId
    ? `/api/images/${season.clubImageId}`
    : undefined;

  return {
    title: `${season.name} beitreten`,
    description: `${season.clubName} \u2014 Tritt der Saison bei`,
    openGraph: {
      title: `${season.name} beitreten`,
      description: `${season.clubName} \u2014 Tritt der Saison bei`,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  };
}

export default async function SeasonJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return <SeasonJoinFlow initialCode={code} />;
}
```

**Step 3: Commit**

```bash
git add proxy.ts app/\(auth\)/season/join/page.tsx
git commit -m "feat: add season join public route with OG metadata"
```

---

### Task 4: Season Join Flow — Client State Machine + Actions

**Files:**
- Create: `app/(auth)/season/join/actions.ts`
- Create: `app/(auth)/season/join/season-join-flow.tsx`

**Step 1: Create server actions**

Create `app/(auth)/season/join/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
  getSession,
  getCurrentPlayer,
  createMagicLink,
  getPlayerByEmail,
} from "@/app/lib/auth";
import {
  getSeasonByInviteCode,
  isPlayerEnrolledInSeason,
  isIndividualSeason,
  enrollPlayerInIndividualSeason,
  addTeamToStandings,
  createNewPlayerEvent,
} from "@/app/lib/db/season";
import { isClubMember, joinClub } from "@/app/lib/db/club";
import { sendMagicLinkEmail } from "@/app/lib/email";
import { sql } from "@/app/lib/db";
import { fullName } from "@/lib/utils";
import { parseFormData } from "@/app/lib/action-utils";

// ── Types ──────────────────────────────────────────────

export type SeasonJoinStep =
  | "loading"
  | "season-info"
  | "guest-form"
  | "check-email"
  | "already-enrolled"
  | "error";

export type SeasonJoinState = {
  step: SeasonJoinStep;
  seasonName?: string;
  clubName?: string;
  inviteCode?: string;
  error?: string;
};

// ── Schemas ──────────────────────────────────────────────

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

const joinSeasonSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

const guestJoinSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

// ── Actions ──────────────────────────────────────────────

class AlreadyEnrolledError extends Error {}

/** Validate invite code and determine which step to show */
export async function validateSeasonCode(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(codeSchema, formData);
  if (!parsed.success) {
    return { step: "error", error: "seasonJoin.invalidCode" };
  }
  const { code } = parsed.data;

  try {
    const season = await getSeasonByInviteCode(sql, code);

    if (!season) {
      return { step: "error", error: "seasonJoin.codeNotFound" };
    }

    if (season.status !== "active") {
      return { step: "error", error: "seasonJoin.seasonNotActive" };
    }

    if (!season.openEnrollment) {
      return { step: "error", error: "seasonJoin.enrollmentClosed" };
    }

    const session = await getSession();

    if (session) {
      // Check if already enrolled
      if (await isPlayerEnrolledInSeason(sql, session.playerId, season.id)) {
        return {
          step: "already-enrolled",
          seasonName: season.name,
          clubName: season.clubName,
          inviteCode: code,
        };
      }

      return {
        step: "season-info",
        seasonName: season.name,
        clubName: season.clubName,
        inviteCode: code,
      };
    }

    // Not authenticated — show guest form
    return {
      step: "guest-form",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode: code,
    };
  } catch (error) {
    console.error("validateSeasonCode failed:", error);
    return { step: "error", error: "error.serverError" };
  }
}

/** Authenticated user joins the season (and club if needed) */
export async function joinSeasonAction(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(joinSeasonSchema, formData);
  if (!parsed.success) {
    return { step: "error", error: "seasonJoin.invalidCode" };
  }
  const { inviteCode } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const season = await getSeasonByInviteCode(sql, inviteCode);
  if (!season || season.status !== "active" || !season.openEnrollment) {
    return { step: "error", error: "seasonJoin.seasonNotActive" };
  }

  if (!isIndividualSeason(season)) {
    return { step: "error", error: "error.teamSeason" };
  }

  if (await isPlayerEnrolledInSeason(sql, player.id, season.id)) {
    return {
      step: "already-enrolled",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode,
    };
  }

  try {
    await sql.begin(async (tx) => {
      // Join club if not a member (idempotent via ON CONFLICT)
      await joinClub(tx, player.id, season.clubId);

      // Re-check enrollment inside transaction
      if (await isPlayerEnrolledInSeason(tx, player.id, season.id)) {
        throw new AlreadyEnrolledError();
      }

      const teamId = await enrollPlayerInIndividualSeason(
        tx,
        player.id,
        season.id,
      );
      await addTeamToStandings(tx, season.id, teamId);
      await createNewPlayerEvent(
        tx,
        season.clubId,
        player.id,
        { firstName: player.firstName, lastName: player.lastName },
        season.id,
      );
    });
  } catch (e) {
    if (e instanceof AlreadyEnrolledError) {
      return {
        step: "already-enrolled",
        seasonName: season.name,
        clubName: season.clubName,
        inviteCode,
      };
    }
    console.error("joinSeasonAction failed:", e);
    return {
      step: "season-info",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode,
      error: "error.serverError",
    };
  }

  // redirect() throws — must be outside try/catch
  redirect("/rankings");
}

/** Unauthenticated user: create player if needed, send magic link */
export async function requestSeasonJoinAction(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(guestJoinSchema, formData);
  if (!parsed.success) {
    if (parsed.fieldErrors.email) {
      return {
        step: "guest-form",
        seasonName: (formData.get("seasonName") as string) ?? "",
        clubName: (formData.get("clubName") as string) ?? "",
        inviteCode:
          (formData.get("inviteCode") as string)?.trim().toUpperCase() ?? "",
        error: "error.invalidEmail",
      };
    }
    return {
      step: "guest-form",
      seasonName: (formData.get("seasonName") as string) ?? "",
      clubName: (formData.get("clubName") as string) ?? "",
      inviteCode:
        (formData.get("inviteCode") as string)?.trim().toUpperCase() ?? "",
      error: "seasonJoin.invalidInput",
    };
  }
  const { firstName, lastName, email, inviteCode } = parsed.data;

  // Enumeration protection: always return check-email
  try {
    let player = await getPlayerByEmail(email);

    if (!player) {
      // Create new player
      const [row] = await sql`
        INSERT INTO player (first_name, last_name, email_address, created)
        VALUES (${firstName}, ${lastName}, ${email}, NOW())
        ON CONFLICT (email_address) DO UPDATE SET email_address = EXCLUDED.email_address
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email_address AS email
      `;
      player = {
        id: row.id as number,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        email: row.email as string,
      };
    }

    const token = await createMagicLink(player.id);
    const returnTo = `/season/join?code=${inviteCode}`;
    const { success, error: emailError } = await sendMagicLinkEmail(
      email,
      fullName(player.firstName, player.lastName),
      token,
      returnTo,
    );
    if (!success) {
      console.error("Failed to send season join magic link:", emailError);
    }
  } catch (error) {
    console.error("requestSeasonJoinAction failed:", error);
  }

  return { step: "check-email" };
}
```

**Step 2: Create the client state machine**

Create `app/(auth)/season/join/season-join-flow.tsx`:

```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  validateSeasonCode,
  joinSeasonAction,
  requestSeasonJoinAction,
  type SeasonJoinState,
} from "./actions";

type SeasonJoinFlowProps = {
  initialCode?: string;
};

const initialState: SeasonJoinState = { step: "loading" };

export function SeasonJoinFlow({ initialCode }: SeasonJoinFlowProps) {
  const t = useTranslations("seasonJoin");
  const tCommon = useTranslations("common");
  const [validateState, validateAction, isValidating] = useActionState(
    validateSeasonCode,
    initialState,
  );
  const [joinState, joinAction, isJoining] = useActionState(
    joinSeasonAction,
    initialState,
  );
  const [requestState, requestAction, isRequesting] = useActionState(
    requestSeasonJoinAction,
    initialState,
  );
  const autoSubmitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [code] = useState(initialCode ?? "");

  const currentState = (() => {
    if (requestState.step !== "loading") return requestState;
    if (joinState.step !== "loading") return joinState;
    return validateState;
  })();

  // Auto-submit code validation when initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.length === 6 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialCode]);

  // ── Check Email ─────────────────────────────────────
  if (currentState.step === "check-email") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("checkEmail")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("checkEmailDesc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Already Enrolled ────────────────────────────────
  if (currentState.step === "already-enrolled") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("alreadyEnrolled")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("alreadyEnrolledDesc", {
              season: currentState.seasonName ?? "",
            })}
          </p>
          <Link
            href="/rankings"
            className="inline-block text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400"
          >
            {t("goToRankings")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Error ───────────────────────────────────────────
  if (currentState.step === "error") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("errorTitle")}
          </h2>
          <p className="text-sm text-red-600">
            {currentState.error ? t(currentState.error) : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Authenticated: Confirm Join ─────────────────────
  if (currentState.step === "season-info") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("joinTitle", { season: currentState.seasonName ?? "" })}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentState.clubName}
            </p>
          </div>

          {currentState.error && (
            <p className="text-center text-sm text-red-600" role="alert">
              {t(currentState.error)}
            </p>
          )}

          <form action={joinAction}>
            <input
              type="hidden"
              name="inviteCode"
              value={currentState.inviteCode}
            />
            <Button type="submit" className="w-full" loading={isJoining}>
              {t("join")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ── Guest: Name + Email Form ────────────────────────
  if (currentState.step === "guest-form") {
    return (
      <Card>
        <CardContent className="mt-0 space-y-4 p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("joinTitle", { season: currentState.seasonName ?? "" })}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentState.clubName}
            </p>
          </div>

          <form action={requestAction} className="space-y-4">
            <input
              type="hidden"
              name="inviteCode"
              value={currentState.inviteCode}
            />
            <input
              type="hidden"
              name="seasonName"
              value={currentState.seasonName}
            />
            <input
              type="hidden"
              name="clubName"
              value={currentState.clubName}
            />
            <FormField
              label={t("firstNameLabel")}
              inputProps={{
                name: "firstName",
                required: true,
                autoComplete: "given-name",
              }}
            />
            <FormField
              label={t("lastNameLabel")}
              inputProps={{
                name: "lastName",
                required: true,
                autoComplete: "family-name",
              }}
            />
            <FormField
              label={t("emailLabel")}
              type="email"
              error={
                currentState.error ? t(currentState.error) : undefined
              }
              inputProps={{
                name: "email",
                required: true,
                autoComplete: "email",
              }}
            />

            <Button type="submit" className="w-full" loading={isRequesting}>
              {t("submitEmail")}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {t("emailHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Loading / Initial: hidden form for auto-submit ──
  return (
    <form ref={formRef} action={validateAction}>
      <input type="hidden" name="code" value={code} />
    </form>
  );
}
```

**Step 3: Build check**

Run: `bunx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add app/\(auth\)/season/join/actions.ts app/\(auth\)/season/join/season-join-flow.tsx
git commit -m "feat: add season join flow with client state machine and server actions"
```

---

### Task 5: i18n — Add Translation Keys

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`

**Step 1: Add `seasonJoin` namespace to both locale files**

Add to `messages/de.json`:

```json
"seasonJoin": {
  "joinTitle": "{season} beitreten",
  "join": "Beitreten",
  "firstNameLabel": "Vorname",
  "lastNameLabel": "Nachname",
  "emailLabel": "E-Mail-Adresse",
  "submitEmail": "Weiter",
  "emailHint": "Du erh\u00e4ltst einen Best\u00e4tigungslink per E-Mail.",
  "checkEmail": "E-Mail pr\u00fcfen",
  "checkEmailDesc": "Wir haben dir einen Link zum Beitreten geschickt. Pr\u00fcfe dein Postfach.",
  "alreadyEnrolled": "Bereits angemeldet",
  "alreadyEnrolledDesc": "Du bist bereits in der Saison {season} angemeldet.",
  "goToRankings": "Zur Rangliste",
  "errorTitle": "Fehler",
  "codeNotFound": "Code nicht gefunden",
  "seasonNotActive": "Diese Saison ist nicht mehr aktiv.",
  "enrollmentClosed": "Die Anmeldung ist geschlossen.",
  "invalidCode": "Ung\u00fcltiger Code",
  "invalidInput": "Bitte f\u00fclle alle Felder aus."
}
```

Add equivalent English translations to `messages/en.json`:

```json
"seasonJoin": {
  "joinTitle": "Join {season}",
  "join": "Join",
  "firstNameLabel": "First name",
  "lastNameLabel": "Last name",
  "emailLabel": "Email address",
  "submitEmail": "Continue",
  "emailHint": "You will receive a confirmation link via email.",
  "checkEmail": "Check your email",
  "checkEmailDesc": "We sent you a link to join. Check your inbox.",
  "alreadyEnrolled": "Already enrolled",
  "alreadyEnrolledDesc": "You are already enrolled in {season}.",
  "goToRankings": "Go to rankings",
  "errorTitle": "Error",
  "codeNotFound": "Code not found",
  "seasonNotActive": "This season is no longer active.",
  "enrollmentClosed": "Enrollment is closed.",
  "invalidCode": "Invalid code",
  "invalidInput": "Please fill out all fields."
}
```

Also add share-related keys to the `seasonManagement` namespace in both files:

German (`de.json`):
```json
"inviteLink": "Einladungslink",
"inviteLinkDesc": "Teile diesen Link, um Spieler zur Saison einzuladen.",
"copyLink": "Link kopieren",
"linkCopied": "Link kopiert!",
"showQrCode": "QR-Code anzeigen",
"qrCodeTitle": "QR-Code"
```

English (`en.json`):
```json
"inviteLink": "Invite link",
"inviteLinkDesc": "Share this link to invite players to the season.",
"copyLink": "Copy link",
"linkCopied": "Link copied!",
"showQrCode": "Show QR code",
"qrCodeTitle": "QR code"
```

**Step 2: Verify no JSON syntax errors**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/de.json','utf8')); console.log('de.json OK')" && node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('en.json OK')"`
Expected: Both OK

**Step 3: Commit**

```bash
git add messages/de.json messages/en.json
git commit -m "feat: add i18n keys for season join flow and invite link sharing"
```

---

### Task 6: Admin UI — Invite Link Card with QR Code

**Files:**
- Modify: `app/(main)/admin/club/[id]/season/[seasonId]/season-management-view.tsx`
- Modify: `app/(main)/admin/club/[id]/season/[seasonId]/page.tsx` (pass `inviteCode` to view)

**Prerequisite: Install `qrcode.react`**

Run: `bun add qrcode.react`

**Step 1: Pass invite code from server to client**

Read `app/(main)/admin/club/[id]/season/[seasonId]/page.tsx` to see how `SeasonDetail` type is constructed and ensure `inviteCode` is included. The `SeasonDetail` type comes from `app/lib/db/admin.ts` — check it includes `inviteCode` (or add it).

In `app/lib/db/admin.ts`, ensure the season detail query selects `invite_code AS "inviteCode"` and the `SeasonDetail` type includes `inviteCode: string`.

Pass it through to `SeasonManagementView`.

**Step 2: Add invite link card to season management view**

In `app/(main)/admin/club/[id]/season/[seasonId]/season-management-view.tsx`:

Add imports:
```typescript
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { ResponsiveDialog } from "@/components/responsive-dialog";
```

Update `SeasonManagementViewProps` to include:
```typescript
inviteCode: string;
appUrl: string;
```

Add the invite link card in the JSX, between the status badge and configuration card, only when season is active + open enrollment:

```tsx
{/* Invite Link */}
{season.status === "active" && season.openEnrollment && inviteCode && (
  <InviteLinkCard
    inviteCode={inviteCode}
    appUrl={appUrl}
  />
)}
```

Create the `InviteLinkCard` as a local component within the same file (or extract if it gets large):

```tsx
function InviteLinkCard({
  inviteCode,
  appUrl,
}: {
  inviteCode: string;
  appUrl: string;
}) {
  const t = useTranslations("seasonManagement");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const inviteUrl = `${appUrl}/season/join?code=${inviteCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("inviteLink")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {t("inviteLinkDesc")}
          </p>
          <div className="mb-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <p className="break-all text-sm font-mono text-slate-700 dark:text-slate-300">
              {inviteUrl}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <ClipboardDocumentCheckIcon className="size-4" />
              ) : (
                <ClipboardIcon className="size-4" />
              )}
              {copied ? t("linkCopied") : t("copyLink")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrOpen(true)}
            >
              <QrCodeIcon className="size-4" />
              {t("showQrCode")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        title={t("qrCodeTitle")}
      >
        <div className="flex justify-center p-6">
          <QRCodeSVG value={inviteUrl} size={256} />
        </div>
      </ResponsiveDialog>
    </>
  );
}
```

**Step 3: Update the page server component to pass `appUrl` and `inviteCode`**

In `app/(main)/admin/club/[id]/season/[seasonId]/page.tsx`, pass `inviteCode={season.inviteCode}` and `appUrl={process.env.APP_URL || "http://localhost:3000"}` to `SeasonManagementView`.

**Step 4: Build check**

Run: `bunx tsc --noEmit && bun run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add app/\(main\)/admin/club/\[id\]/season/\[seasonId\]/season-management-view.tsx \
        app/\(main\)/admin/club/\[id\]/season/\[seasonId\]/page.tsx \
        app/lib/db/admin.ts \
        package.json bun.lock
git commit -m "feat: add invite link card with QR code to season admin page"
```

---

### Task 7: Backfill Existing Seasons + Generate Codes for Draft Seasons

**Files:**
- Modify: `db/migrations/002_add_season_invite_code.sql` (add backfill)

**Step 1: Update migration to backfill existing seasons**

Append to the migration file:

```sql
-- Backfill existing seasons with generated invite codes
-- Uses random 6-char uppercase alphanumeric codes
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
  done BOOLEAN;
BEGIN
  FOR rec IN SELECT id FROM seasons WHERE invite_code = '' LOOP
    done := FALSE;
    WHILE NOT done LOOP
      new_code := upper(substr(md5(random()::text), 1, 6));
      BEGIN
        UPDATE seasons SET invite_code = new_code WHERE id = rec.id;
        done := TRUE;
      EXCEPTION WHEN unique_violation THEN
        -- Retry with new code on collision
        done := FALSE;
      END;
    END LOOP;
  END LOOP;
END $$;
```

**Step 2: Reset and re-run migrations**

Run: `bun run db:reset && bun run db:migrate && bun run db:seed`
Expected: All migrations applied, seed data has invite codes

**Step 3: Verify**

Run: `psql postgres://pyramid:pyramid@localhost:5433/pyramid_dev -c "SELECT id, name, invite_code FROM seasons;"`
Expected: All seasons have non-empty invite codes

**Step 4: Amend the migration commit (since we haven't pushed)**

```bash
git add db/migrations/002_add_season_invite_code.sql
git commit --amend --no-edit
```

Note: This amends the Task 1 commit since the migration file was first created there. If Task 1 was already pushed, create a new commit instead.

---

### Task 8: Integration Testing

**Files:**
- Modify: `app/lib/db/season.test.ts` (tests already added in Task 2)

**Step 1: Run full DB test suite**

Run: `bun run test:db -- --reporter=verbose`
Expected: All tests pass including new `getSeasonByInviteCode` tests

**Step 2: Run lint + type check**

Run: `bun run lint && bunx tsc --noEmit`
Expected: No errors

**Step 3: Manual smoke test**

1. Start dev server: `bun run dev`
2. As admin, go to season management → verify invite link card appears for active season with open enrollment
3. Copy the invite URL
4. Open in incognito → verify OG meta tags render (check page source or use a link preview tool)
5. Verify guest form appears (first name, last name, email)
6. Open the same URL logged in as a non-member → verify "Beitreten" button appears
7. Open the same URL logged in as an enrolled member → verify "Already enrolled" message

**Step 4: Final commit (if any fixups)**

```bash
git add -A
git commit -m "fix: address integration test findings"
```

---

### Task 9: PR

Create a PR with all commits from this branch.
