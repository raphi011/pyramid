# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sport-agnostic pyramid ranking system — a Next.js 16 app for managing challenge-based club rankings. Supports multiple clubs, seasons, individual and team pyramids.

## Specification Docs

All docs are MDX files hosted in Storybook (`bun storybook` → "Docs" sidebar group).

- `docs/design-system.mdx` — Full design system: colors, typography, component library, composition rules. **Read before any UI work.**
- `docs/ui-spec.mdx` — Complete UI specification: pages, layouts, navigation, user flows. **Read before building any page.**
- `docs/a11y-guide.mdx` — Accessibility best practices, common violations, and Storybook a11y testing gotchas. **Read before adding components or stories.**
- `docs/database.mdx` — Full database schema: tables, enums, relationships, business rules, migration notes. **Read before any backend or data-layer work.**
- `docs/user-stories.mdx` — All user stories: flows, preconditions, steps, edge cases. **Read before implementing features or writing e2e tests.**
- `docs/component-architecture.mdx` — Three-layer component architecture, import rules, composition patterns.
- `docs/testing-strategy.mdx` — Four-layer testing approach: unit tests, DB integration, Storybook interaction, Playwright e2e. **Read before writing tests.**
- `docs/gotchas.mdx` — Framework-specific pitfalls: Next.js, postgres.js, JSON/i18n, security patterns. **Read when debugging unexpected behavior.**

## Development Commands

```bash
bun install           # Install dependencies
bun run dev           # Start dev server at http://localhost:3000
bun run build         # Production build
bun run lint          # ESLint (runs `eslint .` — see note below)
bun storybook         # Start Storybook at http://localhost:6006
bun run test          # Storybook interaction tests (watch mode)
bun run test:ci       # Storybook tests (single run, for CI)
bun run test:db       # DB integration + unit tests (requires Postgres)
bun run test:e2e      # Playwright e2e tests (headless)
bun run test:e2e:ui   # Playwright e2e tests (interactive UI)
bun run db:migrate    # Apply database migrations
bun run db:reset      # Drop + re-apply all migrations
bun run db:seed       # Seed test data
```

### Local Database

```bash
docker compose up -d  # Start Postgres 17 on port 5433
bun run db:migrate    # Apply migrations
```

Connection: `postgres://pyramid:pyramid@localhost:5433/pyramid_dev` (set in `.env.local`).

### Linting

Next.js 16 removed `next lint`. Linting uses ESLint 9 directly via `eslint.config.mjs` (flat config).

