# DB Migration & Testing Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up the full database schema via migration, Docker Compose for local Postgres, and add a DB integration test layer to the testing strategy.

**Architecture:** Plain SQL migration files run by a custom bun script that tracks applied migrations in a `schema_migrations` table. Docker Compose provides a local Postgres 17 instance. Vitest gets a second project config ("db") for running repository integration tests against real Postgres with transaction-based isolation.

**Tech Stack:** PostgreSQL 17, postgres.js, Docker Compose, Vitest, Bun

---

### Task 1: Create Docker Compose for local Postgres

**Files:**
- Create: `docker-compose.yml`

**Step 1: Write `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:17-alpine
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: pyramid_dev
      POSTGRES_USER: pyramid
      POSTGRES_PASSWORD: pyramid
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pyramid -d pyramid_dev"]
      interval: 2s
      timeout: 5s
      retries: 10

volumes:
  pgdata:
```

**Step 2: Start the container and verify it's running**

Run: `docker compose up -d && docker compose ps`
Expected: Service `db` is running, healthy.

**Step 3: Verify connectivity**

Run: `docker compose exec db psql -U pyramid -d pyramid_dev -c "SELECT 1"`
Expected: Returns `1`.

**Step 4: Create `.env.local` with the DB connection string**

Create `.env.local`:
```
DATABASE_URL=postgres://pyramid:pyramid@localhost:5433/pyramid_dev
```

**Step 5: Commit**

```bash
git add docker-compose.yml .env.local
git commit -m "Add Docker Compose for local Postgres development

Port 5433 on host to avoid conflicts with local Postgres installs.
Healthcheck ensures container is ready before connections."
```

---

### Task 2: Create the migration runner

**Files:**
- Create: `db/migrate.ts`

**Step 1: Write the migration runner**

`db/migrate.ts`:

```ts
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sql`SELECT filename FROM schema_migrations`;
  return new Set(rows.map((r) => r.filename));
}

async function reset() {
  console.log("Resetting database...");
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("Schema dropped and recreated.");
}

async function migrate() {
  const isReset = process.argv.includes("--reset");

  if (isReset) {
    await reset();
  }

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    console.log(`Applying: ${file}`);
    const filePath = join(migrationsDir, file);
    const content = await Bun.file(filePath).text();

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    });

    count++;
  }

  if (count === 0) {
    console.log("No new migrations to apply.");
  } else {
    console.log(`Applied ${count} migration(s).`);
  }

  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

**Step 2: Create the `db/migrations/` directory**

Run: `mkdir -p db/migrations`

**Step 3: Test the runner with no migrations (dry run)**

Run: `bun run db/migrate.ts`
Expected: "No new migrations to apply."

**Step 4: Test the reset flag**

Run: `bun run db/migrate.ts --reset`
Expected: "Resetting database..." → "Schema dropped and recreated." → "No new migrations to apply."

**Step 5: Commit**

```bash
git add db/migrate.ts
git commit -m "Add database migration runner

Tracks applied migrations in schema_migrations table.
Supports --reset flag for full schema rebuild."
```

---

### Task 3: Write `001_initial_schema.sql`

**Files:**
- Create: `db/migrations/001_initial_schema.sql`

This is the full schema from `docs/database.mdx` translated to SQL. All 15 tables, all indexes, all constraints.

**Step 1: Write the migration file**

`db/migrations/001_initial_schema.sql`:

```sql
-- 001_initial_schema.sql
-- Full database schema for Pyramid app
-- Source of truth: docs/database.mdx

-----------------------------------------------
-- 1. clubs
-----------------------------------------------
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    phone_number TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    logo_data BYTEA,
    is_disabled BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 2. player
-----------------------------------------------
CREATE TABLE player (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL DEFAULT '',
    email_address TEXT NOT NULL UNIQUE,
    photo_data BYTEA,
    bio TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'auto',
    is_app_admin BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL,
    unavailable_from TIMESTAMPTZ,
    unavailable_until TIMESTAMPTZ,
    unavailable_reason TEXT NOT NULL DEFAULT ''
);

