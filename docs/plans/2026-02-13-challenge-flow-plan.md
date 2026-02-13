# Challenge Flow Implementation Plan (US-CHAL-01→07)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the core challenge initiation flow (from pyramid, FAB, profile) and match list page so players can challenge each other and view matches.

**Architecture:** Server Actions for challenge creation with full server-side validation inside a Postgres transaction (advisory lock for race safety). ChallengeSheet as a multi-step ResponsiveDialog. Match list as a server-rendered page with client-side tab filtering.

**Tech Stack:** Next.js 16 App Router, Server Actions, postgres.js, next-intl, Headless UI, Tailwind CSS

---

### Task 1: Data layer — match query functions

**Files:**
- Create: `app/lib/db/match.ts`
- Test: `app/lib/db/match.test.ts`
- Modify: `app/lib/db/seed.ts` (add `seedEvent` helper)

**Context:** Follow the exact same patterns as `app/lib/db/season.ts` — accept `Sql` parameter (which is `postgres.Sql | postgres.TransactionSql`), use tagged template SQL, return typed results.

**Step 1: Add `seedEvent` helper to seed.ts**

Add after the existing `seedStandings` function at the bottom of `app/lib/db/seed.ts`:

```typescript
// ── Event ────────────────────────────────────────────

export async function seedEvent(
  tx: Tx,
  clubId: number,
  {
    seasonId,
    matchId,
    playerId,
    targetPlayerId,
    eventType = "challenge",
    metadata = {},
  }: {
    seasonId?: number;
    matchId?: number;
    playerId?: number;
    targetPlayerId?: number;
    eventType?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId ?? null}, ${matchId ?? null}, ${playerId ?? null}, ${targetPlayerId ?? null}, ${eventType}, ${tx.json(metadata)}, NOW())
    RETURNING id
  `;
  return row.id as number;
}
```

**Step 2: Write match.ts with all query functions**

Create `app/lib/db/match.ts`:

```typescript
import type postgres from "postgres";

type Sql = postgres.Sql | postgres.TransactionSql;

// ── Types ──────────────────────────────────────────────

export type MatchStatus =
  | "challenged"
  | "date_set"
  | "pending_confirmation"
  | "completed"
  | "withdrawn"
  | "forfeited"
  | "disputed";

export type Match = {
  id: number;
  seasonId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  winnerTeamId: number | null;
  team1Score: number[] | null;
  team2Score: number[] | null;
  status: MatchStatus;
  challengeText: string;
  created: Date;
};

// ── Queries ────────────────────────────────────────────

export async function getTeamsWithOpenChallenge(
  sql: Sql,
  seasonId: number,
): Promise<Set<number>> {
  const rows = await sql`
    SELECT team1_id AS "teamId" FROM season_matches
    WHERE season_id = ${seasonId} AND status IN ('challenged', 'date_set')
    UNION
    SELECT team2_id AS "teamId" FROM season_matches
    WHERE season_id = ${seasonId} AND status IN ('challenged', 'date_set')
  `;
  return new Set(rows.map((r) => r.teamId as number));
}

export async function getUnavailableTeamIds(
  sql: Sql,
  seasonId: number,
): Promise<Set<number>> {
  const rows = await sql`
    SELECT t.id AS "teamId"
    FROM teams t
    JOIN team_players tp ON tp.team_id = t.id
    JOIN player p ON p.id = tp.player_id
    WHERE t.season_id = ${seasonId}
      AND p.unavailable_from IS NOT NULL
      AND p.unavailable_until IS NOT NULL
      AND p.unavailable_from <= NOW()
      AND p.unavailable_until >= NOW()
  `;
  return new Set(rows.map((r) => r.teamId as number));
}

export async function createChallenge(
  tx: postgres.TransactionSql,
  seasonId: number,
  clubId: number,
  team1Id: number,
  team2Id: number,
  challengerId: number,
  challengeeId: number,
  challengeText: string,
): Promise<number> {
  // Advisory lock prevents concurrent challenges for the same season
  await tx`SELECT pg_advisory_xact_lock(${seasonId})`;

  // Re-check open challenges inside the lock
  const openCheck = await tx`
    SELECT 1 FROM season_matches
    WHERE season_id = ${seasonId}
      AND status IN ('challenged', 'date_set')
      AND (team1_id IN (${team1Id}, ${team2Id}) OR team2_id IN (${team1Id}, ${team2Id}))
    LIMIT 1
  `;
  if (openCheck.length > 0) {
    throw new ChallengeConflictError();
  }

  const [match] = await tx`
    INSERT INTO season_matches (season_id, team1_id, team2_id, status, challenge_text, created)
    VALUES (${seasonId}, ${team1Id}, ${team2Id}, 'challenged', ${challengeText}, NOW())
    RETURNING id
  `;
  const matchId = match.id as number;

  // Public event: "X challenged Y"
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${challengerId}, 'challenge', '{}', NOW())
  `;

  // Personal event: notify challengee
  await tx`
    INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
    VALUES (${clubId}, ${seasonId}, ${matchId}, ${challengerId}, ${challengeeId}, 'challenged', '{}', NOW())
  `;

  return matchId;
}

export class ChallengeConflictError extends Error {
  constructor() {
    super("One or both teams already have an open challenge");
    this.name = "ChallengeConflictError";
  }
}

function toMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as number,
    seasonId: row.seasonId as number,
    team1Id: row.team1Id as number,
    team2Id: row.team2Id as number,
    team1Name: row.team1Name as string,
    team2Name: row.team2Name as string,
    winnerTeamId: (row.winnerTeamId as number) ?? null,
    team1Score: (row.team1Score as number[]) ?? null,
    team2Score: (row.team2Score as number[]) ?? null,
    status: row.status as MatchStatus,
    challengeText: row.challengeText as string,
    created: row.created as Date,
  };
}

const MATCH_SELECT = `
  sm.id,
  sm.season_id AS "seasonId",
  sm.team1_id AS "team1Id",
  sm.team2_id AS "team2Id",
  sm.winner_team_id AS "winnerTeamId",
  sm.team1_score AS "team1Score",
  sm.team2_score AS "team2Score",
  sm.status,
  sm.challenge_text AS "challengeText",
  sm.created,
  p1.name AS "team1Name",
  p2.name AS "team2Name"
