export const routes = {
  club: (slug: string) => `/${slug}`,

  season: (clubSlug: string, seasonSlug: string) =>
    `/${clubSlug}/${seasonSlug}`,

  match: (clubSlug: string, seasonSlug: string, id: number) =>
    `/${clubSlug}/${seasonSlug}/matches/${id}`,

  player: (playerSlug: string) => `/profile/${playerSlug}`,

  admin: {
    club: (slug: string) => `/${slug}/admin`,
    settings: (slug: string) => `/${slug}/admin/settings`,
    members: (slug: string) => `/${slug}/admin/members`,
    announcements: (slug: string) => `/${slug}/admin/announcements`,
    newSeason: (slug: string) => `/${slug}/admin/new-season`,
    season: (clubSlug: string, seasonSlug: string) =>
      `/${clubSlug}/admin/${seasonSlug}`,
    teams: (clubSlug: string, seasonSlug: string) =>
      `/${clubSlug}/admin/${seasonSlug}/teams`,
  },
} as const;