-----------------------------------------------
-- 3. club_members
-----------------------------------------------
CREATE TABLE club_members (
    player_id INT NOT NULL REFERENCES player(id),
    club_id INT NOT NULL REFERENCES clubs(id),
    role TEXT NOT NULL DEFAULT 'player',
    created TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (player_id, club_id)
);

-----------------------------------------------
-- 4. seasons
-----------------------------------------------
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    club_id INT NOT NULL REFERENCES clubs(id),
    name TEXT NOT NULL,
    min_team_size INT NOT NULL DEFAULT 1,
    max_team_size INT NOT NULL DEFAULT 1,
    best_of INT NOT NULL DEFAULT 3,
    match_deadline_days INT NOT NULL DEFAULT 14,
    reminder_after_days INT NOT NULL DEFAULT 7,
    requires_result_confirmation BOOL NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 5. teams
-----------------------------------------------
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    season_id INT NOT NULL REFERENCES seasons(id),
    name TEXT NOT NULL DEFAULT '',
    opted_out BOOL NOT NULL DEFAULT false,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 6. team_players
-----------------------------------------------
CREATE TABLE team_players (
    team_id INT NOT NULL REFERENCES teams(id),
    player_id INT NOT NULL REFERENCES player(id),
    created TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (team_id, player_id)
);