`;

const MATCH_JOIN = `
  FROM season_matches sm
  JOIN teams t1 ON t1.id = sm.team1_id
  JOIN team_players tp1 ON tp1.team_id = t1.id
  JOIN player p1 ON p1.id = tp1.player_id
  JOIN teams t2 ON t2.id = sm.team2_id
  JOIN team_players tp2 ON tp2.team_id = t2.id
  JOIN player p2 ON p2.id = tp2.player_id
`;

export async function getMatchesBySeason(
  sql: Sql,
  seasonId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 ORDER BY sm.created DESC`,
    [seasonId],
  );
  return rows.map(toMatch);
}

export async function getMatchesByTeam(
  sql: Sql,
  seasonId: number,
  teamId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 AND (sm.team1_id = $2 OR sm.team2_id = $2) ORDER BY sm.created DESC`,
    [seasonId, teamId],
  );
  return rows.map(toMatch);
}

export async function getOpenMatches(
  sql: Sql,
  seasonId: number,
): Promise<Match[]> {
  const rows = await sql.unsafe(
    `SELECT ${MATCH_SELECT} ${MATCH_JOIN} WHERE sm.season_id = $1 AND sm.status IN ('challenged', 'date_set') ORDER BY sm.created DESC`,
    [seasonId],
  );
  return rows.map(toMatch);
}
```

**Step 3: Write tests for match.ts**

Create `app/lib/db/match.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { withTestDb } from "./test-helpers";
import {
  seedPlayer,
  seedClub,
  seedSeason,
  seedTeam,
  seedStandings,
  seedMatch,
} from "./seed";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  createChallenge,
  ChallengeConflictError,
  getMatchesBySeason,
  getMatchesByTeam,
  getOpenMatches,
} from "./match";

const db = withTestDb();

afterAll(() => db.cleanup());

// ── getTeamsWithOpenChallenge ──────────────────────────

describe("getTeamsWithOpenChallenge", () => {
  it("returns team IDs with open challenges", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "oc1@example.com");
      const p2 = await seedPlayer(tx, "oc2@example.com");
      const p3 = await seedPlayer(tx, "oc3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });
      await seedMatch(tx, seasonId, t3, t1, { status: "completed", winnerTeamId: t3 });

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams).toEqual(new Set([t1, t2]));
      expect(openTeams.has(t3)).toBe(false);
    });
  });

  it("includes date_set status", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ds1@example.com");
      const p2 = await seedPlayer(tx, "ds2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, { status: "date_set" });

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams).toEqual(new Set([t1, t2]));
    });
  });

  it("returns empty set when no open challenges", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const openTeams = await getTeamsWithOpenChallenge(tx, seasonId);
      expect(openTeams.size).toBe(0);
    });
  });

  it("scoped to season", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const s1 = await seedSeason(tx, clubId);
      const s2 = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "sc1@example.com");
      const p2 = await seedPlayer(tx, "sc2@example.com");
      const t1s1 = await seedTeam(tx, s1, [p1]);
      const t2s1 = await seedTeam(tx, s1, [p2]);
      const t1s2 = await seedTeam(tx, s2, [p1]);
      const t2s2 = await seedTeam(tx, s2, [p2]);

      await seedMatch(tx, s1, t1s1, t2s1, { status: "challenged" });

      const s1Open = await getTeamsWithOpenChallenge(tx, s1);
      const s2Open = await getTeamsWithOpenChallenge(tx, s2);
      expect(s1Open.size).toBe(2);
      expect(s2Open.size).toBe(0);
    });
  });
});

// ── getUnavailableTeamIds ──────────────────────────────

describe("getUnavailableTeamIds", () => {
  it("returns team IDs with currently unavailable players", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ua1@example.com");
      const p2 = await seedPlayer(tx, "ua2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      // Make p1 unavailable now
      await tx`
        UPDATE player SET
          unavailable_from = NOW() - interval '1 day',
          unavailable_until = NOW() + interval '7 days'
        WHERE id = ${p1}
      `;

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable).toEqual(new Set([t1]));
    });
  });

  it("excludes players whose unavailability has ended", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "past@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);

      // Unavailability in the past
      await tx`
        UPDATE player SET
          unavailable_from = NOW() - interval '14 days',
          unavailable_until = NOW() - interval '1 day'
        WHERE id = ${p1}
      `;

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable.size).toBe(0);
    });
  });

  it("returns empty set when no one is unavailable", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      await seedPlayer(tx, "avail@example.com");

      const unavailable = await getUnavailableTeamIds(tx, seasonId);
      expect(unavailable.size).toBe(0);
    });
  });
});

// ── createChallenge ────────────────────────────────────

describe("createChallenge", () => {
  it("creates match with challenged status and events", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ch1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "ch2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      const matchId = await createChallenge(
        tx, seasonId, clubId, t1, t2, p1, p2, "Saturday?",
      );

      expect(matchId).toBeGreaterThan(0);

      // Verify match
      const [match] = await tx`
        SELECT * FROM season_matches WHERE id = ${matchId}
      `;
      expect(match.status).toBe("challenged");
      expect(match.team1_id).toBe(t1);
      expect(match.team2_id).toBe(t2);
      expect(match.challenge_text).toBe("Saturday?");

      // Verify events
      const events = await tx`
        SELECT * FROM events WHERE match_id = ${matchId} ORDER BY id
      `;
      expect(events).toHaveLength(2);
      expect(events[0].event_type).toBe("challenge");
      expect(events[0].player_id).toBe(p1);
      expect(events[1].event_type).toBe("challenged");
      expect(events[1].target_player_id).toBe(p2);
    });
  });

  it("throws ChallengeConflictError if team already has open challenge", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "cf1@example.com");
      const p2 = await seedPlayer(tx, "cf2@example.com");
      const p3 = await seedPlayer(tx, "cf3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      // t1 already has open challenge against t2
      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      // t3 tries to challenge t1 — should fail
      await expect(
        createChallenge(tx, seasonId, clubId, t3, t1, p3, p1, ""),
      ).rejects.toThrow(ChallengeConflictError);
    });
  });

  it("allows challenge when existing matches are completed", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ok1@example.com");
      const p2 = await seedPlayer(tx, "ok2@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);

      await seedMatch(tx, seasonId, t1, t2, { status: "completed", winnerTeamId: t1 });

      const matchId = await createChallenge(
        tx, seasonId, clubId, t1, t2, p1, p2, "",
      );
      expect(matchId).toBeGreaterThan(0);
    });
  });
});

// ── getMatchesBySeason ─────────────────────────────────

describe("getMatchesBySeason", () => {
  it("returns all matches with player names", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "ms1@example.com", "Alice");
      const p2 = await seedPlayer(tx, "ms2@example.com", "Bob");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });

      const matches = await getMatchesBySeason(tx, seasonId);
      expect(matches).toHaveLength(1);
      expect(matches[0].team1Name).toBe("Alice");
      expect(matches[0].team2Name).toBe("Bob");
      expect(matches[0].status).toBe("challenged");
    });
  });

  it("returns empty array when no matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);

      const matches = await getMatchesBySeason(tx, seasonId);
      expect(matches).toEqual([]);
    });
  });
});

// ── getMatchesByTeam ───────────────────────────────────

describe("getMatchesByTeam", () => {
  it("returns only matches involving the team", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "mt1@example.com");
      const p2 = await seedPlayer(tx, "mt2@example.com");
      const p3 = await seedPlayer(tx, "mt3@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });
      await seedMatch(tx, seasonId, t2, t3, { status: "completed", winnerTeamId: t2 });

      const matches = await getMatchesByTeam(tx, seasonId, t2);
      expect(matches).toHaveLength(2);

      const matchesT3 = await getMatchesByTeam(tx, seasonId, t3);
      expect(matchesT3).toHaveLength(1);
    });
  });
});

// ── getOpenMatches ─────────────────────────────────────

describe("getOpenMatches", () => {
  it("returns only challenged and date_set matches", async () => {
    await db.withinTransaction(async (tx) => {
      const clubId = await seedClub(tx);
      const seasonId = await seedSeason(tx, clubId);
      const p1 = await seedPlayer(tx, "om1@example.com");
      const p2 = await seedPlayer(tx, "om2@example.com");
      const p3 = await seedPlayer(tx, "om3@example.com");
      const p4 = await seedPlayer(tx, "om4@example.com");
      const t1 = await seedTeam(tx, seasonId, [p1]);
      const t2 = await seedTeam(tx, seasonId, [p2]);
      const t3 = await seedTeam(tx, seasonId, [p3]);
      const t4 = await seedTeam(tx, seasonId, [p4]);

      await seedMatch(tx, seasonId, t1, t2, { status: "challenged" });
      await seedMatch(tx, seasonId, t3, t4, { status: "completed", winnerTeamId: t3 });

      const open = await getOpenMatches(tx, seasonId);
      expect(open).toHaveLength(1);
      expect(open[0].status).toBe("challenged");
    });
  });
});
```

**Step 4: Run tests**

Run: `bun run test:db -- app/lib/db/match.test.ts`

Expected: All tests pass.

**Step 5: Commit**

```bash
git add app/lib/db/match.ts app/lib/db/match.test.ts app/lib/db/seed.ts
git commit -m "feat: add match data layer with challenge creation and queries (US-CHAL-05)"
```

---

### Task 2: Server action — createChallengeAction

**Files:**
- Create: `app/lib/actions/challenge.ts`

**Context:** Follow the same pattern as `app/(auth)/join/actions.ts` and `app/(auth)/onboarding/actions.ts` — "use server" directive, return `{ error }` or `{ success }` objects (no throwing), use `revalidatePath` after mutations.

**Step 1: Write the server action**

Create `app/lib/actions/challenge.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getSeasonById, getPlayerTeamId, getStandingsWithPlayers } from "@/app/lib/db/season";
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
  createChallenge,
  ChallengeConflictError,
} from "@/app/lib/db/match";
import { canChallenge } from "@/app/lib/pyramid";

export type ChallengeResult =
  | { success: true; matchId: number }
  | { error: string };

export async function createChallengeAction(
  formData: FormData,
): Promise<ChallengeResult> {
  const seasonId = Number(formData.get("seasonId"));
  const challengeeTeamId = Number(formData.get("challengeeTeamId"));
  const challengeText = ((formData.get("challengeText") as string) ?? "").trim();

  if (!seasonId || !challengeeTeamId) {
    return { error: "challenge.error.invalidTarget" };
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "challenge.error.notEnrolled" };
  }

  const season = await getSeasonById(sql, seasonId);
  if (!season || season.status !== "active") {
    return { error: "challenge.error.notActive" };
  }

  const challengerTeamId = await getPlayerTeamId(sql, player.id, seasonId);
  if (!challengerTeamId) {
    return { error: "challenge.error.notEnrolled" };
  }

  // Get current standings to check pyramid rules
  const { players } = await getStandingsWithPlayers(sql, seasonId);
  const challengerRank = players.find((p) => p.teamId === challengerTeamId)?.rank;
  const challengeeRank = players.find((p) => p.teamId === challengeeTeamId)?.rank;

  if (!challengerRank || !challengeeRank) {
    return { error: "challenge.error.invalidTarget" };
  }

  if (!canChallenge(challengerRank, challengeeRank)) {
    return { error: "challenge.error.invalidTarget" };
  }

  // Check open challenges
  const openTeams = await getTeamsWithOpenChallenge(sql, seasonId);
  if (openTeams.has(challengerTeamId) || openTeams.has(challengeeTeamId)) {
    return { error: "challenge.error.openChallenge" };
  }

  // Check unavailability
  const unavailable = await getUnavailableTeamIds(sql, seasonId);
  if (unavailable.has(challengerTeamId) || unavailable.has(challengeeTeamId)) {
    return { error: "challenge.error.unavailable" };
  }

  // Find challengee player ID for the event
  const challengeePlayer = players.find((p) => p.teamId === challengeeTeamId);
  if (!challengeePlayer) {
    return { error: "challenge.error.invalidTarget" };
  }

  try {
    const matchId = await sql.begin(async (tx) => {
      return createChallenge(
        tx,
        seasonId,
        season.clubId,
        challengerTeamId,
        challengeeTeamId,
        player.id,
        challengeePlayer.playerId,
        challengeText,
      );
    });

    revalidatePath("/rankings");
    revalidatePath("/matches");

    return { success: true, matchId };
  } catch (e) {
    if (e instanceof ChallengeConflictError) {
      return { error: "challenge.error.openChallenge" };
    }
    throw e;
  }
}
```

**Step 2: Commit**

```bash
git add app/lib/actions/challenge.ts
git commit -m "feat: add createChallengeAction server action with full validation (US-CHAL-05)"
```

---

### Task 3: i18n — add challenge and matches translation keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/de.json`

**Context:** The locale files already have `challenge` and `match` namespaces with some keys. We need to add missing keys for the challenge sheet flow, FAB disabled state, match list page, and validation errors.

**Step 1: Add missing keys to en.json**

Add these keys to the existing `"challenge"` namespace (merge with existing):

```json
"challenge": {
  "title": "Challenge",
  "rank": "Rank {rank}",
  "messageLabel": "Message (optional)",
  "messagePlaceholder": "e.g. Are you free on Saturday?",
  "submit": "Send Challenge",
  "selectSeason": "Which season?",
  "selectOpponent": "Who do you want to challenge?",
  "challengeableHeading": "Players you can challenge:",
  "noOpponents": "No one available?",
  "noOpponentsDesc": "Players may be on vacation or already in an open challenge.",
  "confirmTitle": "Challenge {name}?",
  "fabDisabledMessage": "You already have an open challenge in this season.",
  "error": {
    "notActive": "This season is no longer active.",
    "notEnrolled": "You are not enrolled in this season.",
    "invalidTarget": "You cannot challenge this player.",
    "openChallenge": "One of you already has an open challenge.",
    "unavailable": "This player is currently unavailable."
  }
}
```

Add a new `"matches"` namespace:

```json
"matches": {
  "title": "Matches",
  "tabMy": "My",
  "tabAll": "All",
  "tabOpen": "Open",
  "sectionOpen": "Open Challenges",
  "sectionCompleted": "Completed",
  "noMatches": "No matches",
  "noMatchesDesc": "Challenge a player to get started.",
  "noMyMatches": "No matches yet",
  "noMyMatchesDesc": "Your matches will appear here.",
  "noOpenMatches": "No open challenges",
  "noOpenMatchesDesc": "All challenges have been resolved.",
  "challenger": "Challenger",
  "vs": "vs"
}
```

**Step 2: Add same keys to de.json**

```json
"challenge": {
  "title": "Herausfordern",
  "rank": "Rang {rank}",
  "messageLabel": "Nachricht (optional)",
  "messagePlaceholder": "z.B. Hast du am Samstag Zeit?",
  "submit": "Herausfordern",
  "selectSeason": "Welche Saison?",
  "selectOpponent": "Wen möchtest du herausfordern?",
  "challengeableHeading": "Spieler, die du herausfordern kannst:",
  "noOpponents": "Niemand verfügbar?",
  "noOpponentsDesc": "Spieler sind evtl. im Urlaub oder haben bereits eine offene Forderung.",
  "confirmTitle": "{name} herausfordern?",
  "fabDisabledMessage": "Du hast bereits eine offene Forderung in dieser Saison.",
  "error": {
    "notActive": "Diese Saison ist nicht mehr aktiv.",
    "notEnrolled": "Du bist nicht in dieser Saison eingeschrieben.",
    "invalidTarget": "Du kannst diesen Spieler nicht herausfordern.",
    "openChallenge": "Einer von euch hat bereits eine offene Forderung.",
    "unavailable": "Dieser Spieler ist derzeit nicht verfügbar."
  }
}
```

```json
"matches": {
  "title": "Spiele",
  "tabMy": "Meine",
  "tabAll": "Alle",
  "tabOpen": "Offen",
  "sectionOpen": "Offene Forderungen",
  "sectionCompleted": "Abgeschlossen",
  "noMatches": "Keine Spiele",
  "noMatchesDesc": "Fordere einen Spieler heraus, um loszulegen.",
  "noMyMatches": "Noch keine Spiele",
  "noMyMatchesDesc": "Deine Spiele erscheinen hier.",
  "noOpenMatches": "Keine offenen Forderungen",
  "noOpenMatchesDesc": "Alle Forderungen wurden abgeschlossen.",
  "challenger": "Herausforderer",
  "vs": "vs"
}
```

**Step 3: Commit**

```bash
git add messages/en.json messages/de.json
git commit -m "feat: add i18n keys for challenge flow and match list"
```

---

### Task 4: ChallengeSheet component

**Files:**
- Create: `components/domain/challenge-sheet.tsx`

**Context:** Use `ResponsiveDialog` (from `components/responsive-dialog.tsx`), `DataList` (from `components/data-list.tsx`), `FormField` (from `components/form-field.tsx`), `Avatar` (from `components/ui/avatar.tsx`), `Button` (from `components/ui/button.tsx`). The sheet manages its own step state internally. Uses `useTransition` for pending state on form submission, calling `createChallengeAction` directly.

**Step 1: Create the ChallengeSheet**

Create `components/domain/challenge-sheet.tsx`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createChallengeAction } from "@/app/lib/actions/challenge";

