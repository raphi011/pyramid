# Player Name Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single `name TEXT NOT NULL` column in `player` with `first_name TEXT NOT NULL` + `last_name TEXT NOT NULL`, updating all types, queries, UI, and seed data.

**Architecture:** Direct schema modification (no migration — `db:reset` + `db:seed`). Add `fullName()` helper for display, simplify `abbreviateName()` to use fields directly. All components that display player names consume either `firstName`+`lastName` pair or a pre-computed `name` string from the server.

**Tech Stack:** Next.js 16, TypeScript, PostgreSQL, next-intl

**Decision: Where to compute full names.** SQL queries that join player names for display purposes (match.ts `MATCH_SELECT`, event.ts `EVENT_SELECT`) will concatenate in SQL: `(p.first_name || ' ' || p.last_name)`. This keeps the Match/Event types unchanged (still `team1Name: string`, `playerName: string`, etc.) since those are display-only strings. Only types that represent a Player entity (Player, PlayerProfile, RankedPlayer, PyramidPlayer, StandingsPlayer, Opponent) get `firstName`+`lastName` fields.

---

### Task 1: Schema + Seed Data

**Files:**
- Modify: `db/migrations/001_initial_schema.sql:43`
- Modify: `db/seed.ts:69-90,139-141,440-461`

**Step 1: Update schema**

In `001_initial_schema.sql`, replace:
```sql
name TEXT NOT NULL,
```
with:
```sql
first_name TEXT NOT NULL,
last_name TEXT NOT NULL,
```

**Step 2: Update seed data**

In `db/seed.ts`, change `PLAYERS` array from `{ name, email }` to `{ firstName, lastName, email }`:
```typescript
const PLAYERS = [
  { firstName: "Anna", lastName: "Müller", email: "anna@example.com" },
  { firstName: "Max", lastName: "Weber", email: "max@example.com" },
  // ... all 20 players
];
```

Update the INSERT:
```sql
INSERT INTO player (first_name, last_name, email_address, created)
VALUES (${p.firstName}, ${p.lastName}, ${p.email}, NOW())
```

Update magic link output (line 448):
```typescript
tokens.push({ name: `${PLAYERS[i].firstName} ${PLAYERS[i].lastName}`, token });
```

Update player email log (line 460):
```typescript
console.log(`  ${p.email} (${p.firstName} ${p.lastName})`);
```

**Step 3: Reset and seed**

Run: `bun run db:reset && bun run db:seed`
Expected: Seed completes with 20 players, login links printed

---

### Task 2: Utility Functions + Tests

**Files:**
- Modify: `lib/utils.ts:7-17`
- Modify: `lib/utils.test.ts`

**Step 1: Update `abbreviateName` and add `fullName`**

```typescript
/**
 * Abbreviates to first name + last initial.
 * abbreviateName("Anna", "Müller") → "Anna M."
 */
export function abbreviateName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName[0]}.`;
}

/**
 * Returns the full display name.
 */
export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
```

**Step 2: Update tests**

```typescript
import { abbreviateName, fullName } from "./utils";

describe("abbreviateName", () => {
  it.each([
    ["Anna", "Müller", "Anna M."],
    ["Raphael", "Gruber", "Raphael G."],
    ["John", "Smith", "John S."],
  ])('abbreviates "%s %s" to "%s"', (first, last, expected) => {
    expect(abbreviateName(first, last)).toBe(expected);
  });
});