-----------------------------------------------
-- 7. season_matches
-----------------------------------------------
CREATE TABLE season_matches (
    id SERIAL PRIMARY KEY,
    season_id INT NOT NULL REFERENCES seasons(id),
    team1_id INT NOT NULL REFERENCES teams(id),
    team2_id INT NOT NULL REFERENCES teams(id),
    winner_team_id INT REFERENCES teams(id),
    result_entered_by INT REFERENCES player(id),
    result_entered_at TIMESTAMPTZ,
    confirmed_by INT REFERENCES player(id),
    team1_score INT[],
    team2_score INT[],
    status TEXT NOT NULL,
    challenge_text TEXT NOT NULL DEFAULT '',
    disputed_reason TEXT NOT NULL DEFAULT '',
    game_at TIMESTAMPTZ,
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 8. match_comments
-----------------------------------------------
CREATE TABLE match_comments (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES season_matches(id),
    player_id INT NOT NULL REFERENCES player(id),
    comment TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL,
    edited_at TIMESTAMPTZ
);

-----------------------------------------------
-- 9. date_proposals
-----------------------------------------------
CREATE TABLE date_proposals (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES season_matches(id),
    proposed_by INT NOT NULL REFERENCES player(id),
    proposed_datetime TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 10. season_standings
-----------------------------------------------
CREATE TABLE season_standings (
    id SERIAL PRIMARY KEY,
    season_id INT REFERENCES seasons(id),
    match_id INT REFERENCES season_matches(id),
    results INT[] NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created TIMESTAMPTZ NOT NULL
);

-----------------------------------------------
-- 11. events
-----------------------------------------------
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    club_id INT NOT NULL REFERENCES clubs(id),
    season_id INT REFERENCES seasons(id),
    match_id INT REFERENCES season_matches(id),
    player_id INT REFERENCES player(id),
    target_player_id INT REFERENCES player(id),
    event_type TEXT NOT NULL,
    metadata JSONB,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-----------------------------------------------
-- 12. event_reads
-----------------------------------------------
CREATE TABLE event_reads (
    player_id INT NOT NULL REFERENCES player(id),
    club_id INT NOT NULL REFERENCES clubs(id),
    last_read_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (player_id, club_id)
);

-----------------------------------------------
-- 13. notification_preferences
-----------------------------------------------
CREATE TABLE notification_preferences (
    player_id INT PRIMARY KEY REFERENCES player(id),
    email_enabled BOOL NOT NULL DEFAULT true,
    challenge_emails BOOL NOT NULL DEFAULT true,
    result_emails BOOL NOT NULL DEFAULT true,
    reminder_emails BOOL NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-----------------------------------------------
-- 14. magic_links
-----------------------------------------------
CREATE TABLE magic_links (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL UNIQUE REFERENCES player(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- 15. sessions
-----------------------------------------------
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------
-- Indexes
-----------------------------------------------
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_events_club_feed ON events(club_id, created DESC);
CREATE INDEX idx_events_personal ON events(target_player_id, created DESC);
CREATE INDEX idx_events_global_feed ON events(created DESC);
CREATE INDEX idx_matches_season_status ON season_matches(season_id, status);
CREATE INDEX idx_matches_team1 ON season_matches(team1_id);
CREATE INDEX idx_matches_team2 ON season_matches(team2_id);
CREATE INDEX idx_standings_latest ON season_standings(season_id, created DESC);
```

**Step 2: Run the migration**

Run: `bun run db/migrate.ts`
Expected: "Applying: 001_initial_schema.sql" → "Applied 1 migration(s)."

**Step 3: Verify all 15 tables were created**

Run: `docker compose exec db psql -U pyramid -d pyramid_dev -c "\dt"`
Expected: 16 tables listed (15 app tables + `schema_migrations`).

**Step 4: Verify idempotency — run again**

Run: `bun run db/migrate.ts`
Expected: "No new migrations to apply."

**Step 5: Verify reset + re-apply**

Run: `bun run db/migrate.ts --reset`
Expected: "Resetting database..." → "Applying: 001_initial_schema.sql" → "Applied 1 migration(s)."

**Step 6: Commit**

```bash
git add db/migrations/001_initial_schema.sql
git commit -m "Add initial database schema migration

All 15 tables from docs/database.mdx: clubs, player, club_members,
seasons, teams, team_players, season_matches, match_comments,
date_proposals, season_standings, events, event_reads,
notification_preferences, magic_links, sessions.
Includes all indexes for query performance."
```

---

### Task 4: Add `db:*` scripts to `package.json`

**Files:**
- Modify: `package.json`

**Step 1: Add the db scripts**

Add these three entries to `"scripts"` in `package.json`:

```json
"db:migrate": "bun run db/migrate.ts",
"db:reset": "bun run db/migrate.ts --reset",
"db:seed": "bun run db/seed.ts"
```

**Step 2: Verify the scripts work**

Run: `bun run db:migrate`
Expected: "No new migrations to apply." (already applied from Task 3).

Run: `bun run db:reset`
Expected: Reset + re-apply output.

**Step 3: Commit**

```bash
git add package.json
git commit -m "Add db:migrate, db:reset, db:seed scripts"
```

---

### Task 5: Delete the old `app/db.sql`

**Files:**
- Delete: `app/db.sql`

**Step 1: Delete the outdated schema file**

The old `app/db.sql` is superseded by `db/migrations/001_initial_schema.sql`. It uses `VARCHAR` instead of `TEXT`, `TIMESTAMP` instead of `TIMESTAMPTZ`, is missing 9 of 15 tables, and has wrong FK structure (player-based instead of team-based).

Run: `rm app/db.sql`

**Step 2: Commit**

```bash
git add -A app/db.sql
git commit -m "Remove outdated app/db.sql

Superseded by db/migrations/001_initial_schema.sql which matches
the canonical schema in docs/database.mdx."
```

---

### Task 6: Add DB integration test infrastructure to Vitest

**Files:**
- Modify: `vitest.config.ts`
- Create: `app/lib/db/__tests__/setup.ts`

**Step 1: Add the "db" project to `vitest.config.ts`**

Add a second project entry to the existing `projects` array in `vitest.config.ts`:

```ts
{
  extends: true,
  test: {
    name: "db",
    include: ["app/lib/db/__tests__/**/*.test.ts"],
    environment: "node",
    pool: "forks",
    setupFiles: ["./app/lib/db/__tests__/setup.ts"],
  },
},
```

This runs DB tests in Node.js (not browser), using forks for isolation.

**Step 2: Write the test setup file**

`app/lib/db/__tests__/setup.ts`:

```ts
import { beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

beforeAll(async () => {
  // Verify DB is reachable
  const [{ result }] = await sql`SELECT 1 as result`;
  if (result !== 1) {
    throw new Error(
      "Database not reachable. Run: docker compose up -d && bun run db:migrate",
    );
  }
});

afterAll(async () => {
  await sql.end();
});

export { sql };
```

**Step 3: Write a smoke test to verify the setup**

Create `app/lib/db/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

describe("database smoke test", () => {
  const sql = postgres(DATABASE_URL);

  afterAll(async () => {
    await sql.end();
  });

  it("connects to the database", async () => {
    const [{ result }] = await sql`SELECT 1 as result`;
    expect(result).toBe(1);
  });

  it("has all 15 app tables", async () => {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tableNames = tables.map((t) => t.table_name);

    expect(tableNames).toContain("clubs");
    expect(tableNames).toContain("player");
    expect(tableNames).toContain("club_members");
    expect(tableNames).toContain("seasons");
    expect(tableNames).toContain("teams");
    expect(tableNames).toContain("team_players");
    expect(tableNames).toContain("season_matches");
    expect(tableNames).toContain("match_comments");
    expect(tableNames).toContain("date_proposals");
    expect(tableNames).toContain("season_standings");
    expect(tableNames).toContain("events");
    expect(tableNames).toContain("event_reads");
    expect(tableNames).toContain("notification_preferences");
    expect(tableNames).toContain("magic_links");
    expect(tableNames).toContain("sessions");
  });
});
```

**Step 4: Add the test command to `package.json`**

Add to `"scripts"`:

```json
"test:db": "vitest --project db --run"
```

**Step 5: Run the smoke test**

Run: `bun run test:db`
Expected: 2 tests pass (connects + has all 15 tables).

**Step 6: Commit**

```bash
git add vitest.config.ts app/lib/db/__tests__/setup.ts app/lib/db/__tests__/smoke.test.ts package.json
git commit -m "Add DB integration test infrastructure

New Vitest 'db' project runs against real Postgres.
Smoke test verifies connectivity and all 15 tables exist."
```

---

### Task 7: Create DB test helper for transaction-based isolation

**Files:**
- Create: `app/lib/db/__tests__/helpers.ts`

**Step 1: Write the test helper**

`app/lib/db/__tests__/helpers.ts`:

```ts
import postgres, { type Sql } from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

/**
 * Creates a transactional test context. Each test gets a fresh
 * transaction that is rolled back after the test completes.
 * This ensures zero data leakage between tests.
 *
 * Usage:
 *   const { sql, setup, teardown } = createTestContext();
 *   beforeEach(async () => { await setup(); });
 *   afterEach(async () => { await teardown(); });
 *   afterAll(async () => { await sql.end(); });
 *
 *   it("does something", async () => {
 *     const tx = getTestTransaction();
 *     await tx`INSERT INTO player ...`;
 *   });
 */

let _testTx: postgres.TransactionSql | null = null;
let _reservedConnection: ReturnType<Sql["reserve"]> | null = null;

export function createTestContext() {
  const sql = postgres(DATABASE_URL);

  return {
    sql,
    async setup() {
      _reservedConnection = await sql.reserve();
      // @ts-expect-error -- postgres.js reserves return a callable sql
      _testTx = await new Promise<postgres.TransactionSql>((resolve) => {
        // @ts-expect-error
        _reservedConnection`BEGIN`.then(() => resolve(_reservedConnection));
      });
    },
    async teardown() {
      if (_reservedConnection) {
        // @ts-expect-error
        await _reservedConnection`ROLLBACK`;
        // @ts-expect-error
        _reservedConnection.release();
        _reservedConnection = null;
        _testTx = null;
      }
    },
  };
}

/**
 * Simpler approach: wraps each test in a savepoint.
 * Use this when tests share setup data within a describe block.
 */
export function withTestDb() {
  const sql = postgres(DATABASE_URL);

  return {
    sql,
    async cleanup() {
      await sql.end();
    },
    /**
     * Runs a function within a transaction that gets rolled back.
     * Use this for each test to ensure isolation.
     */
    async withinTransaction<T>(
      fn: (tx: postgres.TransactionSql) => Promise<T>,
    ): Promise<T> {
      let result: T;
      try {
        await sql.begin("READ WRITE", async (tx) => {
          result = await fn(tx);
          throw new RollbackError();
        });
      } catch (e) {
        if (!(e instanceof RollbackError)) throw e;
      }
      return result!;
    },
  };
}

class RollbackError extends Error {
  constructor() {
    super("ROLLBACK");
  }
}
```

**Step 2: Write a test to verify the helper works**

Add to `app/lib/db/__tests__/smoke.test.ts`:

```ts
import { withTestDb } from "./helpers";

describe("transaction isolation", () => {
  const db = withTestDb();

  afterAll(async () => {
    await db.cleanup();
  });

  it("rolls back inserts after test", async () => {
    // Insert inside transaction
    await db.withinTransaction(async (tx) => {
      await tx`
        INSERT INTO player (name, email_address, created)
        VALUES ('Test Player', 'isolation-test@example.com', NOW())
      `;
      const [row] = await tx`
        SELECT name FROM player WHERE email_address = 'isolation-test@example.com'
      `;
      expect(row.name).toBe("Test Player");
    });

    // Verify it was rolled back
    const rows = await db.sql`
      SELECT * FROM player WHERE email_address = 'isolation-test@example.com'
    `;
    expect(rows).toHaveLength(0);
  });
});
```

**Step 3: Run the tests**

Run: `bun run test:db`
Expected: All 3 tests pass (connectivity, tables, transaction isolation).

**Step 4: Commit**

```bash
git add app/lib/db/__tests__/helpers.ts app/lib/db/__tests__/smoke.test.ts
git commit -m "Add DB test helper with transaction-based isolation

withinTransaction() wraps each test in a transaction that rolls back,
ensuring zero data leakage between tests."
```

---

### Task 8: Update testing strategy doc

**Files:**
- Modify: `docs/testing-strategy.mdx`

**Step 1: Update the intro line**

Change line 7 from:
```
Two-layer testing approach: **Storybook interaction tests** for UI behavior and **Playwright e2e tests** for full-stack flows.
```
to:
```
Three-layer testing approach: **DB integration tests** for repository functions, **Storybook interaction tests** for UI behavior, and **Playwright e2e tests** for full-stack flows.
```

**Step 2: Insert "Layer 0: DB Integration Tests" section before Layer 1 (before line 11)**

Insert this block between line 9 (`---`) and line 11 (`## Layer 1`):

```mdx
## Layer 0: DB Integration Tests

Repository-level tests that run against a real Dockerized PostgreSQL instance.

**What they test:**
- Every repository function (SELECT, INSERT, UPDATE, DELETE)
- Query correctness (joins, filters, edge cases)
- Constraint enforcement (unique, FK, NOT NULL)
- Transaction behavior

**How they work:**
- Tests run in Vitest "db" project (Node.js, not browser)
- Each test uses `withinTransaction()` helper — wraps in a transaction that rolls back after assertions
- Tests live in `app/lib/db/__tests__/`, one file per domain
- Requires Docker Compose Postgres running + migrations applied

**Commands:**

```bash
docker compose up -d          # Start Postgres
bun run db:migrate            # Apply migrations
bun run test:db               # Run DB integration tests
```

**Gate rule:** No repository function may be used in an API route or server action until its DB integration test passes. This ensures every database call is verified before it enters the application layer.

**Example:**

```ts
import { withTestDb } from "./helpers";

describe("auth repository", () => {
  const db = withTestDb();
  afterAll(() => db.cleanup());

  it("creates and verifies a magic link", async () => {
    await db.withinTransaction(async (tx) => {
      // Seed a player
      const [player] = await tx`
        INSERT INTO player (name, email_address, created)
        VALUES ('Alice', 'alice@example.com', NOW())
        RETURNING id
      `;

      // Create magic link
      await tx`
        INSERT INTO magic_links (player_id, token, expires_at)
        VALUES (${player.id}, 'test-token-123', NOW() + INTERVAL '15 minutes')
      `;

      // Verify atomic delete-and-return
      const [link] = await tx`
        DELETE FROM magic_links
        WHERE token = 'test-token-123' AND expires_at > NOW()
        RETURNING player_id
      `;
      expect(link.player_id).toBe(player.id);
    });
  });
});
```

---
```

**Step 3: Update the "When to Use Which Layer" table**

Add DB integration test rows to the table (insert before the Storybook rows):

```
| Repository function returns correct data | DB Integration |
| Constraint violations (duplicate email, missing FK) | DB Integration |
| Complex queries (joins, aggregations, array ops) | DB Integration |
```

**Step 4: Update the "File Structure" section**

Add DB test files to the tree:

```
├── app/lib/db/                 # Database repository layer
│   ├── __tests__/              # DB integration tests (Layer 0)
│   │   ├── setup.ts            # Test setup (DB connectivity check)
│   │   ├── helpers.ts          # Transaction isolation helpers
│   │   ├── smoke.test.ts       # Schema verification
│   │   ├── auth.test.ts        # Auth repo tests
│   │   └── ...
│   ├── auth.ts                 # Auth repository functions
│   ├── clubs.ts                # Club repository functions
│   └── index.ts                # DB connection re-export
```

**Step 5: Update the "Database for E2E Tests" section**

Replace the "Not yet set up" placeholder (lines 185-195) with:

```mdx
## Database Setup

### Local Development & Testing

PostgreSQL runs via Docker Compose:

```bash
docker compose up -d          # Start Postgres on port 5433
bun run db:migrate            # Apply all migrations
bun run db:reset              # Drop + re-apply (full reset)
```

**Connection:** `postgres://pyramid:pyramid@localhost:5433/pyramid_dev`

Set in `.env.local`:
```
DATABASE_URL=postgres://pyramid:pyramid@localhost:5433/pyramid_dev
```

### Seed Data

`db/seed.ts` provides test fixtures for e2e tests: known players, clubs, seasons.

### Test Isolation

- **DB integration tests:** Transaction rollback per test (zero data leakage)
- **E2E tests:** Reset to seed state via `beforeAll`

### CI

Postgres service container in GitHub Actions, same Docker image.
```

**Step 6: Update the CI Integration section**

Insert `bun run test:db` as step 3 (before Storybook tests):

```
1. bun install
2. bun run lint                    # ESLint
3. bun run test:db                 # DB integration tests
4. bun run test:ci                 # Storybook interaction tests
5. bun run build                   # Next.js build
6. bun run test:e2e                # Playwright e2e (against built app)
7. bun run chromatic               # Visual regression (Chromatic)
```

Steps 3 and 4 can run in parallel. Step 6 depends on step 5.

**Step 7: Commit**

```bash
git add docs/testing-strategy.mdx
git commit -m "Add Layer 0 (DB integration tests) to testing strategy

Three-layer testing: DB integration → Storybook → Playwright.
Gate rule: every repo function must have a passing DB test before use.
Updated file structure, CI pipeline, and database setup sections."
```

---

### Task 9: Add `.env.local` to `.gitignore` (if not already)

**Files:**
- Modify: `.gitignore`

**Step 1: Check if `.env.local` is already in `.gitignore`**

Read `.gitignore`, search for `.env.local` or `.env*.local`.

**Step 2: Add if missing**

If not present, add:
```
# Local environment
.env.local
```

Next.js `.gitignore` templates typically include this, but verify.

**Step 3: Commit (if changed)**

```bash
git add .gitignore
git commit -m "Ensure .env.local is gitignored"
```

---

### Task 10: Final verification — full reset cycle

**Files:** None (verification only)

**Step 1: Full reset cycle**

```bash
docker compose down -v && docker compose up -d
sleep 3
bun run db:reset
bun run test:db
```

Expected: All tests pass against a fresh database.

**Step 2: Verify table count**

Run: `docker compose exec db psql -U pyramid -d pyramid_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"`
Expected: `16` (15 app tables + `schema_migrations`)
