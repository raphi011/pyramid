const RESERVED_CLUB_SLUGS = new Set([
  "feed",
  "admin",
  "settings",
  "profile",
  "login",
  "check-email",
  "join",
  "season",
  "onboarding",
  "api",
]);

// Must stay in sync with static folders under app/(main)/[slug]/admin/
const RESERVED_SEASON_SLUGS = new Set([
  "admin",
  "settings",
  "members",
  "announcements",
  "new-season",
]);

export function isReservedClubSlug(slug: string): boolean {
  return RESERVED_CLUB_SLUGS.has(slug);
}

export function isReservedSeasonSlug(slug: string): boolean {
  return RESERVED_SEASON_SLUGS.has(slug);
}
