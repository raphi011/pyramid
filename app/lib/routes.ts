export const routes = {
  club: (slug: string) => `/club/${slug}`,

  rankings: (clubSlug: string, seasonSlug: string) =>
    `/club/${clubSlug}/season/${seasonSlug}/rankings`,

  admin: {
    club: (slug: string) => `/admin/club/${slug}`,
    settings: (slug: string) => `/admin/club/${slug}/settings`,
    members: (slug: string) => `/admin/club/${slug}/members`,
    announcements: (slug: string) => `/admin/club/${slug}/announcements`,
    seasonNew: (slug: string) => `/admin/club/${slug}/season/new`,
    season: (clubSlug: string, seasonSlug: string) =>
      `/admin/club/${clubSlug}/season/${seasonSlug}`,
    teams: (clubSlug: string, seasonSlug: string) =>
      `/admin/club/${clubSlug}/season/${seasonSlug}/teams`,
  },

  match: (id: number) => `/matches/${id}`,
  player: (id: number) => `/player/${id}`,
} as const;