describe("fullName", () => {
  it("joins first and last name", () => {
    expect(fullName("Anna", "Müller")).toBe("Anna Müller");
  });
});
```

**Step 3: Run tests**

Run: `bun run test:db`
Expected: PASS

**Step 4: Commit**

```bash
git add lib/utils.ts lib/utils.test.ts db/migrations/001_initial_schema.sql db/seed.ts
git commit -m "refactor: split player name into first_name and last_name (schema + utils)"
```

---

### Task 3: Database Layer — Auth Types & Queries

**Files:**
- Modify: `app/lib/db/auth.ts`
- Modify: `app/lib/auth.ts:64-67,91`

**Step 1: Update types**

```typescript
export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type PlayerProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
  imageId: string | null;
  unavailableFrom: Date | null;
  unavailableUntil: Date | null;
};
```

**Step 2: Update queries**

`getPlayerByEmail`: SELECT `first_name AS "firstName", last_name AS "lastName"` instead of `name`. Map to `{ id, firstName, lastName, email }`.

`getPlayerById`: Same change.

`getPlayerProfile`: SELECT `first_name AS "firstName", last_name AS "lastName"` instead of `name`. Map both fields.

`updatePlayerProfile`: Accept `{ firstName, lastName, phoneNumber, bio }`. UPDATE `first_name = ${firstName}, last_name = ${lastName}`.

**Step 3: Update `app/lib/auth.ts`**

`getCurrentPlayer` return type: `{ id: number; firstName: string; lastName: string; email: string }`.

`getPlayerByEmail` wrapper return type: same.

**Step 4: Update layout.tsx name check**

In `app/(main)/layout.tsx:22`:
```typescript
if (!player.firstName.trim()) {
  redirect("/onboarding");
}
```

And line 57:
```typescript
player={{ id: player.id, firstName: player.firstName, lastName: player.lastName }}
```

**Step 5: Commit**

```bash
git add app/lib/db/auth.ts app/lib/auth.ts app/(main)/layout.tsx
git commit -m "refactor: update auth DB layer for first_name/last_name"
```

---

### Task 4: Database Layer — Season Queries

**Files:**
- Modify: `app/lib/db/season.ts:41-47,247-271,289`

**Step 1: Update `RankedPlayer` type**

```typescript
export type RankedPlayer = {
  teamId: number;
  playerId: number;
  firstName: string;
  lastName: string;
  imageId: string | null;
  rank: number;
};
```

**Step 2: Update `getStandingsWithPlayers`**

SELECT: `p.first_name AS "firstName", p.last_name AS "lastName"` instead of `p.name`.

teamMap value type: `{ playerId: number; firstName: string; lastName: string; imageId: string | null }`.

Players push: `{ teamId, playerId: info.playerId, firstName: info.firstName, lastName: info.lastName, imageId: info.imageId, rank: i + 1 }`.

**Step 3: Commit**

```bash
git add app/lib/db/season.ts
git commit -m "refactor: update season DB layer for first_name/last_name"
```

---

### Task 5: Database Layer — Match Queries (SQL concatenation)

**Files:**
- Modify: `app/lib/db/match.ts:90-113,334,364,403,769`

**Step 1: Update MATCH_SELECT and MATCH_JOIN**

In `MATCH_SELECT`, `p1.name` and `p2.name` become concatenations:
```sql
(p1.first_name || ' ' || p1.last_name) AS "team1Name",
(p2.first_name || ' ' || p2.last_name) AS "team2Name",
```

No type changes needed — `Match.team1Name` stays `string`.

**Step 2: Update `getDateProposals`**

Line 334: `(p.first_name || ' ' || p.last_name) AS "proposedByName"`

**Step 3: Update `getMatchComments`**

Line 364: `(p.first_name || ' ' || p.last_name) AS "playerName"`

**Step 4: Update `createMatchComment`**

Line 403 subquery: `(SELECT (first_name || ' ' || last_name) FROM player WHERE id = match_comments.player_id) AS "playerName"`

**Step 5: Update `getHeadToHeadRecords`**

Line 769 subquery: `(SELECT (p.first_name || ' ' || p.last_name) FROM team_players tp JOIN player p ON p.id = tp.player_id WHERE tp.team_id = opponent_id LIMIT 1) AS "opponentName"`

**Step 6: Commit**

```bash
git add app/lib/db/match.ts
git commit -m "refactor: concatenate first_name/last_name in match SQL queries"
```

---

### Task 6: Database Layer — Event Queries (SQL concatenation)

**Files:**
- Modify: `app/lib/db/event.ts:29-68`

**Step 1: Update EVENT_SELECT**

```sql
(actor.first_name || ' ' || actor.last_name) AS "actorName",
(target.first_name || ' ' || target.last_name) AS "targetName",
```

**Step 2: Update EVENT_JOIN lateral subqueries**

```sql
LEFT JOIN LATERAL (
    SELECT string_agg(p.first_name || ' ' || p.last_name, ' / ' ORDER BY p.id) AS name
    FROM team_players tp JOIN player p ON p.id = tp.player_id
    WHERE tp.team_id = sm.team1_id
  ) t1names ON TRUE