type Opponent = {
  teamId: number;
  name: string;
  rank: number;
  avatarSrc?: string | null;
};

type ChallengeSheetProps = {
  open: boolean;
  onClose: () => void;
  target?: Opponent | null;
  opponents: Opponent[];
  seasonId: number;
  seasons?: { id: number; name: string }[];
};

type Step = "season" | "pick" | "confirm";

function ChallengeSheet({
  open,
  onClose,
  target,
  opponents,
  seasonId: initialSeasonId,
  seasons,
}: ChallengeSheetProps) {
  const t = useTranslations("challenge");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Opponent | null>(
    target ?? null,
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);

  const needsSeasonPicker = seasons && seasons.length > 1;

  const initialStep: Step = target
    ? "confirm"
    : needsSeasonPicker
      ? "season"
      : "pick";
  const [step, setStep] = useState<Step>(initialStep);

  function handleClose() {
    setStep(initialStep);
    setSelectedTarget(target ?? null);
    setSelectedSeasonId(initialSeasonId);
    setError(null);
    onClose();
  }

  function handleSelectSeason(seasonId: number) {
    setSelectedSeasonId(seasonId);
    setStep("pick");
  }

  function handleSelectOpponent(opponent: Opponent) {
    setSelectedTarget(opponent);
    setStep("confirm");
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createChallengeAction(formData);
      if ("error" in result) {
        setError(t(result.error));
      } else {
        handleClose();
      }
    });
  }

  const title =
    step === "season"
      ? t("selectSeason")
      : step === "pick"
        ? t("selectOpponent")
        : selectedTarget
          ? t("confirmTitle", { name: selectedTarget.name })
          : t("title");

  return (
    <ResponsiveDialog open={open} onClose={handleClose} title={title}>
      {step === "season" && seasons && (
        <div className="space-y-2 p-4">
          {seasons.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSeason(s.id)}
              className="w-full rounded-xl bg-white p-4 text-left text-sm font-medium text-slate-900 ring-1 ring-slate-200 transition-shadow hover:shadow-sm dark:bg-slate-900 dark:text-white dark:ring-slate-800"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {step === "pick" && (
        <div className="p-4">
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("challengeableHeading")}
          </p>
          <DataList
            items={opponents}
            keyExtractor={(o) => o.teamId}
            empty={{
              title: t("noOpponents"),
              description: t("noOpponentsDesc"),
            }}
            renderItem={(opponent) => (
              <button
                onClick={() => handleSelectOpponent(opponent)}
                className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Avatar name={opponent.name} src={opponent.avatarSrc} size="sm" />
                <span className="flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                  {opponent.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("rank", { rank: opponent.rank })}
                </span>
              </button>
            )}
          />
        </div>
      )}

      {step === "confirm" && selectedTarget && (
        <form action={handleSubmit} className="space-y-4 p-4">
          <input type="hidden" name="seasonId" value={selectedSeasonId} />
          <input type="hidden" name="challengeeTeamId" value={selectedTarget.teamId} />

          <div className="flex items-center gap-3">
            <Avatar name={selectedTarget.name} src={selectedTarget.avatarSrc} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedTarget.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("rank", { rank: selectedTarget.rank })}
              </p>
            </div>
          </div>

          <FormField
            type="textarea"
            label={t("messageLabel")}
            placeholder={t("messagePlaceholder")}
            inputProps={{ name: "challengeText", rows: 2 }}
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={step === "confirm" && !target ? () => setStep("pick") : handleClose}
              className="flex-1"
            >
              {step === "confirm" && !target ? "\u2190" : t.rich ? undefined : undefined}
              {/* Use common.cancel */}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-court-500 text-white hover:bg-court-600"
            >
              {isPending ? "..." : t("submit")}
            </Button>
          </div>
        </form>
      )}
    </ResponsiveDialog>
  );
}

