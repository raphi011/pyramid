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

const RESERVED_SEASON_SLUGS = new Set(["admin"]);

export function isReservedClubSlug(slug: string): boolean {
  return RESERVED_CLUB_SLUGS.has(slug);
}

export function isReservedSeasonSlug(slug: string): boolean {
  return RESERVED_SEASON_SLUGS.has(slug);
}