```

Same for t2names.

No type changes needed — `EventRow.actorName`, `team1Name` etc. stay `string | null`.

**Step 3: Commit**

```bash
git add app/lib/db/event.ts
git commit -m "refactor: concatenate first_name/last_name in event SQL queries"
```

---

### Task 7: App Shell + Navigation

**Files:**
- Modify: `app/(main)/app-shell-wrapper.tsx:19,53`

**Step 1: Update type and usage**

```typescript
player: { id: number; firstName: string; lastName: string };
```

Line 53:
```typescript
profile={{ name: fullName(player.firstName, player.lastName), href: "/profile" }}
```

Import `fullName` from `@/lib/utils`.

**Step 2: Commit**

```bash
git add app/(main)/app-shell-wrapper.tsx
git commit -m "refactor: use firstName/lastName in app shell wrapper"
```

---

### Task 8: Component Layer — PyramidGrid + StandingsTable + PlayerCard

**Files:**
- Modify: `components/domain/pyramid-grid.tsx:10-19,75`
- Modify: `components/domain/standings-table.tsx:13-23,72,75`
- Modify: `components/domain/player-card.tsx` (no change — receives pre-formatted `name: string`)
- Modify: `components/domain/player-profile.tsx` (no change — receives pre-formatted `name: string`)

**Step 1: Update PyramidPlayer type**

```typescript
type PyramidPlayer = {
  id: string | number;
  playerId?: number;
  firstName: string;
  lastName: string;
  rank: number;
  avatarSrc?: string | null;
  wins?: number;
  losses?: number;
  variant?: PlayerCardVariant;
};
```

Line 75: Pass formatted name to PlayerCard:
```tsx
name={abbreviateName(player.firstName, player.lastName)}
```

Import `abbreviateName` (already imported), update Avatar:
```tsx
<Avatar name={fullName(player.firstName, player.lastName)} ... />
```

Wait — PlayerCard receives `name` as a string and passes it to Avatar. The abbreviation happens before passing to PlayerCard. So PlayerCard doesn't need to change.

But in PyramidGrid, the Avatar inside PlayerCard will get the abbreviated name. That's fine — initials from "Anna M." = "AM" which is correct.

**Step 2: Update StandingsPlayer type**

```typescript
type StandingsPlayer = {
  id: string | number;
  playerId?: number;
  firstName: string;
  lastName: string;
  rank: number;
  avatarSrc?: string | null;
  wins: number;
  losses: number;
  movement?: "up" | "down" | "none";
  challengeable?: boolean;
};
```

Lines 72/75: Pass full name:
```tsx
<Avatar name={fullName(player.firstName, player.lastName)} ... />
...
{fullName(player.firstName, player.lastName)}
```

Import `fullName` from `@/lib/utils`.

**Step 3: Commit**

```bash
git add components/domain/pyramid-grid.tsx components/domain/standings-table.tsx
git commit -m "refactor: use firstName/lastName in pyramid grid and standings table"
```

---

### Task 9: Rankings Page (Server Component)

**Files:**
- Modify: `app/(main)/rankings/page.tsx:115,140,172-173`
- Modify: `app/(main)/rankings/rankings-view.tsx:41-42,143`

**Step 1: Update rankings page**

Lines 112-121 pyramidPlayers mapping:
```typescript
firstName: p.firstName,
lastName: p.lastName,
```
(remove `name: p.name`)

Lines 137-147 standingsPlayers mapping: same.

Lines 172-173 match mapping stays unchanged (uses `m.team1Name` which is already a concatenated string from SQL).

**Step 2: Update rankings-view.tsx**

SerializedMatch type stays unchanged (uses `player1: { name: string }`).

Line 143 opponents mapping:
```typescript
.map((p) => ({ teamId: p.id as number, firstName: p.firstName, lastName: p.lastName, rank: p.rank }));
```

Update `Opponent` type import path if needed.

**Step 3: Commit**

```bash
git add app/(main)/rankings/page.tsx app/(main)/rankings/rankings-view.tsx
git commit -m "refactor: use firstName/lastName in rankings page"
```

---

### Task 10: Challenge Sheet

**Files:**
- Modify: `components/domain/challenge-sheet.tsx:13-18,129,172,177,194,200`

**Step 1: Update Opponent type**

```typescript
type Opponent = {
  teamId: number;
  firstName: string;
  lastName: string;
  rank: number;
  avatarSrc?: string | null;
};
```

**Step 2: Update all usages**

Use `fullName(opponent.firstName, opponent.lastName)` in:
- Dialog title (line 129): `t("confirmTitle", { name: fullName(selectedTarget.firstName, selectedTarget.lastName) })`
- Avatar name (line 172): `name={fullName(opponent.firstName, opponent.lastName)}`
- Display text (line 177): `{fullName(opponent.firstName, opponent.lastName)}`
- Confirm step avatar (line 194): `name={fullName(selectedTarget.firstName, selectedTarget.lastName)}`
- Confirm step text (line 200): `{fullName(selectedTarget.firstName, selectedTarget.lastName)}`

Import `fullName` from `@/lib/utils`.

**Step 3: Commit**

```bash
git add components/domain/challenge-sheet.tsx
git commit -m "refactor: use firstName/lastName in challenge sheet"
```

---

### Task 11: Onboarding + Profile Edit

**Files:**
- Modify: `app/(auth)/onboarding/onboarding-form.tsx`
- Modify: `app/(auth)/onboarding/actions.ts`
- Modify: `app/(main)/profile/profile-view.tsx:146,312,325-329`
- Modify: `app/lib/actions/profile.ts:18-24,32-36`
- Modify: `messages/de.json`
- Modify: `messages/en.json`

**Step 1: Update onboarding form — two fields**

Replace single `name` state with `firstName` + `lastName`:
```tsx
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
```

Avatar: `<Avatar name={firstName ? fullName(firstName, lastName) : "?"} size="xl" />`

Replace single FormField with two:
```tsx
<FormField
  label={t("firstNameLabel")}
  placeholder={t("firstNamePlaceholder")}
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  error={state.fieldErrors?.firstName}
  required
  inputProps={{ name: "firstName" }}