export { ChallengeSheet };
export type { ChallengeSheetProps, Opponent };
```

**Important implementation note:** The cancel button text should use `useTranslations("common")("cancel")`. The back arrow in the confirm step (when coming from pick) should go back to pick. When coming from a direct pyramid tap (target is pre-set), cancel should close. Adjust the button logic accordingly during implementation.

**Step 2: Commit**

```bash
git add components/domain/challenge-sheet.tsx
git commit -m "feat: add ChallengeSheet multi-step dialog (US-CHAL-01, US-CHAL-02)"
```

---

### Task 5: MatchCard component

**Files:**
- Create: `components/domain/match-card.tsx`

**Context:** Use `Avatar` (from `components/ui/avatar.tsx`), `Badge` (from `components/ui/badge.tsx`). The card shows both players, status badge, and optional score. Status badge varies based on whether the viewer is involved in the match (for `pending_confirmation` and `disputed`).

**Step 1: Create MatchCard**

Create `components/domain/match-card.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/app/lib/db/match";

type MatchCardProps = {
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score?: number[] | null;
  team2Score?: number[] | null;
  created: Date;
  isInvolved?: boolean;
  onClick?: () => void;
  className?: string;
};

function getStatusDisplay(
  status: MatchStatus,
  isInvolved: boolean,
  t: (key: string) => string,
): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "challenged":
      return { label: t("statusChallenged"), variant: "pending" };
    case "date_set":
      return { label: t("statusDateSet"), variant: "info" };
    case "pending_confirmation":
      return isInvolved
        ? { label: t("statusPendingConfirmation"), variant: "pending" }
        : { label: t("statusDateSet"), variant: "info" };
    case "disputed":
      return isInvolved
        ? { label: t("statusDisputed"), variant: "loss" }
        : { label: t("statusChallenged"), variant: "pending" };
    case "completed":
      return { label: t("statusCompleted"), variant: "win" };
    case "withdrawn":
      return { label: t("statusWithdrawn"), variant: "subtle" };
    case "forfeited":
      return { label: t("statusForfeited"), variant: "loss" };
  }
}

