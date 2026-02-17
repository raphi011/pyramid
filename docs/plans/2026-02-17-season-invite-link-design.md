# Season Invite Link Design

## Goal

Allow club admins to generate a shareable link (and QR code) for a season. Anyone with the link can join that season directly — whether they're a new user, an existing player not logged in, or an authenticated club member.

## Decisions

- **Link creator**: Club admins only
- **Link lifetime**: Valid as long as season is active + open_enrollment = true (no separate expiry)
- **Link format**: Dedicated `invite_code` column on `seasons` table (6-char uppercase alphanumeric, same format as clubs)
- **New user auth**: Email verification required via magic link before joining
- **Approach**: Dedicated `/season/join` route (Approach A)
- **Link previews**: OG meta tags for WhatsApp, Signal, iMessage, Telegram, Slack

## Database

New migration: add `invite_code` to `seasons` table.

```sql
ALTER TABLE seasons ADD COLUMN invite_code TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX seasons_invite_code_unique
  ON seasons (invite_code) WHERE invite_code != '';
```

- Partial unique index (excludes empty string) so existing rows don't conflict
- New seasons get a generated 6-char code on creation
- Backfill existing active seasons with generated codes

## URL

```
{APP_URL}/season/join?code=XYZ123
```

## OG Meta Tags (Link Previews)

`generateMetadata()` in `page.tsx` looks up season + club by invite code:

- `og:title` → `"[Season Name] beitreten"`
- `og:description` → `"[Club Name] — Tritt der Saison bei"`
- `og:image` → Club image URL if available, else default Pyramid OG image
- `og:type` → `website`

Page must be server-renderable without auth (OG crawlers have no session cookie).

## Route Structure

```
app/(auth)/season/join/
  page.tsx                 — Server component: generateMetadata + render SeasonJoinFlow
  season-join-flow.tsx     — Client state machine
  actions.ts               — Server actions
```

## User Flows

### Case A: Authenticated, already club member

1. Open link → see season/club info + "Beitreten" button
2. Click → enroll in season (reuse existing enrollment logic)
3. Redirect to `/rankings`

### Case B: Authenticated, NOT club member

1. Open link → see season/club info + "Beitreten" button
2. Click → join club + enroll in season (single transaction)
3. Redirect to `/rankings`

### Case C: Existing player, not logged in

1. Open link → see season/club info + first name, last name, email fields
2. Enter info → magic link sent with `returnTo=/season/join?code=XYZ123`
3. Click magic link → authenticated → redirected back
4. Now Case A or B

### Case D: Brand new user

1. Open link → see season/club info + first name, last name, email fields
2. Enter info → player created + magic link sent with `returnTo=/season/join?code=XYZ123`
3. Click magic link → authenticated → redirected back
4. Now Case B (new user won't be a club member yet)

### Unauthenticated form design

For unauthenticated users, always show all 3 fields (first name, last name, email). Server-side:
- If email exists → ignore name fields, send magic link
- If email is new → create player with provided name, send magic link
- Always show "check your email" (email enumeration protection)

### Error states

- Invalid code → "Code nicht gefunden"
- Season not active → "Saison nicht verfügbar"
- Open enrollment disabled → "Anmeldung geschlossen"
- Already enrolled → "Du bist bereits angemeldet" + link to rankings

## Admin UI — Share Link

New card in season management page (`admin/club/[id]/season/[seasonId]`):

**"Einladungslink" card** containing:
- Full URL displayed (read-only input, copyable)
- "Link kopieren" button → copy to clipboard
- "QR-Code anzeigen" button → opens `ResponsiveDialog` with QR code

Only visible when season status = active AND open_enrollment = true.

QR code generated client-side with `qrcode.react` library.

## Validation & Security

- Season must be `active` + `open_enrollment = true`
- Invite code validated server-side in every action
- `returnTo` validated: must start with `/`, block `//` and `:`
- Email enumeration protection: always "check your email"
- Transaction-based enrollment with `pg_advisory_xact_lock(seasonId)`
- IDOR check: enrollment action verifies club membership (or creates it)
- ON CONFLICT for idempotent club_members insert

## Invite Code Generation

Reuse same pattern as club invite codes:
- 6-char uppercase alphanumeric: `[A-Z0-9]{6}`
- Generated in `createSeason` DB function
- Collision handling: retry on unique constraint violation (extremely unlikely with 36^6 = 2.1B combinations)

## Dependencies

- `qrcode.react` — client-side QR code rendering (lightweight, no server dep)
- No other new dependencies

## i18n Keys

New translation keys under `seasonJoin` namespace:
- `title`, `subtitle`, `join`, `alreadyEnrolled`, `seasonUnavailable`, `enrollmentClosed`
- `codeNotFound`, `checkEmail`, `checkEmailDesc`
- `firstNameLabel`, `lastNameLabel`, `emailLabel`

New keys under `seasonManagement` namespace:
- `inviteLink`, `copyLink`, `linkCopied`, `showQrCode`, `qrCodeTitle`
