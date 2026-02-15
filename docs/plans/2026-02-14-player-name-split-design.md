# Design: Split player name into first_name + last_name

## Problem
Player name is a single `TEXT` field. Splitting into first/last makes abbreviation cleaner (no string parsing) and enforces both parts are present.

## Changes

### Database (`001_initial_schema.sql`)
Replace `name TEXT NOT NULL` with:
- `first_name TEXT NOT NULL`
- `last_name TEXT NOT NULL`

No migration — recreate DB with `db:reset` + `db:seed`.

### Utilities (`lib/utils.ts`)
- `abbreviateName(firstName, lastName)` → `"Anna M."` (uses fields directly, no splitting)
- `fullName(firstName, lastName)` → `"Anna Müller"` (convenience helper)

### Types
All types with `name: string` → `firstName: string` + `lastName: string`:
- `Player`, `PlayerProfile` (db/auth.ts)
- `RankedPlayer` (db/season.ts)
- `PyramidPlayer` (pyramid-grid.tsx)
- `StandingsPlayer` (standings-table.tsx)
- Match-related types with player names (match.ts, match-detail-view.tsx)
- Event types with player refs (event-item.tsx, event-mapper.ts)
- `SerializedMatch` in rankings-view.tsx

### SQL Queries
- SELECT: `p.first_name`, `p.last_name` (or concatenate with `||` where only full name needed)
- INSERT/UPDATE: two separate fields

### UI
- Onboarding form: two fields (Vorname, Nachname), both required
- Profile edit: two fields
- Display: `fullName()` for full display, `abbreviateName()` for compact (pyramid grid)

### Seed Data (`db/seed.ts`)
Split existing names: `{ name: "Anna Müller" }` → `{ firstName: "Anna", lastName: "Müller" }`

## Abbreviation Format
`"Firstname L."` — same as current, but derived from actual fields instead of string parsing.