function formatScore(team1Score: number[], team2Score: number[]): string {
  return team1Score.map((s, i) => `${s}-${team2Score[i]}`).join(", ");
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MatchCard({
  team1Name,
  team2Name,
  status,
  team1Score,
  team2Score,
  created,
  isInvolved = false,
  onClick,
  className,
}: MatchCardProps) {
  const t = useTranslations("match");
  const { label, variant } = getStatusDisplay(status, isInvolved, t);

  const hasScore =
    team1Score && team2Score && team1Score.length > 0 && team2Score.length > 0;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex w-full items-center gap-3 px-1 py-3 text-left",
        "transition-colors duration-150",
        onClick && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar name={team1Name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {team1Name}
            <span className="mx-1.5 text-slate-400">vs</span>
            {team2Name}
          </p>
          {hasScore && (
            <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {formatScore(team1Score, team2Score)}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={variant} size="sm">
          {label}
        </Badge>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {timeAgo(created)}
        </span>
      </div>
    </button>
  );
}

export { MatchCard };
export type { MatchCardProps };
```

**Step 2: Commit**

```bash
git add components/domain/match-card.tsx
git commit -m "feat: add MatchCard component with status badges (US-CHAL-07)"
```

---

### Task 6: Match list page

**Files:**
- Create: `app/(main)/matches/page.tsx`
- Create: `app/(main)/matches/matches-view.tsx`

**Context:** Follow the exact same pattern as the rankings page (`app/(main)/rankings/page.tsx` + `rankings-view.tsx`). Server component fetches data, client component handles tabs and rendering.

**Step 1: Create the server component page**

Create `app/(main)/matches/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerClubs } from "@/app/lib/db/club";
import { getActiveSeasons, getSeasonById, getPlayerTeamId } from "@/app/lib/db/season";
import { getMatchesBySeason } from "@/app/lib/db/match";
import { MatchesView } from "./matches-view";
import type { Season } from "@/app/lib/db/season";

type MatchesPageProps = {
  searchParams: Promise<{ season?: string }>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const { season: seasonParam } = await searchParams;

  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const clubs = await getPlayerClubs(sql, player.id);
  if (clubs.length === 0) redirect("/join");

  const clubId = clubs[0].clubId;

  const seasons = await getActiveSeasons(sql, clubId);

  if (seasons.length === 0) {
    return (
      <MatchesView
        seasons={[]}
        currentSeasonId={null}
        matches={[]}
        currentTeamId={null}
      />
    );
  }

  let season: Season | null = null;
  if (seasonParam) {
    const id = parseInt(seasonParam, 10);
    if (!Number.isNaN(id) && id > 0) {
      season = await getSeasonById(sql, id);
    }
  }
  if (!season || season.clubId !== clubId) {
    season = seasons[0];
  }

  const [matches, currentTeamId] = await Promise.all([
    getMatchesBySeason(sql, season.id),
    getPlayerTeamId(sql, player.id, season.id),
  ]);

  return (
    <MatchesView
      seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
      currentSeasonId={season.id}
      matches={matches.map((m) => ({
        id: m.id,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        status: m.status,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        created: m.created.toISOString(),
      }))}
      currentTeamId={currentTeamId}
    />
  );
}
```

**Step 2: Create the client view**

Create `app/(main)/matches/matches-view.tsx`:

```typescript
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SwordsIcon } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/tabs";
import { DataList } from "@/components/data-list";
import { MatchCard } from "@/components/domain/match-card";
import { SeasonSelector } from "@/components/domain/season-selector";
import type { MatchStatus } from "@/app/lib/db/match";

type SerializedMatch = {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score: number[] | null;
  team2Score: number[] | null;
  created: string; // ISO string — Date objects can't cross server/client boundary
};

type MatchesViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  matches: SerializedMatch[];
  currentTeamId: number | null;
};