/>
<FormField
  label={t("lastNameLabel")}
  placeholder={t("lastNamePlaceholder")}
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  error={state.fieldErrors?.lastName}
  required
  inputProps={{ name: "lastName" }}
/>
```

Button disabled: `!firstName.trim() || !lastName.trim()`

**Step 2: Update onboarding action**

```typescript
const firstName = (formData.get("firstName") as string)?.trim();
const lastName = (formData.get("lastName") as string)?.trim();

if (!firstName || !lastName) {
  const t = await getTranslations("onboarding");
  return { error: t("nameRequired") };
}

await updatePlayerProfile(sql, session.playerId, {
  firstName,
  lastName,
  phoneNumber,
  bio: "",
});
```

**Step 3: Update profile edit dialog**

In `profile-view.tsx`, replace single name FormField (lines 324-331) with two:
```tsx
<FormField
  label={t("firstNameLabel")}
  required
  inputProps={{ name: "firstName", defaultValue: profile.firstName }}
/>
<FormField
  label={t("lastNameLabel")}
  required
  inputProps={{ name: "lastName", defaultValue: profile.lastName }}
/>
```

Update Avatar (line 312): `<Avatar name={fullName(profile.firstName, profile.lastName)} src={avatarSrc} size="xl" />`

Update PlayerProfile name prop (line 146): `name={fullName(profile.firstName, profile.lastName)}`

**Step 4: Update profile action**

In `app/lib/actions/profile.ts`:
```typescript
const firstName = ((formData.get("firstName") as string) ?? "").trim();
const lastName = ((formData.get("lastName") as string) ?? "").trim();

if (!firstName || !lastName) {
  return { error: "profile.error.nameRequired" };
}

