# Challenge Flow Design (US-CHAL-01→07)

## Overview

Implement the core challenge initiation flow and match list page. Players can challenge eligible opponents from the pyramid grid, standings table, or FAB. Matches are listed on a dedicated `/matches` page with My/All/Open tabs.

## Scope

**In scope:** US-CHAL-01 (challenge from pyramid), US-CHAL-02 (challenge from FAB), US-CHAL-03 (challenge from profile — ChallengeSheet is reusable, profile page integration deferred), US-CHAL-04 (season picker), US-CHAL-05 (validation rules), US-CHAL-06 (FAB disabled state), US-CHAL-07 (match list).

**Out of scope:** Email notifications (separate story), match detail page (US-CHAL-09), date proposals (US-CHAL-10/11), result entry (US-CHAL-12/13), real-time updates, player profile integration (US-PROF-09/10).

## Architecture: Server Actions

Challenge creation uses a Next.js Server Action (not API routes). This aligns with the existing auth flow patterns, provides built-in revalidation via `revalidatePath`, and keeps things simple.

## Data Layer

**New file: `app/lib/db/match.ts`**

| Function | Purpose |
|----------|---------|
| `getTeamsWithOpenChallenge(sql, seasonId)` | Returns `Set<number>` of team IDs with open challenge (`status IN ('challenged', 'date_set')`) |
| `getUnavailableTeamIds(sql, seasonId)` | Returns `Set<number>` of team IDs with overlapping unavailability |
| `createChallenge(tx, seasonId, team1Id, team2Id, challengeText)` | Inserts `season_matches` row + events, uses `pg_advisory_xact_lock(seasonId)` for race safety |
| `getMatchesBySeason(sql, seasonId)` | All matches for a season with player names, sorted by created DESC |
| `getMatchesByTeam(sql, seasonId, teamId)` | Filtered to a specific team |
| `getOpenMatches(sql, seasonId)` | Only open matches |

`createChallenge` runs inside a transaction with advisory lock (same pattern as `addTeamToStandings`). Creates one public `challenge` event + one personal `challenged` event with `target_player_id`.

## Server Action

**New file: `app/lib/actions/challenge.ts`**

`createChallengeAction(formData)` — "use server"

**Input:** `seasonId`, `challengeeTeamId`, `challengeText` (optional)

**Validation (all server-side, inside transaction):**
1. Authenticate current player
2. Verify season is active
3. Resolve challenger's team ID
4. Check pyramid rules via `canChallenge()`
5. Check neither team has open challenge
6. Check neither player is unavailable
7. On failure → return `{ error: string }` (i18n key)
8. On success → `createChallenge()` + `revalidatePath("/rankings")` + `revalidatePath("/matches")` → return `{ success: true, matchId }`

**Error keys:** `challenge.error.notActive`, `challenge.error.notEnrolled`, `challenge.error.invalidTarget`, `challenge.error.openChallenge`, `challenge.error.unavailable`

## UI Components

### ChallengeSheet (`components/domain/challenge-sheet.tsx`)

Multi-step `ResponsiveDialog`:

- **Step 0 (season picker)** — only if multiple active seasons. List of season name cards.
- **Step 1 (opponent picker)** — `DataList` of eligible opponents (avatar, name, rank). Empty state message. Used by FAB flow.
- **Step 2 (confirmation)** — opponent info, optional message `Textarea` via `FormField`, "Send Challenge" button (`court-500`), Cancel. Entry point when tapping challengeable card in pyramid (skips Step 1).

Uses `useTransition` for pending state on submit.

### MatchCard (`components/domain/match-card.tsx`)

Shows both players (avatars + names), status badge, score (if completed), relative time.

**Status badge mapping:**
| DB Status | Involved players | Others |
|-----------|-----------------|--------|
| `challenged` | Open | Open |
| `date_set` | Scheduled | Scheduled |
| `pending_confirmation` | Pending Confirmation | Scheduled |
| `disputed` | Disputed | Open |
| `completed` / `withdrawn` / `forfeited` | Same label | Same label |

## Page Wiring

### Rankings page modifications
- Fetch open challenges + unavailable teams → enrich challengeable filtering beyond just pyramid rules
- Pass `currentPlayerTeamId`, `seasonId`, `seasons`, `opponents` to `RankingsView`
- `RankingsView` manages ChallengeSheet state. Tap challengeable player → opens Step 2. Tap other player → navigate to profile.

### FAB wiring (`app-shell-wrapper.tsx`)
- Receives `hasOpenChallenge: boolean` prop
- If has open challenge → show message on tap
- If not → navigate to `/rankings?challenge=true` which triggers ChallengeSheet in opponent-picker mode

### Match list page (`app/(main)/matches/`)
- `page.tsx` — server component fetching matches for selected season
- `matches-view.tsx` — client component with My/All/Open tabs, grouped sections (Open on top, Completed below), `DataList` + `MatchCard`, season selector, empty states

## i18n

New namespaces: `challenge`, `matches` in existing locale files. All user-facing text in German.

## Testing

DB integration tests for `match.ts` functions (challenge creation, open challenge checks, match queries).

## No migrations needed

All tables (`season_matches`, `match_comments`, `date_proposals`, `events`, `season_standings`) already exist.