- **Config:** `eslint.config.mjs` — imports `eslint-config-next` (flat config array)
- **Command:** `bun run lint` (runs `eslint .`)
- **ESLint version:** 9.x — do **not** upgrade to ESLint 10; `eslint-plugin-react` is incompatible with ESLint 10 (`getFilename` API removed). Track [jsx-eslint/eslint-plugin-react#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977) for updates.
- **Known pre-existing warnings:** `react-hooks/rules-of-hooks` in some Storybook stories (using `useState` in CSF `render` functions) — harmless, Storybook pattern.

## Architecture

### Tech Stack
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS + Headless UI + Framer Motion
- PostgreSQL via `postgres.js` driver
- Nodemailer for transactional emails
- Vercel deployment (Analytics/Speed Insights integrated)

### Key Files
- `app/page.tsx` - Home page with mock data (standings, matches, events)
- `app/pyramid.tsx` - Core pyramid visualization and challenge logic
- `app/navigation.tsx` - Main layout with sidebar
- `db/migrations/001_initial_schema.sql` - Full database schema (15 tables)
- `db/migrate.ts` - Migration runner
- `app/lib/auth.ts` - Authentication (magic links, sessions)
- `app/lib/db.ts` - Database connection wrapper
- `app/lib/email.ts` - Email sending via Nodemailer
- `middleware.ts` - Route protection

### Database Schema

See `docs/database.mdx` for full schema. Key tables:

- `clubs` / `club_members` — Club definitions and player membership with roles
- `player` — Player accounts (global across clubs)
- `seasons` / `teams` / `team_players` — Season config, team rosters, player assignment
- `season_matches` / `match_comments` / `date_proposals` — Match lifecycle
- `season_standings` — Ranking snapshots (append-only)
- `events` / `event_reads` / `notification_preferences` — Activity feed and notifications
- `magic_links` / `sessions` — Auth (passwordless magic links)

### Authentication System

Magic link (passwordless) authentication:
1. User enters email → `POST /api/auth/login`
2. If player exists, magic link emailed (15min expiry)
3. User clicks link → `GET /api/auth/verify?token=...`
4. Token verified atomically (DELETE+RETURNING), session created (7 days)
5. Session cookie set (`session_token`, httpOnly, secure in prod)

**Security features:**
- Email enumeration protection (always returns success)
- One-time tokens (atomic delete on verify)
- Single active magic link per user (UPSERT pattern)
- Form-based logout (CSRF protection)

### Component Library (`components/`)
Three-layer architecture (see `docs/component-architecture.mdx`):
- `components/ui/` — Layer 1: shadcn/ui primitives, themed to Court palette
- `components/` — Layer 2: Composites (Card, DataList, FormField, ResponsiveDialog, etc.)
- `components/domain/` — Layer 3: Domain-specific (PyramidGrid, MatchRow, EventItem, etc.)

### Challenge Rules (Business Logic)
In `app/pyramid.tsx`:
- `canChallenge(standings, challengerId, challengeeId)` - determines valid challenges
- Players can challenge: left in same row, right in row above
- Rank 3 can challenge ranks 1 and 2
- Formula: `maxRank = challengerRank + 1 - floor((1 + sqrt(8 * challengerRank - 7)) / 2)`

### Data Structures
```typescript
// Team in standings (teams are uniform — 1-person for individual, multi-person for doubles)
{ id, name, opted_out }

// Match (always references teams, not players directly)
{ team1_id, team2_id, status, winner_team_id, team1_score: int[], team2_score: int[] }

// Event types: challenge, challenged, result, result_entered, withdrawal, forfeit,
//   date_proposed, date_accepted, new_player, season_start, season_end, unavailable, announcement, ...
```

## Design System & Frontend

**Read `docs/design-system.mdx` before any frontend/UI work.** It contains the full color palette, component catalog, and composition patterns.

Key rules (always enforce):
- **Theme "Court"**: primary = `court-*` (green), accent = `trophy-*` (gold), neutrals = `slate-*` only
- **Never use `gray-*` or `zinc-*`** — always `slate-*`
- **Never use `border`** — use `ring-1 ring-slate-200` (no layout shift)
- **Component library**: shadcn/ui primitives (`components/ui/`) → composites (`components/`) → domain (`components/domain/`)
- **Pages only import from `components/domain/` and `components/`** — never from `components/ui/` directly
- **Every list** uses `DataList` with `loading` + `empty` props — no bare `.map()`
- **Every modal** uses `ResponsiveDialog` — never raw `Dialog` or `Sheet`
- **Every form** uses `FormField` — never raw `Label` + `Input`
- **Destructive actions** always use `ConfirmDialog`
- Mobile-first: bottom sheet on mobile, centered dialog on desktop
- `rounded-xl` for interactive elements, `rounded-2xl` for cards

## Code Conventions

- "use client" directive on interactive components
- German UI text (e.g., "Fordern" = Challenge, "Abmelden" = Logout)
- Accessibility: 44x44px touch targets, aria-hidden, sr-only
- TypeScript errors currently ignored in build (`next.config.mjs`)
- **Colocated tests**: test files live next to the module they test (e.g. `auth.ts` + `auth.test.ts`), not in `__tests__/` directories

## Deployment

Hosted on **Vercel** (project: `raphi011s-projects/deployment`).

```bash
vercel --prod   # Deploy to production
```

Production URL: https://deployment-flax-ten.vercel.app

Vercel auto-detects Next.js settings. No `vercel.json` needed. Environment variables are configured in the Vercel dashboard.

## Database Conventions

- **`TEXT` over `VARCHAR`** — no length-limited string columns
- **`NOT NULL DEFAULT ''` over nullable strings** — where no semantic difference between `NULL` and `''`, prefer `NOT NULL DEFAULT ''` to avoid null checks in app code

## Framework Gotchas (Quick Reference)

See `docs/gotchas.mdx` for full details. Key pitfalls:

- **`searchParams` is a `Promise`** (Next.js 15+) — must `await` in server components
- **Typographic quotes in JSON** — use `\u201E` / `\u201C` for German `„"` quotes, not raw characters
- **`redirect()` throws** — don't call inside try/catch or it gets swallowed
- **`returnTo` validation** — must start with `/`, block `//` and `:` to prevent open redirects
- **Repo functions accept `Sql | TransactionSql`** — pass `tx` inside `sql.begin()` callbacks

## Environment Variables

Required for production (set in Vercel dashboard):
- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_*` - SMTP credentials for Nodemailer
- `APP_URL` - Application base URL (e.g., `https://pyramid.example.com`)