const OPEN_STATUSES: MatchStatus[] = ["challenged", "date_set", "pending_confirmation", "disputed"];

function isOpen(status: MatchStatus) {
  return OPEN_STATUSES.includes(status);
}

function isInvolvedMatch(match: SerializedMatch, teamId: number | null) {
  if (!teamId) return false;
  return match.team1Id === teamId || match.team2Id === teamId;
}

export function MatchesView({
  seasons,
  currentSeasonId,
  matches,
  currentTeamId,
}: MatchesViewProps) {
  const t = useTranslations("matches");
  const tMatch = useTranslations("match");
  const router = useRouter();

  const seasonAction =
    seasons.length > 1 ? (
      <SeasonSelector
        seasons={seasons}
        value={currentSeasonId ?? undefined}
        onChange={(id) => router.push(`/matches?season=${id}`)}
      />
    ) : null;

  const myMatches = useMemo(
    () => matches.filter((m) => isInvolvedMatch(m, currentTeamId)),
    [matches, currentTeamId],
  );

  const openMatches = useMemo(
    () => matches.filter((m) => isOpen(m.status)),
    [matches],
  );

  function renderMatchList(
    items: SerializedMatch[],
    emptyTitle: string,
    emptyDesc: string,
  ) {
    return (
      <DataList
        items={items}
        keyExtractor={(m) => m.id}
        empty={{ title: emptyTitle, description: emptyDesc }}
        renderItem={(m) => (
          <MatchCard
            team1Name={m.team1Name}
            team2Name={m.team2Name}
            status={m.status}
            team1Score={m.team1Score}
            team2Score={m.team2Score}
            created={new Date(m.created)}
            isInvolved={isInvolvedMatch(m, currentTeamId)}
          />
        )}
      />
    );
  }

  return (
    <PageLayout title={t("title")} action={seasonAction}>
      <Tabs
        items={[
          {
            label: t("tabMy"),
            content: renderMatchList(myMatches, t("noMyMatches"), t("noMyMatchesDesc")),
          },
          {
            label: t("tabAll"),
            content: renderMatchList(matches, t("noMatches"), t("noMatchesDesc")),
          },
          {
            label: t("tabOpen"),
            content: renderMatchList(openMatches, t("noOpenMatches"), t("noOpenMatchesDesc")),
          },
        ]}
      />
    </PageLayout>
  );
}
```

**Implementation note:** The import `SwordsIcon` from `lucide-react` — check if lucide-react is installed. If not, use a Heroicons icon instead (e.g. `BoltIcon`). The empty state icon is optional so can be omitted if no good match.

**Step 3: Commit**

```bash
git add app/(main)/matches/page.tsx app/(main)/matches/matches-view.tsx
git commit -m "feat: add match list page with My/All/Open tabs (US-CHAL-07)"
```

---

### Task 7: Rankings page — enriched challengeable filtering + ChallengeSheet integration

**Files:**
- Modify: `app/(main)/rankings/page.tsx`
- Modify: `app/(main)/rankings/rankings-view.tsx`

**Context:** The rankings page currently computes challengeable variants using only pyramid rules (`canChallenge`). We need to also factor in open challenges and unavailability. Then wire up `RankingsView` to open the `ChallengeSheet` when a challengeable player is tapped.

**Step 1: Update rankings page.tsx to fetch open challenges + unavailability**

In `app/(main)/rankings/page.tsx`, add imports for the new match functions and enrich the variant computation:

```typescript
// Add to imports:
import {
  getTeamsWithOpenChallenge,
  getUnavailableTeamIds,
} from "@/app/lib/db/match";
```

Change the parallel fetch to include the new data:

```typescript
const [standingsData, winsLossesMap, openChallengeTeams, unavailableTeams] =
  await Promise.all([
    getStandingsWithPlayers(sql, season.id),
    getTeamWinsLosses(sql, season.id),
    getTeamsWithOpenChallenge(sql, season.id),
    getUnavailableTeamIds(sql, season.id),
  ]);
