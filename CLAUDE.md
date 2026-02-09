# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tennis pyramid ranking system ("Pyramiden Rangliste") - a Next.js 14 app for managing challenge-based tennis club rankings.

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

## Code Conventions

- "use client" directive on interactive components
- German UI text (e.g., "Fordern" = Challenge, "Abmelden" = Logout)
- Accessibility: 44x44px touch targets, aria-hidden, sr-only
- TypeScript errors currently ignored in build (`next.config.mjs`)

## Environment Variables

Required for production:
- `DATABASE_URL` - Neon connection string
- `RESEND_API_KEY` - Resend API key for emails
- `APP_URL` - Application base URL (e.g., `https://pyramid.example.com`)
