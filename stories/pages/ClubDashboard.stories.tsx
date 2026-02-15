"use client";

import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { AdminDashboardView } from "@/app/(main)/admin/club/[id]/admin-dashboard-view";
import type {
  ClubStats,
  AdminSeasonSummary,
  OverdueMatch,
} from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/ClubDashboard",
  parameters: {
    layout: "fullscreen",
    a11y: {
      config: {
        rules: [
          { id: "heading-order", enabled: false },
          { id: "color-contrast", enabled: false },
        ],
      },
    },
  },
});

export default meta;

const stats: ClubStats = {
  playerCount: 24,
  activeSeasonCount: 3,
  openChallengeCount: 12,
};

const seasons: AdminSeasonSummary[] = [
  {
    id: 1,
    name: "Sommer 2026",
    playerCount: 24,
    openChallengeCount: 8,
    overdueMatchCount: 2,
  },
  {
    id: 2,
    name: "Doppel Sommer 2026",
    playerCount: 16,
    openChallengeCount: 4,
    overdueMatchCount: 0,
  },
];

const overdueMatches: OverdueMatch[] = [
  {
    id: 1,
    seasonId: 1,
    player1Name: "Felix Wagner",
    player2Name: "Paul Becker",
    daysSinceCreated: 14,
  },
  {
    id: 2,
    seasonId: 1,
    player1Name: "Marie Koch",
    player2Name: "Lukas Sch\u00e4fer",
    daysSinceCreated: 10,
  },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          stats={stats}
          seasons={seasons}
          overdueMatches={[]}
        />
      </PageWrapper>
    );
  },
});

export const WithOverdueMatches = meta.story({
  render: function OverdueStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          stats={stats}
          seasons={seasons}
          overdueMatches={overdueMatches}
        />
      </PageWrapper>
    );
  },
});

export const EmptyClub = meta.story({
  render: function EmptyStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          stats={{
            playerCount: 0,
            activeSeasonCount: 0,
            openChallengeCount: 0,
          }}
          seasons={[]}
          overdueMatches={[]}
        />
      </PageWrapper>
    );
  },
});