```

Update the variant logic in `pyramidPlayers` mapping to account for open challenges and unavailability:

```typescript
const variant =
  p.teamId === currentTeamId
    ? ("current" as const)
    : unavailableTeams.has(p.teamId)
      ? ("unavailable" as const)
      : currentPlayerRank !== null &&
          canChallenge(currentPlayerRank, p.rank) &&
          !openChallengeTeams.has(p.teamId) &&
          !openChallengeTeams.has(currentTeamId!) &&
          !unavailableTeams.has(currentTeamId!)
        ? ("challengeable" as const)
        : openChallengeTeams.has(p.teamId)
          ? ("challenged" as const)
          : ("default" as const);
```

Same logic for `standingsPlayers.challengeable`:

```typescript
const challengeable =
  currentPlayerRank !== null &&
  canChallenge(currentPlayerRank, p.rank) &&
  !openChallengeTeams.has(p.teamId) &&
  !openChallengeTeams.has(currentTeamId!) &&
  !unavailableTeams.has(p.teamId) &&
  !unavailableTeams.has(currentTeamId!);
```

Add new props to `RankingsView`:

```typescript
return (
  <RankingsView
    seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
    currentSeasonId={season.id}
    clubName={clubName}
    pyramidPlayers={pyramidPlayers}
    standingsPlayers={standingsPlayers}
    currentPlayerTeamId={currentTeamId}
    hasOpenChallenge={currentTeamId !== null && openChallengeTeams.has(currentTeamId)}
  />
);
```

**Step 2: Update RankingsView to manage ChallengeSheet**

In `app/(main)/rankings/rankings-view.tsx`:

- Add state for ChallengeSheet open/close and selected target
- Pass `onPlayerClick` to `PyramidGrid` and `StandingsTable`
- Render `ChallengeSheet` at the bottom
- Handle `?challenge=true` URL param to auto-open in FAB mode

```typescript
// New imports:
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChallengeSheet, type Opponent } from "@/components/domain/challenge-sheet";

// Updated props type:
type RankingsViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  clubName: string;
  pyramidPlayers: PyramidPlayer[];
  standingsPlayers: StandingsPlayer[];
  currentPlayerTeamId: number | null;
  hasOpenChallenge: boolean;
};
```

Inside the component, add:

```typescript
const searchParams = useSearchParams();
const [challengeOpen, setChallengeOpen] = useState(false);
const [challengeTarget, setChallengeTarget] = useState<Opponent | null>(null);

// Auto-open from FAB navigation (?challenge=true)
useEffect(() => {
  if (searchParams.get("challenge") === "true") {
    setChallengeTarget(null);
    setChallengeOpen(true);
    // Clean URL without re-render
    window.history.replaceState(null, "", "/rankings" + (currentSeasonId ? `?season=${currentSeasonId}` : ""));
  }
}, [searchParams, currentSeasonId]);

const opponents: Opponent[] = pyramidPlayers
  .filter((p) => p.variant === "challengeable")
  .map((p) => ({ teamId: p.id as number, name: p.name, rank: p.rank }));