await updatePlayerProfile(sql, player.id, { firstName, lastName, phoneNumber, bio });
```

**Step 5: Update i18n**

In `messages/de.json` and `messages/en.json`:

Profile section — replace `"nameLabel": "Name"` with:
```json
"firstNameLabel": "Vorname",
"lastNameLabel": "Nachname",
```

Onboarding section — replace name-related keys with:
```json
"firstNameLabel": "Vorname",
"firstNamePlaceholder": "Max",
"lastNameLabel": "Nachname",
"lastNamePlaceholder": "Mustermann",
"nameRequired": "Vor- und Nachname sind erforderlich",
```

English equivalents:
```json
"firstNameLabel": "First name",
"firstNamePlaceholder": "John",
"lastNameLabel": "Last name",
"lastNamePlaceholder": "Doe",
"nameRequired": "First and last name are required",
```

**Step 6: Commit**

```bash
git add app/(auth)/onboarding/ app/(main)/profile/profile-view.tsx app/lib/actions/profile.ts messages/
git commit -m "refactor: split name into firstName/lastName in onboarding and profile forms"
```

---

### Task 12: Player Detail Page

**Files:**
- Modify: `app/(main)/player/[id]/player-detail-view.tsx:65,67,198`

**Step 1: Update name usages**

Line 65: `<PageLayout title={fullName(profile.firstName, profile.lastName)}>`

Line 67: `name={fullName(profile.firstName, profile.lastName)}`

Line 198: `name: fullName(profile.firstName, profile.lastName),` → Wait, this passes to ChallengeSheet's `target` which is now `Opponent` with `firstName`/`lastName`. So:
```typescript
target={{
  teamId: targetTeamId,
  firstName: profile.firstName,
  lastName: profile.lastName,
  rank: seasonStats.rank,
}}
```

Import `fullName` from `@/lib/utils`.

**Step 2: Commit**

```bash
git add app/(main)/player/[id]/player-detail-view.tsx
git commit -m "refactor: use firstName/lastName in player detail view"
```

---

### Task 13: Match Detail View

**Files:**
- Modify: `app/(main)/matches/[id]/match-detail-view.tsx` (no changes needed!)

Match detail view uses `match.team1Name`, `proposal.proposedByName`, `c.playerName` — all pre-concatenated strings from SQL. No changes required here.

Verify this is correct, then move on.

---

### Task 14: Storybook Stories

**Files:**
- Modify: All stories that reference player `name` in component props

Key stories to update:
- `stories/domain/PyramidGrid.stories.tsx` — change `name` to `firstName`+`lastName`
- `stories/domain/StandingsTable.stories.tsx` — same
- `stories/domain/ChallengeSheet.stories.tsx` — update Opponent mock data
- `stories/pages/Rankings.stories.tsx` — update player data
- `stories/pages/Profile.stories.tsx` — update profile mock data
- `stories/pages/MatchDetail.stories.tsx` — verify (likely no changes if using team1Name strings)
- `stories/domain/PlayerProfile.stories.tsx` — no change (still takes `name: string`)
- `stories/domain/PlayerCard.stories.tsx` — no change (still takes `name: string`)

For each story, find `name:` props in mock data that correspond to changed types and replace with `firstName:`+`lastName:`.

**Step 1: Update all affected stories**

**Step 2: Verify Storybook compiles**

Run: `bun storybook` and check no errors

**Step 3: Commit**

```bash
git add stories/
git commit -m "refactor: update Storybook stories for firstName/lastName split"
```

---

### Task 15: TypeScript Check + Lint + Final Verification

**Step 1: Type check**

Run: `bunx tsc --noEmit`
Expected: No errors

**Step 2: Lint**

Run: `bun run lint`
Expected: No errors

**Step 3: Reset DB and seed**

Run: `bun run db:reset && bun run db:seed`
Expected: Clean seed

**Step 4: Run unit tests**

Run: `bun run test:db`
Expected: All pass

**Step 5: Visual check (dev server)**

Run: `bun run dev`
Check: pyramid view shows "Anna M." format, standings shows full names, profile shows first+last separately in edit form.

**Step 6: Final commit (if any fixups)**
