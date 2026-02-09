# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tennis pyramid ranking system ("Pyramiden Rangliste") - a Next.js 14 app for managing challenge-based tennis club rankings.

## Development Commands

```bash
npm run dev    # Start dev server at http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint
```

## Architecture

### Tech Stack
- Next.js 14.2 (App Router) with TypeScript
- Tailwind CSS + Headless UI + Framer Motion
- Vercel deployment (Analytics/Speed Insights integrated)

### Key Files
- `app/page.tsx` - Home page with mock data (standings, matches, events)
- `app/pyramid.tsx` - Core pyramid visualization and challenge logic
- `app/navigation.tsx` - Main layout with sidebar
- `app/db.sql` - Database schema (clubs, players, seasons, matches, standings)

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
- German UI text (e.g., "Fordern" = Challenge)
- Accessibility: 44x44px touch targets, aria-hidden, sr-only
- TypeScript errors currently ignored in build (`next.config.mjs`)