function handlePlayerClick(player: { id: string | number; variant?: string; name: string; rank: number }) {
  if (player.variant === "challengeable") {
    setChallengeTarget({ teamId: player.id as number, name: player.name, rank: player.rank });
    setChallengeOpen(true);
  } else {
    router.push(`/player/${player.id}`);
  }
}
```

Pass `onPlayerClick` to `PyramidGrid` and `StandingsTable`:

```typescript
<PyramidGrid players={pyramidPlayers} onPlayerClick={handlePlayerClick} />
<StandingsTable players={standingsPlayers} onPlayerClick={handlePlayerClick} />
```

Render ChallengeSheet at the end, before the closing `</PageLayout>`:

```typescript
{currentSeasonId && (
  <ChallengeSheet
    open={challengeOpen}
    onClose={() => { setChallengeOpen(false); setChallengeTarget(null); }}
    target={challengeTarget}
    opponents={opponents}
    seasonId={currentSeasonId}
    seasons={seasons.length > 1 ? seasons : undefined}
  />
)}
```

**Step 3: Commit**

```bash
git add app/(main)/rankings/page.tsx app/(main)/rankings/rankings-view.tsx
git commit -m "feat: enrich challengeable filtering + wire ChallengeSheet in rankings (US-CHAL-01, US-CHAL-05)"
```

---

### Task 8: FAB wiring + navigation

**Files:**
- Modify: `app/(main)/layout.tsx`
- Modify: `app/(main)/app-shell-wrapper.tsx`

**Context:** The FAB needs to know if the current player has an open challenge to show the disabled state. This data comes from the layout (server component) and is passed down as a prop. The FAB click navigates to `/rankings?challenge=true` to trigger the ChallengeSheet.

**Step 1: Update layout.tsx to pass hasOpenChallenge**

In `app/(main)/layout.tsx`, add the data fetching:

```typescript
// Add imports:
import { getActiveSeasons, getPlayerTeamId } from "../lib/db/season";
import { getTeamsWithOpenChallenge } from "../lib/db/match";
```

After the clubs redirect, add:

```typescript
// Check if player has open challenge (for FAB state)
const activeSeasons = await getActiveSeasons(sql, clubs[0].clubId);
let hasOpenChallenge = false;
if (activeSeasons.length > 0) {
  const firstSeason = activeSeasons[0];
  const teamId = await getPlayerTeamId(sql, player.id, firstSeason.id);
  if (teamId) {
    const openTeams = await getTeamsWithOpenChallenge(sql, firstSeason.id);
    hasOpenChallenge = openTeams.has(teamId);
  }
}
```

Pass to AppShellWrapper:

```typescript
<AppShellWrapper
  player={{ id: player.id, name: player.name }}
  clubs={clubs.map((c) => ({ id: c.clubId, name: c.clubName }))}
  hasOpenChallenge={hasOpenChallenge}
>
  {children}
</AppShellWrapper>
```

**Step 2: Update AppShellWrapper to wire FAB**

In `app/(main)/app-shell-wrapper.tsx`:

Update props type:

```typescript
type AppShellWrapperProps = {
  player: { id: number; name: string };
  clubs: [Club, ...Club[]];
  hasOpenChallenge: boolean;
  children: React.ReactNode;
};
```

Update the destructuring and add the Swords nav item for matches:

```typescript
import {
  TrophyIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
// Consider adding a swords/bolt icon for matches nav
```

Add matches to navItems:

```typescript
const navItems = [
  { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
  { icon: <BellIcon />, label: t("news"), href: "/feed" },
];
// Note: The spec shows matches as position 4 in bottom nav, but the current nav
// only has 2 items + FAB. Add matches to the nav items:
```

Actually, looking at the nav spec more carefully — the bottom nav is: Feed, Rankings, FAB, Matches, Profile. Let me adjust:

```typescript
const navItems = [
  { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
  { icon: <BellIcon />, label: t("news"), href: "/feed" },
];
```

For now, keep the existing 2-item nav but update sidebar to include matches. The bottom nav layout may need a larger refactor to support 4 items + FAB center. For this task, focus on:

1. Making FAB functional (not disabled)
2. Adding `/matches` to sidebar navigation

Wire FAB onClick:

```typescript
const [fabToastShown, setFabToastShown] = useState(false);

fab={{
  icon: <PlusIcon />,
  label: t("challenge"),
  onClick: () => {
    if (hasOpenChallenge) {
      // Show message — for now use a simple alert-like approach
      // TODO: Replace with toast component when available
      setFabToastShown(true);
      setTimeout(() => setFabToastShown(false), 3000);
    } else {
      router.push("/rankings?challenge=true");
    }
  },
  disabled: false,
}}
```

Add a toast/message display for the FAB disabled message. A simple approach using the `useTranslations("challenge")` hook for `fabDisabledMessage`.

**Step 3: Commit**

```bash
git add app/(main)/layout.tsx app/(main)/app-shell-wrapper.tsx
git commit -m "feat: wire FAB for challenge flow + disabled state (US-CHAL-02, US-CHAL-06)"
```

---

### Task 9: Add matches to navigation

**Files:**
- Modify: `app/(main)/app-shell-wrapper.tsx`

**Context:** Add the `/matches` route to both the bottom nav and sidebar so users can navigate to the match list page.

**Step 1: Add matches nav item**

Add to the nav and sidebar items in `app-shell-wrapper.tsx`. Use an appropriate icon — check what Heroicons icons are available. `BoltIcon` or `FireIcon` could work, or use `ListBulletIcon`. The spec mentions "Swords" but Heroicons doesn't have that. Use `BoltIcon` from `@heroicons/react/24/outline` as a placeholder.

Add to `navItems`:

```typescript
import { BoltIcon } from "@heroicons/react/24/outline";

// Update navItems to match the spec order: Rankings, Feed (currently), add Matches
const navItems = [
  { icon: <TrophyIcon />, label: t("ranking"), href: "/rankings" },
  { icon: <BoltIcon />, label: t("matches"), href: "/matches" },
];
```

Add "matches" key to nav translations — check if it already exists. The `ranking.matches` key exists as "Matches"/"Spiele" but we need `nav.matches`. Add:

In `messages/en.json` under `"nav"`:
```json
"matches": "Matches"
```

In `messages/de.json` under `"nav"`:
```json
"matches": "Spiele"
```

Also add `/matches` to sidebarItems.

**Step 2: Commit**

```bash
git add app/(main)/app-shell-wrapper.tsx messages/en.json messages/de.json
git commit -m "feat: add matches to navigation (US-CHAL-07)"
```

---

### Task 10: Lint, test, and verify

**Step 1: Run linting**

Run: `bun run lint`

Fix any linting errors.

**Step 2: Run DB integration tests**

Run: `bun run test:db`

Ensure all existing tests still pass + new match tests pass.

**Step 3: Run the dev server and verify manually**

Run: `bun run dev`

Check:
- `/rankings` — challengeable indicators account for open challenges + unavailability
- Tapping a challengeable player opens ChallengeSheet at confirm step
- FAB navigates to `/rankings?challenge=true` and opens ChallengeSheet at pick step
- FAB shows message when player has open challenge
- `/matches` page loads with tabs
- Navigation includes matches link

**Step 4: Fix any issues found**

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: address lint and integration issues for challenge flow"
```
