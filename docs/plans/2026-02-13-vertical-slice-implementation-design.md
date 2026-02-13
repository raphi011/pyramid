# Vertical Slice Implementation Design

**Date:** 2026-02-13
**Status:** Approved

---

## Philosophy

Build one user story at a time, following the 9-phase order from `docs/testing-strategy.mdx`. For each story:

1. Write DB repository functions needed
2. Write DB integration tests (must pass before repo function is used anywhere)
3. Build API route / server action
4. Build UI (components + page)
5. Write Storybook interaction tests
6. Write Playwright e2e tests
7. All tests pass → next story

**Exception:** The full DB schema deploys upfront (all 15 tables in one migration). Only the repository layer grows incrementally.

---

## Migration System

### Structure

```
db/
├── migrations/
│   └── 001_initial_schema.sql   # Full schema from database.mdx
├── migrate.ts                    # Migration runner
└── seed.ts                       # Test seed data
```

### Runner

- `migrate.ts` connects to Postgres, creates `schema_migrations` table if absent
- Runs `.sql` files not yet applied, sorted numerically by filename
- Each migration tracked by filename in `schema_migrations`
- `--reset` flag drops all tables and re-runs from scratch

### Scripts

```json
"db:migrate": "bun run db/migrate.ts",
"db:seed": "bun run db/seed.ts",
"db:reset": "bun run db/migrate.ts --reset"
```

### Docker Compose

```yaml
services:
  db:
    image: postgres:17-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: pyramid_dev
      POSTGRES_USER: pyramid
      POSTGRES_PASSWORD: pyramid
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Port 5433 host → 5432 container (avoids local Postgres conflict).

---

## DB Repository Testing (Layer 0)

### Rule

**No repository function may be used in an API route or server action until its DB integration test passes.**

### Structure

```
app/lib/db/
├── __tests__/          # DB integration tests
│   ├── auth.test.ts
│   ├── clubs.test.ts
│   └── ...
├── auth.ts             # Auth repo functions
├── clubs.ts            # Club repo functions
└── index.ts            # Re-exports connection
```

### Isolation

Tests use transaction rollback: each test wraps in `BEGIN` / `ROLLBACK`. No data leaks between tests.

### Runner

Vitest with a separate project config (no Storybook browser mode). Runs against the Dockerized Postgres.

---

## Implementation Phases

| Phase | Stories | Key DB Tables |
|-------|---------|--------------|
| 1. Auth | AUTH-01→05, 09, 10 | `player`, `magic_links`, `sessions` |
| 2. Club Join | AUTH-06, 08 | `clubs`, `club_members`, `teams`, `team_players`, `season_standings`, `events` |
| 3. Rankings | RANK-01→04 | `season_standings`, `seasons`, `teams`, `season_matches` |
| 4. Challenge | CHAL-01, 05, 09 | `season_matches`, `events` |
| 5. Match Lifecycle | CHAL-10→13, 19 | `date_proposals`, `season_matches`, `season_standings`, `events` |
| 6. Feed | FEED-01, 05→07 | `events`, `event_reads` |
| 7. Profile | PROF-01→02, 04→05 | `player`, `season_matches` |
| 8. Admin | ADMIN-01→03, 08 | `seasons`, `clubs`, `club_members`, `player`, `events` |
| 9. Polish | Remaining P1/P2 | Various |

Each phase completes fully (all tests green) before the next begins.
