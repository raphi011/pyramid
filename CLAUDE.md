# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sport-agnostic pyramid ranking system — a Next.js 14 app for managing challenge-based club rankings. Supports multiple clubs, seasons, individual and team pyramids.

## Specification Docs

- `docs/design-system.md` — Full design system: colors, typography, component library, composition rules. **Read before any UI work.**
- `docs/ui-spec.md` — Complete UI specification: pages, layouts, navigation, user flows. **Read before building any page.**

## Development Commands

```bash
pnpm install   # Install dependencies
pnpm run dev   # Start dev server at http://localhost:3000
pnpm run build # Production build
pnpm run lint  # ESLint
```

## Architecture

### Tech Stack
- Next.js 14.2 (App Router) with TypeScript
- Tailwind CSS + Headless UI + Framer Motion
- Neon (serverless Postgres) for database
- Resend for transactional emails
- Vercel deployment (Analytics/Speed Insights integrated)

### Key Files
- `app/page.tsx` - Home page with mock data (standings, matches, events)
- `app/pyramid.tsx` - Core pyramid visualization and challenge logic
- `app/navigation.tsx` - Main layout with sidebar
- `app/db.sql` - Database schema
- `app/lib/auth.ts` - Authentication (magic links, sessions)
- `app/lib/db.ts` - Database connection wrapper
- `app/lib/email.ts` - Email sending via Resend
- `middleware.ts` - Route protection

### Database Schema (`app/db.sql`)

**Core tables:**
- `clubs` - Tennis clubs
- `player` - Players with columns: `id`, `name`, `phone_number`, `email_address`, `created`, `unavailable_*`
- `seasons` - Season definitions per club
- `season_players` - Player-season membership (with admin flag)
- `season_matches` - Match records
- `season_standings` - Ranking snapshots

**Auth tables:**
- `magic_links` - One-time login tokens (UNIQUE on `player_id` for single active link)
- `sessions` - Database-backed sessions for revocability

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

### Component Library (`app/components/`)
TailwindUI-inspired components using forwardRef pattern for polymorphism:
- Components accept `href` prop to render as Link, otherwise render as Button
- Use `clsx` for conditional class merging
- Define styles as objects with base/variant/color arrays
- Example: `<Button color="cyan">` or `<Button href="/path">` or `<Button outline>`

### Challenge Rules (Business Logic)
In `app/pyramid.tsx`:
- `canChallenge(standings, challengerId, challengeeId)` - determines valid challenges
- Players can challenge: left in same row, right in row above
- Rank 3 can challenge ranks 1 and 2
- Formula: `maxRank = challengerRank + 1 - floor((1 + sqrt(8 * challengerRank - 7)) / 2)`

### Data Structures
```typescript
// Player in standings
{ id, name, challangable, available, won, lost }

// Match
{ player1, player2, status, winner_id, scores: [[p1_set_score, p2_set_score], ...] }

// Event types: challenge, result, withdrawal, new_player, season_start, season_end
```

## Design System & Frontend

**Read `docs/design-system.md` before any frontend/UI work.** It contains the full color palette, component catalog, and composition patterns.

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

## Deployment

Hosted on **Vercel** (project: `raphi011s-projects/deployment`).

```bash
vercel --prod   # Deploy to production
```

Production URL: https://deployment-flax-ten.vercel.app

Vercel auto-detects Next.js settings. No `vercel.json` needed. Environment variables are configured in the Vercel dashboard.

## Environment Variables

Required for production (set in Vercel dashboard):
- `DATABASE_URL` - Neon connection string
- `RESEND_API_KEY` - Resend API key for emails
- `APP_URL` - Application base URL (e.g., `https://pyramid.example.com`)
